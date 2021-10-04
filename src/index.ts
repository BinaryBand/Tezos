import derivePath from './cryptography/derivation';
import blake2b from './cryptography/blake2b';
import * as operations from './tezos/operations';
import * as explorer from './tezos/chain-explorer';
import * as builder from './tezos/batch-builder';
import * as helpers from './tezos/helpers';
import * as base58 from './encoders/base58';
import * as bip39 from './encoders/bip39';

import PREFIX from './constants/prefix.json';
const defaultRPC: string = 'https://mainnet.smartpy.io';

type Curve = 'ed25519' | 'secp256k1' | 'nistp256';


/**
 * Returns the user's total balance in Mutez (1000000th of one Tezos).
 * @param address The string of characters that can send and receive cryptocurrency.
 * @param rpc URL that can communicate with the Tezos blockchain.
 * @returns User's balance in Mutez.
 */
export async function getBalance(address: string, rpc: string = defaultRPC): Promise<number> {
    const balance: string = (await explorer.getAccount(address, rpc)).balance;
    return parseInt(balance, 10);
}


/**
 * Returns the user's total balance in Mutez minus storage, gas, and fee estimates.
 * @param source The source address.
 * @param destination The recipient address.
 * @param rpc RPC URL.
 * @returns The user's balance in Mutez minus the fee estimate.
 */
export async function getSpendableBalance(source: string, publicKey: string, destination: string, rpc: string = defaultRPC): Promise<number> {
    try {
        const balance: number = await getBalance(source, rpc);
        const testTransaction: operations.Transaction = transaction(source, destination, balance);
        const batch: builder.OperationBatch = await buildOperationBatch([testTransaction], source, publicKey, 0, rpc);
        const totalOperationCost: number = parseInt((await batch.getEstimates()).total, 10);
        return Math.max(0, balance - totalOperationCost);
    }
    catch (_) {
        return 0;
    }
}


/**
 * Reveals the user's public key on the blockchain. This should be the first operation
 * performed on any new wallet.
 * @param source The user's Tezos address.
 * @param public_key The public key associated with this address.
 * @returns Tezos reveal operation.
 */
export function reveal(source: string, public_key: string): operations.Reveal {
    return operations.reveal({ source, public_key });
}


/**
 * Returns a Tezos delegation operation.
 * @param source The user's Tezos address.
 * @param delegate The delegate's address or undefined if undelegating.
 * @returns Tezos delegation operation.
 */
export function delegation(source: string, delegate?: string): operations.Delegation {
    return operations.delegation({ source, delegate });
}


/**
 * Sends Tezos between implicit Tezos accounts.
 * @param source The source address.
 * @param destination The recipient address.
 * @param amount The number of Tezos being sent in Mutez.
 * @param parameters Optional, additional information to include with transaction.
 * @returns Tezos transaction operation.
 */
export function transaction(source: string, destination: string, amount: string | number, parameters?: Record<string, any>): operations.Transaction {
    return operations.transaction({ source, destination, amount, parameters });
}


/**
 * Sends Tezos tokens between implicit Tezos accounts.
 * @param source The source address.
 * @param destination The recipient address.
 * @param amount The number of tokens being sent in its smallest unit.
 * @param token The Tezos contract this operation is taking place on.
 * @returns Tezos token transaction operation.
 */
export function tokenTransfer(source: string, destination: string, amount: string | number, token: string | FA20): operations.Transaction {
    let contract: string, tokenID: number | undefined;
    if (typeof token === 'string') contract = token;
    else {
        contract = token.address;
        tokenID = token.id;
    }

    return operations.tokenTransaction({ source, destination, amount, contract, tokenID });
}


export async function buildOperationBatch(contents: operations.Operation[], address: string, publicKey: string, tip: number = 100, rpc: string = defaultRPC): Promise<builder.OperationBatch> {
    return builder.buildOperationBatch(contents, address, publicKey, tip, rpc);
}


export async function send(batch: builder.OperationBatch, signature: string, rpc: string = defaultRPC): Promise<string> {
    const contents: operations.Operation[] = batch.getContents();
    const header: explorer.Header = await batch.getHeader();

    return helpers.validateOperation(contents, signature, rpc, header).then(async (): Promise<any> => {
        const forgedOperation: string = await batch.getForgedBytes();
        const sig: Uint8Array = base58.decode(signature!, 5);
        const finalOperation: string = forgedOperation + Buffer.from(sig).toString('hex');
        return helpers.injectOperation(finalOperation, rpc);
    });
}


interface Keypair {
    sk: Uint8Array;
    pk: Uint8Array;
};


interface FA20 {
    id: number;
    address: string;
};


export class Wallet {
    private curve: Curve;
    private rpc: string;
    private sk: Uint8Array;
    private pk: Uint8Array;
    private addr: Uint8Array;

    constructor(mnemonic: string, password: string, curve: Curve, rpc: string, path?: string) {
        this.curve = curve;
        this.rpc = rpc;

        // Generate raw keys from seed buffer.
        const seed: Uint8Array = bip39.mnemonicToSeed(mnemonic, password);
        const keys: Keypair = derivePath(seed, curve, path);

        this.sk = keys.sk;
        this.pk = keys.pk;
        this.addr = blake2b(keys.pk, 20);
    }

    public getSecretKey(): string {
        const prefix: Uint8Array = new Uint8Array(PREFIX[this.curve].sk);
        return base58.encode(this.sk, prefix);
    }

    public getPublicKey(): string {
        const prefix: Uint8Array = new Uint8Array(PREFIX[this.curve].pk);
        return base58.encode(this.pk, prefix);
    }

    public getAddress(): string {
        const prefix: Uint8Array = new Uint8Array(PREFIX[this.curve].tz);
        return base58.encode(this.addr, prefix);
    }

    public async getBalance(): Promise<number> {
        return getBalance(this.getAddress(), this.rpc);
    }

    public async getSpendableBalance(destination: string): Promise<number> {
        return getSpendableBalance(this.getAddress(), this.getPublicKey(), destination, this.rpc);
    }

    public ops = {
        reveal: (): operations.Reveal => {
            return reveal(this.getAddress(), this.getPublicKey());
        },

        delegation: (delegate?: string): operations.Delegation => {
            return delegation(this.getAddress(), delegate);
        },

        transaction: (destination: string, amount: string | number): operations.Transaction => {
            return transaction(this.getAddress(), destination, amount);
        },

        tokenTransfer: (destination: string, amount: string | number, token: string | FA20): operations.Transaction => {
            return tokenTransfer(this.getAddress(), destination, amount, token);
        }
    }

    public async buildOperationBatch(contents: operations.Operation[], tip: number = 100): Promise<builder.OperationBatch> {
        return buildOperationBatch(contents, this.getAddress(), this.getPublicKey(), tip, this.rpc);
    }

    public async signOperation(batch: string | builder.OperationBatch): Promise<string> {
        if (typeof batch !== 'string') batch = await batch.getForgedBytes();
        return helpers.signOperation(batch, this.sk, this.curve);
    }

    public async send(batch: builder.OperationBatch, signature: string): Promise<string> {
        return send(batch, signature, this.rpc);
    }
}


/**
 * Returns a group words that can be used to recover the user's crypto wallet.
 * @param mnemonicLength Number of words in mnemonic.
 * @param entropy Random data used to generate a sufficiently random mnemonic.
 * @returns Mnemonic seed phrase.
 */
 export function createMnemonic(mnemonicLength: number = 12, entropy: Uint8Array): string {
    if (mnemonicLength % 3 !== 0) mnemonicLength = 12;
    const byteSize: number = mnemonicLength + (mnemonicLength / 3);

    // Create new a new seed until a valid one is generate.
    let mnemonic: string;
    do {
        entropy = blake2b(entropy, byteSize);
        mnemonic = bip39.generateMnemonic(entropy);
    }
    while (!bip39.mnemonicToEntropy(mnemonic));

    return mnemonic;
}


// Returns mnemonic phrase's entropy or undefined if mnemonic is invalid. 
export const mnemonicToEntropy = bip39.mnemonicToEntropy;


interface Options {
    password?: string;
    curve?: Curve;
    rpc?: string;
    path?: string;
};


/**
 * Generate a private key, public key, and Tezos address from an existing mnemonic seed phrase.
 * @param mnemonic A group words that can be used to recover a crypto wallet.
 * @param options Set password | elliptic curve | derivation path | RPC URL.
 * @returns Tezos wallet class.
 */
export function importWallet(mnemonic: string, options: Options={}): Wallet {
    // Throw an error if mnemonic is invalid.
    bip39.mnemonicToEntropy(mnemonic);

    // Set default options if needed.
    const password: string = options.password || '';
    const curve: Curve = options.curve || 'ed25519';
    const rpc: string = options.rpc || defaultRPC;
    const path: string | undefined = options.path;

    return new Wallet(mnemonic, password, curve, rpc, path);
}
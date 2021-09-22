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


export const ops = {
    reveal: (source: string, public_key: string): operations.Reveal => {
        const args: operations.RevealArgs = { source, public_key };
        return operations.reveal(args);
    },

    delegate: (source: string, delegate?: string): operations.Delegation => {
        const args: operations.DelegationArgs = { source, delegate };
        return operations.delegation(args);
    },

    transaction: (source: string, destination: string, amount: string | number): operations.Transaction => {
        const args: operations.TransactionArgs = { source, destination, amount };
        return operations.transaction(args);
    },

    tokenTransfer: (source: string, destination: string, amount: string | number, token: string | FA20): operations.Transaction => {
        let contract: string, tokenID: number | undefined;
        if (typeof token === 'string') contract = token;
        else {
            contract = token.address;
            tokenID = token.id;
        }

        const args: operations.TokenTransactionArgs = { source, destination, amount, contract, tokenID };
        return operations.tokenTransaction(args);
    }
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

    public async getBalance(): Promise<string> {
        return (await explorer.getAccount(this.getAddress(), this.rpc)).balance;
    }

    public ops = {
        reveal: (): operations.Reveal => {
            return ops.reveal(this.getAddress(), this.getPublicKey());
        },

        delegate: (delegate?: string): operations.Delegation => {
            return ops.delegate(this.getAddress(), delegate);
        },

        transaction: (destination: string, amount: string | number): operations.Transaction => {
            return ops.transaction(this.getAddress(), destination, amount);
        },

        tokenTransfer: (destination: string, amount: string | number, token: string | FA20): operations.Transaction => {
            return ops.tokenTransfer(this.getAddress(), destination, amount, token);
        }
    }

    public async buildOperationBatch(contents: operations.Operation[], tip: number = 100): Promise<builder.OperationBatch> {
        return builder.buildOperationBatch(this, contents, this.rpc, tip);
    }

    public async forgeOperation(batch: builder.OperationBatch): Promise<string> {
        return batch.getForgedBytes();
    }

    public async signOperation(batch: string | builder.OperationBatch): Promise<string> {
        if (typeof batch !== 'string') batch = await batch.getForgedBytes();
        return helpers.signOperation(batch, this.sk, this.curve);
    }

    public async send(batch: builder.OperationBatch, signature?: string): Promise<string> {
        signature = signature || await batch.getSignature(this.getSecretKey());

        const contents: operations.Operation[] = batch.getContents();
        const header: explorer.Header = await batch.getHeader();

        return helpers.validateOperation(contents, signature, this.rpc, header).then(async (): Promise<string> => {
            const forgedOperation: string = await batch.getForgedBytes();
            const sig: Uint8Array = base58.decode(signature!, 5);
            const finalOperation: string = forgedOperation + Buffer.from(sig).toString('hex');
            return helpers.injectOperation(finalOperation, this.rpc);
        });
    }
}


/**
 * Returns a group words that can be used to recover a crypto wallet.
 * @param mnemonicLength Number of words in mnemonic.
 * @param entropy Random data used to generate a sufficiently random mnemonic.
 * @returns Mnemonic seed phrase.
 */
 export function createMnemonic(mnemonicLength: number=12, entropy: Uint8Array): string {
    const byteSize: number = mnemonicLength + (mnemonicLength / 3);

    // Create new a new seed until a valid one is generate.
    let mnemonic: string;
    do {
        entropy = blake2b(entropy, byteSize);
        mnemonic = bip39.generateMnemonic(entropy);
    }
    while (!bip39.mnemonicToEntropy);

    return mnemonic;
}


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
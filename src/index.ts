import { Buffer } from 'buffer';

import { confirmMnemonic, walletFromMnemonic, generateWallet } from './tezos/generate-keys';
import { estimateFee, getEstimates, buildOperation, tezosOperations } from './tezos/operations';
import helpers from './tezos/helpers';
import explorer from './tezos/rpc-explorer';
import base58 from './encoders/base58';

import FA12_SCHEMA from './constants/schemas/fa12';
import FA20_SCHEMA from './constants/schemas/fa20';

type keysType = {
    mnemonic: string,
    path: string,
    curve: string,
    privateKey: string,
    publicKey: string,
    address: string
};

type head = {
    chain_id: string,
    hash: string,
    protocol: string
};

type constants = {
    origination_size: string,
    cost_per_byte: string,
    minimal_block_delay: string
};

type account = {
    balance: string,
    counter: string,
    delegate?: string
};

type optionParams = {
    path?: string,
    curve?: string,
    password?: string
};

type FA20 = {
    id: number,
    address: string
};


function query(data: any, path: (string | number)[]): string | null {
    let current = data;
    path.forEach((target) => {
        if (!current) return null;
        current = current[target];
    });

    return current;
}


class XTZWallet {
    private rpc?: string;
    private keys?: keysType;
    private constants?: constants;

    constructor(rpc?: string) {
        this.rpc = rpc || 'https://mainnet.smartpy.io';
    }

    public getRPC() { return this.rpc; }
    public getKeys() { return this.keys; }

    public setRPC(rpc: string) { this.rpc = rpc; }

    public explorer = explorer;
    public helpers = helpers;
    public operations = tezosOperations;

    // Confirm that a mnemonic string is valid.
    public confirmMnemonic = confirmMnemonic;

    // Generate a private key, public key, and Tezos address from an existing mnemonic.
    public importWallet(mnemonic: string='', options: optionParams={}): keysType {
        this.keys = walletFromMnemonic(mnemonic, options);
        return this.keys!;
    };

    // Create a brand new private key, public key, Tezos address, and mnemonic.
    public createWallet(mnemonicLength: number=12, entropy: any, options: optionParams={}): keysType {
        this.keys = generateWallet(mnemonicLength, entropy, options);
        return this.keys!;
    };

    // Get the balance of any FA1.2 or FA2.0 token as per its smallest unit.
    public async getTokenBalances(contracts: (string | FA20)[], address: string) {
        // Any wallet address can be used to retrieve someone's token balance.
        // We'll use this one since we know it's activated.
        const conduit: string = 'tz1gfArv665EUkSg2ojMBzcbfwuPxAvqPvjo';
        const account: account = await explorer.getAccount(this.rpc!, conduit);
        this.constants = this.constants || await explorer.getConstants(this.rpc!);

        const builtOperations = contracts.map((contract: string | FA20, index: number) => {
            if (typeof(contract) === 'string') {
                const parameters = FA12_SCHEMA.getBalance(address);
                const operation = tezosOperations.transaction(conduit, contract, 0, parameters)
                return buildOperation(operation, account, this.constants!, index);
            }
            else {
                const parameters = FA20_SCHEMA.balance_of(address, contract.id);
                const operation = tezosOperations.transaction(conduit, contract.address, 0, parameters)
                return buildOperation(operation, account, this.constants!, index);
            }
        })

        return helpers.dryRun(builtOperations, this.rpc!).then((metadata: any) => {
            return metadata.map((content: {[name: string]: string}, index: number) => {
                const path: (number | string)[] = typeof(contracts[index]) === 'string' 
                    ? FA12_SCHEMA.balanceQuery : FA20_SCHEMA.balanceQuery;

                return query(content, path);
            });
        });
    };

    // Apply gas, storage, and fee estimates to operations.
    public async buildBatch(operations: {[name: string]: string}[]) {
        const address: string = this.keys!.address;
        const account: account = await explorer.getAccount(this.rpc!, address);
        const managerKey = await explorer.getManagerKey(this.rpc!, address);
        this.constants = this.constants || await explorer.getConstants(this.rpc!);

        // Create a reveal operation if necessary.
        if (managerKey === null) {
            const revealOperation = tezosOperations.reveal(address, this.keys!.publicKey);
            operations.push(revealOperation);
            operations.reverse();
        }

        return operations.map((operation: {[name: string]: string}, index: number) => (
            buildOperation(operation, account, this.constants!, index)
        ));
    }

    // Estimate the cost of inputted operations.
    public async applyEstimates(builtOperations: {[name: string]: string}[], tip: number=100) {
        const head: head = await explorer.getHeader(this.rpc!);
        this.constants = this.constants || await explorer.getConstants(this.rpc!);

        const metadata = await helpers.dryRun(builtOperations, this.rpc!, head, this.constants);
        const estimates = await getEstimates(metadata, this.constants);

        const finalOperations = builtOperations.map((operation: {[name: string]: string}, index: number) => (
            { ...operation, ...estimates[index] }
        ));

        return estimateFee(finalOperations, this.rpc!, head, tip);
    }

    // It's difficult to sign an operation without forging it first so we'll just do both in the
    // same function.
    public async forgeSign(batch: {[name: string]: string}[], privateKey?: string): Promise<any> {
        const head: head = await explorer.getHeader(this.rpc!);

        const forgedBytes: string = await helpers.forgeOperation(batch, this.rpc!, head);
        const signature: string = helpers.signOperation(forgedBytes, privateKey || this.keys!.privateKey);
        return { forgedBytes, signature };
    }

    // Submit our final operation to the blockchain.
    public send(batch: {[name: string]: string}[], forgedBytes: string, signature: string): Promise<string> {
        return new Promise((resolve: Function, reject: Function) => {
            helpers.validateOperation(batch, signature, this.rpc!).then(() => {
                const prefix: string = signature.slice(0, 5);
                const signatureBytes: Uint8Array = base58.decode(signature, prefix);
                const signedBytes: string = forgedBytes + Buffer.from(signatureBytes).toString('hex');
                helpers.injectOperation(signedBytes, this.rpc!).then((res) => resolve(res));
            }).catch((error) => reject(error));
        });
    }
}


export default XTZWallet;
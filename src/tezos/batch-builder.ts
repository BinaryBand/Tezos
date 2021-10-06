import { Buffer } from 'buffer';

import * as operations from './operations';
import * as explorer from './chain-explorer';
import * as helpers from './helpers';
import * as base58 from '../encoders/base58';
import { reveal } from '../index';

const COST_PER_BYTE: number = 250;
const ORIGINATION_SIZE: number = 257;
const GAS_BUFFER: number = 100;
const MINIMAL_FEE: number = 100;
const SIGNATURE_LENGTH: number = 64;
const MINIMAL_NANOTEZ_PER_BYTE: number = 1;
const MINIMAL_NANOTEZ_PER_GAS_UNIT: number = 0.1;
const defaultRPC: string = 'https://mainnet.smartpy.io';

type Curve = 'ed25519' | 'secp256k1' | 'nistp256';


interface Limits {
    balance_updates?: BalanceUpdate[];
    gas_limit: string;
    storage_limit: string;
};


interface BalanceUpdate {
    kind: string;
    contract: string;
    change: string;
    origin: string;
};


function summarizeBalanceUpdates(limits: Limits[]): Record<string, number> {
    const summary: Record<string, number> = {};

    limits.forEach((limit: Limits) => {
        limit.balance_updates?.forEach((update: BalanceUpdate): void => {
            summary[update.contract] = summary[update.contract] || 0;
            summary[update.contract] += parseInt(update.change);
        });
    });

    return summary;
}


interface ChainError {
    kind: string;
    id: string;
    contract: string;
};


interface OperationResult {
    status: 'applied' | 'failed';
    balance_updates?: BalanceUpdate[];
    consumed_gas?: string;
    consumed_milligas?: string;
    storage_limit?: string;
    allocated_destination_contract?: boolean;
    errors?: ChainError[];
};


interface OperationData {
    metadata: {
        operation_result: OperationResult;
        internal_operation_results?: any[];
    };
};


async function estimateLimits(batch: operations.Operation[], rpc: string = defaultRPC, header?: explorer.Header): Promise<Limits[]> {
    const metadata: OperationData[] = await helpers.runOperation(batch, rpc, header);

    return metadata.map((operation: OperationData): Limits => {
        const operationResult: OperationResult = operation.metadata.operation_result;

        const errors: ChainError[] | undefined = operationResult.errors;
        if (errors) throw(errors);

        const balance_updates: BalanceUpdate[] | undefined = operationResult.balance_updates;
        const gasLimit: number = parseInt(operationResult.consumed_gas!, 10);
        let storageLimit: number = parseInt(operationResult.storage_limit || '0', 10);
        storageLimit += operationResult.allocated_destination_contract ? ORIGINATION_SIZE : 0;

        return {
            balance_updates,
            gas_limit: gasLimit.toString(),
            storage_limit: storageLimit.toString()
        };
    });
}


export interface Estimates {
    fee: string;
    storageFee: string;
    total: string;
    balanceUpdates?: Record<string, number>;
};


async function calculateFees(operations: operations.Operation[], tip: number = 100, rpc: string = defaultRPC, header?: explorer.Header): Promise<Estimates> {
    header = header || await explorer.getHeader(rpc);

    // Calculate the operation size.
    const forgedBytes: string = await helpers.forgeOperation(operations, defaultRPC, header);
    const operationSize: number = Buffer.from(forgedBytes, 'hex').length + SIGNATURE_LENGTH;
    
    // Calculate the total gas and storage limit requirements for this operation.
    let totalGas: number = GAS_BUFFER, totalStorage: number = 0;
    operations.forEach((operation: operations.Operation): void => {
        totalGas += parseInt(operation.gas_limit, 10);
        totalStorage += parseInt(operation.storage_limit, 10);
    });

    // fees >= (minimal_fees + minimal_nanotez_per_byte * size + minimal_nanotez_per_gas_unit * gas)
    const fee: number = Math.max(MINIMAL_FEE, tip) + MINIMAL_NANOTEZ_PER_BYTE * operationSize + Math.ceil(MINIMAL_NANOTEZ_PER_GAS_UNIT * totalGas);
    const storageFee: number = COST_PER_BYTE * totalStorage;

    return {
        fee: fee.toString(),
        storageFee: storageFee.toString(),
        total: (fee + storageFee).toString()
    };
}


export async function buildOperationBatch(contents: operations.Operation[], address: string, publicKey?: string, tip: number = 100, rpc: string = defaultRPC): Promise<OperationBatch> {
    const chainResults: [explorer.Header, explorer.Account, string | undefined] = await Promise.all([
        explorer.getHeader(rpc),
        explorer.getAccount(address, rpc),
        explorer.getManagerKey(address, rpc)
    ]);

    // Collect requisite blockchain data.
    const header: explorer.Header = chainResults[0];
    const account: explorer.Account = chainResults[1];
    const managerKey: string | undefined = chainResults[2];

    // Add a reveal operation if this is the first operation from this wallet.
    if (!managerKey) contents = [reveal(address, publicKey!), ...contents];

    // Fill in counter value for each operation in batch.
    const counter: number = parseInt(account.counter!);
    contents.forEach((operation: operations.Operation, index: number) => {
        operation.counter = (counter + index + 1).toString();
    });

    // Retrieve gas and storage limits for this operation batch.
    const limits: Limits[] = await estimateLimits(contents, rpc, header);
    contents = contents.map((operation: operations.Operation, index: number): operations.Operation => {
        const limit: Limits = limits[index];
        return { ...operation, gas_limit: limit.gas_limit, storage_limit: limit.storage_limit };
    });

    // Calculate fee and add it to the first operation in the batch.
    const estimates: Estimates = await calculateFees(contents, tip, rpc, header);
    contents[0].fee = estimates.fee;

    // Add up each balance change from each operation in the batch.
    const balanceUpdates: Record<string, number> = summarizeBalanceUpdates(limits);
    estimates.balanceUpdates = balanceUpdates;

    return new OperationBatch(contents, header, estimates);
}


export class OperationBatch {
    private contents: operations.Operation[];
    private header: explorer.Header;
    private estimates: Estimates;
    private forgedBytes?: string;

    constructor(contents: operations.Operation[], header: explorer.Header, estimates: Estimates) {
        this.contents = contents;
        this.header = header;
        this.estimates = estimates;
    }

    public getContents(): operations.Operation[] { return this.contents; }
    public getHeader(): explorer.Header { return this.header; }
    public getEstimates(): Estimates { return this.estimates; }

    private async forgeOperation(rpc: string = defaultRPC): Promise<string> {
        if (this.forgedBytes) return this.forgedBytes;
        else return helpers.forgeOperation(this.contents, rpc, this.header);
    }

    private async signOperation(sk: Uint8Array, curve: Curve): Promise<string> {
        const forgedBytes: string = await this.forgeOperation();
        return helpers.signOperation(forgedBytes, sk, curve);
    }

    public async getForgedBytes(): Promise<string> {
        return this.forgedBytes || this.forgeOperation();
    }

    public async getSignature(secretKey: string): Promise<string> {
        let curve: Curve;
        switch (secretKey.slice(0, 4)) {
            case 'edsk':
                curve = 'ed25519';
                break;
            case 'spsk':
                curve = 'secp256k1';
                break;
            case 'p2sk':
                curve = 'nistp256';
                break;
            default:
                throw('Invalid secret key.');
        }

        const sk: Uint8Array = base58.decode(secretKey, 4);
        return this.signOperation(sk, curve);
    }
}
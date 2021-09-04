import { Buffer } from 'buffer';

import helpers from './helpers';

import SCHEMAS from '../constants/schemas/operations';
import FA12_SCHEMA from '../constants/schemas/fa12';
import FA20_SCHEMA from '../constants/schemas/fa20';

const MINIMAL_FEE = 100;
const MINIMAL_NANOTEZ_PER_BYTE = 1;
const MINIMAL_NANOTEZ_PER_GAS_UNIT = 0.1;

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


export async function estimateFee(operations: {[name: string]: string}[], rpc: string, head: head, tip: number) {
    const forgedBytes: string = await helpers.forgeOperation(operations, rpc, head);

    const operationSize: number = Buffer.from(forgedBytes, 'hex').length;
    let totalGas = 0;
    operations.forEach((operation) => {
        totalGas += parseInt(operation.gas_limit, 10);
    });

    const fee = MINIMAL_FEE + totalGas + MINIMAL_NANOTEZ_PER_BYTE * operationSize + Math.ceil(MINIMAL_NANOTEZ_PER_GAS_UNIT * totalGas);
    operations[0] = { ...operations[0], fee: fee.toString() }

    return operations;
}


export function getEstimates(metadata: any, constants: constants) {
    const GAS_BUFFER: number = 100;

    return metadata.map((operation: {[name: string]: { operation_result: any }}) => {
        const operationResult = operation.metadata.operation_result;

        const errors = operationResult.errors;
        if (errors) throw(new Error(JSON.stringify(errors)));

        const gasLimit: number = parseInt(operationResult.consumed_gas, 10) + GAS_BUFFER;
        let storageLimit: number = parseInt(operationResult.storage_limit || 0, 10);
        storageLimit += operationResult.allocated_destination_contract ?
            parseInt(constants.origination_size, 10) : 0;

        return {
            gas_limit: gasLimit.toString(),
            storage_limit: storageLimit.toString()
        };
    });
}


export function buildOperation(operation: {[name: string]: string}, account: account, constants: constants, index: number) {
    const metadata = { account, constants, index };

    const finalOperation: {[name: string]: string} = {};
    const schema: any = SCHEMAS[operation.kind];

    Object.keys(schema).forEach((key: string) => {
        if (key in operation) {
            const value: string = operation[key];
            finalOperation[key] = value;
        }

        else {
            const schemaValue = schema[key];

            switch (typeof (schemaValue)) {
                case 'function':
                    const defaultValue = schemaValue(metadata);
                    finalOperation[key] = defaultValue;
                    break;
                case 'string':
                    finalOperation[key] = schemaValue;
                    break;
                default:
                    return new Error(`${key} value is undefined or invalid.`);
            }
        }
    });

    return finalOperation;
}


export const tezosOperations = {
    // Reveals the user's public key to the blockchain. This should be the first operation
    // performed on any new wallet.
    reveal: (source: string, publicKey: string) => {
        return {
            kind: 'reveal',
            source,
            public_key: publicKey
        };
    },

    // Sends Tezos from the user's address to another wallet or contract.
    transaction(source: string, destination: string, mutezAmount: number, parameters?: any) {
        return {
            kind: 'transaction',
            source,
            destination,
            amount: mutezAmount.toString(),
            parameters
        };
    },

    // Sends Tezos based tokens from the user's address to another wallet or contract.
    tokenTransaction(source: string, destination: string, contract: string, amount: number, tokenID: number) {
        const parameters: {[name: string]: any} = !tokenID
            ? FA12_SCHEMA.transfer(source, destination, amount)
            : FA20_SCHEMA.transfer(source, destination, tokenID, amount);
        
        return {
            kind: 'transaction',
            source,
            destination: contract,
            amount: '0',
            parameters
        };
    },

    delegation(source: string, delegator?: string) {
        return {
            kind: 'delegation',
            source,
            delegate: delegator
        };
    }
}
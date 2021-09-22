import FA12_SCHEMA from '../constants/schemas/fa12';
import FA20_SCHEMA from '../constants/schemas/fa20';

export type Operation = Reveal | Delegation | Transaction;


const DEFAULTS = {
    fee: '0',
    counter: '0',
    gas_limit: '1040000',
    storage_limit: '60000'
};


export interface RevealArgs {
    source: string;
    fee?: string | number;
    counter?: string | number;
    gas_limit?: string | number;
    storage_limit?: string | number;
    public_key: string;
};


export interface Reveal {
    kind: 'reveal';
    source: string;
    fee: string;
    counter: string;
    gas_limit: string;
    storage_limit: string;
    public_key: string;
};


/**
 * Reveals the user's public key to the blockchain. This should be the first operation
 * performed on any new wallet.
 * @param source The user's public Tezos address.
 * @param publicKey 
 * @returns 
 */
export function reveal(args: RevealArgs): Reveal {
    return {
        kind: 'reveal',
        source: args.source,
        fee: args.fee?.toString() || DEFAULTS.fee,
        counter: args.counter?.toString() || DEFAULTS.counter,
        gas_limit: args.gas_limit?.toString() || DEFAULTS.gas_limit,
        storage_limit: args.storage_limit?.toString() || DEFAULTS.storage_limit,
        public_key: args.public_key
    };
}


export interface DelegationArgs {
    source: string;
    fee?: string | number;
    counter?: string | number;
    gas_limit?: string | number;
    storage_limit?: string | number;
    delegate?: string;
}


export interface Delegation {
    kind: 'delegation';
    source: string;
    fee: string;
    counter: string;
    gas_limit: string;
    storage_limit: string;
    delegate?: string;
}


/**
 * 
 * @param source 
 * @param delegate 
 * @returns 
 */
export function delegation(args: DelegationArgs): Delegation {
    return {
        kind: 'delegation',
        source: args.source,
        fee: args.fee?.toString() || DEFAULTS.fee,
        counter: args.counter?.toString() || DEFAULTS.counter,
        gas_limit: args.gas_limit?.toString() || DEFAULTS.gas_limit,
        storage_limit: args.storage_limit?.toString() || DEFAULTS.storage_limit,
        delegate: args.delegate
    };
}


export interface TransactionArgs {
    source: string;
    fee?: string | number;
    counter?: string | number;
    gas_limit?: string | number;
    storage_limit?: string | number;
    amount: string | number;
    destination: string;
    parameters?: Record<string, any>;
};


export interface Transaction {
    kind: 'transaction';
    source: string;
    fee: string;
    counter: string;
    gas_limit: string;
    storage_limit: string;
    amount: string;
    destination: string;
    parameters?: Record<string, any>;
};


/**
 * Sends Tezos from the user's address to another wallet or contract.
 * @param source 
 * @param destination 
 * @param mutezAmount 
 * @param parameters 
 * @returns 
 */
export function transaction(args: TransactionArgs): Transaction {
    return {
        kind: 'transaction',
        source: args.source,
        fee: args.fee?.toString() || DEFAULTS.fee,
        counter: args.counter?.toString() || DEFAULTS.counter,
        gas_limit: args.gas_limit?.toString() || DEFAULTS.gas_limit,
        storage_limit: args.storage_limit?.toString() || DEFAULTS.storage_limit,
        amount: args.amount.toString(),
        destination: args.destination,
        parameters: args.parameters
    };
}


export interface TokenTransactionArgs {
    source: string;
    fee?: string | number;
    counter?: string | number;
    gas_limit?: string | number;
    storage_limit?: string | number;
    amount: string | number;
    destination: string;
    contract: string;
    tokenID?: string | number;
};


/**
 * Sends Tezos based tokens from the user's address to another wallet or contract.
 * @param source 
 * @param recipient 
 * @param contract 
 * @param amount 
 * @param tokenID 
 * @returns 
 */
export function tokenTransaction(args: TokenTransactionArgs): Transaction {
    const parameters: Record<string, any> = !args.tokenID
        ? FA12_SCHEMA.transfer(args.source, args.destination, args.amount)
        : FA20_SCHEMA.transfer(args.source, args.destination, args.tokenID, args.amount);
    
    return {
        kind: 'transaction',
        source: args.source,
        fee: args.fee?.toString() || DEFAULTS.fee,
        counter: args.counter?.toString() || DEFAULTS.counter,
        gas_limit: args.gas_limit?.toString() || DEFAULTS.gas_limit,
        storage_limit: args.storage_limit?.toString() || DEFAULTS.storage_limit,
        amount: args.amount.toString(),
        destination: args.contract,
        parameters: parameters
    };
}
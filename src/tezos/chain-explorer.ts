import axios from 'axios';

const defaultRPC: string = 'https://mainnet.smartpy.io';


export interface Header {
    protocol: string;
    chain_id: string;
    hash: string;
    header: any;
    metadata: any;
    operations: any;
};


export function getHeader(rpc: string = defaultRPC): Promise<Header> {
    const url: string = rpc + '/chains/main/blocks/head';
    return axios.get(url).then((res): Header => res.data);
}


export interface Constants {
    origination_size: number;
    cost_per_byte: string;
    minimal_block_delay: string;
    hard_gas_limit_per_operation: string;
    hard_storage_limit_per_operation: string;
};


export function getConstants(rpc: string = defaultRPC): Promise<Constants> {
    const url: string = rpc + '/chains/main/blocks/head/context/constants';
    return axios.get(url).then((res): Constants => res.data);
}


export interface Account {
    balance: string;
    delegate?: string;
    script?: any;
    counter?: string;
};


export function getAccount(address: string, rpc: string = defaultRPC): Promise<Account> {
    const url: string = rpc + '/chains/main/blocks/head/context/contracts/' + address;
    return axios.get(url).then((res): Account => res.data);
}


export function getManagerKey(address: string, rpc: string = defaultRPC): Promise<string | undefined> {
    const url: string = rpc + '/chains/main/blocks/head/context/contracts/' + address + '/manager_key';
    return axios.get(url).then((res): string | undefined => res.data);
}
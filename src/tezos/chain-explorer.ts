import axios from 'axios';
import path from 'path';

const defaultRPC: string = 'https://mainnet.smartpy.io';


export interface Header {
    chain_id: string;
    hash: string;
    protocol: string;
};


export function getHeader(rpc: string = defaultRPC): Promise<Header> {
    const url: string = new URL('chains/main/blocks/head', rpc).href;
    
    return axios.get(url).then((res): Header => {
        return res.data;
    })
    .catch((res) => {
        if (res.response && res.response.data) throw(res.response.data);
        else throw(res);
    });
}


export interface Constants {
    origination_size: string;
    cost_per_byte: string;
    minimal_block_delay: string;
    hard_gas_limit_per_operation: string;
    hard_storage_limit_per_operation: string;
};


export function getConstants(rpc: string = defaultRPC): Promise<Constants> {
    const url: string = new URL('chains/main/blocks/head/context/constants', rpc).href;

    return axios.get(url).then((res): Constants => {
        return res.data;
    })
    .catch((res) => {
        if (res.response && res.response.data) throw(res.response.data);
        else throw(res);
    });
}


export interface Account {
    balance: string;
    counter: string;
    delegate?: string;
};


export function getAccount(address: string, rpc: string = defaultRPC): Promise<Account> {
    const urlPath: string = path.join('chains/main/blocks/head/context/contracts', address);
    const url: string = new URL(urlPath, rpc).href;

    return axios.get(url).then((res): Account => {
        return res.data;
    })
    .catch((res) => {
        if (res.response && res.response.data) throw(res.response.data);
        else throw(res);
    });
}


export function getManagerKey(address: string, rpc: string = defaultRPC): Promise<string | undefined> {
    const urlPath: string = path.join('chains/main/blocks/head/context/contracts', address, 'manager_key');
    const url: string = new URL(urlPath, rpc).href;

    return axios.get(url).then((res): string | undefined => {
        return res.data || undefined;
    })
    .catch((res) => {
        if (res.response && res.response.data) throw(res.response.data);
        else throw(res);
    });
}


export function getScript(contract: string, rpc: string = defaultRPC) {
    const urlPath: string = path.join('chains/main/blocks/head/context/contracts', contract, 'script');
    const url: string = new URL(urlPath, rpc).href;

    return axios.get(url).then((res) => {
        return res.data;
    })
    .catch((res) => {
        if (res.response && res.response.data) throw(res.response.data);
        else throw(res);
    });
}
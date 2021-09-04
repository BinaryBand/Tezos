import axios from 'axios';

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


function getHeader(rpc: string): Promise<head> {
    return axios.get(`${rpc}/chains/main/blocks/head`)
        .then((res) => res.data)
        .catch((res) => {
            if (res.response && res.response.data) throw(new Error(res.response.data));
            else throw(new Error(res));
        });
}


function getConstants(rpc: string): Promise<constants> {
    return axios.get(`${rpc}/chains/main/blocks/head/context/constants`)
        .then((res) => res.data)
        .catch((res) => {
            if (res.response && res.response.data) throw(new Error(res.response.data));
            else throw(new Error(res));
        });
}


function getAccount(rpc: string, address: string): Promise<account> {
    return axios.get(`${rpc}/chains/main/blocks/head/context/contracts/${address}`)
        .then((res) => res.data)
        .catch((res) => {
            if (res.response && res.response.data) throw(new Error(res.response.data));
            else throw(new Error(res));
        });
}


function getManagerKey(rpc: string, address: string) {
    return axios.get(`${rpc}/chains/main/blocks/head/context/contracts/${address}/manager_key`)
        .then((res) => res.data)
        .catch((res) => {
            if (res.response && res.response.data) return new Error(res.response.data);
            else return new Error(res);
        });
}


function getScript(rpc: string, contract: string) {
    return axios.get(`${rpc}/chains/main/blocks/head/context/contracts/${contract}/script`)
        .then((res) => res.data)
        .catch((res) => {
            if (res.response && res.response.data) return new Error(res.response.data);
            else return new Error(res);
        });
}


function getBigMap(rpc: string, mapID: string | number, expression: string = '') {
    return axios.get(`${rpc}/chains/main/blocks/head/context/big_maps/${mapID}/${expression}`)
        .then((res) => res.data)
        .catch((res) => {
            if (res.response && res.response.data) return new Error(res.response.data);
            else return new Error(res);
        });
}


function getEntryPoints(rpc: string, address: string) {
    return axios.get(`${rpc}/chains/main/blocks/head/context/contracts/${address}/entrypoints`)
        .then((res) => res.data.entrypoints)
        .catch((res) => {
            if (res.response && res.response.data) return new Error(res.response.data);
            else return new Error(res);
        });
}


export default {
    getHeader,
    getConstants,
    getAccount,
    getManagerKey,
    getScript,
    getBigMap,
    getEntryPoints
};
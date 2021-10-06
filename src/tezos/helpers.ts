import axios from 'axios';
import { Buffer } from 'buffer';

import * as operations from './operations';
import * as explorer from './chain-explorer';
import * as base58 from '../encoders/base58';
import blake2b from '../cryptography/blake2b';
import * as ed25519 from '../cryptography/ed25519';
import { secp256k1, nistp256 } from '../cryptography/elliptic-curves';

import PREFIX from '../constants/prefix.json';
const defaultRPC: string = 'https://mainnet.smartpy.io';
const axiosConfig = { headers: { 'Content-type': 'application/json' }};
const SIG: string = 'edsigtkpiSSschcaCt9pUVrpNPf7TTcgvgDEDD6NCEHMy8NNQJCGnMfLZzYoQj74yLjo9wx6MPVV29CvVzgi7qEcEUok3k7AuMg';

type Curve = 'ed25519' | 'secp256k1' | 'nistp256';


interface BalanceUpdate {
    kind: string;
    contract: string;
    change: string;
    origin: string;
};


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


export async function runOperation(batch: operations.Operation[], rpc: string = defaultRPC, header?: explorer.Header): Promise<OperationData[]> {
    header = header || await explorer.getHeader();

    const data = {
        chain_id: header.chain_id,
        operation: {
            branch: header.hash,
            contents: batch,
            signature: SIG
        }
    };

    const url: string = new URL('chains/main/blocks/head/helpers/scripts/run_operation', rpc).href;
    return axios.post(url, JSON.stringify(data), axiosConfig).then((res) => res.data.contents);
}


export async function forgeOperation(contents: operations.Operation[], rpc: string = defaultRPC, header?: explorer.Header): Promise<string> {
    header = header || await explorer.getHeader();

    const data = {
        branch: header.hash,
        contents
    };

    const url: string = new URL('chains/main/blocks/head/helpers/forge/operations', rpc).href;
    return axios.post(url, JSON.stringify(data), axiosConfig).then((res) => res.data);
}


export async function validateOperation(contents: operations.Operation[], signature: string, rpc: string = defaultRPC, header?: explorer.Header) {
    header = header || await explorer.getHeader();

    const data = [{
        protocol: header.protocol,
        branch: header.hash,
        contents,
        signature
    }];

    const url: string = new URL('chains/main/blocks/head/helpers/preapply/operations', rpc).href; 
    return axios.post(url, JSON.stringify(data), axiosConfig).then((res) => res.data);
}


export function injectOperation(signedBytes: string, rpc: string = defaultRPC): Promise<string> {
    const url: string = new URL('injection/operation', rpc).href; 
    return axios.post(url, JSON.stringify(signedBytes), axiosConfig).then((res) => res.data);
}


export function signOperation(forgedOperation: string, sk: Uint8Array, curve: Curve = 'ed25519'): string {
    const message: Uint8Array = Buffer.from(forgedOperation, 'hex');
    const watermark: Uint8Array = new Uint8Array([0x03]);
    const payload: Uint8Array = Buffer.concat([watermark, message]);
    const bytesHash: Uint8Array = blake2b(payload, 32);

    const prefix: Uint8Array = new Uint8Array(PREFIX[curve].sig);

    let signatureBytes: Uint8Array;
    switch (curve) {
        case 'ed25519':
            signatureBytes = ed25519.signDetached(bytesHash, sk);
            return base58.encode(signatureBytes, prefix);
        case 'secp256k1':
            signatureBytes = secp256k1.signDetached(bytesHash, sk);
            return base58.encode(signatureBytes, prefix);
        case 'nistp256':
            signatureBytes = nistp256.signDetached(bytesHash, sk);
            return base58.encode(signatureBytes, prefix);
        default:
            throw('Invalid elliptic curve.');
    }
}
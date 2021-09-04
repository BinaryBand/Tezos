import axios from 'axios';
import { Buffer } from 'buffer';

import explorer from './rpc-explorer';
import base58 from '../encoders/base58';

import blake2b from '../cryptography/blake2b';
import ed25519 from '../cryptography/ed25519';
import { secp256k1, nistp256 } from '../cryptography/ellipticCurves';

import PREFIX from '../constants/prefix.json';
const SIG = 'edsigtkpiSSschcaCt9pUVrpNPf7TTcgvgDEDD6NCEHMy8NNQJCGnMfLZzYoQj74yLjo9wx6MPVV29CvVzgi7qEcEUok3k7AuMg';

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


function dryRun(contents: {[name: string]: string}[], rpc: string, head?: head, constants?: constants) {
    return new Promise(async (resolve, reject) => {
        head = head || await explorer.getHeader(rpc);
        constants = constants || await explorer.getConstants(rpc);

        const data = {
            chain_id: head.chain_id,
            operation: {
                branch: head.hash,
                contents,
                signature: SIG
            }
        };

        // Run operation to estimate gas fees and storage limit.
        return axios.post(`${rpc}/chains/main/blocks/head/helpers/scripts/run_operation`, JSON.stringify(data),
            { headers: { 'Content-type': 'application/json' }}
        )
        .then((res) => resolve(res.data.contents))
        .catch((res) => {
            if (res.response && res.response.data) reject(new Error(res.response.data));
            else reject(new Error(res));
        });
    });
}


function forgeOperation(contents: {[name: string]: string}[], rpc: string, head?: head): Promise<string> {
    return new Promise(async (resolve, reject) => {
        head = head || await explorer.getHeader(rpc);

        const operation = {
            branch: head.hash,
            contents
        };

        return axios.post(`${rpc}/chains/main/blocks/head/helpers/forge/operations`,
            JSON.stringify(operation), { headers: { 'Content-type': 'application/json' }}
        )
        .then((res) => resolve(res.data))
        .catch((res) => {
            if (res.response && res.response.data) reject(new Error(res.response.data));
            else reject(new Error(res));
        });
    });
}


function signOperation(forgedBytes: string, privateKey: `${'edsk' | 'spsk' | 'p2sk'}${string}`) {
    const out: {[name: string]: any} = {
        edsk: {
            prefix: PREFIX.ed25519.sig,
            signDetached: ed25519.signDetached
        },
        spsk: {
            prefix: PREFIX.secp256k1.sig,
            signDetached: secp256k1.signDetached
        },
        p2sk: {
            prefix: PREFIX.nistp256.sig,
            signDetached: nistp256.signDetached
        }
    };

    const sk: Uint8Array = base58.decode(privateKey).slice(4);

    const payload: Uint8Array = Buffer.from(forgedBytes, 'hex');
    const watermark: Uint8Array = Buffer.from([0x03]);
    const bb: Uint8Array = Buffer.concat([watermark, payload]);
    const bytesHash: Uint8Array = blake2b(bb, 32);

    const prefix: string = privateKey.slice(0, 4);
    const curve: { prefix: number[], signDetached: Function } = out[prefix];

    const sigBytes: Uint8Array = curve.signDetached(bytesHash, sk);
    return base58.encode(sigBytes, curve.prefix);
}


function validateOperation(contents: {[name: string]: string}[], signature: string, rpc: string='https://mainnet.smartpy.io', head?: head) {
    return new Promise(async (resolve, reject) => {
        head = head || await explorer.getHeader(rpc);

        const operation = [{
            protocol: head.protocol,
            branch: head.hash,
            contents,
            signature
        }];

        axios.post(`${rpc}/chains/main/blocks/head/helpers/preapply/operations`,
            JSON.stringify(operation), { headers: { 'Content-type': 'application/json' }}
        )
        .then((res) => {
            resolve(res.data);
        })
        .catch((res) => {
            if (res.response && res.response.data) reject(new Error(res.response.data));
            else reject(new Error(res));
        });
    });
}


function injectOperation(signedBytes: string, rpc: string): Promise<string> {
    return axios.post(`${rpc}/injection/operation`, JSON.stringify(signedBytes),
        { headers: { 'Content-type': 'application/json' }}
    )
    .then((res) => res.data)
    .catch((res) => {
        if (res.response && res.response.data) throw(new Error(res.response.data));
        else throw(Error(res));
    });
}


function packData(payload: { data: any, type: any }, rpc: string) {
    // let data = { data: { int: '0' }, type: { prim: 'nat' }};
    // let data = { data: { string: 'tz1RAu5s9iCimy8bCK6GbmLxLyv5Nf7CZ8T1' }, type: { prim: 'address' }};
    // let data = {
    //     data: [
    //         { string: 'tz1RAu5s9iCimy8bCK6GbmLxLyv5Nf7CZ8T1' },
    //         { int: '36787' }
    //     ],
    //     type: {
    //         prim: 'pair',
    //         args: [
    //             { prim: 'address' },
    //             { prim: 'nat' }
    //         ]
    //     }
    // };

    return axios.post(`${rpc}/chains/main/blocks/head/helpers/scripts/pack_data`,
        JSON.stringify(payload), { headers: { 'Content-type': 'application/json' }}
    )
    .then((res) => {
        const packed: string = res.data.packed;
        const hash: Uint8Array = blake2b(Buffer.from(packed, 'hex'), 32);
        const prefix: number[] = PREFIX.expr;
        return base58.encode(hash, prefix);
    })
    .catch((res) => {
        if (res.response && res.response.data) throw(new Error(res.response.data));
        else throw(Error(res));
    });
}


export default {
    dryRun,
    forgeOperation,
    signOperation,
    validateOperation,
    injectOperation,
    packData
};
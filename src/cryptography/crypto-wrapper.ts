import { PBKDF2, HmacSHA512, HmacSHA256, HmacRIPEMD160, SHA512, SHA256, RIPEMD160, algo, lib, enc } from 'crypto-js';
import { Buffer } from 'buffer';


type algoMap = 'sha256' | 'sha512' | 'ripemd'; 


type HasherFunction = (message: lib.WordArray) => lib.WordArray;
const hashes: Record<algoMap, HasherFunction> = {
    sha256: SHA256,
    sha512: SHA512,
    ripemd: RIPEMD160
};


export function createHash(payload: any, algorithm: algoMap, keySize?: number): Uint8Array {
    const hasher: HasherFunction = hashes[algorithm];
    const seedArray: lib.WordArray = lib.WordArray.create(payload.subarray(0, keySize));

    const hash: lib.WordArray = hasher(seedArray);
    const buffer: Buffer = Buffer.from(hash.toString(enc.Hex), 'hex');
    return new Uint8Array(buffer);
}


type HmacFunction = (message: lib.WordArray, key: lib.WordArray) => lib.WordArray;
const hmacs: Record<algoMap, HmacFunction> = {
    sha256: HmacSHA256,
    sha512: HmacSHA512,
    ripemd: HmacRIPEMD160
};


export function cryptoHmac(payload: any, key: any, algorithm: algoMap): Uint8Array {
    const hmac: HmacFunction = hmacs[algorithm];
    const seedArray: lib.WordArray = lib.WordArray.create(payload);
    const keyArray: lib.WordArray = lib.WordArray.create(key);

    const hash: lib.WordArray = hmac(seedArray, keyArray);
    const buffer: Buffer = Buffer.from(hash.toString(enc.Hex), 'hex');
    return new Uint8Array(buffer);
}


interface Options {
    salt?: string;
    keySize?: number;
    iterations?: number;
};


export function pbkdf2(payload: string, password: string = '', options: Options = {}): Uint8Array {
    const salt: string = options.salt || 'mnemonic';
    const keySize: number = options.keySize || 16;
    const iterations: number = options.iterations || 2048;

    const hash: lib.WordArray = PBKDF2(payload, salt + password, {
        keySize,
        hasher: algo.SHA512,
        iterations
    });

    const buffer: Buffer = Buffer.from(hash.toString(enc.Hex), 'hex');
    return new Uint8Array(buffer);
}
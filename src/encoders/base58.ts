import * as crypto from '../cryptography/crypto-wrapper';
import { Buffer } from 'buffer';
import base58 from 'bs58';


export function encode(body: Uint8Array, prefix?: Uint8Array, suffix?: Uint8Array): string {
    prefix = prefix || new Uint8Array([]);
    suffix = suffix || new Uint8Array([]);

    const payload: Uint8Array = Buffer.concat([prefix, body, suffix]);

    const hash: Uint8Array = crypto.createHash(payload, 'sha256');
    const checksum: Uint8Array = crypto.createHash(hash, 'sha256');

    return base58.encode(Buffer.concat([
        payload,
        checksum
    ]).slice(0, payload.length + 4));
}


export function decode(body: string, prefixLength: number = 0, suffixLength: number = 0): Uint8Array {
    const buffer: Uint8Array = base58.decode(body);
    return buffer.slice(prefixLength, -(4 + suffixLength));
}
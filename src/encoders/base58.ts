import { SHA256, lib, enc } from 'crypto-js';
import { Buffer } from 'buffer';
import base58 from 'bs58';


export default {
    encode: (body: any, prefix?: any, suffix?: any): any => {
        body = Buffer.from(body);
        prefix = prefix ? Buffer.from(prefix) : Buffer.from([]);
        suffix = suffix ? Buffer.from(suffix) : Buffer.from([]);

        const payload: any = Buffer.concat([prefix, body, suffix]);

        const hash = SHA256(lib.WordArray.create(payload));
        const buffer: any = Buffer.from(hash.toString(enc.Hex), 'hex');

        const hash2 = SHA256(lib.WordArray.create(buffer));
        const checksum = Buffer.from(hash2.toString(enc.Hex), 'hex');

        return base58.encode(Buffer.concat([
            payload,
            checksum
        ]).slice(0, payload.length + 4));
    },

    decode: (body: any, prefix: any = []): Uint8Array => {
        return base58.decode(body).slice(prefix.length, -4);
    }
};
import { Buffer } from 'buffer';
import { HmacSHA512, lib, enc } from 'crypto-js';

import ed25519 from './ed25519';
import { secp256k1, nistp256 } from './ellipticCurves';


const SCHEMAS: any = {
    ed25519: {
        secret: 'ed25519 seed',
        hardenedOffset: 0x80000000,
        keyPair: ed25519.publicKeyCreate
    },

    secp256k1: {
        secret: 'Bitcoin seed',
        hardenedOffset: 0x80000000,
        tweak: secp256k1.privateKeyTweakAdd,
        keyPair: secp256k1.publicKeyCreate
    },

    nistp256: {
        secret: 'nistp256 seed',
        hardenedOffset: 0x80000000,
        tweak: nistp256.privateKeyTweakAdd,
        keyPair: nistp256.publicKeyCreate
    }
};


function cryptoHmac(m: any, n: any) {
    let seedArray = lib.WordArray.create(m);
    let secretArray = lib.WordArray.create(n);
    let hash = HmacSHA512(seedArray, secretArray);
    return Buffer.from(hash.toString(enc.Hex), 'hex');
}


const derivePath = (seed: any, schema: any, path: any) => {
    let masterSecret = cryptoHmac(seed, Buffer.from(schema.secret, 'utf-8'));

    let sk = masterSecret.slice(0, 32);
    let pk: any = null;
    let chainCode = masterSecret.slice(32);

    path.split('/').slice(1).forEach((segment: any) => {
        let hardened = (segment.length > 1) && (segment[segment.length - 1] === "'");
        let index = parseInt(segment, 10) + (hardened ? schema.hardenedOffset : 0);
    
        let isHardened = index >= schema.hardenedOffset;
        let indexBuffer = Buffer.allocUnsafe(4);
        indexBuffer.writeUInt32BE(index, 0);

        let data = isHardened
            ? Buffer.concat([Buffer.alloc(1, 0), sk, indexBuffer])
            : Buffer.concat([pk, indexBuffer]);
    
        let I = cryptoHmac(data, chainCode);
        let IL = I.slice(0, 32);

        sk = schema.tweak
            ? Buffer.from(schema.tweak(Buffer.from(sk), IL))
            : I.slice(0, 32);

        pk = Buffer.from(schema.keyPair(sk, true));
        chainCode = I.slice(32);
    });

    return { sk, pk };
};


function keyPair(seed: any, schemaKey: any, path: any) {
    let schema: any = SCHEMAS[schemaKey];

    let { sk, pk } = path === ''
        ? { sk: seed.slice(0, 32), pk: schema.keyPair(seed.slice(0, 32)) }
        : derivePath(seed, schema, path);

    if (schemaKey === 'ed25519') sk = Buffer.concat([sk, pk]);

    return { sk, pk };
}


export default keyPair;
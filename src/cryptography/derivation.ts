import { Buffer } from 'buffer';
import * as crypto from './crypto-wrapper';

import * as ed25519 from './ed25519';
import { secp256k1, nistp256 } from './elliptic-curves';


const hardenedOffset: number = 0x80000000;
type curves = 'ed25519' | 'secp256k1' | 'nistp256';


interface Curve {
    secret: string;
    keyPair: (sk: Uint8Array) => Uint8Array;
    tweak?: (sk: Uint8Array, tweak: Uint8Array) => Uint8Array;
};


const SCHEMAS: Record<curves, Curve> = {
    ed25519: {
        secret: 'ed25519 seed',
        keyPair: ed25519.publicKeyCreate
    },

    secp256k1: {
        secret: 'Bitcoin seed',
        keyPair: secp256k1.publicKeyCreate,
        tweak: secp256k1.privateKeyTweakAdd
    },

    nistp256: {
        secret: 'nistp256 seed',
        keyPair: nistp256.publicKeyCreate,
        tweak: nistp256.privateKeyTweakAdd
    }
};


interface Keypair {
    sk: Uint8Array;
    pk: Uint8Array;
};


function derive(seed: Uint8Array, schema: Curve, path: string): Keypair {
    const seedBuffer: Buffer = Buffer.from(schema.secret, 'utf-8');
    const masterSecret: Uint8Array = crypto.cryptoHmac(seed, seedBuffer, 'sha512');

    let sk: Uint8Array = masterSecret.slice(0, 32);
    let pk: Uint8Array | undefined;
    let chainCode: Uint8Array = masterSecret.slice(32);

    path.split('/').slice(1).forEach((segment: string): void => {
        const hardened: boolean = (segment.length > 1) && (segment[segment.length - 1] === "'");
        const index: number = parseInt(segment, 10) + (hardened ? hardenedOffset : 0);
        const isHardened: boolean = index >= hardenedOffset;

        const indexBuffer: Buffer = Buffer.allocUnsafe(4);
        indexBuffer.writeUInt32BE(index, 0);

        const data: Uint8Array = isHardened
            ? Buffer.concat([new Uint8Array([0]), sk, indexBuffer])
            : Buffer.concat([pk!, indexBuffer]);
    
        const secret: Uint8Array = crypto.cryptoHmac(data, chainCode, 'sha512');
        const tweak: Uint8Array = secret.slice(0, 32);

        sk = schema.tweak !== undefined
            ? schema.tweak(sk, tweak)
            : tweak;

        pk = schema.keyPair(sk);
        chainCode = secret.slice(32);
    });

    return { sk, pk: pk! };
};


function deriveKeypair(seed: Uint8Array, schemaKey: curves, path?: string): Keypair {
    const schema: Curve = SCHEMAS[schemaKey];

    const keyPair: Keypair = path === undefined
        ? ({ 
            sk: seed.slice(0, 32),
            pk: schema.keyPair(seed.slice(0, 32))
        })
        : derive(seed, schema, path);

    if (schemaKey === 'ed25519') {
        keyPair.sk = Buffer.concat([keyPair.sk, keyPair.pk]);
    }

    return keyPair;
}


export default deriveKeypair;
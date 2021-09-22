import { Buffer } from 'buffer';
import elliptic from 'elliptic';
const secp256k1EC = new elliptic.ec('secp256k1');
const nistp256EC = new elliptic.ec('p256');


function signDetached(message: Uint8Array, sk: Uint8Array, ec: elliptic.ec): Uint8Array {
    const key = ec.keyFromPrivate(sk);
    const sig = key.sign(message, { canonical: true });
    const buffer: Buffer = Buffer.from(sig.r.toString('hex', 64) + sig.s.toString('hex', 64), 'hex');
    return new Uint8Array(buffer);
}


function privateKeyTweakAdd(sk: Uint8Array, tweak: Uint8Array, ec: elliptic.ec): Uint8Array {
    const BN = ec.curve.n.constructor;
    const bn = new BN(tweak);

    bn.iadd(new BN(sk));
    if (bn.cmp(ec.curve.n) >= 0) {
        bn.isub(ec.curve.n);
    }

    return bn.toArrayLike(Uint8Array, 'be', 32);
}


function publicKeyCreate(sk: Uint8Array, ec: elliptic.ec): Uint8Array {
    const point = ec.keyFromPrivate(sk).getPublic();
    const publicKey: Array<number> = point.encode(undefined, true);
    return new Uint8Array(publicKey);
}


interface Curve {
    signDetached: (message: Uint8Array, sk: Uint8Array) => Uint8Array;
    privateKeyTweakAdd: (sk: Uint8Array, tweak: Uint8Array) => Uint8Array;
    publicKeyCreate: (sk: Uint8Array) => Uint8Array;
};


export const secp256k1: Curve = {
    signDetached: (message: Uint8Array, sk: Uint8Array) => signDetached(message, sk, secp256k1EC),
    privateKeyTweakAdd: (sk: Uint8Array, tweak: Uint8Array) => privateKeyTweakAdd(sk, tweak, secp256k1EC),
    publicKeyCreate: (sk: Uint8Array) => publicKeyCreate(sk, secp256k1EC)
}


export const nistp256: Curve = {
    signDetached: (message: Uint8Array, sk: Uint8Array) => signDetached(message, sk, nistp256EC),
    privateKeyTweakAdd: (sk: Uint8Array, tweak: Uint8Array) => privateKeyTweakAdd(sk, tweak, nistp256EC),
    publicKeyCreate: (sk: Uint8Array) => publicKeyCreate(sk, nistp256EC)
}
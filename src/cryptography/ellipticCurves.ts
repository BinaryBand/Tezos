import { Buffer } from 'buffer';
import elliptic from 'elliptic';
const secp256k1EC = new elliptic.ec('secp256k1');
const nistp256EC = new elliptic.ec('p256');


function privateKeyTweakAdd(sk: Uint8Array, tweak: Function, ec: elliptic.ec): Uint8Array {
    const BN = ec.curve.n.constructor;
    const bn = new BN(tweak);

    bn.iadd(new BN(sk));
    if (bn.cmp(ec.curve.n) >= 0) {
        bn.isub(ec.curve.n);
    }

    return bn.toArrayLike(Uint8Array, 'be', 32);
}


function publicKeyCreate(sk: Uint8Array, ec: elliptic.ec) {
    const point = ec.keyFromPrivate(sk).getPublic();
    return point.encode(undefined, true);
}


function signDetached(m: string, sk: Uint8Array, ec: elliptic.ec) {
    const key = ec.keyFromPrivate(sk);
    const sig = key.sign(m, { canonical: true });
    return Buffer.from(sig.r.toString('hex', 64) + sig.s.toString('hex', 64), 'hex');
}


export const secp256k1 = {
    privateKeyTweakAdd: (sk: Uint8Array, tweak: Function) => privateKeyTweakAdd(sk, tweak, secp256k1EC),
    publicKeyCreate: (sk: Uint8Array) => publicKeyCreate(sk, secp256k1EC),
    signDetached: (m: string, sk: Uint8Array) => signDetached(m, sk, secp256k1EC)
}


export const nistp256 = {
    privateKeyTweakAdd: (sk: Uint8Array, tweak: Function) => privateKeyTweakAdd(sk, tweak, nistp256EC),
    publicKeyCreate: (sk: Uint8Array) => publicKeyCreate(sk, nistp256EC),
    signDetached: (m: string, sk: Uint8Array) => signDetached(m, sk, nistp256EC)
}
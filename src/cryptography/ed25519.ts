import * as crypto from './crypto-wrapper';
import { Buffer } from 'buffer';


const X: Float64Array = new Float64Array([0xd51a, 0x8f25, 0x2d60, 0xc956, 0xa7b2, 0x9525, 0xc760, 0x692c, 0xdc5c, 0xfdd6, 0xe231, 0xc0a4, 0x53fe, 0xcd6e, 0x36d3, 0x2169]);
const Y: Float64Array = new Float64Array([0x6658, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666]);
const D2: Float64Array = new Float64Array([0xf159, 0x26b2, 0x9b94, 0xebd6, 0xb156, 0x8283, 0x149a, 0x00e0, 0xd130, 0xeef3, 0x80f2, 0x198e, 0xfce7, 0x56df, 0xd9dc, 0x2406]);
const L: Uint8Array = new Uint8Array([0xed, 0xd3, 0xf5, 0x5c, 0x1a, 0x63, 0x12, 0x58, 0xd6, 0x9c, 0xf7, 0xa2, 0xde, 0xf9, 0xde, 0x14, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0x10]);


function gf(init?: Float64Array): Float64Array {
    const r: Float64Array = new Float64Array(16);
    if (init) {
        for (let i: number = 0; i < init.length; i++) r[i] = init[i];
    }
    return r;
}


function A(o: Float64Array, a: Float64Array, b: Float64Array): void {
    for (let i: number = 0; i < 16; i++) o[i] = a[i] + b[i];
}


function Z(o: Float64Array, a: Float64Array, b: Float64Array): void {
    for (let i: number = 0; i < 16; i++) o[i] = a[i] - b[i];
}


function M(o: Float64Array, a: Float64Array, b: Float64Array): void {
    const t: Float64Array = new Float64Array(31);

    for (let i: number = 0; i < 16; i++) {
        const v: number = a[i];
        for (let j: number = 0; j < 16; j++) t[i + j] += v * b[j];
    }

    for (let i: number = 0; i < 15; i++) t[i] += 38 * t[16 + i];
    for (let i: number = 0; i < 2; i++) car25519(t);

    for (let i: number = 0; i < 16; i++) o[i] = t[i];
}


function set25519(r: Float64Array, a: Float64Array): void {
    for (let i: number = 0; i < 16; i++) r[i] = a[i] | 0;
}


function sel25519(p: Float64Array, q: Float64Array, b: number): void {
    const c: number = ~(b - 1);
    for (let i: number = 0; i < 16; i++) {
        const t: number = c & (p[i] ^ q[i]);
        p[i] ^= t;
        q[i] ^= t;
    }
}


function cswap(p: Array<Float64Array>, q: Array<Float64Array>, b: number): void {
    for (let i: number = 0; i < 4; i++) sel25519(p[i], q[i], b);
}


function add(p: Array<Float64Array>, q: Array<Float64Array>): void {
    const a: Float64Array = gf();
    const b: Float64Array = gf();
    const c: Float64Array = gf();
    const d: Float64Array = gf();
    const e: Float64Array = gf();
    const f: Float64Array = gf();
    const g: Float64Array = gf();
    const h: Float64Array = gf();
    const t: Float64Array = gf();

    Z(a, p[1], p[0]);
    Z(t, q[1], q[0]);
    M(a, a, t);
    A(b, p[0], p[1]);
    A(t, q[0], q[1]);
    M(b, b, t);
    M(c, p[3], q[3]);
    M(c, c, D2);
    M(d, p[2], q[2]);
    A(d, d, d);
    Z(e, b, a);
    Z(f, d, c);
    A(g, d, c);
    A(h, b, a);

    M(p[0], e, f);
    M(p[1], h, g);
    M(p[2], g, f);
    M(p[3], e, h);
}


function scalarmult(p: Array<Float64Array>, q: Array<Float64Array>, s: Uint8Array): void {
    const h: Array<Float64Array> = [gf(q[0]), gf(q[1]), gf(q[2]), gf(q[3])];
    
    const gf0: Float64Array = gf();
    const gf1: Float64Array = gf(new Float64Array([1]));

    set25519(p[0], gf0);
    set25519(p[1], gf1);
    set25519(p[2], gf1);
    set25519(p[3], gf0);
    
    for (let i: number = 255; i >= 0; --i) {
        const b: number = (s[(i / 8) | 0] >> (i & 7)) & 1;
        cswap(p, h, b);
        add(h, p);
        add(p, p);
        cswap(p, h, b);
    }
}


function scalarbase(p: Array<Float64Array>, s: Uint8Array): void {
    const q: Array<Float64Array> = [gf(), gf(), gf(), gf()];

    set25519(q[0], X);
    set25519(q[1], Y);
    set25519(q[2], gf(new Float64Array([1])));
    M(q[3], X, Y);
    scalarmult(p, q, s);
}


function inv25519(o: Float64Array, i: Float64Array): void {
    const c: Float64Array = gf(i);

    for (let a: number = 253; a >= 0; a--) {
        M(c, c, c);
        if (a !== 2 && a !== 4) M(c, c, i);
    }

    for (let a: number = 0; a < 16; a++) o[a] = c[a];
}


function par25519(a: Float64Array): number {
    const d: Uint8Array = new Uint8Array(32);
    pack25519(d, a);
    return d[0] & 1;
}


function car25519(o: Float64Array): void {
    let c: number = 1;

    for (let j: number = 0; j < 16; j++) {
        const v: number = o[j] + c + 65535;
        c = Math.floor(v / 65536);
        o[j] = v - c * 65536;
    }

    o[0] += c - 1 + 37 * (c - 1);
}


function pack25519(o: Uint8Array, n: Float64Array): void {
    const m: Float64Array = gf(new Float64Array([n[0] - 0xffed]));
    const t: Float64Array = gf(n);

    for (let i: number = 0; i < 3; i++) car25519(t);

    for (let j: number = 0; j < 2; j++) {
        for (let i: number = 1; i < 15; i++) {
            m[i] = t[i] - 0xffff - ((m[i - 1] >> 16) & 1);
            m[i - 1] &= 0xffff;
        }

        m[15] = t[15] - 0x7fff - ((m[14] >> 16) & 1);
        const b: number = (m[15] >> 16) & 1;
        m[14] &= 0xffff;
        sel25519(t, m, 1 - b);
    }

    for (let i: number = 0; i < 16; i++) {
        o[2 * i] = t[i] & 0xff;
        o[2 * i + 1] = t[i] >> 8;
    }
}


function pack(r: Uint8Array, p: Array<Float64Array>): void {
    const tx: Float64Array = gf();
    const ty: Float64Array = gf();
    const zi: Float64Array = gf();

    inv25519(zi, p[2]);
    M(tx, p[0], zi);
    M(ty, p[1], zi);
    pack25519(r, ty);
    r[31] ^= par25519(tx) << 7;
}


function reduce(r: Uint8Array): void {
    const x: Float64Array = new Float64Array(64);
    for (let i: number = 0; i < 64; i++) x[i] = r[i];
    for (let i: number = 0; i < 64; i++) r[i] = 0;
    modL(r, x);
}


function modL(r: Uint8Array, x: Float64Array): void {
    for (let i: number = 63; i >= 32; --i) {
        let carry: number = 0;
        let j: number = 0;
        let k: number = i;

        for (j = i - 32, k = i - 12; j < k; ++j) {
            x[j] += carry - 16 * x[i] * L[j - (i - 32)];
            carry = (x[j] + 128) >> 8;
            x[j] -= carry * 256;
        }

        x[j] += carry;
        x[i] = 0;
    }

    let carry: number = 0;
    for (let i: number = 0; i < 32; i++) {
        x[i] += carry - (x[31] >> 4) * L[i];
        carry = x[i] >> 8;
        x[i] &= 255;
    }

    for (let i: number = 0; i < 32; i++) x[i] -= carry * L[i];
    for (let i: number = 0; i < 32; i++) {
        x[i + 1] += x[i] >> 8;
        r[i] = x[i] & 255;
    }
}


export function signDetached(message: Uint8Array, sk: Uint8Array): Uint8Array {
    const messageLength: number = message.length;
    const sig: Uint8Array = new Uint8Array(messageLength + 64);

    const d: Uint8Array = crypto.createHash(sk, 'sha512', 32);
    d[0] &= 248;
    d[31] &= 127;
    d[31] |= 64;

    for (let i: number = 0; i < messageLength; i++) sig[64 + i] = message[i];
    for (let i: number = 0; i < 32; i++) sig[32 + i] = d[32 + i];

    const r: Uint8Array = crypto.createHash(sig.subarray(32), 'sha512', messageLength + 32);
    const p: Array<Float64Array> = [gf(), gf(), gf(), gf()];
    reduce(r);
    scalarbase(p, r);
    pack(sig, p);

    for (let i: number = 32; i < 64; i++) sig[i] = sk[i];
    const h: Uint8Array = crypto.createHash(sig, 'sha512', messageLength + 64);
    reduce(h);

    const x: Float64Array = new Float64Array(64);
    for (let i: number = 0; i < 32; i++) x[i] = r[i];
    for (let i: number = 0; i < 32; i++) {
        for (let j: number = 0; j < 32; j++) {
            x[i + j] += h[i] * d[j];
        }
    }

    modL(sig.subarray(32), x);
    return sig.slice(0, 64);
}


interface Keypair {
    sk: Uint8Array;
    pk: Uint8Array;
};


export function signKeypair(seed: Uint8Array): Keypair {
    const sk: Uint8Array = Buffer.concat([seed, new Uint8Array(32)]);
    const pk: Uint8Array = new Uint8Array(32);

    const d: Uint8Array = crypto.createHash(sk, 'sha512', 32);
    d[0] &= 248;
    d[31] &= 127;
    d[31] |= 64;

    const p: Array<Float64Array> = [gf(), gf(), gf(), gf()];
    scalarbase(p, d);
    pack(pk, p);

    for (let i: number = 0; i < 32; i++) sk[i + 32] = pk[i];

    return { sk, pk };
}


export function publicKeyCreate(sk: Uint8Array): Uint8Array {
    const seed: Uint8Array = sk.slice(0, 32);
    return signKeypair(seed).pk;
}
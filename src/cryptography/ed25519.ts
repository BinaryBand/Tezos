import { Buffer } from 'buffer';
import { SHA512, lib, enc } from 'crypto-js';


function gf(init?: any) {
    const r = new Float64Array(16);
    if (init) {
        for (let i = 0; i < init.length; i++) r[i] = init[i];
    }
    return r;
}


const X = new Uint32Array([0xd51a, 0x8f25, 0x2d60, 0xc956, 0xa7b2, 0x9525, 0xc760, 0x692c, 0xdc5c, 0xfdd6, 0xe231, 0xc0a4, 0x53fe, 0xcd6e, 0x36d3, 0x2169]);
const Y = new Uint32Array([0x6658, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666]);
const D2 = new Uint32Array([0xf159, 0x26b2, 0x9b94, 0xebd6, 0xb156, 0x8283, 0x149a, 0x00e0, 0xd130, 0xeef3, 0x80f2, 0x198e, 0xfce7, 0x56df, 0xd9dc, 0x2406]);
const L = new Uint8Array([0xed, 0xd3, 0xf5, 0x5c, 0x1a, 0x63, 0x12, 0x58, 0xd6, 0x9c, 0xf7, 0xa2, 0xde, 0xf9, 0xde, 0x14, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0x10]);


function cryptoHash(m: any, n: any) {
    let hash = SHA512(lib.WordArray.create(m.subarray(0, n)));
    return Buffer.from(hash.toString(enc.Hex), 'hex');
}


function A(o: any, a: any, b: any) {
    for (let i = 0; i < 16; i++) o[i] = a[i] + b[i];
}


function Z(o: any, a: any, b: any) {
    for (let i = 0; i < 16; i++) o[i] = a[i] - b[i];
}


function M(o: any, a: any, b: any) {
    let t = new Float64Array(31);

    for (let i = 0; i < 16; i++) {
        let v = a[i];

        for (let j = 0; j < 16; j++) {
            t[i + j] += v * b[j];
        }
    }

    for (let i = 0; i < 15; i++) t[i] += 38 * t[16 + i];
    for (let i = 0; i < 2; i++) car25519(t);

    for (let i = 0; i < 16; i++) o[i] = t[i];
}


function set25519(r: any, a: any) {
    for (let i = 0; i < 16; i++) r[i] = a[i] | 0;
}


function sel25519(p: any, q: any, b: any) {
    let c = ~(b - 1);
    for (let i = 0; i < 16; i++) {
        let t = c & (p[i] ^ q[i]);
        p[i] ^= t;
        q[i] ^= t;
    }
}


function cswap(p: any, q: any, b: any) {
    for (let i = 0; i < 4; i++) sel25519(p[i], q[i], b);
}


function add(p: any, q: any) {
    let a = gf(),
        b = gf(),
        c = gf(),
        d = gf(),
        e = gf(),
        f = gf(),
        g = gf(),
        h = gf(),
        t = gf();

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


function scalarmult(p: any, q: any, s: any) {
    let h = [gf(q[0]), gf(q[1]), gf(q[2]), gf(q[3])];
    
    let gf0 = gf(),
        gf1 = gf([1]);

    set25519(p[0], gf0);
    set25519(p[1], gf1);
    set25519(p[2], gf1);
    set25519(p[3], gf0);
    
    for (let i = 255; i >= 0; --i) {
        let b = (s[(i / 8) | 0] >> (i & 7)) & 1;
        cswap(p, h, b);
        add(h, p);
        add(p, p);
        cswap(p, h, b);
    }
}


function scalarbase(p: any, s: any) {
    let q = [gf(), gf(), gf(), gf()];
    set25519(q[0], X);
    set25519(q[1], Y);
    set25519(q[2], gf([1]));
    M(q[3], X, Y);
    scalarmult(p, q, s);
}


function inv25519(o: any, i: any) {
    let c = gf(i);

    for (let a = 253; a >= 0; a--) {
        M(c, c, c);
        if (a !== 2 && a !== 4) M(c, c, i);
    }

    for (let a = 0; a < 16; a++) o[a] = c[a];
}


function par25519(a: any) {
    let d = new Uint8Array(32);
    pack25519(d, a);
    return d[0] & 1;
}


function car25519(o: any) {
    let c = 1;

    for (let j = 0; j < 16; j++) {
        let v = o[j] + c + 65535;
        c = Math.floor(v / 65536);
        o[j] = v - c * 65536;
    }

    o[0] += c - 1 + 37 * (c - 1);
}


function pack25519(o: any, n: any) {
    let m = gf([n[0] - 0xffed]),
        t = gf(n);

    for (let i = 0; i < 3; i++) car25519(t);

    for (let j = 0; j < 2; j++) {
        for (let i = 1; i < 15; i++) {
            m[i] = t[i] - 0xffff - ((m[i - 1] >> 16) & 1);
            m[i - 1] &= 0xffff;
        }

        m[15] = t[15] - 0x7fff - ((m[14] >> 16) & 1);
        let b = (m[15] >> 16) & 1;
        m[14] &= 0xffff;
        sel25519(t, m, 1 - b);
    }

    for (let i = 0; i < 16; i++) {
        o[2 * i] = t[i] & 0xff;
        o[2 * i + 1] = t[i] >> 8;
    }
}


function pack(r: any, p: any) {
    let tx = gf(),
        ty = gf(),
        zi = gf();
    inv25519(zi, p[2]);
    M(tx, p[0], zi);
    M(ty, p[1], zi);
    pack25519(r, ty);
    r[31] ^= par25519(tx) << 7;
}


function reduce(r: any) {
    let x = new Float64Array(64);
    for (let i = 0; i < 64; i++) x[i] = r[i];
    for (let i = 0; i < 64; i++) r[i] = 0;
    modL(r, x);
}


function modL(r: any, x: any) {
    for (let i = 63; i >= 32; --i) {
        let carry = 0,
            j = 0,
            k = i;

        for (j = i - 32, k = i - 12; j < k; ++j) {
            x[j] += carry - 16 * x[i] * L[j - (i - 32)];
            carry = (x[j] + 128) >> 8;
            x[j] -= carry * 256;
        }

        x[j] += carry;
        x[i] = 0;
    }

    let carry = 0;
    for (let i = 0; i < 32; i++) {
        x[i] += carry - (x[31] >> 4) * L[i];
        carry = x[i] >> 8;
        x[i] &= 255;
    }

    for (let i = 0; i < 32; i++) x[i] -= carry * L[i];
    for (let i = 0; i < 32; i++) {
        x[i + 1] += x[i] >> 8;
        r[i] = x[i] & 255;
    }
}


function signKeypair(seed: any) {
    let sk = Buffer.concat([seed, Buffer.alloc(32)]),
        pk = Buffer.alloc(32);

    let p = [gf(), gf(), gf(), gf()];
    let d = cryptoHash(sk, 32);

    d[0] &= 248;
    d[31] &= 127;
    d[31] |= 64;

    scalarbase(p, d);
    pack(pk, p);

    for (let i = 0; i < 32; i++) sk[i + 32] = pk[i];

    return { sk, pk };
}


function publicKeyCreate(sk: any) {
    let seed = sk.slice(0, 32);
    return signKeypair(seed).pk;
}


function signDetached(m: any, sk: any) {
    let sig = new Uint8Array(m.length + 64);

    let n = m.length;

    let p = [gf(), gf(), gf(), gf()];
    let d = cryptoHash(sk, 32);

    d[0] &= 248;
    d[31] &= 127;
    d[31] |= 64;

    for (let i = 0; i < n; i++) sig[64 + i] = m[i];
    for (let i = 0; i < 32; i++) sig[32 + i] = d[32 + i];

    let r = cryptoHash(sig.subarray(32), n + 32);
    reduce(r);
    scalarbase(p, r);
    pack(sig, p);

    for (let i = 32; i < 64; i++) sig[i] = sk[i];
    let h = cryptoHash(sig, n + 64);
    reduce(h);

    let x = new Float64Array(64);
    for (let i = 0; i < 32; i++) x[i] = r[i];
    for (let i = 0; i < 32; i++) {
        for (let j = 0; j < 32; j++) {
            x[i + j] += h[i] * d[j];
        }
    }

    modL(sig.subarray(32), x);

    return sig.slice(0, 64);
}


export default {
    signKeypair,
    publicKeyCreate,
    signDetached
};
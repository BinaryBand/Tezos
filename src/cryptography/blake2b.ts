const BLAKE2B_IV32: Uint32Array = new Uint32Array([0xf3bcc908, 0x6a09e667, 0x84caa73b, 0xbb67ae85, 0xfe94f82b, 0x3c6ef372, 0x5f1d36f1, 0xa54ff53a, 0xade682d1, 0x510e527f, 0x2b3e6c1f, 0x9b05688c, 0xfb41bd6b, 0x1f83d9ab, 0x137e2179, 0x5be0cd19]);
const SIGMA8: Uint8Array = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 14, 10, 4, 8, 9, 15, 13, 6, 1, 12, 0, 2, 11, 7, 5, 3, 11, 8, 12, 0, 5, 2, 15, 13, 10, 14, 3, 6, 7, 1, 9, 4, 7, 9, 3, 1, 13, 12, 11, 14, 2, 6, 5, 10, 4, 0, 15, 8, 9, 0, 5, 7, 2, 4, 10, 15, 14, 1, 11, 12, 6, 8, 3, 13, 2, 12, 6, 10, 0, 11, 8, 3, 4, 13, 7, 5, 15, 14, 1, 9, 12, 5, 1, 15, 14, 13, 4, 10, 0, 7, 6, 3, 9, 2, 8, 11, 13, 11, 7, 14, 12, 1, 3, 9, 5, 0, 15, 4, 8, 6, 2, 10, 6, 15, 14, 9, 11, 3, 0, 8, 12, 2, 13, 7, 1, 4, 10, 5, 10, 2, 8, 4, 7, 6, 1, 5, 15, 11, 9, 14, 3, 12, 13, 0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 14, 10, 4, 8, 9, 15, 13, 6, 1, 12, 0, 2, 11, 7, 5, 3]);
const SIGMA82: Uint8Array = new Uint8Array(SIGMA8.map((x: number) => x * 2));


function ADD64AA(v: Uint32Array, a: number, b: number): void {
    const o0: number = v[a] + v[b];

    let o1: number = v[a + 1] + v[b + 1];
    if (o0 >= 0x100000000) o1++;

    v[a] = o0;
    v[a + 1] = o1;
}


function ADD64AC(v: Uint32Array, a: number, b0: number, b1: number): void {
    let o0: number = v[a] + b0;
    if (b0 < 0) o0 += 0x100000000;

    let o1: number = v[a + 1] + b1;
    if (o0 >= 0x100000000) o1++;

    v[a] = o0;
    v[a + 1] = o1;
}


function B2B_GET32(arr: Uint8Array, i: number): number {
    return arr[i] ^ (arr[i + 1] << 8) ^ (arr[i + 2] << 16) ^ (arr[i + 3] << 24);
}


function B2B_G(v: Uint32Array, m: Uint32Array, a: number, b: number, c: number, d: number, ix: number, iy: number): void {
    const x0: number = m[ix];
    const x1: number = m[ix + 1];
    const y0: number = m[iy];
    const y1: number = m[iy + 1];

    ADD64AA(v, a, b);
    ADD64AC(v, a, x0, x1);

    const xor0: number = v[d] ^ v[a];
    const xor1: number = v[d + 1] ^ v[a + 1];
    v[d] = xor1;
    v[d + 1] = xor0;

    ADD64AA(v, c, d);

    const xor2: number = v[b] ^ v[c];
    const xor3: number = v[b + 1] ^ v[c + 1];
    v[b] = (xor2 >>> 24) ^ (xor3 << 8);
    v[b + 1] = (xor3 >>> 24) ^ (xor2 << 8);

    ADD64AA(v, a, b);
    ADD64AC(v, a, y0, y1);

    const xor4: number = v[d] ^ v[a];
    const xor5: number = v[d + 1] ^ v[a + 1];
    v[d] = (xor4 >>> 16) ^ (xor5 << 16);
    v[d + 1] = (xor5 >>> 16) ^ (xor4 << 16);

    ADD64AA(v, c, d);

    const xor6: number = v[b] ^ v[c];
    const xor7: number = v[b + 1] ^ v[c + 1];
    v[b] = (xor7 >>> 31) ^ (xor6 << 1);
    v[b + 1] = (xor6 >>> 31) ^ (xor7 << 1);
}


interface CTX {
    b: Uint8Array;
    h: Uint32Array;
    t: number;
    c: number;
    outlen: number;
};


function blake2bInit(outlen: number, key?: Uint8Array): CTX {
    const ctx: CTX = {
        b: new Uint8Array(128),
        h: new Uint32Array(16),
        t: 0,
        c: 0,
        outlen
    };

    for (let i: number = 0; i < 16; i++) {
        ctx.h[i] = BLAKE2B_IV32[i];
    }

    const keylen: number = key ? key.length : 0;
    ctx.h[0] ^= 0x01010000 ^ (keylen << 8) ^ outlen;

    if (key !== undefined) {
        blake2bUpdate(ctx, key);
        ctx.c = 128;
    }

    return ctx;
}


function blake2bCompress(ctx: CTX, t: number, last: boolean): void {
    const v: Uint32Array = new Uint32Array(32);
    for (let i: number = 0; i < 16; i++) {
        v[i] = ctx.h[i];
        v[i + 16] = BLAKE2B_IV32[i];
    }

    v[24] = v[24] ^ t;
    v[25] = v[25] ^ (t / 0x100000000);

    if (last) {
        v[28] = ~v[28];
        v[29] = ~v[29];
    }

    const m: Uint32Array = new Uint32Array(32);
    for (let i: number = 0; i < 32; i++) m[i] = B2B_GET32(ctx.b, 4 * i);

    for (let i: number = 0; i < 12; i++) {
        B2B_G(v, m, 0, 8, 16, 24, SIGMA82[i * 16 + 0], SIGMA82[i * 16 + 1]);
        B2B_G(v, m, 2, 10, 18, 26, SIGMA82[i * 16 + 2], SIGMA82[i * 16 + 3]);
        B2B_G(v, m, 4, 12, 20, 28, SIGMA82[i * 16 + 4], SIGMA82[i * 16 + 5]);
        B2B_G(v, m, 6, 14, 22, 30, SIGMA82[i * 16 + 6], SIGMA82[i * 16 + 7]);
        B2B_G(v, m, 0, 10, 20, 30, SIGMA82[i * 16 + 8], SIGMA82[i * 16 + 9]);
        B2B_G(v, m, 2, 12, 22, 24, SIGMA82[i * 16 + 10], SIGMA82[i * 16 + 11]);
        B2B_G(v, m, 4, 14, 16, 26, SIGMA82[i * 16 + 12], SIGMA82[i * 16 + 13]);
        B2B_G(v, m, 6, 8, 18, 28, SIGMA82[i * 16 + 14], SIGMA82[i * 16 + 15]);
    }

    for (let i: number = 0; i < 16; i++) {
        ctx.h[i] = ctx.h[i] ^ v[i] ^ v[i + 16]
    }
}


function blake2bUpdate(ctx: CTX, input: Uint8Array): void {
    for (let i: number = 0; i < input.length; i++) {
        if (ctx.c === 128) {
            ctx.t += ctx.c;
            blake2bCompress(ctx, ctx.t, false);
            ctx.c = 0;
        }

        ctx.b[ctx.c++] = input[i]
    }
}


function blake2bFinal(ctx: CTX): Uint8Array {
    ctx.t += ctx.c;

    while (ctx.c < 128) ctx.b[ctx.c++] = 0;

    blake2bCompress(ctx, ctx.t, true);

    const out: Uint8Array = new Uint8Array(ctx.outlen);
    for (let i: number = 0; i < ctx.outlen; i++) {
        out[i] = ctx.h[i >> 2] >> (8 * (i & 3));
    }

    return out;
}


function blake2b(input: Uint8Array, outlen: number = 64, key?: Uint8Array): Uint8Array {
    const ctx: CTX = blake2bInit(outlen, key);
    blake2bUpdate(ctx, input);
    return blake2bFinal(ctx);
}


export default blake2b;
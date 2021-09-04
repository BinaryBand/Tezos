import { Buffer } from 'buffer';

import base58 from '../encoders/base58';
import { generateMnemonic, mnemonicToSeed, mnemonicToEntropy } from '../encoders/bip39';
import derivePath from '../cryptography/derivation';
import blake2b from '../cryptography/blake2b';

import PREFIX from '../constants/prefix.json';

type keys = {
    mnemonic: string,
    path: string,
    curve: string,
    privateKey: string,
    publicKey: string,
    address: string
};

type options = {
    path?: string,
    curve?: string,
    password?: string
};


export function confirmMnemonic(mnemonic: string): boolean {
    return mnemonicToEntropy(mnemonic) ? true : false;
}


export function generateWallet(mnemonicLength: number=12, entropy: any, options: options={}): keys {
    const byteSize: number = mnemonicLength + (mnemonicLength / 3);

    // Set default options.
    const path: string = options.path === undefined ? "m/44'/1729'/0'/0'" : options.path;
    const curve: string = options.curve || 'ed25519';
    const password: string = options.password || '';
    const hashedEntropy: Uint8Array = blake2b(entropy, byteSize);

    const mnemonic: string = generateMnemonic(hashedEntropy);
    return walletFromMnemonic(mnemonic, { path, curve, password });
}


// Generate a private key, public key, and Tezos address from an existing mnemonic.
export function walletFromMnemonic(mnemonic: string='', options: options={}): keys {
    // Set default options.
    const path: string = options.path === undefined ? "m/44'/1729'/0'/0'" : options.path;
    const curve: string = options.curve || 'ed25519';
    const password: string = options.password || '';

    if (!confirmMnemonic(mnemonic)) {
        throw(new Error('Mnemonic is invalid.'));
    }

    // Generate raw keys from seed buffer.
    const seed: Buffer = mnemonicToSeed(mnemonic, password);
    const keys: { sk: Buffer, pk: Buffer } = derivePath(seed, curve, path);

    const prefixes: {
        [name: string]: any
    } = PREFIX;

    const pref: {
        sk: number[],
        pk: number[],
        tz: number[]
    } = prefixes[curve];

    // Convert keys into readable strings.
    const privateKey: string = base58.encode(keys.sk, pref.sk);
    const publicKey: string = base58.encode(keys.pk, pref.pk);

    // Use the blake2b hash on the private key to produce Tezos address.
    const blakeHash: Uint8Array = blake2b(keys.pk, 20);
    const address: string = base58.encode(blakeHash, pref.tz);

    return { mnemonic, path, curve, privateKey, publicKey, address };
}
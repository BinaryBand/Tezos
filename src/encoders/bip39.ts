import { Buffer } from 'buffer';

import * as crypto from '../cryptography/crypto-wrapper';
import WORD_LIST from '../constants/word-list.json';


function bytesToBinary(bytes: number[]): string {
    return bytes.map((x: number) => {
        return x.toString(2).padStart(8, '0');
    }).join('');
}


function binaryToByte(bin: string): number {
    return parseInt(bin, 2);
}


function deriveChecksumBits(entropyBuffer: Uint8Array): string {
    const keySize: number = (entropyBuffer.length * 8) / 32;
    const bytes: Uint8Array = crypto.createHash(entropyBuffer, 'sha256');
    return bytesToBinary(Array.from(bytes)).slice(0, keySize);
}


export function generateMnemonic(entropy: Uint8Array): string {
    const entropyBits: string = bytesToBinary(Array.from(entropy));
    const checksumBits: string = deriveChecksumBits(entropy);

    const bits: string = entropyBits + checksumBits;

    const chunks: string[] = bits.match(/(.{1,11})/g)!;
    return chunks!.map((binary: string): string => {
        return WORD_LIST[binaryToByte(binary)];
    }).join(' ');
}


export function mnemonicToSeed(mnemonic: string, password: string = ''): Uint8Array {
    return crypto.pbkdf2(mnemonic, password);
}


export function mnemonicToEntropy(mnemonic: string): string | undefined {
    if (!mnemonic || mnemonic.length === 0) return undefined;

    const words: string[] = mnemonic.split(' ');

    // Mnemonic length must be divisible by 3.
    if (words.length % 3 !== 0) return undefined;

    words.forEach((word: string) => {
        const index: number = WORD_LIST.indexOf(word);
        if (index === -1) return undefined;
    });

    const bits: string = words.map((word: string): string => {
        const index: number = WORD_LIST.indexOf(word);
        return index.toString(2).padStart(11, '0');
    }).join('');

    const dividerIndex: number = Math.floor(bits.length / 33) * 32;
    const entropyBits: string = bits.slice(0, dividerIndex);
    const checksumBits: string = bits.slice(dividerIndex);
    const entropyBytes: number[] = entropyBits.match(/(.{1,8})/g)!.map(binaryToByte);
    const entropy: Buffer = Buffer.from(entropyBytes);

    // Mnemonic must have a valid checksum.
    const newChecksum: string = deriveChecksumBits(entropy);
    if (newChecksum !== checksumBits) return undefined;


    return entropy.toString('hex');
}
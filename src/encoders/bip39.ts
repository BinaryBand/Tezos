import * as crypto from '../cryptography/crypto-wrapper';
import WORD_LIST from '../constants/word-list.json';


function bytesToBinary(bytes: Array<number>): string {
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

    const chunks: Array<string> = bits.match(/(.{1,11})/g)!;
    return chunks!.map((binary: string): string => {
        return WORD_LIST[binaryToByte(binary)];
    }).join(' ');
}


export function mnemonicToSeed(mnemonic: string, password: string = ''): Uint8Array {
    return crypto.pbkdf2(mnemonic, password);
}


export function mnemonicToEntropy(mnemonic: string): string | undefined {
    const words: Array<string> = mnemonic.split(' ');

    const bits: string = words.map((word: string): string => {
        const index: number = WORD_LIST.indexOf(word);
        return index.toString(2).padStart(11, '0');
    }).join('');

    const dividerIndex: number = Math.floor(bits.length / 33) * 32;
    const entropyBits: string = bits.slice(0, dividerIndex);
    const checksumBits: string = bits.slice(dividerIndex);

    const entropyBytes: Array<number> = entropyBits.match(/(.{1,8})/g)!.map(binaryToByte);

    // Mnemonic length must be divisible by 4.
    if (entropyBytes.length % 4 !== 0) {
        throw(new Error('Mnemonic length must be divisible by 4.'));
    }

    const entropy: Buffer = Buffer.from(entropyBytes);
    const newChecksum: string = deriveChecksumBits(entropy);

    // Mnemonic must have a valid checksum.
    if (newChecksum !== checksumBits) {
        throw(new Error('Mnemonic must have a valid checksum.'));
    }


    return entropy.toString('hex');
}
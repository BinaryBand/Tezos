import * as bip39 from '../src/encoders/bip39';


test('Invalid Mnemonic 1', () => {
    const mnemonic: string = '';
    const entropy: string | undefined = bip39.mnemonicToEntropy(mnemonic);
    expect(entropy).toEqual(undefined);
});


test('Invalid Mnemonic 2', () => {
    const mnemonic: string = 'away sdfb';
    const entropy: string | undefined = bip39.mnemonicToEntropy(mnemonic);
    expect(entropy).toEqual(undefined);
});
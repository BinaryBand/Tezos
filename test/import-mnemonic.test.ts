import * as XTZWallet from '../src/index';

const mnemonic: string = 'same ask pool shaft clown setup shed master more credit defense useful';

type Curve = 'ed25519' | 'secp256k1' | 'nistp256';


test('Import Ed25519 With Derivation', async () => {
    const path: string = "m/44'/1729'/0'/0'";
    const wallet: XTZWallet.Wallet = XTZWallet.importWallet(mnemonic, { path });

    const privateKey: string = wallet.getSecretKey();
    const publicKey: string = wallet.getPublicKey();
    const address: string = wallet.getAddress();

    expect({ privateKey, publicKey, address }).toEqual({
        privateKey: 'edskRruPv8JtGnZ3DpSeB2QsHeBHrWAa5LDSVhnTXYyhC4bPZkarGjkSReuJNn7mFPHRUMfDdnUQus4iSMMbEpqXjjY6Bd3tSJ',
        publicKey: 'edpktwimvVAUFhzChGBA3pQ2FJMTvLbqAZjDHmiuBAu7hHT9S41mu2',
        address: 'tz1To5gvZoqdhJdvx6heVo1ZHkvq1fGHKJqn'
    });
});


test('Import Ed25519 Without Derivation', async () => {
    const wallet: XTZWallet.Wallet = XTZWallet.importWallet(mnemonic);

    const privateKey: string = wallet.getSecretKey();
    const publicKey: string = wallet.getPublicKey();
    const address: string = wallet.getAddress();

    expect({ privateKey, publicKey, address }).toEqual({
        privateKey: 'edskRt2F9fMK7x2yXYuWyLz35EqiAETk3LY65bocWGDheyavTdAjCoqSBpPFhdFsjSAK4q8w9ogqq8h8vUL2WdTft2eRPPMSrw',
        publicKey: 'edpktqLxbajqmLihDJE3DanqMAyE3ccGSk2dcdbRxiKVBneRYJuHu2',
        address: 'tz1XsEcKXqPhW7oUkFzjGaHi3ZrQTM7rf6cP'
    });
});


test('Import Ed25519 With Password', async () => {
    const password = 'Jus7-A_rather.V3ry/Ideal!5ecret';
    const path: string = "m/44'/1729'/0'/0'";
    const wallet: XTZWallet.Wallet = XTZWallet.importWallet(mnemonic, { password, path });

    const privateKey: string = wallet.getSecretKey();
    const publicKey: string = wallet.getPublicKey();
    const address: string = wallet.getAddress();

    expect({ privateKey, publicKey, address }).toEqual({
        privateKey: 'edskRtA3JcKmckVurZrfhRe5UHQpLxA3Fz22Df8ARSJbYEcMBDLptS8uxThq5r4rhFCweF6SVTse6QUii1a6pVVJfiCpp9zy6M',
        publicKey: 'edpku4m8yVwhFYrnGHk9WuvaSTScindgHZRAgVYZGQ7USjF5ueLNo9',
        address: 'tz1hwFrUnvbMihmuYKiDpDRNhSTKdCiBRXvQ'
    });
});


test('Import SECP256k1', async () => {
    const path: string = "m/44'/1729'/0'/0'";
    const curve: Curve = 'secp256k1';
    const wallet: XTZWallet.Wallet = XTZWallet.importWallet(mnemonic, { path, curve });

    const privateKey: string = wallet.getSecretKey();
    const publicKey: string = wallet.getPublicKey();
    const address: string = wallet.getAddress();

    expect({ privateKey, publicKey, address }).toEqual({
        privateKey: 'spsk2nhWNL18bo6tKG1GFrwb32ss2Ybo9QaJYPSkJrK8t5Zn7NMYpQ',
        publicKey: 'sppk7bJSooBDcYP6QzBYiMSTxfSy6E2wjgv8UKYF2uzJZxc6QFKPEJP',
        address: 'tz2EMKatcAH9vwDtGDZ8YeWaHwJiNEUr7s6e'
    });
});


test('Import NIST P256', async () => {
    const path: string = "m/44'/1729'/0'/0'";
    const curve: Curve = 'nistp256';
    const wallet: XTZWallet.Wallet = XTZWallet.importWallet(mnemonic, { path, curve });

    const privateKey: string = wallet.getSecretKey();
    const publicKey: string = wallet.getPublicKey();
    const address: string = wallet.getAddress();

    expect({ privateKey, publicKey, address }).toEqual({
        privateKey: 'p2sk3DH7TyC9QrkrcL3KvoxPKbcFVeV1MkRQ19yzgAqMj45UcfajzL',
        publicKey: 'p2pk65MGXGQUzQjE8kFtjnLReMcjiT8ib81J4wXr1TdczBzLLguvGyY',
        address: 'tz3bB2gZST2m5AuZNbXczqwMdQCXs5wXiaSU'
    });
});
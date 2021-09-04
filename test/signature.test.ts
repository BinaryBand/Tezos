import XTZWallet from '../src/index';
const wallet = new XTZWallet();

const mnemonic: string = 'same ask pool shaft clown setup shed master more credit defense useful';
const dataStub: string = '768bc4176a249ace35451e678da895e7969a2d85d8e1b5b379303547eb56a3f56c014235b2494632f8950d04bafdbc91e9fc7ef8e7abb903f3fa1af00b00c0843d00003caf2c4c9899e0d2067559bc677f9ba4fe43484a00';

type curve = 'ed25519' | 'secp256k1' | 'nistp256';


test('Ed25519 Signature', () => {
    wallet.importWallet(mnemonic);

    const keys = wallet.getKeys()!;
    const privateKey = keys.privateKey;

    const signature: string = wallet.helpers.signOperation(dataStub, privateKey);

    expect(signature).toEqual('edsigu4o4XbMmYA413NKbiTFvzdFfLbjBrL7gobo4yqy6FQcSgAieGwYh5dBaM7XEbxXKh4cw7aGej4xFZzsenYE67Ge6TpZjr8');
});


test('SECP256k1 Signature', () => {
    const curve: curve = 'secp256k1';
    wallet.importWallet(mnemonic, { curve });

    const keys = wallet.getKeys()!;
    const privateKey = keys.privateKey;

    const signature: string = wallet.helpers.signOperation(dataStub, privateKey);

    expect(signature).toEqual('spsig1EK7qyvrSZSiEGLPw4DdQA4RAX1x9ZwwZ9EUtw3DeCWKAEpkxgqNh6Fx7fLTvcSXw1xo14Smr9mzvZe4iW8uKD45Ydjk4S');
});


test('NIST P256 Signature', () => {
    const curve: curve = 'nistp256';
    wallet.importWallet(mnemonic, { curve });

    const keys = wallet.getKeys()!;
    const privateKey = keys.privateKey;

    const signature: string = wallet.helpers.signOperation(dataStub, privateKey);

    expect(signature).toEqual('p2sigMTKPjC3Mst1fbmqS4k9BMw14ziaa8i9sCh9BihJ6Dc3EWSwm3JYemR6knVg3k1b7Lkt4pSJjYPzWqkZ54bszVWFfJWctF');
});
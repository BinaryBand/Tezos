# XTZ Wallet

XTZ Wallet is a JavaScript library for interacting with the Tezos blockchain.

## Getting Started

```bash
import { Wallet, createMnemonic, importWallet } from 'xtz-wallet';
```

## Usage

Create a new mnemonic seed phrase.

```bash
const numWords: number = 12;
const entropy: Uint8Array = new Uint8Array([1, 2, 3, 4, 5]);

// clerk find excuse juice observe cage reveal pulse language trial pumpkin culture
const mnemonic: string = createMnemonic(numWords, entropy);
```

Import keys from an existing mnemonic seed.

```bash
const password: string = '0ptionalPa55word';
const curve: 'ed25519' | 'secp256k1' | 'nistp256' = 'ed25519';
const rpc: string = 'https://granadanet.smartpy.io/';
const path: string = "m/44'/1729'/0'/0'";
const wallet: Wallet = importWallet(mnemonic, { password, curve, rpc, path });
```

Retrieve keys once your wallet has been initialized.

```bash
console.log(wallet.getSecretKey());
console.log(wallet.getPublicKey());
console.log(wallet.getAddress());   // tz1UMq5jhiizkBH7Abtmy5vFUsMfFHPyPMQT
```

Build a Tezos operation batch.

```bash
const batch = await wallet.buildOperationBatch([
    wallet.ops.transaction('tz1gRi6XnzpBbkNGByBgxsBm1dTsA1fivSWU', 1000)
]);
```

Return operations list and fee estimates.

```bash
console.log(batch.getContents());
console.log(batch.getEstimates());
```

Sign the operation batch.

```bash
const signature: string = await batch.getSignature(wallet.getSecretKey());
console.log(signature);
```

Send operation to the blockchain. This function handles pre-validation automatically.

```bash
wallet.send(batch, signature).then(console.log);
```

## License
[MIT](https://choosealicense.com/licenses/mit/)
# XTZ Wallet

XTZ Wallet is a JavaScript library for interacting with the Tezos blockchain.

## Getting Started

```bash
import XTZWallet from 'xtz-wallet';
```

## Usage

Import keys from an existing mnemonic seed.

```bash
const numWords: number = 24;

const rpc: string = 'https://granadanet.smartpy.io';
const entropy: Uint8Array = 'Make sure this is sufficiently random!';
const mnemonic: string = XTZWallet.createMnemonic(numWords, entropy);
const wallet = XTZWallet.importWallet(mnemonic, { password: '', curve: 'ed25519', rpc });
```

Retrieve keys once your wallet has been initialized.

```bash
console.log(wallet.getSecretKey());
console.log(wallet.getPublicKey());
console.log(wallet.getAddress());
```

Build a list of Tezos operations.

```bash
const batch = await wallet.buildOperationBatch([
    wallet.operations.reveal(),
    wallet.ops.transaction(destination, amount),
    wallet.ops.delegate(delegate),                              // Leave delegator blank to undelegate
    wallet.ops.tokenTransaction(destination, amount, contract)
]);
```

Estimate gas, storage, and fees.

```bash
console.log(batch.getEstimates());
```

Sign the operation batch.

```bash
const signature: string = await wallet.signOperation(batch);
```

Send operation to the blockchain. This function handles pre-validation automatically.

```bash
wallet.send(batch, signature).then(console.log);
```

## License
[MIT](https://choosealicense.com/licenses/mit/)
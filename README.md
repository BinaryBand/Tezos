# XTZ Wallet

XTZ Wallet is a JavaScript library for interacting with the Tezos blockchain.

## Getting Started

```bash
import xtzWallet from 'xtz-wallet';
const rpc: string = 'https://granadanet.smartpy.io';
const wallet: XTZWallet = new XTZWallet(rpc);
```

## Usage

Create a new wallet without using a mnemonic seed phrase.

```bash
const numWords: number = 24;
const entropy: any = 'Make sure this is sufficiently random!';

const path: string = "m/44'/1729'/0'/0'";
const curve: 'ed25519' | 'secp256k1' | 'nistp256' = 'secp256k1';
const password: string | undefined = 'Just-A-Rather-Very-Ideal-Secret';

wallet.createWallet(numWords, entropy, { path, curve, password });
```

Or import keys from an existing mnemonic seed.

```bash
const path: string = "m/44'/0'/0'/0'/0";
const curve: 'ed25519' | 'secp256k1' | 'nistp256' = 'ed25519';
const password: string | undefined = 'Just-A-Rather-Very-Ideal-Secret';

wallet.importWallet(mnemonic, { path, curve, password });
```

Retrieve keys once your wallet has been initialized.

```bash
const keys = wallet.getKeys()!;
const privateKey = keys.privateKey;
const publicKey = keys.publicKey;
const address = keys.address;
```

Build a list of Tezos operations.

```bash
const operations = await wallet.buildBatch([
    wallet.operations.reveal(source, publicKey),
    wallet.operations.tokenTransaction(source, destination, contract, amount, tokenID?),
    wallet.operations.transaction(source, destination, amount),     // Amount in nano Tez
    wallet.operations.tokenTransaction(source, delegator?)          // Leave delegator blank to undelegate
]);

// Estimate gas, storage, and fees.
const batch = await wallet.applyEstimates(operations);
```

Convert your operation batch to hexadecimal format and sign it with your private key.

```bash
const { forgedBytes, signature } = await wallet.forgeSign(batch, privateKey);
```

Send operation to the blockchain. This function handles pre-validation automatically.

```bash
const operationHash = await xtzWallet.send(batch, forgedBytes, signature);
```

Retrieve the token balances of any standard FA-1.2 or FA-2.0 smart contract.

```bash
const tokenContracts = [
    'KT1K9gCRgaLRFKTErYt1wVxA3Frb9FjasjTV',                     // FA-1.2
    { address: 'KT193D4vozYnhGJQVtw7CoxxqphqUEEwK6Vb', id: 0 }  // FA-2.0
];

const tokenBalances = await wallet.getTokenBalances(tokenContracts, address);
```

## License
[MIT](https://choosealicense.com/licenses/mit/)
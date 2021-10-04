import { Wallet, createMnemonic, importWallet } from './src/index';


async function main(): Promise<void> {
    try {
        const numWords: number = 12;
        const entropy: Uint8Array = new Uint8Array([1, 2, 3, 4, 5]);

        // clerk find excuse juice observe cage reveal pulse language trial pumpkin culture
        const mnemonic: string = createMnemonic(numWords, entropy);
        
        const password: string = '0ptionalPa55word';
        const curve: 'ed25519' | 'secp256k1' | 'nistp256' = 'ed25519';
        const rpc: string = 'https://granadanet.smartpy.io/';
        const path: string = "m/44'/1729'/0'/0'";
        const wallet: Wallet = importWallet(mnemonic, { password, curve, rpc, path });

        console.log(wallet.getSecretKey());
        console.log(wallet.getPublicKey());
        console.log(wallet.getAddress());   // tz1UMq5jhiizkBH7Abtmy5vFUsMfFHPyPMQT

        const balance: number = await wallet.getBalance();
        console.log(`Balance: ${balance} mutez`);

        const spendableBalance: number = await wallet.getSpendableBalance('tz1gRi6XnzpBbkNGByBgxsBm1dTsA1fivSWU');
        console.log(`Spendable balance: ${spendableBalance} mutez`);
        
        const batch = await wallet.buildOperationBatch([
            wallet.ops.transaction('tz1gRi6XnzpBbkNGByBgxsBm1dTsA1fivSWU', 1000)
        ]);

        console.log(batch.getContents());
        console.log(batch.getEstimates());

        const signature: string = await batch.getSignature(wallet.getSecretKey());
        console.log(signature);

        wallet.send(batch, signature).then(console.log);
    }
    catch (error: any) {
        console.error(JSON.stringify(error));
    }
}


main();
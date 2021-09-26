import { Wallet, importWallet } from './src/index';


async function main(): Promise<void> {
    try {
        const mnemonic: string = 'lumber this burger comfort mirror wrap coffee release cousin duck best visual';
        const curve: 'ed25519' | 'secp256k1' | 'nistp256' = 'ed25519';
        const rpc: string = 'https://granadanet.smartpy.io/';

        const wallet: Wallet = importWallet(mnemonic, { curve, rpc });

        console.log(mnemonic);
        console.log(wallet.getSecretKey());
        console.log(wallet.getPublicKey());
        console.log(wallet.getAddress());

        const balance: number = await wallet.getBalance();
        console.log(`Balance: ${balance / 1000000}`);

        const spendableBalance: number = await wallet.getSpendableBalance('tz1gRi6XnzpBbkNGByBgxsBm1dTsA1fivSWU');
        console.log(spendableBalance);
        
        const batch = await wallet.buildOperationBatch([
            wallet.ops.transaction('tz1gRi6XnzpBbkNGByBgxsBm1dTsA1fivSWU', spendableBalance)
        ]);

        console.log(batch.getContents());
        console.log(batch.getEstimates());

        const signature: string = await wallet.signOperation(batch);
        console.log(signature);

        wallet.send(batch, signature).then(console.log);
    }
    catch (error: any) {
        console.error(JSON.stringify(error));
    }
}


main();
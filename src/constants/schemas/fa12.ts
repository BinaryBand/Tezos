const LAMBDA_ADDRESS = 'KT1XBwFrcB3tnV91AsgcSbN3nVNrrg6SkX8d';


export function transfer(source: string, destination: string, amount: string | number) { 
    return { 
        entrypoint: 'transfer',
        value: { 
            prim: 'Pair',
            args: [
                { string: source },
                { string: destination },
                { int: amount.toString() }
            ]
        }
    }
}


export function getBalance(source: string) {
    return {
        entrypoint: 'getBalance',
        value: { 
            prim: 'Pair',
            args: [
                { string: source },
                { string: LAMBDA_ADDRESS }
            ]
        }
    }
}


export const balanceQuery = [
    'metadata', 'internal_operation_results', 0, 'result', 'storage', 'int'
];


export default {
    transfer,
    getBalance,
    balanceQuery
};
const LAMBDA_ADDRESS = 'KT1LyHDYnML5eCuTEVCTynUpivwG6ns6khiG';


export function transfer(source: string, destination: string, tokenID: string | number, amount: string | number) { 
    return {
        entrypoint: "transfer",
        value: [{
            prim: "Pair",
            args: [
                { string: source },
                [{
                    prim: "Pair",
                    args: [
                        { string: destination },
                        { 
                            prim: "Pair", 
                            args: [
                                { int: tokenID.toString() },
                                { int: amount.toString() }
                            ]
                        }
                    ]
                }]
            ]
        }]
    };
}


export function balance_of(source: string, tokenID: string | number) {
    return {
        entrypoint: 'balance_of',
        value: {
            prim: 'Pair',
            args: [
                [{
                    prim: 'Pair',
                    args: [
                        { string: source },
                        { int: tokenID.toString() }
                    ]
                }],
    
                { string: LAMBDA_ADDRESS }
            ]
        }
    }
}


export const balanceQuery = [
    'metadata', 'internal_operation_results', 0, 'parameters', 'value', 0, 'args', 1, 'int'
];


export default {
    transfer,
    balance_of,
    balanceQuery
};
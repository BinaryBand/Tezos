const REQUIRED = undefined;


type schemaType = {
    kind: string,
    source?: string,
    fee?: string,
    counter?: Function | string,
    gas_limit?: Function | string,
    storage_limit?: Function | string,
    public_key?: string,
    amount?: string,
    destination?: string,
    parameters?: any,
    delegate?: string
}


const DEFAULTS = {
    counter: ({ account, index }: any) => (parseInt(account.counter, 10) + index + 1).toString(),
    gasLimit: ({ constants }: any) => constants.hard_gas_limit_per_operation,
    storageLimit: ({ constants }: any) => constants.hard_storage_limit_per_operation
};


const SCHEMAS: {[name: string]: schemaType} = {
    reveal: {
        kind: 'reveal',
        source: REQUIRED,
        fee: '0',
        counter: DEFAULTS.counter,
        gas_limit: DEFAULTS.gasLimit,
        storage_limit: DEFAULTS.storageLimit,
        public_key: REQUIRED
    },

    transaction: {
        kind: 'transaction',
        source: REQUIRED,
        fee: '0',
        counter: DEFAULTS.counter,
        gas_limit: DEFAULTS.gasLimit,
        storage_limit: DEFAULTS.storageLimit,
        amount: REQUIRED,
        destination: REQUIRED,
        parameters: undefined
    },

    delegation: {
        kind: 'delegation',
        source: REQUIRED,
        fee: '0',
        counter: DEFAULTS.counter,
        gas_limit: DEFAULTS.gasLimit,
        storage_limit: DEFAULTS.storageLimit,
        delegate: REQUIRED,
    }
};


export default SCHEMAS;


// export const ManagerOperationSchema = {
//     branch: 'branch',
//     contents: ['operation'],
// };

// export const ActivationSchema = {
//     kind: 'activation',
//     pkh: 'tz1',
//     secret: 'secret',
// };

// export const RevealSchema = {
//     source: 'pkh',
//     fee: 'zarith',
//     counter: 'zarith',
//     gas_limit: 'zarith',
//     storage_limit: 'zarith',
//     public_key: 'public_key',
// };

// export const DelegationSchema = {
//     source: 'pkh',
//     fee: 'zarith',
//     counter: 'zarith',
//     gas_limit: 'zarith',
//     storage_limit: 'zarith',
//     delegate: 'delegate',
// };

// export const TransactionSchema = {
//     source: 'pkh',
//     fee: 'zarith',
//     counter: 'zarith',
//     gas_limit: 'zarith',
//     storage_limit: 'zarith',
//     amount: 'zarith',
//     destination: 'address',
//     parameters: 'parameters',
// };

// export const OriginationSchema = {
//     source: 'pkh',
//     fee: 'zarith',
//     counter: 'zarith',
//     gas_limit: 'zarith',
//     storage_limit: 'zarith',
//     balance: 'zarith',
//     delegate: 'delegate',
//     script: 'script',
// };

// export const BallotSchema = {
//     source: 'pkh',
//     period: 'int32',
//     proposal: 'proposal',
//     ballot: 'ballotStmt',
// };

// export const EndorsementSchema = {
//     level: 'int32',
// };

// export const SeedNonceRevelationSchema = {
//     level: 'int32',
//     nonce: 'raw',
// };

// export const ProposalsSchema = {
//     source: 'pkh',
//     period: 'int32',
//     proposals: 'proposalArr',
// };
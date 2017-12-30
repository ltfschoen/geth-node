// About
// -----
// ethjs-query - query Ethereum RPC layer - https://github.com/ethjs/ethjs-query
// ethjs-account - account generation - https://github.com/ethjs/ethjs-account
// ethereumjs-tx - signing tx - https://github.com/ethereumjs/ethereumjs-tx
// ethjs-provider-signer - provider to intercept and sign tx - https://github.com/ethjs/ethjs-provider-signer
// ethjs-signer - DO NOT USE as it does not have replay protection EIP 155
//
// Setup
// -----
// npm install ethjs-query
// npm install ethjs-account
// npm install ethereumjs-tx
// npm install ethjs-provider-signer
// 
// Bugs
// ------
// https://github.com/SilentCicero/ethereumjs-accounts/issues/15#issuecomment-354555213

const EthjsAccount = require('ethjs-account');
const EthjsProviderSigner = require('ethjs-provider-signer');
const EthjsQuery = require('ethjs-query');

const ethjsAccount = EthjsAccount.generate('892h@fs8sk^2h8s8shfs.jk39hsoi@hohsko');
const ethjsAccountAddress = EthjsAccount.getAddress(ethjsAccount.privateKey);
console.log(`ethjsAccount: `, ethjsAccount);
console.log(`ethjsAccountAddress: `, ethjsAccountAddress);

const ethjsSignerProvider = new EthjsProviderSigner(GETH_IPC_PATH, {
  signTransaction: (rawTx, cb) => cb(null, EthjsSigner.sign(rawTx, ethjsAccount.privateKey)),
  accounts: (cb) => cb(null, [ethjsAccountAddress]),
});
const ethjsQueryProvider = new EthjsQuery(ethjsSignerProvider);
console.log(`ethjsSignerProvider: `, ethjsSignerProvider);
console.log(`ethjsQueryProvider: `, ethjsQueryProvider);

#!/usr/bin/env node
const Web3 = require('web3');
const net = require('net');
const solc = require('solc');
const fs = require('fs');

/**
 * Deploy Solidity contract to Private Network using Web3.js API 1.0.0-beta.xx
 * and IPC provider in Node.js to connect to Go Ethereum (Geth).
 */

const GETH_IPC_PATH = '/Users/Ls/code/blockchain/geth-node/chaindata/geth.ipc';
const GENERIC_PASSWORD_TO_ENCRYPT = 'test123456';

let web3 = new Web3();
web3.setProvider(GETH_IPC_PATH, net);
console.log(`Web3.js version: ${web3.version}`);
console.log(`OS Platform: ${process.platform}`);
console.log(`Current Provider path: `, web3.currentProvider.path);

web3.eth.isMining().then((isMining) => { console.log(`Geth is ${isMining ? '' : 'not' } mining`); });
web3.eth.getAccounts().then((accounts) => { 
  console.log(`Accounts in Private Network: ${accounts.length}`); 
});

let source = fs.readFileSync('./contracts/FixedSupplyToken.sol', 'utf8');
let compiledContract = solc.compile(source, 1);
let abi = compiledContract.contracts[':FixedSupplyToken'].interface;
// Note: Must prefix with '0x' to avoid this error whenever used:
// Unhandled rejection Error: Returned error: invalid argument 0: json: cannot unmarshal hex string without 0x prefix into Go struct field CallArgs.data of type hexutil.Bytes
let bytecode = '0x' + compiledContract.contracts[':FixedSupplyToken'].bytecode;
// console.log(source);
// console.log(compiledContract);
// console.log(abi);
// console.log(bytecode);

// Note: defaultAccount used when no `from` property specified

// Error: Returned error: invalid argument 0: json: cannot unmarshal hex string without 0x prefix into Go struct field SendTxArgs.data of type hexutil.Bytes
// Error deploying contract Error: Returned error: invalid argument 0: json: cannot unmarshal hex string without 0x prefix into Go struct field SendTxArgs.data of type hexutil.Bytes
// Unhandled rejection Error: Returned error: invalid argument 0: json: cannot unmarshal hex string without 0x prefix into Go struct field SendTxArgs.data of type hexutil.Bytes
// let actualMistAccountAddress = '0x487F2778Ec7D0747d6E26AF80148Ec471a08b339';
// web3.eth.defaultAccount = actualMistAccountAddress;
// let senderAddress = actualMistAccountAddress;

// Unhandled rejection Error: No "from" address specified in neither the given options, nor the default options.
// web3.eth.defaultAccount = web3.eth.accounts[0];
// let senderAddress = web3.eth.accounts[0];

// Reference: https://gist.github.com/frozeman/423e91f7a613be58bbbe344ba1f7f89b
Promise
  .all([
    web3.eth.net.isListening()
      .then((isListening) => { 
        console.log(`Geth Node Listening: ${isListening}`); 
      }),
    web3.eth.estimateGas({data: bytecode})
      .then((gasEstimate) => {
        console.log(`Contract gas estimate: ${gasEstimate}`);
      }),
    // http://web3js.readthedocs.io/en/1.0/web3-eth-personal.html?highlight=password#newaccount 
    web3.eth.personal.newAccount(GENERIC_PASSWORD_TO_ENCRYPT)
      .then((newAccountAddress) => {
        console.log(`Created New Account with address: ${newAccountAddress}`);
        // Error if try to deploy using this address prior
        // to mining Ether for it: `insufficient funds for gas * price + value`
        web3.eth.defaultAccount = newAccountAddress;
        console.log('New Default address set to: ', newAccountAddress);
        // Destructuring parameters
        // Try to avoid error: UnhandledPromiseRejectionWarning: Unhandled promise rejection

        return Promise.resolve(newAccountAddress);
      }),
    // Coinbase Address may be created prior in MIST with GENERIC_PASSWORD_TO_ENCRYPT
    // https://web3js.readthedocs.io/en/1.0/web3-eth-personal.html
    // http://web3js.readthedocs.io/en/1.0/web3-eth.html#getaccounts
    web3.eth.getCoinbase()
      .then((coinbaseAddress) => { 
        console.log(`Coinbase Address: `, coinbaseAddress);
        return Promise.resolve(coinbaseAddress)
      })
  ])
  .then(( res ) => {
    console.log(`Promise.all resolved with: `, res);
    let newAccountAddress = res[2];
    let coinbaseAddress = res[3];

    // Unlock the account for x seconds to overcome error when deploying:
    // `authentication needed: password or unlock`
    const isUnlockedNewAccountAddress = web3.eth.personal.unlockAccount(newAccountAddress, GENERIC_PASSWORD_TO_ENCRYPT, 15000)

    const isUnlockedCoinbaseAddress = web3.eth.personal.unlockAccount(coinbaseAddress, GENERIC_PASSWORD_TO_ENCRYPT, 15000)

    web3.eth.getBalance(coinbaseAddress)
      .then((coinbaseAddressBalance) => {
        console.log(`Coinbase Address Balance: `, coinbaseAddressBalance);
      })
    
    let senderAddress = coinbaseAddress;

    return Promise.all([senderAddress, isUnlockedNewAccountAddress, isUnlockedCoinbaseAddress]);
  })
  .then(( res ) => {
    console.log(`Promise.all resolved with: `, res);
    let senderAddress = res[0];
    console.log(`Creating contract instance defined in JSON interface object`);
    // http://web3js.readthedocs.io/en/1.0/web3-eth-contract.html
    let FSTContract = new web3.eth.Contract(JSON.parse(abi));
    // console.log(`Contract options: `, JSON.stringify(FSTContract.options, null, 2));
    FSTContract.options.from = senderAddress;
    FSTContract.options.gasPrice = '30000000000000'; // Default gas price in wei
    FSTContract.options.gas = 5000000; // Fallback
    return Promise.resolve([FSTContract, senderAddress]);
  })
  .then(( [FSTContract, senderAddress] ) => {
    console.log(`Promise resolved with FSTContract, and senderAddress: `, senderAddress);
    let uniqueContractId = '0x7000000000000000000000000000000000000000000000000000000000000000';
    // Deploy contract to blockchain. Address is published when mined. 
    // References: https://gist.github.com/frozeman/655a9325a93ac198416e
    FSTContract
      .deploy({
        // Bytecode of the contract
        data: bytecode,
        // Arguments passed to contract constructor on deployment
        arguments: [uniqueContractId]
      })
      // // Unhandled rejection TypeError: FSTContract.deploy(...).estimateGas(...).send is not a function
      // .estimateGas(function(err, gas){
      //   console.log(`Contract gas estimate: ${gas}`);
      // })
      // Error: No "from" address specified in neither the given options, nor the default options.
      .send({
        // Web3.js 1.0.0-beta has not finished implementing Unlock
        // http://web3js.readthedocs.io/en/1.0/web3-eth-personal.html?highlight=unlock
        // Error: Returned error: authentication needed: password or unlock
        from: senderAddress,
        gas: 1500000,
        gasPrice: '30000000000000'
      }, (error, transactionHash) => { 
        if (error) {
          console.log(`Error sending transaction: `, error); 
        }
      })
      // PromiEvents to watch for events
      .on('error', (error) => { 
        console.log(`Error deploying contract ${error}`); 
      })
      .on('transactionHash', (transactionHash) => {
        console.log(`Successfully submitted contract creation. Transaction hash: ${transactionHash}`); 
      })
      .on('receipt', (receipt) => {
        console.log(`Receipt after mining with contract address: ${receipt.contractAddress}`); 
        console.log(`Receipt after mining with events: ${JSON.stringify(receipt.events, null, 2)}`); 
      })
      .on('confirmation', (confirmationNumber, receipt) => { 
        console.log(`Confirmation no. and receipt: `, confirmationNumber, receipt); 
      })
      .then((newContractInstance) => {
        console.log(`Contract instance with address: `, newContractInstance.options.address);

        console.log(`Current Provider path: `, web3.currentProvider.path);

        web3.eth.getBlockNumber()
          .then((createdAtBlock) => {
            console.log(`Contract instance created at block number: ${createdAtBlock}`); 
          });

        // TODO - Batch request - http://web3js.readthedocs.io/en/1.0/web3-eth-personal.html?highlight=unlock#batchrequest

        // Call a `constant` method 
        // Reference: http://web3js.readthedocs.io/en/1.0/web3-eth-contract.html#methods-mymethod-call
        newContractInstance.methods.totalSupply()
          .call({
            from: senderAddress
          })
          .then((totalSupplyOfTokens) => { 
            console.log(`Total supply of contract tokens: ${totalSupplyOfTokens}`); 
          })
          .catch((error) => {
            console.log(`Error with Total supply of contract: ${error}`);
          })

        newContractInstance.methods.balanceOf(senderAddress)
          .call({
            from: senderAddress
          })
          .then((balanceOfAddress) => {
            console.log(`Balance of sender address: ${balanceOfAddress}`);
          })
          .catch((error) => {
            console.log(`Error with Balance of sender address: ${error}`);
          })

        // Event Listener
        // http://web3js.readthedocs.io/en/1.0/web3-eth-contract.html#events
        // http://web3js.readthedocs.io/en/1.0/web3-eth-contract.html#id20
        // http://web3js.readthedocs.io/en/1.0/web3-eth-contract.html#contract-events-return
        // Deprecated - https://gist.github.com/frozeman/655a9325a93ac198416e
        
        // Subscribe and fire upon single event. Unsubscribe after first event or error.
        // http://web3js.readthedocs.io/en/1.0/web3-eth-contract.html#once
        newContractInstance.once('Created', {
            fromBlock: 0
          },
          (error, createdEvent) => {
            if (!error) {
              console.log(`Once event received event: `, createdEvent); 
            } else {
              console.log(`Error - Once event: ${error}`);
            }
          });

        // Receives all events from this smart contract. 
        // Optionally the filter property can filter those events
        // http://web3js.readthedocs.io/en/1.0/web3-eth-contract.html#events-allevents
        newContractInstance.events.allEvents({
            fromBlock: 0
          },
          (error, allEvents) => {
            if (!error) {
              console.log(`All events received event: `, event);
            } else {
              console.log(`Error - All events: ${error}`);
            }
          });

        // Gets past events for contract returned as an array of past event Objects
        // matching the given event name and filter
        newContractInstance.getPastEvents('Created', {
            fromBlock: 0,
            toBlock: 'latest'
          })
          .then((events) => {
            console.log(`Get past events received event: `, events);
          }).catch((error) => {
            console.log(`Error - Get past events: ${error}`);
          });

        // Subscriptions to an event
        // http://web3js.readthedocs.io/en/1.0/web3-eth-contract.html#contract-events
        newContractInstance.events.Created({
            // filter: {
            //   myIndexedParam: [20,23], // array means OR (i.e. 20 or 23)
            //   myOtherIndexedParam: '0x123456789...'
            // },
            fromBlock: 0
          },
          (error, createdEvent) => {
            if (!error) {
              console.log(`Subscription to Created event received event: `, event);
            } else {
              console.log(`Error with Created event: ${error}`);
            }
          })
          // Event Emitter events
          // http://web3js.readthedocs.io/en/1.0/web3-eth-contract.html#contract-events-return
          // .on('data', (event) => {
          //   console.log(`Subscription to Created event received event: `, event); // Same results as optional callback above
          // })
          .on('changed', (event) => {
            // Remove event from local database
            console.log(`Subscription to Created event received 'changed' event: `, event);
          })
          .on('error', (error) => { 
            console.error(`Error listening to Created event: ${error}`); 
          });

        newContractInstance.events.Approval({
            fromBlock: 0
          },
          (error, createdEvent) => {
            if (!error) {
              console.log(`Subscription to Approval event received event: `, event);
            } else {
              console.log(`Error with Approval event: ${error}`);
            }
          })
          .on('changed', (event) => {
            console.log(`Subscription to Approval event received 'changed' event: `, event);
          })
          .on('error', (error) => { 
            console.error(`Error listening to Approval event: ${error}`); 
          });

        // Subscriptions - http://web3js.readthedocs.io/en/1.0/web3-eth-subscribe.html#
        let subscriptionToPendingTransactions = web3.eth.subscribe('pendingTransactions', 
          (error, transaction) => {
            if (!error) {
              console.log(`Subscription - Pending Transaction: `, transaction);
            } else {
              console.log(`Error - Subscription - Pending Transaction: ${error}`);
            }
          })
          .on('data', function(transaction) {
            console.log(`Subscription - Pending Transaction Data: `, transaction);
          });

        let subscriptionToLogs = web3.eth.subscribe('logs', {
            address: senderAddress,
            topics: [null]
          },
          (error, log) => {
            if (!error) {
              console.log(`Subscription - Log: `, log); 
            } else {
              console.log(`Error - Subscription - Log:: ${error}`);
            }
          })
          .on("data", function(log) {
            console.log(`Subscription - Log Data: `, log);
          })
          .on("changed", function(log) {
            console.log(`Subscription - Log Changed: `, log);
          });

        return Promise.resolve("done");
        // process.exit();
      });
  })
  .catch((error) => {
    // log that I have an error, return the entire array;
    console.log(`Promise failed to resolve: `, error.message);
    return Promise.reject('Promise failed to resolve');
  })

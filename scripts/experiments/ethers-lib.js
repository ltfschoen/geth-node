// About
// -----
// ethers - for wallet creation - https://github.com/ethers-io/ethers.js/
// 
// Setup
// -----
// npm install ethers

const ethers = require('ethers');

let PRIVATE_KEY = '0x3141592653589793238462643383279502884197169399375105820974944592';
let wallet = new ethers.Wallet(PRIVATE_KEY);
console.log(`Wallet is: `, wallet);
console.log(`Wallet address is: `, wallet.address);
console.log(`Wallet privateKey is: `, wallet.privateKey);

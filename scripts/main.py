import json
import web3
import solc

from sys import platform
from web3 import Web3, IPCProvider
from solc import compile_files, compile_standard

from web3.contract import ConciseContract

GETH_IPC_PATH = '/Users/Ls/code/blockchain/geth-node/chaindata/geth.ipc'
GENERIC_PASSWORD_TO_ENCRYPT = 'test123456'

# web3.py instance
web3 = Web3(IPCProvider(GETH_IPC_PATH))
print('OS Platform: {}'.format(platform))

# Compile source code from file
# Reference: https://github.com/ethereum/py-solc

# Legacy Combined JSON Compilation - https://github.com/ethereum/py-solc#legacy-combined-json-compilation
# compiled_sol = compile_files(["./contracts/FixedSupplyToken.sol"])

# Standard JSON Compilation - https://github.com/ethereum/py-solc#standard-json-compilation
compiled_sol = compile_standard({
  "language": "Solidity",
  "sources": {
    "FixedSupplyToken.sol": {
      "urls": ["file:///Users/Ls/code/blockchain/geth-node/contracts/FixedSupplyToken.sol"]
    }
  }
}, allow_paths="file:///Users/Ls/code/blockchain/geth-node/contracts/")

contract_interface = compiled_sol['<stdin>:FixedSupplyToken']

# Instantiate and deploy contract
contract = w3.eth.contract(abi=contract_interface['abi'], bytecode=contract_interface['bin'])

# Get transaction hash from deployed contract
tx_hash = contract.deploy(transaction={'from': web3.eth.accounts[0], 'gas': 410000})

# Get tx receipt to get contract address
tx_receipt = web3.eth.getTransactionReceipt(tx_hash)
contract_address = tx_receipt['contractAddress']

# Contract instance in concise mode
contract_instance = w3.eth.contract(contract_interface['abi'], contract_address, ContractFactoryClass=ConciseContract)

# Getters for web3.eth.contract object
print('Contract totalSupply value: {}'.format(contract_instance.totalSupply()))
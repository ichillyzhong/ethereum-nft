# Hardhat Project

This project demonstrates how to mint NFT with Hardhat. 

## Setup:

```bash
npm init -y
npm install hardhat@^2.22.0 @nomicfoundation/hardhat-toolbox@^4.0.0 @openzeppelin/contracts
npx hardhat init
```

## Try running some of the following tasks:

```shell
# compile smart contract
npx hardhat compile

# run test files
npx hardhat test

# run hardhat node
npx hardhat node

# deploy smart contract
npx hardhat run scripts/deploy.js
```

## Generate go file
```shell
jq '.abi' hardhat/artifacts/contracts/MyNFT.sol/MyNFT.json > hardhat/MyNFT_abi.json
cd hardhat/
abigen --abi MyNFT_abi.json --pkg main --out MyNFT.go
mv MyNFT.go nft-backend/
rm MyNFT_abi.json
```
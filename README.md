# Ethereum NFT Project

A complete Ethereum NFT project including smart contracts, backend services, and frontend application.

## Project Structure

- **hardhat/** - Contains MyNFT smart contract development and deployment
- **nft-backend/** - Contains Go backend service interfaces for minting and querying NFTs
- **nft-frontend/** - React-based NFT minting and management frontend application

## Features

- ✅ ERC721 NFT Smart Contract
- ✅ NFT Minting Functionality
- ✅ IPFS Metadata Storage
- ✅ Go Backend API Service
- ✅ React Frontend Application
- ✅ MetaMask Wallet Integration
- ✅ Responsive UI Design
- ✅ Local Development Environment Support

## Technology Stack

- **Smart Contracts**: Solidity, Hardhat, OpenZeppelin
- **Backend Service**: Go, go-ethereum, IPFS
- **Frontend Application**: React 19, Wagmi, TailwindCSS, MetaMask
- **Blockchain**: Ethereum (Local Test Network)

## Quick Start

### Prerequisites

- Node.js (v16+)
- Go (v1.19+)
- IPFS
- MetaMask Browser Extension
- Git

### 1. Clone Project

```bash
git clone <repository-url>
cd ethereum-nft
```

### 2. Install Dependencies

#### Install Hardhat Dependencies
```bash
cd hardhat
npm install
```

#### Install Go Dependencies
```bash
cd ../nft-backend
go mod tidy
```

#### Install Frontend Dependencies
```bash
cd ../nft-frontend
npm install
```

### 3. Start IPFS Node

```bash
# If using IPFS for the first time
ipfs init

# Start IPFS daemon
ipfs daemon
```

### 4. Start Hardhat Local Network

```bash
cd hardhat
npx hardhat node
```

This will start a local Ethereum test network and display test accounts and private keys.

### 5. Deploy Smart Contract

In a new terminal window:

```bash
cd hardhat
npx hardhat run scripts/deploy.js --network localhost
```

Record the deployed contract address, which will be needed in the Go backend.

### 6. Update Contract Address

Update the contract address in `nft-backend/main.go`:

```go
contractAddr = common.HexToAddress("YOUR_DEPLOYED_CONTRACT_ADDRESS")
```

### 7. Start Go Backend Service

```bash
cd nft-backend
go run .
```

The service will start at `http://localhost:8080`.

### 8. Start Frontend Application

In a new terminal window:

```bash
cd nft-frontend
npm start
```

The frontend application will start at `http://localhost:3000`.

## Usage

### Method 1: Using Frontend Application (Recommended)

1. Open browser and visit `http://localhost:3000`
2. Click "Connect MetaMask" button
3. Add Hardhat local network in MetaMask:
   - Network Name: Hardhat Local
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: 31337
   - Currency Symbol: ETH
4. Import test account private key to MetaMask
5. Click "Mint NFT" button
6. Confirm transaction in MetaMask
7. View the minted NFT

### Method 2: Using API Interface

#### Mint NFT

```bash
curl -X POST http://localhost:8080/mint \
  -H "Content-Type: application/json" \
  -d '{
    "toAddress": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    "metadata": "{\"name\":\"My NFT\",\"description\":\"A test NFT\",\"image\":\"https://example.com/image.png\"}"
  }'
```

**Response Example:**
```json
{
  "message": "Minting transaction sent",
  "txHash": "0x...",
  "tokenURI": "ipfs://QmXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
}
```

#### Query NFT

```bash
curl http://localhost:8080/nfts/0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
```

## Test Accounts

Default test accounts provided by Hardhat:

- Account #0: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- Account #1: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
- Account #2: `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`

Each account has a test balance of 10000 ETH.

## Troubleshooting

### 1. "Sender doesn't have enough funds" Error

Ensure:
- Hardhat node is running
- Using correct private key (corresponding to test account with balance)
- Contract address is correct

### 2. IPFS Connection Error

Ensure IPFS daemon is running:
```bash
ipfs daemon
```

### 3. Contract Call Failure

Ensure:
- Contract is properly deployed
- Contract address is correctly configured in Go code
- Network connection is normal

## Development Notes

- Smart contract based on OpenZeppelin's ERC721 standard
- Metadata stored on IPFS
- Go backend uses go-ethereum library to interact with blockchain
- React frontend uses Wagmi library to interact with MetaMask
- Supports local development and testing environment
- Frontend features zero-flicker rendering and optimized state management

## Project Architecture

```
User Interface (React + MetaMask)
        ↓
Backend API Service (Go)
        ↓
Smart Contract (Solidity)
        ↓
Ethereum Blockchain (Hardhat Local Network)
        ↓
IPFS Storage (Metadata)
```

## License

MIT License


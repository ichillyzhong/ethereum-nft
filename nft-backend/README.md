# nft-backend
A NFT backend service written in Go to mint/query NFTs.

## How to install dependencies
```bash
go mod init
go mod tidy

brew install ipfs
```

## How to run
```bash
# start hardhat node (we use account#0 as toAddress)
npx hardhat node

# start ipfs server
ipfs daemon

# start go service for to mint and query nft
go run .

# request to mint nft
curl -X POST http://localhost:8080/mint \
  -H "Content-Type: application/json" \
  -d '{"toAddress":"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266","metadata":"{\"name\":\"Test NFT\",\"description\":\"A test NFT\",\"image\":\"https://via.placeholder.com/300\"}"}'

# list all nfts
curl http://localhost:8080/nfts 

# query nft by toAddress
curl http://localhost:8080/nfts/{toAddress}
```
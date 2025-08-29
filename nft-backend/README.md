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
export ACCOUNT0_ADDR="0x..."
curl -X POST http://localhost:8080/mint \
  -H "Content-Type: application/json" \
  -d '{"toAddress":"'"$ACCOUNT0_ADDR"'","metadata":"{\"name\":\"Test NFT\",\"description\":\"A test NFT\",\"image\":\"https://via.placeholder.com/300\"}"}'

# list all nfts
curl http://localhost:8080/nfts 

# query nft by toAddress
curl http://localhost:8080/nfts/{toAddress}
```
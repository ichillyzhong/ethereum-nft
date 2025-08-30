package main

import (
	"context"
	"crypto/ecdsa"
	"encoding/json"
	"fmt"
	"log"
	"math/big"
	"net/http"
	"os"
	"strings"

	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/gorilla/mux"
	"github.com/rs/cors"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"

	shell "github.com/ipfs/go-ipfs-api"
)

// Define JSON struct for API requests
type MintRequest struct {
	ToAddress string `json:"toAddress"`
	Metadata  string `json:"metadata"`
}

// Define NFT metadata struct
type NFTMetadata struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Image       string `json:"image"`
}

// Transfer event struct for parsing event logs
type TransferEvent struct {
	From    common.Address
	To      common.Address
	TokenId *big.Int
}

// NFT gorm model
type NFT struct {
	gorm.Model
	TokenID         string `gorm:"uniqueIndex"` // Unique ID of the NFT
	Owner           string // Address of the NFT owner
	TokenURI        string // Metadata link
	TransactionHash string // Transaction hash that minted this NFT
}

// Global variables for convenient access across functions
var (
	client               *ethclient.Client
	ipfsShell            *shell.Shell
	privateKey           *ecdsa.PrivateKey
	contractAddr         common.Address
	contractInstance     *Main
	db                   *gorm.DB
	transferEventSigHash common.Hash
)

// Environment variables
var (
	nft_contract_addr = os.Getenv("NFT_CONTRACT_ADDR")
	evm_private_key   = os.Getenv("EVM_PRIVATE_KEY") // without 0x prefix
)

// mintHandler handles HTTP requests for minting NFTs
func mintHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Only POST requests are supported", http.StatusMethodNotAllowed)
		return
	}

	var req MintRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// 1. Upload metadata to IPFS
	// Use the metadata field from the request directly as content
	cid, err := ipfsShell.Add(strings.NewReader(req.Metadata))
	if err != nil {
		log.Printf("Unable to upload to IPFS: %v", err)
		http.Error(w, "Unable to upload metadata to IPFS", http.StatusInternalServerError)
		return
	}
	tokenURI := "ipfs://" + cid

	// 2. Prepare transaction information
	publicKey := privateKey.Public()
	publicKeyECDSA, ok := publicKey.(*ecdsa.PublicKey)
	if !ok {
		log.Printf("Unable to convert public key")
		http.Error(w, "Unable to convert public key", http.StatusInternalServerError)
		return
	}
	nonce, err := client.PendingNonceAt(context.Background(), crypto.PubkeyToAddress(*publicKeyECDSA))
	if err != nil {
		log.Printf("Unable to get Nonce: %v", err)
		http.Error(w, "Unable to get Nonce", http.StatusInternalServerError)
		return
	}
	gasPrice, err := client.SuggestGasPrice(context.Background())
	if err != nil {
		log.Printf("Unable to get Gas Price: %v", err)
		http.Error(w, "Unable to get Gas Price", http.StatusInternalServerError)
		return
	}

	auth := bind.NewKeyedTransactor(privateKey)
	auth.Nonce = big.NewInt(int64(nonce))
	auth.Value = big.NewInt(0)
	auth.GasLimit = uint64(300000)
	auth.GasPrice = gasPrice

	// 3. Call the contract's mintNFT function
	toAddress := common.HexToAddress(req.ToAddress)
	tx, err := contractInstance.MintNFT(auth, toAddress, tokenURI)
	if err != nil {
		log.Printf("Unable to initiate minting transaction: %v", err)
		http.Error(w, fmt.Sprintf("Unable to initiate minting transaction: %v", err), http.StatusInternalServerError)
		return
	}

	// 4. Wait for transaction to be mined
	_, err = bind.WaitMined(context.Background(), client, tx)
	if err != nil {
		log.Printf("Transaction not mined: %v", err)
		http.Error(w, "Transaction not mined", http.StatusInternalServerError)
		return
	}

	log.Printf("Minting transaction successfully mined, hash: %s", tx.Hash().Hex())

	w.WriteHeader(http.StatusOK)
	response := map[string]string{
		"message":  "Minting transaction sent",
		"txHash":   tx.Hash().Hex(),
		"tokenURI": tokenURI,
	}
	json.NewEncoder(w).Encode(response)
}

func initServices() {
	var err error

	// Connect to Ethereum node
	client, err = ethclient.Dial("ws://127.0.0.1:8545")
	if err != nil {
		log.Fatalf("Unable to connect to Ethereum node: %v", err)
	}
	log.Println("Successfully connected to Ethereum node!")

	// Connect to local IPFS node
	ipfsShell = shell.NewShell("localhost:5001")
	log.Println("Successfully connected to IPFS node!")

	// Connect to SQLite database
	db, err = gorm.Open(sqlite.Open("nfts.db"), &gorm.Config{})
	if err != nil {
		log.Fatalf("Unable to connect to database: %v", err)
	}
	log.Println("Successfully connected to database!")

	// Auto migrate (create or update table structure)
	db.AutoMigrate(&NFT{})
	log.Println("Database tables auto-migrated!")

	// Parse contract ABI
	parsedABI, err := abi.JSON(strings.NewReader(MainMetaData.ABI))
	if err != nil {
		log.Fatalf("Unable to parse ABI: %v", err)
	}

	// Get Transfer event signature hash
	transferEventSigHash = parsedABI.Events["Transfer"].ID
	log.Println("Successfully parsed Transfer event signature hash!")

	// Warning: This private key is for demonstration only, do not use in production!
	// Hardhat test account #0 private key (without 0x prefix)
	privateKey, err = crypto.HexToECDSA(evm_private_key)
	if err != nil {
		log.Fatal(err)
	}

	// Ensure this contract address is your deployed address
	contractAddr = common.HexToAddress(nft_contract_addr)
	contractInstance, err = NewMain(contractAddr, client)
	if err != nil {
		log.Fatalf("Unable to create contract instance: %v", err)
	}
}

func startEventSync(client *ethclient.Client, contractAddr common.Address) {
	// Set filter conditions
	query := ethereum.FilterQuery{
		Addresses: []common.Address{contractAddr},
		Topics:    [][]common.Hash{{transferEventSigHash}},
	}

	// Establish real-time subscription
	logs := make(chan types.Log)
	sub, err := client.SubscribeFilterLogs(context.Background(), query, logs)
	if err != nil {
		log.Fatal(err)
	}
	defer sub.Unsubscribe()

	log.Println("Started listening for Transfer events...")

	for {
		select {
		case err := <-sub.Err():
			log.Println("Subscription error:", err)
		case vLog := <-logs:
			// Iterate and process all new logs
			if len(vLog.Topics) != 4 {
				log.Printf("Event log topics count incorrect, skipping, hash: %s", vLog.TxHash.Hex())
				continue
			}

			transferEvent := TransferEvent{}
			transferEvent.From = common.HexToAddress(vLog.Topics[1].Hex())
			transferEvent.To = common.HexToAddress(vLog.Topics[2].Hex())
			transferEvent.TokenId = vLog.Topics[3].Big()

			handleTransferEvent(transferEvent, vLog.TxHash.Hex())
		}
	}
}

// handleTransferEvent processes and saves Transfer events to database
func handleTransferEvent(event TransferEvent, txHash string) {
	if event.From == common.HexToAddress("0x0000000000000000000000000000000000000000") {
		log.Printf("Mint event found! TokenID: %s, Recipient: %s", event.TokenId.String(), event.To.Hex())

		// Fix: Call the correct TokenURI method
		tokenURI, err := contractInstance.TokenURI(&bind.CallOpts{}, event.TokenId)
		if err != nil {
			log.Printf("Unable to get TokenURI: %v", err)
			return
		}

		newNFT := NFT{
			TokenID:         event.TokenId.String(),
			Owner:           strings.ToLower(event.To.Hex()),
			TokenURI:        tokenURI,
			TransactionHash: txHash,
		}

		result := db.Create(&newNFT)
		if result.Error != nil {
			log.Printf("Failed to save new NFT to database: %v", result.Error)
		} else {
			log.Printf("New NFT successfully saved to database, TokenID: %s", newNFT.TokenID)
		}
	} else {
		log.Printf("Transfer event found! TokenID: %s, from %s to %s", event.TokenId.String(), event.From.Hex(), event.To.Hex())

		var nft NFT
		result := db.Where("token_id = ?", event.TokenId.String()).First(&nft)

		if result.Error == gorm.ErrRecordNotFound {
			log.Printf("NFT record not found in database, TokenID: %s, possibly historical event", event.TokenId.String())
		} else if result.Error != nil {
			log.Printf("Database query error: %v", result.Error)
		} else {
			db.Model(&nft).Update("owner", event.To.Hex())
			log.Printf("NFT owner updated! TokenID: %s, New owner: %s", nft.TokenID, event.To.Hex())
		}
	}
}

func getAllNFTsHandler(w http.ResponseWriter, r *http.Request) {
	// Get all NFTs
	var nfts []NFT
	result := db.Find(&nfts)
	if result.Error != nil {
		log.Printf("查询数据库错误: %v", result.Error)
		http.Error(w, "无法获取NFT列表", http.StatusInternalServerError)
		return
	}

	// Return results in JSON format
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(nfts)
}

func getNftsByAddressHandler(w http.ResponseWriter, r *http.Request) {
	// Get address from URL parameters
	vars := mux.Vars(r)
	address := strings.ToLower(vars["address"])

	var nfts []NFT
	result := db.Where("owner = ?", address).Find(&nfts)
	if result.Error != nil {
		log.Printf("查询数据库错误: %v", result.Error)
		http.Error(w, "无法获取NFT列表", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(nfts)
}

func main() {
	initServices()

	// Start a goroutine to listen for on-chain events
	go startEventSync(client, contractAddr)

	// Create a new router
	router := mux.NewRouter()

	// Register routes
	router.HandleFunc("/mint", mintHandler).Methods("POST")
	router.HandleFunc("/nfts", getAllNFTsHandler).Methods("GET")
	router.HandleFunc("/nfts/{address}", getNftsByAddressHandler).Methods("GET")

	// Configure CORS
	c := cors.New(cors.Options{
		AllowedOrigins: []string{"*"}, // Allow all origins, should specify specific domains in production
		AllowedMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders: []string{"*"},
		AllowCredentials: true,
	})

	// Wrap router with CORS middleware
	handler := c.Handler(router)

	log.Println("Go backend service started on :8080")
	log.Fatal(http.ListenAndServe(":8080", handler))
}

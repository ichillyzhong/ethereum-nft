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

// 定义API请求的JSON结构体
type MintRequest struct {
	ToAddress string `json:"toAddress"`
	Metadata  string `json:"metadata"`
}

// 定义NFT元数据结构体
type NFTMetadata struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Image       string `json:"image"`
}

// Transfer事件的结构体，用于解析事件日志
type TransferEvent struct {
	From    common.Address
	To      common.Address
	TokenId *big.Int
}

// NFT gorm模型
type NFT struct {
	gorm.Model
	TokenID         string `gorm:"uniqueIndex"` // NFT的唯一ID
	Owner           string // NFT所有者的地址
	TokenURI        string // 元数据链接
	TransactionHash string // 铸造该NFT的交易哈希
}

// 全局变量，用于方便在各个函数中访问
var (
	client               *ethclient.Client
	ipfsShell            *shell.Shell
	privateKey           *ecdsa.PrivateKey
	contractAddr         common.Address
	contractInstance     *Main
	db                   *gorm.DB
	transferEventSigHash common.Hash
)

// 环境变量
var (
	nft_contract_addr = os.Getenv("NFT_CONTRACT_ADDR")
	evm_private_key   = os.Getenv("EVM_PRIVATE_KEY") // 没有0x
)

// mintHandler 处理铸造NFT的HTTP请求
func mintHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "只支持 POST 请求", http.StatusMethodNotAllowed)
		return
	}

	var req MintRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// 1. 上传元数据到 IPFS
	// 这里直接使用请求中的metadata字段作为内容
	cid, err := ipfsShell.Add(strings.NewReader(req.Metadata))
	if err != nil {
		log.Printf("无法上传到IPFS: %v", err)
		http.Error(w, "无法上传元数据到IPFS", http.StatusInternalServerError)
		return
	}
	tokenURI := "ipfs://" + cid

	// 2. 准备交易信息
	publicKey := privateKey.Public()
	publicKeyECDSA, ok := publicKey.(*ecdsa.PublicKey)
	if !ok {
		log.Printf("无法转换公钥")
		http.Error(w, "无法转换公钥", http.StatusInternalServerError)
		return
	}
	nonce, err := client.PendingNonceAt(context.Background(), crypto.PubkeyToAddress(*publicKeyECDSA))
	if err != nil {
		log.Printf("无法获取Nonce: %v", err)
		http.Error(w, "无法获取Nonce", http.StatusInternalServerError)
		return
	}
	gasPrice, err := client.SuggestGasPrice(context.Background())
	if err != nil {
		log.Printf("无法获取Gas Price: %v", err)
		http.Error(w, "无法获取Gas Price", http.StatusInternalServerError)
		return
	}

	auth := bind.NewKeyedTransactor(privateKey)
	auth.Nonce = big.NewInt(int64(nonce))
	auth.Value = big.NewInt(0)
	auth.GasLimit = uint64(300000)
	auth.GasPrice = gasPrice

	// 3. 调用合约的 mintNFT 函数
	toAddress := common.HexToAddress(req.ToAddress)
	tx, err := contractInstance.MintNFT(auth, toAddress, tokenURI)
	if err != nil {
		log.Printf("无法发起铸造交易: %v", err)
		http.Error(w, fmt.Sprintf("无法发起铸造交易: %v", err), http.StatusInternalServerError)
		return
	}

	// 4. 等待交易被打包
	_, err = bind.WaitMined(context.Background(), client, tx)
	if err != nil {
		log.Printf("交易未被打包: %v", err)
		http.Error(w, "交易未被打包", http.StatusInternalServerError)
		return
	}

	log.Printf("铸造交易已成功打包, 哈希: %s", tx.Hash().Hex())

	w.WriteHeader(http.StatusOK)
	response := map[string]string{
		"message":  "铸造交易已发送",
		"txHash":   tx.Hash().Hex(),
		"tokenURI": tokenURI,
	}
	json.NewEncoder(w).Encode(response)
}

func initServices() {
	var err error

	// 连接到以太坊节点
	client, err = ethclient.Dial("ws://127.0.0.1:8545")
	if err != nil {
		log.Fatalf("无法连接到以太坊节点: %v", err)
	}
	log.Println("成功连接到以太坊节点!")

	// 连接到本地IPFS节点
	ipfsShell = shell.NewShell("localhost:5001")
	log.Println("成功连接到IPFS节点!")

	// 连接到SQLite数据库
	db, err = gorm.Open(sqlite.Open("nfts.db"), &gorm.Config{})
	if err != nil {
		log.Fatalf("无法连接到数据库: %v", err)
	}
	log.Println("成功连接到数据库!")

	// 自动迁移（创建或更新表结构）
	db.AutoMigrate(&NFT{})
	log.Println("数据库表已自动迁移！")

	// 解析合约ABI
	parsedABI, err := abi.JSON(strings.NewReader(MainMetaData.ABI))
	if err != nil {
		log.Fatalf("无法解析ABI: %v", err)
	}

	// 获取Transfer事件的签名哈希
	transferEventSigHash = parsedABI.Events["Transfer"].ID
	log.Println("成功解析Transfer事件签名哈希！")

	// 警告：这里的私钥只是为了演示，请勿在生产环境中使用！
	// Hardhat 测试账户 #0 的私钥（不带0x）
	privateKey, err = crypto.HexToECDSA(evm_private_key)
	if err != nil {
		log.Fatal(err)
	}

	// 确保这个合约地址是你的部署地址
	contractAddr = common.HexToAddress(nft_contract_addr)
	contractInstance, err = NewMain(contractAddr, client)
	if err != nil {
		log.Fatalf("无法创建合约实例: %v", err)
	}
}

func startEventSync(client *ethclient.Client, contractAddr common.Address) {
	// 设置过滤条件
	query := ethereum.FilterQuery{
		Addresses: []common.Address{contractAddr},
		Topics:    [][]common.Hash{{transferEventSigHash}},
	}

	// 建立一个实时订阅
	logs := make(chan types.Log)
	sub, err := client.SubscribeFilterLogs(context.Background(), query, logs)
	if err != nil {
		log.Fatal(err)
	}
	defer sub.Unsubscribe()

	log.Println("开始监听 Transfer 事件...")

	for {
		select {
		case err := <-sub.Err():
			log.Println("订阅错误:", err)
		case vLog := <-logs:
			// 遍历并处理所有新日志
			if len(vLog.Topics) != 4 {
				log.Printf("事件日志topics数量不正确，跳过，哈希: %s", vLog.TxHash.Hex())
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

// handleTransferEvent 处理并保存 Transfer 事件到数据库
func handleTransferEvent(event TransferEvent, txHash string) {
	if event.From == common.HexToAddress("0x0000000000000000000000000000000000000000") {
		log.Printf("发现铸造事件！TokenID: %s, 接收者: %s", event.TokenId.String(), event.To.Hex())

		// 修正: 调用正确的 TokenURI 方法
		tokenURI, err := contractInstance.TokenURI(&bind.CallOpts{}, event.TokenId)
		if err != nil {
			log.Printf("无法获取TokenURI: %v", err)
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
			log.Printf("保存新NFT到数据库失败: %v", result.Error)
		} else {
			log.Printf("新NFT已成功保存到数据库，TokenID: %s", newNFT.TokenID)
		}
	} else {
		log.Printf("发现转移事件！TokenID: %s, 从 %s 到 %s", event.TokenId.String(), event.From.Hex(), event.To.Hex())

		var nft NFT
		result := db.Where("token_id = ?", event.TokenId.String()).First(&nft)

		if result.Error == gorm.ErrRecordNotFound {
			log.Printf("数据库中未找到NFT记录，TokenID: %s，可能为历史事件", event.TokenId.String())
		} else if result.Error != nil {
			log.Printf("查询数据库错误: %v", result.Error)
		} else {
			db.Model(&nft).Update("owner", event.To.Hex())
			log.Printf("NFT所有者已更新！TokenID: %s, 新拥有者: %s", nft.TokenID, event.To.Hex())
		}
	}
}

func getAllNFTsHandler(w http.ResponseWriter, r *http.Request) {
	// 获取所有NFTs
	var nfts []NFT
	result := db.Find(&nfts)
	if result.Error != nil {
		log.Printf("查询数据库错误: %v", result.Error)
		http.Error(w, "无法获取NFT列表", http.StatusInternalServerError)
		return
	}

	// 将结果以JSON格式返回
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(nfts)
}

func getNftsByAddressHandler(w http.ResponseWriter, r *http.Request) {
	// 从 URL 参数中获取地址
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

	// 启动一个goroutine来监听链上事件
	go startEventSync(client, contractAddr)

	// 创建一个新的路由器
	router := mux.NewRouter()

	// 注册路由
	router.HandleFunc("/mint", mintHandler).Methods("POST")
	router.HandleFunc("/nfts", getAllNFTsHandler).Methods("GET")
	router.HandleFunc("/nfts/{address}", getNftsByAddressHandler).Methods("GET")

	// 配置CORS
	c := cors.New(cors.Options{
		AllowedOrigins: []string{"*"}, // 允许所有来源，生产环境中应该指定具体域名
		AllowedMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders: []string{"*"},
		AllowCredentials: true,
	})

	// 使用CORS中间件包装路由器
	handler := c.Handler(router)

	log.Println("Go后端服务启动在 :8080")
	log.Fatal(http.ListenAndServe(":8080", handler))
}

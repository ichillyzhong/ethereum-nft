# Ethereum NFT Project

一个完整的以太坊NFT项目，包含智能合约和后端服务。

## 项目结构

- **hardhat/** - 包含MyNFT智能合约的开发和部署
- **nft-backend/** - 包含铸造NFT和查询NFT的Go后端服务接口

## 功能特性

- ✅ ERC721 NFT智能合约
- ✅ NFT铸造功能
- ✅ IPFS元数据存储
- ✅ Go后端API服务
- ✅ 本地开发环境支持

## 技术栈

- **智能合约**: Solidity, Hardhat, OpenZeppelin
- **后端服务**: Go, go-ethereum, IPFS
- **区块链**: 以太坊 (本地测试网络)

## 快速开始

### 前置要求

- Node.js (v16+)
- Go (v1.19+)
- IPFS
- Git

### 1. 克隆项目

```bash
git clone <repository-url>
cd ethereum-nft
```

### 2. 安装依赖

#### 安装Hardhat依赖
```bash
cd hardhat
npm install
```

#### 安装Go依赖
```bash
cd ../nft-backend
go mod tidy
```

### 3. 启动IPFS节点

```bash
# 如果是第一次使用IPFS
ipfs init

# 启动IPFS守护进程
ipfs daemon
```

### 4. 启动Hardhat本地网络

```bash
cd hardhat
npx hardhat node
```

这将启动一个本地以太坊测试网络，并显示测试账户和私钥。

### 5. 部署智能合约

在新的终端窗口中：

```bash
cd hardhat
npx hardhat run scripts/deploy.js --network localhost
```

记录下部署的合约地址，需要在Go后端中使用。

### 6. 更新合约地址

在 `nft-backend/main.go` 中更新合约地址：

```go
contractAddr = common.HexToAddress("YOUR_DEPLOYED_CONTRACT_ADDRESS")
```

### 7. 启动Go后端服务

```bash
cd nft-backend
go run .
```

服务将在 `http://localhost:8080` 启动。

## API接口

### 铸造NFT

```bash
curl -X POST http://localhost:8080/mint \
  -H "Content-Type: application/json" \
  -d '{
    "toAddress": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    "metadata": "{\"name\":\"My NFT\",\"description\":\"A test NFT\",\"image\":\"https://example.com/image.png\"}"
  }'
```

**响应示例:**
```json
{
  "message": "铸造交易已发送",
  "txHash": "0x...",
  "tokenURI": "ipfs://QmXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
}
```

## 测试账户

Hardhat默认提供的测试账户：

- 账户#0: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- 账户#1: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
- 账户#2: `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`

每个账户都有10000 ETH的测试余额。

## 故障排除

### 1. "Sender doesn't have enough funds" 错误

确保：
- Hardhat节点正在运行
- 使用正确的私钥（对应有余额的测试账户）
- 合约地址正确

### 2. IPFS连接错误

确保IPFS守护进程正在运行：
```bash
ipfs daemon
```

### 3. 合约调用失败

确保：
- 合约已正确部署
- 合约地址在Go代码中正确配置
- 网络连接正常

## 开发说明

- 智能合约基于OpenZeppelin的ERC721标准
- 元数据存储在IPFS上
- Go后端使用go-ethereum库与区块链交互
- 支持本地开发和测试环境

## 许可证

MIT License


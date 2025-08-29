# NFT 铸造应用 (React Frontend)

这是一个基于 React 的 NFT 铸造和管理前端应用，使用 Wagmi 和 MetaMask 与以太坊区块链交互。

## 🎯 功能特性

### 核心功能
- **MetaMask 连接**：支持连接 MetaMask 钱包
- **NFT 铸造**：一键铸造新的 NFT 到区块链
- **NFT 展示**：查看用户拥有的所有 NFT
- **自动刷新**：铸造完成后自动更新 NFT 列表

### 技术特性
- **零闪烁渲染**：优化的状态管理，确保 UI 完全稳定
- **响应式设计**：支持桌面和移动设备
- **实时更新**：与后端 API 实时同步数据
- **错误处理**：完善的错误提示和状态管理

## 🛠️ 技术栈

- **React 19** - 前端框架
- **Wagmi** - 以太坊 React Hooks
- **TailwindCSS** - 样式框架
- **MetaMask** - 钱包连接
- **React Query** - 数据获取和缓存

## 🚀 快速开始

### 前置要求

1. **Node.js** (版本 16 或更高)
2. **MetaMask** 浏览器扩展
3. **后端服务** 运行在 `http://localhost:8080`
4. **Hardhat 本地网络** 运行在 `http://127.0.0.1:8545`

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm start
```

应用将在 [http://localhost:3000](http://localhost:3000) 启动。

### 构建生产版本

```bash
npm run build
```

## 📱 使用指南

### 1. 连接钱包
1. 确保已安装 MetaMask 扩展
2. 点击「连接 MetaMask」按钮
3. 在 MetaMask 中确认连接

### 2. 配置网络
确保 MetaMask 连接到 Hardhat 本地网络：
- **网络名称**：Hardhat Local
- **RPC URL**：`http://127.0.0.1:8545`
- **链 ID**：31337
- **货币符号**：ETH

### 3. 铸造 NFT
1. 连接钱包后，点击「铸造 NFT」按钮
2. 在 MetaMask 中确认交易
3. 等待交易完成（约1秒后自动刷新）

### 4. 查看 NFT
- 铸造成功后，NFT 会自动显示在页面上
- 每个 NFT 卡片显示：
  - Token ID
  - 名称（My NFT #X）
  - 描述信息

## 🔧 配置说明

### 环境变量

创建 `.env` 文件（如果需要）：

```env
# 后端 API 地址（默认：http://localhost:8080）
REACT_APP_BACKEND_URL=http://localhost:8080

# Hardhat 网络地址（默认：http://127.0.0.1:8545）
REACT_APP_RPC_URL=http://127.0.0.1:8545
```

### 网络配置

应用默认配置为连接 Hardhat 本地网络。如需修改，请编辑 `src/App.js` 中的配置：

```javascript
const config = createConfig({
  chains: [localhost],
  connectors: [injected({ target: 'metaMask' })],
  transports: { [localhost.id]: http('http://127.0.0.1:8545') },
});
```

## 🐛 故障排除

### 常见问题

1. **MetaMask 连接失败**
   - 确保已安装 MetaMask 扩展
   - 检查网络配置是否正确
   - 尝试刷新页面重新连接

2. **NFT 不显示**
   - 确保后端服务正在运行
   - 检查 Hardhat 网络是否启动
   - 查看浏览器控制台的错误信息

3. **铸造失败**
   - 确保钱包有足够的 ETH（测试网络）
   - 检查后端 API 是否可访问
   - 确认智能合约已正确部署

### 调试模式

打开浏览器开发者工具查看详细日志：
- **Console** 标签：查看应用日志
- **Network** 标签：检查 API 请求
- **Application** 标签：查看本地存储

## 📁 项目结构

```
src/
├── App.js          # 主应用组件
├── index.js        # 应用入口
├── index.css       # 全局样式
└── logo.svg        # React 图标

public/
├── index.html      # HTML 模板
└── favicon.ico     # 网站图标
```

## 🔗 相关链接

- [React 文档](https://reactjs.org/)
- [Wagmi 文档](https://wagmi.sh/)
- [TailwindCSS 文档](https://tailwindcss.com/)
- [MetaMask 文档](https://docs.metamask.io/)

## 📄 许可证

本项目采用 MIT 许可证。
# NFT Minting Application (React Frontend)

This is a React-based NFT minting and management frontend application that uses Wagmi and MetaMask to interact with the Ethereum blockchain.

## 🎯 Features

### Core Features
- **MetaMask Connection**: Support for connecting MetaMask wallet
- **NFT Minting**: One-click minting of new NFTs to blockchain
- **NFT Display**: View all NFTs owned by user
- **Auto Refresh**: Automatically update NFT list after minting completion

### Technical Features
- **Zero-Flicker Rendering**: Optimized state management ensuring completely stable UI
- **Responsive Design**: Support for desktop and mobile devices
- **Real-time Updates**: Real-time data synchronization with backend API
- **Error Handling**: Comprehensive error notifications and state management

## 🛠️ Technology Stack

- **React 19** - Frontend framework
- **Wagmi** - Ethereum React Hooks
- **TailwindCSS** - Styling framework
- **MetaMask** - Wallet connection
- **React Query** - Data fetching and caching

## 🚀 Quick Start

### Prerequisites

1. **Node.js** (version 16 or higher)
2. **MetaMask** browser extension
3. **Backend service** running on `http://localhost:8080`
4. **Hardhat local network** running on `http://127.0.0.1:8545`

### Install Dependencies

```bash
npm install
```

### Start Development Server

```bash
npm start
```

The application will start at [http://localhost:3000](http://localhost:3000).

### Build Production Version

```bash
npm run build
```

## 📱 Usage Guide

### 1. Connect Wallet
1. Ensure MetaMask extension is installed
2. Click "Connect MetaMask" button
3. Confirm connection in MetaMask

### 2. Configure Network
Ensure MetaMask is connected to Hardhat local network:
- **Network Name**: Hardhat Local
- **RPC URL**: `http://127.0.0.1:8545`
- **Chain ID**: 31337
- **Currency Symbol**: ETH

### 3. Mint NFT
1. After connecting wallet, click "Mint NFT" button
2. Confirm transaction in MetaMask
3. Wait for transaction completion (auto-refresh after ~1 second)

### 4. View NFT
- After successful minting, NFT will automatically display on the page
- Each NFT card shows:
  - Token ID
  - Name (My NFT #X)
  - Description information

## 🔧 Configuration

### Environment Variables

Create `.env` file (if needed):

```env
# Backend API address (default: http://localhost:8080)
REACT_APP_BACKEND_URL=http://localhost:8080

# Hardhat network address (default: http://127.0.0.1:8545)
REACT_APP_RPC_URL=http://127.0.0.1:8545
```

### Network Configuration

The application is configured by default to connect to Hardhat local network. To modify, edit the configuration in `src/App.js`:

```javascript
const config = createConfig({
  chains: [localhost],
  connectors: [injected({ target: 'metaMask' })],
  transports: { [localhost.id]: http('http://127.0.0.1:8545') },
});
```

## 🐛 Troubleshooting

### Common Issues

1. **MetaMask Connection Failed**
   - Ensure MetaMask extension is installed
   - Check if network configuration is correct
   - Try refreshing page and reconnecting

2. **NFT Not Displaying**
   - Ensure backend service is running
   - Check if Hardhat network is started
   - View browser console for error messages

3. **Minting Failed**
   - Ensure wallet has sufficient ETH (test network)
   - Check if backend API is accessible
   - Confirm smart contract is properly deployed

### Debug Mode

Open browser developer tools to view detailed logs:
- **Console** tab: View application logs
- **Network** tab: Check API requests
- **Application** tab: View local storage

## 📁 Project Structure

```
src/
├── App.js          # Main application component
├── index.js        # Application entry point
├── index.css       # Global styles
└── logo.svg        # React icon

public/
├── index.html      # HTML template
└── favicon.ico     # Website icon
```

## 🔗 Related Links

- [React Documentation](https://reactjs.org/)
- [Wagmi Documentation](https://wagmi.sh/)
- [TailwindCSS Documentation](https://tailwindcss.com/)
- [MetaMask Documentation](https://docs.metamask.io/)

## 📄 License

This project is licensed under the MIT License.
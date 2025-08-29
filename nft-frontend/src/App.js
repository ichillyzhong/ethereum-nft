import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createConfig, WagmiProvider, http } from 'wagmi';
import { localhost } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// 导入组件和工具
import ConnectWalletButton from './components/ConnectWalletButton/ConnectWalletButton';
import ConnectedWallet from './components/ConnectedWallet/ConnectedWallet';
import ActionButtons from './components/ActionButtons/ActionButtons';
import NFTGrid from './components/NFTGrid/NFTGrid';
import { getOrCreateNFT } from './utils/nftStore';
import { BACKEND_URL, REFRESH_DELAY } from './config/constants';
import './App.css';

// 配置
const config = createConfig({
  chains: [localhost],
  connectors: [injected({ target: 'metaMask' })],
  transports: { [localhost.id]: http('http://127.0.0.1:8545') },
});

const queryClient = new QueryClient();

function App() {
  const [nfts, setNfts] = useState([]);
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const fetchingRef = useRef(false);
  const currentNftsRef = useRef([]);
  
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  
  const injectedConnector = connectors.find(c => c.type === 'injected');

  // 铸造NFT
  const mintNFT = async () => {
    if (!isConnected || isLoading) return;
    
    try {
      setIsLoading(true);
      setStatus('正在铸造NFT...');
      
      // 使用随机数生成简洁的编号
      const randomId = Math.floor(Math.random() * 1000) + 1;
      const metadata = JSON.stringify({
        name: `NFT #${randomId}`,
        description: `A unique NFT created at ${new Date().toLocaleString()}.`,
        image: 'https://via.placeholder.com/500'
      });

      const response = await fetch(`${BACKEND_URL}/mint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        mode: 'cors',
        body: JSON.stringify({ toAddress: address, metadata }),
      });

      if (response.ok) {
        const data = await response.json();
        setStatus(`铸造成功！交易哈希: ${data.txHash}`);
        setTimeout(() => {
          fetchNFTs();
          setStatus('NFT列表已更新');
        }, REFRESH_DELAY);
      } else {
        setStatus(`铸造失败: HTTP ${response.status}`);
      }
    } catch (error) {
      setStatus(`铸造失败: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 获取NFT列表 - 超级稳定版本
  const fetchNFTs = useCallback(async () => {
    if (!address || fetchingRef.current) return;
    
    fetchingRef.current = true;
    try {
      const response = await fetch(`${BACKEND_URL}/nfts/${address}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        mode: 'cors',
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.length === 0) {
          if (currentNftsRef.current.length > 0) {
            currentNftsRef.current = [];
            setNfts([]);
          }
          return;
        }
        
        // 使用全局存储获取NFT对象
        const newNfts = data.map(getOrCreateNFT);
        
        // 超级严格的比较 - 只有在真正不同时才更新
        if (currentNftsRef.current.length !== newNfts.length) {
          currentNftsRef.current = newNfts;
          setNfts(newNfts);
          return;
        }
        
        // 检查每个元素的引用
        let isDifferent = false;
        for (let i = 0; i < newNfts.length; i++) {
          if (currentNftsRef.current[i] !== newNfts[i]) {
            isDifferent = true;
            break;
          }
        }
        
        // 只有在真正不同时才更新
        if (isDifferent) {
          currentNftsRef.current = newNfts;
          setNfts(newNfts);
        }
        
      } else {
        console.error(`加载NFT失败: HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('获取NFT失败:', error);
    } finally {
      fetchingRef.current = false;
    }
  }, [address]);

  // 初始化
  useEffect(() => {
    if (address) {
      const timer = setTimeout(fetchNFTs, 100);
      return () => clearTimeout(timer);
    } else {
      currentNftsRef.current = [];
      setNfts([]);
      setStatus('');
    }
  }, [address, fetchNFTs]);

  return (
    <div className="app-container">
      <div className="app-content">
        <h1 className="app-title">NFT 铸造应用</h1>
        <div className="wallet-section">
          {!isConnected ? (
            <ConnectWalletButton onConnect={connect} connector={injectedConnector} />
          ) : (
            <ConnectedWallet address={address} onDisconnect={disconnect} />
          )}
        </div>

        {isConnected && (
          <ActionButtons
            onMint={mintNFT}
            onRefresh={fetchNFTs}
            isLoading={isLoading}
          />
        )}

        {status && <p className="status-text">{status}</p>}

        {isConnected && (
          <div className="nft-section">
            <NFTGrid nfts={nfts} />
          </div>
        )}
      </div>
    </div>
  );
}

const AppWithProviders = () => (
  <WagmiProvider config={config}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </WagmiProvider>
);

export default AppWithProviders;
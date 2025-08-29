import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createConfig, WagmiProvider, http } from 'wagmi';
import { localhost } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// 后端服务URL
const BACKEND_URL = 'http://localhost:8080';

// 配置
const config = createConfig({
  chains: [localhost],
  connectors: [injected({ target: 'metaMask' })],
  transports: { [localhost.id]: http('http://127.0.0.1:8545') },
});

const queryClient = new QueryClient();

// 全局NFT存储 - 在组件外部，确保完全稳定
const globalNFTStore = new Map();

// 获取或创建NFT对象 - 全局函数，确保引用稳定
const getOrCreateNFT = (nft) => {
  const key = `${nft.TokenID}-${nft.Owner}`;
  
  if (globalNFTStore.has(key)) {
    return globalNFTStore.get(key);
  }
  
  const nftObj = {
    TokenID: nft.TokenID,
    Owner: nft.Owner,
    metadata: {
      name: `My NFT #${nft.TokenID}`,
      description: `NFT created with token ID ${nft.TokenID}`,
      image: `https://via.placeholder.com/300x300/4F46E5/FFFFFF?text=NFT+${nft.TokenID}`
    }
  };
  
  globalNFTStore.set(key, nftObj);
  return nftObj;
};

// 完全静态的NFT卡片 - 零状态管理
const NFTCard = React.memo(({ nft }) => (
  <div className="bg-gray-800 rounded-xl overflow-hidden shadow-xl">
    <div className="w-full h-48 bg-gray-700 flex items-center justify-center">
      <span className="text-white text-2xl font-bold">#{nft.TokenID}</span>
    </div>
    <div className="p-4">
      <h3 className="text-lg font-bold mb-1 text-white">{nft.metadata.name}</h3>
      <p className="text-sm text-gray-400 mb-2">{nft.metadata.description}</p>
      <p className="text-xs text-gray-500">Token ID: {nft.TokenID}</p>
    </div>
  </div>
), (prev, next) => prev.nft === next.nft);

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
      
      const timestamp = Date.now();
      const metadata = JSON.stringify({
        name: `My NFT #${timestamp}`,
        description: `An NFT created at ${new Date().toLocaleString()}.`,
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
        // 1秒后自动刷新NFT列表
        setTimeout(() => {
          fetchNFTs();
          setStatus('NFT列表已更新');
        }, 1000);
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
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-bold mb-8">NFT 铸造应用</h1>
        
        <div className="mb-8">
          {!isConnected ? (
            <button 
              onClick={() => injectedConnector && connect({ connector: injectedConnector })}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-full"
            >
              连接 MetaMask
            </button>
          ) : (
            <div className="p-4 bg-gray-800 rounded-lg">
              <p className="font-semibold text-lg">已连接: {address}</p>
              <button onClick={disconnect} className="mt-2 text-red-400 hover:underline">
                断开连接
              </button>
            </div>
          )}
        </div>

        {isConnected && (
          <div className="flex gap-4 justify-center mb-4">
            <button 
              onClick={mintNFT}
              disabled={isLoading}
              className={`font-bold py-3 px-8 rounded-full ${
                isLoading ? 'bg-gray-600' : 'bg-green-600 hover:bg-green-700'
              } text-white`}
            >
              {isLoading ? '处理中...' : '铸造NFT'}
            </button>
            <button 
              onClick={fetchNFTs}
              className="font-bold py-3 px-6 rounded-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              刷新NFT
            </button>
          </div>
        )}
        
        {status && <p className="text-sm text-gray-400 mb-4">{status}</p>}

        {isConnected && (
          <div className="mt-8">
            {nfts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                {nfts.map((nft) => (
                  <NFTCard key={`${nft.TokenID}-${nft.Owner}`} nft={nft} />
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-xl">你还没有铸造任何NFT。</p>
            )}
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
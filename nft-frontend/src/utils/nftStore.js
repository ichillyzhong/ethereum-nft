// 全局NFT存储 - 在组件外部，确保完全稳定
const globalNFTStore = new Map();

// 获取或创建NFT对象 - 全局函数，确保引用稳定
export const getOrCreateNFT = (nft) => {
    const key = `${nft.TokenID}-${nft.Owner}`;

    if (globalNFTStore.has(key)) {
        return globalNFTStore.get(key);
    }

    const nftObj = {
        TokenID: nft.TokenID,
        Owner: nft.Owner,
        metadata: {
            name: `NFT #${nft.TokenID}`,
            description: `A unique NFT with token ID ${nft.TokenID}`,
            image: `https://via.placeholder.com/300x300/4F46E5/FFFFFF?text=NFT+${nft.TokenID}`
        }
    };

    globalNFTStore.set(key, nftObj);
    return nftObj;
};
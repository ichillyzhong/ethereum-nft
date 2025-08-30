// Global NFT storage - outside components, ensuring complete stability
const globalNFTStore = new Map();

// Get or create NFT object - global function, ensuring reference stability
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
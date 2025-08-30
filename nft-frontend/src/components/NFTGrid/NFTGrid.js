import React from 'react';
import NFTCard from '../NFTCard/NFTCard';
import './NFTGrid.css';

const NFTGrid = ({ nfts }) => (
  <div className="nft-section">
    {nfts.length > 0 ? (
      <div className="nft-grid">
        {nfts.map((nft, index) => (
          <NFTCard 
            key={`${nft.TokenID}-${nft.Owner}`} 
            nft={nft} 
            animationDelay={index * 0.1}
          />
        ))}
      </div>
    ) : (
      <p className="no-nfts-message">You haven't minted any NFTs yet.</p>
    )}
  </div>
);

export default NFTGrid;
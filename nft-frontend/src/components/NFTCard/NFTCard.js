import React from 'react';
import './NFTCard.css';

const NFTCard = React.memo(({ nft, animationDelay = 0 }) => (
  <div 
    className="nft-card"
    style={{ animationDelay: `${animationDelay}s` }}
  >
    {/* <div className="nft-card-inner"> */}
      <div className="nft-image">
        <span className="nft-token-id">{nft.metadata.name}</span>
      </div>
      <div className="nft-info">
        <p className="nft-description">{nft.metadata.description}</p>
        <p className="nft-token-info">Token ID: {nft.TokenID}</p>
      </div>
    {/* </div> */}
  </div>
), (prev, next) => prev.nft === next.nft && prev.animationDelay === next.animationDelay);

export default NFTCard;
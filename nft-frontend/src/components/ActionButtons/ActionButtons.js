import React from 'react';
import './ActionButtons.css';

const ActionButtons = ({ onMint, onRefresh, isLoading }) => (
  <div className="action-buttons">
    <button 
      onClick={onMint}
      disabled={isLoading}
      className={`mint-button ${
        isLoading ? 'mint-button-disabled' : 'mint-button-enabled'
      }`}
    >
      {isLoading ? 'Processing...' : 'Mint NFT'}
    </button>
    <button 
      onClick={onRefresh}
      className="refresh-button"
    >
      Refresh NFT
    </button>
  </div>
);

export default ActionButtons;
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
      {isLoading ? '处理中...' : '铸造NFT'}
    </button>
    <button 
      onClick={onRefresh}
      className="refresh-button"
    >
      刷新NFT
    </button>
  </div>
);

export default ActionButtons;
import React from 'react';
import './ConnectWalletButton.css';

const ConnectWalletButton = ({ onConnect, connector }) => (
  <button 
    onClick={() => connector && onConnect({ connector })}
    className="connect-wallet-button"
  >
    Connect MetaMask
  </button>
);

export default ConnectWalletButton;
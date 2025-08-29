import React from 'react';
import './ConnectedWallet.css';

const ConnectedWallet = ({ address, onDisconnect }) => (
  <div className="connected-wallet">
    <p className="wallet-address">已连接: {address}</p>
    <button onClick={onDisconnect} className="disconnect-button">
      断开连接
    </button>
  </div>
);

export default ConnectedWallet;
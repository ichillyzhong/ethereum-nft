import React from 'react';
import './ConnectedWallet.css';

const ConnectedWallet = ({ address, onDisconnect }) => (
  <div className="connected-wallet">
    <p className="wallet-address">Connected: {address}</p>
    <button onClick={onDisconnect} className="disconnect-button">
      Disconnect
    </button>
  </div>
);

export default ConnectedWallet;
// src/components/Header.tsx
"use client"

import { useState } from 'react';
import { SEPOLIA_CHAIN_ID } from '../config/contracts';

const Header = () => {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        // Request account access
        const accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        });
        
        // Get the connected chain ID
        const chainIdHex = await window.ethereum.request({ 
          method: 'eth_chainId' 
        });
        
        setAccount(accounts[0]);
        setChainId(parseInt(chainIdHex, 16));
        
      } catch (error) {
        console.error("Error connecting wallet:", error);
      }
    } else {
      alert('Please install MetaMask or another Ethereum wallet');
    }
  };

  const isCorrectNetwork = chainId === SEPOLIA_CHAIN_ID;

  return (
    <header className="bg-white shadow">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gelato Faucet</h1>
        </div>
        
        <div>
          {account ? (
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-800">
                {account.slice(0, 6)}...{account.slice(-4)}
              </span>
              
              {!isCorrectNetwork && (
                <div className="text-sm font-medium py-1 px-2 bg-red-100 text-red-800 rounded-md">
                  Please switch to Sepolia
                </div>
              )}
            </div>
          ) : (
            <button 
              onClick={connectWallet}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
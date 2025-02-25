"use client"
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { SEPOLIA_CHAIN_ID, CONTRACT_ADDRESSES } from '../config/contracts';
import { tokenAbi } from '@/config/tokenAbi';

const Header = () => {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [tokenBalance, setTokenBalance] = useState<string>('0');

  useEffect(() => {
    if (account && chainId === SEPOLIA_CHAIN_ID) {
      fetchTokenBalance(account);
      setupBalanceListeners(account);
    }
  }, [account, chainId]);

  const fetchTokenBalance = async (address: string) => {
    if (typeof window.ethereum === 'undefined') return;
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const tokenContract = new ethers.Contract(
        CONTRACT_ADDRESSES.token,
        tokenAbi,
        provider
      );
      
      const balance = await tokenContract.balanceOf(address);
      setTokenBalance(ethers.formatEther(balance));
    } catch (error) {
      console.error("Error fetching token balance:", error);
    }
  };

  const setupBalanceListeners = (address: string) => {
    if (typeof window.ethereum === 'undefined') return;
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const tokenContract = new ethers.Contract(
        CONTRACT_ADDRESSES.token,
        tokenAbi,
        provider
      );
      
      // Listen for transfers to the user's address (receiving tokens)
      const filterTo = tokenContract.filters.Transfer(null, address);
      tokenContract.on(filterTo, () => {
        console.log("Token transfer detected to user address, updating balance");
        fetchTokenBalance(address);
      });
      
      // Listen for transfers from the user's address (sending tokens)
      const filterFrom = tokenContract.filters.Transfer(address);
      tokenContract.on(filterFrom, () => {
        console.log("Token transfer detected from user address, updating balance");
        fetchTokenBalance(address);
      });
      
      // Also set up a fallback polling mechanism for safety
      const intervalId = setInterval(() => {
        fetchTokenBalance(address);
      }, 30000); // Check every 30 seconds as a fallback
      
      // Clean up event listeners and interval on component unmount
      return () => {
        tokenContract.removeAllListeners(filterTo);
        tokenContract.removeAllListeners(filterFrom);
        clearInterval(intervalId);
      };
    } catch (error) {
      console.error("Error setting up balance listeners:", error);
    }
  };

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

        // Setup listeners for account or chain changes
        window.ethereum.on('accountsChanged', (accounts: string[]) => {
          setAccount(accounts[0] || null);
        });
        
        window.ethereum.on('chainChanged', (chainIdHex: string) => {
          setChainId(parseInt(chainIdHex, 16));
        });
      } catch (error) {
        console.error("Error connecting wallet:", error);
      }
    } else {
      alert('Please install MetaMask or another Ethereum wallet');
    }
  };

  // Add a manual refresh function that users can call
  const refreshBalance = () => {
    if (account && chainId === SEPOLIA_CHAIN_ID) {
      fetchTokenBalance(account);
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
              <div className="flex flex-col items-end">
                <span className="text-sm font-medium text-gray-800">
                  {account.slice(0, 6)}...{account.slice(-4)}
                </span>
                {isCorrectNetwork && (
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-green-700">
                      {parseFloat(tokenBalance).toFixed(2)} MAL
                    </span>
                    <button 
                      onClick={refreshBalance}
                      className="ml-2 text-blue-500 hover:text-blue-700"
                      title="Refresh balance"
                    >
                      <RefreshIcon />
                    </button>
                  </div>
                )}
              </div>
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

// Simple refresh icon component
const RefreshIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 4v6h-6"></path>
    <path d="M1 20v-6h6"></path>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"></path>
    <path d="M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
  </svg>
);

export default Header;
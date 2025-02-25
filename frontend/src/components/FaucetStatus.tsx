"use client";
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { faucetAbi } from '@/config/abi';

const FaucetStatus = () => {
  const [isPaused, setIsPaused] = useState<boolean | null>(null);
  const [requestCounter, setRequestCounter] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false); 

  useEffect(() => {
    const checkFaucetStatus = async () => {
      if (typeof window.ethereum === 'undefined') {
        setIsLoading(false);
        return;
      }
      
      try {
        if (isPaused === null) {
          setIsLoading(true);
        } else {
          setIsRefreshing(true);
        }
        
        const provider = new ethers.BrowserProvider(window.ethereum);
        const faucetContract = new ethers.Contract(
          CONTRACT_ADDRESSES.faucet,
          faucetAbi,
          provider
        );
        
        const [paused, counter] = await Promise.all([
          faucetContract.paused(),
          faucetContract.requestCounter()
        ]);
        
        setIsPaused(paused);
        setRequestCounter(Number(counter));
        setIsLoading(false);
        setIsRefreshing(false);
      } catch (error) {
        console.error("Error checking faucet status:", error);
        setIsLoading(false);
        setIsRefreshing(false);
      }
    };
    
    checkFaucetStatus();
    
    const interval = setInterval(checkFaucetStatus, 10000);
    
    return () => clearInterval(interval);
  }, [isPaused]); 

  if (isLoading && isPaused === null) {
    return (
      <div className="mt-4 p-4 border rounded-lg w-full max-w-md bg-gray-50">
        <div className="flex items-center justify-center">
          <svg className="animate-spin h-5 w-5 text-gray-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Loading faucet status...</span>
        </div>
      </div>
    );
  }

  if (isPaused === null && !isLoading) {
    return (
      <div className="mt-4 p-4 border rounded-lg w-full max-w-md bg-gray-50">
        <p className="text-gray-500 text-center">
          Unable to fetch faucet status. Please connect your wallet.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 p-4 border rounded-lg w-full max-w-md">
      <div className="flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-800">Faucet Status</h3>
          <div className="flex items-center">
            {isRefreshing && (
              <svg className="animate-spin h-4 w-4 text-gray-400 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {isPaused ? (
              <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                Paused
              </span>
            ) : (
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                Active
              </span>
            )}
          </div>
        </div>
        
        <div className="mt-2">
          <p className="text-sm text-gray-600">Request counter: <span className="font-medium text-gray-800">{requestCounter ?? 0}</span></p>
          {isPaused ? (
            <div className="mt-3 p-2 bg-yellow-50 text-yellow-700 rounded text-sm">
              ⚠️ The faucet is currently paused by the Web3 Function. It will automatically unpause after 1 minute.
            </div>
          ) : (
            <div className="mt-3 p-2 bg-green-50 text-green-700 rounded text-sm">
              ✅ The faucet is active and ready for token requests. After 1 request, it will be automatically paused by the Web3 Function.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FaucetStatus;
"use client";
import { useState, useEffect } from 'react';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { faucetAbi } from '@/config/abi';
import { GelatoRelay, CallWithERC2771Request, ERC2771Type } from '@gelatonetwork/relay-sdk-viem';
import { createWalletClient, custom, encodeFunctionData } from 'viem';
import { sepolia } from 'viem/chains';

const GELATO_RELAY_API_KEY = process.env.NEXT_PUBLIC_GELATO_RELAY_API_KEY || "";

const RequestButton = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [taskStatus, setTaskStatus] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [cooldownActive, setCooldownActive] = useState(false);

  // Cooldown timer effect
  useEffect(() => {
    if (cooldown <= 0) {
      setCooldownActive(false);
      return;
    }

    const timer = setTimeout(() => {
      setCooldown(cooldown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [cooldown]);

  // Poll for status updates if we have a taskId
  useEffect(() => {
    if (!taskId) return;
    
    const interval = setInterval(async () => {
      try {
        const relay = new GelatoRelay();
        const status = await relay.getTaskStatus(taskId);
        
        setTaskStatus(status.taskState);
        
        if (status.transactionHash) {
          setTxHash(status.transactionHash);
        }
        
        // Stop polling once we reach a final state
        if (status.taskState === 'ExecSuccess' || 
            status.taskState === 'Cancelled' || 
            status.taskState === 'ExecReverted') {
          clearInterval(interval);
        }
      } catch (error) {
        console.error('Error polling status:', error);
      }
    }, 3000);
    
    // Cleanup on unmount
    return () => clearInterval(interval);
  }, [taskId]);

  const requestTokens = async () => {
    if (typeof window.ethereum === 'undefined') {
      alert('Please install MetaMask or another Ethereum wallet');
      return;
    }

    try {
      setIsLoading(true);
      setTaskId(null);
      setTaskStatus(null);
      setTxHash(null);
      
      // Set cooldown for 60 seconds
      setCooldown(60);
      setCooldownActive(true);
      
      // 1. Create Gelato Relay instance
      const relay = new GelatoRelay({
        contract: {
          relay1BalanceERC2771: "0xd8253782c45a12053594b9deB72d8e8aB2Fca54c"
        }
      });
      
      // 2. Get the user's address first
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found");
      }
      
      const userAddress = accounts[0];
      
      // 3. Create wallet client with the account explicitly provided
      const walletClient = createWalletClient({
        account: userAddress as `0x${string}`,
        chain: sepolia,
        transport: custom(window.ethereum)
      });
      
      // 4. Prepare the call data for requestTokens()
      const data = encodeFunctionData({
        abi: faucetAbi,
        functionName: 'requestTokens',
      });
      
      // 5. Get chain ID 
      const chainId = 11155111; // Sepolia chain ID
      
      // 6. Build the request
      const request: CallWithERC2771Request = {
        user: userAddress as `0x${string}`,
        chainId: BigInt(chainId),
        target: CONTRACT_ADDRESSES.faucet as `0x${string}`,
        data: data,
      };
      
      // 7. Generate signature off-chain
      const { struct, signature } = await relay.getSignatureDataERC2771(
        request,
        walletClient,
        ERC2771Type.SponsoredCall
      );
      
      // 8. Submit the sponsored call
      const response = await relay.sponsoredCallERC2771WithSignature(
        struct,
        signature,
        GELATO_RELAY_API_KEY
      );
      
      setTaskId(response.taskId);
      setTaskStatus('Pending');
      console.log("Task ID:", response.taskId);
      
    } catch (error) {
      console.error('Error requesting tokens:', error);
      alert('Error requesting tokens. Check console for details.');
      // Reset cooldown if there's an error
      setCooldown(0);
      setCooldownActive(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Get status badge styling based on current status
  const getStatusBadge = () => {
    if (!taskStatus) return null;
    
    let bgColor = 'bg-gray-100';
    let textColor = 'text-gray-800';
    
    switch (taskStatus) {
      case 'ExecSuccess':
        bgColor = 'bg-green-100';
        textColor = 'text-green-800';
        break;
      case 'ExecReverted':
      case 'Cancelled':
        bgColor = 'bg-red-100';
        textColor = 'text-red-800';
        break;
      case 'CheckPending':
      case 'WaitingForConfirmation':
      case 'Pending':
        bgColor = 'bg-yellow-100';
        textColor = 'text-yellow-800';
        break;
    }
    
    return (
      <span className={`${bgColor} ${textColor} px-2 py-1 rounded-full text-xs font-medium`}>
        {taskStatus}
      </span>
    );
  };

  return (
    <div className="flex flex-col items-center">
      <button
        onClick={requestTokens}
        disabled={isLoading || cooldownActive}
        className={`py-2 px-6 rounded font-medium ${
          isLoading || cooldownActive
            ? 'bg-gray-300 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        {isLoading ? 'Processing...' : cooldownActive 
          ? `Cooldown (${cooldown}s)` 
          : 'Request Tokens (Gasless)'}
      </button>
      
      {taskId && (
        <div className="mt-4 p-4 border rounded-lg w-full max-w-md">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-gray-800">Transaction Status</h3>
            {getStatusBadge()}
          </div>
          
          <div className="text-sm mb-2">
            <p className="text-gray-800">Task ID:</p>
            <p className="font-mono break-all text-gray-800">{taskId}</p>
          </div>
          
          {txHash && (
            <div className="text-sm mb-3">
              <p className="text-gray-600">Transaction Hash:</p>
              <a 
                href={`https://sepolia.etherscan.io/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono break-all text-blue-600 hover:underline"
              >
                {txHash}
              </a>
            </div>
          )}
          
          <a 
            href={`https://relay.gelato.digital/tasks/status/${taskId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline"
          >
            View details on Gelato Relay
          </a>
          
          {taskStatus === 'ExecSuccess' && (
            <div className="mt-3 p-2 bg-green-50 text-green-700 rounded">
              ✅ Tokens received successfully!
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RequestButton;
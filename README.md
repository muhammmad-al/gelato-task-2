# Gelato Automated Faucet

A token faucet that leverages Gelato's Web3 Functions and Relay SDK, deployed to Vercel.

Live demo: https://gelato-task-2-4252.vercel.app/

## What it does

- Dispenses a custom ERC-20 token (MAL) to users over the Sepolia testnet without requiring gas (gasless transactions)
- Automatically pauses after 1 request using Gelato Web3 Functions (an event-triggered Solidity function)
- Automatically resumes after a 1-minute cooldown using Gelato Web3 Functions (a time-triggered Solidity function)
- Displays real-time status and transaction tracking

## How it works

Note: your MetaMask wallet must be connected to the Sepolia testnet before being able to use this faucet
1. Users connect their wallet to the Sepolia testnet and request tokens with a single click (only signing the transaction)
2. Request is processed via Gelato Relay (ERC2771) without requiring gas
3. After a successful token transfer, the Web3 Function automatically pauses the faucet
4. After 1 minute, the faucet automatically resumes

## Architecture

- **Smart Contracts**
 - `FaucetToken.sol`: Simple ERC20 MAL token
 - `Faucet.sol`: Token distribution faucet with ERC2771 support
 - `FaucetChecker.sol`: Web3 Function for automated faucet control

- **Frontend**
 - React/Next.js components: Header, FaucetStatus, RequestButton
 - Gelato Relay SDK integration for gasless transactions
 - Real-time state management and error handling

- **Gelato Integration**
 - Web3 Functions automate pause/unpause faucet logic
 - Relay SDK enables gasless token requests
 - Task status tracking 

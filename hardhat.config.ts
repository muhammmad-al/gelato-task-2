import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-deploy";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

if (!process.env.SEPOLIA_RPC_URL) {
  throw new Error("SEPOLIA_RPC_URL not found in .env file");
}

if (!process.env.PRIVATE_KEY) {
  throw new Error("PRIVATE_KEY not found in .env file");
}

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL,
      accounts: [process.env.PRIVATE_KEY],
      chainId: 11155111
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  }
};

export default config;
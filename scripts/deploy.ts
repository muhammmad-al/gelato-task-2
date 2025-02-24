import { ethers } from "hardhat";

async function main() {
  // Gelato's forwarder address on Sepolia
  const FORWARDER_SEPOLIA = "0xb80c96295344c03da7e283f58f88ff8c90d74654";
  
  // Deploy the token
  console.log("Deploying FaucetToken...");
  const TokenFactory = await ethers.getContractFactory("FaucetToken");
  const token = await TokenFactory.deploy();
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("FaucetToken deployed at:", tokenAddress);
  
  // Deploy the faucet
  console.log("Deploying Faucet...");
  const FaucetFactory = await ethers.getContractFactory("Faucet");
  const faucet = await FaucetFactory.deploy(
    tokenAddress,
    FORWARDER_SEPOLIA
  );
  await faucet.waitForDeployment();
  const faucetAddress = await faucet.getAddress();
  console.log("Faucet deployed at:", faucetAddress);
  
  // Fund the faucet with tokens
  console.log("Funding the faucet with tokens...");
  const tokenAmount = ethers.parseEther("100000"); // 100,000 tokens
  await token.transfer(faucetAddress, tokenAmount);
  console.log(`Faucet funded with ${ethers.formatEther(tokenAmount)} tokens`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
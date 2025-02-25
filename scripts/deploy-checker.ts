import { ethers } from "hardhat";

async function main() {
  // deployed faucet address for Soldity checker contract parameter 
  const faucetAddress = "0x33B739959f88b96089b5771f6132b100E100eB66";
  
  // Deploy the FaucetChecker contract.
  console.log("Deploying FaucetChecker...");
  const CheckerFactory = await ethers.getContractFactory("FaucetChecker");
  const checker = await CheckerFactory.deploy(faucetAddress);
  await checker.waitForDeployment();
  const checkerAddress = await checker.getAddress();
  console.log("FaucetChecker deployed at:", checkerAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

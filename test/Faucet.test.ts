import { expect } from "chai";
import { ethers } from "hardhat";

describe("Faucet", function () {
  it("Should distribute tokens to users", async function () {
    // Deploy the token
    const FaucetToken = await ethers.getContractFactory("FaucetToken");
    const token = await FaucetToken.deploy();
    await token.waitForDeployment();
    
    // Get signers
    const [deployer, user, forwarder] = await ethers.getSigners();
    
    // Deploy the faucet
    const Faucet = await ethers.getContractFactory("Faucet");
    const faucet = await Faucet.deploy(
      await token.getAddress(),
      forwarder.address
    );
    await faucet.waitForDeployment();
    
    // Fund the faucet with tokens
    const fundAmount = ethers.parseEther("100");
    await token.transfer(await faucet.getAddress(), fundAmount);
    
    // Check the initial balance
    const initialBalance = await token.balanceOf(user.address);
    expect(initialBalance).to.equal(0);
    
    // Request tokens
    await faucet.connect(user).requestTokens();
    
    // Verify the new balance
    const newBalance = await token.balanceOf(user.address);
    expect(newBalance).to.equal(ethers.parseEther("10"));
  });
});
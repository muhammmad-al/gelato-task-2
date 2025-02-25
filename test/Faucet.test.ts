import { expect } from "chai";
import { ethers } from "hardhat";

describe("Faucet", function () {
  it("Should distribute tokens to users", async function () {
    // Deploy the FaucetToken contract.
    const FaucetToken = await ethers.getContractFactory("FaucetToken");
    const token = await FaucetToken.deploy();
    await token.waitForDeployment();

    // Get signers.
    const [deployer, user, forwarder] = await ethers.getSigners();

    // Deploy the Faucet contract with ERC2771 support.
    const Faucet = await ethers.getContractFactory("Faucet");
    const faucet = await Faucet.deploy(await token.getAddress(), forwarder.address);
    await faucet.waitForDeployment();

    // Fund the faucet with tokens.
    const fundAmount = ethers.parseEther("100"); // 100 tokens
    await token.transfer(await faucet.getAddress(), fundAmount);

    // Verify the initial balance of the user is 0.
    const initialBalance = await token.balanceOf(user.address);
    expect(initialBalance).to.equal(0);

    // User requests tokens.
    const tx = await faucet.connect(user).requestTokens();
    await tx.wait();

    // Verify that the user now has 10 tokens.
    const newBalance = await token.balanceOf(user.address);
    expect(newBalance).to.equal(ethers.parseEther("10"));
  });
});

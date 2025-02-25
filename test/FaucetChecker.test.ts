import { expect } from "chai";
import { ethers, network } from "hardhat";

describe("FaucetChecker", function () {
  let token: any, faucet: any, checker: any;
  let deployer: any, user: any, forwarder: any;

  beforeEach(async function () {
    [deployer, user, forwarder] = await ethers.getSigners();

    // Deploy the FaucetToken contract.
    const FaucetToken = await ethers.getContractFactory("FaucetToken");
    token = await FaucetToken.deploy();
    await token.waitForDeployment();

    // Deploy the Faucet contract with ERC2771 support.
    const Faucet = await ethers.getContractFactory("Faucet");
    faucet = await Faucet.deploy(await token.getAddress(), forwarder.address);
    await faucet.waitForDeployment();

    // Fund the Faucet with tokens.
    const fundAmount = ethers.parseEther("100"); // 100 tokens
    await token.transfer(await faucet.getAddress(), fundAmount);

    // Deploy the FaucetChecker contract.
    const FaucetChecker = await ethers.getContractFactory("FaucetChecker");
    checker = await FaucetChecker.deploy(await faucet.getAddress());
    await checker.waitForDeployment();
  });

  it("should return true and payload to pause the faucet after >5 requests", async function () {
    // Simulate 6 requests.
    for (let i = 0; i < 6; i++) {
      const tx = await faucet.connect(user).requestTokens();
      await tx.wait();
    }

    // Call the checker.
    const { canExec, execPayload } = await checker.checker();

    expect(canExec).to.be.true;
    // Decode payload to ensure it calls setPause(true).
    const iface = new ethers.Interface([
      "function setPause(bool _paused)"
    ]);
    const decoded = iface.decodeFunctionData("setPause(bool)", execPayload);
    expect(decoded._paused).to.equal(true);
  });

  it("should return true and payload to unpause the faucet after being paused for 1 minute", async function () {
    // Manually pause the faucet.
    let tx = await faucet.setPause(true);
    await tx.wait();

    // Increase time by 61 seconds.
    await network.provider.send("evm_increaseTime", [61]);
    await network.provider.send("evm_mine");

    // Call the checker.
    const { canExec, execPayload } = await checker.checker();

    expect(canExec).to.be.true;
    // Decode payload to ensure it calls setPause(false).
    const iface = new ethers.Interface([
      "function setPause(bool _paused)"
    ]);
    const decoded = iface.decodeFunctionData("setPause(bool)", execPayload);
    expect(decoded._paused).to.equal(false);
  });

  it("should return false when no condition is met", async function () {
    // Simulate fewer than 6 requests.
    for (let i = 0; i < 3; i++) {
      const tx = await faucet.connect(user).requestTokens();
      await tx.wait();
    }

    // Call the checker.
    const { canExec, execPayload } = await checker.checker();
    expect(canExec).to.be.false;
    expect(execPayload).to.equal("0x");
  });
});

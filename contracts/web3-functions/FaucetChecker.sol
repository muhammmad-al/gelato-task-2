// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IFaucet {
    function requestCounter() external view returns (uint256);
    function counterResetTime() external view returns (uint256);
    function paused() external view returns (bool);
    function setPause(bool _paused) external;
}

contract FaucetChecker {
    IFaucet public faucet;
    
    constructor(address _faucet) {
        faucet = IFaucet(_faucet);
    }
    
    /// @notice Checker function that evaluates whether the faucet should change its paused state.
    /// @return canExec True if conditions are met.
    /// @return execPayload The encoded function call to update the pause state.
    function checker() external view returns (bool canExec, bytes memory execPayload) {
        uint256 counter = faucet.requestCounter();
        uint256 resetTime = faucet.counterResetTime();
        bool isPaused = faucet.paused();
        
        // Condition: if there is at least 1 request and the faucet is not paused, pause it.
        if (counter >= 1 && !isPaused) {
            canExec = true;
            execPayload = abi.encodeWithSelector(faucet.setPause.selector, true);
        }
        // Condition: if the faucet is paused and at least 1 minute has passed, unpause it.
        else if (isPaused && block.timestamp >= resetTime + 1 minutes) {
            canExec = true;
            execPayload = abi.encodeWithSelector(faucet.setPause.selector, false);
        } else {
            canExec = false;
            execPayload = bytes("");
        }
    }
}
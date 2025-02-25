// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { ERC2771Context } from "@gelatonetwork/relay-context/contracts/vendor/ERC2771Context.sol";

contract Faucet is ERC2771Context {
    IERC20 public token;
    uint256 public amountPerRequest = 10 * 10**18; // 10 tokens
    
    // Rate tracking variables
    uint256 public requestCounter;
    uint256 public counterResetTime;
    bool public paused;
    
    event TokensDispensed(address recipient, uint256 amount);
    
    constructor(address _token, address trustedForwarder)
        ERC2771Context(trustedForwarder)
    {
        token = IERC20(_token);
        counterResetTime = block.timestamp;
    }
    
    /// @notice Dispenses a fixed amount of tokens to the caller.
    function requestTokens() external {
        require(!paused, "Faucet is paused");
        
        // Reset counter if a minute has passed
        if (block.timestamp >= counterResetTime + 1 minutes) {
            requestCounter = 0;
            counterResetTime = block.timestamp;
        }
        
        requestCounter++;
        token.transfer(_msgSender(), amountPerRequest);
        emit TokensDispensed(_msgSender(), amountPerRequest);
    }
    
    /// @notice A simple function to update the paused state.
    /// This function does no additional checks—it simply sets the state.
    function setPause(bool _paused) external {
        paused = _paused;
        
        // reset the counter when unpausing.
        if (!_paused) {
            requestCounter = 0;
            counterResetTime = block.timestamp;
        }
    }
}

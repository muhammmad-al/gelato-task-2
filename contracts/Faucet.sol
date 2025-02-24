// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {
    ERC2771Context
} from "@gelatonetwork/relay-context/contracts/vendor/ERC2771Context.sol";

contract Faucet is ERC2771Context {
    IERC20 public token;
    uint256 public amountPerRequest = 10 * 10**18; // 10 tokens
    mapping(address => uint256) public lastRequestTime;
    
    event TokensDispensed(address recipient, uint256 amount);
    
    constructor(address _token, address trustedForwarder) 
        ERC2771Context(trustedForwarder)
    {
        token = IERC20(_token);
    }
    
    function requestTokens() external {
        address msgSender = _msgSender();
        require(block.timestamp >= lastRequestTime[msgSender] + 1 days, 
                "Please wait before requesting again");
        
        lastRequestTime[msgSender] = block.timestamp;
        token.transfer(msgSender, amountPerRequest);
        
        emit TokensDispensed(msgSender, amountPerRequest);
    }
}
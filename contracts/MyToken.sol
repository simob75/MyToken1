// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "node_modules/@openzeppelin/contracts/access/Ownable.sol";
import "node_modules/@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title MyToken
 * @dev Basic ERC-20 token with minting capabilities, onlyOwner can mint.
 */
contract MyToken is ERC20, Ownable, ReentrancyGuard {
    uint256 public tokensPerETH = 1000; // 1 ETH = 1000 tokens
    uint256 public faucetAmount = 50 * 10**decimals(); // 50 tokens per claim
    uint256 public claimCooldown = 72 hours; // 72 hours cooldown

    mapping(address => uint256) public lastClaimTime; // Track last claim timestamps

    /// @notice Logs token purchases
    event TokensPurchased(address indexed buyer, uint256 ethAmount, uint256 tokenAmount);

    /**
     * @dev Constructor mints initial supply to the deployer.
     * @param initialSupply The amount of tokens (in smallest unit) to mint initially.
     */
    constructor(uint256 initialSupply) ERC20("MyToken", "MTK") Ownable(msg.sender) {
        _mint(msg.sender, initialSupply);
    }
    /**
     * @notice Mints new tokens, only callable by the contract owner.
     * @param to Address that will receive the minted tokens.
     * @param amount Number of tokens to mint (in smallest unit).
     */
    function mint(address to, uint256 amount) external onlyOwner {
       
        _mint(to, amount);
    }
    /**
     * @notice Allows users to claim free tokens every 72 hours.
     */
    function claimTokens() external {
        require(balanceOf(address(this)) >= 50 * 10**18, "Faucet empty!");
        require(block.timestamp >= lastClaimTime[msg.sender] + claimCooldown, "Wait 72 hours to claim again");

        lastClaimTime[msg.sender] = block.timestamp; // Update last claim time
        _mint(msg.sender, faucetAmount);
    }

    /**
     * @notice Allows the owner to change the faucet amount.
     * @param newAmount New amount of free tokens per claim.
     */
    function setFaucetAmount(uint256 newAmount) external onlyOwner {
        require(newAmount > 0, "Amount must be greater than 0");
        faucetAmount = newAmount;
    }

    /**
     * @notice Allows the owner to change the cooldown time.
     * @param newCooldown New cooldown period in seconds.
     */
    function setClaimCooldown(uint256 newCooldown) external onlyOwner {
        require(newCooldown > 0, "Cooldown must be greater than 0");
        claimCooldown = newCooldown;
    }


    /**
     * @notice Allows users to buy tokens with ETH.
     */
    function buyTokens() external payable nonReentrant {
        require(msg.value > 0, "Send ETH to buy tokens");
        uint256 tokensToBuy = msg.value * tokensPerETH;

        require(balanceOf(owner()) >= tokensToBuy, "Not enough tokens in contract");

        // Debugging: Check balances before transfer
        uint256 ownerBalanceBefore = balanceOf(owner());
        uint256 buyerBalanceBefore = balanceOf(msg.sender);

        _transfer(owner(), msg.sender, tokensToBuy);

        // Ensure transfer succeeded
        require(balanceOf(msg.sender) == buyerBalanceBefore + tokensToBuy, "Token transfer failed");
        require(balanceOf(owner()) == ownerBalanceBefore - tokensToBuy, "Owner balance mismatch");

        emit TokensPurchased(msg.sender, msg.value, tokensToBuy);
    }

    /**
     * @notice Allows the owner to change the price of tokens.
     * @param newRate New token-per-ETH rate.
     */
    function setTokensPerETH(uint256 newRate) external onlyOwner {
        require(newRate > 0, "Rate must be greater than 0");
        tokensPerETH = newRate;
    }

    /**
     * @notice Withdraws ETH collected from token sales.
     * @dev Only owner can withdraw.
     */
    function withdrawETH() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}
//MyTokenModule#MyToken - 0x161e748B06823293045216D2731881467dd74c67 Speolia
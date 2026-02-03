// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

contract MyToken is ERC20, ERC20Burnable, Ownable, ERC20Permit {
    uint256 public constant MAX_SUPPLY = 1000000 * 10**18; // 1 million tokens
    uint256 public mintPrice = 0.001 ether;
    
    event MintPriceChanged(uint256 oldPrice, uint256 newPrice);
    event TokensMinted(address indexed to, uint256 amount);
    event TokensBurned(address indexed from, uint256 amount);
    
    constructor(address initialOwner) 
        ERC20("MyToken", "MTK") 
        Ownable(initialOwner)
        ERC20Permit("MyToken")
    {
        // Mint initial supply to owner
        _mint(initialOwner, 100000 * 10**decimals()); // 100k tokens
    }
    
    function mint(address to, uint256 amount) public onlyOwner {
        require(totalSupply() + amount <= MAX_SUPPLY, "Would exceed max supply");
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }
    
    function publicMint(uint256 amount) public payable {
        uint256 cost = (amount / 10**decimals()) * mintPrice;
        require(msg.value >= cost, "Insufficient payment");
        require(totalSupply() + amount <= MAX_SUPPLY, "Would exceed max supply");
        
        _mint(msg.sender, amount);
        emit TokensMinted(msg.sender, amount);
        
        // Refund excess
        if (msg.value > cost) {
            payable(msg.sender).transfer(msg.value - cost);
        }
    }
    
    function burn(uint256 amount) public override {
        super.burn(amount);
        emit TokensBurned(msg.sender, amount);
    }
    
    function burnFrom(address account, uint256 amount) public override {
        super.burnFrom(account, amount);
        emit TokensBurned(account, amount);
    }
    
    function setMintPrice(uint256 newPrice) public onlyOwner {
        uint256 oldPrice = mintPrice;
        mintPrice = newPrice;
        emit MintPriceChanged(oldPrice, newPrice);
    }
    
    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        payable(owner()).transfer(balance);
    }
    
    receive() external payable {}
}

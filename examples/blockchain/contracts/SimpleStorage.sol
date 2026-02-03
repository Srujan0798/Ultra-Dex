// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract SimpleStorage {
    uint256 private storedValue;
    address public owner;
    
    event ValueChanged(uint256 oldValue, uint256 newValue, address changedBy);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    constructor(uint256 initialValue) {
        owner = msg.sender;
        storedValue = initialValue;
        emit ValueChanged(0, initialValue, msg.sender);
    }
    
    function store(uint256 value) public onlyOwner {
        uint256 oldValue = storedValue;
        storedValue = value;
        emit ValueChanged(oldValue, value, msg.sender);
    }
    
    function retrieve() public view returns (uint256) {
        return storedValue;
    }
    
    function increment() public onlyOwner {
        uint256 oldValue = storedValue;
        storedValue++;
        emit ValueChanged(oldValue, storedValue, msg.sender);
    }
    
    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "New owner cannot be zero address");
        address oldOwner = owner;
        owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}

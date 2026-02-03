// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract MyNFT is ERC721, ERC721Enumerable, ERC721URIStorage, Ownable, ReentrancyGuard {
    uint256 public mintPrice = 0.01 ether;
    uint256 public maxSupply = 10000;
    uint256 public maxPerWallet = 5;
    uint256 private _tokenIdCounter;
    string private _baseTokenURI;
    bool public mintingEnabled = true;
    
    mapping(address => uint256) public walletMints;
    
    event NFTMinted(address indexed to, uint256 indexed tokenId, string uri);
    event MintPriceChanged(uint256 oldPrice, uint256 newPrice);
    event MintingToggled(bool enabled);
    event BaseURIChanged(string newBaseURI);
    
    constructor(
        address initialOwner,
        string memory baseURI
    ) 
        ERC721("MyNFT Collection", "MNFT") 
        Ownable(initialOwner)
    {
        _baseTokenURI = baseURI;
    }
    
    modifier mintingActive() {
        require(mintingEnabled, "Minting is currently disabled");
        _;
    }
    
    function mint(string memory uri) public payable mintingActive nonReentrant {
        require(msg.value >= mintPrice, "Insufficient payment");
        require(_tokenIdCounter < maxSupply, "Max supply reached");
        require(walletMints[msg.sender] < maxPerWallet, "Max mints per wallet reached");
        
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        walletMints[msg.sender]++;
        
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, uri);
        
        emit NFTMinted(msg.sender, tokenId, uri);
        
        // Refund excess
        if (msg.value > mintPrice) {
            payable(msg.sender).transfer(msg.value - mintPrice);
        }
    }
    
    function batchMint(string[] memory uris) public payable mintingActive nonReentrant {
        uint256 count = uris.length;
        require(msg.value >= mintPrice * count, "Insufficient payment");
        require(_tokenIdCounter + count <= maxSupply, "Would exceed max supply");
        require(walletMints[msg.sender] + count <= maxPerWallet, "Would exceed max per wallet");
        
        for (uint256 i = 0; i < count; i++) {
            uint256 tokenId = _tokenIdCounter;
            _tokenIdCounter++;
            walletMints[msg.sender]++;
            
            _safeMint(msg.sender, tokenId);
            _setTokenURI(tokenId, uris[i]);
            
            emit NFTMinted(msg.sender, tokenId, uris[i]);
        }
        
        // Refund excess
        uint256 required = mintPrice * count;
        if (msg.value > required) {
            payable(msg.sender).transfer(msg.value - required);
        }
    }
    
    function ownerMint(address to, string memory uri) public onlyOwner {
        require(_tokenIdCounter < maxSupply, "Max supply reached");
        
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        
        emit NFTMinted(to, tokenId, uri);
    }
    
    function setMintPrice(uint256 newPrice) public onlyOwner {
        uint256 oldPrice = mintPrice;
        mintPrice = newPrice;
        emit MintPriceChanged(oldPrice, newPrice);
    }
    
    function setMaxSupply(uint256 newMaxSupply) public onlyOwner {
        require(newMaxSupply >= _tokenIdCounter, "Cannot set below current supply");
        maxSupply = newMaxSupply;
    }
    
    function setMaxPerWallet(uint256 newMax) public onlyOwner {
        maxPerWallet = newMax;
    }
    
    function toggleMinting() public onlyOwner {
        mintingEnabled = !mintingEnabled;
        emit MintingToggled(mintingEnabled);
    }
    
    function setBaseURI(string memory newBaseURI) public onlyOwner {
        _baseTokenURI = newBaseURI;
        emit BaseURIChanged(newBaseURI);
    }
    
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }
    
    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        payable(owner()).transfer(balance);
    }
    
    // Override required functions
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }
    
    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }
    
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
    
    function totalMinted() public view returns (uint256) {
        return _tokenIdCounter;
    }
    
    function tokensOfOwner(address owner) public view returns (uint256[] memory) {
        uint256 tokenCount = balanceOf(owner);
        uint256[] memory tokenIds = new uint256[](tokenCount);
        for (uint256 i = 0; i < tokenCount; i++) {
            tokenIds[i] = tokenOfOwnerByIndex(owner, i);
        }
        return tokenIds;
    }
    
    receive() external payable {}
}

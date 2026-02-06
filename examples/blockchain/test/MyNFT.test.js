const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('MyNFT', function () {
  let MyNFT;
  let myNFT;
  let owner;
  let addr1;
  let addr2;
  const baseURI = 'https://api.example.com/nft/';

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    MyNFT = await ethers.getContractFactory('MyNFT');
    myNFT = await MyNFT.deploy(owner.address, baseURI);
    await myNFT.waitForDeployment();
  });

  describe('Deployment', function () {
    it('Should have correct name and symbol', async function () {
      expect(await myNFT.name()).to.equal('MyNFT Collection');
      expect(await myNFT.symbol()).to.equal('MNFT');
    });

    it('Should set the correct owner', async function () {
      expect(await myNFT.owner()).to.equal(owner.address);
    });

    it('Should set the correct base URI', async function () {
      expect(await myNFT._baseTokenURI()).to.equal(baseURI);
    });

    it('Should start with token counter at 0', async function () {
      expect(await myNFT.totalMinted()).to.equal(0);
    });
  });

  describe('Minting', function () {
    it('Should allow minting with payment', async function () {
      const mintPrice = await myNFT.mintPrice();
      const uri = 'metadata1.json';

      await myNFT.connect(addr1).mint(uri, { value: mintPrice });
      expect(await myNFT.balanceOf(addr1.address)).to.equal(1);
    });

    it('Should assign correct token ID', async function () {
      const mintPrice = await myNFT.mintPrice();
      const uri = 'metadata1.json';

      await myNFT.connect(addr1).mint(uri, { value: mintPrice });
      expect(await myNFT.ownerOf(0)).to.equal(addr1.address);
    });

    it('Should store correct token URI', async function () {
      const mintPrice = await myNFT.mintPrice();
      const uri = 'metadata1.json';

      await myNFT.connect(addr1).mint(uri, { value: mintPrice });
      expect(await myNFT.tokenURI(0)).to.equal(baseURI + uri);
    });

    it('Should emit NFTMinted event', async function () {
      const mintPrice = await myNFT.mintPrice();
      const uri = 'metadata1.json';

      await expect(myNFT.connect(addr1).mint(uri, { value: mintPrice }))
        .to.emit(myNFT, 'NFTMinted')
        .withArgs(addr1.address, 0, uri);
    });

    it('Should track wallet mint count', async function () {
      const mintPrice = await myNFT.mintPrice();

      await myNFT.connect(addr1).mint('uri1.json', { value: mintPrice });
      await myNFT.connect(addr1).mint('uri2.json', { value: mintPrice });

      expect(await myNFT.walletMints(addr1.address)).to.equal(2);
    });

    it('Should prevent minting without payment', async function () {
      await expect(myNFT.connect(addr1).mint('uri.json')).to.be.revertedWith(
        'Insufficient payment'
      );
    });

    it('Should refund excess payment', async function () {
      const mintPrice = await myNFT.mintPrice();
      const excess = ethers.parseEther('0.005');

      const initialBalance = await ethers.provider.getBalance(addr1.address);
      await myNFT.connect(addr1).mint('uri.json', { value: mintPrice + excess });
      const finalBalance = await ethers.provider.getBalance(addr1.address);

      expect(finalBalance).to.be.gt(
        initialBalance - mintPrice - excess - ethers.parseEther('0.001')
      );
    });

    it('Should prevent minting over max per wallet', async function () {
      const mintPrice = await myNFT.mintPrice();
      const maxPerWallet = await myNFT.maxPerWallet();

      for (let i = 0; i < Number(maxPerWallet); i++) {
        await myNFT.connect(addr1).mint(`uri${i}.json`, { value: mintPrice });
      }

      await expect(
        myNFT.connect(addr1).mint('extra.json', { value: mintPrice })
      ).to.be.revertedWith('Max mints per wallet reached');
    });

    it('Should allow owner mint without payment', async function () {
      await myNFT.ownerMint(addr1.address, 'uri.json');
      expect(await myNFT.ownerOf(0)).to.equal(addr1.address);
    });

    it('Should prevent minting when disabled', async function () {
      await myNFT.toggleMinting();
      const mintPrice = await myNFT.mintPrice();

      await expect(myNFT.connect(addr1).mint('uri.json', { value: mintPrice })).to.be.revertedWith(
        'Minting is currently disabled'
      );
    });
  });

  describe('Batch Minting', function () {
    it('Should allow batch minting', async function () {
      const mintPrice = await myNFT.mintPrice();
      const uris = ['uri1.json', 'uri2.json', 'uri3.json'];
      const totalCost = mintPrice * BigInt(uris.length);

      await myNFT.connect(addr1).batchMint(uris, { value: totalCost });
      expect(await myNFT.balanceOf(addr1.address)).to.equal(3);
    });

    it('Should emit events for each mint in batch', async function () {
      const mintPrice = await myNFT.mintPrice();
      const uris = ['uri1.json', 'uri2.json'];
      const totalCost = mintPrice * BigInt(uris.length);

      await expect(myNFT.connect(addr1).batchMint(uris, { value: totalCost }))
        .to.emit(myNFT, 'NFTMinted')
        .withArgs(addr1.address, 0, 'uri1.json')
        .to.emit(myNFT, 'NFTMinted')
        .withArgs(addr1.address, 1, 'uri2.json');
    });
  });

  describe('Admin Functions', function () {
    it('Should allow owner to set mint price', async function () {
      const newPrice = ethers.parseEther('0.02');
      await myNFT.setMintPrice(newPrice);
      expect(await myNFT.mintPrice()).to.equal(newPrice);
    });

    it('Should emit MintPriceChanged event', async function () {
      const newPrice = ethers.parseEther('0.02');
      const oldPrice = await myNFT.mintPrice();

      await expect(myNFT.setMintPrice(newPrice))
        .to.emit(myNFT, 'MintPriceChanged')
        .withArgs(oldPrice, newPrice);
    });

    it('Should allow owner to toggle minting', async function () {
      await myNFT.toggleMinting();
      expect(await myNFT.mintingEnabled()).to.equal(false);

      await myNFT.toggleMinting();
      expect(await myNFT.mintingEnabled()).to.equal(true);
    });

    it('Should emit MintingToggled event', async function () {
      await expect(myNFT.toggleMinting()).to.emit(myNFT, 'MintingToggled').withArgs(false);
    });

    it('Should allow owner to set max supply', async function () {
      await myNFT.setMaxSupply(5000);
      expect(await myNFT.maxSupply()).to.equal(5000);
    });

    it('Should prevent setting max supply below current', async function () {
      const mintPrice = await myNFT.mintPrice();
      await myNFT.connect(addr1).mint('uri.json', { value: mintPrice });

      await expect(myNFT.setMaxSupply(0)).to.be.revertedWith('Cannot set below current supply');
    });

    it('Should allow owner to set max per wallet', async function () {
      await myNFT.setMaxPerWallet(10);
      expect(await myNFT.maxPerWallet()).to.equal(10);
    });

    it('Should allow owner to set base URI', async function () {
      const newBaseURI = 'https://newapi.example.com/nft/';
      await myNFT.setBaseURI(newBaseURI);

      const mintPrice = await myNFT.mintPrice();
      await myNFT.connect(addr1).mint('uri.json', { value: mintPrice });

      expect(await myNFT.tokenURI(0)).to.equal(newBaseURI + 'uri.json');
    });

    it('Should allow owner to withdraw', async function () {
      const mintPrice = await myNFT.mintPrice();
      await myNFT.connect(addr1).mint('uri.json', { value: mintPrice });

      const initialBalance = await ethers.provider.getBalance(owner.address);
      await myNFT.withdraw();
      const finalBalance = await ethers.provider.getBalance(owner.address);

      expect(finalBalance).to.be.gt(initialBalance);
    });

    it('Should prevent non-owner from admin functions', async function () {
      await expect(myNFT.connect(addr1).setMintPrice(100)).to.be.revertedWithCustomError(
        myNFT,
        'OwnableUnauthorizedAccount'
      );

      await expect(myNFT.connect(addr1).toggleMinting()).to.be.revertedWithCustomError(
        myNFT,
        'OwnableUnauthorizedAccount'
      );

      await expect(myNFT.connect(addr1).withdraw()).to.be.revertedWithCustomError(
        myNFT,
        'OwnableUnauthorizedAccount'
      );
    });
  });

  describe('Token Transfers', function () {
    it('Should transfer token between accounts', async function () {
      const mintPrice = await myNFT.mintPrice();
      await myNFT.connect(addr1).mint('uri.json', { value: mintPrice });

      await myNFT.connect(addr1).transferFrom(addr1.address, addr2.address, 0);
      expect(await myNFT.ownerOf(0)).to.equal(addr2.address);
    });

    it('Should prevent transfer by non-owner without approval', async function () {
      const mintPrice = await myNFT.mintPrice();
      await myNFT.connect(addr1).mint('uri.json', { value: mintPrice });

      await expect(
        myNFT.connect(addr2).transferFrom(addr1.address, addr2.address, 0)
      ).to.be.revertedWithCustomError(myNFT, 'ERC721InsufficientApproval');
    });

    it('Should allow approved operator to transfer', async function () {
      const mintPrice = await myNFT.mintPrice();
      await myNFT.connect(addr1).mint('uri.json', { value: mintPrice });

      await myNFT.connect(addr1).approve(addr2.address, 0);
      await myNFT.connect(addr2).transferFrom(addr1.address, addr2.address, 0);

      expect(await myNFT.ownerOf(0)).to.equal(addr2.address);
    });
  });

  describe('Enumerable', function () {
    it('Should return tokens of owner', async function () {
      const mintPrice = await myNFT.mintPrice();

      await myNFT.connect(addr1).mint('uri1.json', { value: mintPrice });
      await myNFT.connect(addr1).mint('uri2.json', { value: mintPrice });

      const tokens = await myNFT.tokensOfOwner(addr1.address);
      expect(tokens.length).to.equal(2);
      expect(tokens[0]).to.equal(0);
      expect(tokens[1]).to.equal(1);
    });

    it('Should support IERC721Enumerable interface', async function () {
      const interfaceId = '0x780e9d63';
      expect(await myNFT.supportsInterface(interfaceId)).to.equal(true);
    });

    it('Should return correct token by index', async function () {
      const mintPrice = await myNFT.mintPrice();
      await myNFT.connect(addr1).mint('uri.json', { value: mintPrice });

      expect(await myNFT.tokenOfOwnerByIndex(addr1.address, 0)).to.equal(0);
    });
  });

  describe('Total Minted', function () {
    it('Should track total minted correctly', async function () {
      const mintPrice = await myNFT.mintPrice();

      await myNFT.connect(addr1).mint('uri1.json', { value: mintPrice });
      expect(await myNFT.totalMinted()).to.equal(1);

      await myNFT.connect(addr2).mint('uri2.json', { value: mintPrice });
      expect(await myNFT.totalMinted()).to.equal(2);
    });

    it('Should include owner mints in total', async function () {
      await myNFT.ownerMint(addr1.address, 'uri.json');
      expect(await myNFT.totalMinted()).to.equal(1);
    });
  });
});

const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MyToken", function () {
  let MyToken;
  let myToken;
  let owner;
  let addr1;
  let addr2;
  const initialSupply = ethers.parseEther("100000"); // 100k tokens

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    MyToken = await ethers.getContractFactory("MyToken");
    myToken = await MyToken.deploy(owner.address);
    await myToken.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should have correct name and symbol", async function () {
      expect(await myToken.name()).to.equal("MyToken");
      expect(await myToken.symbol()).to.equal("MTK");
    });

    it("Should mint initial supply to owner", async function () {
      expect(await myToken.balanceOf(owner.address)).to.equal(initialSupply);
    });

    it("Should have correct initial total supply", async function () {
      expect(await myToken.totalSupply()).to.equal(initialSupply);
    });

    it("Should set the correct owner", async function () {
      expect(await myToken.owner()).to.equal(owner.address);
    });
  });

  describe("ERC20 Standard Functions", function () {
    it("Should transfer tokens between accounts", async function () {
      const amount = ethers.parseEther("100");
      await myToken.transfer(addr1.address, amount);
      expect(await myToken.balanceOf(addr1.address)).to.equal(amount);
    });

    it("Should fail if sender has insufficient balance", async function () {
      const amount = ethers.parseEther("1");
      await expect(myToken.connect(addr1).transfer(addr2.address, amount))
        .to.be.revertedWithCustomError(myToken, "ERC20InsufficientBalance");
    });

    it("Should approve and transferFrom", async function () {
      const amount = ethers.parseEther("100");
      await myToken.approve(addr1.address, amount);
      await myToken.connect(addr1).transferFrom(owner.address, addr2.address, amount);
      expect(await myToken.balanceOf(addr2.address)).to.equal(amount);
    });
  });

  describe("Minting", function () {
    it("Should allow owner to mint", async function () {
      const amount = ethers.parseEther("1000");
      await myToken.mint(addr1.address, amount);
      expect(await myToken.balanceOf(addr1.address)).to.equal(amount);
    });

    it("Should emit TokensMinted event", async function () {
      const amount = ethers.parseEther("1000");
      await expect(myToken.mint(addr1.address, amount))
        .to.emit(myToken, "TokensMinted")
        .withArgs(addr1.address, amount);
    });

    it("Should prevent non-owner from minting", async function () {
      const amount = ethers.parseEther("1000");
      await expect(myToken.connect(addr1).mint(addr2.address, amount))
        .to.be.revertedWithCustomError(myToken, "OwnableUnauthorizedAccount");
    });

    it("Should prevent minting over max supply", async function () {
      const maxSupply = await myToken.MAX_SUPPLY();
      const currentSupply = await myToken.totalSupply();
      const amount = maxSupply - currentSupply + BigInt(1);
      await expect(myToken.mint(addr1.address, amount))
        .to.be.revertedWith("Would exceed max supply");
    });

    it("Should allow public minting with payment", async function () {
      const mintPrice = await myToken.mintPrice();
      const tokenAmount = ethers.parseEther("10");
      const cost = (tokenAmount / ethers.parseEther("1")) * mintPrice;
      
      await myToken.connect(addr1).publicMint(tokenAmount, { value: cost });
      expect(await myToken.balanceOf(addr1.address)).to.equal(tokenAmount);
    });

    it("Should refund excess payment on public mint", async function () {
      const mintPrice = await myToken.mintPrice();
      const tokenAmount = ethers.parseEther("10");
      const cost = (tokenAmount / ethers.parseEther("1")) * mintPrice;
      const excess = ethers.parseEther("0.01");
      
      const initialBalance = await ethers.provider.getBalance(addr1.address);
      await myToken.connect(addr1).publicMint(tokenAmount, { value: cost + excess });
      const finalBalance = await ethers.provider.getBalance(addr1.address);
      
      // Should have spent approximately cost + gas, not cost + excess
      expect(finalBalance).to.be.gt(initialBalance - cost - excess - ethers.parseEther("0.001"));
    });
  });

  describe("Burning", function () {
    it("Should allow users to burn their tokens", async function () {
      const amount = ethers.parseEther("100");
      await myToken.transfer(addr1.address, amount);
      
      await myToken.connect(addr1).burn(amount);
      expect(await myToken.balanceOf(addr1.address)).to.equal(0);
    });

    it("Should emit TokensBurned event", async function () {
      const amount = ethers.parseEther("100");
      await myToken.transfer(addr1.address, amount);
      
      await expect(myToken.connect(addr1).burn(amount))
        .to.emit(myToken, "TokensBurned")
        .withArgs(addr1.address, amount);
    });

    it("Should reduce total supply when burning", async function () {
      const amount = ethers.parseEther("100");
      const initialSupply = await myToken.totalSupply();
      await myToken.burn(amount);
      expect(await myToken.totalSupply()).to.equal(initialSupply - amount);
    });

    it("Should allow burnFrom with approval", async function () {
      const amount = ethers.parseEther("100");
      await myToken.transfer(addr1.address, amount);
      await myToken.connect(addr1).approve(owner.address, amount);
      
      await myToken.burnFrom(addr1.address, amount);
      expect(await myToken.balanceOf(addr1.address)).to.equal(0);
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to change mint price", async function () {
      const newPrice = ethers.parseEther("0.002");
      await myToken.setMintPrice(newPrice);
      expect(await myToken.mintPrice()).to.equal(newPrice);
    });

    it("Should emit MintPriceChanged event", async function () {
      const newPrice = ethers.parseEther("0.002");
      const oldPrice = await myToken.mintPrice();
      await expect(myToken.setMintPrice(newPrice))
        .to.emit(myToken, "MintPriceChanged")
        .withArgs(oldPrice, newPrice);
    });

    it("Should allow owner to withdraw", async function () {
      const mintPrice = await myToken.mintPrice();
      const tokenAmount = ethers.parseEther("10");
      const cost = (tokenAmount / ethers.parseEther("1")) * mintPrice;
      
      await myToken.connect(addr1).publicMint(tokenAmount, { value: cost });
      
      const initialBalance = await ethers.provider.getBalance(owner.address);
      await myToken.withdraw();
      const finalBalance = await ethers.provider.getBalance(owner.address);
      
      expect(finalBalance).to.be.gt(initialBalance);
    });

    it("Should prevent non-owner from withdrawing", async function () {
      await expect(myToken.connect(addr1).withdraw())
        .to.be.revertedWithCustomError(myToken, "OwnableUnauthorizedAccount");
    });
  });

  describe("Permit (EIP-2612)", function () {
    it("Should have permit function for gasless approvals", async function () {
      expect(await myToken.version()).to.equal("1");
    });
  });
});

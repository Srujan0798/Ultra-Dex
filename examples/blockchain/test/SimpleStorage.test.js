/**
 * @fileoverview SimpleStorage Test module
 * @module test/SimpleStorage.test
 */

const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('SimpleStorage', function () {
  let SimpleStorage;
  let simpleStorage;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    SimpleStorage = await ethers.getContractFactory('SimpleStorage');
    simpleStorage = await SimpleStorage.deploy(42);
    await simpleStorage.waitForDeployment();
  });

  describe('Deployment', function () {
    it('Should set the right owner', async function () {
      expect(await simpleStorage.owner()).to.equal(owner.address);
    });

    it('Should set the initial value correctly', async function () {
      expect(await simpleStorage.retrieve()).to.equal(42);
    });

    it('Should emit ValueChanged event on deployment', async function () {
      const tx = await simpleStorage.deploymentTransaction();
      await expect(tx).to.emit(simpleStorage, 'ValueChanged').withArgs(0, 42, owner.address);
    });
  });

  describe('Storage Operations', function () {
    it('Should store a new value', async function () {
      await simpleStorage.store(100);
      expect(await simpleStorage.retrieve()).to.equal(100);
    });

    it('Should emit ValueChanged event when storing', async function () {
      await expect(simpleStorage.store(100))
        .to.emit(simpleStorage, 'ValueChanged')
        .withArgs(42, 100, owner.address);
    });

    it('Should increment the value', async function () {
      await simpleStorage.increment();
      expect(await simpleStorage.retrieve()).to.equal(43);
    });

    it('Should emit event on increment', async function () {
      await expect(simpleStorage.increment())
        .to.emit(simpleStorage, 'ValueChanged')
        .withArgs(42, 43, owner.address);
    });
  });

  describe('Access Control', function () {
    it('Should only allow owner to store', async function () {
      await expect(simpleStorage.connect(addr1).store(100)).to.be.revertedWith(
        'Only owner can call this function'
      );
    });

    it('Should only allow owner to increment', async function () {
      await expect(simpleStorage.connect(addr1).increment()).to.be.revertedWith(
        'Only owner can call this function'
      );
    });
  });

  describe('Ownership Transfer', function () {
    it('Should transfer ownership', async function () {
      await simpleStorage.transferOwnership(addr1.address);
      expect(await simpleStorage.owner()).to.equal(addr1.address);
    });

    it('Should emit OwnershipTransferred event', async function () {
      await expect(simpleStorage.transferOwnership(addr1.address))
        .to.emit(simpleStorage, 'OwnershipTransferred')
        .withArgs(owner.address, addr1.address);
    });

    it('Should prevent non-owner from transferring ownership', async function () {
      await expect(
        simpleStorage.connect(addr1).transferOwnership(addr2.address)
      ).to.be.revertedWith('Only owner can call this function');
    });

    it('Should prevent transfer to zero address', async function () {
      await expect(simpleStorage.transferOwnership(ethers.ZeroAddress)).to.be.revertedWith(
        'New owner cannot be zero address'
      );
    });

    it('Should allow new owner to use owner functions', async function () {
      await simpleStorage.transferOwnership(addr1.address);
      await simpleStorage.connect(addr1).store(200);
      expect(await simpleStorage.retrieve()).to.equal(200);
    });
  });
});

/**
 * Error handler for SimpleStorage.test
 * @param {Error} error - Error to handle
 */
function handleSimpleStoragetestError(error) {
  try {
    console.error('[SimpleStorage.test]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}

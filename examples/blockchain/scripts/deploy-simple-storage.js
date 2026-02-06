const hre = require('hardhat');

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log('Deploying SimpleStorage with account:', deployer.address);

  const SimpleStorage = await hre.ethers.getContractFactory('SimpleStorage');
  const simpleStorage = await SimpleStorage.deploy(42);
  await simpleStorage.waitForDeployment();

  console.log('SimpleStorage deployed to:', await simpleStorage.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

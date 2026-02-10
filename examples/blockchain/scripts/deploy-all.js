/**
 * @fileoverview Deploy All module
 * @module scripts/deploy-all
 */

const hre = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log('Deploying contracts with account:', deployer.address);
  console.log(
    'Account balance:',
    (await hre.ethers.provider.getBalance(deployer.address)).toString()
  );

  // Deploy SimpleStorage
  console.log('\nDeploying SimpleStorage...');
  const SimpleStorage = await hre.ethers.getContractFactory('SimpleStorage');
  const simpleStorage = await SimpleStorage.deploy(42);
  await simpleStorage.waitForDeployment();
  console.log('SimpleStorage deployed to:', await simpleStorage.getAddress());

  // Deploy MyToken
  console.log('\nDeploying MyToken...');
  const MyToken = await hre.ethers.getContractFactory('MyToken');
  const myToken = await MyToken.deploy(deployer.address);
  await myToken.waitForDeployment();
  console.log('MyToken deployed to:', await myToken.getAddress());

  // Deploy MyNFT
  console.log('\nDeploying MyNFT...');
  const baseURI = 'https://api.example.com/nft/';
  const MyNFT = await hre.ethers.getContractFactory('MyNFT');
  const myNFT = await MyNFT.deploy(deployer.address, baseURI);
  await myNFT.waitForDeployment();
  console.log('MyNFT deployed to:', await myNFT.getAddress());

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    deployer: deployer.address,
    contracts: {
      SimpleStorage: await simpleStorage.getAddress(),
      MyToken: await myToken.getAddress(),
      MyNFT: await myNFT.getAddress(),
    },
    timestamp: new Date().toISOString(),
  };

  // Save to both root and frontend
  const deploymentsDir = path.join(__dirname, '..', 'deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  const filename = `${hre.network.name}-${Date.now()}.json`;
  fs.writeFileSync(path.join(deploymentsDir, filename), JSON.stringify(deploymentInfo, null, 2));

  // Also save as latest.json for frontend
  fs.writeFileSync(
    path.join(deploymentsDir, 'latest.json'),
    JSON.stringify(deploymentInfo, null, 2)
  );

  // Copy to frontend
  const frontendConfigDir = path.join(__dirname, '..', 'frontend', 'src', 'config');
  if (!fs.existsSync(frontendConfigDir)) {
    fs.mkdirSync(frontendConfigDir, { recursive: true });
  }
  fs.writeFileSync(
    path.join(frontendConfigDir, 'contracts.json'),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log('\nDeployment info saved to:');
  console.log(`- deployments/${filename}`);
  console.log(`- deployments/latest.json`);
  console.log(`- frontend/src/config/contracts.json`);

  // Verify contracts on Etherscan if not on localhost
  if (hre.network.name !== 'hardhat' && hre.network.name !== 'localhost') {
    console.log('\nWaiting for block confirmations...');
    await simpleStorage.deploymentTransaction().wait(5);
    await myToken.deploymentTransaction().wait(5);
    await myNFT.deploymentTransaction().wait(5);

    console.log('\nVerifying contracts on Etherscan...');
    try {
      await hre.run('verify:verify', {
        address: await simpleStorage.getAddress(),
        constructorArguments: [42],
      });
    } catch (e) {
      console.log('SimpleStorage verification failed:', e.message);
    }

    try {
      await hre.run('verify:verify', {
        address: await myToken.getAddress(),
        constructorArguments: [deployer.address],
      });
    } catch (e) {
      console.log('MyToken verification failed:', e.message);
    }

    try {
      await hre.run('verify:verify', {
        address: await myNFT.getAddress(),
        constructorArguments: [deployer.address, baseURI],
      });
    } catch (e) {
      console.log('MyNFT verification failed:', e.message);
    }
  }

  console.log('\nDeployment complete!');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

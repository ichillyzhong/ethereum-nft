const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const MyNFT = await hre.ethers.getContractFactory("MyNFT");
  const myNFT = await MyNFT.deploy(deployer.address);

  await myNFT.waitForDeployment();

  console.log(`MyNFT deployed to ${myNFT.target}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contract with the account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance));

  const CoinFlip = await hre.ethers.getContractFactory("CoinFlip");
  const coinFlip = await CoinFlip.deploy();

  await coinFlip.waitForDeployment();

  console.log("CoinFlip deployed to:",await coinFlip.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
/*Deploying contract with the account: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Account balance: 9999.99516607486030408
CoinFlip deployed to: 0x5FC8d32690cc91D4c39d9d3abcBD16989F875707*/
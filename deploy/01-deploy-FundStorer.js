/** @format */

const { network } = require("hardhat");
const { verify } = require("../utils/verify.js");
const {
  minimumTimeLimit,
  developmentChains,
} = require("../helper-hardhat-config.js");

module.exports = async ({ deployments, getNamedAccounts }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  log("Deploying.........................");

  const fundStorer = await deploy("FundStorer", {
    from: deployer,
    args: [],
    log: true,
  });
  log("deployed...........");
  log("_______________________________________");

  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    await verify(storeFund.address, []);
    log("verified..........");
  }
};

module.exports.tags = ["all"];

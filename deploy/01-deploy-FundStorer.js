/** @format */

const { network } = require("hardhat");
const { verify } = require("../utils/verify.js");
const {
  minimumAmount,
  minimumTimeLimit,
} = require("../helper-hardhat-config.js");

module.exports = async ({ deployments, getNamedAccounts }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();

  const args = [minimumAmount, minimumTimeLimit];

  const fundStorer = await deploy("FundStorer", {
    from: deployer,
    args: [],
    log: true,
  });
  log("deployed...........");
  log("_______________________________________");

  if (network.config.chainId == 5) {
    verify(storeFund.address, "");
  }
};

module.exports.tags = ["all"];

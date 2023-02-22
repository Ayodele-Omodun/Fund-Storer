/** @format */
const { network } = require("hardhat");

module.exports = {
  5: {
    name: "goerli",
  },
  33137: {
    name: "hardhat",
  },
};

const amount = "1000000000000000000000";
const time = 0;
const withdrawAmount = "1";

developmentChains = ["hardhat", "localhost"];

module.exports = {
  amount,
  time,
  developmentChains,
  moveBlocks,
  moveTime,
  withdrawAmount,
};

async function moveBlocks(amount) {
  for (let i = 0; i < amount; i++) {
    network.provider.request({ method: "evm_mine", params: [] });
  }
}

async function moveTime(amount) {
  network.provider.request({ method: "evm_increaseTime", params: [amount] });
}

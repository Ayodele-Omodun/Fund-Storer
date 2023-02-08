require("@nomicfoundation/hardhat-toolbox")
require("@nomiclabs/hardhat-etherscan")
require("@nomicfoundation/hardhat-chai-matchers")
require("@nomicfoundation/hardhat-network-helpers") 
require("hardhat-deploy")
require("@nomiclabs/hardhat-ethers")
require("dotenv").config()
require("solidity-coverage")
require("chai")
require("@nomiclabs/hardhat-waffle")

GOERLI_URL = process.env.GOERLI_URL
PRIVATE_KEY = process.env.PRIVATE_KEY
ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.17",
  namedAccounts: {
    deployer: {
        default: 0,
    },
    user: {
        default: 1,
    },
},
  networks: {
    goerli: {
      url: GOERLI_URL,
      chainId: 5,
      accounts: [PRIVATE_KEY],
      blockConfirmations: 6,
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
}

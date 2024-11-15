require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.27",
  paths: {
    sources: "./contracct", // This should point to your contracts directory
  },
  networks: {
    hardhat: {
      forking: {
        url: "https://rpc.ankr.com/eth",
      },
    },
  },
};

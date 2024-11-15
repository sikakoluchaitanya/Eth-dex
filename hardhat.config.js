require("@nomiclabs/hardhat-waffle");

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

// require("dotenv").config();
// require("@nomiclabs/hardhat-ethers");

// module.exports = {
//   solidity: "0.8.4",
//   networks: {
//     sepolia: {
//       url: process.env.SEPOLIA_RPC_URL,
//       accounts: [process.env.PRIVATE_KEY],
//     },
//   },
// };

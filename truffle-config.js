const path = require("path");
const HDWalletProvider = require("@truffle/hdwallet-provider");
require("dotenv").config({path: "./.env"});
const AccountIndex = 0;

module.exports = {
  networks: {
    development: {
      port: 8545,
      host: "127.0.0.1",
      network_id: "*"
    },
    goerli_infura : {
      provider : function () {
        return new HDWalletProvider(process.env.MNEMONIC,process.env.GOERLI, AccountIndex);
      },
      network_id: 5
    },
    ropsten_infura : {
      provider : function () {
        return new HDWalletProvider(process.env.MNEMONIC,process.env.ROPSTEN,AccountIndex);
      },
      network_id: 3
    }
  },
  compilers: {
    solc: {
      version: "0.8.7"
    }
  },
  plugins:['truffle-plugin-verify'] ,
  api_keys :{
    etherscan: process.env.API
  }
};

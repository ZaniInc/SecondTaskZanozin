const path = require("path");
// const HDWalletProvider = require("@truffle/hdwallet-provider");
// require("dotenv").config({path: "./.env"});
// const AccountIndex = 0;

module.exports = {
  networks: {
    development: {
      port : 7545,
      host : "127.0.0.1",
      network_id : "5777"
    }
    // goerli_infura : {
    //   provider : function () {
    //     return new HDWalletProvider(process.env.MNEMONIC,"https://goerli.infura.io/v3/23b0f66c3c2b4d77ad961d2f97c04e44", AccountIndex);
    //   },
    //   network_id: 5
    // },
    // ropsten_infura : {
    //   provider : function () {
    //     return new HDWalletProvider(process.env.MNEMONIC,"wss://ropsten.infura.io/ws/v3/23b0f66c3c2b4d77ad961d2f97c04e44",AccountIndex);
    //   },
    //   network_id: 3
    // }
  },
  compilers : {
    solc : {
      version : "0.8.7"
    }
  }
  // plugins:['truffle-plugin-verify'] ,
  // api_keys :{
  //   etherscan: 'HNYS8RTW749XT7W8VCZRH8SDV4YF2X7Y8T'
  // }
};

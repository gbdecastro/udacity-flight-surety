var HDWalletProvider = require("truffle-hdwallet-provider");
var mnemonic = "return oval angry stairs budget deposit aim inject tape slow absent arrange";

module.exports = {
  networks: {
    development: {
      provider: function() {
        return new HDWalletProvider(mnemonic, "http://127.0.0.1:7545/", 0, 50);
      },
      network_id: '*',
      gas: 6721975
    }
  },
  compilers: {
    solc: {
      version: "0.6.5"
    }
  }
};
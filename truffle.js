var HDWalletProvider = require("truffle-hdwallet-provider");
var mnemonic = "grow menu winter coast dignity wild saddle entire sentence surround bunker vendor";

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
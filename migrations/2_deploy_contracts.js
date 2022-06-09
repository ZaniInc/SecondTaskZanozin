var MyToken = artifacts.require("MyToken.sol");
var AirDrop = artifacts.require("AirDrop.sol");

module.exports = async (deployer) => {
  deployer.deploy(MyToken);
  deployer.deploy(AirDrop,MyToken.address);
};

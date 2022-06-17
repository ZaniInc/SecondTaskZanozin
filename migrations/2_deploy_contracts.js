var MyToken = artifacts.require("./MyToken.sol");
var MyTokenn = artifacts.require("./MyTokenn.sol");
var AirDrop = artifacts.require("./AirDrop.sol");

module.exports = async (deployer) => {
  await deployer.deploy(MyToken);
  await deployer.deploy(AirDrop, MyToken.address);
  await deployer.deploy(MyTokenn);
};

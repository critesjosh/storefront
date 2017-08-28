var Storefront = artifacts.require("./Storefront.sol");

module.exports = function(deployer) {
  deployer.deploy(Storefront);
};

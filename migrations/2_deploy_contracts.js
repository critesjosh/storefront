var Storefront = artifacts.require("./Storefront.sol");
var SafeMath = artifacts.require("./SafeMath.sol");
var Ownable = artifacts.require("./Ownable.sol");
var PullPayment = artifacts.require("./PullPayment.sol");

module.exports = function(deployer) {
  deployer.deploy(SafeMath);
  deployer.deploy(Ownable);
  deployer.deploy(PullPayment);
  deployer.deploy(Storefront);
};

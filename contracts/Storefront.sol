pragma solidity ^0.4.6;

import './Ownable.sol';
import './PullPayment.sol';
import './SafeMath.sol';
import './Administrable.sol';

contract Storefront is Ownable, Administrable, PullPayment {
	using SafeMath for uint256;

	struct Product {
		uint price;
		uint stock;
		address manager;
	}

	mapping(uint => Product) public products;

	event LogAddProduct(uint id, address manager, uint price, uint stock);
	event LogRemovedProduct(uint id, address manager, uint price, uint stock);
	event LogPurchase(address purchaser, uint id, uint price, uint quantity, uint stock);

	//constructor
	function Storefront(){
	}

	function addProduct(uint price, uint stock, uint id)
		isAdmin
		public
		returns(bool success)
	{
		require(products[id].price == 0); //make sure a product with this id has not been created
		require(price > 0);
		require(stock >= 0);
		products[id] = Product(price, stock, msg.sender);
		LogAddProduct(id, msg.sender, price, stock);
		return true;
	}

	function purchaseProduct(uint id, uint quantity)
		public
		payable
		returns(bool success)
	{
		require(products[id].stock >= quantity);
		uint totalCost = products[id].price.mul(quantity);
		require(msg.value >= totalCost);

		uint amountToReturn = msg.value.sub(totalCost);
		PullPayment.asyncSend(this, totalCost); 

		products[id].stock -= quantity;
		msg.sender.transfer(amountToReturn); //return any overpayment
		LogPurchase(msg.sender, id, products[id].price, quantity, products[id].stock);
		return true;
	}

	// withdrawals covered by PullPayment.withdrawPayments()

	function removeProduct(uint id)
		public
		isAdmin
		returns(bool success)
	{
		// remove a prodcut from the list
		require(products[id].price != 0 && products[id].stock != 0); // make sure the prodcut has been added
		uint stock = products[id].stock;
		uint price = products[id].price;
		address manager = products[id].manager;
		products[id] = Product(0,0,0);  // set to the uninitialized state
		LogRemovedProduct(id, manager, price, stock);
		return true;
	}

	function coPurchase()
		public
		returns(bool success)
	{
		//purchase something with another person
		return true;
	}

}

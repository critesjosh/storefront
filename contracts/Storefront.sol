pragma solidity ^0.4.6;

import './PullPayment.sol';
import './Administrable.sol';
import './Stoppable.sol';

contract Storefront is Administrable, PullPayment, Stoppable {
	using SafeMath for uint256;

	struct Product {
		uint price;
		uint stock;
		address manager;
	}

	Product[] public products;
	mapping(uint => uint) public productLocation;

	event LogAddProduct(uint id, address manager, uint price, uint stock);
	event LogRemovedProduct(uint id, address manager, uint price, uint stock);
	event LogPurchase(address purchaser, uint id, uint price, uint quantity, uint stock);

	//constructor
	function Storefront(){
	}

	function getProductsLength()
		public
		constant
		returns(uint length)
	{
		return(products.length);
	}

	function addProduct(uint price, uint stock, uint id)
		//isAdmin
		public
		returns(bool success)
	{
		require(price > 0);
		require(stock >= 0);
		uint length = getProductsLength();
		productLocation[id] = length;
		products.push(Product(price, stock, msg.sender));
		LogAddProduct(id, msg.sender, price, stock);
		return true;
	}

	function purchaseProduct(uint id, uint quantity)
		public
		payable
		returns(bool success)
	{
		uint index = productLocation[id];
		require(products[index].stock >= quantity);
		uint totalCost = products[index].price.mul(quantity);
		require(msg.value >= totalCost);

		uint amountToReturn = msg.value.sub(totalCost);
		PullPayment.asyncSend(this, totalCost); 

		products[index].stock -= quantity;
		msg.sender.transfer(amountToReturn); //return any overpayment
		LogPurchase(msg.sender, id, products[index].price, quantity, products[index].stock);
		return true;
	}

	// withdrawals covered by PullPayment.withdrawPayments()

	function removeProduct(uint id)
		public
		isAdmin
		returns(bool success)
	{
		// remove a product from the list
		uint index = productLocation[id];
		require(products[index].price != 0 && products[index].stock != 0); // make sure the prodcut has been added
		uint stock = products[index].stock;
		uint price = products[index].price;
		address manager = products[id].manager;
		products[id] = Product(0,0,0);  // set to the uninitialized state
		LogRemovedProduct(id, manager, price, stock);
		return true;
	}

	function coPurchase()
		public
		//isConfirmed
		returns(bool success)
	{
		//purchase something with another person
		return true;
	}

}

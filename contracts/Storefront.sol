pragma solidity ^0.4.6;

import './Ownable.sol';
import './PullPayment.sol';
import './SafeMath.sol';


contract Storefront is Ownable {
	using SafeMath for uint256;
	//address public owner;

	struct Product {
		uint price;
		uint stock;
	}

	mapping(uint => Product) public products;
	mapping(address => bool) public admins;
	//mapping(address => uint) public balances;

	event LogNewAdmin(address address1);
	event LogRemovedAdmin(address address1);
	event LogAddProduct(uint id, uint price, uint stock);
	event LogPurchase(address purchaser, uint id, uint price, uint quantity, uint stock);
	event LogPayment(address to, uint amount);
	event LogWithdrawal(address recipient, uint amount);

	modifier isAdmin {
		require(admins[msg.sender] == true);
		_;
	}

	//constructor
	function Storefront(){
		//owner = msg.sender; //covered by Ownable
		admins[msg.sender] = true;
	}

	function getUserIsAdmin()
		public
		constant
		returns(bool isIndeed)
	{
		 return admins[msg.sender];
	}

	function addAdmin(address newAdmin)
		onlyOwner
		public
		returns(bool success)
	{
		admins[newAdmin] == true;
		LogNewAdmin(newAdmin);
		return true;
	}

	function removeAdmin(address deleteAdmin)
		onlyOwner
		public
		returns(bool success)
	{
		require(deleteAdmin != owner); //owner cannot be removed from admins
		admins[deleteAdmin] = false;
		LogRemovedAdmin(deleteAdmin);
		return true;
	}

	function addProduct(uint price, uint stock, uint id)
		isAdmin
		public
		returns(bool success)
	{
		require(price > 0);
		require(stock >= 0);
		require(products[id].price == 0); // to make sure this product id has not been initialized
		Product memory product = Product(price, stock);
		products[id] = product;
		LogAddProduct(id, price, stock);
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
		
//separate balance transfers and stock adjustment to different functions

		//balances[this] += (products[id].price * quantity);
		// PullPayment.asyncSend(this, totalCost); 

		products[id].stock -= quantity;
		msg.sender.transfer(amountToReturn); //return any overpayment
		LogPurchase(msg.sender, id, products[id].price, quantity, products[id].stock);
		return true;
	}

	// withdrawals covered by withdrawPayments() in PullPayment.sol

	function removeProduct()
		public
		isAdmin
		returns(bool success)
	{
		// remove a prodcut from the list
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

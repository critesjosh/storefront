pragma solidity ^0.4.6;

contract Storefront {

	address public owner;
	uint    public globalId;

	struct Product {
		uint id;
		uint price;
		uint stock;
	}

	mapping(uint => Product) public products;
	mapping(address => bool) public admins;
	mapping(address => uint) public balances;

	event LogNewAdmin(address address1);
	event LogRemovedAdmin(address address1);
	event LogAddProduct(uint id, uint price, uint stock);
	event LogPurchase(address purchaser, uint id, uint price, uint quantity, uint stock);
	event LogPayment(address to, uint amount);

	modifier isOwner {
		require(msg.sender == owner);
		_;
	}

	modifier isAdmin {
		require(admins[msg.sender] == true);
		_;
	}

	//constructor
	function Storefront(){
		owner = msg.sender;
		admins[msg.sender] = true;
	}

	function getAdmin()
		public
		constant
		returns(bool isIndeed)
	{
		 return admins[msg.sender];
	}

	function addAdmin(address newAdmin)
		isOwner
		public
		returns(bool success)
	{
		admins[newAdmin] == true;
		LogNewAdmin(newAdmin);
		return true;
	}

	function removeAdmin(address deleteAdmin)
		isOwner
		public
		returns(bool success)
	{
		require(deleteAdmin != owner); //owner cannot be removed from admins
		admins[deleteAdmin] = false;
		LogRemovedAdmin(deleteAdmin);
		return true;
	}

	function addProduct(uint price, uint stock, uint time)
		isAdmin
		public
		returns(bool success)
	{
		require(price > 0);
		require(stock >= 0);
		globalId++;
		Product memory product = Product(globalId, price, stock);
		products[globalId] = product;
		LogAddProduct(globalId, price, stock);
		return true;
	}

	function purchaseProduct(uint id, uint quantity)
		public
		payable
		returns(bool success)
	{
		require(products[id].stock >= quantity);
		require(msg.value >= products[id].price * quantity);
		uint amountToReturn = msg.value - (products[id].price * quantity);
		balances[this] += (products[id].price * quantity);
		products[id].stock -= quantity;
		msg.sender.transfer(amountToReturn);
		LogPurchase(msg.sender, id, products[id].price, quantity, products[id].stock);
		return true;
	}

	function makePayment(address to, uint amount)
		isOwner
		public
		returns(bool success)
	{
		require(balances[this] > 0);
		require(amount > 0);
		balances[this] -= amount;
		to.transfer(amount);
		return true;
	}

	function withdrawValue(uint amountToWithdraw)
		public
		isOwner
		returns(bool success)
	{
		require(balances[this] > 0);
		balances[this] -= amountToWithdraw;
		owner.transfer(amountToWithdraw);
		return true;
	}

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

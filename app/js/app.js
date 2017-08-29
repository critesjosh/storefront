

var app = angular.module('storefrontApp', []);

app.config(function($locationProvider){
	$locationProvider.html5Mode({
		enabled:true,
		requireBase:false
	});
});

app.controller("storefrontController",
	['$scope', '$location', '$http', '$q', '$window', '$timeout',

	function($scope, $location, $http, $q, $window, $timeout) {

		$scope.formatProductData = function(){
			$scope.formattedProducts = [];
			$scope.productLog.forEach(function(element){
				var product = {};
				product.id = element.args.id.toString(10);
				product.price = element.args.price.toString(10);
				product.stock = element.args.stock.toString(10);
				product.quantity = 0;
				$scope.formattedProducts.push(product);
			});
		}	

		$scope.updateProductData = function(productId, newStockCount){
			$scope.formattedProducts.forEach(function(element){
				if(element.id === productId){
					element.stock = newStockCount;
				}
			});
		}

		$scope.productLog = [];
		$scope.purchaseLog = [];
		$scope.adminLog = [];
		$scope.formatProductData();

		Storefront.deployed()
		.then(function(_instance){
			$scope.contract = _instance;
			console.log("The contract:", $scope.contract);

			$scope.addProductPriceWatcher = $scope.contract.LogAddProduct({}, {fromBlock: 0})
			.watch(function(err, newProduct){
				if(err) {
					console.log("error watching new products price", err);
				} else {
					console.log("new product", newProduct);
					$scope.productLog.push(newProduct);
					$scope.formatProductData();
				}
			});

			$scope.addProductPurchasedWatcher = $scope.contract.LogPurchase({}, {fromBlock: 0})
			.watch(function(err, newPurchase){
				if(err) {
					console.log("error watching purchase", err);
				} else {
					console.log("new purchase", newPurchase);
					$scope.purchaseLog.push(newPurchase);
					$scope.updateProductData(newPurchase.args.id.toString(10), newPurchase.args.stock.toString(10));
				}
			});

			$scope.addAdminWatcher = $scope.contract.LogNewAdmin({}, {fromBlock: 0})
			.watch(function(err, newAdmin){
				if(err) {
					console.log("error watching purchase", err);
				} else {
					console.log("new admin", newAdmin);
					$scope.adminLog.push(newAdmin);
				}
			});

			return $scope.getOwnerStatus();
		});

	// ToDO:
	//
	// make add admin function more robust

	$scope.addAdmin = function(){
		//check that new admin is a valid address
		// if(!newAdmin instanceof address) alert("Please enter a valid ethereum address"); return;
		var admin = $scope.newAdmin;
		$scope.newAdmin = 0;
		$scope.contract.addAdmin(admin, {from:$scope.account});
	};

	$scope.purchaseProduct = function() {
		for(var i = 0; i < $scope.formattedProducts.length; i++){
			var product = $scope.formattedProducts[i];
			var totalCost = product.price * product.quantity;
			var amount = product.quantity;
			product.quantity = 0;
			if(amount === 0) continue;
			console.log(amount, product.id);
			$scope.contract.purchaseProduct(parseInt(product.id), parseInt(amount), {from:$scope.account, value: totalCost});
		};
	};

	$scope.addProduct = function() {
		var price = parseInt($scope.price);
		var stock = parseInt($scope.stock);
		$scope.price = 0;
		$scope.stock = 0;
		if(parseInt(price) <= 0){ alert("Please enter a valid product price"); return;}
		if(parseInt(stock) < 0){ alert("Please enter an item stock quantity greater than 0."); return;}
		$scope.contract.addProduct(parseInt(price), parseInt(stock), {from:$scope.account, gas: 900000})
		 .then(function(txn){
		 	//console.log("product added !! txn receipt", txn);
		 });
	};

	// get block number
	$scope.getCurrentBlockNumber = function(){
		web3.eth.getBlockNumber(function(err, bn){
			if(err) {
				console.log('error', err);
			} else {
				console.log('current block:', bn);
				$scope.blockNumber = bn;
				$scope.$apply();
			}
		});
	}

	$scope.getOwnerStatus = function() {
		return $scope.contract.owner({from: $scope.account})
		.then(function(_owner){
			$scope.isOwner = (_owner === $scope.account);
			console.log("i am the contract owner:", $scope.isOwner);
			$scope.$apply();
			return $scope.getAdminStatus();
		});
	}

	$scope.getAdminStatus = function(){
		return $scope.contract.getAdmin({from: $scope.account})
		.then(function(_admins){
			console.log("admins", _admins);
			$scope.isAdmin = _admins;
			$scope.$apply();
		});
	}

	//work with first account
	web3.eth.getAccounts(function(err, accs){
		if(err != null){
			alert("there was an error fetching your accounts.");
			return;
		}
		if(accs.length == 0) {
			alert("Couldn't find any accounts.");
			return;
		}
		$scope.accounts = accs;
		$scope.account = $scope.accounts[0];
		console.log("using account", $scope.account);

		web3.eth.getBalance($scope.account, function(err, _balance){
			$scope.balance = _balance.toString(10);
			console.log("balance", $scope.balance);
			$scope.balanceInEth = web3.fromWei($scope.balance, "ether");
			$scope.$apply();
			//return $scope.contract.owner({from: $scope.account});
		});

	});	

}]);
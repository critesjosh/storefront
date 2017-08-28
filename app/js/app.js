

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
				$scope.formattedProducts.push(product);
			});
		}	

		$scope.productLog = [];
		$scope.p1 = {
			quantity:  0,
			selected: 0
		};
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
				return $scope.getOwnerStatus();
			});

			return $scope.getOwnerStatus();
		});

	// ToDO:
	// get products
	// show purchase option
	// if address == owner, show add admin input
	// if address == admin, show add product input
	//


	$scope.addAdmin = function(){

	};

	$scope.purchaseProduct = function() {

		console.log("purchase clicked", $scope);
	}

	$scope.addProduct = function() {
		if(parseInt($scope.price) <= 0) return;
		if(parseInt($scope.stock) < 0) return;
		$scope.contract.addProduct(parseInt($scope.price), parseInt($scope.stock), {from:$scope.account})
		 .then(function(txn){
		 	console.log("product added !! txn receipt", txn);
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
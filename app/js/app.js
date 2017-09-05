
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

		var hub;
	  	Hub.deployed().then(function(instance) {
	    	hub = instance;
	    	newStorefrontWatcher = watchForNewStores();
	  	});

	  	$scope.stores = [];      // array of store structs
	  	$scope.storeIndex = {};  // row pointers
	  	$scope.newStore = {};    // new storefront
	  	$scope.ownedStores = []; // array of store structs
	  	$scope.newProduct = {};  // new product       
	  	$scope.storeSelected;
	  	$scope.productSelected;  
	  	$scope.storeLog = [];    // verbose on-screen display of logs

	  	$scope.setAccount = function(){
	  		$scope.account = $scope.accountSelected;
	  		$scope.balance = web3.getBalance($scope.account).toString(10);
	  		var numberOfStores = $scope.stores.length;

	  		// update UI options based on the account selected
	  		// manage stores for which this accound is the owner

	  		// display all of the stores they manage/ show add/remove product options

	  		console.log("Using account:", $scope.account);
	  	}

	  	$scope.newStore = function(){};

	  	$scope.addProduct = function(){};

	  	$scope.removeProduct = function(){};

	  	$scope.purchaseProduct = function(){};

	  	function watchForNewStores() {
	  		hub.LogNewStorefront( {}, {fromBlock: 0})
	  		.watch(function(err, newStore){
	  			if(err){
	  				console.log("Store error: ", err);
	  			} else {
	  				console.log("New store:", newStore);

	  			}
	  		});
	  	}
















		//
		// Function declarations
		//

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

		$scope.updateProductData = function(productId, newStockCount){
			$scope.formattedProducts.forEach(function(element){
				if(element.id === productId){
					element.stock = newStockCount;
				}
			});
		} 

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
				$scope.contract.purchaseProduct(parseInt(product.id), parseInt(amount), {from:$scope.account, value: totalCost})
				.then(function(txn){
					//$scope.$apply();
				});
			};
		};

		$scope.addProduct = function() {
			var price = parseInt($scope.price);
			var stock = parseInt($scope.stock);
			var id = Date.now(); // anything unique
			$scope.price = 0;
			$scope.stock = 0;
			if(parseInt(price) <= 0){ alert("Please enter a valid product price"); return;}
			if(parseInt(stock) < 0){ alert("Please enter an item stock quantity greater than 0."); return;}

			$scope.contract.addProduct(price, stock, id, {from:$scope.account, gas: 900000})
			 .then(function(txn){
			 	//console.log("product added !! txn receipt", txn);
			 });
		}

		$scope.removeProduct = function() {
			var id = parseInt($scope.toRemoveId);
			$scope.toRemoveId = "";
			$scope.contract.removeProduct(id, {from:$scope.account})
		}

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
			return $scope.contract.getUserIsAdmin({from: $scope.account})
			.then(function(_admins){
				console.log("admins", _admins);
				$scope.isAdmin = _admins;
				$scope.$apply();
			});
		}

		//
		// Ininitialize data structures
		//

		$scope.productLog = [];
		$scope.purchaseLog = [];
		$scope.adminLog = [];
		$scope.formatProductData();


		//
		// Contract specific setup
		//

		// Storefront.deployed()
		// .then(function(_instance){
		// 	$scope.contract = _instance;
		// 	console.log("The contract:", $scope.contract);

		// 	// product added watcher
		// 	$scope.addProductWatcher = $scope.contract.LogAddProduct({}, {fromBlock: 0})
		// 	.watch(function(err, newProduct){
		// 		if(err) {
		// 			console.log("error watching new products price", err);
		// 		} else {
		// 			console.log("new product", newProduct);
		// 			$scope.productLog.push(newProduct);
		// 			$scope.formatProductData();
		// 			$scope.$apply();
		// 		}
		// 	});

		// 	// product purchased watcher
		// 	$scope.addProductPurchasedWatcher = $scope.contract.LogPurchase({}, {fromBlock: 0})
		// 	.watch(function(err, newPurchase){
		// 		if(err) {
		// 			console.log("error watching purchase", err);
		// 		} else {
		// 			console.log("new purchase", newPurchase);
		// 			$scope.purchaseLog.push(newPurchase);
		// 			$scope.updateProductData(newPurchase.args.id.toString(10), newPurchase.args.stock.toString(10));
		// 			$scope.$apply();
		// 		}
		// 	});

		// 	$scope.addProductRemovedWatcher = $scope.contract.LogRemovedProduct({}, {fromBlock: 0})
		// 	.watch(function(err, removedProduct){
		// 		if(err){
		// 			console.log("error watching removed product", err);
		// 		} else {
		// 			console.log("product removed", removedProduct);
		// 			console.log($scope);
		// 			var index;
		// 			$scope.formattedProducts.forEach(function(element, _index){
		// 				if(element.id === removedProduct.args.id.toString(10)){
		// 					index = _index;
		// 				};
		// 			});
		// 			console.log('index',index);
		// 			console.log('removed product id',removedProduct.args.id.toString(10));
		// 			$scope.productLog.splice(index, 1);
		// 			$scope.formatProductData();
		// 			$scope.$apply();
		// 		}
		// 	})

		// 	$scope.addAdminWatcher = $scope.contract.LogNewAdmin({}, {fromBlock: 0})
		// 	.watch(function(err, newAdmin){
		// 		if(err) {
		// 			console.log("error watching purchase", err);
		// 		} else {
		// 			console.log("new admin", newAdmin);
		// 			$scope.adminLog.push(newAdmin);
		// 		}
		// 	});

		// 	return $scope.getOwnerStatus();
		// });


		// work with first account
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
			$scope.balance = web3.getBalance($scope.account).toString(10);
			console.log("using account", $scope.account);
		});	

}]);
// var Connect = require('uport-connect').Connect;
// var SimpleSigner = require('uport-connect').SimpleSigner;
// var angular = require('angular');

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

	  	txn = {};
	  	$scope.stores = [];      // array of store structs
	  	$scope.storeIndex = {};  // row pointers
	  	$scope.newStore = {};    // new storefront
	  	$scope.ownedStores = []; // array of store structs
	  	$scope.newProduct = {};  // new product       
	  	$scope.storeSelected;
	  	$scope.productSelected;  
	  	$scope.storeLog = [];    // verbose on-screen display of logs
	  	$scope.storeOwners = {};

	  	$scope.setAccount = function(){
	  		$scope.account = $scope.accountSelected;
	  		requestBalancePromise()
	  		.then((balance) => {
	  			$scope.balance = balance;
	  			$scope.$apply();
	  		});
	  		var numberOfStores = $scope.stores.length;

	  		// update UI options based on the account selected
	  		// manage stores for which this accound is the owner

	  		// display all of the stores they manage/ show add/remove product options

	  		console.log("Using account:", $scope.account);
	  	}

	  	$scope.newStore = function(){
	  		hub.createStore({from: $scope.account})
	  		.then(function(txn){
	  			// if($scope.storeOwners[txn.args.storefrontCreator] === 'undefined'){
	  			// 	$scope.storeOwners[txn.args.storefrontCreator] = [txn.args.storefrontAddress];
	  			// } else {
	  			// 	$scope.storeOwners[txn.args.storefrontCreator].push(txn.args.storefrontAddress);
	  			// }
	  		});
	  	};

	  	$scope.editStore = function(){
	  		var store = Storefront.at($scope.editStoreSelected);
	  	}

	  	$scope.addProduct = function(){
	  		var store = Storefront.at($scope.editStoreSelected);
			var price = parseInt($scope.newProductPrice);
			var stock = parseInt($scope.newProductQuantity);
			var id = Date.now(); // anything unique
			$scope.newProductPrice = 0;
			$scope.newProductQuantity = 0;
			if(parseInt(price) <= 0){ alert("Please enter a valid product price"); return;}
			if(parseInt(stock) < 0){ alert("Please enter an item stock quantity greater than 0."); return;}

			store.addProduct(price, stock, id, {from:$scope.account, gas: 90000})
			 .then(function(txn){
			 	console.log("product added !! txn receipt", txn);
			 });
	  	};

	  	$scope.removeProduct = function(){};

	  	$scope.shopAtStore = function() {
	  		var store = Storefront.at($scope.shopStoreSelected);
	  		console.log(store);
	  		store.products[0].call({from: $scope.account})
	  		.then((result) => {
	  			console.log(result);
	  		});

	  	};

	  	$scope.purchaseProduct = function(){};

	  	function watchForNewStores() {
	  		hub.LogNewStorefront( {}, {fromBlock: 0})
	  		.watch(function(err, newStore){
	  			if(err){
	  				console.log("Store error: ", err);
	  			} else {
	  				console.log("New store:", newStore);
	  				if(typeof(txn[newStore.transactionHash]) == 'undefined') {
	  					$scope.storeLog.push(newStore);
	  					$scope.stores.push(newStore);
	  					txn[newStore.transactionHash] = true;
	  					upsertStore(newStore.args.storefrontAddress);
	  					$scope.$apply();
	  				}
	  			}
	  		});
	  	}

	  	function upsertStore(address) {
	  		console.log("upserting store", address);
	  		var store = Storefront.at(address);

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

		// if(typeof(mist) !== "undefined") {

		// 	mist.requestAccountPromise = function() {
		// 		return new Promise (function(resolve, reject) {
		// 			mist.requestAccount(function(e, accounts) {
		// 				if(e != null) {
		// 					reject(e);
		// 				} else {
		// 					resolve(accounts);
		// 				}
		// 			});
		// 		});
		// 	};

		// 	mist.requestBalancePromise = function(){
		// 		return new Promise(function(resolve, reject) {
		// 			web3.eth.getBalance(function(err, balance) {
		// 				if(e != null) {
		// 					reject(e);
		// 				} else {
		// 					resolve(balance);
		// 				}
		// 			});
		// 		});
		// 	};

		// 	mist.requestAccountPromise().then((accounts) => {
		// 		console.log(accounts);
		// 		$scope.accounts = accounts;
		// 		$scope.account = $scope.accounts[0];
		// 		return mist.requestBalancePromise();
		// 	}).then((balance) => {
		// 		console.log(balance);
		// 	})
		// } else {


		requestAccountPromise = function() {
			return new Promise (function(resolve, reject) {
				web3.eth.getAccounts(function(e, accounts) {
					if(e != null) {
						reject(e);
					} else {
						resolve(accounts);
					}
				});
			});
		};

		requestBalancePromise = function(){
			return new Promise(function(resolve, reject) {
				web3.eth.getBalance($scope.account, function(e, balance) {
					if(e != null) {
						reject(e);
					} else {
						resolve(balance);
					}
				});
			});
		};

		requestAccountPromise().then((accounts) => {
			console.log(accounts);
			$scope.accounts = accounts;
			$scope.account = $scope.accounts[0];
			$scope.$apply();
			return requestBalancePromise();
		}).then((balance) => {
			$scope.balance = balance;
			$scope.$apply();
		});				


}]);
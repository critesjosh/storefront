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
	  	$scope.storeSelected;
	  	$scope.storeLog = [];    // verbose on-screen display of logs

	  	$scope.product = {};
	  	$scope.productList = [];
	  	$scope.productLog  = [];

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
	  		return hub.createStore({from: $scope.account})
	  		.then(function(txn) {
	  			console.log('store created: txn', txn);
	  		});
	  	};

	  	$scope.addProduct = function(){
	  		var store = Storefront.at($scope.editStoreSelected);
			var price = parseInt($scope.product.price);
			var stock = parseInt($scope.product.quantity);
			var id = Date.now(); // anything unique
			$scope.product.price = 0;
			$scope.product.quantity = 0;
			if(parseInt(price) <= 0){ alert("Please enter a valid product price"); return;}
			if(parseInt(stock) < 0){ alert("Please enter an item stock quantity greater than 0."); return;}

			console.log($scope.editStoreSelected);

			return store.addProduct(price, stock, id, {from:$scope.account, gas: 900000})
			 .then(function(txn){
			 	console.log("product added !! txn receipt", txn);
			 	return;
			 });
	  	};

	  	$scope.shopAtStore = function() {
	  		var store = Storefront.at($scope.shopStoreSelected);
	  		console.log(store);

	  	};

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
	  				}
	  			}
	  		});
	  	}

	  	function watchForNewProducts(storefrontAddress) {
	  		var store = Storefront.at(storefrontAddress);
	  		console.log("store watcher at", storefrontAddress);
	  		var newProductWatcher = store.LogAddProduct({}, {fromBlock: 0})
	  		.watch(function(err, newProduct){
	  			if(err) {
	  				console.log('product watcher error', err);
	  			} else {
	  				console.log('New Product', newProduct);
	  				$scope.productList.push(newProduct.args);
	  				upsertStore(storefrontAddress);
	  			}
	  		});
	  	};

	  	function upsertStore(address) {
	  		console.log("upserting store", address);
	  		var store = Storefront.at(address);

	  		var running;
	  		var numberOfProducts;
	  		var products;

	  		return store.running.call({from: $scope.account})
	  		.then(function(isRunning){
	  			console.log(isRunning);
	  			running = isRunning;
	  			return store.getProductArrayLength.call();
	  		})
	  		.then(function(number){
	  			console.log(number.toString(10));

		  		var s = {};
		  		s.store = address;
		  		s.running = running;

		  		if(typeof($scope.storeIndex[address] === 'undefined')){
		          	$scope.storeIndex[s.store] = $scope.stores.length;
		          	$scope.stores.push(s);
		          	var addProductWatcher = watchForNewProducts(address);
		          	$scope.$apply();
		  		} else {
		  			var index = $scope.storeIndex[s.store];
		  			$scope.store[index].running = s.running;
		  			$scope.$apply();
		  		}

		  		console.log($scope);
	  		});

	  	}

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
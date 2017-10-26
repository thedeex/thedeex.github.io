'use strict';

var app = angular.module('deex');

app.controller('admin', [
    '$rootScope',
    '$http',
    '$scope',
    '$window',
    // '$sce',
    '$timeout',
    '$stateParams',
    '$cookies',
    '$log',
    function adminCtrl($rootScope,
                       $http,
                       $scope,
                       $window, // https://docs.angularjs.org/api/ng/service/$window
                       // $sce,
                       $timeout,
                       $stateParams,
                       $cookies,
                       $log) {

        $log.debug('adminCtrl started');

        /*
        * in the view add id with controller name to parent div:
        * <div id="tokensCtrl">
        * use this id to access $scope in browser console:
        * angular.element(document.getElementById('tokensCtrl')).scope();
        * */

        // --- Alerts:
        $scope.alertDanger = null;  // red
        $scope.alertWarning = null; // yellow
        $scope.alertInfo = null;    // blue
        $scope.alertSuccess = null; // green


        $scope.contractDeployed = {
            '0': {
                'network': 'Ethereum network not connected',
                'address': 'no contract deployed on this network',
                // 'onBlock': 0,
                'etherscanLinkPrefix': 'https://etherscan.io/'
            },
            '1': {
                'network': 'MainNet',
                'address': '',
                // 'onBlock': 0,
                'etherscanLinkPrefix': 'https://etherscan.io/'
            },
            '3': {
                'network': 'Ropsten',
                'address': '0xdb6d4d030fbded6bb722a48475c3190bca28e61b',
                // 'onBlock': 1937093,
                'etherscanLinkPrefix': 'https://ropsten.etherscan.io/'
            },
            '4': {
                'network': 'Rinkeby',
                'address': '',
                // 'onBlock': 0,
                'etherscanLinkPrefix': 'https://rinkeby.etherscan.io/'
            }
        };

        /* ---- init sum ETH in the form:  */
        $scope.sumEth = 0.1;

        /* ---- check web3 connections and build functions: */

        if ($rootScope.web3.isConnected()) {

            $rootScope.web3.version.getNetwork(function (error, result) {
                if (error) {
                    $scope.alertDanger = error;
                    $scope.$apply();
                    $log.error(error);
                } else {
                    $rootScope.currentNetwork.network_id = result; // "3" for Ropsten, "1" for MainNet etc.
                    $rootScope.$apply(); // needed here
                    $scope.$apply(); // needed here
                    $log.debug(
                        '[token] web3.version.network: '
                        + $rootScope.currentNetwork.network_id
                    );

                    /* create contract: */

                    $.getJSON('contracts/DEEX.deployed.json', function (data) {

                        $scope.contractDeployedJson = data;
                        // console.log("$scope.$scope.contractDeployedJson:");
                        // console.log($scope.contractDeployedJson);

                        $.getJSON('contracts/DEEX.json', function (data) { // async

                            var DEEX = TruffleContract(data);

                            DEEX.network_id = $rootScope.currentNetwork.network_id;
                            DEEX.setProvider($rootScope.web3.currentProvider);

                            DEEX.at($scope.contractDeployedJson[$rootScope.currentNetwork.network_id]).then(
                                function (instance) {

                                    $scope.contract = instance;
                                    $scope.$apply();
                                    // $log.debug('[token] $scope.contract:');
                                    // $log.debug($scope.contract);
                                    $log.debug("$scope.contract.address: ", $scope.contract.address);

                                    // ----------------------------------------

                                    $scope.transactions = [];

                                    /* ----- get data from contract: */


                                    $scope.balanceOf = {}; // to store acc balances in tokens
                                    $scope.getBalanceOf = function (address) {
                                        var currentAddress = address.toString();
                                        $scope.contract.balanceOf.call(currentAddress).then(
                                            function (balanceInTokens) {
                                                $scope.balanceOf[currentAddress] = balanceInTokens.toNumber();
                                                $scope.$apply(); //
                                                $log.info('$scope.getBalanceOf : ' + address + ' : ' + $scope.balanceOf[currentAddress]);
                                            }
                                        ).catch(function (error) {
                                                $scope.alertDanger = error.toString();
                                                $log.error(error);
                                                $scope.$apply();
                                            }
                                        );
                                    };

                                    // -----------------------------------------

                                    $scope.getOwner = function () {
                                        $log.debug('smart contract owner');
                                        $scope.contract.owner.call().then(function (owner) {
                                                $scope.owner = owner;
                                                if (owner === $rootScope.web3.eth.defaultAccount) {
                                                    $scope.isContractOwner = true;
                                                }
                                                $scope.$apply(); //
                                                $log.log('owner:' + $scope.owner);
                                            }
                                        ).catch(function (error) {
                                                $scope.alertDanger = error.toString();
                                                $log.error(error);
                                                $scope.$apply();
                                            }
                                        );
                                    };

                                    // ----------------------------------------

                                    $scope.refreshBalances = function () {  // both ether and tokens on acc

                                        $log.debug('refreshing balances:');

                                        $scope.etherOnAccountOnBlockchain = {}; // ether on blockchain;

                                        // temporary Obj for ether on blockchain, to update $scope.etherOnAccountOnBlockchain when all
                                        // accounts data are received - for AngualarJS correct representation
                                        var etherOnAccountOnBlockchain = {};
                                        $scope.accountsArray = null; // representation of web3.eth.accounts

                                        var currentAccountsNumber = $rootScope.web3.eth.accounts.length;

                                        // for (var acc in web3.eth.accounts) {
                                        for (var i = 0; i < currentAccountsNumber; i++) { // safe for MetaMusk

                                            var account = $rootScope.web3.eth.accounts[i];
                                            if (account == null || account == undefined || account.toString().length < 1) {
                                                $log.error('account: ' + account.toString() + ' is false');
                                                return;
                                            }
                                            // acc ETH
                                            $rootScope.web3.eth.getBalance(account, function (error, result) {
                                                    // else: Mutable variable (account) is accessible from closure
                                                    var currentAccount = account.toString();
                                                    // else: Mutable variable (account) is accessible from closure
                                                    if (result) {
                                                        etherOnAccountOnBlockchain[currentAccount] =
                                                            $rootScope.web3.fromWei(
                                                                result.toNumber(), 'ether'
                                                            );
                                                        $log.log('ether on account: '
                                                            + currentAccount
                                                            + ' : '
                                                            + etherOnAccountOnBlockchain[currentAccount]
                                                        );
                                                        // see:
                                                        // https://www.hacksparrow.com/javascript-get-the-number-of-properties-in-an-object-without-looping.html
                                                        if (Object.keys(etherOnAccountOnBlockchain).length === currentAccountsNumber) {
                                                            // all accounts data gathered, update AngularJS {{etherOnAccountOnBlockchain}}
                                                            $scope.etherOnAccountOnBlockchain = etherOnAccountOnBlockchain;
                                                            // update AngularJS {{accountsArray}} - array of accounts numbers
                                                            $scope.accountsArray = web3.eth.accounts;
                                                            $log.info(JSON.stringify($scope.etherOnAccountOnBlockchain));
                                                        }
                                                    } else {
                                                        $log.error(error);
                                                    }
                                                }
                                            );
                                            // acc tokens
                                            $scope.getBalanceOf(account); // we protect arg passed to this func
                                        }
                                        // contact ETH
                                        $rootScope.web3.eth.getBalance($scope.contract.address, function (error, result) {
                                                if (result) {

                                                    $scope.etherBalanceOfContract =
                                                        $rootScope.web3.fromWei(result.toNumber(), 'ether');

                                                    $log.log('etherBalanceOfContract: '
                                                        + $scope.contract.address
                                                        + ' : '
                                                        + $scope.etherBalanceOfContract
                                                    );
                                                } else {
                                                    $log.error(error);
                                                }
                                            }
                                        );

                                        // contract tokens
                                        $scope.getBalanceOf($scope.contract.address);
                                        // $scope.$apply(); // <<< not needed here
                                    };

                                    $scope.getTotalSupply = function () {
                                        $scope.contract.totalSupply.call().then(function (totalSupply) {
                                                $scope.totalSupply = totalSupply.toNumber();
                                                $scope.$apply(); // <<< needed
                                                $log.log('Total supply:' + $scope.totalSupply);
                                            }
                                        ).catch(function (error) {
                                                $scope.alertDanger = error.toString();
                                                $log.error(error);
                                                $scope.$apply();
                                            }
                                        );
                                    };

                                    $scope.getTokenPriceInWei = function () {
                                        $scope.tokenPriceInWei = null;
                                        $scope.contract.tokenPriceInWei.call().then(function (tokenPriceInWei) {
                                                $scope.tokenPriceInWei = tokenPriceInWei.toNumber(); //
                                                $scope.$apply(); // <<< needed
                                                $log.info('tokenPriceInWei: ' + $scope.tokenPriceInWei);
                                            }
                                        ).catch(function (error) {
                                                $scope.alertDanger = error.toString();
                                                $log.error(error);
                                                $scope.$apply();
                                            }
                                        );
                                    };

                                    //
                                    $scope.setDefaultAccount = function (address) {

                                        $log.debug('$scope.setDefaultAccount() start');
                                        $scope.defaultAccount = '0x';
                                        //
                                        $rootScope.web3.eth.defaultAccount = address;
                                        $scope.defaultAccount = address;

                                        $log.debug('$rootScope.web3.eth.defaultAccount: ' + $rootScope.web3.eth.defaultAccount);
                                        $log.debug('$scope.defaultAccount: ' + $scope.defaultAccount);
                                        $scope.getOwner();
                                        $scope.refreshBalances();
                                    };

                                    //
                                    $scope.changeOwner = function (newOwner) {
                                        $log.debug('$scope.changeOwner() starts');
                                        if ($scope.isContractOwner) {
                                            var txParameters = {};
                                            txParameters.from = $rootScope.web3.eth.defaultAccount;
                                            // txParameters.from = $scope.defaultAccount;
                                            $log.debug('$scope.contract.newOwner txParameters: ');
                                            $log.debug(txParameters);
                                            $scope.contract.newOwner(newOwner, txParameters)
                                                .then(function (tx_id) {
                                                        $scope.getOwner(); // <<<< ---- !!!
                                                        $scope.lastTxId = tx_id;
                                                        $scope.transactions.push(tx_id);
                                                        $scope.$apply(); //
                                                    }
                                                ).catch(function (error) {
                                                    $scope.alertDanger = error.toString();
                                                    $log.error(error);
                                                    $scope.$apply();
                                                }
                                            );
                                        } else {
                                            $scope.alertDanger = "You are not owner of this contract, and can not call this function";
                                        }
                                    };

                                    /* ---------- START SALE: */
                                    // function startSale(uint256 _startUnixTime, uint256 _endUnixTime) public onlyBy(owner) returns (bool success){
                                    $scope._startUnixTime = Date.now();
                                    $scope._startUnixTimeString = Date.now();
                                    $scope._endUnixTime = Date.now();
                                    $scope.$apply();
                                    $log.debug('$scope._startUnixTime: ', $scope._startUnixTime);
                                    $log.debug('$scope._endUnixTime: ', $scope._endUnixTime);

                                    $scope.unixTimeToDateString = function (unixTime) {
                                        var date = new Date(unixTime);
                                        var dateString = date.toUTCString();
                                        return dateString;
                                    };
                                    $scope.startingSaleInProgress = false;
                                    $scope.startSale = function () {

                                        $log.debug("$scope.startSale() started");

                                        if ($scope.startingSaleInProgress) {
                                            $scope.alertDanger = "Processing previous request";
                                            return;
                                        }
                                        $scope.startingSaleInProgress = true;


                                        var txParameters = {};
                                        txParameters.from = $scope.defaultAccount;
                                        txParameters.gas = 4000000;
                                        // txParameters.value = parseInt($scope.sumWei);

                                        $scope.contract.startSale($scope._startUnixTime, $scope._endUnixTime, txParameters)
                                            .then(function (tx) {
                                                    $scope.transactions.push(tx);
                                                    $scope.alertInfo = tx;
                                                    $scope.startingSaleInProgress = false;
                                                    $scope.$apply(); //
                                                }
                                            ).catch(function (error) {
                                                $scope.alertDanger = error.toString();
                                                $log.error(error);
                                                $scope.startingSaleInProgress = false;
                                                $scope.$apply();
                                            }
                                        );
                                    }; // end startSale ()

                                    // --------------- END of functions
                                }
                            ); // end of function (instance)

                        }); // end of $.getJSON('contracts/DEEX.json'

                    }); // end of $.getJSON('contracts/DEEX.deployed.json'


                }
            });

        } else {

            $log.debug('[admin] web3 is not connected to Ethereum node');

        }

    } // end of function adminCtrl

]);


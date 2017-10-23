'use strict';

var app = angular.module('deex');

app.controller('tokens', [
    '$rootScope',
    '$http',
    '$scope',
    '$window',
    // '$sce',
    '$timeout',
    '$log',
    function tokensCtrl($rootScope,
                        $http,
                        $scope,
                        $window, // https://docs.angularjs.org/api/ng/service/$window
                        // $sce,
                        $timeout,
                        $log) {

        $log.debug('tokensCtrl started');

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
                'onBlock': 0,
                'etherscanLinkPrefix': 'https://etherscan.io/'
            },
            '1': {
                'network': 'MainNet',
                'address': '',
                'onBlock': 0,
                'etherscanLinkPrefix': 'https://etherscan.io/'
            },
            '3': {
                'network': 'Ropsten',
                // 'address': '0xc0eb1167f32e0ba556c539d2cf198dcc3f766d65',
                'address': '0x3f17f0cfbd825f81e73b65f0257aa126a46d65a6',
                'onBlock': 1919585,
                'etherscanLinkPrefix': 'https://ropsten.etherscan.io/'
            },
            '4': {
                'network': 'Rinkeby',
                'address': '0xd5df7d4c3559ffe43f4a76b465d0632750abee91',
                'onBlock': 1107555,
                'etherscanLinkPrefix': 'https://rinkeby.etherscan.io/'
            }
        };

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
                        + ' ('
                        + $scope.contractDeployed[$rootScope.currentNetwork.network_id].network
                        + ') '
                    );

                    /* create contract: */
                    $.getJSON('contracts/DEEX.json', function (data) { // async

                        var DEEX = TruffleContract(data);

                        DEEX.network_id = $rootScope.currentNetwork.network_id;
                        DEEX.setProvider($rootScope.web3.currentProvider);

                        DEEX.at(
                            $scope.contractDeployed[$rootScope.currentNetwork.network_id].address
                        ).then(function (instance) {

                            $scope.contract = instance;
                            $scope.$apply();
                            $log.debug('[token] $scope.contract:');
                            $log.debug($scope.contract);

                            /* --- Contract basic functions for interface : */
                            //  ----------------------------------------
                            $scope.refreshEthUsd = function () {
                                $log.debug('$scope.refreshETH() starts');
                                $scope.ethusd = 'xxx.xx';
                                $scope.ethbtc = 'xxx.xx';
                                $http({
                                    method: 'GET',
                                    url: 'https://api.etherscan.io/api?module=stats&action=ethprice',
                                    headers: {
                                        'Content-Type': 'application/json'
                                    }
                                }).then(function (response) {
                                    // this callback will be called asynchronously
                                    // when the response is available
                                    $log.debug(response);
                                    if (response.data && response.data.result) {
                                        // $scope.currentEthUsd = response.data.result;
                                        $scope.ethusd = response.data.result.ethusd;
                                        $scope.ethbtc = response.data.result.ethbtc;
                                        // $scope.$apply(); // < not needed here
                                    }

                                }, function (error) {
                                    // called asynchronously if an error occurs
                                    // or server returns response with an error status.
                                    $log.error(error);
                                });
                            };

                            // ----------------------------------------

                            $scope.transactions = [];

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

                            $scope.tokenPriceInWei = function () {
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
                                                $scope.isManager(); // - ?
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

                            /*
                            * @param referrer - string
                            * */
                            $scope.buyTokensTxInProgress = false;
                            $scope.buyTokensWithReferrerAddress = function () {
                                $log.debug('$scope.buyTokensWithReferrerAddress');
                                $log.debug($scope.sumWei);
                                $log.debug($scope.referrer);
                                if ($scope.buyTokensTxInProgress) {
                                    return; // previous tx not finished
                                }
                                $scope.buyTokensTxInProgress = true;

                                $scope.sumWei = parseInt($scope.sumWei);

                                // TODO: optimize this
                                if ($scope.sumWei == null || typeof $scope.sumWei === 'undefined') {
                                    $scope.sumWei = 0;
                                }
                                if ($scope.referrer == null || typeof $scope.referrer !== 'string' || $scope.referrer.length < 42) {
                                    $scope.referrer = '0x000000000000000000000000000000';
                                }
                                var txParameters = {};
                                txParameters.from = $scope.defaultAccount;
                                txParameters.value = parseInt($scope.sumWei);
                                $log.debug(txParameters);

                                $scope.contract.buyTokensWithReferrerAddress($scope.referrer, txParameters)
                                    .then(function (tx_id) {
                                            $scope.refreshBalances();
                                            $scope.lastTxId = tx_id;
                                            $scope.transactions.push(tx_id);
                                            // $scope.buyTokensSuccess = 'You got new token(s)!';
                                            $scope.buyTokensSuccess = 'Transaction successful!';
                                            $scope.buyTokensSuccessTx = tx_id;
                                            $scope.buyTokensTxInProgress = false;
                                            $scope.$apply(); //
                                        }
                                    ).catch(function (error) {
                                        $scope.alertDanger = error.toString();
                                        $scope.buyTokensError = error;
                                        $log.error(error);
                                        $scope.buyTokensTxInProgress = false;
                                        $scope.$apply();
                                    }
                                );
                            }; // end buyTokensWithReferrerAddress()

                            $scope.depositEther = function (sumInEtherToDepositToContract) {
                                $log.debug('$scope.depositEther starts');
                                sumInEtherToDepositToContract = parseInt(sumInEtherToDepositToContract);
                                var txParameters = {};
                                txParameters.from = $scope.defaultAccount;
                                txParameters.value = web3.toWei(sumInEtherToDepositToContract, 'ether');
                                $log.debug(txParameters);

                                $scope.contract.depositEther(txParameters)
                                    .then(function (tx_id) {
                                            $scope.refreshBalances();
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
                            }; // end of $scope.depositEther()


                            // >>>>>>>> RUN (start)
                            $scope.refreshEthUsd();
                            if ($rootScope.web3.eth.accounts.length >= 1) {
                                $scope.setDefaultAccount($rootScope.web3.eth.accounts[0]);
                            } else {
                                $scope.alertDanger = 'Accounts not detected. ' +
                                    'Please, click on the "connect" in the upper right corner of Mist,' +
                                    ' and authorize one or more accounts to work with this smart contract,'
                                    + ' or unlock account in MetaMask';
                                $scope.noAccountsDetected = true;
                                return;
                            }
                            $scope.getTotalSupply();
                            $scope.getOwner();
                            $scope.tokenPriceInWei();


                            // ----------------------
                        });

                    });

                }
            });


        } else {

            $log.error('[tokens] web3 is not connected to Ethereum node');

        }


    } // end of function smartContractCtrl

]);


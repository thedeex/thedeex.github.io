"use strict";

// jquery-backstretch.com
$(document).ready(function () {
    // jquery-backstretch.com
    // code for the background slider:
    $.backstretch(
        [
            "images/bg_img.jpg",
            "images/bg_img2.jpg",
            "images/bg_img3.jpg"
        ], {
            fade: 750,
            duration: 2500
        }
    );
    // one image only:
    /*
    $.backstretch(
        "images/bg_img.jpg"
    );
    */
});

/* ================== AngularJS ======= */

var app = angular.module("deex", [
    'ngCookies', // (1.6.6) https://code.angularjs.org/1.6.6/docs/api/ngCookies
    // 'ngRoute',
    'ui.router',
    'ngProgress', // https://github.com/VictorBjelkholm/ngProgress
    'ngclipboard', // https://sachinchoolur.github.io/ngclipboard/
    'yaru22.md' // https://github.com/yaru22/angular-md
]);

app.config(function ($stateProvider, // from ui.router replaces AngularJS native $routeProvider
                     $urlRouterProvider,
                     $locationProvider,
                     $sceDelegateProvider,
                     $logProvider) {

    // https://docs.angularjs.org/api/ng/provider/$logProvider
    $logProvider.debugEnabled(true);

    /*
     $routeProvider
     .when('/', {
     templateUrl: 'views/home.html',
     controller: 'HomeController'
     });
     */

    $urlRouterProvider.otherwise("/");

    $stateProvider
    // .state('home', {
    //         url: '/',
    //         controller: 'HomeController',
    //         templateUrl: 'views/home.html'
    //         // resolve: {
    //         //     goat: function (GoatService) {
    //         //         return GoatService.getGoat();
    //         //     }
    //         // }
    //     }
    // )
        .state('tokens', {
                // url: '/tokens',
                // url: '/',
                // use as var referrer = $stateParams.referrer;
                // should be eth address, like: 0x6ae8e8c1accaa38d05f30eb107b99af89e3fd349
                //
                url: '/{referrer}',
                controller: 'tokens',
                templateUrl: 'views/tokens.html'
            }
        )
        .state('admin', {
                // url: '/tokens',
                // url: '/',
                // use as var referrer = $stateParams.referrer;
                // should be eth address, like: 0x6ae8e8c1accaa38d05f30eb107b99af89e3fd349
                //
                url: '/admin',
                controller: 'admin',
                templateUrl: 'views/admin.html'
            }
        )
        .state('manual', {
                // url: '/tokens',
                // url: '/',
                // use as var referrer = $stateParams.referrer;
                // should be eth address, like: 0x6ae8e8c1accaa38d05f30eb107b99af89e3fd349
                //
                url: '/manual',
                controller: 'manual',
                templateUrl: 'views/manual.html'
            }
        );


    // see:
    // http://stackoverflow.com/a/41273403/1697878
    // this resolves %2F instead of / in urls problem
    $locationProvider.hashPrefix('');


    $sceDelegateProvider.resourceUrlWhitelist([
        'self', // Allow same origin resource loads
        // 'https://raw.githubusercontent.com/Cryptonomica/arbitration-rules/**' // works too !
        'https://api.coinmarketcap.com/v1/ticker/ethereum/'
    ]);

}); // end of app.config()

app.run([
        '$window',
        // '$sce',
        '$rootScope', // to access $rootScope in browser console: angular.element('body').scope().$root
        'ngProgressFactory',
        '$log',
        function ($window,
                  // $sce,
                  $rootScope,
                  ngProgressFactory,
                  $log) {

            $log.debug('app.run started');

            /* ngProgress */
            $rootScope.progressbar = ngProgressFactory.createInstance();
            $rootScope.progressbar.setHeight('5px'); // any valid CSS value Eg '10px', '1em' or '1%'
            $rootScope.progressbar.setColor('red');

            $log.debug('$rootScope.progressbar:');
            $log.debug($rootScope.progressbar);

            /* web3 instantiation */
            // see 'NOTE FOR DAPP DEVELOPERS' on https://github.com/ethereum/mist/releases/tag/v0.9.0
            // To instantiate your (self-included) web3.js lib you can use:
            if (typeof window.web3 !== 'undefined') {

                $log.debug('[app.js] web3 object presented by provider:');
                $log.debug(window.web3.currentProvider);

                $rootScope.web3 = new Web3(window.web3.currentProvider);

                $log.debug('and will be used in $rootScope.web3:');
                $log.debug($rootScope.web3);

            } else {

                $log.debug('web3 object is not provided by client app');
                $log.debug('and will be instantiated from web3.js lib');

                $rootScope.web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

                $log.debug('$rootScope.web3: ');
                $log.debug($rootScope.web3);
            }

            // to acess web3 instance in browser console:
            // angular.element('body').scope().$root.web3


            $rootScope.currentNetwork = {
                'network_id': '', // integer
                'node': '',
                'ethereumProtocolVersion': '',
                'connected': false
            };

            // check if web3 is connected to Ethereum node:
            // to work with Ropsten run:
            // geth --fast --cache=1048 --testnet --rpc --rpcapi "eth,net,web3" --rpccorsdomain '*' --rpcaddr localhost --rpcport 8545
            if ($rootScope.web3.isConnected()) {

                $rootScope.currentNetwork.connected = true;
                $rootScope.$apply();

                $log.debug('web3 is connected to Ethereum node:');

                $rootScope.web3.version.getNode(function (error, result) {
                    if (error) {
                        $log.debug(error);
                    } else {
                        $rootScope.currentNetwork.node = result;

                        $rootScope.$apply();
                        $log.debug('web3.version.node: ' + $rootScope.currentNetwork.node);
                        // "Geth/v1.7.2-stable-1db4ecdc/linux-amd64/go1.9"
                    }
                });

                $rootScope.web3.version.getEthereum(function (error, result) {
                    if (error) {
                        $log.debug(error);
                    } else {
                        $rootScope.currentNetwork.ethereumProtocolVersion = result;
                        $rootScope.$apply();
                        $log.debug('[app.run] web3.version.ethereum: ' + $rootScope.currentNetwork.ethereumProtocolVersion);
                        // the Ethereum protocol version
                    }
                });

            } else {

                $rootScope.web3isConnected = false;
                $log.error('[app.run] web3 is not connected to Ethereum node');
            }


        } // end: app.run
    ]
);



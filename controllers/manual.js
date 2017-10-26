'use strict';

var app = angular.module('deex');

app.controller('manual', [
    '$rootScope',
    '$http',
    '$scope',
    '$window',
    // '$sce',
    '$timeout',
    '$stateParams',
    '$cookies',
    '$log',
    function manualCtrl($rootScope,
                        $http,
                        $scope,
                        $window, // https://docs.angularjs.org/api/ng/service/$window
                        // $sce,
                        $timeout,
                        $stateParams,
                        $cookies,
                        $log) {

        $log.debug('manualCtrl started');

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


    } // end of function manualCtrl

]);


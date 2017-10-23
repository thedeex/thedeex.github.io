'use strict';

var app = angular.module('deex');

app.directive('navTabsDirective', function () {
    return {
        restrict: 'EA', //E = element, A = attribute, C = class, M = comment
        templateUrl: 'views/tabs.directive.html'
    };
});

app.directive('smartContractInfo', function () {
    return {
        restrict: 'EA', //E = element, A = attribute, C = class, M = comment
        templateUrl: 'views/smart-contract-info.html'
    };
});

app.directive('buyTokens', function () {
    return {
        restrict: 'EA', //E = element, A = attribute, C = class, M = comment
        templateUrl: 'views/buyTokens.html'
    };
});

app.directive('userAccounts', function () {
    return {
        restrict: 'EA', //E = element, A = attribute, C = class, M = comment
        templateUrl: 'views/user.accounts.html'
    };

});

app.directive('transactions', function () {
    return {
        restrict: 'EA', //E = element, A = attribute, C = class, M = comment
        templateUrl: 'views/transactions.html'
    };
});

app.directive('footer', function () {
    return {
        restrict: 'EA', //E = element, A = attribute, C = class, M = comment
        templateUrl: 'views/footer.html'
    };
});
app.directive('alerts', function () {
    return {
        restrict: 'EA', //E = element, A = attribute, C = class, M = comment
        templateUrl: 'views/alerts.html'
    };
});



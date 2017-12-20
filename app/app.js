'use strict';

var bringGApp = angular.module('bringGApp', []);

// Directives
// ====================
bringGApp.directive('usersList', function() {
    return {
        restrict: 'E',
        templateUrl: './components/directives/usersList.html'
    };
});

bringGApp.directive('actionsBar', function() {
    return {
        restrict: 'E',
        templateUrl: './components/directives/actionsBar.html'
    };
});

// Controller
// ====================

bringGApp.controller("usersConroller",["$scope", "usersService",function(scope, usersService) {

    // Privates
    const SORT_TYPES = {
        age: 'age',
        name: 'name'
    };

    const MIN_USER_AGE = 5;
    const MAX_USER_AGE = 120;
    const USER_ZOOM_LEVEL = 6;

    var lastInfoWindow = null,
        markers = [];

    function zoomOnUser(map,user) {
        const userPos = {lat: user.latitude, lng: user.longitude};

        //map.setCenter({lat:32.305308, lng: 34.844020});
        map.setZoom(USER_ZOOM_LEVEL);
        map.setCenter(userPos);
    }

    function addUserToMap(map, user, centerOnUser) {

        const infoWindowBgkColor = user.isActive ? "white" : '#e5e5e5';
        const userPos = {lat: user.latitude, lng: user.longitude};

        var marker = new google.maps.Marker({
                position: userPos,
                map: map,
                title: user.name
            }),
            markerInfoWindow,
            infowindow;

        markers.push({
            marker : marker,
            id: user._id
        });

        markerInfoWindow = '<div id="content" style=background-color:' + infoWindowBgkColor + '>'+
            '<h1 id="firstHeading" class="firstHeading">' + user.name+ '</h1>'+
            '<div id="bodyContent">'+
            '<p><b>Age:\t</b>' + user.age + '</p>'+
            '<p><b>Email:\t</b>' + user.email + '</p>'+
            '</div>'+
            '</div>';

        infowindow = new google.maps.InfoWindow({
            content: markerInfoWindow
        });

        marker.addListener('click', function() {
            if (lastInfoWindow) {
                lastInfoWindow.close();
            }

            lastInfoWindow = infowindow;
            infowindow.open(map, marker);
        });

        // This happens when adding a user manually
        if (centerOnUser) {
            zoomOnUser(map, user);
        }
    }

    // Exposed

    this.newUserInfo = {
        name: "",
        age: null,
        email : "",
        latitude : null,
        longitude: null,
        isActive: false
    };

    // Become true if no JSON returns
    this.networkError = false;

    // false on start to avoid showing UI, becomes true when json returns
    this.hasUserInfo = false;

    this.sortBy = SORT_TYPES.age;
    this.usersList = [];

    this.sortByAge = function sortByAge() {
        this.sortBy = SORT_TYPES.age;
    };

    this.sortByName = function sortByName() {
        this.sortBy = SORT_TYPES.name;
    };

    this.isSortByAge = function isSortByName() {
        return this.sortBy === SORT_TYPES.age;
    };

    // Used by add user form to validate input and enable button
    this.validateNewUser = function validateNewUser() {

        const baseDetailsOK =
            this.newUserInfo.name.length &&
            (this.newUserInfo.age >= MIN_USER_AGE) && (this.newUserInfo.age <= MAX_USER_AGE) &&
            this.newUserInfo.email.length &&
            (this.newUserInfo.latitude != null) &&
            (this.newUserInfo.longitude != null);

        var
            mapValidator = new RegExp("^-?([1-8]?[1-9]|[1-9]0)\\.{1}\\d{1,6}"),
            mapDetailsOK;

        if (baseDetailsOK) {
            mapDetailsOK = mapValidator.exec(this.newUserInfo.latitude) && mapValidator.exec(this.newUserInfo.longitude);
        }

        document.getElementById("confirmAddModal").disabled = !(baseDetailsOK && mapDetailsOK);
    };

    // Adds the user to the provider and updates map
    this.addUser = function addUser() {
      this.usersList = usersService.addUser(this.newUserInfo);

      addUserToMap(this.map, this.newUserInfo, true);

      this.newUserInfo = {
          name: "",
          age: null,
          email : "",
          latitude : null,
          longitude: null,
          isActive: false
      }
    };

    // Removes user from the provider and updates map
    this.removeUser = function removeUser(userId) {
      var markerIndexToRemove,
          markerToRemove;

      this.usersList = usersService.removeUser(userId);

      markerIndexToRemove = markers.findIndex(function(marker) {
          return marker.id === userId;
      });

      if (markerIndexToRemove !== -1) {
          markerToRemove = markers[markerIndexToRemove];
          markerToRemove.marker.setMap(null);
          markers.splice(markerIndexToRemove, 1);
      }
    };

    this.userClick = function userClick(user) {
        zoomOnUser(this.map, user);
    };

    this.initMap = function initMap() {

        if (!this.usersList.length) return;

        var map = new google.maps.Map(document.getElementById('map'), {
            zoom: 2,
            center: {lat: this.usersList[0].latitude, lng: this.usersList[0].longitude}
        });

        this.map = map;

        this.usersList.forEach(function(user) {
            addUserToMap(map,user, false);
        }) ;
    };

    // To be used inside our success/error functions
    const promiseInfo = {
        userController: this,
        scope: scope
    };

    usersService.refresh().then(function(usersList) {
      promiseInfo.userController.usersList = usersList;
      promiseInfo.userController.initMap();

        promiseInfo.userController.hasUserInfo = true;
        promiseInfo.userController.networkError = false;
        promiseInfo.scope.$apply();

    }).catch(function(/*error*/) {
        promiseInfo.userController.hasUserInfo = false;
        promiseInfo.userController.networkError = true;
        promiseInfo.scope.$apply();
    });

}])
    // Config addded for demosntartion configuration of download from a possible outside source, for example can return
    // with the user informatino after credentials have been verified (user role being admin)
.config(["usersServiceProvider", function (usersServiceProvider) {
    usersServiceProvider.setDataUrl("http://www.json-generator.com/api/json/get/bTDyYqBMRK?indent=2");
}]);


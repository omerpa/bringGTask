

bringGApp.provider("usersService", [function () {

    // Private members
    var jsonUrl = "",
        users = [];

    function generateUserId() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    this.setDataUrl = function setDataUrl(_dataUrl) {
        jsonUrl = _dataUrl;
    };

    this.getUsers = function getUsers() {
        return users;
    };

    this.removeUser = function removeUser(userId) {
        users = users.filter(function(user) {
            return user._id != userId;
        })

        return users;
    }

    this.addUser = function addUser(_newUserInfo) {

        // Update object passed in
        const imgNum = Math.floor((Math.random() * 4));

        // Give our users dummty images
        _newUserInfo.img = "./resrources/images/" + imgNum + ".png";
        _newUserInfo._id = generateUserId();

        // Push a brand new one into container
        var newUserInfo = Object.assign({}, _newUserInfo);

        users.push(newUserInfo);

        return users;
    }

    this.refresh = function refresh() {
        return new Promise(function(resolve, reject) {

            $.ajax({
                type: 'GET',
                url: jsonUrl,
                dataType: 'json',
                success: function (data) {
                    users = data.slice();

                    // Populate dummy images
                    users.forEach(function(user,index) {
                        const imgNum = Math.floor((Math.random() * 4));

                        user.img = "./resrources/images/" + imgNum + ".png";
                    });

                    resolve(users);
                },
                error : function(err) {
                    reject(err);
                }
            });
        });
    };

    this.$get = [function () {
        return this;
    }];
}]);
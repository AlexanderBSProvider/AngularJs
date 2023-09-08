var app = angular.module('myApp', ['ngRoute']);

//Reset user and view state
function resetUserState ($scope) {
    $scope.$parent.userViewState = '';
    $scope.$parent.user = {};
}

function generateRandomNumericId() {
    let randomId = '';

    for (let i = 0; i < 5; i++) {
        const randomDigit = Math.floor(Math.random() * 10); // Generates a random digit (0-9)
        randomId += randomDigit;
    }

    return randomId;
}

//Get errors from form
function getFormErrorMessages(form) {
    var errorMessages = form.$error.userFormValidation.map((msg) => {
        return msg.$errorMessages.toString();
    });

    errorMessages = errorMessages.toString().split(',');
    return errorMessages;
}

//Check if username is unique
function isUniqueUsername(user, UserService) {
    var users = UserService.getUsers();
    var isUnique = true;

    users.forEach((u) => {
        if (u.username === user.username && u.id !== user.id) {
            isUnique = false;
        }
    })

    return isUnique;
}

function getSuccessMessage(state) {
    var successMessage = '';

    if (state === 'delete') {
        successMessage = 'User deleted successfully';
    }
    if (state === 'edit') {
        successMessage = 'User edited successfully';
    }
    if (state === 'create') {
        successMessage = 'User created successfully';
    }

    return successMessage;
}

function getErrorMessage(state, unique) {
    var errorMessage = '';

    if (state === 'edit') {
        errorMessage = 'User not edited';
    }
    if (state === 'create') {
        errorMessage = 'User not created';
    }

    if (!unique) {
        errorMessage = errorMessage + ', username is not unique'
    }
    console.log('errorMessage',errorMessage)
    return errorMessage;
}

function showMessage(scope, msgType, $timeout) {
    console.log('here')
    scope.$parent[msgType] = true;
    $timeout(function() {
        scope.$parent[msgType] = false;
    }, 3000);
}

app.controller('UserListController', function($scope, $rootScope, UserService) {
    $scope.userList = UserService.getUsers();

    $scope.repeatPassword = '';
    $scope.successMessage = '';
    $scope.errorMessage = '';

    $scope.originalUsername = '';

    $scope.form = {
        userForm: {}
    };

    $scope.setUserState = function(state, user, index) {
        $scope.userIndex = index;
        $scope.userViewState = state;

        if (!user) {
            $scope.user = {
                username: '',
                first_name: '',
                last_name: '',
                email: '',
                type: '',
                password: ''
            };
        } else {
            $scope.user = {...user};
        }

        $scope.originalUsername = $scope.user.username;

        if (state === 'edit') {
            // Didn't find other way to make it properly in AngularJS...
            document.querySelector('[name="repeatPassword"]').value = user.password;
            $scope.repeatPassword = user.password;
        } else {
            document.querySelector('[name="repeatPassword"]').value = '';
            $scope.repeatPassword = '';
        }

        $scope.form.userForm.$setPristine();
        $scope.form.userForm.$setUntouched();
    };

});

app.controller('UserViewController', function($scope, UserService, $timeout) {
    $scope.userTypes = ['Admin', 'Driver'];

    function setFormControlsTouched(form) {
        angular.forEach(form.$error, function(controls) {
            angular.forEach(controls, function(control) {
                control.$setTouched();
            });
        });
    }

    function validateForm(form) {
        var errorMessages = [];

        if (form.$invalid) {
            errorMessages = getFormErrorMessages(form);
        }

        return errorMessages;
    }

    function isPasswordsMatch(password, repeatPassword) {
        return password === repeatPassword;
    }

    $scope.saveUser = function(user, form) {
        var errorMessages = validateForm(form);
        var unique = true;

        if (!isUniqueUsername(user, UserService)) {
            errorMessages.push('Username is not unique');
            unique = false;
        }

        if (!isPasswordsMatch(form.password.$viewValue, form.repeatPassword.$viewValue)) {
            errorMessages.push('Passwords do not match.');
        }

        if (!errorMessages?.length) {
            UserService.updateUser(user, $scope.userIndex);
            $scope.$parent.successMessage = getSuccessMessage('edit');
            showMessage($scope, 'success', $timeout);
            $scope.$parent.originalUsername = user.username;
        } else {
            $scope.$parent.errorMessage = getErrorMessage('edit', unique);
            showMessage($scope,'error', $timeout);
            setFormControlsTouched(form);
        }
    };

    $scope.createUser = function(user, form) {
        var errorMessages = validateForm(form);
        var unique = true;

        if (!isUniqueUsername(user, UserService)) {
            errorMessages.push('Username is not unique');
            unique = false;
        }

        if (!isPasswordsMatch(form.password.$viewValue, form.repeatPassword.$viewValue)) {
            errorMessages.push('Passwords do not match.');
        }

        if (!errorMessages?.length) {
            UserService.createUser(user);
            resetUserState($scope, form);
            $scope.$parent.errorMessage = getSuccessMessage('create');
            showMessage($scope,'success', $timeout);
        } else {
            $scope.$parent.errorMessage = getErrorMessage('create', unique);
            showMessage($scope,'error', $timeout);
            setFormControlsTouched(form);
        }
    };

    $scope.deleteUser = function() {
        UserService.deleteUser($scope.userIndex);
        resetUserState($scope);
        $scope.successMessage = getSuccessMessage('create');
    };

    $scope.closeView = function() {
        resetUserState($scope);
    };
});

app.factory('UserService', function() {

    var users = [
        {
            id: '1234',
            username: 'Phill',
            first_name: 'Grill',
            last_name: 'Doe',
            email: 'Phill.Grill@example.com',
            type: 'Admin',
            password: 'qwertyRRR0'
        },
        {
            id: '5433',
            username: 'java_script',
            first_name: 'Java',
            last_name: 'Script',
            email: 'Java.Script@example.com',
            type: 'Driver',
            password: 'qwertyRRR1'
        },
        {
            id: '5234',
            username: 'JimBoss',
            first_name: 'Jim',
            last_name: 'Boss',
            email: 'john.bb@example.com',
            type: 'Admin',
            password: 'qwertyRRR2',
        },
        {
            id: '1433',
            username: 'java',
            first_name: 'Java',
            last_name: 'Java',
            email: 'Java@example.com',
            type: 'Driver',
            password: 'qwertyRRR33333333'
        }
    ];

    return {
        getUsers: function() {
            return users;
        },
        createUser: function(user) {
            var newUser = {
                id: generateRandomNumericId(),
                ...user
            }

            users.push(newUser);
        },
        updateUser: function(user, index) {
            users[index] = {...user};
        },
        deleteUser: function(index) {
            users.splice(index, 1);
        }
    };
});

app.directive('userFormValidation', function () {
    return {
        require: 'ngModel',
        link: function (scope, element, attrs, ngModel) {

            ngModel.$validators.userFormValidation = function (modelValue, viewValue) {
                console.log()
                var value = modelValue || viewValue;
                var valid = true;
                var errorMessages = [];

                if (attrs.name === 'username' && !value) {
                    valid = false;
                    errorMessages.push('Username is required');
                }

                if (attrs.name === 'password') {
                    if (!value) {
                        errorMessages.push('Password is required');
                        valid = false;
                    }
                    if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/g.test(value)) {
                        errorMessages.push('Password must be 8 characters long with one letter and one number');
                        valid = false;
                    }
                }

                if (attrs.name === 'email') {
                    if (!value) {
                        errorMessages.push('Email is required');
                        valid = false;
                    }
                    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/g.test(value)) {
                        errorMessages.push('Invalid Email');
                        valid = false;
                    }
                }

                if (attrs.name === 'first_name' && !value) {
                        errorMessages.push('First name is required');
                        valid = false;
                }

                if (attrs.name === 'last_name' && !value) {
                        errorMessages.push('Last name is required');
                        valid = false;
                }

                if (attrs.name === 'type' && !value) {
                        errorMessages.push('Type is required');
                        valid = false;
                }

                // Display error messages
                ngModel.$setValidity('userFormValidation', valid);
                ngModel.$errorMessages = errorMessages;

                return valid;
            };
        }
    };
});

app.config(function($routeProvider, $locationProvider) {
    $routeProvider
        .when('/', {
            templateUrl: 'index.html',
        })
        .when('/404', {
            templateUrl: '404.html',
            controller: 'NotFoundController'
        })
        .when('/403', {
            templateUrl: '403.html',
            controller: 'ForbiddenController'
        })
        .otherwise({ redirectTo: '/404' });

    $locationProvider.html5Mode(true);
});

app.controller('NotFoundController', function($scope) {
});

app.controller('ForbiddenController', function($scope) {
});



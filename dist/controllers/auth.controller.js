"use strict";

function AuthController() {

    return {
        isAuthorized: isAuthorized, isAuthorizedAsync: isAuthorizedAsync, setUser: setUser,
        setRoles: setRoles, isAuthorizedPromise: isAuthorizedPromise, getIndex: getIndex
    };
}

module.exports = AuthController();
//# sourceMappingURL=auth.controller.js.map
var autoLogOut = /** @class */ (function () {
    function autoLogOut(timeout, sessionKey, debug) {
        if (timeout === void 0) { timeout = 10; }
        if (sessionKey === void 0) { sessionKey = 'timestamp'; }
        if (debug === void 0) { debug = false; }
        this.signOutCalled = false;
        this._config = { timeout: timeout, sessionKey: sessionKey, debug: debug };
        this._initHandlers();
        this.ID = Date.now();
    }
    // initialization Method with configuration
    autoLogOut.init = function (config) {
        var _config = config || {};
        autoLogOut.instance = new autoLogOut(_config.timeout, _config.sessionKey, _config.debug);
        return autoLogOut.instance;
    };
    // called OnSignOut callback
    autoLogOut.prototype.signOut = function () {
        clearTimeout(this.autoSignOutTimeOut);
        this.signOutCalled = true;
        this.onSignOut();
    };
    // attach handler for updating local storage
    autoLogOut.prototype._initHandlers = function () {
        var _this = this;
        // Add handler window unload event
        window.onbeforeunload = function () {
            _this._extendSessionTime();
        };
        // Add handler on  document ready event
        document.addEventListener("DOMContentLoaded", function () {
            _this._extendSessionTime();
        }, false);
        // Add throttle event listeners
        window.addEventListener('mousemove', this.throttleEvents());
        window.addEventListener('scroll', this.throttleEvents());
        window.addEventListener("resize", this.throttleEvents());
        // Add localstorage change event
        this._addStorageEvent();
    };
    // update auto logout timeout
    autoLogOut.prototype._setUpLogOutCalls = function () {
        var _this = this;
        if (this._config.debug) {
            console.log(this.ID + ": Update the Local Storage with new value");
        }
        var expirationTime = this.getExpirationSessionTime();
        var currentTimestamp = Date.now();
        var difference = expirationTime - currentTimestamp;
        if (difference <= 0) {
            this._logOut();
        }
        else {
            if (this._config.debug) {
                console.log(this.ID + ": Register auto logout timeout with time: " + difference);
            }
            if (this.autoSignOutTimeOut != null) {
                clearTimeout(this.autoSignOutTimeOut);
                this.autoSignOutTimeOut = null;
            }
            this.autoSignOutTimeOut = setTimeout(function () {
                _this._logOut();
            }, difference);
        }
    };
    // experimental purpose: add hook on every ajax request for update localstorage
    autoLogOut.prototype._addHookToXMLRequest = function () {
        var oldSend;
        oldSend = XMLHttpRequest.prototype.send;
        var self = this;
        XMLHttpRequest.prototype.send = function () {
            self._extendSessionTime();
            oldSend.apply(this, arguments);
        };
    };
    // throttle Event handler
    autoLogOut.prototype.throttleEvents = function () {
        var _this = this;
        var timeoutEvent;
        return function () {
            if (timeoutEvent) {
                clearTimeout(timeoutEvent);
                timeoutEvent = null;
            }
            timeoutEvent = setTimeout(function () {
                if (_this._config.debug) {
                    console.log(_this.ID + ": Event called");
                }
                _this._extendSessionTime();
            }, 100);
        };
    };
    // localstorage change event
    autoLogOut.prototype._addStorageEvent = function () {
        var _this = this;
        window.addEventListener('storage', function (e) {
            if (e.key == _this._config.sessionKey) {
                if (e.newValue == null) {
                    return;
                }
                _this._setUpLogOutCalls();
            }
        });
    };
    // set timestamp in localstorage
    autoLogOut.prototype._setLocalStorageVariable = function (date) {
        localStorage.setItem(this._config.sessionKey, date.getTime());
        localStorage.setItem('date', date.toISOString());
    };
    // extend the session timeout
    autoLogOut.prototype._extendSessionTime = function () {
        if (!this.signOutCalled) {
            var date = new Date();
            date.setMinutes(date.getMinutes() + this._config.timeout);
            this._setLocalStorageVariable(date);
            this._setUpLogOutCalls();
        }
    };
    // get last updated timestamp
    autoLogOut.prototype.getExpirationSessionTime = function () {
        var data = localStorage.getItem(this._config.sessionKey);
        return data || 0;
    };
    // remove item from storage
    autoLogOut.prototype.removeFromStorage = function (key) {
        localStorage.removeItem(key);
    };
    autoLogOut.prototype._logOut = function () {
        if (this._config.debug) {
            console.log(this.ID + ": Call SignOut");
        }
        this.signOutCalled = true;
        this.removeFromStorage(this._config.sessionKey);
        this.onSignOut();
    };
    return autoLogOut;
}());
//# sourceMappingURL=autoLogOut.js.map
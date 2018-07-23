var autoSignOut = /** @class */ (function () {
    function autoSignOut() {
        this._config = { timeout: 10, debug: true, sessionKey: 'timestamp' };
        this.signOutCalled = false;
    }
    // initialization Method with configuration
    autoSignOut.init = function (config) {
        autoSignOut.instance = new autoSignOut();
        config.sessionKey = config.sessionKey || 'timestamp';
        config.timeout = config.timeout || 20;
        autoSignOut.instance._config = config;
        autoSignOut.instance._initHandlers();
        autoSignOut.instance.ID = Date.now();
        return autoSignOut.instance;
    };
    // called OnSignOut callback
    autoSignOut.prototype.signOut = function () {
        clearTimeout(this.autoSignOutTimeOut);
        this.signOutCalled = true;
        this.onSignOut();
    };
    // attach handler for updating local storage
    autoSignOut.prototype._initHandlers = function () {
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
    autoSignOut.prototype._setUpLogOutCalls = function () {
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
    autoSignOut.prototype._addHookToXMLRequest = function () {
        var oldSend;
        oldSend = XMLHttpRequest.prototype.send;
        var self = this;
        XMLHttpRequest.prototype.send = function () {
            self._extendSessionTime();
            oldSend.apply(this, arguments);
        };
    };
    // throttle Event handler
    autoSignOut.prototype.throttleEvents = function () {
        var _this = this;
        var timeoutEvent;
        return function () {
            if (_this._config.debug) {
                console.log(_this.ID + ": Event called");
            }
            if (timeoutEvent) {
                clearTimeout(timeoutEvent);
                timeoutEvent = null;
            }
            timeoutEvent = setTimeout(function () {
                _this._extendSessionTime();
            }, 100);
        };
    };
    // localstorage change event
    autoSignOut.prototype._addStorageEvent = function () {
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
    autoSignOut.prototype._setLocalStorageVariable = function (date) {
        localStorage.setItem(this._config.sessionKey, date.getTime());
        localStorage.setItem('date', date.toISOString());
    };
    // extend the session timeout
    autoSignOut.prototype._extendSessionTime = function () {
        if (!this.signOutCalled) {
            var date = new Date();
            date.setMinutes(date.getMinutes() + this._config.timeout);
            this._setLocalStorageVariable(date);
            this._setUpLogOutCalls();
        }
    };
    // get last updated timestamp
    autoSignOut.prototype.getExpirationSessionTime = function () {
        var data = localStorage.getItem(this._config.sessionKey);
        return data || 0;
    };
    // remove item from storage
    autoSignOut.prototype.removeFromStorage = function (key) {
        localStorage.removeItem(key);
    };
    autoSignOut.prototype._logOut = function () {
        if (this._config.debug) {
            console.log(this.ID + ": Call SignOut");
        }
        this.signOutCalled = true;
        this.removeFromStorage(this._config.sessionKey);
        this.onSignOut();
    };
    return autoSignOut;
}());
//# sourceMappingURL=autoSignOut.js.map
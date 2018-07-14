var SignOut = /** @class */ (function () {
    function SignOut() {
        this.limit = 300000;
        this.watcherKey = 'watcherKey';
        this.signOutCalled = false;
        this.signOutWarningCalled = false;
        this.isUseWatcher = false;
    }
    SignOut.prototype.init = function (config) {
        config.sessionKey = config.sessionKey || 'timestamp';
        config.timeout = config.timeout || 20;
        config.warning = config.warning || 5;
        this._config = config;
        this._initHandlers();
        this.ID = Date.now();
    };
    SignOut.prototype._initHandlers = function () {
        this._addWindowUnload();
        this._addDocumentReady();
        this._addMouseEvent();
        //this._addHookToXMLRequest();
        //this._addScrollEvent();
        //this._addResizeWindow();
        this._addStorageEvent();
    };
    SignOut.prototype._initWatcher = function () {
        if (!this.getWatcherId() && this.isUseWatcher) {
            this._setWatcher();
        }
    };
    SignOut.prototype._setUpLogOutCalls = function () {
        var _this = this;
        var expirationTime = this.getExpirationSessionTime();
        var warningTime = this.getWarningMinuteInMiliSeconds();
        var currentTimestamp = Date.now();
        var difference = expirationTime - currentTimestamp;
        var warningDifference = (difference - warningTime) || 0;
        if (warningDifference <= this.limit) {
            if (this.autoWarningPopupTimeOut != null) {
                clearTimeout(this.autoWarningPopupTimeOut);
                this.autoWarningPopupTimeOut = null;
            }
            warningDifference = warningDifference <= 0 ? 0 : warningDifference;
            this.autoWarningPopupTimeOut = setTimeout(function () {
                _this.signOutWarningCalled = true;
                _this.onBeforeTimeout(warningDifference);
            }, warningDifference);
        }
        if (this.autoLogoutTimeOut != null) {
            clearTimeout(this.autoLogoutTimeOut);
            this.autoLogoutTimeOut = null;
        }
        this.autoLogoutTimeOut = setTimeout(function () {
            _this.signOutCalled = true;
            _this.removeFromStorage(_this._config.sessionKey);
            _this.onTimeout();
        }, difference);
    };
    SignOut.prototype._setWatcher = function () {
        var _this = this;
        this.watcherTimeOut = setTimeout(function () {
            var expirationTime = _this.getExpirationSessionTime();
            var currentTimestamp = Date.now();
            if (expirationTime > currentTimestamp) {
                var difference = expirationTime - currentTimestamp;
                difference = difference / 1000;
                if (_this._config.debug) {
                    console.log(_this.ID + ": ----- Watcher Called ----- Difference: " + difference);
                }
                if (difference <= _this.limit && !_this.signOutWarningCalled) {
                    _this.signOutWarningCalled = true;
                    _this.onBeforeTimeout(difference);
                }
            }
            else {
                if (_this.onTimeout) {
                    _this.signOutCalled = true;
                    _this.onTimeout();
                    clearTimeout(_this.watcherTimeOut);
                    _this.removeFromStorage(_this.watcherKey);
                    return;
                }
            }
            _this._setWatcher();
        }, 1000);
        this.setWatcherId(this.watcherTimeOut);
    };
    SignOut.prototype._addWindowUnload = function () {
        var _this = this;
        window.onbeforeunload = function () {
            _this._extendSessionTime();
            clearInterval(_this.watcherTimeOut);
            if (_this.watcherTimeOut) {
                _this.removeFromStorage(_this.watcherKey);
                _this.watcherTimeOut = undefined;
            }
        };
    };
    SignOut.prototype._addDocumentReady = function () {
        var _this = this;
        document.addEventListener("DOMContentLoaded", function () {
            _this._initWatcher();
            _this._extendSessionTime();
        }, false);
    };
    SignOut.prototype._addMouseEvent = function () {
        var _this = this;
        window.addEventListener('mousemove', function (e) {
            if (_this.mouseMoveTimeOut) {
                clearTimeout(_this.mouseMoveTimeOut);
                _this.mouseMoveTimeOut = null;
            }
            _this.mouseMoveTimeOut = setTimeout(function () {
                _this._extendSessionTime();
            }, 100);
        });
    };
    SignOut.prototype._addScrollEvent = function () {
        var _this = this;
        window.addEventListener('scroll', function (e) {
            if (_this.scrollTimeOut) {
                clearTimeout(_this.scrollTimeOut);
                _this.scrollTimeOut = null;
            }
            _this.scrollTimeOut = setTimeout(function () {
                _this._extendSessionTime();
            }, 100);
        });
    };
    SignOut.prototype._addHookToXMLRequest = function () {
        var oldSend;
        oldSend = XMLHttpRequest.prototype.send;
        var self = this;
        XMLHttpRequest.prototype.send = function () {
            self._extendSessionTime();
            oldSend.apply(this, arguments);
        };
    };
    SignOut.prototype._addResizeWindow = function () {
        var _this = this;
        window.addEventListener("resize", function () {
            if (_this.resizeTimeOut) {
                clearTimeout(_this.resizeTimeOut);
                _this.resizeTimeOut = null;
            }
            _this.resizeTimeOut = setTimeout(function () {
                _this._extendSessionTime();
            }, 100);
        }, false);
    };
    SignOut.prototype._addStorageEvent = function () {
        var _this = this;
        window.addEventListener('storage', function (e) {
            if (e.key == _this.watcherKey && e.newValue == null && !_this.signOutCalled) {
                _this.isUseWatcher ? _this._initWatcher() : _this._setUpLogOutCalls();
            }
            if (e.key == _this._config.sessionKey) {
                _this.isUseWatcher ? _this._initWatcher() : _this._setUpLogOutCalls();
            }
        });
    };
    SignOut.prototype._setLocalStorageVariable = function (date) {
        localStorage.setItem(this._config.sessionKey, date.getTime());
        localStorage.setItem('date', date.toISOString());
    };
    SignOut.prototype._extendSessionTime = function () {
        if (!this.signOutCalled) {
            var date = new Date();
            date.setMinutes(date.getMinutes() + this._config.timeout);
            this._setLocalStorageVariable(date);
            this.isUseWatcher ? this._initWatcher() : this._setUpLogOutCalls();
        }
    };
    SignOut.prototype.getExpirationSessionTime = function () {
        var data = localStorage.getItem(this._config.sessionKey);
        return data || 0;
    };
    SignOut.prototype.getWatcherId = function () {
        return localStorage.getItem(this.watcherKey) || null;
    };
    SignOut.prototype.setWatcherId = function (id) {
        localStorage.setItem(this.watcherKey, id);
    };
    SignOut.prototype.removeFromStorage = function (key) {
        localStorage.removeItem(key);
    };
    SignOut.prototype.getWarningMinuteInMiliSeconds = function () {
        return (this._config.warning * 60 * 1000);
    };
    return SignOut;
}());
//# sourceMappingURL=SignOut.js.map
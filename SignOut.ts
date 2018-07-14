
class SignOut {
    private _config: SignOutConfig;
    private scrollTimeOut;
    private resizeTimeOut;
    private watcherTimeOut;
    private mouseMoveTimeOut;
    private autoLogoutTimeOut;
    private autoWarningPopupTimeOut;
    private limit = 300000;
    private watcherKey = 'watcherKey';
    private ID;
    private signOutCalled = false;
    private signOutWarningCalled = false;
    private isUseWatcher = false;
    onTimeout: () => void;
    onBeforeTimeout: (mileSecond: number) => void;

    init(config: SignOutConfig) {
        config.sessionKey = config.sessionKey || 'timestamp';
        config.timeout = config.timeout || 20;
        config.warning = config.warning || 5;
        this._config = config;
        this._initHandlers();
        this.ID = Date.now();
    }

    private _initHandlers() {
        this._addWindowUnload();
        this._addDocumentReady();
        this._addMouseEvent();
        //this._addHookToXMLRequest();
        //this._addScrollEvent();
        //this._addResizeWindow();
        this._addStorageEvent();
    }

    private _initWatcher() {
        if (!this.getWatcherId() && this.isUseWatcher) {
            this._setWatcher();
        }
    }

    private _setUpLogOutCalls() {
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
            this.autoWarningPopupTimeOut = setTimeout(() => {
                this.signOutWarningCalled = true;
                this.onBeforeTimeout(warningDifference);
            }, warningDifference);
        }
        if (this.autoLogoutTimeOut != null) {
            clearTimeout(this.autoLogoutTimeOut);
            this.autoLogoutTimeOut = null;
        }
        this.autoLogoutTimeOut = setTimeout(() => {
            this.signOutCalled = true;
            this.removeFromStorage(this._config.sessionKey);
            this.onTimeout();
        }, difference);
    }
 
    private _setWatcher() {
        this.watcherTimeOut = setTimeout(() => {
            var expirationTime = this.getExpirationSessionTime();
            var currentTimestamp = Date.now();
            if (expirationTime > currentTimestamp) {
                var difference = expirationTime - currentTimestamp;
                difference = difference / 1000;
                if (this._config.debug) {
                    console.log(this.ID + ": ----- Watcher Called ----- Difference: " + difference);
                }
                if (difference <= this.limit && !this.signOutWarningCalled) {
                    this.signOutWarningCalled = true;
                    this.onBeforeTimeout(difference);
                }
            } else {
                if (this.onTimeout) {
                    this.signOutCalled = true;
                    this.onTimeout();
                    clearTimeout(this.watcherTimeOut);
                    this.removeFromStorage(this.watcherKey);
                    return;
                }
            }
            this._setWatcher();
        }, 1000);
        this.setWatcherId(this.watcherTimeOut);
    }

    private _addWindowUnload() {
        window.onbeforeunload = () => {
            this._extendSessionTime();
            clearInterval(this.watcherTimeOut);
            if (this.watcherTimeOut) {
                this.removeFromStorage(this.watcherKey);
                this.watcherTimeOut = undefined;
            }
        };
    }

    private _addDocumentReady() {
        document.addEventListener("DOMContentLoaded", () => {
            this._initWatcher();
            this._extendSessionTime();
        }, false);
    }

    private _addMouseEvent() {
        window.addEventListener('mousemove', (e) => {
            if (this.mouseMoveTimeOut) {
                clearTimeout(this.mouseMoveTimeOut);
                this.mouseMoveTimeOut = null;
            }
            this.mouseMoveTimeOut = setTimeout(() => {
                this._extendSessionTime();
            }, 100);
        });
    }

    private _addScrollEvent() {
        window.addEventListener('scroll', (e) => {
            if (this.scrollTimeOut) {
                clearTimeout(this.scrollTimeOut);
                this.scrollTimeOut = null;
            }
            this.scrollTimeOut = setTimeout(() => {
                this._extendSessionTime();
            }, 100);
        });
    }

    private _addHookToXMLRequest() {
        var oldSend;
        oldSend = XMLHttpRequest.prototype.send;
        var self = this;
        XMLHttpRequest.prototype.send = function () {
            self._extendSessionTime();
            oldSend.apply(this, arguments);
        }
    }

    private _addResizeWindow() {
        window.addEventListener("resize", () => {
            if (this.resizeTimeOut) {
                clearTimeout(this.resizeTimeOut);
                this.resizeTimeOut = null;
            }

            this.resizeTimeOut = setTimeout(() => {
                this._extendSessionTime();
            }, 100);
        }, false);
    }

    private _addStorageEvent() {
        window.addEventListener('storage', (e) => {
            if (e.key == this.watcherKey && e.newValue == null && !this.signOutCalled) {
                this.isUseWatcher ? this._initWatcher() : this._setUpLogOutCalls();
            }
            if (e.key == this._config.sessionKey) {
                this.isUseWatcher ? this._initWatcher() : this._setUpLogOutCalls();
            }
        });
    }

    private _setLocalStorageVariable(date: Date) {
        localStorage.setItem(this._config.sessionKey, <any>date.getTime());
        localStorage.setItem('date', <any>date.toISOString());
    }

    private _extendSessionTime() {
        if (!this.signOutCalled) {
            var date = new Date();
            date.setMinutes(date.getMinutes() + this._config.timeout);
            this._setLocalStorageVariable(date);
            this.isUseWatcher ? this._initWatcher() : this._setUpLogOutCalls();
        }
    }

    private getExpirationSessionTime(): number {
        var data: number = <any>localStorage.getItem(this._config.sessionKey);
        return data || 0;
    }

    private getWatcherId() {
        return localStorage.getItem(this.watcherKey) || null;
    }

    private setWatcherId(id: any) {
        localStorage.setItem(this.watcherKey, id);
    }

    private removeFromStorage(key: string) {
        localStorage.removeItem(key);
    }

    private getWarningMinuteInMiliSeconds() {
        return (this._config.warning * 60 * 1000);
    }
}

interface SignOutConfig {
    timeout: number;
    warning: number;
    sessionKey: string;
    debug: boolean;
}
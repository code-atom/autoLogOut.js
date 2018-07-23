class autoSignOut {
    private static instance: autoSignOut;
    private _config: SignOutConfig = { timeout: 10, debug: true, sessionKey: 'timestamp' };
    private scrollTimeOut;
    private resizeTimeOut;
    private mouseMoveTimeOut;
    private autoSignOutTimeOut;
    private ID;
    private signOutCalled = false;
    onSignOut: () => void;

    private constructor() {
    }

    // initialization Method with configuration
    static init(config: SignOutConfig) {
        autoSignOut.instance = new autoSignOut();
        config.sessionKey = config.sessionKey || 'timestamp';
        config.timeout = config.timeout || 20;
        autoSignOut.instance._config = config;
        autoSignOut.instance._initHandlers();
        autoSignOut.instance.ID = Date.now();
        return autoSignOut.instance;
    }

    // called OnSignOut callback
    signOut() {
        clearTimeout(this.autoSignOutTimeOut);
        this.signOutCalled = true;
        this.onSignOut();
    }

    // attach handler for updating local storage
    private _initHandlers() {
        // Add handler window unload event
        window.onbeforeunload = () => {
            this._extendSessionTime();
        };

        // Add handler on  document ready event
        document.addEventListener("DOMContentLoaded", () => {
            this._extendSessionTime();
        }, false);

        // Add throttle event listeners
        window.addEventListener('mousemove', this.throttleEvents());
        window.addEventListener('scroll', this.throttleEvents());
        window.addEventListener("resize", this.throttleEvents());

        // Add localstorage change event
        this._addStorageEvent();
    }

    // update auto logout timeout
    private _setUpLogOutCalls() {
        if (this._config.debug) {
            console.log(this.ID + ": Update the Local Storage with new value");
        }
        var expirationTime = this.getExpirationSessionTime();
        var currentTimestamp = Date.now();
        var difference = expirationTime - currentTimestamp;
        if (difference <= 0) {
            this._logOut();
        } else {
            if (this._config.debug) {
                console.log(this.ID + ": Register auto logout timeout with time: " + difference);
            }
            if (this.autoSignOutTimeOut != null) {
                clearTimeout(this.autoSignOutTimeOut);
                this.autoSignOutTimeOut = null;
            }
            this.autoSignOutTimeOut = setTimeout(() => {
                this._logOut();
            }, difference);
        }
    }

    // experimental purpose: add hook on every ajax request for update localstorage
    private _addHookToXMLRequest() {
        var oldSend;
        oldSend = XMLHttpRequest.prototype.send;
        var self = this;
        XMLHttpRequest.prototype.send = function () {
            self._extendSessionTime();
            oldSend.apply(this, arguments);
        }
    }

    // throttle Event handler
    private throttleEvents() {
        var timeoutEvent;
        return () => {
            if (this._config.debug) {
                console.log(this.ID + ": Event called");
            }
            if (timeoutEvent) {
                clearTimeout(timeoutEvent);
                timeoutEvent = null;
            }
            timeoutEvent = setTimeout(() => {
                this._extendSessionTime();
            }, 100);
        }
    }

    // localstorage change event
    private _addStorageEvent() {
        window.addEventListener('storage', (e) => {
            if (e.key == this._config.sessionKey) {
                if (e.newValue == null) {
                    return;
                }
                this._setUpLogOutCalls();
            }
        });
    }

    // set timestamp in localstorage
    private _setLocalStorageVariable(date: Date) {
        localStorage.setItem(this._config.sessionKey, <any>date.getTime());
        localStorage.setItem('date', <any>date.toISOString());
    }

    // extend the session timeout
    private _extendSessionTime() {
        if (!this.signOutCalled) {
            var date = new Date();
            date.setMinutes(date.getMinutes() + this._config.timeout);
            this._setLocalStorageVariable(date);
            this._setUpLogOutCalls();
        }
    }

    // get last updated timestamp
    private getExpirationSessionTime(): number {
        var data: number = <any>localStorage.getItem(this._config.sessionKey);
        return data || 0;
    }

    // remove item from storage
    private removeFromStorage(key: string) {
        localStorage.removeItem(key);
    }

    private _logOut() {
        if (this._config.debug) {
            console.log(this.ID + ": Call SignOut");
        }
        this.signOutCalled = true;
        this.removeFromStorage(this._config.sessionKey);
        this.onSignOut();
    }
}

interface SignOutConfig {
    timeout: number;
    sessionKey: string;
    debug: boolean;
}
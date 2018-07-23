# autoLogOut.js

autoLogOut.js is small utility javascript, which helps us to manage the auto-logout state in multiple tabs if the user is not active. This relies on localstorage and localstorage change event for synchronizing the setTimeout between tabs.

<strong>autoLogOut.js</strong> implements the event listener on following events:-
    <ol >
        <li>Document ready</li>
        <li>Document unload</li>
        <li>Mouse movement</li>
        <li>Scroll event</li>
        <li>Window resize</li>
        <li>Storage change</li>
    </ol>
    All events are throttle with setTimeout approach, except storage change.
</p>
<p>For implementation: </p>

```
var signOut = autoLogOut.init({ timeout: 1, sessionKey: 'Key', debug: true});
signOut.onSignOut = function () {
    alert("Called Timeout");
    console.log("Timeout Called");
};
```
<p> <strong>autoLogOut.init()</strong> function take intial configuration object, each key description mentioned below:-</p>
<ul>
    <li>timeout: number of minutes after that session will auto logout</li>
    <li>sessionKey: name of the localstorage key</li>
    <li>debug: console.log on event and timeout registration.</li>
</ul>
<p>
    <strong>autoLogOut.js</strong> have three methods:-
    <ul>
        <li>init : initial configuration function</li>
        <li>signOut: manual call the onSignOut callback</li>
        <li>onSignOut: this callback callback on logout</li>
    </ul>
</p>

Related Content:-
    - https://stackoverflow.com/questions/28230845/communication-between-tabs-or-windows
  

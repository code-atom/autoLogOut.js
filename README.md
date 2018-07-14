# autoLogOut.js

autoLogOut.js is small utility javascript, which helps us to manage the auto-logout state in multiple tabs if the user is not active. This relies on localstorage and localstorage change event for synchronizing the setTimeout between tabs.

autoLogOut.js expose only two methods:-
- onExpires
- onWarning

**onExpires** method called when a timeout for specified minutes of inactive of user.

**onWarning** method called before, at the specified time, auto log


var urlLocal = "localhost";
var urlDev = "152.1.168.115";
var urlProd = "data.ncsu.edu";

/******************** BLUR - ONLY disable on dev or local ******************/
var turnOffBlur = false;
if (window.location.hostname.search(urlDev) !== -1) {
    turnOffBlur = true;
}
if (window.location.host.search(urlLocal) !== -1) {
    turnOffBlur = true;
}

/*** ************************************************************************/

//region - iPad or Chromebook
var isIpadApp = false;
var appVersion = 0;

if (navigator.userAgent.search("iPad") !== -1) {
    isIpadApp = true;

    if (navigator.userAgent.search("AppVersion: 5") !== -1) {
        //app is new version with AAC, so turn off blur/focus logic
        appVersion = 5;
        turnOffBlur = true;
        // console.log("debug - common.js - useragent contains 'appversion' - turning off blur");
    } else {
        turnOffBlur = false;
        // console.log("debug - common.js - useragent does NOT 'appversion' - blur should remain enabled");
    }
}

//be sure to include port, so use host instead of hostname
var origin = window.location.protocol + "//" + window.location.host;
var appWindow, appOrigin;
var isChromeApp=false;

//check useragent for our custom chrome app string
function onMessage(e) {

    appWindow = e.source;
    appOrigin = e.origin;
    oldAgent = navigator.userAgent;

    //customizing useragent due to sporadic issue of not being overwritten in chrome app
    if ( navigator.userAgent.substring(0, 6) !== "NCTest" ) {
        Object.defineProperty(navigator, 'userAgent', {
            get: function () { return "NCTest/1.0 ChromeApp " + oldAgent; }
        });
    }
    isChromeApp=true;
}

window.addEventListener('message', onMessage);

// // sanity check - can't be iPad and chromebook
// if (isIpadApp && isChromeApp) {
//     console.log("EXCEPTION - UserAgent has both iPad and chromebook 'unique' strings");
//
//     Object.defineProperty(navigator, 'userAgent', {
//         get: function () {
//             return "UNKNOWN " + nctUserAgent;
//         }
//     });
// }
//
// // another sanity check - can't be an if SEB found in UA
// if ((navigator.userAgent.search("SafeExamBrowser") !== -1) && (isIpadApp || isChromeApp)) {
//     isIpadApp = false;
//     isChromeApp = false;
//
//     console.log("EXCEPTION - UserAgent contained either iPad or chrome app custom string AND SEB custom string");
//
//     Object.defineProperty(navigator, 'userAgent', {
//         get: function () {
//             return "UNKNOWN " + nctUserAgent;
//         }
//     });
// }

//endregion

// ****** region - misc functions ******
// window.addEventListener('unhandledrejection', function(event) {
//     // the event object has two special properties:
//     console.log(event.promise); // [object Promise] - the promise that generated the error
//     console.log(event.reason); // Error: Whoops! - the unhandled error object
// });
//
// window.addEventListener('aborterror', function(event) {
//     // the event object has two special properties:
//     console.log(event.promise); // [object Promise] - the promise that generated the error
//     console.log(event.reason); // Error: Whoops! - the unhandled error object
// });
//
// window.addEventListener('notsupportederror', function(event) {
//     // the event object has two special properties:
//     console.log(event.promise); // [object Promise] - the promise that generated the error
//     console.log(event.reason); // Error: Whoops! - the unhandled error object
// });

if (document.location.protocol !== 'https:' && document.location.hostname === "data.ncsu.edu") {
    location.replace("https:" + window.location.host + window.location.pathname +
        window.location.search);
}

function serverLog() {
} // Replaced later in NCTUtils

//endregion

// ****** region - focus/blue logic ******
function delayBlur() {
} // Replaced later in NCTestPresenter

function onBlur() {
} // Replaced later in Presenters

function delayCheck() {
    // console.log("common - delayCheck - document.hasFocus: " + document.hasFocus());

    if (!document.hasFocus()) {
        window.delayBlur();
    }
}

var delayVar;
sessionStorage.setItem("stopBlur", "false");

function nctestBlur() {

    // console.log("debug - common.js - nctestBlur - document.hasFocus: " + document.hasFocus());

    //see lines at top of file to change value for turnOffBlur (by default only disabled for dev)
    if (!turnOffBlur) {
        if (isIpadApp  && appVersion !== 5) {
            if (sessionStorage.getItem("stopBlur") === "true") {
                return;
            }
            delayVar = window.setTimeout(delayBlur, 100);
        }
        else {
            if (!document.hasFocus()) {
                delayVar = window.setTimeout(delayCheck, 100);
            }
        }
    }
}

//endregion

// ****** region - iPad -
// note: requires custom code (always treats document as having focus even if app is minimized)

// console.log("debug - common.js - isIpadApp: " + isIpadApp + " - appVersion: " + appVersion);

if (isIpadApp && appVersion !== 5) {

    /* Comments: Need a way to "toggle" focus/blur back and forth between main app window and
    *  calculator window, while still maintaining the blur logic of the main app window
    *  (i.e., the app should cause unexpected exit if loses 'focus' in any way)
     */
    function onFocus() {
        clearTimeout(delayVar);
        sessionStorage.setItem("stopBlur", "true");

        window.setTimeout(function () {
            sessionStorage.setItem("stopBlur", "false");
        }, 200);
    }

    window.onfocus = onFocus;

    /******************* listeners *******************/

        //Disable double tap on document
    var lastTouchEnd = 0;
    document.documentElement.addEventListener('touchend', function (event) {
        var now = (new Date()).getTime();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, false);

    window.addEventListener("blur", function (evt) {

        //browsers do not consider clicking on area of body with no element to have an activeElement
        var activeElement = document.activeElement.id;
        if (activeElement.search("body") !== -1 || document.activeElement.id == null || document.activeElement.id == "") {
            activeElement = "nothing";
        }

        if (activeElement.search("x-auto") !== -1) {
            //calc initial activeElement seems to always be 'x-auto-##' (hack - be careful)
            sessionStorage.setItem("stopBlur", "true");
            top.nctestBlur();
        }
        else if (window.name == "calcwindow") {
            //calc lost focus, so set it back to main app window
            sessionStorage.setItem("stopBlur", "true");
            window.onfocus;
        }

    }, false);

    window.addEventListener("pageshow", function (evt) {
        if (window.name === "calcwindow") {
            //prevent blur when calc initially launched very first time
            sessionStorage.setItem("stopBlur", "true");
            top.onFocus();
        }
    }, false);

    window.addEventListener("pagehide", function (evt) {
        if (window.name === "calcwindow") {
            //pass focus back to the main app window
            sessionStorage.setItem("stopBlur", "true");
            top.onFocus();
            top.window.onfocus;
        }
        else if (window.name === "nctestwindow") {
            //allow blur if main app window has been hidden
            sessionStorage.setItem("stopBlur", "false");
        }
    }, false);

    window.addEventListener("unload", function (evt) {
        if (window.name === "nctestwindow") {
            //allow blur if main app window is unloaded
            sessionStorage.setItem("stopBlur", "false");
        }
    }, false);

    // window.addEventListener('pageshow', function () {
    //     //set styles to prevent flicker when blur/focus occurs (still not fully fixed)
    //     document.body.style.webkitTapHighlightColor = "transparent";
    //
    //     new FastClick(document.body);
    // }, false);
}
//endregion - iPad

function getJSVersion ()
{
    this.jsv = {
        versions: [
            "1.1", "1.2", "1.3", "1.4", "1.5", "1.6", "1.7", "1.8", "1.9", "2.0"
        ],
        version: ""
    };

    var d = document;

    for (i = 0; i < jsv.versions.length; i++) {
        var g = d.createElement('script'),
            s = d.getElementsByTagName('script')[0];

        g.setAttribute("language", "JavaScript" + jsv.versions[i]);
        g.text = "this.jsv.version='" + jsv.versions[i] + "';";
        s.parentNode.insertBefore(g, s);
    }

    return jsv.version;
}

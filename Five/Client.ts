module Five {
    export class Client {
        static isFf = navigator.userAgent.indexOf("Firefox/") >= 0;

        // True if the current browser is Internet Explorer 10 or below.Use <Client.IS_IE11> to detect IE 11.
        static isIe = navigator.userAgent.indexOf("MSIE") >= 0;
        // True if browser is IE 11
        static isIe11 = !!navigator.userAgent.match(/Trident\/7\./);

        // True if the browser supports SVG.
        static isSvg =
        navigator.userAgent.indexOf("Firefox/") >= 0 || // FF and Camino
            navigator.userAgent.indexOf("Iceweasel/") >= 0 || // Firefox on Debian
            navigator.userAgent.indexOf("Seamonkey/") >= 0 || // Firefox-based
            navigator.userAgent.indexOf("Iceape/") >= 0 || // Seamonkey on Debian
            navigator.userAgent.indexOf("Galeon/") >= 0 || // Gnome Browser (old)
            navigator.userAgent.indexOf("Epiphany/") >= 0 || // Gnome Browser (new)
            navigator.userAgent.indexOf("AppleWebKit/") >= 0 || // Safari/Google Chrome
            navigator.userAgent.indexOf("Gecko/") >= 0 || // Netscape/Gecko
            navigator.userAgent.indexOf("Opera/") >= 0 || // Opera
            (document.documentMode != null && document.documentMode >= 9); // IE9+

        // True if the current browser is Internet Explorer and it is in quirks mode.
        static isQuirks = navigator.userAgent.indexOf("MSIE") >= 0 && (document.documentMode == null || document.documentMode == 5);
        // True if the current browser is Opera.
        static isOp: boolean = navigator.userAgent.indexOf("Opera/") >= 0;

        // True if -o-transform is available as a CSS style. This is the case for Opera browsers that use Presto/2.5 and later.
        static isOt: boolean =
        navigator.userAgent.indexOf("Presto/2.4.") < 0 &&
            navigator.userAgent.indexOf("Presto/2.3.") < 0 &&
            navigator.userAgent.indexOf("Presto/2.2.") < 0 &&
            navigator.userAgent.indexOf("Presto/2.1.") < 0 &&
            navigator.userAgent.indexOf("Presto/2.0.") < 0 &&
            navigator.userAgent.indexOf("Presto/1.") < 0;

        // Returns true if the current browser is supported, that is, if <mxClient.IS_VML> or <mxClient.IS_SVG> is true.
        // if (!mxClient.isBrowserSupported())
        // {
        //    Utils.error('Browser is not supported!', 200, false);
        // }
        static isBrowserSupported = () => Client.isSvg;

        // True if the current browser is Netscape(including Firefox).
        static isNs = navigator.userAgent.indexOf("Mozilla/") >= 0 && navigator.userAgent.indexOf("MSIE") < 0;

        static language = navigator.userLanguage;

        //True if this device supports MS pointer events.
        static isPointer: boolean = (window.navigator.msPointerEnabled != null) ? window.navigator.msPointerEnabled : false;

        // True if this device supports touchstart / -move / -end events(Apple iOS, Android, Chromebook and Chrome Browser on touch - enabled devices).
        static isTouch: boolean = "ontouchstart" in document.documentElement;

        //True if the current browser is Safari.
        static isSf: boolean = navigator.userAgent.indexOf("AppleWebKit/") >= 0 && navigator.userAgent.indexOf("Chrome/") < 0;

        // True if the current browser is Google Chrome.
        static isGc: boolean = navigator.userAgent.indexOf("Chrome/") >= 0;

        // True if -moz-transform is available as a CSS style. This is the case for all Firefox-based browsers newer than or equal 3, such as Camino,
        // Iceweasel, Seamonkey and Iceape.
        static isMt: boolean =
            (navigator.userAgent.indexOf("Firefox/") >= 0 && navigator.userAgent.indexOf("Firefox/1.") < 0 && navigator.userAgent.indexOf("Firefox/2.") < 0) ||
            (navigator.userAgent.indexOf("Iceweasel/") >= 0 && navigator.userAgent.indexOf("Iceweasel/1.") < 0 && navigator.userAgent.indexOf("Iceweasel/2.") < 0) ||
            (navigator.userAgent.indexOf("SeaMonkey/") >= 0 && navigator.userAgent.indexOf("SeaMonkey/1.") < 0) ||
            (navigator.userAgent.indexOf("Iceape/") >= 0 && navigator.userAgent.indexOf("Iceape/1.") < 0);
        
        static isMac = navigator.appVersion.indexOf("Mac") > 0;
        static isIos = (navigator.userAgent.match(/(iPad|iPhone|iPod)/g) ? true : false);

        // True if foreignObject support is not available. This is the case for Opera and older SVG-based browsers.
        static noFo = navigator.userAgent.indexOf("Opera/") >= 0; //!document.createElementNS || typeof document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject') != '[object SVGForeignObjectElement]' || ;    
	    
        // True if the browser supports VML.
        static isVml = navigator.appName.toUpperCase() === "MICROSOFT INTERNET EXPLORER";
        /** True if the documents location does not start with http:// or https://.	 */
        static isLocal = document.location.href.indexOf('http://') < 0 && document.location.href.indexOf('https://') < 0;
    }
}
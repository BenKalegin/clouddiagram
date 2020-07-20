module Five {

    export interface IXmlRequestListener
    {
        (req: XmlRequest): void;    
    }

    export class XmlRequest {
        /** XML HTTP request wrapper. See also: <mxUtils.get>, <mxUtils.post> and <mxUtils.load>. This class provides a cross-browser abstraction for Ajax requests.
         * For encoding parameter values, the built-in encodeURIComponent JavaScript method must be used. For automatic encoding of post data in <mxEditor> the
         * <mxEditor.escapePostData> switch can be set to true (default). The encoding will be carried out using the conte type of the page. That is, the page
         * containting the editor should contain a meta tag in the header, eg. <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
         * 
         * url - Target URL of the request.
         * params - Form encoded parameters to send with a POST request.
         * method - String that specifies the request method. Possible values are POST and GET. Default is POST.
         * async - Boolean specifying if an asynchronous request should be used. Default is true.
         * username - String specifying the username to be used for the request.
         * password - String specifying the password to be used for the request.
         */
        constructor(url: string, params: string, method: string = "POST", async: boolean = true, username?: string, password?: string) {
            this.url = url;
            this.params = params;
            this.method = method;
            this.async = async;
            this.username = username;
            this.password = password;
        }

         /** Holds the target URL of the request.*/
        private url: string;

        /** Holds the form encoded data for the POST request.*/
        private params: string;

        /**Specifies the request method. Possible values are POST and GET. Default is POST. */
        private method: string;

        /** Boolean indicating if the request is asynchronous.*/
        private async: boolean;

        /** Boolean indicating if the request is binary. This option is ignored in IE. In all other browsers the requested mime type is set to
         * text/plain; charset=x-user-defined. Default is false. */
        private binary = false;

        /** Specifies if withCredentials should be used in HTML5-compliant browsers. Default is false. */
        private withCredentials = false;

        /** Specifies the username to be used for authentication. */
        private username: string;

        /** Specifies the password to be used for authentication. */
        private password: string;

        /** Holds the inner, browser-specific request object.*/
        private request: XMLHttpRequest = null;

        /** Specifies if request values should be decoded as URIs before setting the textarea value in <simulate>. Defaults to false for backwards compatibility,
         * to avoid another decode on the server this should be set to true. */
        private decodeSimulateValues = false;

        private isBinary(): boolean {
            return this.binary;
        }

        private setBinary(value: boolean) {
            this.binary = value;
        }

        /** Returns the response as a string.*/
        getText() : string {
            return this.request.responseText;
        }

        /** Returns true if the response is ready. */
        isReady(): boolean {
            return this.request.readyState == 4;
        }

        /** Returns the document element of the response XML document. */
        getDocumentElement() : HTMLElement {
            var doc = this.getXml();

            if (doc != null) {
                return doc.documentElement;
            }

            return null;
        }

        /** Returns the response as an XML document. Use <getDocumentElement> to get the document element of the XML document. */
        getXml() : Document {
            var xml = this.request.responseXML;
            // Handles missing response headers in IE, the first condition handles the case where responseXML is there, but using its nodes leads to
            // type errors in the mxCellCodec when putting the nodes into a new document. This happens in IE9 standards mode and with XML user
            // objects only, as they are used directly as values in cells.
            if (Client.isIe9 || xml == null || xml.documentElement == null) {
                xml = Utils.parseXml(this.request.responseText);
            }

            return xml;
        }

        /** Returns the status as a number, eg. 404 for "Not found" or 200 for "OK". Note: The NS_ERROR_NOT_AVAILABLE for invalid responses cannot be cought. */
        getStatus() : number {
            return this.request.status;
        }

        /** Creates and returns the inner <request> object. */
        private create(): XMLHttpRequest {
            var req = new XMLHttpRequest();

            if (this.isBinary() && req.overrideMimeType) {
                req.overrideMimeType('text/plain; charset=x-user-defined');
            }

            return req;
        }

        /** Send the <request> to the target URL using the specified functions to process the response asychronously.
         * onload - Function to be invoked if a successful response was received.
         * onerror - Function to be called on any error.
         */
        send(onload?: IXmlRequestListener, onerror?: IXmlRequestListener) {
            this.request = this.create();

            if (this.request != null) {
                if (onload != null) {
                    this.request.onreadystatechange = () =>  {
                        if (this.isReady()) {
                            onload(this);
                            this.request.onreadystatechange = null;
                        }
                    };
                }

                this.request.open(this.method, this.url, this.async, this.username, this.password);
                this.setRequestHeaders(this.request, this.params);

                if (this.withCredentials) {
                    this.request.withCredentials = true;
                }

                this.request.send(this.params);
            }
        }

        /** Sets the headers for the given request and parameters. This sets the content-type to application/x-www-form-urlencoded if any params exist. 
         * Use the code above before calling <send> if you require a multipart/form-data request.  */
        private setRequestHeaders(request: XMLHttpRequest, params: Object) {
            if (params != null) {
                request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
            }
        }

        /** Creates and posts a request to the given target URL using a dynamically created form inside the given document.
         * docs - Document that contains the form element.
         * target - Target to send the form result to. */
        simulate(doc: Document, target: string) {
            doc = doc || document;
            var old = null;

            if (doc == document) {
                old = window.onbeforeunload;
                window.onbeforeunload = null;
            }

            var form = doc.createElement('form');
            form.setAttribute('method', this.method);
            form.setAttribute('action', this.url);

            if (target != null) {
                form.target = target;
            }

            form.style.display = 'none';
            form.style.visibility = 'hidden';

            var pars = (this.params.indexOf('&') > 0) ? this.params.split('&') : this.params.split(null);

            // Adds the parameters as textareas to the form
            for (var i = 0; i < pars.length; i++) {
                var pos = pars[i].indexOf('=');

                if (pos > 0) {
                    var name = pars[i].substring(0, pos);
                    var value = pars[i].substring(pos + 1);

                    if (this.decodeSimulateValues) {
                        value = decodeURIComponent(value);
                    }

                    var textarea = doc.createElement('textarea');
                    textarea.setAttribute('name', name);
                    Utils.write(textarea, value);
                    form.appendChild(textarea);
                }
            }

            doc.body.appendChild(form);
            form.submit();
            doc.body.removeChild(form);

            if (old != null) {
                window.onbeforeunload = old;
            }
        }

    }
} 
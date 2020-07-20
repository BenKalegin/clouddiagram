module Five {
    export class SessionNotifyEvent extends BasicEvent {
        constructor(public url: string, public xml: string) { super(); }
    }

    export class SessionGetEvent extends BasicEvent {
        constructor(public url: string, public request: XmlRequest) { super(); }
    }

    export class SessionReceiveEvent extends BasicEvent {
        constructor(public node: Node) { super(); }
    }

    export class SessionDisconnectEvent extends BasicEvent {
        constructor(public reason: string) { super(); }
    }

    /** Session for sharing an <mxGraphModel> with other parties via a backend that acts as a multicaster for all changes.
    * Diagram Sharing:
    * The diagram sharing is a mechanism where each atomic change of the model is encoded into XML using <mxCodec> and then transmitted to the server by the
    * <mxSession> object. On the server, the XML data is dispatched to each listener on the same diagram (except the sender), and the XML is decoded
    * back into atomic changes on the client side, which are then executed on the model and stored in the command history.
    * 
    * The <mxSession.significantRemoteChanges> specifies how these changes are treated with respect to undo: The default value (true) will undo the last
    * change regardless of whether it was a remote or a local change. If the switch is false, then an undo will go back until the last local change,
    * silently undoing all remote changes up to that point. Note that these changes will be added as new remote changes to the history of the other clients.
    */ 
    export class Session {
        /* model - <mxGraphModel> that contains the data.
         * urlInit - URL to be used for initializing the session.
         * urlPoll - URL to be used for polling the backend.
         * urlNotify - URL to be used for sending changes to the backend. */
        constructor(model: GraphModel, urlInit: string, urlPoll: string, urlNotify: string) {
            this.model = model;
            this.urlInit = urlInit;
            this.urlPoll = urlPoll;
            this.urlNotify = urlNotify;

            // Resolves cells by id using the model
            this.codec = new Codec();
            this.codec.lookup = (id) => {return model.getCell(parseInt(id));};

            // Adds the listener for notifying the backend of any
            // changes in the model
            model.onNotify.add( e => {
                var edit = e.edit;
                if (edit != null && (this.debug || (this.connected && !this.suspended))) {
                    this.notify('<edit>' + this.encodeChanges(edit.changes, edit.undone) + '</edit>');
                }
            });
        }

        /**Reference to the enclosing <mxGraphModel>. */
        private model: GraphModel = null;

        /** URL to initialize the session.*/
        private urlInit: string = null;

        /** URL for polling the backend. */
        private urlPoll: string = null;

        /** URL to send changes to the backend.*/
        private urlNotify: string = null;

        /** Reference to the <mxCodec> used to encoding and decoding changes.*/
        private codec: Codec = null;

        /** Used for encoding linefeeds. Default is '&#xa;'.*/
        private linefeed = '&#xa;';

        /** Specifies if the data in the post request sent in <notify> should be converted using encodeURIComponent. Default is true. */
        private escapePostData = true;

        /** Whether remote changes should be significant in the local command history. Default is true. */
        private significantRemoteChanges = true;

        /** Total number of sent bytes.*/
        private sent = 0;

        /** Total number of received bytes.*/
        private received = 0;

        /** Specifies if the session should run in debug mode. In this mode, no connection is established. The data is written to the console instead.  Default is false. */
        private debug = false;

        private connected = false;
        private suspended = false;
        private polling = false;

        onConnect = new EventListeners<BasicEvent>();
        onDisconnect = new EventListeners<SessionDisconnectEvent>();
        onSuspend = new EventListeners<BasicEvent>();
        onResume = new EventListeners<BasicEvent>();
        onSessionNotify = new EventListeners<SessionNotifyEvent>();
        onGet = new EventListeners<SessionGetEvent>();
        onReceive = new EventListeners<SessionReceiveEvent>();

        start() {
            if (this.debug) {
                this.connected = true;
                this.onConnect.fire();
            } else if (!this.connected) {
                this.get(this.urlInit, () => {
                    this.connected = true;
                    this.onConnect.fire();
                    this.poll();
                });
            }
        }

        /** Suspends the polling. Use <resume> to reactive the session. Fires a suspend event. */
        private suspend() {
            if (this.connected && !this.suspended) {
                this.suspended = true;
                this.onSuspend.fire();
            }
        }
	
        /** Resumes the session if it has been suspended. Fires a resume-event before starting the polling. */
        private resume(type, attr, value) {
            if (this.connected && this.suspended) {
                this.suspended = false;
                this.onResume.fire();

                if (!this.polling) {
                    this.poll();
                }
            }
        }

        /** Stops the session and fires a disconnect event. The given reason is passed to the disconnect event listener as the second argument. */
        private stop(reason) {
            if (this.connected) {
                this.connected = false;
            }

            this.onDisconnect.fire(new SessionDisconnectEvent(reason));
        }

        /** Sends an asynchronous GET request to <urlPoll>. */
        private poll() {
            if (this.connected &&
                !this.suspended &&
                this.urlPoll != null) {
                this.polling = true;

                this.get(this.urlPoll, () => this.poll());
            } else {
                this.polling = false;
            }
        }

        /** Sends out the specified XML to <urlNotify> and fires a <notify> event. */
        private notify(xml: string, onLoad?: IXmlRequestListener, onError?: IXmlRequestListener) {
            if (xml != null && xml.length > 0) {
                if (this.urlNotify != null) {
                    xml = '<message><delta>' + xml + '</delta></message>';

                    if (this.escapePostData) {
                        xml = encodeURIComponent(xml);
                    }

                    Utils.post(this.urlNotify, 'xml=' + xml, onLoad, onError);

                }

                // ReSharper disable once QualifiedExpressionMaybeNull
                this.sent += xml.length;
                this.onSessionNotify.fire(new SessionNotifyEvent(this.urlNotify, xml));
            }
        }

        /** Sends an asynchronous get request to the given URL, fires a <get> event and invokes the given onLoad function when a response is received. */
        private get(url: string, onLoad: IXmlRequestListener, onError?: IXmlRequestListener) {
            // Response after browser refresh has no global scope
            // defined. This response is ignored and the session
            // stops implicitely.
            if (typeof (Utils) != 'undefined') {
                var onErrorWrapper = (ex) => {
                    if (onError != null) {
                        onError(ex);
                    } else {
                        this.stop(ex);
                    }
                };

                // Handles a successful response for the above request.
                Utils.get(url,
                    req => {
                        if (typeof (Utils) != 'undefined') {
                            if (req.isReady() && req.getStatus() != 404) {
                                this.received += req.getText().length;
                                this.onGet.fire(new SessionGetEvent(url, req));

                                if (this.isValidResponse(req)) {
                                    if (req.getText().length > 0) {
                                        var node = req.getDocumentElement();

                                        if (node == null) {
                                            onErrorWrapper('Invalid response: ' + req.getText());
                                        } else {
                                            this.receive(node);
                                        }
                                    }

                                    if (onLoad != null) {
                                        onLoad(req);
                                    }
                                }
                            } else {
                                onErrorWrapper('Response not ready');
                            }
                        }
                    },
                    // Handles a transmission error for the above request
                    () => {
                        onErrorWrapper('Transmission error');
                    });
            }
        }

        /** Returns true if the response data in the given <mxXmlRequest> is valid. */
        private isValidResponse(req: XmlRequest) {
            return true;
        }

        /** Returns the XML representation for the given array of changes. */
        private encodeChanges(changes: IChange[], invert: boolean) {
            // TODO: Use array for string concatenation
            var xml = '';
            var step = (invert) ? -1 : 1;
            var i0 = (invert) ? changes.length - 1 : 0;

            for (var i = i0; i >= 0 && i < changes.length; i += step) {	
                // Newlines must be kept, they will be converted
                // to &#xa; when the server sends data to the
                // client
                var node = this.codec.encode(changes[i]);
                xml += Utils.getXml(node, this.linefeed);
            }

            return xml;
        }

        /**Processes the given node by applying the changes to the model. If the nodename is state, then the namespace is used as a prefix for creating Ids in the model,
         * and the child nodes are visited recursively. If the nodename is delta, then the changes encoded in the child nodes are applied to the model. Each call to the
         * receive function fires a <receive> event with the given node as the second argument after processing. If changes are processed, then the function additionally fires
         * a <Events.FIRED> event before the <Events.RECEIVE> event.
         */
        private receive(node: Node) {
            if (node != null && node.nodeType == NodeType.Element) {
                // Uses the namespace in the model
                var ns = (<Element>node).namespaceURI;

                if (ns != null) {
                    this.model.prefix = ns + '-';
                }

                var child = node.firstChild;

                while (child != null) {
                    var name = child.nodeName.toLowerCase();

                    if (name == 'state') {
                        this.processState(child);
                    }
                    else if (name == 'delta') {
                        this.processDelta(child);
                    }

                    child = child.nextSibling;
                }
		
                // Fires receive event
                this.onResume.fire(new SessionReceiveEvent(node));
            }
        }

        /** Processes the given state node which contains the current state of the remote model. */
        private processState(node: Node) {
            var dec = new Codec(node.ownerDocument);
            dec.decode(node.firstChild, this.model);
        }

        /** Processes the given delta node which contains a sequence of edits which in turn map to one transaction on the remote model each. */
        private processDelta(node: Node) {
            var edit = node.firstChild;

            while (edit != null) {
                if (edit.nodeName == 'edit') {
                    this.processEdit(edit);
                }

                edit = edit.nextSibling;
            }
        }

        /** Processes the given edit by executing its changes and firing the required events via the model. */
        private processEdit(node) {
            var changes = this.decodeChanges(node);

            if (changes.length > 0) {
                var edit = this.createUndoableEdit(changes);

                // No notify event here to avoid the edit from being encoded and transmitted
                // LATER: Remove changes property (deprecated)
                this.model.onChange.fire(new ModelChangeEvent(edit, changes));
                this.model.onUndo.fire(new UndoEvent(edit));
                //this.fireEvent(new EventObject(Events.fired, { key: 'edit', value: edit }));
            }
        }

        /** Creates a new <mxUndoableEdit> that implements the notify function to fire a <change> and <notify> event via the model. */
        private createUndoableEdit(changes: IChange[]) {
            var edit = new UndoableEdit(this.model, this.significantRemoteChanges);
            edit.changes = changes;

            edit.notify = () => {
                // LATER: Remove changes property (deprecated)
                if (edit.source.onChange) edit.source.onChange.fire(new ModelChangeEvent(edit, edit.changes));
                if (edit.source.onNotify) edit.source.onNotify.fire(new NotifyEvent(edit, edit.changes));
            };

            return edit;
        }

        /** Decodes and executes the changes represented by the children in the given node. Returns an array that contains all changes. */
        private decodeChanges(node: Node) {
            // Updates the document in the existing codec
            this.codec.document = node.ownerDocument;

            // Parses and executes the changes on the model
            var changes = [];
            node = node.firstChild;

            while (node != null) {
                var change = this.decodeChange(node);

                if (change != null) {
                    changes.push(change);
                }

                node = node.nextSibling;
            }

            return changes;
        }

        /** Decodes, executes and returns the change object represented by the given XML node. */
        private decodeChange(node: Node) : IChange {
            var change = null;

            if (node.nodeType == NodeType.Element) {
                if (node.nodeName == 'RootChange') {
                    // Handles the special case were no ids should be resolved in the existing model. This change will
                    // replace all registered ids and cells from the model and insert a new cell hierarchy instead.
                    var tmp = new Codec(node.ownerDocument);
                    change = tmp.decode(node);
                } else {
                    change = this.codec.decode(node);
                }

                if (change != null) {
                    change.model = this.model;
                    change.execute();

                    // Workaround for references not being resolved if cells have been removed from the model prior to being referenced. 
                    // This adds removed cells in the codec object lookup table.
                    if (node.nodeName == 'ChildChange' && change.parent == null) {
                        this.cellRemoved(change.child);
                    }
                }
            }

            return change;
        }

        /** Adds removed cells to the codec object lookup for references to the removed cells after this point in time. */
        private cellRemoved(cell: Cell, codec?) {
            this.codec.putObject("" + cell.getId(), cell);

            var childCount = Cells.getChildCount(cell);

            for (var i = 0; i < childCount; i++) {
                this.cellRemoved(Cells.getChildAt(cell, i));
            }
        }
    }
} 
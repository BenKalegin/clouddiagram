module Five {

    interface IKeyHandler {
        (evt: KeyboardEvent);
    }

    /**Event handler that listens to keystroke events. This is not a singleton, however, it is normally only required once if the target is the document element (default).
     * This handler installs a key event listener in the topmost DOM node and processes all events that originate from descandants of <mxGraph.container>
     * or from the topmost DOM node. The latter means that all unhandled keystrokes are handled by this object regardless of the focused state of the <graph>.*/
    export class KeyHandler {
        /* target - Optional reference to the event target.If null, the document element is used as the event target, that is, the object where the key event listener is installed.  */
        constructor(graph: Graph, target?: Element) {
            if (graph != null) {
                this.graph = graph;
                this.target = target || document.documentElement;

                // Creates the arrays to map from keycodes to functions
                this.normalKeys = {};
                this.shiftKeys = {};
                this.controlKeys = {};
                this.controlShiftKeys = {};

                this.keydownHandler = (evt: KeyboardEvent) =>  {this.keyDown(evt); };

                // Installs the keystroke listener in the target
                Events.addListener(this.target, 'keydown', this.keydownHandler);

                // Automatically deallocates memory in IE
                if (Client.isIe) {
                    Events.addListener(window, 'unload', () => { this.destroy(); });
                }
            }
        }

        private keydownHandler: IKeyHandler;

        /** Reference to the <mxGraph> associated with this handler. */
        private graph: Graph;

        /** Reference to the target DOM, that is, the DOM node where the key event listeners are installed. */
        private target: Element;

        /** Maps from keycodes to functions for non-pressed control keys. */
        private normalKeys: { [keyCode: number]: IKeyHandler};

        /** Maps from keycodes to functions for pressed shift keys. */
        private shiftKeys: { [keyCode: number]: IKeyHandler};

        /** Maps from keycodes to functions for pressed control keys. */
        private controlKeys: { [keyCode: number]: IKeyHandler }

        /** Maps from keycodes to functions for pressed control and shift keys. */
        private controlShiftKeys: { [keyCode: number]: IKeyHandler }

        /** Specifies if events are handled. Default is true. */
        private enabled = true;

        private isEnabled() : boolean {
            return this.enabled;
        }

        private setEnabled(enabled: boolean) {
            this.enabled = enabled;
        }

        private bindKey(code: number, funct: IKeyHandler) {
                this.normalKeys[code] = funct;
        }

        private bindShiftKey(code: number, funct: IKeyHandler) {
                this.shiftKeys[code] = funct;
        }

        private bindControlKey(code: number, funct: IKeyHandler) {
            this.controlKeys[code] = funct;
        }

        private bindControlShiftKey(code: number, funct: IKeyHandler) {
            this.controlShiftKeys[code] = funct;
        }

        private isControlDown(evt: KeyboardEvent) {
            return Events.isControlDown(evt);
        }

        private getFunction(evt: KeyboardEvent) : IKeyHandler {
            if (evt != null) {
                if (this.isControlDown(evt)) {
                    if (Events.isShiftDown(evt)) {
                        return this.controlShiftKeys[evt.keyCode];
                    }
                    else {
                        return this.controlKeys[evt.keyCode];
                    }
                }
                else {
                    if (Events.isShiftDown(evt)) {
                        return this.shiftKeys[evt.keyCode];
                    }
                    else {
                        return this.normalKeys[evt.keyCode];
                    }
                }
            }

            return null;
        }
	
        /** Returns true if the event should be processed by this handler, that is, if the event source is either the target, one of its direct children, a
         * descendant of the <mxGraph.container>, or the <mxGraph.cellEditor> of the <graph>. */
        private isGraphEvent(evt: KeyboardEvent) {
            var source = Events.getSource(evt);

            // Accepts events from the target object or
            // in-place editing inside graph
            if ((source == this.target || source.parentNode == this.target) ||
            (this.graph.cellEditor != null && this.graph.cellEditor.isEventSource(evt))) {
                return true;
            }

            // Accepts events from inside the container
            return Utils.isAncestorNode(this.graph.container, source);
        }

        /** Handles the event by invoking the function bound to the respective keystroke if <mxGraph.isEnabled>, <isEnabled> and <isGraphEvent> all
         * return true for the given event and <mxGraph.isEditing> returns false. If the graph is editing only the <enter> and <escape> cases are handled
         * by calling the respective hooks. */
        private keyDown(evt: KeyboardEvent) {
            if (this.graph.isEnabled() && !Events.isConsumed(evt) && this.isGraphEvent(evt) && this.isEnabled()) {
                // Cancels the editing if escape is pressed
                if (evt.keyCode == 27 /* Escape */) {
                    this.escape(evt);
                }
		
                // Invokes the function for the keystroke
                else if (!this.graph.isEditing()) {
                    var boundFunction = this.getFunction(evt);

                    if (boundFunction != null) {
                        boundFunction(evt);
                        Events.consume(evt);
                    }
                }
            }
        }

        /** Hook to process ESCAPE keystrokes. This implementation invokes <mxGraph.stopEditing> to cancel the current editing, connecting and/or other ongoing modifications.
         * evt - Key event that represents the keystroke. Possible keycode in this case is 27 (ESCAPE).
         */
        private escape(evt: KeyboardEvent) {
            if (this.graph.isEscapeEnabled()) {
                this.graph.escape(evt);
            }
        }

        /** Destroys the handler and all its references into the DOM. This does normally not need to be called, it is called automatically when the window unloads (in IE). */
        private destroy() {
            if (this.target != null && this.keydownHandler != null) {
                Events.removeListener(this.target, 'keydown', this.keydownHandler);
                this.keydownHandler = null;
            }

            this.target = null;
        }

    }
} 
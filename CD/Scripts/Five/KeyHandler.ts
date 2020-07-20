module Five {
    export interface IKeyHandler {
        (evt: KeyboardEvent);
    }

    export enum KeyCode {
        backspace = 8,
        tab = 9,
        enter = 13,
        shift = 16, 
        ctrl = 17,
        alt = 18,
        pause = 19,
        capslock = 20,
        esc = 27,
        space = 32,
        pageup = 33,
        pagedown = 34,
        end = 35,
        home = 36,
        left = 37,
        up = 38,
        right = 39,
        down = 40,
        insert = 45,
        del = 46,
        a = 65,
        b = 66,
        c = 67,
        d = 68,
        e = 69,
        f = 70,
        g = 71,
        h = 72,
        i = 73,
        j = 74,
        k = 75,
        l = 76,
        m = 77,
        n = 78,
        o = 79,
        p = 80,
        q = 81,
        r = 82,
        s = 83,
        t = 84,
        u = 85,
        v = 86,
        w = 87,
        x = 88,
        y = 89,
        z = 90,
        num0 = 96,
        num1 = 97,
        num2 = 98,
        num3 = 99,
        num4 = 100,
        num5 = 101,
        num6 = 102,
        num7 = 103,
        num8 = 104,
        num9 = 105,
        asterisk = 106,
        plus = 107, 
        minus = 109,
        dot = 110,
        slash = 111,
        f1 = 112,
        f2 = 113,
        f3 = 114,
        f4 = 115,
        f5 = 116,
        f6 = 117,
        f7 = 118,
        f8 = 119,
        f9 = 120,
        f10 = 121,
        f11 = 122,
        f12 = 123,
        numlock = 144,
        scroll = 145,
        comma = 188,
        dot2 = 190,
        slash2 = 191,
        meta = 224
    }

    export enum KeyModifier {
        none = 0, 
        shift = 1,
        ctrl = 2,
        ctrlShift = 3
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
                this.handlers = {};
                this.handlers[KeyModifier.none] = {};
                this.handlers[KeyModifier.shift] = {};
                this.handlers[KeyModifier.ctrl] = {};
                this.handlers[KeyModifier.ctrlShift] = {};

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
        private handlers: { [keyModifier: number] : { [keyCode: number]: IKeyHandler}};

        /** Specifies if events are handled. Default is true. */
        private enabled = true;

        private isEnabled() : boolean {
            return this.enabled;
        }

        private setEnabled(enabled: boolean) {
            this.enabled = enabled;
        }

        bindKey(keyModifier: KeyModifier, code: number, funct: IKeyHandler) {
            this.handlers[keyModifier][code] = funct;
        }

        private isControlDown(evt: KeyboardEvent) {
            return Events.isControlDown(evt);
        }

        private getFunction(evt: KeyboardEvent): IKeyHandler {
            var modifier: KeyModifier;
            if (evt != null) {
                if (this.isControlDown(evt)) {
                    if (Events.isShiftDown(evt))
                        modifier = KeyModifier.ctrlShift;
                    else
                        modifier = KeyModifier.ctrl;

                }
                else {
                    if (Events.isShiftDown(evt)) {
                        modifier = KeyModifier.shift;
                    }
                    else {
                        modifier = KeyModifier.none;
                    }
                }
            return this.handlers[modifier][evt.keyCode];
            }

            return null;
        }
	
        /** Returns true if the event should be processed by this handler, that is, if the event source is either the target, one of its direct children, a
         * descendant of the diagram container, or the cellEditor of the diagram. */
        private isGraphEvent(evt: KeyboardEvent) {
            var source = Events.getSource(evt);

            // Accepts events from the target object or
            // in-place editing inside graph
            if ((source == this.target || source.parentNode == this.target) ||
            (this.graph.cellEditor != null && this.graph.cellEditor.isEventSource(evt))) {
                return true;
            }

            // Accepts events from inside the container
            return this.graph.container.hasChildNode(source);
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
        escape(evt: KeyboardEvent) {
            if (this.graph.isEscapeEnabled()) {
                this.graph.escape(evt);
            }
        }

        /** Destroys the handler and all its references into the DOM. This does normally not need to be called, it is called automatically when the window unloads (in IE). */
        destroy() {
            if (this.target != null && this.keydownHandler != null) {
                Events.removeListener(this.target, 'keydown', this.keydownHandler);
                this.keydownHandler = null;
            }

            this.target = null;
        }

    }
} 
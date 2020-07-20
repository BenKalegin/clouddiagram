module Five {
    export class DefaultKeyHandler {
        constructor(editor: Editor) {
            if (editor != null) {
                this.editor = editor;
                this.handler = new KeyHandler(editor.graph);

                // Extends the escape function of the internal key handle to hide the properties dialog and fire the escape event via the editor instance
                var old = this.handler.escape;

                this.handler.escape = () => {
                    old.apply(this, arguments);
                    editor.hideProperties();
                    editor.onEscape.fire();
                };
            }
        }


        /** Reference to the enclosing Editor. */
        private editor: Editor;

        /**
         * Variable: handler
         *
         * Holds the <mxKeyHandler> for key event handling.
         */
        private handler = null;

        /** Binds the specified keycode to the given action in <editor>. The optional control flag specifies if the control key must be pressed to trigger the action.
         * code - Integer that specifies the keycode.
         * action - Name of the action to execute in <editor>.
         * control - Optional boolean that specifies if control must be pressed. Default is false. */
        private bindAction(code: number, action: string, control?: boolean) {
            var keyHandler = () => { this.editor.execute(action); }

            // Binds the function to control-down keycode
            if (control) {
                this.handler.bindControlKey(code, keyHandler);
            }
            
            // Binds the function to the normal keycode
            else {
                this.handler.bindKey(code, keyHandler);
            }
        }

        /** Destroys the <handler> associated with this object. This does normally not need to be called, the <handler> is destroyed automatically when the window unloads (in IE) by <mxEditor>. */
        destroy() {
            this.handler.destroy();
            this.handler = null;
        }
    }
} 
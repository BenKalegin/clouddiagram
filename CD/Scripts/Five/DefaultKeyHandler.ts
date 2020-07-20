module Five {
    export class DefaultKeyHandler extends KeyHandler {
        constructor(editor: Editor) {
            super(editor.graph);
            this.editor = editor;
        }

        escape(evt: KeyboardEvent) {
            super.escape(evt);
            this.editor.hideProperties();
            this.editor.onEscape.fire();
        }

        /** Reference to the enclosing Editor. */
        private editor: Editor;

        /** Binds the specified keycode to the given action in <editor>. The optional control flag specifies if the control key must be pressed to trigger the action.
         * code - Integer that specifies the keycode.
         * action - Name of the action to execute in <editor>.
         * control - Optional boolean that specifies if control must be pressed. Default is false. */
        private bindAction(code: number, action: string, control?: boolean) {
            var keyHandler = () => { this.editor.execute(action); }
            this.bindKey(control ? KeyModifier.ctrl : KeyModifier.none, code, keyHandler);
        }
    }
} 
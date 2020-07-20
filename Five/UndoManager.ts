module Five {
    export class UndoManager {
        constructor(size: number = 100) {
            this.size = size;
            this.clear();
        }

        onClear = new EventListeners<BasicEvent>();
        onUndo = new EventListeners<UndoEvent>();
        onRedo = new EventListeners<UndoEvent>();

        /** Maximum command history size. 0 means unlimited history. Default is 100. */
        private size;

        /** Array that contains the steps of the command history. */
        private history: UndoableEdit[] = null;

        /** Index of the element to be added next. */
        private indexOfNextAdd = 0;

        /** Returns true if the history is empty. */
        private isEmpty() : boolean {
            return this.history.length == 0;
        }

        /** Clears the command history. */
        clear() {
            this.history = [];
            this.indexOfNextAdd = 0;
            this.onClear.fire();
        } 
        
        /** Returns true if an undo is possible. */
        private canUndo() : boolean {
            return this.indexOfNextAdd > 0;
        }

        /** Undoes the last change. */
        undo() {
            while (this.indexOfNextAdd > 0) {
                var edit = this.history[--this.indexOfNextAdd];
                edit.undo();

                if (edit.isSignificant()) {
                    this.onUndo.fire(new UndoEvent(edit));
                    break;
                }
            }
        }

        private canRedo() : boolean {
            return this.indexOfNextAdd < this.history.length;
        }

        redo() {
            var n = this.history.length;

            while (this.indexOfNextAdd < n) {
                var edit = this.history[this.indexOfNextAdd++];
                edit.redo();

                if (edit.isSignificant()) {
                    this.onRedo.fire(new UndoEvent(edit));
                    break;
                }
            }
        }

        /** Method to be called to add new undoable edits to the <history>. */
        undoableEditHappened(undoableEdit: UndoableEdit) {
            this.trim();

            if (this.size > 0 &&
                this.size == this.history.length) {
                this.history.shift();
            }

            this.history.push(undoableEdit);
            this.indexOfNextAdd = this.history.length;
            //this.fireEvent(new EventObject(Events.add, { key: 'edit', value: undoableEdit}));
        }

        /** Removes all pending steps after <indexOfNextAdd> from the history, invoking die on each edit. This is called from <undoableEditHappened>. */
        private trim() {
            if (this.history.length > this.indexOfNextAdd) {
                var edits = this.history.splice(this.indexOfNextAdd, this.history.length - this.indexOfNextAdd);

                for (var i = 0; i < edits.length; i++) {
                    edits[i].die();
                }
            }
        }
    }
} 
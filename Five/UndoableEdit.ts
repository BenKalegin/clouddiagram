module Five {
    export interface IChange {
        execute?();
        undo?();
        redo?();
        cell?: Cell;
    }

    export interface IUndoableEditListener {
        /** @deprecated */
        onChange?: EventListeners<ModelChangeEvent>;
        onAfterExecute?: EventListeners<AfterExecuteEvent>;
        onStartEdit?: EventListeners<BasicEvent>;
        onEndEdit?: EventListeners<BasicEvent>;
        onNotify?: EventListeners<NotifyEvent>;
    }

    export class UndoableEdit {
        constructor(source: IUndoableEditListener, significant: boolean = true) {
            this.source = source;
            this.changes = [];
            this.significant = significant;
        }

        /** Specifies the source of the edit.*/
        source: IUndoableEditListener;

        /** Array that contains the changes that make up this edit. The changes are expected to either have an undo and redo function, or an execute function. Default is an empty array. */
        changes: IChange[] = null;

        /** Specifies if the undoable change is significant. Default is true. */
        private significant: boolean;

        /** Specifies if this edit has been undone. Default is false.*/
        undone = false;

        /** Specifies if this edit has been redone. Default is false. */
        private redone = false;

        /** Returns true if the this edit contains no changes. */
        isEmpty(): boolean {
            return this.changes.length === 0;
        }

        public isSignificant(): boolean {
            return this.significant;
        }

        /** Adds the specified change to this edit. The change is an object that is expected to either have an undo and redo, or an execute function. */
        add(change: IChange) {
            this.changes.push(change);
        }

        /** Hook to notify any listeners of the changes after an <undo> or <redo> has been carried out. This implementation is empty. */
        notify = () => {}

        /** Hook to free resources after the edit has been removed from the command history. This implementation is empty. */
        public die() {}

        /** Undoes all changes in this edit.*/
        public undo() {
            if (!this.undone) {
                this.source.onStartEdit.fire();
                var count = this.changes.length;

                for (var i = count - 1; i >= 0; i--) {
                    var change = this.changes[i];

                    if (change.execute != null) {
                        change.execute();
                    } else if (change.undo != null) {
                        change.undo();
                    }

                    this.source.onAfterExecute.fire(new AfterExecuteEvent(change));
                }

                this.undone = true;
                this.redone = false;
                this.source.onEndEdit.fire();
            }

            this.notify();
        }

        /** Redoes all changes in this edit. */
        public redo() {
            if (!this.redone) {
                this.source.onStartEdit.fire();
                var count = this.changes.length;

                for (var i = 0; i < count; i++) {
                    var change = this.changes[i];

                    if (change.execute != null) {
                        change.execute();
                    } else if (change.redo != null) {
                        change.redo();
                    }

                    this.source.onAfterExecute.fire(new AfterExecuteEvent(change));
                }

                this.undone = false;
                this.redone = true;
                this.source.onEndEdit.fire();
            }

            this.notify();
        }
    }
}
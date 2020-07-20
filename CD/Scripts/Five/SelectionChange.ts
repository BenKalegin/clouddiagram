module Five {
    export class SelectionChange implements IChange {
        constructor(private selectionModel: GraphSelectionModel, added: Cell[], removed: Cell[]) {
            this.added = (added != null) ? added.slice() : null;
            this.removed = (removed != null) ? removed.slice() : null;
        }

        execute() {
            window.status = Resources.get(this.selectionModel.updatingSelectionResource) || this.selectionModel.updatingSelectionResource;
            var i: number;
            if (this.removed != null) {
                for (i = 0; i < this.removed.length; i++) {
                    this.selectionModel.cellRemoved(this.removed[i]);
                }
            }

            if (this.added != null) {
                for (i = 0; i < this.added.length; i++) {
                    this.selectionModel.cellAdded(this.added[i]);
                }
            }

            var tmp = this.added;
            this.added = this.removed;
            this.removed = tmp;

            window.status = Resources.get(this.selectionModel.doneResource) || this.selectionModel.doneResource;

            this.selectionModel.onSelectionChange.fire(new SelectionChangeEvent(this.added, this.removed));
        }

        private added: Cell[];
        private removed: Cell[];
    }
}
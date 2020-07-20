module Five {
    export class VisibleChange implements IChange {
        constructor(private model: GraphModel, public cell: Cell, private visible: boolean) {
            this.previous = visible;
        }

        execute() {
            this.visible = this.previous;
            this.previous = this.model.visibleStateForCellChanged(this.cell, this.previous);
        }

        previous: boolean;
    }
}
module Five {
    export class CollapseChange implements IChange {
        constructor(private model: GraphModel, public cell: Cell, private collapsed: boolean) {
            this.previous = collapsed;            
        }

        execute() {
            this.collapsed = this.previous;
            this.previous = this.model.collapsedStateForCellChanged(this.cell, this.previous);
        }

        private previous: boolean;
    }
}
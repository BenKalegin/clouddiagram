module Five {
    export class ValueChange implements IChange {
        constructor(private model: GraphModel, public cell: Cell, private value: any) {
            this.previous = value;
        }

        execute() {
            this.value = this.previous;
            this.previous = this.model.valueForCellChanged(this.cell, this.previous);
        }

        previous: any;
    }
}
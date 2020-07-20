module Five {
    export class StyleChange implements IChange {
        constructor(private model: GraphModel, public cell: Cell, private style: AppliedStyle) {
            this.previous = style;
        }

        execute() {
            this.style = this.previous;
            this.previous = this.model.styleForCellChanged(this.cell, this.previous);
        }

        previous: AppliedStyle;
    }
}
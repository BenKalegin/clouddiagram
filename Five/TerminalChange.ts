module Five {
    export class TerminalChange implements IChange {
        constructor(private model: GraphModel, public cell: Cell, private terminal: Cell, private source: boolean) {
            this.previous = terminal;
        }

        execute() {
            this.terminal = this.previous;
            this.previous = this.model.terminalForCellChanged(this.cell, this.previous, this.source);
        }

        previous: Cell;
    }
}
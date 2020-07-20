module Five {
    export class ChildChange implements IChange {

        constructor(private model: GraphModel, public parent: Cell, child: Cell, private index?: number) {
            this.child = child;
            this.previous = parent;
            this.previousIndex = index;
        }

        previous: Cell;
        child: Cell;
        previousIndex: number;

        /** Changes the parent of <child> using GraphModel.parentForCellChanged and removes or restores the cell's connections. */
        execute() {
            var tmp = this.model.getParent(this.child);
            var tmp2 = (tmp != null) ? tmp.getIndex(this.child) : 0;

            if (this.previous == null) {
                this.connect(this.child, false);
            }

            tmp = this.model.parentForCellChanged(
                this.child, this.previous, this.previousIndex);

            if (this.previous != null) {
                this.connect(this.child, true);
            }

            this.parent = this.previous;
            this.previous = tmp;
            this.index = this.previousIndex;
            this.previousIndex = tmp2;
        }

        /** Disconnects the given cell recursively from its terminals and stores the previous terminal in the cell's terminals. */
        private connect(cell: Cell, isConnect: boolean) {
            isConnect = (isConnect != null) ? isConnect : true;

            var source = cell.getTerminal(true);
            var target = cell.getTerminal(false);

            if (source != null) {
                if (isConnect) {
                    this.model.terminalForCellChanged(cell, source, true);
                } else {
                    this.model.terminalForCellChanged(cell, null, true);
                }
            }

            if (target != null) {
                if (isConnect) {
                    this.model.terminalForCellChanged(cell, target, false);
                } else {
                    this.model.terminalForCellChanged(cell, null, false);
                }
            }

            cell.setTerminal(source, true);
            cell.setTerminal(target, false);

            var childCount = this.model.getChildCount(cell);

            for (var i = 0; i < childCount; i++) {
                this.connect(this.model.getChildAt(cell, i), isConnect);
            }
        }
    }
}
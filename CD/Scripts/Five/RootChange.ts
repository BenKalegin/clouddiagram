module Five {
    export class RootChange implements IChange{
        constructor(private model: GraphModel, private root: Cell) {
            this.previous = root;
        }

        execute() {
            this.root = this.previous;
            this.previous = this.model.rootChanged(this.previous);
        }

        previous: Cell;
    }
}
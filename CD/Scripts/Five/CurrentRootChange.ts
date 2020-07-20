module Five {
    export class CurrentRootChange implements IChange {
        private view: GraphView;
        private root: Cell;
        private previous: Cell;
        private isUp: boolean;

        constructor(view: GraphView, root: Cell) {
            this.view = view;
            this.root = root;
            this.previous = root;
            this.isUp = root == null;

            if (!this.isUp) {
                var tmp = this.view.currentRoot;
                var model = this.view.graph.getModel();

                while (tmp != null) {
                    if (tmp == root) {
                        this.isUp = true;
                        break;
                    }

                    tmp = Cells.getParent(tmp);
                }
            }
        }

        execute() {
            /// <summary>Changes the current root of the view.</summary>
            var tmp = this.view.currentRoot;
            this.view.currentRoot = this.previous;
            this.previous = tmp;

            var translate = this.view.graph.getTranslateForRoot(this.view.currentRoot);

            if (translate != null) {
                this.view.translate = new Point(-translate.x, -translate.y);
            }

            this.view.onRootChange.fire(new ViewRootChangeEvent(this.view.currentRoot, this.previous, this.isUp));

            if (this.isUp) {
                this.view.clear(this.view.currentRoot, true);
                this.view.validate();
            } else {
                this.view.refresh();
            }

            this.isUp = !this.isUp;
        }
    }
}
module Five {

    export class CellStateEvent extends BasicEvent{
        constructor(public state: CellState) { super(); }
    }

    export class SelectionCellsHandler implements IMouseListener {
        /// <summary>An event handler that manages cell handlers and invokes their mouse event processing functions.
        /// Event: Events.Add: Fires if a cell has been added to the selection.The state property contains the xCellState that has been added.
        /// Event: Events.Remove: Fires if a cell has been remove from the selection.The state property contains the CellState that has been removed.</summary>

        private graph: Graph;

        /** Specifies if events are handled. Default is true. */
        private enabled = true;

        /** Keeps a reference to an event listener for later removal. */
        refreshHandler: IListener<BasicEvent>;

        /** Defines the maximum number of handlers to paint individually. Default is 100. */
        private maxHandlers = 100;

        /** Dictionary that maps from cells to handlers. */
        handlers: Dictionary<Cell, ICellHandler> = null;

        onAdd = new EventListeners<CellStateEvent>();
        onRemove = new EventListeners<CellStateEvent>();

        private isEnabled(): boolean {
            return this.enabled;
        }

        private setEnabled(value: boolean) {
            this.enabled = value;
        }

        private reset() {
            this.handlers.visit(handler => handler.reset());
        }

        refresh() {
            // Removes all existing handlers
            var oldHandlers = this.handlers;
            this.handlers = new Dictionary<Cell, ICellHandler>();

            // Creates handles for all selection cells
            var tmp = this.graph.getSelectionCells();

            for (var i = 0; i < tmp.length; i++) {
                var state = this.graph.view.getState(tmp[i]);

                if (state != null) {
                    var handler = oldHandlers.remove(tmp[i]);

                    if (handler != null) {
                        if (handler.state !== state) {
                            handler.destroy();
                            handler = null;
                        } else {
                            if (handler.refresh != null) {
                                handler.refresh();
                            }

                            handler.redraw();
                        }
                    }

                    if (handler == null) {
                        handler = this.graph.createHandler(state);
                        this.onAdd.fire(new CellStateEvent(state));
                    }

                    if (handler != null) {
                        this.handlers.put(tmp[i], handler);
                    }
                }
            }

            // Destroys all unused handlers
            oldHandlers.visit(handler =>  {
                this.onRemove.fire(new CellStateEvent(handler.state));
                handler.destroy();
            });
        }

        mouseDown(sender: Object, me: MouseEventContext) {
            if (this.graph.isEnabled() && this.isEnabled()) {
                this.handlers.visit( (handler) =>  {
                    handler.mouseDown(sender, me);
                });
            }
        }

        mouseMove(sender: Object, me: MouseEventContext) {
            if (this.graph.isEnabled() && this.isEnabled()) {
                this.handlers.visit((handler) => {
                    handler.mouseMove(sender, me);
                });
            }
        }

        mouseUp(sender: Object, me: MouseEventContext) {
            if (this.graph.isEnabled() && this.isEnabled()) {
                this.handlers.visit((handler) =>  {
                    handler.mouseUp(sender, me);
                });
            }
        }

        destroy() {
            this.graph.removeMouseListener(this);

            if (this.refreshHandler != null) {

                this.graph.getSelectionModel().onSelectionChange.remove(this.refreshHandler);
                this.graph.getModel().onChange.remove(this.refreshHandler);
                this.graph.getView().onScale.remove(this.refreshHandler);
                this.graph.getView().onTranslate.remove(this.refreshHandler);
                this.graph.getView().onScaleAndTranslate.remove(this.refreshHandler);
                this.graph.getView().onRootChange.remove(this.refreshHandler);
                this.refreshHandler = null;
            }
        }


        constructor(graph: Graph) {
            this.graph = graph;
            this.handlers = new Dictionary<Cell, ICellHandler>();
            this.graph.addMouseListener(this);

            this.refreshHandler = Utils.bind(this, function() {
                if (this.isEnabled()) {
                    this.refresh();
                }
            });

            this.graph.getSelectionModel().onSelectionChange.add(this.refreshHandler);
            this.graph.getModel().onChange.add(this.refreshHandler);
            this.graph.getView().onScale.add(this.refreshHandler);
            this.graph.getView().onTranslate.add(this.refreshHandler);
            this.graph.getView().onScaleAndTranslate.add(this.refreshHandler);
            this.graph.getView().onRootChange.add(this.refreshHandler);
        }

        getHandler(cell: Cell): ICellHandler { 
            return this.handlers.get(cell);
        }
    }
}
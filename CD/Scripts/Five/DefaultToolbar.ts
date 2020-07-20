module Five {

    export class DefaultToolbar {
        constructor(container, editor: Editor) {
            this.editor = editor;

            if (container != null && editor != null) {
                this.init(container);
            }
        }

        /** Reference to the enclosing <mxEditor>. */
        private editor: Editor = null;

        /** Holds the internal Toolbar. */
        private toolbar: Toolbar = null;

        /**
         * Variable: resetHandler
         *
         * Reference to the function used to reset the <toolbar>.
         */
        private resetHandler = null;

        /**
         * Variable: spacing
         *
         * Defines the spacing between existing and new vertices in
         * gridSize units when a new vertex is dropped on an existing
         * cell. Default is 4 (40 pixels).
         */
        private spacing = 4;

        /**
         * Variable: connectOnDrop
         * 
         * Specifies if elements should be connected if new cells are dropped onto
         * connectable elements. Default is false.
         */
        private connectOnDrop = false;

        /** Constructs the <toolbar> for the given container and installs a listener that updates the <mxEditor.insertFunction> on <editor> if an item is selected in the toolbar. This assumes that <editor> is not null. */
        init(container: HTMLElement) {
            if (container != null) {
                this.toolbar = new Toolbar(container);

                // Installs the insert function in the editor if an item is
                // selected in the toolbar
                this.toolbar.onSelect.add( e  => {
                    if (e.funct != null) {
                        this.editor.insertFunction = () => {
                            e.funct.apply(this, arguments);
                            this.toolbar.resetMode(false);
                        };
                    } else {
                        this.editor.insertFunction = null;
                    }
                });

                // Resets the selected tool after a doubleclick or escape keystroke
                this.resetHandler = () => {
                    if (this.toolbar != null) {
                        this.toolbar.resetMode(true);
                    }
                };

                this.editor.graph.onDoubleClick.add(this.resetHandler);
                this.editor.onEscape.add(this.resetHandler);
            }
        }

        /** Adds a new item that executes the given action in <editor>. The title, icon and pressedIcon are used to display the toolbar item.
         * title - String that represents the title (tooltip) for the item.
         * icon - URL of the icon to be used for displaying the item.
         * action - Name of the action to execute when the item is clicked.
         * pressed - Optional URL of the icon for the pressed state.
         */
        private addItem(title: string, icon: string, action: string, pressed?: string) {
            var clickHandler = () => {
                if (action != null && action.length > 0) {
                    this.editor.execute(action);
                }
            };

            return this.toolbar.addItem(title, icon, clickHandler, pressed);
        }

        /** Adds a vertical separator using the optional icon.
         * icon - Optional URL of the icon that represents the vertical separator.
         * Default is <mxClient.imageBasePath> + '/separator.gif'. */
        private addSeparator(icon: string) {
            icon = icon || FileStructure.imageBasePath + '/separator.gif';
            this.toolbar.addSeparator(icon);
        }

        /** Helper method to invoke <mxToolbar.addCombo> on <toolbar> and return the resulting DOM node. */
        private addCombo(): HTMLSelectElement {
            return this.toolbar.addCombo();
        }

        /** Helper method to invoke <mxToolbar.addActionCombo> on <toolbar> using the given title and return the resulting DOM node. */
        private addActionCombo(title: string): HTMLSelectElement {
            return this.toolbar.addActionCombo(title);
        }

        /** Binds the given action to a option with the specified label in the given combo. Combo is an object returned from an earlier call to <addCombo> or <addActionCombo>.
         * combo - DOM node that represents the combo box.
         * title - String that represents the title of the combo.
         * action - Name of the action to execute in <editor>.
         */
        private addActionOption(combo: HTMLSelectElement, title: string, action: string) {
            var clickHandler = () => { this.editor.execute(action); };
            this.addOption(combo, title, clickHandler);
        }

        /** Helper method to invoke <mxToolbar.addOption> on <toolbar> and return the resulting DOM node that represents the option.
         * combo - DOM node that represents the combo box.
         * title - String that represents the title of the combo.
         * value - Object that represents the value of the option. */
        private addOption(combo: HTMLSelectElement, title: string, value) {
            return this.toolbar.addOption(combo, title, value);
        }

        /** Creates an item for selecting the given mode in the <editor>'s graph. Supported modenames are select, connect and pan.
         * title - String that represents the title of the item.
         * icon - URL of the icon that represents the item.
         * mode - String that represents the mode name to be used in <mxEditor.setMode>.
         * pressed - Optional URL of the icon that represents the pressed state.
         * funct - Optional JavaScript function that takes the <mxEditor> as the first and only argument that is executed after the mode has been selected.
         */
        private addMode(title: string, icon: string, mode: string, pressed: string, funct: (e: Editor) => void) {
            var clickHandler: IClickHandler = () => {
                this.editor.setMode(mode);

                if (funct != null) {
                    funct(this.editor);
                }
            };

            return this.toolbar.addSwitchMode(title, icon, clickHandler, pressed);
        }

        /** Creates an item for inserting a clone of the specified prototype cell into the <editor>'s graph. The ptype may either be a cell or a function that returns a cell.
         * 
         * title - String that represents the title of the item.
         * icon - URL of the icon that represents the item.
         * ptype - Function or object that represents the prototype cell. If ptype is a function then it is invoked with no arguments to create new instances.
         * pressed - Optional URL of the icon that represents the pressed state.
         * insert - Optional JavaScript function that handles an insert of the new cell. This function takes the <mxEditor>, new cell to be inserted, mouse event and optional <mxCell> under the mouse pointer as arguments.
         * toggle - Optional boolean that specifies if the item can be toggled. Default is true.
         */
        private addPrototype(title: string, icon: string, ptype, pressed, insert, toggle) {
            // Creates a wrapper function that is in charge of constructing
            // the new cell instance to be inserted into the graph
            var factory = () => {
                if (typeof (ptype) == 'function') {
                    return ptype();
                } else if (ptype != null) {
                    return this.editor.graph.cloneCells([ptype])[0];
                }

                return null;
            };

            // Defines the function for a click event on the graph
            // after this item has been selected in the toolbar
            var clickHandler = (evt: MouseEvent, cell: Cell) => {
                if (typeof (insert) == 'function') {
                    insert(this.editor, factory(), evt, cell);
                } else {
                    this.drop(factory(), evt, cell);
                }

                this.toolbar.resetMode(false);
                Events.consume(evt);
            };

            var img = this.toolbar.addMode(title, icon, clickHandler, pressed, null, toggle);

            // Creates a wrapper function that calls the click handler without
            // the graph argument
            var dropHandler = (graph: Graph, evt: MouseEvent, cell: Cell) => {
                clickHandler(evt, cell);
            };

            this.installDropHandler(img, dropHandler);

            return img;
        }

        /**
         * Function: drop
         * 
         * Handles a drop from a toolbar item to the graph. The given vertex
         * represents the new cell to be inserted. This invokes <insert> or
         * <connect> depending on the given target cell.
         * 
         * Parameters:
         * 
         * vertex - <mxCell> to be inserted.
         * evt - Mouse event that represents the drop.
         * target - Optional <mxCell> that represents the drop target.
         */
        private drop(vertex: Cell, evt: MouseEvent, target?: Cell) {
            var graph = this.editor.graph;
            var model = graph.getModel();

            if (target == null ||
                Cells.isEdge(target) ||
                !this.connectOnDrop ||
                !graph.isCellConnectable(target)) {
                while (target != null &&
                    !graph.isValidDropTarget(target, [vertex], evt)) {
                    target = Cells.getParent(target);
                }

                this.insert(vertex, evt, target);
            } else {
                this.connect(vertex, evt, target);
            }
        }

        /** Handles a drop by inserting the given vertex into the given parent cell or the default parent if no parent is specified.
         * vertex - <mxCell> to be inserted.
         * evt - Mouse event that represents the drop.
         * parent - Optional <mxCell> that represents the parent. */
        private insert(vertex: Cell, evt: MouseEvent, target?: Cell) {
            var graph = this.editor.graph;

            if (graph.canImportCell(vertex)) {
                var x = Events.getClientX(evt);
                var y = Events.getClientY(evt);
                var pt = graph.container.convertPoint(x, y);

                // Splits the target edge or inserts into target group
                if (graph.isSplitEnabled() &&
                    graph.isSplitTarget(target, [vertex], evt)) {
                    return graph.splitEdge(target, [vertex], null, pt.x, pt.y);
                } else {
                    return this.editor.addVertex(target, vertex, pt.x, pt.y);
                }
            }

            return null;
        }

        /** Handles a drop by connecting the given vertex to the given source cell. 
         * vertex - <mxCell> to be inserted.
         * evt - Mouse event that represents the drop.
         * source - Optional <mxCell> that represents the source terminal. */
        private connect(vertex: Cell, evt: MouseEvent, source?: Cell) {
            var graph = this.editor.graph;
            var model = graph.getModel();

            if (source != null &&
                graph.isCellConnectable(vertex) &&
                graph.isEdgeValid(null, source, vertex)) {
                var edge = null;

                model.beginUpdate();
                try {
                    var geo = Cells.getGeometry(source);
                    var g = Cells.getGeometry(vertex).clone();

                    // Moves the vertex away from the drop target that will
                    // be used as the source for the new connection
                    g.x = geo.x + (geo.width - g.width) / 2;
                    g.y = geo.y + (geo.height - g.height) / 2;

                    var step = this.spacing * graph.gridSize;
                    var dist = model.getDirectedEdgeCount(source, true) * 20;

                    if (this.editor.horizontalFlow) {
                        g.x += (g.width + geo.width) / 2 + step + dist;
                    } else {
                        g.y += (g.height + geo.height) / 2 + step + dist;
                    }

                    vertex.setGeometry(g);

                    // Fires two add-events with the code below - should be fixed
                    // to only fire one add event for both inserts
                    var parent = Cells.getParent(source);
                    graph.addCell(vertex, parent);
                    graph.constrainChild(vertex);

                    // Creates the edge using the editor instance and calls
                    // the second function that fires an add event
                    edge = this.editor.createEdge(source, vertex);

                    if (Cells.getGeometry(edge) == null) {
                        var edgeGeometry = new Geometry();
                        edgeGeometry.relative = true;

                        model.setGeometry(edge, edgeGeometry);
                    }

                    graph.addEdge(edge, parent, source, vertex);
                } finally {
                    model.endUpdate();
                }

                graph.setSelectionCells([vertex, edge]);
                graph.scrollCellToVisible(vertex);
            }
        }

        /** Makes the given img draggable using the given function for handling a drop event.
         * img - DOM node that represents the image.
         * dropHandler - Function that handles a drop of the image.*/
        private installDropHandler(img, dropHandler: IDropHandler) {
            var sprite = document.createElement('img');
            sprite.src = img.getAttribute('src');

            // Handles delayed loading of the images
            var loader = () => {
                // Preview uses the image node with double size. Later this can be changed to use a separate preview and guides, but for this the
                // dropHandler must use the additional x- and y-arguments and the dragsource which makeDraggable returns much be configured to
                // use guides via mxDragSource.isGuidesEnabled.
                sprite.style.width = (2 * img.offsetWidth) + 'px';
                sprite.style.height = (2 * img.offsetHeight) + 'px';

                Utils.makeDraggable(img, () => this.editor.graph, dropHandler, sprite);
                Events.removeListener(sprite, 'load', loader);
            };

            if (Client.isIe) {
                loader();
            } else {
                Events.addListener(sprite, 'load', loader);
            }
        }

        /** Destroys the <toolbar> associated with this object and removes all installed listeners. 
         * This does normally not need to be called, the <toolbar> is destroyed automatically when the window unloads (in IE) by<mxEditor>. */
        destroy() {
            if (this.resetHandler != null) {
                this.editor.graph.onDoubleClick.remove(this.resetHandler);
                this.editor.onEscape.remove(this.resetHandler);
                this.resetHandler = null;
            }

            if (this.toolbar != null) {
                this.toolbar.destroy();
                this.toolbar = null;
            }
        }
    }
} 
module Five {

    export class FileOpenEvent extends BasicEvent {
        constructor(public filename: string) { super(); }
    }

    export class FileSaveEvent extends BasicEvent {
        constructor(public url: string) { super(); }
    }

    export class FilePostEvent extends BasicEvent {
        constructor(public request: XmlRequest, public url: string, public data: string) { super(); }
    }

    export class AddVertexEvent extends BasicEvent {
        constructor(public vertex: Cell, public parent: Cell) { super(); }
    }

    export class SessionCreatedEvent extends BasicEvent {
        constructor(public session: Session) { super(); }
    }

    export class Editor {
        constructor(config) {
            this.actions = {};
            this.addActions();

            // Executes the following only if a document has been instanciated.
            // That is, don't execute when the editorcodec is setup.
            if (document.body != null) {
                // Defines instance fields
                this.cycleAttributeValues = [];
                this.popupHandler = new DefaultPopupMenu(null);
                this.undoManager = new UndoManager();

                // Creates the graph and toolbar without the containers
                this.graph = this.createGraph();
                this.toolbar = this.createToolbar();

                // Creates the global keyhandler (requires graph instance)
                this.keyHandler = new DefaultKeyHandler(this);

                // Configures the editor using the URI
                // which was passed to the ctor
                this.configure(config);

                // Assigns the swimlaneIndicatorColorAttribute on the graph
                this.graph.swimlaneIndicatorColorAttribute = this.cycleAttributeName;

                // Initializes the session if the urlInit
                // member field of this editor is set.
                if (!Client.isLocal && this.urlInit != null) {
                    this.session = this.createSession();
                }

                // Automatic deallocation of memory
                if (Client.isIe) {
                    Events.addListener(window, "unload", () => { this.destroy();});
                }
            }
        }

        private lastSnapshot: number = null;
        private rubberband: Rubberband; 
        properties: Window;
        private swimlaneLayout: CompactTreeLayout;
        private diagramLayout: StackLayout;
        private destroyed: boolean;
        /**
         * Group: Controls and Handlers
         */

        /** Specifies the resource key for the zoom dialog. If the resource for this key does not exist then the value is used as the error message. Default is 'askZoom'.
         */
        private askZoomResource = (Client.language != "none") ? "askZoom" : "";

        /** Specifies the resource key for the last saved info. If the resource for this key does not exist then the value is used as the error message. Default is 'lastSaved'.
         */
        private lastSavedResource = (Client.language != "none") ? "lastSaved" : "";

        /** Specifies the resource key for the current file info. If the resource for this key does not exist then the value is used as the error message. Default is 'lastSaved'. */
        private currentFileResource = (Client.language != "none") ? "currentFile" : "";

        /** Specifies the resource key for the properties window title. If the resource for this key does not exist then the value is used as the error message. Default is 'properties'. */
        private propertiesResource = (Client.language != "none") ? "properties" : "";

        /** Specifies the resource key for the tasks window title. If the resource for this key does not exist then the value is used as the error message. Default is 'tasks'. */
        private tasksResource = (Client.language != "none") ? "tasks" : "";

        /** Specifies the resource key for the help window title. If the resource for this key does not exist then the value is used as the error message. Default is 'help'. */
        private helpResource = (Client.language != "none") ? "help" : "";

        /** Specifies the resource key for the outline window title. If the resource for this key does not exist then the value is used as the error message. Default is 'outline'. */
        private outlineResource = (Client.language != "none") ? "outline" : "";

        /** Reference to the <mxWindow> that contains the outline. The <mxOutline> is stored in outline.outline. */
        private outline: Window = null;

        /** Holds a <mxGraph> for displaying the diagram. The graph is created in <setGraphContainer>. */
        public graph: Graph = null;

        /** Holds the render hint used for creating the graph in <setGraphContainer>. See <mxGraph>. Default is null. */
        private graphRenderHint = null;

        /** Holds a <mxDefaultToolbar> for displaying the toolbar. The toolbar is created in <setToolbarContainer>. */
        private toolbar: DefaultToolbar = null;

        /** Holds a <mxSession> instance associated with this editor. */
        private session: Session = null;

        /** DOM container that holds the statusbar. Default is null. Use <setStatusContainer> to set this value. */
        private status: HTMLElement = null;

        /** Holds a <mxDefaultPopupMenu> for displaying popupmenus. */
        private popupHandler: DefaultPopupMenu = null;

        /** Holds an <mxUndoManager> for the command history. */
        private undoManager: UndoManager = null;

        /** Holds a <mxDefaultKeyHandler> for handling keyboard events. The handler is created in <setGraphContainer>. */
        private keyHandler: DefaultKeyHandler = null;

        /** * Group: Actions and Options */

        /** Maps from actionnames to actions, which are functions taking the editor and the cell as arguments. Use <addAction>
         * to add or replace an action and <execute> to execute an action by name, passing the cell to be operated upon as the second argument. */
        private actions: { [name: string] : (editor: Editor, cell: Cell) => void};

        /** Specifies the name of the action to be executed when a cell is double clicked. Default is edit. */
        private dblClickAction = "edit";

        /** Specifies if new cells must be inserted into an existing swimlane. Otherwise, cells that are not swimlanes can be inserted as top-level cells.  */
        private swimlaneRequired = false;

        /** Specifies if the context menu should be disabled in the graph container. Default is true. */
        private disableContextMenu = true;

        /**
         * Group: Templates
         */

        /** Specifies the function to be used for inserting new cells into the graph. This is assigned from the <mxDefaultToolbar> if a vertex-tool is clicked. */
        insertFunction: Function = null;

        /** Specifies if a new cell should be inserted on a single click even using <insertFunction> if there is a cell under the mousepointer, otherwise the cell under the 
         * mousepointer is selected. Default is false. */
        private forcedInserting = false;

        /** Maps from names to protoype cells to be used in the toolbar for inserting new cells into the diagram. */
        private templates: StringDictionary<Cell>;

        /** Prototype edge cell that is used for creatingnew edges. */
        private defaultEdge: Cell;

        /** Specifies the edge style to be returned in <getEdgeStyle>. Default is null. */
        private defaultEdgeStyle: string = null;

        /** Prototype group cell that is used for creating new groups. */
        private defaultGroup: Cell = null;

        /** Default size for the border of new groups. If null, then then <mxGraph.gridSize> is used. Default is null. */
        private groupBorderSize: number = null;

        /** Contains the URL of the last opened file as a string. */
        private filename: string;

        /** Character to be used for encoding linefeeds in <save>. Default is '&#xa;'.*/
        private linefeed = "&#xa;";

        /** Specifies if the name of the post parameter that contains the diagram data in a post request to the server. Default is xml. */
        private postParameterName = "xml";

        /** Specifies if the data in the post request for saving a diagram should be converted using encodeURIComponent. Default is true. */
        private escapePostData = true;

        /** Specifies the URL to be used for posting the diagram to a backend in <save>. */
        private urlPost: string = null;

        /** Specifies the URL to be used for creating a bitmap of the graph in the image action. */
        private urlImage: string = null;

        /** Specifies the URL to be used for initializing the session.*/
        private urlInit: string = null;

        /** Specifies the URL to be used for notifying the backend in the session. */
        private urlNotify: string = null;

        /** Specifies the URL to be used for polling in the session. */
        private urlPoll: string = null;

        /** Specifies the direction of the flow in the diagram. This is used in the layout algorithms. Default is false, ie. vertical flow. */
        horizontalFlow = false;

        /** Specifies if the top-level elements in the diagram should be layed out using a vertical or horizontal stack depending on the setting of <horizontalFlow>. The spacing between the
         * swimlanes is specified by <swimlaneSpacing>. If the top-level elements are swimlanes, then the intra-swimlane layout is activated by the <layoutSwimlanes> switch. */
        private layoutDiagram = false;

        /** Specifies the spacing between swimlanes if automatic layout is turned on in <layoutDiagram>. Default is 0.*/
        private swimlaneSpacing = 0;

        /** Specifies if the swimlanes should be kept at the same width or height depending on the setting of <horizontalFlow>.  Default is false.
         * For horizontal flows, all swimlanes have the same height and for vertical flows, all swimlanes have the same width. Furthermore, the swimlanes are automatically "stacked" if <layoutDiagram> is true. */
        private maintainSwimlanes = false;

        /** Specifies if the children of swimlanes should be layed out, either vertically or horizontally depending on <horizontalFlow>. */
        private layoutSwimlanes = false;

        /** Specifies the attribute values to be cycled when inserting new swimlanes. Default is an empty array. */
        private cycleAttributeValues = null;

        /** Index of the last consumed attribute index. If a new swimlane is inserted, then the <cycleAttributeValues> at this index will be used as the value for <cycleAttributeName>. Default is 0.*/
        private cycleAttributeIndex = 0;

        /** Name of the attribute to be assigned a <cycleAttributeValues> when inserting new swimlanes. Default is fillColor. */
        private cycleAttributeName = "fillColor";

        /** Holds the <mxWindow> created in <showTasks>. */
        private tasks: Window = null;

        /** Icon for the tasks window. */
        private tasksWindowImage: string = null;

        /** Specifies the top coordinate of the tasks window in pixels. Default is 20. */
        private tasksTop = 20;

        /** Holds the <mxWindow> created in <showHelp>. */
        private help: Window = null;

        /** Icon for the help window. */
        private helpWindowImage: string = null;

        /** Specifies the URL to be used for the contents of the Online Help window. This is usually specified in the resources file under urlHelp for language-specific online help support. */
        private urlHelp: string = null;

        /** Specifies the width of the help window in pixels. Default is 300. */
        private helpWidth = 300;

        /** Specifies the width of the help window in pixels. Default is 260. */
        private helpHeight = 260;

        /** Specifies the width of the properties window in pixels. Default is 240. */
        private propertiesWidth = 240;

        /** Specifies the height of the properties window in pixels. If no height is specified then the window will be automatically sized to fit its contents. Default is null. */
        private propertiesHeight: number = null;

        /** Specifies if the properties dialog should be automatically moved near the cell it is displayed for, otherwise the dialog is not moved. This value is only taken into account if the dialog is already visible. Default is false. */
        private movePropertiesDialog = false;

        /** Specifies if <mxGraph.validateGraph> should automatically be invoked after each change. Default is false. */
        private validating = false;

        /** True if the graph has been modified since it was last saved. */
        private modified = false;

        onRootChange = new EventListeners<BasicEvent>();
        onSave = new EventListeners<FileSaveEvent>();
        onOpen = new EventListeners<FileOpenEvent>();
        onPost = new EventListeners<FilePostEvent>();
        onEscape = new EventListeners<BasicEvent>();
        onSessionCreated = new EventListeners<SessionCreatedEvent>();
        onBeforeAddVertex = new EventListeners<AddVertexEvent>();
        onAddVertex = new EventListeners<AddVertexEvent>();
        onAfterAddVertex = new EventListeners<AddVertexEvent>();
        private isModified() : boolean {
            return this.modified;
        }

        private setModified(value: boolean) {
            this.modified = value;
        }

        /** Adds the built-in actions to the editor instance.
         *
         * save - Saves the graph using <urlPost>.
         * print - Shows the graph in a new print preview window.
         * show - Shows the graph in a new window.
         * exportImage - Shows the graph as a bitmap image using <getUrlImage>.
         * refresh - Refreshes the graph's display.
         * cut - Copies the current selection into the clipboard
         * and removes it from the graph.
         * copy - Copies the current selection into the clipboard.
         * paste - Pastes the clipboard into the graph.
         * delete - Removes the current selection from the graph.
         * group - Puts the current selection into a new group.
         * ungroup - Removes the selected groups and selects the children.
         * undo - Undoes the last change on the graph model.
         * redo - Redoes the last change on the graph model.
         * zoom - Sets the zoom via a dialog.
         * zoomIn - Zooms into the graph.
         * zoomOut - Zooms out of the graph
         * actualSize - Resets the scale and translation on the graph.
         * fit - Changes the scale so that the graph fits into the window.
         * showProperties - Shows the properties dialog.
         * selectAll - Selects all cells.
         * selectNone - Clears the selection.
         * selectVertices - Selects all vertices.
         * selectEdges = Selects all edges.
         * edit - Starts editing the current selection cell.
         * enterGroup - Drills down into the current selection cell.
         * exitGroup - Moves up in the drilling hierachy
         * home - Moves to the topmost parent in the drilling hierarchy
         * selectPrevious - Selects the previous cell.
         * selectNext - Selects the next cell.
         * selectParent - Selects the parent of the selection cell.
         * selectChild - Selects the first child of the selection cell.
         * collapse - Collapses the currently selected cells.
         * expand - Expands the currently selected cells.
         * bold - Toggle bold text style.
         * italic - Toggle italic text style.
         * underline - Toggle underline text style.
         * shadow - Toggle shadow text style.
         * alignCellsLeft - Aligns the selection cells at the left.
         * alignCellsCenter - Aligns the selection cells in the center.
         * alignCellsRight - Aligns the selection cells at the right.
         * alignCellsTop - Aligns the selection cells at the top.
         * alignCellsMiddle - Aligns the selection cells in the middle.
         * alignCellsBottom - Aligns the selection cells at the bottom.
         * alignFontLeft - Sets the horizontal text alignment to left.
         * alignFontCenter - Sets the horizontal text alignment to center.
         * alignFontRight - Sets the horizontal text alignment to right.
         * alignFontTop - Sets the vertical text alignment to top.
         * alignFontMiddle - Sets the vertical text alignment to middle.
         * alignFontBottom - Sets the vertical text alignment to bottom.
         * toggleTasks - Shows or hides the tasks window.
         * toggleHelp - Shows or hides the help window.
         * toggleOutline - Shows or hides the outline window.
         * toggleConsole - Shows or hides the console window.
         */
        private addActions() {
            this.addAction("save", editor => { editor.save(); });
            //this.addAction('print', editor => { new PrintPreview(editor.graph, 1).open(); });
            this.addAction("show", editor => { Utils.show(editor.graph, null, 10, 10); });
            this.addAction("exportImage", editor => {
                var url = editor.getUrlImage();
                if (url == null || Client.isLocal) {
                    editor.execute("show");
                }
                else {
                    var node = Utils.getViewXml(editor.graph, 1);
                    var xml = Utils.getXml(node, "\n");

                    Utils.submit(url, editor.postParameterName + "=" +
                        encodeURIComponent(xml), document, "_blank");
                }
            });

            this.addAction("refresh", editor => { editor.graph.refresh();});
            this.addAction("cut", editor => { if (editor.graph.isEnabled()) { Clipboard.cut(editor.graph);}});
            this.addAction("copy", editor => { if (editor.graph.isEnabled()) { Clipboard.copy(editor.graph);}});
            this.addAction("paste", editor => { if (editor.graph.isEnabled()) { Clipboard.paste(editor.graph);}});
            this.addAction("delete", editor => { if (editor.graph.isEnabled()) { editor.graph.removeCells();}});
            this.addAction("group", editor => { if (editor.graph.isEnabled()) { editor.graph.setSelectionCell(editor.groupCells());}});
            this.addAction("ungroup", editor => {if (editor.graph.isEnabled()) { editor.graph.setSelectionCells(editor.graph.ungroupCells());}});
            this.addAction("removeFromParent", editor => {if (editor.graph.isEnabled()) {editor.graph.removeCellsFromParent();}});
            this.addAction("undo", editor => { if (editor.graph.isEnabled()) {editor.undo();}});
            this.addAction("redo", editor => {if (editor.graph.isEnabled()) { editor.redo();}});
            this.addAction("zoomIn", editor => {editor.graph.zoomIn();});
            this.addAction("zoomOut", editor => { editor.graph.zoomOut();});
            this.addAction("actualSize", editor => {editor.graph.zoomActual();});
            this.addAction("fit", editor => { editor.graph.fit(); });
            this.addAction("showProperties", (editor, cell) => { editor.showProperties(cell);});
            this.addAction("selectAll", editor => { if (editor.graph.isEnabled()) { editor.graph.selectAll();}});
            this.addAction("selectNone", editor => {if (editor.graph.isEnabled()) { editor.graph.clearSelection();}});
            this.addAction("selectVertices", editor => { if (editor.graph.isEnabled()) { editor.graph.selectVertices(); }});
            this.addAction("selectEdges", editor => { if (editor.graph.isEnabled()) { editor.graph.selectEdges();}});
            this.addAction("edit", (editor, cell) => {if (editor.graph.isEnabled() && editor.graph.isCellEditable(cell)) { editor.graph.startEditingAtCell(cell);}});
            this.addAction("toBack", editor => { if (editor.graph.isEnabled()) { editor.graph.orderCells(true); }});
            this.addAction("toFront", (editor) => {if (editor.graph.isEnabled()) { editor.graph.orderCells(false); }});
            this.addAction("enterGroup", (editor, cell) => { editor.graph.enterGroup(cell);});
            this.addAction("exitGroup", editor => { editor.graph.exitGroup();});
            this.addAction("home", editor => { editor.graph.home();});
            this.addAction("selectPrevious", editor => { if (editor.graph.isEnabled()) { editor.graph.selectPreviousCell();}});
            this.addAction("selectNext", editor => { if (editor.graph.isEnabled()) { editor.graph.selectNextCell();}});
            this.addAction("selectParent", editor => { if (editor.graph.isEnabled()) { editor.graph.selectParentCell(); }});
            this.addAction("selectChild", editor => { if (editor.graph.isEnabled()) { editor.graph.selectChildCell();}});
            this.addAction("collapse", editor => {if (editor.graph.isEnabled()) {editor.graph.foldCells(true);}});
            this.addAction("collapseAll", editor => { if (editor.graph.isEnabled()) { editor.graph.foldCells(true, false, editor.graph.getChildVertices());}});
            this.addAction("expand", editor => { if (editor.graph.isEnabled()) { editor.graph.foldCells(false);}});
            this.addAction("expandAll", editor => { if (editor.graph.isEnabled()) { editor.graph.foldCells(false, false, editor.graph.getChildVertices());}});
            this.addAction("bold", editor => { if (editor.graph.isEnabled()) { editor.graph.toggleCellStyleFlags( Constants.styleFontstyle, Constants.fontBold);}});
            this.addAction("italic", editor => { if (editor.graph.isEnabled()) { editor.graph.toggleCellStyleFlags(Constants.styleFontstyle, Constants.fontItalic);}});
            this.addAction("underline", editor => { if (editor.graph.isEnabled()) { editor.graph.toggleCellStyleFlags( Constants.styleFontstyle, Constants.fontUnderline);}});
            this.addAction("shadow", editor => { if (editor.graph.isEnabled()) { editor.graph.toggleCellStyleFlags(Constants.styleFontstyle, Constants.fontShadow); }});
            this.addAction("alignCellsLeft", editor => { if (editor.graph.isEnabled()) { editor.graph.alignCells(Constants.alignLeft);}});
            this.addAction("alignCellsCenter", editor => { if (editor.graph.isEnabled()) { editor.graph.alignCells(Constants.alignCenter);}});
            this.addAction("alignCellsRight", editor => { if (editor.graph.isEnabled()) { editor.graph.alignCells(Constants.alignRight);}});
            this.addAction("alignCellsTop", editor => { if (editor.graph.isEnabled()) { editor.graph.alignCells(Constants.alignTop); }});
            this.addAction("alignCellsMiddle", editor => { if (editor.graph.isEnabled()) { editor.graph.alignCells(Constants.alignMiddle);}});
            this.addAction("alignCellsBottom", editor => { if (editor.graph.isEnabled()) { editor.graph.alignCells(Constants.alignBottom); }});
            this.addAction("alignFontLeft", editor => { editor.graph.setCellStyles(Constants.styleAlign, Constants.alignLeft);});
            this.addAction("alignFontCenter", editor => {if (editor.graph.isEnabled()) { editor.graph.setCellStyles( Constants.styleAlign, Constants.alignCenter);}});
            this.addAction("alignFontRight", editor => { if (editor.graph.isEnabled()) { editor.graph.setCellStyles( Constants.styleAlign, Constants.alignRight);}});
            this.addAction("alignFontTop", editor => { if (editor.graph.isEnabled()) { editor.graph.setCellStyles( Constants.styleVerticalAlign, Constants.alignTop); }});
            this.addAction("alignFontMiddle", editor => { if (editor.graph.isEnabled()) { editor.graph.setCellStyles( Constants.styleVerticalAlign, Constants.alignMiddle);}});
            this.addAction("alignFontBottom", editor => { if (editor.graph.isEnabled()) { editor.graph.setCellStyles( Constants.styleVerticalAlign, Constants.alignBottom);}});
            this.addAction("zoom", editor => {
                var current = editor.graph.getView().scale * 100;
                var scale = parseFloat(Utils.prompt(
                    Resources.get(editor.askZoomResource) ||
                    editor.askZoomResource,
                    "" + current)) / 100;

                if (!isNaN(scale)) {
                    editor.graph.getView().setScale(scale);
                }
            });

            this.addAction("toggleTasks", editor => {
                if (editor.tasks != null) {
                    editor.tasks.setVisible(!editor.tasks.isVisible());
                }
                else {
                    editor.showTasks();
                }
            });

            this.addAction("toggleHelp", editor => {
                if (editor.help != null) {
                    editor.help.setVisible(!editor.help.isVisible());
                }
                else {
                    editor.showHelp();
                }
            });

            this.addAction("toggleOutline", editor => {
                if (editor.outline == null) {
                    editor.showOutline();
                }
                else {
                    editor.outline.setVisible(!editor.outline.isVisible());
                }
            });
        }

        /** Creates and returns and <mxSession> using <urlInit>, <urlPoll> and <urlNotify>. */
        private createSession() {
            // Routes any change events from the session through the editor and dispatches them as a session event.
            var sessionChanged = (session) =>  {
                this.onSessionCreated.fire(new SessionCreatedEvent(session));
            };

            return this.connect(this.urlInit, this.urlPoll, this.urlNotify, sessionChanged);
        }

        /** Configures the editor using the specified node. To load the configuration from a given URL the following code can be used to obtain the XML node.
         * node - XML node that contains the configuration. */
        private configure(node: Node) {
            if (node != null) {
                // Creates a decoder for the XML data
                // and uses it to configure the editor
                var dec = new Codec(node.ownerDocument);
                dec.decode(node, this);

                // Resets the counters, modified state and
                // command history
                this.resetHistory();
            }
        }

        /** Resets the cookie that is used to remember if the editor has already been used. */
        private resetFirstTime() {
            document.cookie = "five=seen; expires=Fri, 27 Jul 2001 02:47:11 UTC; path=/";
        }

        /** Resets the command history, modified state and counters. */
        private resetHistory() {
            this.lastSnapshot = new Date().getTime();
            this.undoManager.clear();
            this.setModified(false);
        }

        /** Binds the specified actionname to the specified function.
         * actionname - String that specifies the name of the action  to be added.
         * funct - Function that implements the new action. The first argument of the function is the editor it is used with, the second argument is the cell it operates upon. */
        private addAction(actionname: string, funct: (editor: Editor, cell: Cell) => void) {
            this.actions[actionname] = funct;
        }

        /** Executes the function with the given name in <actions> passing the editor instance and given cell as the first and second argument. 
         * All additional arguments are passed to the action as well. This method contains a try-catch block and displays an error message if an action
         * causes an exception. The exception is re-thrown after the error message was displayed. */
        public execute: (actionname: string, cell?: Cell) => void = (actionname) => {
            var action = this.actions[actionname];

            if (action != null) {
                try {
                    // Creates the array of arguments by replacing the actionname
                    // with the editor instance in the args of this function
                    var args = arguments;
                    args[0] = this;

                    // Invokes the function on the editor using the args
                    action.apply(this, args);
                }
                catch (e) {
                    Utils.error("Cannot execute " + actionname + ": " + e.message, 280, true);

                    throw e;
                }
            }
            else {
                Utils.error("Cannot find action " + actionname, 280, true);
            }
        }

        /** Adds the specified template under the given name in <templates>. */
        private addTemplate(name: string, template: Cell) {
            this.templates[name] = template;
        }

        /** Returns the template for the given name. */
        private getTemplate(name: string) : Cell {
            return this.templates[name];
        }

        /** Creates the <graph> for the editor. The graph is created with no container and is initialized from <setGraphContainer>. */
        private createGraph() : Graph {
            var graph = new Graph(null, null, this.graphRenderHint);

            // Enables rubberband, tooltips, panning
            graph.setTooltips(true);
            graph.setPanning(true);

            // Overrides the dblclick method on the graph to
            // invoke the dblClickAction for a cell and reset
            // the selection tool in the toolbar
            this.installDblClickHandler(graph);

            // Installs the command history
            this.installUndoHandler(graph);

            // Installs the handlers for the root event
            this.installDrillHandler(graph);

            // Installs the handler for validation
            this.installChangeHandler(graph);

            // Installs the handler for calling the
            // insert function and consume the
            // event if an insert function is defined
            this.installInsertHandler(graph);

            // Redirects the function for creating the popupmenu items
            graph.popupMenuHandler.factoryMethod = (menu, cell, evt) => { this.createPopupMenu(menu, cell, evt) };
            // Redirects the function for creating new connections in the diagram
            graph.connectionHandler.factoryMethod = (source, target) => this.createEdge(source, target);

            // Maintains swimlanes and installs autolayout
            this.createSwimlaneManager(graph);
            this.createLayoutManager(graph);

            return graph;
        }

        /** Sets the graph's container using <mxGraph.init>. */
        private createSwimlaneManager(graph: Graph): SwimlaneManager {
            var swimlaneMgr = new SwimlaneManager(graph, false);

            swimlaneMgr.isHorizontal = () => { return this.horizontalFlow;};
            swimlaneMgr.isEnabled = () => { return this.maintainSwimlanes;};

            return swimlaneMgr;
        }

        /** Creates a layout manager for the swimlane and diagram layouts, that is, the locally defined inter- and intraswimlane layouts. */
        private createLayoutManager(graph: Graph): LayoutManager {
            var layoutMgr = new LayoutManager(graph); // closure
            layoutMgr.getLayout = cell => {
                var layout = null;
                var model = this.graph.getModel();

                if (model.getParent(cell) != null) {
                    // Executes the swimlane layout if a child of
                    // a swimlane has been changed. The layout is
                    // lazy created in createSwimlaneLayout.
                    if (this.layoutSwimlanes &&
                        graph.isSwimlane(cell)) {
                        if (this.swimlaneLayout == null) {
                            this.swimlaneLayout = this.createSwimlaneLayout();
                        }

                        layout = this.swimlaneLayout;
                    }

                    // Executes the diagram layout if the modified
                    // cell is a top-level cell. The layout is
                    // lazy created in createDiagramLayout.
                    else if (this.layoutDiagram &&
                    (graph.isValidRoot(cell) ||
                        model.getParent(model.getParent(cell)) == null)) {
                        if (this.diagramLayout == null) {
                            this.diagramLayout = this.createDiagramLayout();
                        }

                        layout = this.diagramLayout;
                    }
                }

                return layout;
            }
            return layoutMgr;
        }

        /** Sets the graph's container using <mxGraph.init>. */
        setGraphContainer(container: HTMLElement) {
            if (this.graph.container == null) {
                this.graph.init(container);

                // Install rubberband selection as the last action handler in the chain
                this.rubberband = new Rubberband(this.graph);

                // Disables the context menu
                if (this.disableContextMenu) {
                    Events.disableContextMenu(container);
                }

                // Workaround for stylesheet directives in IE
                if (Client.isQuirks) {
                    // ReSharper disable once WrongExpressionStatement
                    new DivResizer(container);
                }
            }
        }

        /** Overrides <mxGraph.dblClick> to invoke <dblClickAction> on a cell and reset the selection tool in the toolbar. */
        private installDblClickHandler(graph: Graph) {
            // Installs a listener for double click events
            graph.onDoubleClick.add((evt: DoubleClickEvent) => {
                    var cell = evt.cell;

                    if (cell != null &&
                        graph.isEnabled() &&
                        this.dblClickAction != null) {
                        this.execute(this.dblClickAction, cell);
                        evt.consume();
                    }
                });
        }

        /** Adds the <undoManager> to the graph model and the view. */
        private installUndoHandler(graph: Graph) {
            var listener = (e: UndoEvent) => this.undoManager.undoableEditHappened(e.edit);
            graph.getModel().onUndo.add(listener);
            graph.getView().onUndo.add(listener);

            // Keeps the selection state in sync
            var undoHandler = (e: UndoEvent) => graph.setSelectionCells(graph.getSelectionCellsForChanges(e.edit.changes));
            this.undoManager.onUndo.add(undoHandler);
            this.undoManager.onRedo.add(undoHandler);
        }

        /**Installs listeners for dispatching the <root> event. */
        private installDrillHandler(graph: Graph) {
            var listener = () => this.onRootChange.fire();
            graph.getView().onRootChange.add(listener);
        }

        /** Installs the listeners required to automatically validate the graph. On each change of the root, this implementation fires a <root> event. */
        private installChangeHandler(graph: Graph) {
            var listener = (e: ModelChangeEvent) =>  {
                // Updates the modified state
                this.setModified(true);

                // Automatically validates the graph after each change
                if (this.validating) {
                    graph.validateGraph();
                }

                // Checks if the root has been changed
                var changes = e.edit.changes;

                for (var i = 0; i < changes.length; i++) {
                    var change = changes[i];

                    if (change instanceof RootChange ||
                        (change instanceof ValueChange && change.cell == this.graph.model.root) ||
                        (change instanceof CellAttributeChange && change.cell == this.graph.model.root)) {
                        this.onRootChange.fire();
                        break;
                    }
                }
            };

            graph.getModel().onChange.add(listener);
        }

        /** Installs the handler for invoking <insertFunction> if one is defined. */
        private installInsertHandler(graph: Graph) {
            var insertHandler: IMouseListener =
            {
                mouseDown(sender, me) {
                    if (this.insertFunction != null &&
                        !me.isPopupTrigger() &&
                        (this.forcedInserting ||
                            me.getState() == null)) {
                        this.graph.clearSelection();
                        this.insertFunction(me.getEvent(), me.getCell());

                        // Consumes the rest of the events
                        // for this gesture (down, move, up)
                        this.isActive = true;
                        me.consume();
                    }
                },
                mouseMove(sender, me) {
                    if (this.isActive) {
                        me.consume();
                    }
                },
                mouseUp(sender, me) {
                    if (this.isActive) {
                        this.isActive = false;
                        me.consume();
                    }
                }
            };

            graph.addMouseListener(insertHandler);
        }

        /** Creates the layout instance used to layout the swimlanes in the diagram. */
        private createDiagramLayout(): StackLayout {
            var gs = this.graph.gridSize;
            var layout = new StackLayout(this.graph, !this.horizontalFlow, this.swimlaneSpacing, 2 * gs, 2 * gs);

            // Overrides isIgnored to only take into account swimlanes
            layout.isVertexIgnored = cell => !layout.graph.isSwimlane(cell);

            return layout;
        }

        /** Creates the layout instance used to layout the children of each swimlane. */
        private createSwimlaneLayout() : CompactTreeLayout {
            return new CompactTreeLayout(this.graph, this.horizontalFlow);
        }

        /** Creates the <toolbar> with no container. */
        private createToolbar() : DefaultToolbar {
            return new DefaultToolbar(null, this);
        }

        /** Initializes the toolbar for the given container. */
        private setToolbarContainer(container: HTMLElement) {
            this.toolbar.init(container);

            // Workaround for stylesheet directives in IE
            if (Client.isQuirks) {
                // ReSharper disable once WrongExpressionStatement
                new DivResizer(container);
            }
        }

        /** Creates the <status> using the specified container. This implementation adds listeners in the editor to 
         * display the last saved time and the current filename in the status bar.
         * container - DOM node that will contain the statusbar. */
        private setStatusContainer(container: HTMLElement) {
            if (this.status == null) {
                this.status = container;

                // Prints the last saved time in the status bar when files are saved
                this.onSave.add(() => this.setStatus(Resources.get(this.lastSavedResource) + ": " + new Date().toLocaleString()));

                // Updates the statusbar to display the filename when new files are opened
                this.onOpen.add(() => this.setStatus(Resources.get(this.currentFileResource) + ": " + this.filename));

                // Workaround for stylesheet directives in IE
                if (Client.isQuirks) {
                    // ReSharper disable once WrongExpressionStatement
                    new DivResizer(container);
                }
            }
        }

        /** Display the specified message in the status bar.
         * message - String the specified the message to be displayed. */
        setStatus(message: string) {
            if (this.status != null && message != null) {
                this.status.innerHTML = message;
            }
        }

        /** Creates a listener to update the inner HTML of the specified DOM node with the value of <getTitle>.
         * container - DOM node that will contain the title. */
        private setTitleContainer(container: HTMLElement) {
            this.onRootChange.add(() => container.innerHTML = this.getTitle());

            // Workaround for stylesheet directives in IE
            if (Client.isQuirks) {
                // ReSharper disable once WrongExpressionStatement
                new DivResizer(container);
            }
        }

        /** Executes a vertical or horizontal compact tree layout using the specified cell as an argument. The cell may
         * either be a group or the root of a tree.
         * cell - <mxCell> to use in the compact tree layout.
         * horizontal - Optional boolean to specify the tree's orientation. Default is true. */
        private treeLayout(cell: Cell, horizontal) {
            if (cell != null) {
                var layout = new CompactTreeLayout(this.graph, horizontal);
                layout.execute(cell);
            }
        }

        /** Returns the string value for the current root of the diagram. */
        private getTitle() : string {
            var title = "";
            var graph = this.graph;
            var cell = graph.getCurrentRoot();

            while (cell != null &&
                graph.getModel().getParent(
                    graph.getModel().getParent(cell)) != null) {
                // Append each label of a valid root
                if (graph.isValidRoot(cell)) {
                    title = " > " +
                    graph.convertValueToString(cell) + title;
                }

                cell = graph.getModel().getParent(cell);
            }

            var prefix = this.getRootTitle();

            return prefix + title;
        }

        /** Returns the string value of the root cell in <mxGraph.model>. */
        private getRootTitle() : string {
            var root = this.graph.getModel().getRoot();
            return this.graph.convertValueToString(root);
        }

        /** Undo the last change in <graph>. */
        private undo() {
            this.undoManager.undo();
        }

        /** Redo the last change in <graph>. */
        private redo() {
            this.undoManager.redo();
        }

        /** Invokes <createGroup> to create a new group cell and the invokes <mxGraph.groupCells>, using the grid size of the graph as the spacing
         * in the group's content area. */
        private groupCells() {
            var border = (this.groupBorderSize != null) ?
                this.groupBorderSize :
                this.graph.gridSize;
            return this.graph.groupCells(this.createGroup(), border);
        }

        /** Creates and returns a clone of <defaultGroup> to be used as a new group cell in <group>. */
        private createGroup() : Cell{
            var model = this.graph.getModel();

            return model.cloneCell(this.defaultGroup);
        }

        /** Opens the specified file synchronously and parses it using <readGraphModel>. It updates <filename> and fires an <open>-event after
         * the file has been opened.  */
        private open(filename: string) {
            if (filename != null) {
                var xml = Utils.load(filename).getXml();
                this.readGraphModel(xml.documentElement);
                this.filename = filename;

                this.onOpen.fire(new FileOpenEvent(filename));
            }
        }

        /**Reads the specified XML node into the existing graph model and resets the command history and modified state. */
        private readGraphModel(node: Node) {
            var dec = new Codec(node.ownerDocument);
            dec.decode(node, this.graph.getModel());
            this.resetHistory();
        }

        /** Posts the string returned by <writeGraphModel> to the given URL or the URL returned by <getUrlPost>. The actual posting is carried out by
         * <postDiagram>. If the URL is null then the resulting XML will be displayed using <Utils.popup>.  */
        private save(url?: string, linefeed?: string) {
            // Gets the URL to post the data to
            url = url || this.getUrlPost();

            // Posts the data if the URL is not empty
            if (url != null && url.length > 0) {
                var data = this.writeGraphModel(linefeed);
                this.postDiagram(url, data);

                // Resets the modified flag
                this.setModified(false);
            }

            // Dispatches a save event
            this.onSave.fire(new FileSaveEvent(url));
        }

        /** Hook for subclassers to override the posting of a diagram represented by the given node to the given URL. This fires
         * an asynchronous <post> event if the diagram has been posted. */
        private postDiagram(url: string, data: string) {
            if (this.escapePostData) {
                data = encodeURIComponent(data);
            }

            Utils.post(url, this.postParameterName + "=" + data, req => this.onPost.fire(new FilePostEvent(req, url, data)), null);
        }

        /** Hook to create the string representation of the diagram. The default implementation uses an <mxCodec> to encode the graph model as follows:
         * linefeed - Optional character to be used as the linefeed. Default is <linefeed>.
         */
        private writeGraphModel(linefeed?: string) {
            linefeed = linefeed || this.linefeed;
            var enc = new Codec();
            var node = enc.encode(this.graph.getModel());

            return Utils.getXml(node, linefeed);
        }

        /** Returns the URL to post the diagram to. This is used in <save>. The default implementation returns <urlPost>, adding <code>?draft=true</code>. */
        private getUrlPost() : string {
            return this.urlPost;
        }

        /** Returns the URL to create the image with. This is typically the URL of a backend which accepts an XML representation
         * of a graph view to create an image. The function is used in the image action to create an image. This implementation returns <urlImage>. */
        private getUrlImage() : string {
            return this.urlImage;
        }

        /** Creates and returns a session for the specified parameters, installing the onChange function as a change listener for the session. */
        private connect(urlInit: string, urlPoll: string, urlNotify: string, onChange: (session: Session) => void) {
            var session: Session = null;

            if (!Client.isLocal) {
                session = new Session(this.graph.getModel(), urlInit, urlPoll, urlNotify);

                // Resets the undo history if the session was initialized which is the case if the message carries a namespace to be used for new IDs.
                // session.onResume.add(e => { if (e.node.namespace != null) { this.resetHistory(); } });

                // Installs the listener for all events that signal a change of the session
                var listener = () => onChange(session);
                session.onDisconnect.add(listener);
                session.onConnect.add(listener);
                session.onSessionNotify.add(listener);
                session.onGet.add(listener);
                session.start();
            }

            return session;
        }

        /** Swaps the styles for the given names in the graph's stylesheet and refreshes the graph. */
        private swapStyles(first: string, second: string) {
            var stylesheet = this.graph.getStylesheet();
            var style = stylesheet.styles[second];
            stylesheet.putCellStyle(second, stylesheet.styles[first]);
            stylesheet.putCellStyle(first, style);
            this.graph.refresh();
        }

        /** Creates and shows the properties dialog for the given cell. The content area of the dialog is created using <createProperties>.*/
        private showProperties(cell: Cell) {
            cell = cell || this.graph.getSelectionCell();

            // Uses the root node for the properties dialog
            // if not cell was passed in and no cell is
            // selected
            if (cell == null) {
                cell = this.graph.getCurrentRoot();

                if (cell == null) {
                    cell = this.graph.getModel().getRoot();
                }
            }

            if (cell != null) {
                // Makes sure there is no in-place editor in the
                // graph and computes the location of the dialog
                this.graph.stopEditing(true);

                var offset = Utils.getOffset(this.graph.container);
                var x = offset.x + 10;
                var y = offset.y;

                // Avoids moving the dialog if it is alredy open
                if (this.properties != null && !this.movePropertiesDialog) {
                    x = this.properties.getX();
                    y = this.properties.getY();
                }

                // Places the dialog near the cell for which it
                // displays the properties
                else {
                    var bounds = this.graph.getCellBounds(cell);

                    if (bounds != null) {
                        x += bounds.x + Math.min(200, bounds.width);
                        y += bounds.y;
                    }
                }

                // Hides the existing properties dialog and creates a new one with the
                // contents created in the hook method
                this.hideProperties();
                var node = this.createProperties(cell);

                if (node != null) {
                    // Displays the contents in a window and stores a reference to the
                    // window for later hiding of the window
                    this.properties = new Window(Resources.get(this.propertiesResource) ||
                        this.propertiesResource, node, x, y, this.propertiesWidth, this.propertiesHeight, false);
                    this.properties.setVisible(true);
                }
            }
        }

        /** Returns true if the properties dialog is currently visible. */
        private isPropertiesVisible() : boolean{
            return this.properties != null;
        }

        /** Creates and returns the DOM node that represents the contents of the properties dialog for the given cell. This implementation
         * works for user objects that are XML nodes and display all the node attributes in a form. */
        private createProperties(cell: Cell) : HTMLTableElement {
            var model = this.graph.getModel();
            var value = model.getValue(cell);

            if (Utils.isNode(value)) {
                // Creates a form for the user object inside
                // the cell
                var form = new Form("properties");

                // Adds a readonly field for the cell id
                var id = form.addText("ID", "" + cell.getId());
                id.readOnly = true;

                var geo = null;
                var yField = null;
                var xField = null;
                var widthField = null;
                var heightField = null;

                // Adds fields for the location and size
                if (model.isVertex(cell)) {
                    geo = Cells.getGeometry(cell);

                    if (geo != null) {
                        yField = form.addText("top", geo.y);
                        xField = form.addText("left", geo.x);
                        widthField = form.addText("width", geo.width);
                        heightField = form.addText("height", geo.height);
                    }
                }

                // Adds a field for the cell style			
                var tmp = model.getStyle(cell);
                var style = form.addText("Style", tmp || "");

                // Creates textareas for each attribute of the
                // user object within the cell
                var attrs = value.attributes;
                var texts = [];

                for (var i = 0; i < attrs.length; i++) {
                    // Creates a textarea with more lines for
                    // the cell label
                    var val = attrs[i].nodeValue;
                    texts[i] = form.addTextarea(attrs[i].nodeName, val,
                        (attrs[i].nodeName == "label") ? 4 : 2);
                }

                // Adds an OK and Cancel button to the dialog contents and implements the respective actions below
                // Defines the function to be executed when the OK button is pressed in the dialog
                var okFunction = () => {
                    // Hides the dialog
                    this.hideProperties();

                    // Supports undo for the changes on the underlying
                    // XML structure / XML node attribute changes.
                    model.beginUpdate();
                    try {
                        if (geo != null) {
                            geo = geo.clone();

                            geo.x = parseFloat(xField.value);
                            geo.y = parseFloat(yField.value);
                            geo.width = parseFloat(widthField.value);
                            geo.height = parseFloat(heightField.value);

                            model.setGeometry(cell, geo);
                        }

                        // Applies the style
                        if (style.value.length > 0) {
                            model.setStyle(cell, style.value);
                        }
                        else {
                            model.setStyle(cell, null);
                        }

                        // Creates an undoable change for each attribute and executes it using the model, which will also make the change part of the current transaction
                        for (var i1 = 0; i1 < attrs.length; i1++) {
                            var edit = new CellAttributeChange(cell, attrs[i1].nodeName, texts[i1].value);
                            model.execute(edit);
                        }

                        // Checks if the graph wants cells to be automatically sized and updates the size as an undoable step if the feature is enabled
                        if (this.graph.isAutoSizeCell(cell)) {
                            this.graph.updateCellSize(cell);
                        }
                    }
                    finally {
                        model.endUpdate();
                    }
                };

                // Defines the function to be executed when the Cancel button is pressed in the dialog
                var cancelFunction = () => this.hideProperties();
                form.addButtons(okFunction, cancelFunction);

                return form.table;
            }

            return null;
        }

        /** Hides the properties dialog. */
        public hideProperties() {
            if (this.properties != null) {
                this.properties.destroy();
                this.properties = null;
            }
        }

        /** Shows the tasks window. The tasks window is created using <createTasks>. The default width of the window is 200 pixels, the y-coordinate of the location
         * can be specifies in <tasksTop> and the x-coordinate is right aligned with a 20 pixel offset from the right border. */
        private showTasks() {
            if (this.tasks == null) {
                var div = document.createElement("div");
                div.style.padding = "4px";
                div.style.paddingLeft = "20px";
                var w = document.body.clientWidth;
                var wnd = new Window( Resources.get(this.tasksResource), div, w - 220, this.tasksTop, 200, null);
                wnd.setClosable(true);
                wnd.destroyOnClose = false;

                // Installs a function to update the contents of the tasks window on every change of the model, selection or root.
                var funct = () => {
                    Events.release(div);
                    div.innerHTML = "";
                    this.createTasks(div);
                };

                this.graph.getModel().onChange.add(funct);
                this.graph.getSelectionModel().onSelectionChange.add(funct);
                this.graph.onRootChange.add(funct);

                // Assigns the icon to the tasks window
                if (this.tasksWindowImage != null) {
                    wnd.setImage(this.tasksWindowImage);
                }

                this.tasks = wnd;
                this.createTasks(div);
            }

            this.tasks.setVisible(true);
        }

        /** Updates the contents of the tasks window using <createTasks>. */
        private refreshTasks() {
            if (this.tasks != null) {
                var div = this.tasks.content;
                Events.release(div);
                div.innerHTML = "";
                this.createTasks(div);
            }
        }

        /** Updates the contents of the given DOM node to display the tasks associated with the current
         * editor state. This is invoked whenever there is a possible change of state in the editor.
         * Default implementation is empty. */
        private createTasks(div: HTMLElement) {
            // override
        }

        /** Shows the help window. If the help window does not exist then it is created using an iframe pointing to the resource
         * for the <code>urlHelp</code> key or <urlHelp> if the resource is undefined. */
        private showHelp() {
            if (this.help == null) {
                var frame = document.createElement("iframe");
                frame.setAttribute("src", Resources.get("urlHelp") || this.urlHelp);
                frame.setAttribute("height", "100%");
                frame.setAttribute("width", "100%");
                frame.setAttribute("frameBorder", "0");
                frame.style.backgroundColor = "white";

                var w = document.body.clientWidth;
                var h = (document.body.clientHeight || document.documentElement.clientHeight);

                var wnd = new Window(Resources.get(this.helpResource) || this.helpResource, frame, (w - this.helpWidth) / 2, (h - this.helpHeight) / 3, this.helpWidth, this.helpHeight);
                wnd.setMaximizable(true);
                wnd.setClosable(true);
                wnd.destroyOnClose = false;
                wnd.setResizable(true);

                // Assigns the icon to the help window
                if (this.helpWindowImage != null) {
                    wnd.setImage(this.helpWindowImage);
                }

                // Workaround for ignored iframe height 100% in FF
                if (Client.isNs) {
                    var handler = () => {
                        frame.setAttribute("height", (wnd.div.offsetHeight - 26) + "px");
                    };

                    wnd.onAfterResize.add(handler);
                    wnd.onMaximize.add(handler);
                    wnd.onNormalize.add(handler);
                    wnd.onShow.add(handler);
                }

                this.help = wnd;
            }

            this.help.setVisible(true);
        }

        /** Shows the outline window. If the window does not exist, then it is created using an <mxOutline>. */
        private showOutline() {
            var create = this.outline == null;

            if (create) {
                var div = document.createElement("div");

                div.style.overflow = "hidden";
                div.style.position = "relative";
                div.style.width = "100%";
                div.style.height = "100%";
                div.style.background = "white";
                div.style.cursor = "move";

                if (document.documentMode == 8) {
                    div.style.filter = "progid:DXImageTransform.Microsoft.alpha(opacity=100)";
                }

                var wnd = new Window(Resources.get(this.outlineResource) || this.outlineResource, div, 600, 480, 200, 200, false);

                // Creates the outline in the specified div
                // and links it to the existing graph
                var outline = new Outline(this.graph, div);
                wnd.setClosable(true);
                wnd.setResizable(true);
                wnd.destroyOnClose = false;

                wnd.onAfterResize.add(() => outline.update());

                this.outline = wnd;
                this.outline.outline = outline;
            }

            // Finally shows the outline
            this.outline.setVisible(true);
            this.outline.outline.update(true);
        }

        /** Puts the graph into the specified mode. The following modenames are supported:
         * select - Selects using the left mouse button, new connections are disabled.
         * connect - Selects using the left mouse button or creates new
         * connections if mouse over cell hotspot. See <mxConnectionHandler>.
         * pan - Pans using the left mouse button, new connections are disabled.
         */
        setMode(modename: string) {
            if (modename == "select") {
                this.graph.panningHandler.useLeftButtonForPanning = false;
                this.graph.setConnectable(false);
            } else if (modename == "connect") {
                this.graph.panningHandler.useLeftButtonForPanning = false;
                this.graph.setConnectable(true);
            } else if (modename == "pan") {
                this.graph.panningHandler.useLeftButtonForPanning = true;
                this.graph.setConnectable(false);
            }
        }

        /** Uses <popupHandler> to create the menu in the graph's panning handler. The redirection is setup in <setToolbarContainer>. */
        private createPopupMenu(menu: PopupMenu, cell: Cell, evt: MouseEvent) {
            this.popupHandler.createMenu(this, menu, cell, evt);
        }

        /** Uses <defaultEdge> as the prototype for creating new edges in the connection handler of the graph. 
         * The style of the edge will be overridden with the value returned by <getEdgeStyle>. */
        createEdge(source: Cell, target: Cell) {
            // Clones the defaultedge prototype
            var edge: Cell;

            if (this.defaultEdge != null) {
                var model = this.graph.getModel();
                edge = model.cloneCell(this.defaultEdge);
            }
            else {
                edge = new Cell("");
                edge.setEdge(true);

                var geo = new Geometry();
                geo.relative = true;
                edge.setGeometry(geo);
            }

            // Overrides the edge style
            var style = this.getEdgeStyle();

            if (style != null) {
                edge.setStyle(style);
            }

            return edge;
        }

        /** Returns a string identifying the style of new edges. The function is used in <createEdge> when new edges are created in the graph. */
        private getEdgeStyle() : string {
            return this.defaultEdgeStyle;
        }

        /** Returns the next attribute in <cycleAttributeValues> or null, if not attribute should be used in the specified cell. */
        private consumeCycleAttribute(cell: Cell) {
            return (this.cycleAttributeValues != null &&
                    this.cycleAttributeValues.length > 0 &&
                    this.graph.isSwimlane(cell)) ?
                this.cycleAttributeValues[this.cycleAttributeIndex++ %
                    this.cycleAttributeValues.length] : null;
        }

        /** Uses the returned value from <consumeCycleAttribute> as the value for the <cycleAttributeName> key in the given cell's style. */
        private cycleAttribute(cell: Cell) {
            if (this.cycleAttributeName != null) {
                var value = this.consumeCycleAttribute(cell);

                if (value != null) {
                    cell.setStyle(cell.getStyle() + ";" +
                        this.cycleAttributeName + "=" + value);
                }
            }
        }

        /** Adds the given vertex as a child of parent at the specified x and y coordinate and fires an <addVertex> event. */
        addVertex(parent: Cell, vertex: Cell, x: number, y: number) {
            var model = this.graph.getModel();

            while (parent != null && !this.graph.isValidDropTarget(parent)) {
                parent = model.getParent(parent);
            }

            parent = (parent != null) ? parent : this.graph.getSwimlaneAt(x, y);
            var scale = this.graph.getView().scale;

            var geo = Cells.getGeometry(vertex);
            var pgeo = Cells.getGeometry(parent);

            if (this.graph.isSwimlane(vertex) &&
                !this.graph.swimlaneNesting) {
                parent = null;
            } else if (parent == null && this.swimlaneRequired) {
                return null;
            } else if (parent != null && pgeo != null) {
                // Keeps vertex inside parent
                var state = this.graph.getView().getState(parent);

                if (state != null) {
                    x -= state.origin.x * scale;
                    y -= state.origin.y * scale;

                    if (this.graph.isConstrainedMoving) {
                        var width = geo.width;
                        var height = geo.height;
                        var tmp = state.x + state.width;

                        if (x + width > tmp) {
                            x -= x + width - tmp;
                        }

                        tmp = state.y + state.height;

                        if (y + height > tmp) {
                            y -= y + height - tmp;
                        }
                    }
                } else if (pgeo != null) {
                    x -= pgeo.x * scale;
                    y -= pgeo.y * scale;
                }
            }

            geo = geo.clone();
            geo.x = this.graph.snap(x / scale - this.graph.getView().translate.x - this.graph.gridSize / 2);
            geo.y = this.graph.snap(y / scale - this.graph.getView().translate.y - this.graph.gridSize / 2);
            vertex.setGeometry(geo);

            if (parent == null) {
                parent = this.graph.getDefaultParent();
            }

            this.cycleAttribute(vertex);
            this.onBeforeAddVertex.fire(new AddVertexEvent(vertex, parent));

            model.beginUpdate();
            try {
                vertex = this.graph.addCell(vertex, parent);

                if (vertex != null) {
                    this.graph.constrainChild(vertex);

                    this.onAddVertex.fire(new AddVertexEvent(vertex, parent));
                }
            } finally {
                model.endUpdate();
            }

            if (vertex != null) {
                this.graph.setSelectionCell(vertex);
                this.graph.scrollCellToVisible(vertex);
                this.onAfterAddVertex.fire(new AddVertexEvent(vertex, parent));
            }

            return vertex;
        }

        /** Removes the editor and all its associated resources. This does not normally need to be called, it is called automatically when the window unloads. */
        destroy() {
            if (!this.destroyed) {
                this.destroyed = true;

                if (this.tasks != null) {
                    this.tasks.destroy();
                }

                if (this.outline != null) {
                    this.outline.destroy();
                }

                if (this.properties != null) {
                    this.properties.destroy();
                }

                if (this.keyHandler != null) {
                    this.keyHandler.destroy();
                }

                if (this.rubberband != null) {
                    this.rubberband.destroy();
                }

                if (this.toolbar != null) {
                    this.toolbar.destroy();
                }

                if (this.graph != null) {
                    this.graph.destroy();
                }

                this.status = null;
                this.templates = null;
            }
        }
    }
}
module Five {
    export interface IMouseListener {
        mouseDown(sender: Object, mouseEventContext: MouseEventContext);
        mouseMove(sender: Object, mouseEventContext: MouseEventContext);
        mouseUp(sender: Object, mouseEventContext: MouseEventContext);
    }

    export interface ICellHandler extends IMouseListener {
        reset();
        state: CellState;
        destroy();
        refresh?();
        redraw();
        getTooltipForNode?(node: Node): string;
    }


    export interface IGraphConfig {
        nodeSelection: INodeSelectionConfig;
        selectionHandle: ISelectionHandleConfig;
    }   
     
    export class Graph {

        private eventSource: Element;
        // Holds the mouse event listeners. See <fireMouseEvent>.
        private mouseListeners: IMouseListener[] = null;

        // RenderHint as it was passed to the constructor.
        private renderHint = null;

        // Dialect to be used for drawing the graph. Possible values are all constants in <Constants> with a DIALECT -prefix.
        dialect: Dialect = null;

        // Holds the < GraphModel > that contains the cells to be displayed.
        model: GraphModel = null;

        // An array of<Multiplicity> describing the allowed connections in a graph.
        private multiplicities: Multiplicity[] = null;

        // Holds the list of image bundles.
        private imageBundles: ImageBundle[] = null;

        // Holds the <CellRenderer> for rendering the cells in the graph.
        cellRenderer: CellRenderer = null;

        // Holds the <GraphSelectionModel> that models the current selection.
        private selectionModel: GraphSelectionModel = null;

        view: GraphView = null;

        private graphModelChangeListener: IListener<ModelChangeEvent>;
        private stylesheet: Stylesheet = null;

        tooltipHandler: TooltipHandler;
        selectionCellsHandler: SelectionCellsHandler;
        connectionHandler: ConnectionHandler;
        graphHandler: GraphHandler;
        panningHandler: PanningHandler;
        popupMenuHandler: PopupMenuHandler;
        private collapsedImage: Image = new Image(FileStructure.imageBasePath + '/collapsed.gif', 9, 9);
        private expandedImage: Image = new Image(FileStructure.imageBasePath + '/expanded.gif', 9, 9);
        private destroyed = false;
        allowHandleBoundsCheck = false;

        /** Specifies the image for the image to be used to display a warning overlay. See <setCellWarning>. Default value is Client.imageBasePath + '/warning'.  The extension for the image depends on the platform. 
         * It is '.png' on the Mac and '.gif' on all other platforms. */
        private warningImage = new Image(FileStructure.imageBasePath + '/warning' + ((Client.isMac) ? '.png' : '.gif'), 16, 16);

        /** Specifies the resource key for the warning message to be displayed when a collapsed cell contains validation errors. If the resource for this
         * key does not exist then the value is used as the warning message. Default is 'containsValidationErrors'. */
        private containsValidationErrorsResource = (Client.language != 'none') ? 'containsValidationErrors' : '';

        /** Specifies the minimum scale to be applied in <fit>. Default is 0.1. Set this to null to allow any value. */
        private minFitScale = 0.1;

        /** Specifies the maximum scale to be applied in <fit>. Default is 8. Set this to null to allow any value. */
        private maxFitScale = 8;

        /** Specifies the factor used for <zoomIn> and <zoomOut>. Default is 1.2 (120%). */
        private zoomFactor = 1.2;

        /** Specifies the return value for <canExportCell>. Default is true. */
        private exportEnabled = true;

        /** Specifies the return value for <canImportCell>. Default is true. */
        private importEnabled = true;

        /** Specifies if KeyHandler should invoke <escape> when the escape key is pressed. Default is true. */
        private escapeEnabled = true;

        /** Specifies if the scale and translate should be reset if the root changes in the model. Default is true. */
        private resetViewOnRootChange = true;

        /** Specifies if a child should be constrained inside the parent bounds after a move of the child. Default is true. */
        private constrainChildren = true;

        /** Value returned by <getOverlap> if <isAllowOverlapParent> returns true for the given cell. <getOverlap> is used in <constrainChild> if <isConstrainChild> returns true. 
        The value specifies the portion of the child which is allowed to overlap the parent. */
        private defaultOverlap = 0.5;

        /** Specifies if children should be constrained according to the <constrainChildren> switch if cells are resized. Default is false for backwards compatiblity. */
        private constrainChildrenOnResize = false;

        /** Specifies the area in which all cells in the diagram should be placed. Uses in <getMaximumGraphBounds>. Use a width or height of 0 if you only want to give a upper, left corner. */
        private maximumGraphBounds: Rectangle = null;

        /** Specifies if parents should be extended according to the <extendParents> switch if cells are added. Default is true. */
        private extendParentsOnAdd = true;

        /** Specifies if edge control points should be reset after the resize of a connected cell. Default is false.*/
        private resetEdgesOnResize = false;

        /** Specifies if a parent should contain the child bounds after a resize of the child. Default is true. This has precedence over <constrainChildren>. */
        private extendParents = true;

        /** Specifies if the cell size should be changed to the preferred size when a cell is first collapsed. Default is true. */
        private collapseToPreferredSize = true;

        /** Specifies the return value for <isCellResizable>. Default is true. */
        private _cellsResizable = true;

        /** Specifies if the graph should automatically update the cell size after an edit. This is used in <isAutoSizeCell>. Default is false. */
        private autoSizeCells = false;

        /** Specifies if parents should be extended according to the <extendParents> switch if cells are added. Default is false for backwards compatiblity. */
        private extendParentsOnMove = false;

        /** Specifies if edges should be disconnected from their terminals when they are moved. Default is true. */
        private disconnectOnMove = true;

        /** Specifies if negative coordinates for vertices are allowed. Default is true. */
        private allowNegativeCoordinates = true;

        /** Specifies if edges that are cloned should be validated and only inserted if they are valid. Default is true.*/
        private cloneInvalidEdges = false;

        /** Specifies if edge control points should be reset after the move of a connected cell. Default is false. */
        private resetEdgesOnMove = false;

        /** Specifies if autoSize style should be applied when cells are added. Default is false. */
        autoSizeCellsOnAdd = false;

        /** Specifies if nesting of swimlanes is allowed. Default is true.*/
        swimlaneNesting = true;

        /**Specifies the return value for <isRecursiveResize>. Default is false for backwards compatiblity. */
        private recursiveResize = false;

        /** Specifies the return value for <isCellDisconntable>. Default is true. */
        private cellsDisconnectable = true;

        /** Specifies the return value for <isCellsBendable>. Default is true. */
        private cellsBendable = true;

        /** Specifies if the viewport should automatically contain the selection cells after a zoom operation. Default is false. */
        private keepSelectionVisibleOnZoom = false;

        /** Specifies if the zoom operations should go into the center of the actual diagram rather than going from top, left. Default is true. */
        centerZoom = true;

        /** Specifies the return value for <isDropEnabled>. Default is false. */
        private dropEnabled = false;

        /** Specifies if dropping onto edges should be enabled. This is ignored if <dropEnabled> is false. If enabled, it will call <splitEdge> to carry out the drop operation. Default is true.*/
        private splitEnabled = true;

        /** Specifies the alternate edge style to be used if the main control point on an edge is being doubleclicked. Default is null. */
        alternateEdgeStyle = null;

        /** Specifies the default parent to be used to insert new cells. This is used in <getDefaultParent>. Default is null. */
        private defaultParent: Cell = null;

        /** Specifies if ports are enabled. This is used in <cellConnected> to update the respective style. Default is true. */
        private portsEnabled = true;

        /** Specifies the return value for <isCellCloneable>. Default is true.*/
        private cellsCloneable = true;

        /** Specifies the return value for edges in <isLabelMovable>. Default is true. */
        private edgeLabelsMovable = true;

        /** Specifies the return value for vertices in <isLabelMovable>. Default is false.*/
        private vertexLabelsMovable = false;

        /** Specifies the resource key for the error message to be displayed in non-multigraphs when two vertices are already connected. If the resource for this key does not exist then the value is used as the error message. */
        private alreadyConnectedResource = (Client.language != "none") ? "alreadyConnected" : "";

        /** Specifies if multiple edges in the same direction between the same pair of vertices are allowed. Default is true. */
        private multigraph = true;

        /** Specifies if loops (aka self-references) are allowed. Default is false. */
        private allowLoops = false;

        /** Specifies if swimlanes should be selectable via the content if the mouse is released. Default is true. */
        swimlaneSelectionEnabled = true;

        // Specifies if the grid is enabled.This is used in <snap>. Default is true.
        private gridEnabled = true;

        // Specifies the grid size.Default is 10.
        gridSize = 10;

        container: IDiagramContainer;

        // Holds the CellEditor that is used as the in -place editing.
        public cellEditor: CellEditor = null;

        private backgroundImage: Image;

        // Holds the state of the mouse button.
        isMouseDown = false;

        // Specifies if the background page should be visible. Default is false. Not yet implemented.
        pageVisible = false;

        // Specifies if native double click events should be deteced.Default is false for IE in quirks mode or IE10+, true for all other browsers.
        // The doubleTapTimeout value is used to specify the double click speed.
        nativeDblClickEnabled: boolean = !Client.isQuirks && (!Client.isIe || !Client.isIe10);


        // Specifies if edges should appear in the foreground regardless of their order in the model. 
        // If <keepEdgesInForeground> and <keepEdgesInBackground> are both true then the normal order is applied. Default is false.
        keepEdgesInForeground = false;

        // Specifies if edges should appear in the background regardless of their order in the model. 
        // If <keepEdgesInForeground> and <keepEdgesInBackground> are both true then the normal order is applied. Default is false.
        keepEdgesInBackground = false;

        // Specifies the page format for the background page.Default is Constants.PAGE_FORMAT_A4_PORTRAIT. 
        // This is used as the default in PrintPreview and for painting the background page if <pageVisible> is true and the pagebreaks if <pageBreaksVisible> is true.

        pageFormat: Rectangle = Constants.pageFormatA4Portrait;

        // Specifies the scale of the background page. Default is 1.5.
        pageScale = 1.5;

        // Specifies if a dashed line should be drawn between multiple pages. 
        // If you change this value while a graph is being displayed then you should call < sizeDidChange > to force an update of the display.
        pageBreaksVisible = false;

        // If true, pressing the enter key without pressing control or shift will stop editing and accept the new value. 
        // This is used in CellEditor to stop cell editing. Note: You can always use F2 and escape to stop editing. Default is false.
        enterStopsCellEditing = false;

        // Border to be added to the bottom and right side when the container is being resized after the graph has been changed. Default is 0.
        border = 0;

        // Rectangle that specifies the minimum size of the < container> if <resizeContainer> is true.
        minimumContainerSize: Rectangle = null;

        // Rectangle that specifies the maximum size of the container if <resizeContainer> is true.
        maximumContainerSize: Rectangle = null;

        // Rectangle that specifies the minimum size of the graph.This is ignored if the graph container has no scrollbars.Default is null.
        minimumGraphSize: Rectangle = null;

        // Specifies if the container should be resized to the graph size when the graph size has changed.Default is false.
        resizeContainer = false;

        // Specifies if the graph size should be rounded to the next page number in <sizeDidChange>. This is only used if the graph container has scrollbars.
        preferPageSize = false;

        // Tolerance for a move to be handled as a single click. Default is 4 pixels.
        tolerance = 4;

        enabled: boolean = true;

        /** The attribute used to find the color for the indicator if the indicator color is set to 'swimlane'. Default is <Constants.STYLE_FILLCOLOR>.*/
        swimlaneIndicatorColorAttribute = Constants.styleFillcolor;

        /** Specifies if labels should be visible. This is used in <getLabel>. Default is true. */
        labelsVisible = true;

        /** Specifies the return value for <isHtmlLabel>. Default is false. */
        htmlLabels = false;

        overlays: CellOverlay[];

        /**  If true, when editing is to be stopped by way of selection changing, data in diagram changing or other means stopCellEditing is invoked, and
         * changes are saved. This is implemented in a focus handler in CellEditor. Default is true. */
        invokesStopCellEditing = true;

        /** Specifies if folding (collapse and expand via an image icon in the graph should be enabled). Default is true. */
        foldingEnabled = true;

        /**  Specifies the minimum distance for page breaks to be visible. Default is * 20 (in pixels). */
        minPageBreakDist = 20;

        /** Specifies the color for page breaks. Default is 'gray'. */
        pageBreakColor = "gray";

        /** Specifies the page breaks should be dashed. Default is true. */
        pageBreakDashed = true;

        /** Holds the time of the last touch event for double click detection. */
        lastTouchTime = 0;

        horizontalPageBreaks: PolylineShape[];
        verticalPageBreaks: PolylineShape[];

        /** Current horizontal panning value. Default is 0. */
        panDx = 0;

        /** Current vertical panning value. Default is 0. */
        panDy = 0;

        /** Specifies if double taps on touch-based devices should be handled as a double click. Default is true.*/
        doubleTapEnabled = true;

        /** Specifies the tolerance for double taps and double clicks in quirks mode.Default is 25 pixels. */
        doubleTapTolerance = 25;

        /**Specifies the timeout for double taps and non-native double clicks. Default is 500 ms. */
        doubleTapTimeout = 500;

        /**
         * Specifies if the graph should automatically scroll if the mouse goes near the container edge while dragging. This is only taken into account if the
         * container has scrollbars. Default is true. If you need this to work without scrollbars then set <ignoreScrollbars> to true. 
         */
        autoScroll = true;

        /** Specifies if timer-based autoscrolling should be used via PanningManager. Note that this disables the code in <scrollPointToVisible> and uses code in PanningManager instead. 
        * Note that <autoExtend> is disabled if this is true and that this should only be used with a scroll buffer or when scollbars are visible and scrollable in all directions. Default is false.*/
        private timerAutoScroll = false;

        /** Specifies if the graph should automatically scroll regardless of the scrollbars. */
        private ignoreScrollbars = false;

        /** Specifies if panning via <panGraph> should be allowed to implement autoscroll if no scrollbars are available in <scrollPointToVisible>. Default is false.*/
        private allowAutoPanning = false;

        /** Specifies if scrollbars should be used for panning in <panGraph> if any scrollbars are available. If scrollbars are enabled in CSS, but no
         * scrollbars appear because the graph is smaller than the container size, then no panning occurs if this is true. Default is true.
         */
        useScrollbarsForPanning = true;

        /** Specifies if the size of the graph should be automatically extended if the mouse goes near the container edge while dragging. This is only taken into
         * account if the container has scrollbars. Default is true. See <autoScroll>.
         */
        autoExtend = true;

        /**
         * Specifies if tap and hold should be used for starting connections on touch-based devices. Default is true.
         */
        private tapAndHoldEnabled = true;

        /** Specifies the time for a tap and hold. Default is 500 ms. */
        private tapAndHoldDelay = 500;

        /** True if the timer for tap and hold events is running. */
        private tapAndHoldInProgress = false;

        /**  True as long as the timer is running and the touch events stay within the given <tapAndHoldTolerance>. */
        private tapAndHoldValid = false;

        /** Holds the x-coordinate of the intial touch event for tap and hold. */
        private initialTouchX = 0;

        /** Holds the y-coordinate of the intial touch event for tap and hold. */
        private initialTouchY = 0;

        /** Specifies the return value for <isCellEditable>. Default is true. */
        private cellsEditable = true;

        /** Specifies the return value for <isCellDeletable>. Default is true. */
        private cellsDeletable = true;

        /** Specifies the return value for <isCellMovable>. Default is true. */
        private cellsMovable = true;

        /** Specifies the return value for <isCellLocked>. Default is false. */
        private cellsLocked = false;

        /** Specifies the resource key for the tooltip on the collapse/expand icon. If the resource for this key does not exist then the value is used as the tooltip. */
        private collapseExpandResource = (Client.language != "none") ? "collapse-expand" : "";

        /** Specifies if edges are connectable. Default is false. This overrides the  connectable field in edges. */
        connectableEdges = false;

        /** Specifies if edges with disconnected terminals are allowed in the graph. Default is true. */
        allowDanglingEdges = true;

        /** Specifies if edge control points should be reset after the the edge has been reconnected. Default is true. */
        resetEdgesOnConnect = true;

        cellsSelectable = true;

        fireDoubleClick: boolean;
        lastTouchEvent: MouseEvent;
        lastTouchX: number;
        lastTouchY: number;
        doubleClickCounter = 0;
        lastTouchCell: Cell;
        lastEvent: MouseEvent;
        mouseMoveRedirect: (evt: any) => void;
        mouseUpRedirect: (evt: any) => void;
        ignoreMouseEvents = false;
        isMouseTrigger = false;
        lastMouseX: number;
        lastMouseY: number;
        panningManager: PanningManager;
        tapAndHoldThread: number;
        isConstrainedMoving: boolean;

        onSize = new EventListeners<SizeEvent>();
        onGesture = new EventListeners<GestureEvent>();
        onTapAndHold = new EventListeners<GestureEvent>();
        onPan = new EventListeners<BasicEvent>();
        onClick = new EventListeners<ClickEvent>();
        onDoubleClick = new EventListeners<DoubleClickEvent>();
        onFireMouse = new EventListeners<FireMouseEvent>();
        onAddOverlay = new EventListeners<CellOverlayEvent>();
        onRemoveOverlay = new EventListeners<CellOverlayEvent>();
        onFoldCells = new EventListeners<FoldCellsEvent>();
        onCellsFolded = new EventListeners<FoldCellsEvent>();
        onLabelChanged = new EventListeners<LabelChangedEvent>();
        onConnectCell = new EventListeners<ConnectCellEvent>();
        onCellConnected = new EventListeners<ConnectCellEvent>();
        onStartEditing = new EventListeners<StartEditingEvent>();
        onAddCells = new EventListeners<AddCellsEvent>();
        onCellsAdded = new EventListeners<CellsAddedEvent>();
        onMoveCells = new EventListeners<MoveCellsEvent>();
        onCellsMoved = new EventListeners<CellsMovedEvent>();
        onFlipEdge = new EventListeners<FlipEdgeEvent>();
        onSplitEdge = new EventListeners<SplitEdgeEvent>();
        onResizeCells = new EventListeners<ResizeCellsEvent>();
        onCellsResized = new EventListeners<CellsResizeEvent>();
        onUpdateCellSize = new EventListeners<UpdateCellSizeEvent>();
        onRootChange = new EventListeners<BasicEvent>();
        onEscape = new EventListeners<BasicEvent>();
        onRefresh = new EventListeners<BasicEvent>();
        onRemoveCells = new EventListeners<RemoveCellsEvent>();
        onCellsRemoved = new EventListeners<CellsEvent>();
        onUngroupCells = new EventListeners<CellsEvent>();
        onRemoveCellsFromParent = new EventListeners<CellsEvent>();
        onOrderCells = new EventListeners<OrderCellsEvent>();
        onCellsOrdered = new EventListeners<OrderCellsEvent>();
        onAlignCells = new EventListeners<AlignCellsEvent>();
        onGroupCells = new EventListeners<GroupCellsEvent>();

        constructor(container: HTMLElement, public config: IGraphConfig, model?: GraphModel, renderHint?: RenderingHint, stylesheet?: Stylesheet) {
            // Initializes the variable in case the prototype has been
            // modified to hold some listeners (which is possible because
            // the createHandlers call is executed regardless of the
            // arguments passed into the ctor).
            this.mouseListeners = null;

            // Converts the renderHint into a dialect
            this.renderHint = renderHint;

            if (Client.isSvg) {
                this.dialect = Dialect.Svg;
            } else if (renderHint === RenderingHint.Fastest) {
                this.dialect = Dialect.StrictHtml;
            } else if (renderHint === RenderingHint.Faster) {
                this.dialect = Dialect.PreferHtml;
            } else // default for VML
            {
                this.dialect = Dialect.MixedHtml;
            }

            // Initializes the main members that do not require a container
            this.model = model || new GraphModel(null);
            this.multiplicities = [];
            this.imageBundles = [];
            this.cellRenderer = this.createCellRenderer();
            this.setSelectionModel(this.createSelectionModel());
            this.setStylesheet((stylesheet != null) ? stylesheet : this.createStylesheet());
            this.view = this.createGraphView();

            // Adds a graph model listener to update the view
            this.graphModelChangeListener = (e: ModelChangeEvent) => { this.graphModelChanged(e.changes); };

            this.model.onChange.add(this.graphModelChangeListener);

            // Installs basic event handlers with disabled default settings.
            this.createHandlers();

            // Initializes the display if a container was specified
            if (container != null) {
                this.init(container);
            }

            this.view.revalidate();
        }

        init(container: HTMLElement) {
            /// <summary>Initializes the container and creates the respective datastructures</summary>
            /// <param name="container">DOM node that will contain the graph display</param>
            /// <returns type=""></returns>
            this.container = createDiagramContainer(container);

            // Initializes the in-place editor
            this.cellEditor = this.createCellEditor();

            // Initializes the container using the view
            this.view.init();

            // Updates the size of the container for the current graph
            this.sizeDidChange();

            // Hides tooltips and resets tooltip timer if mouse leaves container
            Events.addListener(container, "mouseleave", Utils.bind(this, () => {
                if (this.tooltipHandler != null) {
                    this.tooltipHandler.hide();
                }
            }));

            // Automatic deallocation of memory
            if (Client.isIe) {
                Events.addListener(window, "unload", Utils.bind(this, () => {
                    this.destroy();
                }));

                // Disable shift-click for text
                Events.addListener(container, "selectstart",
                    Utils.bind(this, (evt) => {
                        return this.isEditing() || (!this.isMouseDown && !Events.isShiftDown(evt as KeyboardEvent));
                    })
                );
            }
        }

        createCellRenderer(): CellRenderer {
            /// <summary> Creates a new CellRenderer to be used in this graph.</summary>
            return new CellRenderer();
        }

        private setSelectionModel(selectionModel): void {
            /// <summary>Sets the SelectionModel that contains the selection.</summary>
            this.selectionModel = selectionModel;
        }

        createSelectionModel() {
            /// <summary> Creates a new GraphSelectionModel to be used in this graph.</summary>
            return new GraphSelectionModel(this);
        }

        setStylesheet(stylesheet: Stylesheet) {
            /// <summary>Sets the Stylesheet that defines the style.</summary>
            this.stylesheet = stylesheet;
        }

        private createStylesheet(): Stylesheet {
            /// <summary>Creates a new GraphSelectionModel to be used in this graph.</summary>
            return new Stylesheet();
        }

        private createGraphView(): GraphView {
            /// <summary>Creates a new GraphView to be used in this graph.</summary>
            return new GraphView(this);
        }

        // Creates the tooltip-, panning-, connection- and graph-handler (in this order).This is called in the constructor before<init> is called.
        private createHandlers(container?: Element): void {
            this.tooltipHandler = new TooltipHandler(this);
            this.tooltipHandler.setEnabled(false);
            this.selectionCellsHandler = new SelectionCellsHandler(this);
            this.connectionHandler = new ConnectionHandler(this);
            this.connectionHandler.setEnabled(false);
            this.graphHandler = new GraphHandler(this);
            this.panningHandler = new PanningHandler(this);
            this.panningHandler.panningEnabled = false;
            this.popupMenuHandler = new PopupMenuHandler(this);
        }

        addMouseListener(listener: IMouseListener) {
            if (this.mouseListeners == null) {
                this.mouseListeners = [];
            }
            this.mouseListeners.push(listener);

        }

        removeMouseListener(listener: IMouseListener) {
            if (this.mouseListeners != null) {
                for (var i = 0; i < this.mouseListeners.length; i++) {
                    if (this.mouseListeners[i] == listener) {
                        this.mouseListeners.splice(i, 1);
                        break;
                    }
                }
            }
        }

        getSelectionModel(): GraphSelectionModel {
            return this.selectionModel;
        }

        getModel(): GraphModel {
            return this.model;
        }

        getView(): GraphView {
            return this.view;
        }

        snap(value: number): number {
            /// <summary>naps the given numeric value to the grid if gridEnabled is true</summary>
            /// <param name="value">Numeric value to be snapped to the grid.</param>
            /// <returns type=""></returns>
            if (this.gridEnabled) {
                value = Math.round(value / this.gridSize) * this.gridSize;
            }

            return value;
        }

        isEnterStopsCellEditing(): boolean {
            return this.enterStopsCellEditing;
        }

        isLabelClipped(cell: Cell) {
            /// <summary>Returns true if the overflow portion of labels should be hidden.If this returns true then vertex labels will be clipped to the size of the vertices. 
            /// This implementation returns true if Constants.STYLE_OVERFLOW in the style of the given cell is 'hidden'.</summary>
            /// <param name="cell" type="">whose label should be clipped</param>
            /// <returns type=""></returns>
            var state = this.view.getState(cell);
            var style = (state != null) ? state.style : this.getCellStyle(cell);

            return (style != null) ? style.overflow === Overflow.hidden : false;
        }

        // This enables wrapping for HTML labels.
        // 
        // Returns true if no white-space CSS style directive should be used for
        // displaying the given cells label. This implementation returns true if
        // <Constants.STYLE_WHITE_SPACE> in the style of the given cell is 'wrap'.
        // 
        // This is used as a workaround for IE ignoring the white-space directive
        // of child elements if the directive appears in a parent element. It
        // should be overridden to return true if a white-space directive is used
        // in the HTML markup that represents the given cells label. In order for
        // HTML markup to work in labels, <isHtmlLabel> must also return true
        // for the given cell.
        // 
        // Example:
        // 
        // (code)
        // graph.getLabel = function(cell)
        // {
        //   var tmp = mxGraph.prototype.getLabel.apply(this, arguments); // "supercall"
        //   
        //   if (this.model.isEdge(cell))
        //   {
        //     tmp = '<div style="width: 150px; white-space:normal;">'+tmp+'</div>';
        //   }
        //   
        //   return tmp;
        // }
        // 
        // graph.isWrapping = function(state)
        // {
        // 	 return this.model.isEdge(state.cell);
        // }
        // (end)
        // 
        // Makes sure no edge label is wider than 150 pixels, otherwise the content
        // is wrapped. Note: No width must be specified for wrapped vertex labels as
        // the vertex defines the width in its geometry.
        // 

        isWrapping(cell: Cell): boolean {
            var state = this.view.getState(cell);
            var style = (state != null) ? state.style : this.getCellStyle(cell);

            return (style != null) ? style.whitespace === Whitespace.wrap : false;
        }

        /* Returns true if the given cell is visible in this graph. This implementation uses<GraphModel.isVisible>.Subclassers can override
         * this to implement specific visibility for cells in only one graph, that is, without affecting the visible state of the cell.
         * When using dynamic filter expressions for cell visibility, then the graph should be revalidated after the filter expression has changed.
         * 
         * Parameters:
         *
         * cell - <mxCell> whose visible state should be returned.
         */
        isCellVisible(cell: Cell): boolean {
            return Cells.isVisible(cell);
        }

        /**
        * Function: getCellStyle
        * 
        * Returns an array of key, value pairs representing the cell style for the
        * given cell. If no string is defined in the model that specifies the
        * style, then the default style for the cell is returned or <EMPTY_ARRAY>,
        * if not style can be found. Note: You should try and get the cell state
        * for the given cell and use the cached style in the state before using
        * this method.
        * 
        * Parameters:
        * 
        * cell - <mxCell> whose style should be returned as an array.
        */
        getCellStyle(cell: Cell): IStyle {

            // Gets the default style for the cell
            var style: IStyle;

            var styleapp = Cells.getStyle(cell);
            // Resolves the stylename using the above as the default
            if (styleapp != null) {
                style = this.postProcessCellStyle(this.stylesheet.getCellStyle(styleapp, cell.isEdge()));
            } else
                style = Cells.isEdge(cell) ? this.stylesheet.getDefaultEdgeStyle() : this.stylesheet.getDefaultVertexStyle();

            return style;
        }

        /**
         * Function: getTranslateForRoot
         * 
         * Returns the translation to be used if the given cell is the root cell as
         * an <mxPoint>. This implementation returns null.
         * 
         * Example:
         * 
         * To keep the children at their absolute position while stepping into groups,
         * this function can be overridden as follows.
         * 
         * (code)
         * var offset = new mxPoint(0, 0);
         * 
         * while (cell != null)
         * {
         *   var geo = this.model.getGeometry(cell);
         * 
         *   if (geo != null)
         *   {
         *     offset.x -= geo.x;
         *     offset.y -= geo.y;
         *   }
         * 
         *   cell = this.model.getParent(cell);
         * }
         * 
         * return offset;
         * (end)
         * 
         * Parameters:
         * 
         * cell - <mxCell> that represents the root.
         */
        getTranslateForRoot(cell: Cell): Point {
            return null;
        }

        /**
         * Function: sizeDidChange
         * 
         * Called when the size of the graph has changed. This implementation fires
         * a <size> event after updating the clipping region of the SVG element in
         * SVG-bases browsers.
         */
        sizeDidChange() {
            var bounds = this.getGraphBounds();

            if (this.container != null) {
                var border = this.getBorder();

                var width = Math.max(0, bounds.x + bounds.width + 1 + border);
                var height = Math.max(0, bounds.y + bounds.height + 1 + border);

                if (this.minimumContainerSize != null) {
                    width = Math.max(width, this.minimumContainerSize.width);
                    height = Math.max(height, this.minimumContainerSize.height);
                }

                if (this.resizeContainer) {
                    this.doResizeContainer(width, height);
                }

                if (this.preferPageSize || (!Client.isIe && this.pageVisible)) {
                    var size = this.getPreferredPageSize(bounds, width, height);

                    if (size != null) {
                        width = size.width;
                        height = size.height;
                    }
                }

                if (this.minimumGraphSize != null) {
                    width = Math.max(width, this.minimumGraphSize.width * this.view.scale);
                    height = Math.max(height, this.minimumGraphSize.height * this.view.scale);
                }

                width = Math.ceil(width - 1);
                height = Math.ceil(height - 1);

                if (this.dialect == Dialect.Svg) {
                    var root = (<SVGElement>this.view.getDrawPane()).ownerSVGElement;

                    root.style.minWidth = Math.max(1, width) + "px";
                    root.style.minHeight = Math.max(1, height) + "px";
                    root.style.width = "100%";
                    root.style.height = "100%";
                } else {
                    if (Client.isQuirks) {
                        // Quirks mode has no minWidth/minHeight support
                        this.view.updateHtmlCanvasSize(Math.max(1, width), Math.max(1, height));
                    } else {
                        var style = this.canvasStyle();
                        style.minWidth = Math.max(1, width) + "px";
                        style.minHeight = Math.max(1, height) + "px";
                    }
                }

                this.updatePageBreaks(this.pageBreaksVisible, width - 1, height - 1);
            }
            this.onSize.fire(new SizeEvent(bounds));
        }

        private canvasStyle(): CSSStyleDeclaration {
            return (<CSSStyleDeclaration>(<any>this.view.canvas).style);
        }

        getBackgroundImage(): Image {
            return this.backgroundImage;
        }

        /**
         * Function: isCellCollapsed
         * 
         * Returns true if the given cell is collapsed in this graph. This
         * implementation uses <mxGraphModel.isCollapsed>. Subclassers can override
         * this to implement specific collapsed states for cells in only one graph,
         * that is, without affecting the collapsed state of the cell.
         * 
         * When using dynamic filter expressions for the collapsed state, then the
         * graph should be revalidated after the filter expression has changed.
         * 
         * Parameters:
         * 
         * cell - <mxCell> whose collapsed state should be returned.
         */
        isCellCollapsed(cell: Cell): boolean {
            return Cells.isCollapsed(cell);
        }

        /**
        * Returns the offset to be used for the cells inside the given cell. The
        * root and layer cells may be identified using <mxGraphModel.isRoot> and
        * <mxGraphModel.isLayer>. For all other current roots, the
        * <mxGraphView.currentRoot> field points to the respective cell, so that
        * the following holds: cell == this.view.currentRoot. This implementation
        * returns null.
        * 
        * Parameters:
        * 
        * cell - <mxCell> whose offset should be returned.
        */
        getChildOffsetForCell(cell: Cell): Point {
            return null;
        }

        /**
         * Function: getCellGeometry
         * 
         * Returns the <mxGeometry> for the given cell. This implementation uses
         * <mxGraphModel.getGeometry>. Subclasses can override this to implement
         * specific geometries for cells in only one graph, that is, it can return
         * geometries that depend on the current state of the view.
         * 
         * Parameters:
         * 
         * cell - <mxCell> whose geometry should be returned.
         */
        getCellGeometry(cell: Cell): Geometry {
            return Cells.getGeometry(cell);
        }

        /**
         * Returns an <mxConnectionConstraint> that describes the given connection
         * point. This result can then be passed to <getConnectionPoint>.
         * 
         * Parameters:
         * 
         * edge - <mxCellState> that represents the edge.
         * terminal - <mxCellState> that represents the terminal.
         * source - Boolean indicating if the terminal is the source or target.
         */
        getConnectionConstraint(edge: CellState, terminal: CellState, source: boolean): ConnectionConstraint {
            var point: Point = null;
            var x = source ? edge.style.exitX : edge.style.entryX;

            if (x != null) {
                var y = (source) ? edge.style.exitY : edge.style.entryY;

                if (y != null) {
                    point = new Point(x, y);
                }
            }

            var perimeter: boolean = false;

            if (point != null) {
                perimeter = (source) ? edge.style.exitPerimeter : edge.style.entryPerimeter;
            }

            return new ConnectionConstraint(point, perimeter);
        }

        /**
         * Function: getConnectionPoint
         *
         * Returns the nearest point in the list of absolute points or the center
         * of the opposite terminal.
         * 
         * Parameters:
         * 
         * vertex - <mxCellState> that represents the vertex.
         * constraint - <mxConnectionConstraint> that represents the connection point
         * constraint as returned by <getConnectionConstraint>.
         */
        getConnectionPoint(vertex: CellState, constraint: ConnectionConstraint): Point {
            var point = null;

            if (vertex != null) {
                var bounds = this.view.getPerimeterBounds(vertex);
                var cx = new Point(bounds.getCenterX(), bounds.getCenterY());

                var direction = vertex.style.direction;
                var r1 = 0;

                // Bounds need to be rotated by 90 degrees for further computation
                if (direction != null) {
                    if (direction == Direction.North) {
                        r1 += 270;
                    } else if (direction == Direction.West) {
                        r1 += 180;
                    } else if (direction == Direction.South) {
                        r1 += 90;
                    }

                    // Bounds need to be rotated by 90 degrees for further computation
                    if (direction == Direction.North || direction == Direction.South) {
                        bounds.x += bounds.width / 2 - bounds.height / 2;
                        bounds.y += bounds.height / 2 - bounds.width / 2;
                        var tmp: number = bounds.width;
                        bounds.width = bounds.height;
                        bounds.height = tmp;
                    }
                }

                if (constraint.point != null) {
                    var sx = 1;
                    var sy = 1;
                    var dx = 0;
                    var dy = 0;

                    // LATER: Add flipping support for image shapes
                    if (Cells.isVertex(vertex.cell)) {
                        var flipH = vertex.style.flipH;
                        var flipV = vertex.style.flipV;

                        if (direction == Direction.North || direction == Direction.South) {
                            var tmp1 = flipH;
                            flipH = flipV;
                            flipV = tmp1;
                        }

                        if (flipH) {
                            sx = -1;
                            dx = -bounds.width;
                        }

                        if (flipV) {
                            sy = -1;
                            dy = -bounds.height;
                        }
                    }

                    point = new Point(bounds.x + constraint.point.x * bounds.width * sx - dx,
                        bounds.y + constraint.point.y * bounds.height * sy - dy);
                }

                // Rotation for direction before projection on perimeter
                var r2 = vertex.style.rotation;
                var cos: number;
                var sin: number;
                if (constraint.perimeter) {
                    if (r1 != 0 && point != null) {
                        // Only 90 degrees steps possible here so no trig needed
                        cos = 0;
                        sin = 0;
                        if (r1 == 90) {
                            sin = 1;
                        } else if (r1 == 180) {
                            cos = -1;
                        }
                        // This really is r2, not r1
                        else if (r2 == 270) {
                            sin = -1;
                        }

                        point = Utils.getRotatedPoint(point, cos, sin, cx);
                    }

                    if (point != null && constraint.perimeter) {
                        point = this.view.getPerimeterPoint(vertex, point, false);
                    }
                } else {
                    r2 += r1;
                }

                // Generic rotation after projection on perimeter
                if (r2 != 0 && point != null) {
                    var rad = Utils.toRadians(r2);
                    cos = Math.cos(rad);
                    sin = Math.sin(rad);
                    point = Utils.getRotatedPoint(point, cos, sin, cx);
                }
            }

            return point;
        }

        createCellEditor(): CellEditor {
            return new CellEditor(this);
        }

        postProcessCellStyle(style: IStyle): IStyle {
            /// <summary>Tries to resolve the value for the image style in the image bundles and turns short data URIs as defined in ImageBundle to data URIs as defined in RFC 2397 of the IETF. </summary>
            if (style != null) {
                var key = style.image;
                var image = this.getImageFromBundles(key);

                if (image != null) {
                    style.image = image;
                } else {
                    image = key;
                }

                // Converts short data uris to normal data uris
                if (image != null && image.substring(0, 11) == "data:image/") {
                    if (image.substring(0, 20) == "data:image/svg+xml,<") {
                        // Required for FF and IE11
                        image = image.substring(0, 19) + encodeURIComponent(image.substring(19));
                    } else if (image.substring(0, 22) != "data:image/svg+xml,%3C") {
                        var comma = image.indexOf(",");

                        if (comma > 0) {
                            image = image.substring(0, comma) + ";base64,"
                                + image.substring(comma + 1);
                        }
                    }

                    style.image = image;
                }
            }

            return style;

        }

        getGraphBounds(): Rectangle {
            return this.view.getGraphBounds();
        }

        getBorder(): number {
            return this.border;
        }

        doResizeContainer(width: number, height: number) {
            // Fixes container size for different box models
            if (Client.isIe) {
                if (Client.isQuirks) {
                    var borders = this.container.getBorderSizes();

                    // max(2, ...) required for native IE8 in quirks mode
                    width += Math.max(2, borders.x + borders.width + 1);
                    height += Math.max(2, borders.y + borders.height + 1);
                } else if (Client.isIe9) {
                    width += 3;
                    height += 5;
                } else {
                    width += 1;
                    height += 1;
                }
            } else {
                height += 1;
            }

            if (this.maximumContainerSize != null) {
                width = Math.min(this.maximumContainerSize.width, width);
                height = Math.min(this.maximumContainerSize.height, height);
            }

            this.container.setSize(width, height);
        }


        getPreferredPageSize(bounds: Rectangle, width: number, height: number) {
            /// <summary>Returns the preferred size of the background page if preferPageSize is true.</summary>            
            var scale = this.view.scale;
            var tr = this.view.translate;
            var fmt = this.pageFormat;
            var ps = scale * this.pageScale;
            var page = new Rectangle(0, 0, fmt.width * ps, fmt.height * ps);

            var hCount = (this.pageBreaksVisible) ? Math.ceil(width / page.width) : 1;
            var vCount = (this.pageBreaksVisible) ? Math.ceil(height / page.height) : 1;

            return new Rectangle(0, 0, hCount * page.width + 2 + tr.x / scale, vCount * page.height + 2 + tr.y / scale);
        }

        updatePageBreaks(visible: boolean, width: number, height: number) {
            /// <summary>Invokes from sizeDidChange to redraw the page breaks. </summary>
            /// <param name="visible">Boolean that specifies if page breaks should be shown.</param>
            /// <param name="width">Specifies the width of the container in pixels.</param>
            /// <param name="height">Specifies the height of the container in pixels.</param>
            var scale = this.view.scale;
            var tr = this.view.translate;
            var fmt = this.pageFormat;
            var ps = scale * this.pageScale;
            var bounds = new Rectangle(scale * tr.x, scale * tr.y, fmt.width * ps, fmt.height * ps);

            // Does not show page breaks if the scale is too small
            visible = visible && Math.min(bounds.width, bounds.height) > this.minPageBreakDist;

            // Draws page breaks independent of translate. To ignore
            // the translate set bounds.x/y = 0. Note that modulo
            // in JavaScript has a bug, so use Utils instead.
            bounds.x = Utils.mod(bounds.x, bounds.width);
            bounds.y = Utils.mod(bounds.y, bounds.height);

            var horizontalCount = (visible) ? Math.ceil((width - bounds.x) / bounds.width) : 0;
            var verticalCount = (visible) ? Math.ceil((height - bounds.y) / bounds.height) : 0;
            var right = width;
            var bottom = height;

            if (this.horizontalPageBreaks == null && horizontalCount > 0) {
                this.horizontalPageBreaks = [];
            }
            var pageBreak: PolylineShape;
            var i: number;
            var pts: Point[];
            if (this.horizontalPageBreaks != null) {
                for (i = 0; i <= horizontalCount; i++) {
                    pts = [
                        new Point(bounds.x + i * bounds.width, 1),
                        new Point(bounds.x + i * bounds.width, bottom)
                    ];
                    if (this.horizontalPageBreaks[i] != null) {
                        this.horizontalPageBreaks[i].points = pts;
                        this.horizontalPageBreaks[i].redraw();
                    } else {
                        pageBreak = new PolylineShape(pts, this.pageBreakColor);
                        pageBreak.dialect = this.dialect;
                        pageBreak.pointerEvents = false;
                        pageBreak.isDashed = this.pageBreakDashed;
                        pageBreak.init(ElementInitializer(this.view.backgroundPane));
                        pageBreak.redraw();

                        this.horizontalPageBreaks[i] = pageBreak;
                    }
                }

                for (i = horizontalCount; i < this.horizontalPageBreaks.length; i++) {
                    this.horizontalPageBreaks[i].destroy();
                }

                this.horizontalPageBreaks.splice(horizontalCount, this.horizontalPageBreaks.length - horizontalCount);
            }

            if (this.verticalPageBreaks == null && verticalCount > 0) {
                this.verticalPageBreaks = [];
            }

            if (this.verticalPageBreaks != null) {
                for (i = 0; i <= verticalCount; i++) {
                    pts = [
                        new Point(1, bounds.y + i * bounds.height),
                        new Point(right, bounds.y + i * bounds.height)
                    ];
                    if (this.verticalPageBreaks[i] != null) {
                        this.verticalPageBreaks[i].points = pts;
                        this.verticalPageBreaks[i].redraw();
                    } else {
                        pageBreak = new PolylineShape(pts, this.pageBreakColor);
                        pageBreak.dialect = this.dialect;
                        pageBreak.pointerEvents = false;
                        pageBreak.isDashed = this.pageBreakDashed;
                        pageBreak.init(ElementInitializer(this.view.backgroundPane));
                        pageBreak.redraw();

                        this.verticalPageBreaks[i] = pageBreak;
                    }
                }

                for (i = verticalCount; i < this.verticalPageBreaks.length; i++) {
                    this.verticalPageBreaks[i].destroy();
                }

                this.verticalPageBreaks.splice(verticalCount, this.verticalPageBreaks.length - verticalCount);
            }
        }

        /** Returns true if perimeter points should be computed such that theresulting edge has only horizontal or vertical segments. */
        isOrthogonal(edge: CellState): boolean {
            var orthogonal = edge.style.orthogonal;

            if (orthogonal != null) {
                return orthogonal;
            }

            var tmp = this.view.getEdgeStyle(edge);

            return tmp == EdgeStyle.segmentConnector ||
                tmp == EdgeStyle.elbowConnector ||
                tmp == EdgeStyle.sideToSide ||
                tmp == EdgeStyle.topToBottom ||
                tmp == EdgeStyle.entityRelation ||
                tmp == EdgeStyle.orthConnector;
        }

        /**
         * Dispatches a <Events.GESTURE> event. The following example will resize the
         * cell under the mouse based on the scale property of the native touch event.
         * 
         * (code)
         * graph.addListener(Events.GESTURE, function(sender, eo)
         * {
         *   var evt = eo.getProperty('event');
         *   var state = graph.view.getState(eo.getProperty('cell'));
         *   
         *   if (graph.isEnabled() && graph.isCellResizable(state.cell) && Math.abs(1 - evt.scale) > 0.2)
         *   {
         *     var scale = graph.view.scale;
         *     var tr = graph.view.translate;
         *     
         *     var w = state.width * evt.scale;
         *     var h = state.height * evt.scale;
         *     var x = state.x - (w - state.width) / 2;
         *     var y = state.y - (h - state.height) / 2;
         *     
         *     var bounds = new mxRectangle(graph.snap(x / scale) - tr.x,
         *     		graph.snap(y / scale) - tr.y, graph.snap(w / scale), graph.snap(h / scale));
         *     graph.resizeCell(state.cell, bounds);
         *     eo.consume();
         *   }
         * });
         * (end)
         * 
         * Parameters:
         * 
         * evt - Gestureend event that represents the gesture.
         * cell - Optional <mxCell> associated with the gesture.
         */
        fireGestureEvent(evt: MouseEvent, cell?: Cell) {
            // Resets double tap event handling when gestures take place
            this.lastTouchTime = 0;
            this.onGesture.fire(new GestureEvent(evt, cell));
        }


        /** Returns the state for the given touch event. */
        private getStateForTouchEvent(evt: MouseEvent): CellState {
            var x = Events.getClientX(evt);
            var y = Events.getClientY(evt);

            // Dispatches the drop event to the graph which consumes and executes the source function
            var pt = this.container.convertPoint(x, y);

            return this.view.getState(this.getCellAt(pt.x, pt.y));
        }

/**
         * Returns true if the event should be ignored in <fireMouseEvent>. This implementation returns true for select, option and input (if not of type
         * checkbox, radio, button, submit or file) event sources if the event is not a mouse event or a left mouse button press event.
         * evtName - The name of the event.
         * me - <mxMouseEvent> that should be ignored.
         */
        private isEventSourceIgnored(evtName: string, me: MouseEventContext): boolean {
            var source = me.getSource();
            var name = (source.nodeName != null) ? source.nodeName.toLowerCase() : "";
            var candidate = !Events.isMouseEvent(me.getEvent()) || Events.isLeftMouseButton(me.getEvent());

            var type = (<any>source).type;
            return evtName == Events.mouseDown && candidate && (name == "select" || name == "option" ||
            (name == "input" && type != "checkbox" && type != "radio" &&
                type != "button" && type != "submit" && type != "file"));
        }

        /**
         * Sets the graphX and graphY properties if the given <mxMouseEvent> if
         * required and returned the event.
         */
        private updateMouseEvent(me: MouseEventContext): MouseEventContext {
            if (me.graphX == null || me.graphY == null) {
                var pt = this.container.convertPoint(me.getX(), me.getY());

                me.graphX = pt.x - this.panDx;
                me.graphY = pt.y - this.panDy;
            }

            return me;
        }


        /** Hook for ignoring synthetic mouse events after touchend in Firefox. */
        private isSyntheticEventIgnored(evtName: string, me: MouseEventContext, sender): boolean {
            var result = false;
            var mouseEvent = Events.isMouseEvent(me.getEvent());

            // LATER: This does not cover all possible cases that can go wrong in FF
            if (this.ignoreMouseEvents && mouseEvent && evtName != Events.mouseMove) {
                this.ignoreMouseEvents = evtName != Events.mouseUp;
                result = true;
            } else if (Client.isFf && !mouseEvent && evtName == Events.mouseUp) {
                this.ignoreMouseEvents = true;
            }

            return result;
        }

        /** Returns true if the event should be ignored in <fireMouseEvent>. */
        private isEventIgnored(evtName: string, me: MouseEventContext, sender) {
            var mouseEvent = Events.isMouseEvent(me.getEvent());
            var result = this.isEditing();

            // Drops events that are fired more than once
            if (me.getEvent() == this.lastEvent) {
                result = true;
            } else {
                this.lastEvent = me.getEvent();
            }

            // Installs event listeners to capture the complete gesture from the event source
            // for non-MS touch events as a workaround for all events for the same geture being
            // fired from the event source even if that was removed from the DOM.
            if (this.eventSource != null && evtName != Events.mouseMove) {
                Events.removeGestureListeners(this.eventSource, null, this.mouseMoveRedirect, this.mouseUpRedirect);
                this.mouseMoveRedirect = null;
                this.mouseUpRedirect = null;
                this.eventSource = null;
            } else if (this.eventSource != null && me.getSource() != this.eventSource) {
                result = true;
            } else if (Client.isTouch && evtName == Events.mouseDown && !mouseEvent) {
                this.eventSource = me.getSource();

                this.mouseMoveRedirect = Utils.bind(this, evt => {
                    this.fireMouseEvent(Events.mouseMove, new MouseEventContext(evt, this.getStateForTouchEvent(evt)));
                });
                this.mouseUpRedirect = Utils.bind(this, evt => {
                    this.fireMouseEvent(Events.mouseUp, new MouseEventContext(evt, this.getStateForTouchEvent(evt)));
                });

                Events.addGestureListeners(this.eventSource, null, this.mouseMoveRedirect, this.mouseUpRedirect);
            }

            // Factored out the workarounds for FF to make it easier to override/remove
            // Note this method has side-effects!
            if (this.isSyntheticEventIgnored(evtName, me, sender)) {
                result = true;
            }

            // Never fires mouseUp/-Down for double clicks
            if (!Events.isPopupTrigger(this.lastEvent) && evtName != Events.mouseMove && this.lastEvent.detail == 2) {
                return true;
            }

            // Filters out of sequence events or mixed event types during a gesture
            if (evtName == Events.mouseUp && this.isMouseDown) {
                this.isMouseDown = false;
            } else if (evtName == Events.mouseDown && !this.isMouseDown) {
                this.isMouseDown = true;
                this.isMouseTrigger = mouseEvent;
            }
            // Drops mouse events that are fired during touch gestures as a workaround for Webkit
            // and mouse events that are not in sync with the current internal button state
            else if (!result && (((!Client.isFf || evtName != Events.mouseMove) &&
                this.isMouseDown && this.isMouseTrigger != mouseEvent) ||
            (evtName == Events.mouseDown && this.isMouseDown) ||
            (evtName == Events.mouseUp && !this.isMouseDown))) {
                result = true;
            }

            if (!result && evtName == Events.mouseDown) {
                this.lastMouseX = me.getX();
                this.lastMouseY = me.getY();
            }

            return result;
        }


        /**
         * Function: createPanningManager
         * 
         * Creates and returns an <mxPanningManager>.
         */
        private createPanningManager(): PanningManager {
            return new PanningManager(this);
        }

        /**
         * Shifts the graph display by the given amount. This is used to preview panning operations, use GraphView.setTranslate to set a persistent
         * translation of the view. Fires <mxEvent.PAN>.
         * dx - Amount to shift the graph along the x-axis.
         * dy - Amount to shift the graph along the y-axis.
         */
        panGraph(dx: number, dy: number) {
            if (this.useScrollbarsForPanning && this.container.hasScrollbars()) {
                this.container.setScroll(-dx, -dy);
            } else {
                var canvas = this.view.getCanvas();

                if (this.dialect === Dialect.Svg) {
                    // Puts everything inside the container in a DIV so that it
                    // can be moved without changing the state of the container
                    if (dx === 0 && dy === 0) {
                        // Workaround for ignored removeAttribute on SVG element in IE9 standards
                        if (Client.isIe) {
                            canvas.setAttribute("transform", "translate(" + dx + "," + dy + ")");
                        } else {
                            canvas.removeAttribute("transform");
                        }

                        this.container.leftPreview(canvas.parentNode);
                    } else {
                        canvas.setAttribute("transform", "translate(" + dx + "," + dy + ")");
                        this.container.rightPreview(canvas.parentNode, dx, dy);
                    }
                } else {
                    var canvasStyle = this.canvasStyle();
                    canvasStyle.left = dx + "px";
                    canvasStyle.top = dy + "px";
                }

                this.panDx = dx;
                this.panDy = dy;

                this.onPan.fire();
            }
        }

        /** Scrolls the graph to the given point, extending the graph container if specified.*/
        scrollPointToVisible(x: number, y: number, extend: boolean, border: number = 20) {
            if (!this.timerAutoScroll && (this.ignoreScrollbars || this.container.hasScrollbars())) {
                var c = this.container;
                var scroll = c.getScroll();
                var client = c.getClientSize();
                if (x >= scroll.x && y >= scroll.y && x <= scroll.x + client.x &&
                    y <= scroll.y + client.y) {
                    var dx = scroll.x + client.x - x;
                    var root: SVGSVGElement;
                    var canvas: Element;
                    var old: number;
                    if (dx < border) {
                        old = scroll.x;
                        scroll.x += border - dx;

                        // Automatically extends the canvas size to the bottom, right
                        // if the event is outside of the canvas and the edge of the
                        // canvas has been reached. Notes: Needs fix for IE.
                        if (extend && old == scroll.x) {
                            var width: number;
                            if (this.dialect == Dialect.Svg) {
                                root = (<SVGElement>this.view.getDrawPane()).ownerSVGElement;
                                width = scroll.width + border - dx; 
                                // Updates the clipping region. This is an expensive operation that should not be executed too often.
                                root.style.width = width + "px";
                            } else {
                                width = Math.max(client.x, scroll.width) + border - dx;
                                canvas = this.view.getCanvas();
                                (<HTMLElement>canvas).style.width = width + "px";
                            }

                            scroll.x += border - dx;
                        }
                    } else {
                        dx = x - scroll.x;

                        if (dx < border) {
                            scroll.x -= border - dx;
                        }
                    }

                    var dy = scroll.y+ client.y - y;

                    if (dy < border) {
                        old = scroll.y;
                        scroll.y += border - dy;

                        if (old == scroll.y && extend) {
                            var height: number;
                            if (this.dialect == Dialect.Svg) {
                                root = (<SVGElement>this.view.getDrawPane()).ownerSVGElement;
                                height = scroll.height + border - dy; // Updates the clipping region. This is an expensive
                                // operation that should not be executed too often.
                                root.style.height = height + "px";
                            } else {
                                height = Math.max(client.x, scroll.height) + border - dy;
                                canvas = this.view.getCanvas();
                                (<HTMLElement>canvas).style.height = height + "px";
                            }

                            scroll.y += border - dy;
                        }
                    } else {
                        dy = y - scroll.y;

                        if (dy < border) {
                            scroll.y -= border - dy;
                        }
                    }
                }
                c.setScroll(scroll.x, scroll.y);
            } else if (this.allowAutoPanning && !this.panningHandler.isActive()) {
                if (this.panningManager == null) {
                    this.panningManager = this.createPanningManager();
                }

                this.panningManager.panTo(x + this.panDx, y + this.panDy);
            }
        }

        /** Destroys the graph and all its resources. */
        private consumeMouseEvent(evtName: string, me: MouseEventContext, sender) {
            // Workaround for duplicate click in Windows 8 with Chrome/FF/Opera with touch
            if (evtName == Events.mouseDown && Events.isTouchEvent(me.getEvent())) {
                me.consume(false);
            }
        }


        /**
         * Returns true if the given event is a toggle event. This implementation returns true if the meta key (Cmd) is pressed on Macs or if control is
         * pressed on any other platform.
         */
        private isToggleEvent(evt: MouseEvent): boolean {
            return (Client.isMac) ? Events.isMouseMetaDown(evt) : Events.isMouseControlDown(evt);
        }

        /**
         * Selects the given cell by either adding it to the selection or replacing the selection depending on whether the given mouse event is a toggle event.
         * cell - <mxCell> to be selected.
         * evt - Optional mouseevent that triggered the selection.
         */
        selectCellForEvent(cell: Cell, evt?: MouseEvent) {
            var isSelected = this.isCellSelected(cell);

            if (this.isToggleEvent(evt)) {
                if (isSelected) {
                    this.removeSelectionCell(cell);
                } else {
                    this.addSelectionCell(cell);
                }
            } else if (!isSelected || this.getSelectionCount() != 1) {
                this.setSelectionCell(cell);
            }
        }


        /**
         * Processes a singleclick on an optional cell and fires a <click> event. The click event is fired initially. If the graph is enabled and the
         * event has not been consumed, then the cell is selected using <selectCellForEvent> or the selection is cleared using
         * <clearSelection>. The events consumed state is set to true if the corresponding <mxMouseEvent> has been consumed.
         *
         * To handle a click event, use the following code.
         * 
         * (code)
         * graph.addListener(mxEvent.CLICK, function(sender, evt)
         * {
         *   var e = evt.getProperty('event'); // mouse event
         *   var cell = evt.getProperty('cell'); // cell may be null
         *   
         *   if (cell != null)
         *   {
         *     // Do something useful with cell and consume the event
         *     evt.consume();
         *   }
         * });
         * (end)
         */
        private click(me: MouseEventContext) {
            var evt = me.getEvent();
            var cell = me.getCell();
            var mxe = new ClickEvent(evt, cell);

            if (me.isConsumed()) {
                mxe.consume();
            }

            this.onClick.fire(mxe);

            // Handles the event if it has not been consumed
            if (this.isEnabled() && !Events.isConsumed(evt) && !mxe.isConsumed()) {
                if (cell != null) {
                    this.selectCellForEvent(cell, evt);
                } else {
                    var swimlane = null;

                    if (this.isSwimlaneSelectionEnabled()) {
                        // Gets the swimlane at the location (includes
                        // content area of swimlanes)
                        swimlane = this.getSwimlaneAt(me.getGraphX(), me.getGraphY());
                    }

                    // Selects the swimlane and consumes the event
                    if (swimlane != null) {
                        this.selectCellForEvent(swimlane, evt);
                    }
                    // Ignores the event if the control key is pressed
                    else if (!this.isToggleEvent(evt)) {
                        this.clearSelection();
                    }
                }
            }
        }

        /**
         * Dispatches the given event in the graph event dispatch loop. Possibleevent names are <Events.MOUSE_DOWN>, <Events.MOUSE_MOVE> and<Events.MOUSE_UP>. 
         * All listeners are invoked for all events regardless of the consumed state of the event.
         * evtName - String that specifies the type of event to be dispatched.
         * me - <mxMouseEvent> to be fired.
         * sender - Optional sender argument. Default is this.
         */
        fireMouseEvent(evtName: string, me: MouseEventContext, sender?: Object) {
            if (this.isEventSourceIgnored(evtName, me)) {
                if (this.tooltipHandler != null) {
                    this.tooltipHandler.hide();
                }

                return;
            }

            if (sender == null) {
                sender = this;
            }

            // Updates the graph coordinates in the event
            me = this.updateMouseEvent(me);

            // Stops editing for all events other than from cellEditor
            if (evtName == Events.mouseDown && this.isEditing() && !this.cellEditor.isEventSource(me.getEvent())) {
                this.stopEditing(!this.isInvokesStopCellEditing());
            }

            // Detects and processes double taps for touch-based devices which do not have native double click events
            // or where detection of double click is not always possible (quirks, IE10+). Note that this can only handle
            // double clicks on cells because the sequence of events in IE prevents detection on the background, it fires
            // two mouse ups, one of which without a cell but no mousedown for the second click which means we cannot
            // detect which mouseup(s) are part of the first click, ie we do not know when the first click ends.
            if ((!this.nativeDblClickEnabled && !Events.isPopupTrigger(me.getEvent())) || (this.doubleTapEnabled &&
                Client.isTouch && Events.isTouchEvent(me.getEvent()))) {
                var currentTime = new Date().getTime();

                // NOTE: Second mouseDown for double click missing in quirks mode
                var cell: Cell;
                if ((!Client.isQuirks && evtName == Events.mouseDown) || (Client.isQuirks && evtName == Events.mouseUp && !this.fireDoubleClick)) {
                    if (this.lastTouchEvent != null && this.lastTouchEvent != me.getEvent() &&
                        currentTime - this.lastTouchTime < this.doubleTapTimeout &&
                        Math.abs(this.lastTouchX - me.getX()) < this.doubleTapTolerance &&
                        Math.abs(this.lastTouchY - me.getY()) < this.doubleTapTolerance &&
                        this.doubleClickCounter < 2) {
                        this.doubleClickCounter++;
                        var doubleClickFired = false;

                        if (evtName == Events.mouseUp) {
                            if (me.getCell() == this.lastTouchCell && this.lastTouchCell != null) {
                                this.lastTouchTime = 0;
                                cell = this.lastTouchCell;
                                this.lastTouchCell = null;

                                this.dblClick(me.getEvent(), cell);
                                doubleClickFired = true;
                            }
                        } else {
                            this.fireDoubleClick = true;
                            this.lastTouchTime = 0;
                        }

                        // Do not ignore mouse up in quirks in this case
                        if (!Client.isQuirks || doubleClickFired) {
                            Events.consume(me.getEvent());
                            return;
                        }
                    } else if (this.lastTouchEvent == null || this.lastTouchEvent != me.getEvent()) {
                        this.lastTouchCell = me.getCell();
                        this.lastTouchX = me.getX();
                        this.lastTouchY = me.getY();
                        this.lastTouchTime = currentTime;
                        this.lastTouchEvent = me.getEvent();
                        this.doubleClickCounter = 0;
                    }
                } else if ((this.isMouseDown || evtName == Events.mouseUp) && this.fireDoubleClick) {
                    this.fireDoubleClick = false;
                    cell = this.lastTouchCell;
                    this.lastTouchCell = null;
                    this.isMouseDown = false;

                    // Workaround for Chrome/Safari not firing native double click events for double touch on background
                    var valid = (cell != null) || (Events.isTouchEvent(me.getEvent()) && (Client.isGc || Client.isSf));

                    if (valid && Math.abs(this.lastTouchX - me.getX()) < this.doubleTapTolerance &&
                        Math.abs(this.lastTouchY - me.getY()) < this.doubleTapTolerance) {
                        this.dblClick(me.getEvent(), cell);
                    } else {
                        Events.consume(me.getEvent());
                    }

                    return;
                }
            }

            if (!this.isEventIgnored(evtName, me, sender)) {
                this.onFireMouse.fire(new FireMouseEvent(evtName, me));

                if ((Client.isOp || Client.isSf || Client.isGc ||
                (Client.isIe && Client.isSvg) || me.getEvent().target != this.container.eventTarget())) {
                    if (evtName == Events.mouseMove && this.isMouseDown && this.autoScroll && !Events.isMultiTouchEvent(me.getEvent())) {
                        this.scrollPointToVisible(me.getGraphX(), me.getGraphY(), this.autoExtend);
                    }

                    if (this.mouseListeners != null) {

                        // Does not change returnValue in Opera
                        if (!me.getEvent().preventDefault) {
                            (<any>me.getEvent()).returnValue = true;
                        }

                        for (var i = 0; i < this.mouseListeners.length; i++) {
                            var l = this.mouseListeners[i];

                            if (evtName == Events.mouseDown) {
                                l.mouseDown(sender, me);
                            } else if (evtName == Events.mouseMove) {
                                l.mouseMove(sender, me);
                            } else if (evtName == Events.mouseUp) {
                                l.mouseUp(sender, me);
                            }
                        }
                    }

                    // Invokes the click handler
                    if (evtName == Events.mouseUp) {
                        this.click(me);
                    }
                }

                // Detects tapAndHold events using a timer
                if (Events.isTouchEvent(me.getEvent()) && evtName == Events.mouseDown && this.tapAndHoldEnabled && !this.tapAndHoldInProgress) {
                    this.tapAndHoldInProgress = true;
                    this.initialTouchX = me.getGraphX();
                    this.initialTouchY = me.getGraphY();

                    var handler = () => {
                        if (this.tapAndHoldValid) {
                            this.tapAndHold(me);
                        }

                        this.tapAndHoldInProgress = false;
                        this.tapAndHoldValid = false;
                    };

                    if (this.tapAndHoldThread) {
                        window.clearTimeout(this.tapAndHoldThread);
                    }

                    this.tapAndHoldThread = window.setTimeout(Utils.bind(this, handler), this.tapAndHoldDelay);
                    this.tapAndHoldValid = true;
                } else if (evtName == Events.mouseUp) {
                    this.tapAndHoldInProgress = false;
                    this.tapAndHoldValid = false;
                } else if (this.tapAndHoldValid) {
                    this.tapAndHoldValid =
                        Math.abs(this.initialTouchX - me.getGraphX()) < this.tolerance &&
                        Math.abs(this.initialTouchY - me.getGraphY()) < this.tolerance;
                }

                this.consumeMouseEvent(evtName, me, sender);
            }
        }

        /**
         * Function: dblClick
         * 
         * Processes a doubleclick on an optional cell and fires a <dblclick>
         * event. The event is fired initially. If the graph is enabled and the
         * event has not been consumed, then <edit> is called with the given
         * cell. The event is ignored if no cell was specified.
         *
         * Example for overriding this method.
         *
         * (code)
         * graph.dblClick = function(evt, cell)
         * {
         *   var mxe = new mxEventObject(Events.DOUBLE_CLICK, 'event', evt, 'cell', cell);
         *   this.fireEvent(mxe);
         *   
         *   if (this.isEnabled() && !Events.isConsumed(evt) && !mxe.isConsumed())
         *   {
         * 	   Utils.alert('Hello, World!');
         *     mxe.consume();
         *   }
         * }
         * (end)
         * 
         * Example listener for this event.
         * 
         * (code)
         * graph.addListener(Events.DOUBLE_CLICK, function(sender, evt)
         * {
         *   var cell = evt.getProperty('cell');
         *   // do something with the cell...
         * });
         * (end) 
         * 
         * Parameters:
         * 
         * evt - Mouseevent that represents the doubleclick.
         * cell - Optional <mxCell> under the mousepointer.
         */
        dblClick(evt: MouseEvent, cell?: Cell) {
            this.onDoubleClick.fire(new DoubleClickEvent(evt, cell));

            // Handles the event if it has not been consumed
            if (this.isEnabled() && !Events.isConsumed(evt) && !new DoubleClickEvent(evt, cell).isConsumed() &&
                cell != null && this.isCellEditable(cell) && !this.isEditing(cell)) {
                this.startEditingAtCell(cell, evt);
                Events.consume(evt);
            }
        }

        private isCellsEditable(): boolean {
            return this.cellsEditable;
        }

        isCellsLocked(): boolean {
            return this.cellsLocked;
        }

        /** Returns true if the given cell may not be moved, sized, bended, disconnected, edited or selected. This implementation returns true for
         * all vertices with a relative geometry if <locked> is false. */
        private isCellLocked(cell: Cell): boolean {
            var geometry = Cells.getGeometry(cell);

            return this.isCellsLocked() || (geometry != null && Cells.isVertex(cell) && geometry.relative);
        }

        /**
         * Returns true if the given cell is editable. This returns <cellsEditable> for all given cells if <isCellLocked> does not return true for the given cell
         * and its style does not specify <Constants.STYLE_EDITABLE> to be 0.
         * cell - <mxCell> whose editable state should be returned.
         */
        isCellEditable(cell: Cell): boolean {
            var state = this.view.getState(cell);
            var style = (state != null) ? state.style : this.getCellStyle(cell);

            return this.isCellsEditable() && !this.isCellLocked(cell) && style[Constants.styleEditable] == "1";
        }


        /**
         * Returns the bottom-most cell that intersects the given point (x, y) in the cell hierarchy that starts at the given parent.
         */
        private intersects(state: CellState, x: number, y: number): boolean {
            if (state != null) {
                var pts = state.absolutePoints;
                var pt: Point;
                if (pts != null) {
                    var t2 = this.tolerance * this.tolerance;
                    pt = pts[0];
                    for (var i = 1; i < pts.length; i++) {
                        var next = pts[i];
                        var dist = Utils.ptSegDistSq(pt.x, pt.y, next.x, next.y, x, y);

                        if (dist <= t2) {
                            return true;
                        }

                        pt = next;
                    }
                } else {
                    var alpha = Utils.toRadians(state.style.rotation);

                    if (alpha != 0) {
                        var cos = Math.cos(-alpha);
                        var sin = Math.sin(-alpha);
                        var cx = new Point(state.getCenterX(), state.getCenterY());
                        pt = Utils.getRotatedPoint(new Point(x, y), cos, sin, cx);
                        x = pt.x;
                        y = pt.y;
                    }

                    if (Utils.contains(state, x, y)) {
                        return true;
                    }
                }
            }

            return false;
        }

        /**
         * Function: getCellAt
         * 
         * Returns the bottom-most cell that intersects the given point (x, y) in
         * the cell hierarchy starting at the given parent. This will also return
         * swimlanes if the given location intersects the content area of the
         * swimlane. If this is not desired, then the <hitsSwimlaneContent> may be
         * used if the returned cell is a swimlane to determine if the location
         * is inside the content area or on the actual title of the swimlane.
         * 
         * Parameters:
         * 
         * x - X-coordinate of the location to be checked.
         * y - Y-coordinate of the location to be checked.
         * parent - <mxCell> that should be used as the root of the recursion.
         * Default is current root of the view or the root of the model.
         * vertices - Optional boolean indicating if vertices should be returned. Default is true.
         * edges - Optional boolean indicating if edges should be returned. Default
         * is true.
         */
        getCellAt(x: number, y: number, parent?: Cell, vertices: boolean = true, edges: boolean = true): Cell {
            if (parent == null) {
                parent = this.getCurrentRoot();

                if (parent == null) {
                    parent = this.getModel().getRoot();
                }
            }

            if (parent != null) {
                var childCount = Cells.getChildCount(parent);

                for (var i = childCount - 1; i >= 0; i--) {
                    var cell = Cells.getChildAt(parent, i);
                    var result = this.getCellAt(x, y, cell, vertices, edges);

                    if (result != null) {
                        return result;
                    } else if (this.isCellVisible(cell) && (edges && Cells.isEdge(cell) ||
                        vertices && Cells.isVertex(cell))) {
                        var state = this.view.getState(cell);

                        if (this.intersects(state, x, y)) {
                            return cell;
                        }
                    }
                }
            }

            return null;
        }

        getCurrentRoot(): Cell {
            return this.view.currentRoot;
        }

        /**
        * Returns true if the given cell is currently being edited.
        * If no cell is specified then this returns true if any
        * cell is currently being edited.
        * cell - <mxCell> that should be checked.
        */
        isEditing(cell?: Cell) {
            if (this.cellEditor != null) {
                var editingCell = this.cellEditor.getEditingCell();
                return (cell == null) ? editingCell != null : cell === editingCell;
            }

            return false;
        }

        /**
        * Returns the string or DOM node that represents the tooltip for the given
        * state, node and coordinate pair. This implementation checks if the given
        * node is a folding icon or overlay and returns the respective tooltip. If
        * this does not result in a tooltip, the handler for the cell is retrieved
        * from <selectionCellsHandler> and the optional getTooltipForNode method is
        * called. If no special tooltip exists here then <getTooltipForCell> is used
        * with the cell in the given state as the argument to return a tooltip for the
        * given state.
        * 
        * Parameters:
        * 
        * state - <mxCellState> whose tooltip should be returned.
        * node - DOM node that is currently under the mouse.
        * x - X-coordinate of the mouse.
        * y - Y-coordinate of the mouse.
        */
        getTooltip(state: CellState, node: Element, x: number, y: number): string {
            var tip = null;

            if (state != null) {
                // Checks if the mouse is over the folding icon
                if (state.control != null && (node == state.control.node ||
                    node.parentNode == state.control.node)) {
                    tip = this.collapseExpandResource;
                    tip = Resources.get(tip) || tip;
                }

                if (tip == null && state.overlays != null) {
                    state.overlays.visit(shape => {
                        // LATER: Exit loop if tip is not null
                        if (tip == null && (node == shape.node || node.parentNode == shape.node)) {
                            tip = shape.overlay.toString();
                        }
                    });
                }

                if (tip == null) {
                    var handler = this.selectionCellsHandler.getHandler(state.cell);

                    if (handler != null && handler.getTooltipForNode != null) {
                        tip = handler.getTooltipForNode(node);
                    }
                }

                if (tip == null) {
                    tip = this.getTooltipForCell(state.cell);
                }
            }

            return tip;
        }

        isEnabled(): boolean {
            return this.enabled;
        }

        /**
        * Returns true if the given cell is selected.
        * cell - Cell for which the selection state should be returned.
        */
        isCellSelected(cell: Cell) {
            return this.getSelectionModel().isSelected(cell);
        }

        setSelectionCell(cell: Cell) {
            this.getSelectionModel().setCell(cell);
        }

        clearSelection() {
            return this.getSelectionModel().clear();
        }

        getIndicatorShape(state: CellState): ShapeStyle {
            return (state != null && state.style != null) ? state.style[Constants.styleIndicatorShape] : null;
        }

        private removeSelectionCell(cell: Cell) {
            this.getSelectionModel().removeCell(cell);
        }

        private addSelectionCell(cell: Cell) {
            this.getSelectionModel().addCell(cell);
        }

        getSelectionCount(): number {
            return this.getSelectionModel().cells.length;
        }

        /**
         * Returns the image URL for the given cell state. 
         */
        getImage(state: CellState): string {
            return (state != null && state.style != null) ? state.style.image : null;
        }

        getIndicatorColor(state: CellState) : Color {
            return (state != null && state.style != null) ? state.style.indicatorColor : null;
        }

        getIndicatorGradientColor(state: CellState): Color {
            return (state != null && state.style != null) ? state.style.indicatorGradientcolor : null;
        }

        getIndicatorImage(state: CellState): string {
            return (state != null && state.style != null) ? state.style.indicatorImage : null;
        }

        /**
         * Function: getSwimlane
         * 
         * Returns the nearest ancestor of the given cell which is a swimlane, or
         * the given cell, if it is itself a swimlane.
         * 
         * Parameters:
         * 
         * cell - <mxCell> for which the ancestor swimlane should be returned.
         */
        getSwimlane(cell: Cell) {
            while (cell != null && !this.isSwimlane(cell)) {
                cell = Cells.getParent(cell);
            }
            return cell;
        }

        /** 
         * Returns the bottom-most swimlane that intersects the given point (x, y)
         * in the cell hierarchy that starts at the given parent.
         * x - X-coordinate of the location to be checked.
         * y - Y-coordinate of the location to be checked.
         * parent - <mxCell> that should be used as the root of the recursion. Default is <defaultParent>.
         */
        getSwimlaneAt(x: number, y: number, parent?: Cell): Cell {
            parent = parent || this.getDefaultParent();

            if (parent != null) {
                var childCount = Cells.getChildCount(parent);

                for (var i = 0; i < childCount; i++) {
                    var child = Cells.getChildAt(parent, i);
                    var result = this.getSwimlaneAt(x, y, child);

                    if (result != null) {
                        return result;
                    } else if (this.isSwimlane(child)) {
                        var state = this.view.getState(child);

                        if (this.intersects(state, x, y)) {
                            return child;
                        }
                    }
                }
            }

            return null;
        }

        /**
         * Returns true if the given cell is a swimlane in the graph. A swimlane is
         * a container cell with some specific behaviour. This implementation
         * checks if the shape associated with the given cell is a <mxSwimlane>.
         * Parameters:
         * cell - <mxCell> to be checked.
         */
        isSwimlane(cell: Cell): boolean {
            if (cell != null) {
                if (Cells.getParent(cell) != this.model.getRoot()) {
                    var state = this.view.getState(cell);
                    var style = (state != null) ? state.style : this.getCellStyle(cell);

                    if (style != null && !Cells.isEdge(cell)) {
                        return style.shape == ShapeStyle.Swimlane;
                    }
                }
            }
            return false;
        }

        private isSwimlaneSelectionEnabled(): boolean {
            return this.swimlaneSelectionEnabled;
        }

/**
         * Function: getLabel
         * 
         * Returns a string or DOM node that represents the label for the given
         * cell. This implementation uses <convertValueToString> if <labelsVisible>
         * is true. Otherwise it returns an empty string.
         * 
         * To truncate a label to match the size of the cell, the following code
         * can be used.
         * 
         * (code)
         * graph.getLabel = function(cell)
         * {
         *   var label = mxGraph.prototype.getLabel.apply(this, arguments);
         * 
         *   if (label != null && this.model.isVertex(cell))
         *   {
         *     var geo = this.getCellGeometry(cell);
         * 
         *     if (geo != null)
         *     {
         *       var max = parseInt(geo.width / 8);
         * 
         *       if (label.length > max)
         *       {
         *         label = label.substring(0, max)+'...';
         *       }
         *     }
         *   } 
         *   return Utils.htmlEntities(label);
         * }
         * (end)
         * 
         * A resize listener is needed in the graph to force a repaint of the label
         * after a resize.
         * 
         * (code)
         * graph.addListener(Events.RESIZE_CELLS, function(sender, evt)
         * {
         *   var cells = evt.getProperty('cells');
         * 
         *   for (var i = 0; i < cells.length; i++)
         *   {
         *     this.view.removeState(cells[i]);
         *   }
         * });
         * (end)
         * 
         * Parameters:
         * 
         * cell - <mxCell> whose label should be returned.
         */
        getLabel(cell: Cell): string {
            var result = "";

            if (this.labelsVisible && cell != null) {
                var state = this.view.getState(cell);
                var style = (state != null) ? state.style : this.getCellStyle(cell);

                if (!style.noLabel) {
                    result = this.convertValueToString(cell);
                }
            }

            return result;
        }

        /** Returns the textual representation for the given cell. This implementation returns the nodename or string-representation of the user object.
         * Example:
         * The following returns the label attribute from the cells user object if it is an XML node.
         * 
         * (code)
         * graph.convertValueToString = function(cell)
         * {
         * 	return cell.getAttribute('label');
         * }
         * (end)
         */
        convertValueToString(cell) {
            var value = <Element>Cells.getValue(cell);

            if (value != null) {
                if (Utils.isNode(value)) {
                    return value.nodeName;
                } else if (typeof (value.toString) == "function") {
                    return value.toString();
                }
            }

            return "";
        }

        /**
         * Searches all <imageBundles> for the specified key and returns the value for the first match or null if the key is not found.
         */
        getImageFromBundles(key: string) {
            if (key != null) {
                for (var i = 0; i < this.imageBundles.length; i++) {
                    var image = this.imageBundles[i].getImage(key);

                    if (image != null) {
                        return image;
                    }
                }
            }
            return null;
        }

        /**
         * Returns true if the label must be rendered as HTML markup. The default
         * implementation returns <htmlLabels>.
         * Parameters:
         * cell - <mxCell> whose label should be displayed as HTML markup.
         */
        isHtmlLabel(cell: Cell): boolean {
            return this.isHtmlLabels();
        }

        /**
         * Function: isHtmlLabels
         * 
         * Returns <htmlLabels>.
         */
        isHtmlLabels(): boolean {
            return this.htmlLabels;
        }



        /** cancel - Boolean that specifies if the current editing value should be stored. */
        stopEditing(cancel: boolean) {
            this.cellEditor.stopEditing(cancel);
        }

        getCellOverlays(cell: Cell): CellOverlay[] {
            return cell.overlays;
        }

        /** Adds an <mxCellOverlay> for the specified cell. This method fires an <addoverlay> event and returns the new <mxCellOverlay>. */
        private addCellOverlay(cell: Cell, overlay: CellOverlay) {
            if (cell.overlays == null) {
                cell.overlays = [];
            }

            cell.overlays.push(overlay);

            var state = this.view.getState(cell);

            // Immediately updates the cell display if the state exists
            if (state != null) {
                this.cellRenderer.redraw(state);
            }

            this.onAddOverlay.fire(new CellOverlayEvent(cell, overlay));

            return overlay;
        }

        isInvokesStopCellEditing(): boolean {
            return this.invokesStopCellEditing;
        }

        getFoldingImage(state: CellState): Image {
            /// <summary>Returns the Image used to display the collapsed state of the specified cell state. This returns null for all edges.</summary>
            if (state != null && this.foldingEnabled && !Cells.isEdge(state.cell)) {
                var tmp = this.isCellCollapsed(state.cell);

                if (this.isCellFoldable(state.cell, !tmp)) {
                    return (tmp) ? this.collapsedImage : this.expandedImage;
                }
            }

            return null;
        }

        foldCells(collapse: boolean, recurse: boolean = false, cells?: Cell[], checkFoldable = false): Cell[] {
            /// <summary>Sets the collapsed state of the specified cells and all descendants if recurse is true. The change is carried out using cellsFolded.
            /// This method fires Event.FOLD_CELLS while the transaction is in progress. Returns the cells whose collapsed state was changed.</summary> 
            /// <param name="collapsed">Boolean indicating the collapsed state to be assigned.</param>
            /// <param name="recurse">Optional boolean indicating if the collapsed state of all  descendants should be set.</param>
            /// <param name="cells">Array of Cell whose collapsed state should be set. If null is specified then the foldable selection cells are used.</param>
            /// <param name="checkFoldable">Optional boolean indicating of isCellFoldable should be checked</param>
            recurse = (recurse != null) ? recurse : false;

            if (cells == null) {
                cells = this.getFoldableCells(this.getSelectionCells(), collapse);
            }

            this.stopEditing(false);

            this.model.beginUpdate();
            try {
                this.cellsFolded(cells, collapse, recurse, checkFoldable);
                this.onFoldCells.fire(new FoldCellsEvent(collapse, recurse, cells));
            } finally {
                this.model.endUpdate();
            }

            return cells;
        }

        getVerticalAlign(state: CellState): VerticalAlign {
            return (state != null && state.style != null) ?
            (state.style.vAlign || VerticalAlign.Middle) : null;
        }

        /**
         * Returns the validation error message to be displayed when inserting or changing an edges' connectivity. A return value of null means the edge
         * is valid, a return value of '' means it's not valid, but do not display an error message. Any other (non-empty) string returned from this method
         * is displayed as an error message when trying to connect an edge to a source and target. This implementation uses the <multiplicities>, and
         * checks <multigraph>, <allowDanglingEdges> and <allowLoops> to generate validation errors.
         * 
         * For extending this method with specific checks for source/target cells, the method can be extended as follows. Returning an empty string means
         * the edge is invalid with no error message, a non-null string specifies the error message, and null means the edge is valid.
         * 
         * (code)
         * graph.getEdgeValidationError = function(edge, source, target)
         * {
         *   if (source != null && target != null &&
         *     this.model.getValue(source) != null &&
         *     this.model.getValue(target) != null)
         *   {
         *     if (target is not valid for source)
         *     {
         *       return 'Invalid Target';
         *     }
         *   }
         *   
         *   // "Supercall"
         *   return mxGraph.prototype.getEdgeValidationError.apply(this, arguments);
         * }
         * (end)
         */
        getEdgeValidationError(edge: Cell, source: Cell, target: Cell): string {
            if (edge != null && !this.isAllowDanglingEdges() && (source == null || target == null)) {
                return "";
            }

            if (edge != null && Cells.getTerminal(edge, true) == null &&
                Cells.getTerminal(edge, false) == null) {
                return null;
            }

            // Checks if we're dealing with a loop
            if (!this.allowLoops && source == target && source != null) {
                return "";
            }

            // Checks if the connection is generally allowed
            if (!this.isValidConnection(source, target)) {
                return "";
            }

            if (source != null && target != null) {
                var error = "";

                // Checks if the cells are already connected and adds an error message if required			
                if (!this.multigraph) {
                    var tmp = this.model.getEdgesBetween(source, target, true);

                    // Checks if the source and target are not connected by another edge
                    if (tmp.length > 1 || (tmp.length == 1 && tmp[0] != edge)) {
                        error += (Resources.get(this.alreadyConnectedResource) || this.alreadyConnectedResource) + "\n";
                    }
                }

                // Gets the number of outgoing edges from the source
                // and the number of incoming edges from the target
                // without counting the edge being currently changed.
                var sourceOut = this.model.getDirectedEdgeCount(source, true, edge);
                var targetIn = this.model.getDirectedEdgeCount(target, false, edge);

                // Checks the change against each multiplicity rule
                var err: string;
                if (this.multiplicities != null) {
                    for (var i = 0; i < this.multiplicities.length; i++) {
                        err = this.multiplicities[i].check(this, edge, source,
                            target, sourceOut, targetIn);
                        if (err != null) {
                            error += err;
                        }
                    }
                }

                // Validates the source and target terminals independently
                err = this.validateEdge(edge, source, target);
                if (err != null) {
                    error += err;
                }

                return (error.length > 0) ? error : null;
            }

            return (this.allowDanglingEdges) ? null : "";
        }

        /** Hook method for subclassers to return an error message for the given edge and terminals. This implementation returns null. */
        validateEdge(edge: Cell, source: Cell, target: Cell): string {
            return null;
        }

        isCellBendable(cell: Cell): boolean {
            /// <summary>Returns true if the given cell is bendable. This returns cellsBendable for all given cells if isLocked does not return true for the given
            /// cell and its style does not specify Constants.STYLE_BENDABLE to be 0.</summary>
            var state = this.view.getState(cell);
            var style = (state != null) ? state.style : this.getCellStyle(cell);

            return this.isCellsBendable() && !this.isCellLocked(cell) && style[Constants.styleBendable] == "1";
        }

        /** Returns true if the given terminal point is movable. This is independent from <isCellConnectable> and <isCellDisconnectable> and controls if terminal
            * points can be moved in the graph if the edge is not connected. Note that it is required for this to return true to connect unconnected edges. This
            * implementation returns true.
            * cell - <mxCell> whose terminal point should be moved.
            * source - Boolean indicating if the source or target terminal should be moved.
            */
        isTerminalPointMovable(cell: Cell, isSource: boolean): boolean {
            return true;
        }

        /** Returns true if the given cell is disconnectable from the source or target terminal. This returns <isCellsDisconnectable> for all given
            * cells if <isCellLocked> does not return true for the given cell. */
        isCellDisconnectable(cell: Cell, terminal: Cell, isSource: boolean): boolean {
            return this.isCellsDisconnectable() && !this.isCellLocked(cell);
        }

        getTolerance(): number {
            return this.tolerance;
        }

        /** Returns true if the given cell is connectable in this graph. This implementation uses <mxGraphModel.isConnectable>. Subclassers can override
        * this to implement specific connectable states for cells in only one graph, that is, without affecting the connectable state of the cell in the model.
        * cell - <mxCell> whose connectable state should be returned.
        */
        isCellConnectable(cell: Cell): boolean {
            return this.model.isConnectable(cell);
        }

        getAllConnectionConstraints(terminal: CellState, source: boolean): ConnectionConstraint[] {
            /// <summary>Returns an array of all ConnectionConstraints for the given terminal. If the shape of the given terminal is a StencilShape then the constraints
            /// of the corresponding Stencil are returned.</summary >
            if (terminal != null && terminal.shape != null && terminal.shape.stencil != null) {
                return terminal.shape.stencil.constraints;
            }

            return null;
        }

        getEditingValue(cell: Cell, evt): string {
            /** Returns the initial value for in-place editing. This implementation returns <convertValueToString> for the given cell. If this function is
             * overridden, then <mxGraphModel.valueForCellChanged> should take care of correctly storing the actual new value inside the user object.
             * cell - <mxCell> for which the initial editing value should be returned.
             * evt - Optional mouse event that triggered the editor.
             */
            return this.convertValueToString(cell);
        }

        labelChanged(cell: Cell, value: string, evt: MouseEvent): Cell {
            /**Sets the label of the specified cell to the given value using <cellLabelChanged> and fires <mxEvent.LABEL_CHANGED> while the
             * transaction is in progress. Returns the cell whose label was changed.
             * Parameters:
             * cell - <mxCell> whose label should be changed.
             * value - New label to be assigned.
             * evt - Optional event that triggered the change.
             */
            this.model.beginUpdate();
            try {
                var old = cell.value;
                this.cellLabelChanged(cell, value, this.isAutoSizeCell(cell));
                this.onLabelChanged.fire(new LabelChangedEvent(cell, value, old, evt));
            } finally {
                this.model.endUpdate();
            }

            return cell;
        }

        isLabelMovable(cell: Cell): boolean {
            /** Returns true if the given edges's label is moveable. This returns <movable> for all given cells if <isLocked> does not return true for the given cell.
             * cell - <mxCell> whose label should be moved.
             */
            return !this.isCellLocked(cell) &&
                ((Cells.isEdge(cell) && this.edgeLabelsMovable) ||
                (Cells.isVertex(cell) && this.vertexLabelsMovable));
        }

        isGridEnabledEvent(evt: MouseEvent) {
            /** Returns true if the given mouse event should be aligned to the grid.*/
            return evt != null && !Events.isMouseAltDown(evt);
        }

        /** Returns true if the given coordinate pair is inside the content are of the given swimlane. */
        hitsSwimlaneContent(swimlane: Cell, x: number, y: number): boolean {
            var state = this.getView().getState(swimlane);
            var size = this.getStartSize(swimlane);

            if (state != null) {
                var scale = this.getView().getScale();
                x -= state.x;
                y -= state.y;

                if (size.width > 0 && x > 0 && x > size.width * scale) {
                    return true;
                } else if (size.height > 0 && y > 0 && y > size.height * scale) {
                    return true;
                }
            }

            return false;
        }

        /** Returns the constraint used to connect to the outline of the given state.*/
        getOutlineConstraint(point: Point, terminalState: CellState, me: MouseEventContext): ConnectionConstraint {
            if (terminalState.shape != null) {
                var bounds = this.view.getPerimeterBounds(terminalState);
                var direction = terminalState.style.direction;

                if (direction == Direction.North || direction == Direction.South) {
                    bounds.x += bounds.width / 2 - bounds.height / 2;
                    bounds.y += bounds.height / 2 - bounds.width / 2;
                    var tmp = bounds.width;
                    bounds.width = bounds.height;
                    bounds.height = tmp;
                }

                var alpha = Utils.toRadians(terminalState.shape.getShapeRotation());

                if (alpha != 0) {
                    var cos = Math.cos(-alpha);
                    var sin = Math.sin(-alpha);

                    var ct = new Point(bounds.getCenterX(), bounds.getCenterY());
                    point = Utils.getRotatedPoint(point, cos, sin, ct);
                }

                var sx = 1;
                var sy = 1;
                var dx = 0;
                var dy = 0;

                // LATER: Add flipping support for image shapes
                if (Cells.isVertex(terminalState.cell)) {
                    var flipH = terminalState.style.flipH;
                    var flipV = terminalState.style.flipV;

                    // Legacy support for stencilFlipH/V
                    if (terminalState.shape != null && terminalState.shape.stencil != null) {
                        flipH = terminalState.style.stencilFlipH || flipH;
                        flipV = terminalState.style.stencilFlipV || flipV;
                    }

                    if (direction == Direction.North || direction == Direction.South) {
                        var tmp1 = flipH;
                        flipH = flipV;
                        flipV = tmp1;
                    }

                    if (flipH) {
                        sx = -1;
                        dx = -bounds.width;
                    }

                    if (flipV) {
                        sy = -1;
                        dy = -bounds.height;
                    }
                }

                point = new Point((point.x - bounds.x) * sx - dx + bounds.x, (point.y - bounds.y) * sy - dy + bounds.y);

                var x = Math.round((point.x - bounds.x) * 1000 / bounds.width) / 1000;
                var y = Math.round((point.y - bounds.y) * 1000 / bounds.height) / 1000;

                return new ConnectionConstraint(new Point(x, y), false);
            }

            return null;
        }

        isCloneEvent(evt: MouseEvent) {
            /// <summary>Returns true if the given event is a clone event. This implementation returns true if control is pressed.</summary>
            return Events.isMouseControlDown(evt);
        }

        isCellsCloneable(): boolean {
            /// <summary>Returns cellsCloneable, that is, if the graph allows cloning of cells by using control-drag.</summary>
            return this.cellsCloneable;
        }

        validationAlert(message: string) {
            /// <summary>Displays the given validation error in a dialog. This implementation uses Utils.alert.</summary>
            Utils.alert(message);
        }

        isAllowDanglingEdges(): boolean {
            return this.allowDanglingEdges;
        }

        /** Specifies if dangling edges are allowed, that is, if edges are allowed that do not have a source and/or target terminal defined. */
        setAllowDanglingEdges(value: boolean) {
            this.allowDanglingEdges = value;
        }

        cloneCells(cells: Cell[], allowInvalidEdges: boolean = true): Cell[] {
            /// <summary>Returns the clones for the given cells. If the terminal of an edge is not in the given array, then the respective end is assigned a terminal
            /// point and the terminal is removed. </summary>
            /// <param name="allowInvalidEdges">Optional boolean that specifies if invalid edges should be cloned. Default is true.</param>
            var clones = null;

            if (cells != null) {
                // Creates a hashtable for cell lookups
                var hash = new Object();
                var tmp = [];
                var i: number;
                for (i = 0; i < cells.length; i++) {
                    var id = CellPath.create(cells[i]);
                    hash[id] = cells[i];
                    tmp.push(cells[i]);
                }

                if (tmp.length > 0) {
                    var scale = this.view.scale;
                    var trans = this.view.translate;
                    clones = this.model.cloneCells(cells, true);

                    for (i = 0; i < cells.length; i++) {
                        if (!allowInvalidEdges && Cells.isEdge(clones[i]) &&
                            this.getEdgeValidationError(clones[i],
							Cells.getTerminal(clones[i], true),
							Cells.getTerminal(clones[i], false)) != null) {
                            clones[i] = null;
                        } else {
                            var g = Cells.getGeometry(clones[i]);

                            if (g != null) {
                                var state = this.view.getState(cells[i]);
                                var pstate = this.view.getState(Cells.getParent(cells[i]));

                                if (state != null && pstate != null) {
                                    var dx = pstate.origin.x;
                                    var dy = pstate.origin.y;

                                    if (Cells.isEdge(clones[i])) {
                                        var pts = state.absolutePoints;

                                        // Checks if the source is cloned or sets the terminal point
                                        var src = Cells.getTerminal(cells[i], true);
                                        var srcId = CellPath.create(src);

                                        while (src != null && hash[srcId] == null) {
                                            src = Cells.getParent(src);
                                            srcId = CellPath.create(src);
                                        }

                                        if (src == null) {
                                            g.setTerminalPoint(
                                                new Point(pts[0].x / scale - trans.x,
                                                    pts[0].y / scale - trans.y), true);
                                        }

                                        // Checks if the target is cloned or sets the terminal point
                                        var trg = Cells.getTerminal(cells[i], false);
                                        var trgId = CellPath.create(trg);

                                        while (trg != null && hash[trgId] == null) {
                                            trg = Cells.getParent(trg);
                                            trgId = CellPath.create(trg);
                                        }

                                        if (trg == null) {
                                            var n = pts.length - 1;
                                            g.setTerminalPoint(
                                                new Point(pts[n].x / scale - trans.x,
                                                    pts[n].y / scale - trans.y), false);
                                        }

                                        // Translates the control points
                                        var points = g.points;

                                        if (points != null) {
                                            for (var j = 0; j < points.length; j++) {
                                                points[j].x += dx;
                                                points[j].y += dy;
                                            }
                                        }
                                    } else {
                                        g.translate(dx, dy);
                                    }
                                }
                            }
                        }
                    }
                } else {
                    clones = [];
                }
            }

            return clones;
        }

        connectCell(edge: Cell, terminal: Cell, source: boolean, constraint?: ConnectionConstraint): Cell {
            /// <summary>Connects the specified end of the given edge to the given terminal using cellConnected and fires Event.CONNECT_CELL while the transaction is in progress. Returns the updated edge.</summary>
            this.model.beginUpdate();
            try {
                var previous = Cells.getTerminal(edge, source);
                this.cellConnected(edge, terminal, source, constraint);
                this.onConnectCell.fire(new ConnectCellEvent(edge , terminal, source, previous));
            } finally {
                this.model.endUpdate();
            }

            return edge;
        }

        startEditingAtCell(cell: Cell, evt?: MouseEvent) {
            if (evt == null || !Events.isMultiTouchEvent(evt)) {
                if (cell == null) {
                    cell = this.getSelectionCell();

                    if (cell != null && !this.isCellEditable(cell)) {
                        cell = null;
                    }
                }

                if (cell != null) {
                    this.onStartEditing.fire(new StartEditingEvent(cell, evt));
                    this.cellEditor.startEditing(cell, evt);
                }
            }
        }

        isCellSelectable(cell: Cell): boolean {
            return this.isCellsSelectable();
        }

        private isCellsSelectable(): boolean {
            return this.cellsSelectable;
        }

        getSelectionCell(): Cell {
            return this.getSelectionModel().cells[0];
        }

        private cellConnected(edge: Cell, terminal: Cell, source: boolean, constraint?: ConnectionConstraint) {
            /// <summary>Sets the new terminal for the given edge and resets the edge points if resetEdgesOnConnect is true. This method fires Event.CELL_CONNECTED while the transaction is in progress.</summary>
            if (edge != null) {
                this.model.beginUpdate();
                try {
                    var previous = Cells.getTerminal(edge, source);

                    // Updates the constraint
                    this.setConnectionConstraint(edge, terminal, source, constraint);

                    // Checks if the new terminal is a port, uses the ID of the port in the
                    // style and the parent of the port as the actual terminal of the edge.
                    if (this.isPortsEnabled()) {
                        //var id: number;

                        if (this.isPort(terminal)) {
                            //id = terminal.getId();
                            terminal = this.getTerminalForPort(terminal, source);
                        }

                        // Sets or resets all previous information for connecting to a child port
                        //var key = (source) ? Constants.styleSourcePort : Constants.styleTargetPort;
                        //this.setCellStyles(key, id, [edge]);
                    }

                    this.model.setTerminal(edge, terminal, source);

                    if (this.resetEdgesOnConnect) {
                        this.resetEdge(edge);
                    }

                    this.onCellConnected.fire(new ConnectCellEvent( edge, terminal, source, previous));
                } finally {
                    this.model.endUpdate();
                }
            }
        }

        setConnectionConstraint(edge: Cell, terminal: Cell, source: boolean, constraint: ConnectionConstraint) {
            /// <summary>Sets the ConnectionConstraint that describes the given connection point. If no constraint is given then nothing is changed. 
            /// To remove an existing constraint from the given edge, use an empty constraint instead.</summary>
            if (constraint != null) {
                this.model.beginUpdate();

                try {
                    if (constraint.point == null) {
                        this.setCellStyles((source) ? (s) => s.exitX = null : (s) => s.entryX = null, [edge]);
                        this.setCellStyles((source) ? (s) => s.exitY = null : (s) => s.entryY = null, [edge]);
                        this.setCellStyles((source) ? (s) => s.exitPerimeter = null : (s) => s.entryPerimeter = null, [edge]);
                    } else {
                        this.setCellStyles((source) ? (s) => s.exitX = constraint.point.x : (s) => s.entryX = constraint.point.x, [edge]);
                        this.setCellStyles((source) ? (s) => s.exitY = constraint.point.y : (s) => s.entryY = constraint.point.y, [edge]);

                        // Only writes 0 since 1 is default
                        if (!constraint.perimeter) {
                            this.setCellStyles((source) ? (s) => s.exitPerimeter = false : (s) => s.entryPerimeter = false, [edge]);
                        } else {
                            this.setCellStyles((source) ? (s) => s.exitPerimeter = null : (s) => s.entryPerimeter = null, [edge]);
                        }
                    }
                } finally {
                    this.model.endUpdate();
                }
            }
        }

        setCellStyles(style: StyleSetter, cells?: Cell[]) {
            cells = cells || this.getSelectionCells();
            this.model.setCellStyles(cells, style);
        }

        private isPortsEnabled(): boolean {
            return this.portsEnabled;
        }

        isPort(cell: Cell) {
            return false;
        }

        getSelectionCells(): Cell[] {
            return this.getSelectionModel().cells.slice();
        }

        createHandler(state: CellState): ICellHandler {
            /// <summary>Creates a new handler for the given cell state. This implementation returns a new EdgeHandler of the corresponding cell is an edge,
            ///  otherwise it returns an VertexHandler.</summary>
            var result = null;

            if (state != null) {
                if (Cells.isEdge(state.cell)) {
                    var style = this.view.getEdgeStyle(state);

                    if (this.isLoop(state) ||
                        style == EdgeStyle.elbowConnector ||
                        style == EdgeStyle.sideToSide ||
                        style == EdgeStyle.topToBottom) {
                        result = new ElbowEdgeHandler(state, this.config.selectionHandle);
                    } else if (style == EdgeStyle.segmentConnector ||
                        style == EdgeStyle.orthConnector) {
                        result = new EdgeSegmentHandler(state, this.config.selectionHandle);
                    } else {
                        result = new EdgeHandler(state, this.config.selectionHandle);
                    }
                } else {
                    result = new VertexHandler(state, this.config.nodeSelection, this.config.selectionHandle);
                }
            }

            return result;
        }

        private isLoop(state: CellState): boolean {
            /// <summary>Returns true if the given cell state is a loop.</summary>
            /// <param name="state">CellState that represents a potential loop.</param>
            var src = state.getVisibleTerminalState(true);
            var trg = state.getVisibleTerminalState(false);

            return (src != null && src == trg);
        }

        isValidSource(cell: Cell): boolean {
            /// <summary>Returns true if the given cell is a valid source for new connections. 
            /// This implementation returns true for all non-null values and is called by is called by isValidConnection.</summary>
            return (cell == null && this.allowDanglingEdges) ||
                (cell != null && (!Cells.isEdge(cell) ||
                this.connectableEdges) && this.isCellConnectable(cell));
        }

        getStartSize(swimlane: Cell): Rectangle {
            /// <summary>Returns the start size of the given swimlane, that is, the width or height of the part that contains the title, 
            /// depending on the horizontal style. The return value is an Rectangle with either width or height set as appropriate.</summary>
            var result = new Rectangle(0, 0, 0, 0);
            var state = this.view.getState(swimlane);
            var style = (state != null) ? state.style : this.getCellStyle(swimlane);

            if (style != null) {
                var size = style.startSize || Constants.defaultStartsize;

                if (!style.portrait) {
                    result.height = size;
                } else {
                    result.width = size;
                }
            }

            return result;
        }

        getPointForEvent(evt: MouseEvent, addOffset: boolean = true): Point {
            /// <summary>Returns a Point representing the given event in the unscaled, non-translated coordinate space of container and applies the grid.</summary>
            /// <param name="evt">Mousevent that contains the mouse pointer location.</param>
            /// <param name="addOffset">Optional boolean that specifies if the position should be offset by half of the gridSize. Default is true.</param>
            var p = this.container.convertPoint(Events.getClientX(evt), Events.getClientY(evt));

            var s = this.view.scale;
            var tr = this.view.translate;
            var off = addOffset ? this.gridSize / 2 : 0;

            p.x = this.snap(p.x / s - tr.x - off);
            p.y = this.snap(p.y / s - tr.y - off);

            return p;
        }

        isCellMovable(cell: Cell): boolean {
            /// <summary>Returns true if the given cell is moveable. This returns cellsMovable for all given cells if isCellLocked does not return true for the given
            /// cell and its style does not specify Constants.STYLE_MOVABLE to be 0.</summary>
            var state = this.view.getState(cell);
            var style = (state != null) ? state.style : this.getCellStyle(cell);

            return this.isCellsMovable() && !this.isCellLocked(cell) && style.movable;
        }

        getDropTarget(cells: Cell[], evt: MouseEvent, cell: Cell, clone?: boolean): Cell {
            /// <summary>Returns the given cell if it is a drop target for the given cells or the nearest ancestor that may be used as a drop target for the given cells.
            /// If the given array contains a swimlane and swimlaneNesting is false then this always returns null. If no cell is given, then the bottommost
            /// swimlane at the location of the given event is returned. This function should only be used if isDropEnabled returns true.</summary>
            /// <param name="cells">Array of Cells which are to be dropped onto the target.</param>
            /// <param name="evt">Mouseevent for the drag and drop.</param>
            /// <param name="cell">Cell that is under the mousepointer.</param>
            /// <param name="clone">Optional boolean to indicate of cells will be cloned.</param>
            if (!this.isSwimlaneNesting()) {
                for (var i = 0; i < cells.length; i++) {
                    if (this.isSwimlane(cells[i])) {
                        return null;
                    }
                }
            }

            var pt = this.container.convertPoint(Events.getClientX(evt), Events.getClientY(evt));
            pt.x -= this.panDx;
            pt.y -= this.panDy;
            var swimlane = this.getSwimlaneAt(pt.x, pt.y);

            if (cell == null) {
                cell = swimlane;
            } else if (swimlane != null) {
                // Checks if the cell is an ancestor of the swimlane
                // under the mouse and uses the swimlane in that case
                var tmp = Cells.getParent(swimlane);

                while (tmp != null && this.isSwimlane(tmp) && tmp != cell) {
                    tmp = Cells.getParent(tmp);
                }

                if (tmp == cell) {
                    cell = swimlane;
                }
            }

            while (cell != null && !this.isValidDropTarget(cell, cells, evt) && !this.model.isLayer(cell)) {
                cell = Cells.getParent(cell);
            }

            // Checks if parent is dropped into child if not cloning
            var parent: Cell;
            if (clone == null || !clone) {
                parent = cell;
                while (parent != null && Utils.indexOf(cells, parent) < 0) {
                    parent = Cells.getParent(parent);
                }
            }

            return (!this.model.isLayer(cell) && parent == null) ? cell : null;
        }

        getDefaultParent(): Cell {
            /// <summary>Returns defaultParent or GraphView.currentRoot or the first child child of GraphModel.root if both are null. 
            /// The value returned by  this function should be used as the parent for new cells (aka default layer).</summary>
            var parent = this.getCurrentRoot();

            if (parent == null) {
                parent = this.defaultParent;

                if (parent == null) {
                    var root = this.model.getRoot();
                    parent = Cells.getChildAt(root, 0);
                }
            }

            return parent;
        }

        addCell(cell: Cell, parent: Cell, index?: number, source?: Cell, target?: Cell): Cell {
            return this.addCells([cell], parent, index, source, target)[0];
        }

        /** Adds the cells to the parent at the given index, connecting each cell to the optional source and target terminal. The change is carried out using
         * <cellsAdded>. This method fires <mxEvent.ADD_CELLS> while the transaction is in progress. Returns the cells that were added.
         * 
         * Parameters:
         * 
         * cells - Array of <mxCells> to be inserted.
         * parent - <mxCell> that represents the new parent. If no parent is
         * given then the default parent is used.
         * index - Optional index to insert the cells at. Default is to append.
         * source - Optional source <mxCell> for all inserted cells.
         * target - Optional target <mxCell> for all inserted cells.
         */
        private addCells(cells: Cell[], parent: Cell, index?: number, source?: Cell, target?: Cell): Cell[] {
            if (parent == null) {
                parent = this.getDefaultParent();
            }

            if (index == null) {
                index = Cells.getChildCount(parent);
            }

            this.model.beginUpdate();
            try {
                this.cellsAdded(cells, parent, index, source, target, false, true);
                this.onAddCells.fire(new AddCellsEvent(cells, parent, index, source, target));
            } finally {
                this.model.endUpdate();
            }

            return cells;
        }

        insertEdge(parent: Cell, id: number, value: any, source: Cell, target: Cell, style?: AppliedStyle): Cell {
            /// <summary>Adds a new edge into the given parent Cell using value as the user object and the given source and target as the terminals of the new edge.
            /// The id and style are used for the respective properties of the new Cell, which is returned.</summary>
            /// <param name="parent">Cell that specifies the parent of the new edge.</param>
            /// <param name="id">Optional string that defines the Id of the new edge.</param>
            /// <param name="value">JavaScript object to be used as the user object.</param>
            /// <param name="source">Cell that defines the source of the edge.</param>
            /// <param name="target">Cell>that defines the target of the edge.</param>
            /// <param name="style">Cell>Optional string that defines the cell style.</param>
            var edge = this.createEdge(parent, id, value, source, target, style);
            return this.addEdge(edge, parent, source, target);
        }

        addEdge(edge: Cell, parent: Cell, source: Cell, target: Cell, index?: number): Cell {
            return this.addCell(edge, parent, index, source, target);
        }

        isGridEnabled(): boolean {
            return this.gridEnabled;
        }

        private getTooltipForCell(cell: Cell): string {
            return this.convertValueToString(cell);
        }

        flipEdge(edge: Cell): Cell {

            /** Toggles the style of the given edge between null (or empty) and alternateEdgeStyle. This method fires Event.FLIP_EDGE while the transaction is in progress. 
             * Returns the edge that was flipped. */
            if (edge != null &&
                this.alternateEdgeStyle != null) {
                this.model.beginUpdate();
                try {
                    var style = Cells.getStyle(edge);

                    if (style.name == null || style.name.length == 0) {
                        this.model.setStyle(edge, this.alternateEdgeStyle);
                    } else {
                        this.model.setStyle(edge, null);
                    }

                    // Removes all existing control points
                    this.resetEdge(edge);
                    this.onFlipEdge.fire(new FlipEdgeEvent(edge));
                } finally {
                    this.model.endUpdate();
                }
            }

            return edge;
        }

        /* Returns the cells which are movable in the given array of cells.*/
        getMovableCells(cells: Cell[]): Cell[] {
	        return cells.filter(c => this.isCellMovable(c));
        }

        isConstrainedEvent(evt: MouseEvent): boolean {
            /// Returns true if the given mouse event should be aligned to the grid.
            return Events.isMouseShiftDown(evt);
        }

        isDropEnabled(): boolean {
            return this.dropEnabled;
        }

        getCursorForMouseEvent(me: MouseEventContext): string {
            return this.getCursorForCell(me.getCell());
        }

        isEdgeValid(edge: Cell, source: Cell, target: Cell): boolean {
            return this.getEdgeValidationError(edge, source, target) == null;
        }

        isSplitEnabled(): boolean {
            return this.splitEnabled;
        }

        isSplitTarget(target: Cell, cells: Cell[], evt: MouseEvent): boolean {
            /// <summary>Returns true if the given edge may be splitted into two edges with the given cell as a new terminal between the two.</summary>
            /// <param name="target">Cell that represents the edge to be splitted.</param>
            /// <param name="cells">Cells that should split the edge.</param>
            if (Cells.isEdge(target) && cells != null && cells.length == 1 &&
                this.isCellConnectable(cells[0]) && this.getEdgeValidationError(target,
				Cells.getTerminal(target, true), cells[0]) == null) {
                var src = Cells.getTerminal(target, true);
                var trg = Cells.getTerminal(target, false);

                return (!Cells.isAncestor(cells[0], src) &&
                    !Cells.isAncestor(cells[0], trg));
            }

            return false;
        }

        splitEdge(edge: Cell, cells: Cell[], newEdge: Cell, dx: number, dy: number): Cell {
            /// <summary>Splits the given edge by adding the newEdge between the previous source and the given cell and reconnecting the source of the given edge to the
            /// given cell. This method fires Event.SPLIT_EDGE while the transaction  is in progress. Returns the new edge that was inserted.</summary>
            /// <param name="edge">Cell that represents the edge to be splitted.</param>
            /// <param name="cells">Cells that represents the cells to insert into the edge.</param>
            /// <param name="newEdge">Cell that represents the edge to be inserted.</param>
            /// <param name="dx">Optional integer that specifies the vector to move the cells.</param>
            /// <param name="dy">Optional integer that specifies the vector to move the cells.</param>
            dx = dx || 0;
            dy = dy || 0;

            if (newEdge == null) {
                newEdge = this.cloneCells([edge])[0];
            }

            var parent = Cells.getParent(edge);
            var source = Cells.getTerminal(edge, true);

            this.model.beginUpdate();
            try {
                this.cellsMoved(cells, dx, dy, false, false);
                this.cellsAdded(cells, parent, Cells.getChildCount(parent), null, null, true);
                this.cellsAdded([newEdge], parent, Cells.getChildCount(parent), source, cells[0], false);
                this.cellConnected(edge, cells[0], true);
                this.onSplitEdge.fire(new SplitEdgeEvent(edge, cells, newEdge, dx, dy));
            } finally {
                this.model.endUpdate();
            }

            return newEdge;
        }

        getCloneableCells(cells: Cell[]): Cell[] {
            /// <summary>Returns the cells which may be exported in the given array of cells.</summary>
            return cells.filter(c => this.isCellCloneable(c));
        }

        moveCells(cells: Cell[], dx: number, dy: number, clone: boolean = false, target?: Cell, evt?: MouseEvent): Cell[] {
            /// <summary>Moves or clones the specified cells and moves the cells or clones by the given amount, adding them to the optional target cell. The evt is the
            /// mouse event as the mouse was released. The change is carried out using cellsMoved. This method fires Event.MOVE_CELLS while the transaction is in progress. 
            /// Returns the cells that were moved.</summary>
            /// <param name="cells">Array of Cell to be moved, cloned or added to the target</param>
            /// <param name="clone">Boolean indicating if the cells should be cloned. Default is false</param>
            /// <param name="target">xCell that represents the new parent of the cells</param>
            dx = (dx != null) ? dx : 0;
            dy = (dy != null) ? dy : 0;
            clone = (clone != null) ? clone : false;

            if (cells != null && (dx != 0 || dy != 0 || clone || target != null)) {
                this.model.beginUpdate();
                try {
                    if (clone) {
                        cells = this.cloneCells(cells, this.isCloneInvalidEdges());

                        if (target == null) {
                            target = this.getDefaultParent();
                        }
                    }

                    // FIXME: Cells should always be inserted first before any other edit
                    // to avoid forward references in sessions.
                    // Need to disable allowNegativeCoordinates if target not null to
                    // allow for temporary negative numbers until cellsAdded is called.
                    var previous = this.isAllowNegativeCoordinates();

                    if (target != null) {
                        this.setAllowNegativeCoordinates(true);
                    }

                    this.cellsMoved(cells, dx, dy, !clone && this.isDisconnectOnMove()
                        && this.isAllowDanglingEdges(), target == null,
                        this.isExtendParentsOnMove() && target == null);

                    this.setAllowNegativeCoordinates(previous);

                    if (target != null) {
                        var index = Cells.getChildCount(target);
                        this.cellsAdded(cells, target, index, null, null, true);
                    }

                    // Dispatches a move event
                    this.onMoveCells.fire(new MoveCellsEvent(cells, dx, dy, clone, target, evt));
                } finally {
                    this.model.endUpdate();
                }
            }

            return cells;
        }

        scrollCellToVisible(cell: Cell, center?: boolean) {
            /// <summary>Pans the graph so that it shows the given cell. Optionally the cell may be centered in the container.
            /// To center a given graph if the container has no scrollbars, use the following code.</summary>
            var x = -this.view.translate.x;
            var y = -this.view.translate.y;

            var state = this.view.getState(cell);

            if (state != null) {
                var bounds = new Rectangle(x + state.x, y + state.y, state.width, state.height);

                if (center && this.container != null) {
                    var size = this.container.getClientSize();
                    var w = size.x;
                    var h = size.y;

                    bounds.x = bounds.getCenterX() - w / 2;
                    bounds.width = w;
                    bounds.y = bounds.getCenterY() - h / 2;
                    bounds.height = h;
                }

                if (this.scrollRectToVisible(bounds)) {
                    // Triggers an update via the view's event source
                    this.view.setTranslate(this.view.translate.x, this.view.translate.y);
                }
            }
        }

        setSelectionCells(cells: Cell[]) {
            this.getSelectionModel().setCells(cells);
        }

        zoomTo(scale: number, center?: boolean) {
            this.zoom(scale / this.view.scale, center);
        }

        private zoom(factor: number, center?: boolean) {
            /**
             * Zooms the graph using the given factor. Center is an optional boolean
             * argument that keeps the graph scrolled to the center. If the center argument
             * is omitted, then <centerZoom> will be used as its value.
             */

            center = (center != null) ? center : this.centerZoom;
            var scale = Math.round(this.view.scale * factor * 100) / 100;
            var state = this.view.getState(this.getSelectionCell());
            factor = scale / this.view.scale;

            if (this.keepSelectionVisibleOnZoom && state != null) {
                var rect = new Rectangle(state.x * factor, state.y * factor, state.width * factor, state.height * factor);

                // Refreshes the display only once if a scroll is carried out
                this.view.scale = scale;

                if (!this.scrollRectToVisible(rect)) {
                    this.view.revalidate();

                    // Forces an event to be fired but does not revalidate again
                    this.view.setScale(scale);
                }
            } else {
                var hasScrollbars = this.container.hasScrollbars();
                var dx: number;
                var dy: number;
                var offset: Point;
                if (center && !hasScrollbars) {
                    offset = this.container.getOffsetSize();
                    dx = offset.x;
                    dy = offset.y;
                    var f: number;
                    if (factor > 1) {
                        f = (factor - 1) / (scale * 2);
                        dx *= -f;
                        dy *= -f;
                    } else {
                        f = (1 / factor - 1) / (this.view.scale * 2);
                        dx *= f;
                        dy *= f;
                    }

                    this.view.scaleAndTranslate(scale,
                        this.view.translate.x + dx,
                        this.view.translate.y + dy);
                } else {
                    // Allows for changes of translate and scrollbars during setscale
                    var tx = this.view.translate.x;
                    var ty = this.view.translate.y;

                    this.view.setScale(scale);

                    if (hasScrollbars) {
                        dx = 0;
                        dy = 0;
                        if (center) {
                            offset = this.container.getOffsetSize();
                            dx = offset.x * (factor - 1) / 2;
                            dy = offset.y * (factor - 1) / 2;
                        }

                        var wasScroll = this.container.getScroll();
                        var sl = wasScroll.x;
                        var st = wasScroll.y;
                        this.container.setScroll(
                            (this.view.translate.x - tx) * this.view.scale + Math.round(sl * factor + dx),
                            (this.view.translate.y - ty) * this.view.scale + Math.round(st * factor + dy));
                    }
                }
            }
        }

        tapAndHold(me: MouseEventContext) {
            /// <summary>Handles the xMouseEvent by highlighting the CellState.</summary> 
            var evt = me.getEvent();
            var gestureEvent = new GestureEvent( evt, me.getCell());
            this.onTapAndHold.fire(gestureEvent);

            if (gestureEvent.isConsumed()) {
                // Resets the state of the panning handler
                this.panningHandler.panningTrigger = false;
            }

            // Handles the event if it has not been consumed
            if (this.isEnabled() && !Events.isConsumed(evt) && !gestureEvent.isConsumed() && this.connectionHandler.isEnabled()) {
                var state = this.view.getState(this.connectionHandler.marker.getCell(me));

                if (state != null) {
                    // todo seems like code should go to connectionHandler class
                    this.connectionHandler.marker.currentColor = this.connectionHandler.marker.validColor;
                    this.connectionHandler.marker.markedState = state;
                    this.connectionHandler.marker.mark();

                    this.connectionHandler.first = new Point(me.getGraphX(), me.getGraphY());
                    this.connectionHandler.edgeState = this.connectionHandler.createEdgeState(me);
                    this.connectionHandler.previous = state;
                    this.connectionHandler.onStartConnect.fire( new StartConnectEvent(this.connectionHandler.previous));
                }
            }
        }

        isCellFoldable(cell: Cell, collapse: boolean): boolean {
            /// <summary>Returns true if the given cell is foldable. This implementation returns true if the cell has at least one child and its style does not specify Constants.STYLE_FOLDABLE to be 0.</summary>
            var state = this.view.getState(cell);
            var style = (state != null) ? state.style : this.getCellStyle(cell);

            return Cells.getChildCount(cell) > 0 && style[Constants.styleFoldable] != "0";
        }

        getFoldableCells(cells: Cell[], collapse: boolean): Cell[] {
            return cells.filter(c => this.isCellFoldable(c, collapse));
        }

        private cellsFolded(cells: Cell[], collapse: boolean, recurse: boolean, checkFoldable: boolean) {
            /// <summary>Sets the collapsed state of the specified cells. This method fires Event.CELLS_FOLDED while the transaction is in progress. 
            /// Returns the cells whose collapsed state was changed.</summary>
            if (cells != null && cells.length > 0) {
                this.model.beginUpdate();
                try {
                    for (var i = 0; i < cells.length; i++) {
                        if ((!checkFoldable || this.isCellFoldable(cells[i], collapse)) &&
                            collapse != this.isCellCollapsed(cells[i])) {
                            this.model.setCollapsed(cells[i], collapse);
                            this.swapBounds(cells[i], collapse);

                            if (this.isExtendParent(cells[i])) {
                                this.extendParent(cells[i]);
                            }

                            if (recurse) {
                                var children = this.model.getChildren(cells[i]);
                                //this.cellsFolded(children, collapse, recurse);
                                this.foldCells(collapse, recurse, children);
                            }
                        }
                    }

                    this.onCellsFolded.fire(new FoldCellsEvent(collapse, recurse, cells));
                } finally {
                    this.model.endUpdate();
                }
            }
        }

        private isValidConnection(source: Cell, target: Cell): boolean {
            /// <summary> Returns true if the given target cell is a valid target for source. This is a boolean implementation for not allowing connections between
            /// certain pairs of vertices and is called by getEdgeValidationError. This implementation returns true if isValidSource returns true for the source and isValidTarget returns true for the target.</summary>
            return this.isValidSource(source) && this.isValidTarget(target);
        }

        isCellsBendable(): boolean {
            return this.cellsBendable;
        }

        isCellsDisconnectable(): boolean {
            return this.cellsDisconnectable;
        }

        cellLabelChanged(cell: Cell, value: string, autoSize: boolean) {
            /** Sets the new label for a cell. If autoSize is true then <cellSizeUpdated> will be called.
             * In the following example, the function is extended to map changes to attributes in an XML node, as shown in <convertValueToString>.
             * Alternatively, the handling of this can be implemented as shown in GraphModel.valueForCellChanged without the need to clone the user object.*/
            this.model.beginUpdate();
            try {
                this.model.setValue(cell, value);

                if (autoSize) {
                    this.cellSizeUpdated(cell, false);
                }
            } finally {
                this.model.endUpdate();
            }
        }

        isAutoSizeCell(cell: Cell): boolean {
            /** Returns true if the size of the given cell should automatically be updated after a change of the label. This implementation returns
             * <autoSizeCells> or checks if the cell style does specify Constants.STYLE_AUTOSIZE> to be 1. */
            var state = this.view.getState(cell);
            var style = (state != null) ? state.style : this.getCellStyle(cell);

            return this.isAutoSizeCells() || style.autoSize;
        }

        private getTerminalForPort(cell: Cell, source: boolean): Cell {
            /** Returns the terminal to be used for a given port. This implementation always returns the parent cell. */
            return Cells.getParent(cell);
        }

        resetEdge(edge: Cell): Cell {
            /** Resets the control points of the given edge. */
            var geo = Cells.getGeometry(edge);

            // Resets the control points
            if (geo != null && geo.points != null && geo.points.length > 0) {
                geo = geo.clone();
                geo.points = [];
                this.model.setGeometry(edge, geo);
            }

            return edge;
        }

        isCellResizable(cell: Cell): boolean {
            /** Returns true if the given cell is resizable. This returns <cellsResizable> for all given cells if <isCellLocked> does not return true for the given cell and its style does not specify
             * <Constants.STYLE_RESIZABLE> to be 0.
             */
            var state = this.view.getState(cell);
            var style = (state != null) ? state.style : this.getCellStyle(cell);

            return this.cellsResizable && !this.isCellLocked(cell) && style.resizable;
        }

        isCellRotatable(cell: Cell): boolean {
            /** Returns true if the given cell is rotatable. This returns true for the givencell if its style does not specify <Constants.STYLE_ROTATABLE> to be 0. */
            var state = this.view.getState(cell);
            var style = (state != null) ? state.style : this.getCellStyle(cell);

            return style[Constants.styleRotatable] == "1";
        }

        getChildCells(parent: Cell, vertices: boolean = false, edges: boolean = false): Cell[] {
            /** Returns the visible child vertices or edges in the given parent. If vertices and edges is false, then all children are returned.
             * parent - <mxCell> whose children should be returned.
             * vertices - Optional boolean that specifies if child vertices should be returned. Default is false.
             * edges - Optional boolean that specifies if child edges should be returned. Default is false.
             */
            parent = (parent != null) ? parent : this.getDefaultParent();
            var cells = this.model.getChildCells(parent, vertices, edges);
            var result = [];

            // Filters out the non-visible child cells
            for (var i = 0; i < cells.length; i++) {
                if (this.isCellVisible(cells[i])) {
                    result.push(cells[i]);
                }
            }

            return result;
        }

        getEdges(cell: Cell, parent?: Cell, incoming: boolean = true, outgoing: boolean = true, includeLoops: boolean = true, recurse: boolean = false): Cell[] {
            /// <summary>Returns the incoming and/or outgoing edges for the given cell. If the optional parent argument is specified, then only edges are returned
            /// where the opposite is in the given parent cell. If at least one of incoming or outgoing is true, then loops are ignored, if both are false, then all
            /// edges connected to the given cell are returned including loops. </summary>
            /// <param name="cell">Cell whose edges should be returned</param>
            /// <param name="parent">Optional parent of the opposite end for an edge to be returned</param>
            /// <param name="incoming">Optional boolean that specifies if incoming edges should be included in the result. Default is true.</param>
            /// <param name="outgoing">Optional boolean that specifies if outgoing edges should be included in the result. Default is true.</param>
            /// <param name="includeLoops">Optional boolean that specifies if loops should be included in the result. Default is true</param>
            /// <param name="recurse">Optional boolean the specifies if the parent specified only need be an ancestral parent, true, or the direct parent, false. Default is false</param>
            var edges = [];
            var isCollapsed = this.isCellCollapsed(cell);
            var childCount = Cells.getChildCount(cell);
            var i: number;
            for (i = 0; i < childCount; i++) {
                var child = Cells.getChildAt(cell, i);

                if (isCollapsed || !this.isCellVisible(child)) {
                    edges = edges.concat(this.model.getEdges(child, incoming, outgoing));
                }
            }

            edges = edges.concat(this.model.getEdges(cell, incoming, outgoing));
            var result = [];

            for (i = 0; i < edges.length; i++) {
                var state = this.view.getState(edges[i]);

                var source = (state != null) ? state.getVisibleTerminal(true) : this.view.getVisibleTerminal(edges[i], true);
                var target = (state != null) ? state.getVisibleTerminal(false) : this.view.getVisibleTerminal(edges[i], false);

                if ((includeLoops && source == target) || ((source != target) && ((incoming &&
                    target == cell && (parent == null || this.isValidAncestor(source, parent, recurse))) ||
                (outgoing && source == cell && (parent == null ||
                    this.isValidAncestor(target, parent, recurse)))))) {
                    result.push(edges[i]);
                }
            }

            return result;
        }

        isRecursiveResize(state?: CellState): boolean {
            return this.recursiveResize;
        }

        resizeCell(cell: Cell, bounds: Rectangle, recurse?: boolean): Cell {
            return this.resizeCells([cell], [bounds], recurse)[0];
        }

        resizeCells(cells: Cell[], bounds: Rectangle[], recurse?: boolean): Cell[] {
            recurse = (recurse != null) ? recurse : this.isRecursiveResize();

            this.model.beginUpdate();
            try {
                this.cellsResized(cells, bounds, recurse);
                this.onResizeCells.fire(new ResizeCellsEvent(cells, bounds));
            } finally {
                this.model.endUpdate();
            }

            return cells;
        }

        private isCellsMovable(): boolean {
            return this.cellsMovable;
        }

        private isSwimlaneNesting(): boolean {
            return this.swimlaneNesting;
        }

        isValidDropTarget(cell: Cell, cells?: Cell[], evt?: MouseEvent): boolean {
            /** Returns true if the given cell is a valid drop target for the specified cells. If <splitEnabled> is true then this returns <isSplitTarget> for
             * the given arguments else it returns true if the cell is not collapsed and its child count is greater than 0.
             * cell - <mxCell> that represents the possible drop target.
             * cells - <mxCells> that should be dropped into the target.
             */
            return cell != null && ((this.isSplitEnabled() &&
                this.isSplitTarget(cell, cells, evt)) || (!Cells.isEdge(cell) &&
                (this.isSwimlane(cell) || (Cells.getChildCount(cell) > 0 &&
                !this.isCellCollapsed(cell)))));
        }

        private cellsAdded(cells: Cell[], parent: Cell, index: number, source: Cell, target: Cell, absolute: boolean, constrain: boolean = true) {
            if (cells != null && parent != null && index != null) {
                this.model.beginUpdate();
                try {
                    var parentState = (absolute) ? this.view.getState(parent) : null;
                    var o1 = (parentState != null) ? parentState.origin : null;
                    var zero = new Point(0, 0);

                    for (var i = 0; i < cells.length; i++) {
                        if (cells[i] == null) {
                            index--;
                        } else {
                            var previous = Cells.getParent(cells[i]);

                            // Keeps the cell at its absolute location
                            if (o1 != null && cells[i] != parent && parent != previous) {
                                var oldState = this.view.getState(previous);
                                var o2 = (oldState != null) ? oldState.origin : zero;
                                var geo = Cells.getGeometry(cells[i]);

                                if (geo != null) {
                                    var dx = o2.x - o1.x;
                                    var dy = o2.y - o1.y;

                                    // FIXME: Cells should always be inserted first before any other edit
                                    // to avoid forward references in sessions.
                                    geo = geo.clone();
                                    geo.translate(dx, dy);

                                    if (!geo.relative && Cells.isVertex(cells[i]) &&
                                        !this.isAllowNegativeCoordinates()) {
                                        geo.x = Math.max(0, geo.x);
                                        geo.y = Math.max(0, geo.y);
                                    }

                                    this.model.setGeometry(cells[i], geo);
                                }
                            }

                            // Decrements all following indices
                            // if cell is already in parent
                            if (parent == previous && index + i > Cells.getChildCount(parent)) {
                                index--;
                            }

                            this.model.add(parent, cells[i], index + i);

                            if (this.autoSizeCellsOnAdd) {
                                this.autoSizeCell(cells[i], true);
                            }

                            // Extends the parent or constrains the child
                            if (this.isExtendParentsOnAdd() && this.isExtendParent(cells[i])) {
                                this.extendParent(cells[i]);
                            }

                            // Additionally constrains the child after extending the parent
                            if (constrain == null || constrain) {
                                this.constrainChild(cells[i]);
                            }

                            // Sets the source terminal
                            if (source != null) {
                                this.cellConnected(cells[i], source, true);
                            }

                            // Sets the target terminal
                            if (target != null) {
                                this.cellConnected(cells[i], target, false);
                            }
                        }
                    }

                    this.onCellsAdded.fire(new CellsAddedEvent(cells, parent, index, source, target, absolute));
                } finally {
                    this.model.endUpdate();
                }
            }
        }

        createEdge(parent: Cell, id: number, value: Node, source: Cell, target: Cell, style: AppliedStyle): Cell {
            /** Hook method that creates the new edge for <insertEdge>. This implementation does not set the source and target of the edge, these are set when the edge is added to the model. */
            // Creates the edge
            var edge = new Cell(value, new Geometry(), style);
            edge.setId(id);
            edge.setEdge(true);
            edge.geometry.relative = true;

            return edge;
        }

        getCursorForCell(cell: Cell): string {
            /** Returns the cursor value to be used for the CSS of the shape for the given cell. This implementation returns null. */
            return null;
        }

        private cellsMoved(cells: Cell[], dx: number, dy: number, disconnect: boolean, constrain: boolean, extend: boolean = false) {
            /** Moves the specified cells by the given vector, disconnecting the cells using disconnectGraph is disconnect is true. This method fires <mxEvent.CELLS_MOVED> while the transaction is in progress. */
            if (cells != null && (dx != 0 || dy != 0)) {
                // Removes descandants with ancestors in cells to avoid multiple moving
                cells = this.model.getTopmostCells(cells);

                this.model.beginUpdate();
                try {
                    if (disconnect) {
                        this.disconnectGraph(cells);
                    }

                    for (var i = 0; i < cells.length; i++) {
                        this.translateCell(cells[i], dx, dy);

                        if (extend && this.isExtendParent(cells[i])) {
                            this.extendParent(cells[i]);
                        } else if (constrain) {
                            this.constrainChild(cells[i]);
                        }
                    }

                    if (this.resetEdgesOnMove) {
                        this.resetEdges(cells);
                    }

                    this.onCellsMoved.fire(new CellsMovedEvent(cells, dx, dy, disconnect));
                } finally {
                    this.model.endUpdate();
                }
            }
        }

        private isCellCloneable(cell: Cell): boolean {
            /** Returns true if the given cell is cloneable. This implementation returns <isCellsCloneable> for all cells unless a cell style specifies <Constants.STYLE_CLONEABLE> to be 0. */
            var state = this.view.getState(cell);
            var style = (state != null) ? state.style : this.getCellStyle(cell);

            return this.isCellsCloneable() && style[Constants.styleCloneable] == "1";
        }

        private isCloneInvalidEdges(): boolean {
            return this.cloneInvalidEdges;
        }

        isAllowNegativeCoordinates(): boolean {
            return this.allowNegativeCoordinates;
        }

        private setAllowNegativeCoordinates(value: boolean) {
            this.allowNegativeCoordinates = value;
        }

        private isDisconnectOnMove(): boolean {
            return this.disconnectOnMove;
        }

        private isExtendParentsOnMove(): boolean {
            return this.extendParentsOnMove;
        }

        scrollRectToVisible(rect: Rectangle): boolean {
            /** Pans the graph so that it shows the given rectangle.rect - rectangle to be made visible. */
            var isChanged = false;

            if (rect != null) {
                var offset = this.container.getOffsetSize();
                var w = offset.x;
                var h = offset.y;

                var widthLimit = Math.min(w, rect.width);
                var heightLimit = Math.min(h, rect.height);

                if (this.container.hasScrollbars()) {
                    var scroll = this.container.getScroll();
                    var client = this.container.getClientSize();
                    rect.x += this.view.translate.x;
                    rect.y += this.view.translate.y;
                    var dx = scroll.x - rect.x;
                    var ddx = Math.max(dx - scroll.x, 0);

                    if (dx > 0) {
                        scroll.x -= dx + 2;
                    } else {
                        dx = rect.x + widthLimit - scroll.x - client.x;

                        if (dx > 0) {
                            scroll.x += dx + 2;
                        }
                    }

                    var dy = scroll.y - rect.y;
                    var ddy = Math.max(0, dy - scroll.y);

                    if (dy > 0) {
                        scroll.y -= dy + 2;
                    } else {
                        dy = rect.y + heightLimit - scroll.y - client.y;

                        if (dy > 0) {
                            scroll.y += dy + 2;
                        }
                    }

                    this.container.setScroll(scroll.x, scroll.y);

                    if (!this.useScrollbarsForPanning && (ddx != 0 || ddy != 0)) {
                        this.view.setTranslate(ddx, ddy);
                    }
                } else {
                    var x = -this.view.translate.x;
                    var y = -this.view.translate.y;

                    var s = this.view.scale;

                    if (rect.x + widthLimit > x + w) {
                        this.view.translate.x -= (rect.x + widthLimit - w - x) / s;
                        isChanged = true;
                    }

                    if (rect.y + heightLimit > y + h) {
                        this.view.translate.y -= (rect.y + heightLimit - h - y) / s;
                        isChanged = true;
                    }

                    if (rect.x < x) {
                        this.view.translate.x += (x - rect.x) / s;
                        isChanged = true;
                    }

                    if (rect.y < y) {
                        this.view.translate.y += (y - rect.y) / s;
                        isChanged = true;
                    }

                    if (isChanged) {
                        this.view.refresh();

                        // Repaints selection marker (ticket 18)
                        if (this.selectionCellsHandler != null) {
                            this.selectionCellsHandler.refresh();
                        }
                    }
                }
            }

            return isChanged;
        }

        swapBounds(cell: Cell, willCollapse: boolean) {
            /** Swaps the alternate and the actual bounds in the geometry of the givencell invoking <updateAlternateBounds> before carrying out the swap.
             * willCollapse - Boolean indicating if the cell is going to be collapsed. */
            if (cell != null) {
                var geo = Cells.getGeometry(cell);

                if (geo != null) {
                    geo = geo.clone();

                    this.updateAlternateBounds(cell, geo, willCollapse);
                    geo.swap();

                    this.model.setGeometry(cell, geo);
                }
            }
        }

        private isExtendParent(cell: Cell): boolean {
            /** Returns true if the parent of the given cell should be extended if thechild has been resized so that it overlaps the parent. This implementation returns <isExtendParents> if the cell is not an edge.
             * cell - <mxCell> that has been resized.
             */
            return !Cells.isEdge(cell) && this.isExtendParents();
        }

        extendParent(cell: Cell) {
            /** Resizes the parents recursively so that they contain the complete area of the resized child cell.
             * cell - <mxCell> that has been resized. */
            if (cell != null) {
                var parent = Cells.getParent(cell);
                var p = Cells.getGeometry(parent);

                if (parent != null && p != null && !this.isCellCollapsed(parent)) {
                    var geo = Cells.getGeometry(cell);

                    if (geo != null && (p.width < geo.x + geo.width ||
                        p.height < geo.y + geo.height)) {
                        p = p.clone();

                        p.width = Math.max(p.width, geo.x + geo.width);
                        p.height = Math.max(p.height, geo.y + geo.height);

                        this.cellsResized([parent], [p], false);
                    }
                }
            }
        }

        isValidTarget(cell: Cell): boolean {
            return this.isValidSource(cell);
        }

        private cellSizeUpdated(cell: Cell, ignoreChildren: boolean) {
            /** Updates the size of the given cell in the model using <getPreferredSizeForCell> to get the new size.*/
            if (cell != null) {
                this.model.beginUpdate();
                try {
                    var size = this.getPreferredSizeForCell(cell);
                    var geo = Cells.getGeometry(cell);

                    if (size != null && geo != null) {
                        var collapsed = this.isCellCollapsed(cell);
                        geo = geo.clone();

                        if (this.isSwimlane(cell)) {
                            var state = this.view.getState(cell);
                            var style = (state != null) ? state.style : this.getCellStyle(cell);
                            var cellStyle = Cells.getStyle(cell);
                             
                            if (cellStyle == null) {
                                cellStyle = new AppliedStyle(null);
                            }

                            if (style.portrait) {
                                cellStyle.startSize = size.height + 8;

                                if (collapsed) {
                                    geo.height = size.height + 8;
                                }

                                geo.width = size.width;
                            } else {
                                cellStyle.startSize = size.width + 8;

                                if (collapsed) {
                                    geo.width = size.width + 8;
                                }

                                geo.height = size.height;
                            }

                            this.model.setStyle(cell, cellStyle);
                        } else {
                            geo.width = size.width;
                            geo.height = size.height;
                        }

                        if (!ignoreChildren && !collapsed) {
                            var bounds = this.view.getBounds(this.model.getChildren(cell));

                            if (bounds != null) {
                                var tr = this.view.translate;
                                var scale = this.view.scale;

                                var width = (bounds.x + bounds.width) / scale - geo.x - tr.x;
                                var height = (bounds.y + bounds.height) / scale - geo.y - tr.y;

                                geo.width = Math.max(geo.width, width);
                                geo.height = Math.max(geo.height, height);
                            }
                        }

                        this.cellsResized([cell], [geo], false);
                    }
                } finally {
                    this.model.endUpdate();
                }
            }
        }

        isAutoSizeCells(): boolean {
            return this.autoSizeCells;
        }

        /** Specifies if cell sizes should be automatically updated after a labelchange. This implementation sets <autoSizeCells> to the given parameter.
         * To update the size of cells when the cells are added, set <autoSizeCellsOnAdd> to true. */
        setAutoSizeCells(value: boolean) {
            this.autoSizeCells = value;
        }

        get cellsResizable(): boolean {
            return this._cellsResizable;
        }

        set cellsResizable(value: boolean) {
            this._cellsResizable = value;
        }

        destroy() {
            if (!this.destroyed) {
                this.destroyed = true;

                if (this.tooltipHandler != null) {
                    this.tooltipHandler.destroy();
                }

                if (this.selectionCellsHandler != null) {
                    this.selectionCellsHandler.destroy();
                }

                if (this.panningHandler != null) {
                    this.panningHandler.destroy();
                }

                if (this.popupMenuHandler != null) {
                    this.popupMenuHandler.destroy();
                }

                if (this.connectionHandler != null) {
                    this.connectionHandler.destroy();
                }

                if (this.graphHandler != null) {
                    this.graphHandler.destroy();
                }

                if (this.cellEditor != null) {
                    this.cellEditor.destroy();
                }

                if (this.view != null) {
                    this.view.destroy();
                }

                if (this.model != null && this.graphModelChangeListener != null) {
                    this.model.onChange.remove(this.graphModelChangeListener);
                    this.graphModelChangeListener = null;
                }

                this.container = null;
            }
        }

        updateAlternateBounds(cell: Cell, geo: Geometry, willCollapse: boolean) {
            /** Updates or sets the alternate bounds in the given geometry for the given cell depending on whether the cell is going to be collapsed. If no
             * alternate bounds are defined in the geometry and <collapseToPreferredSize> is true, then the preferred size is used for
             * the alternate bounds. The top, left corner is always kept at the same location.
             * cell - <mxCell> for which the geometry is being udpated.
             * geo - <mxGeometry> for which the alternate bounds should be updated.
             * willCollapse - Boolean indicating if the cell is going to be collapsed.
             */
            if (cell != null && geo != null) {
                var state = this.view.getState(cell);
                var style = (state != null) ? state.style : this.getCellStyle(cell);

                if (geo.alternateBounds == null) {
                    var bounds: Rectangle = geo;

                    if (this.collapseToPreferredSize) {
                        var tmp = this.getPreferredSizeForCell(cell);

                        if (tmp != null) {
                            bounds = tmp;

                            var startSize = style.startSize;

                            if (startSize > 0) {
                                bounds.height = Math.max(bounds.height, startSize);
                            }
                        }
                    }

                    geo.alternateBounds = new Rectangle(0, 0, bounds.width, bounds.height);
                }

                if (geo.alternateBounds != null) {
                    geo.alternateBounds.x = geo.x;
                    geo.alternateBounds.y = geo.y;

                    var alpha = Utils.toRadians(style.rotation);

                    if (alpha != 0) {
                        var dx = geo.alternateBounds.getCenterX() - geo.getCenterX();
                        var dy = geo.alternateBounds.getCenterY() - geo.getCenterY();

                        var cos = Math.cos(alpha);
                        var sin = Math.sin(alpha);

                        var dx2 = cos * dx - sin * dy;
                        var dy2 = sin * dx + cos * dy;

                        geo.alternateBounds.x += dx2 - dx;
                        geo.alternateBounds.y += dy2 - dy;
                    }
                }
            }
        }

        isValidAncestor(cell: Cell, parent: Cell, recurse: boolean): boolean {
            return (recurse ? Cells.isAncestor(parent, cell) : Cells.getParent(cell) == parent);
        }

        private cellsResized(cells: Cell[], bounds: Rectangle[], recurse: boolean) {
            /** Sets the bounds of the given cells and fires a <mxEvent.CELLS_RESIZED>event. If <extendParents> is true, then the parent is extended if a
             * child size is changed so that it overlaps with the parent.
             * The following example shows how to control group resizes to make sure
             * that all child cells stay within the group.
             * (code)
             * graph.addListener(mxEvent.CELLS_RESIZED, function(sender, evt)
             * {
             *   var cells = evt.getProperty('cells');
             *   
             *   if (cells != null)
             *   {
             *     for (var i = 0; i < cells.length; i++)
             *     {
             *       if (graph.getModel().getChildCount(cells[i]) > 0)
             *       {
             *         var geo = graph.getCellGeometry(cells[i]);
             *         
             *         if (geo != null)
             *         {
             *           var children = graph.getChildCells(cells[i], true, true);
             *           var bounds = graph.getBoundingBoxFromGeometry(children, true);
             *           
             *           geo = geo.clone();
             *           geo.width = Math.max(geo.width, bounds.width);
             *           geo.height = Math.max(geo.height, bounds.height);
             *           
             *           graph.getModel().setGeometry(cells[i], geo);
             *         }
             *       }
             *     }
             *   }
             * });
             * (end)
             * Parameters:
             * cells - Array of <mxCells> whose bounds should be changed.
             * bounds - Array of <mxRectangles> that represent the new bounds.
             * recurse - Optional boolean that specifies if the children should be resized.
             */
            recurse = (recurse != null) ? recurse : false;

            if (cells != null && bounds != null && cells.length == bounds.length) {
                this.model.beginUpdate();
                try {
                    for (var i = 0; i < cells.length; i++) {
                        this.cellResized(cells[i], bounds[i], false, recurse);

                        if (this.isExtendParent(cells[i])) {
                            this.extendParent(cells[i]);
                        } else if (this.isConstrainChildrenOnResize()) {
                            this.constrainChild(cells[i]);
                        }
                    }

                    if (this.resetEdgesOnResize) {
                        this.resetEdges(cells);
                    }

                    this.onCellsResized.fire(new CellsResizeEvent(cells, bounds));
                } finally {
                    this.model.endUpdate();
                }
            }
        }

        autoSizeCell(cell: Cell, recurse: boolean = true) {
            /** Removes the given cells from the graph including all connected edges if includeEdges is true. The change is carried out using <cellsRemoved>.
             * This method fires <mxEvent.REMOVE_CELLS> while the transaction is in progress. The removed cells are returned as an array. */
            if (recurse) {
                var childCount = Cells.getChildCount(cell);

                for (var i = 0; i < childCount; i++) {
                    this.autoSizeCell(Cells.getChildAt(cell, i));
                }
            }

            if (Cells.isVertex(cell) && this.isAutoSizeCell(cell)) {
                this.updateCellSize(cell);
            }
        }

        isExtendParentsOnAdd(): boolean {
            return this.extendParentsOnAdd;
        }

        constrainChild(cell: Cell) {
            /** Keeps the given cell inside the bounds returned by <getCellContainmentArea> for its parent, according to the rules defined by
             * <getOverlap> and <isConstrainChild>. This modifies the cell's geometry in-place and does not clone it.*/
            if (cell != null) {
                var geo = Cells.getGeometry(cell);
                var area = (this.isConstrainChild(cell)) ?
                    this.getCellContainmentArea(cell) :
                    this.getMaximumGraphBounds();

                if (geo != null && area != null) {
                    // Keeps child within the content area of the parent
                    if (!geo.relative && (geo.x < area.x || geo.y < area.y ||
                        area.width < geo.x + geo.width || area.height < geo.y + geo.height)) {
                        var overlap = this.getOverlap(cell);
                        geo = geo.clone();

                        if (area.width > 0) {
                            geo.x = Math.min(geo.x, area.x + area.width -
                            (1 - overlap) * geo.width);
                        }

                        if (area.height > 0) {
                            geo.y = Math.min(geo.y, area.y + area.height -
                            (1 - overlap) * geo.height);
                        }

                        geo.x = Math.max(geo.x, area.x - geo.width * overlap);
                        geo.y = Math.max(geo.y, area.y - geo.height * overlap);

                        geo.width = Math.min(geo.width, area.width);
                        geo.height = Math.min(geo.height, area.height);

                        this.model.setGeometry(cell, geo);
                    }
                }
            }
        }

        disconnectGraph(cells: Cell[]) {
            /**Disconnects the given edges from the terminals which are not in the given array. */
            if (cells != null) {
                this.model.beginUpdate();
                try {
                    var scale = this.view.scale;
                    var tr = this.view.translate;

                    // Prepares a hashtable for faster cell lookups
                    var hash = new Object();
                    var i: number;
                    for (i = 0; i < cells.length; i++) {
                        var id = CellPath.create(cells[i]);
                        hash[id] = cells[i];
                    }

                    for (i = 0; i < cells.length; i++) {
                        if (Cells.isEdge(cells[i])) {
                            var geo = Cells.getGeometry(cells[i]);

                            if (geo != null) {
                                var state = this.view.getState(cells[i]);
                                var pstate = this.view.getState(
                                    Cells.getParent(cells[i]));

                                if (state != null &&
                                    pstate != null) {
                                    geo = geo.clone();

                                    var dx = -pstate.origin.x;
                                    var dy = -pstate.origin.y;
                                    var pts = state.absolutePoints;

                                    var src = Cells.getTerminal(cells[i], true);

                                    if (src != null && this.isCellDisconnectable(cells[i], src, true)) {
                                        var srcId = CellPath.create(src);

                                        while (src != null && hash[srcId] == null) {
                                            src = Cells.getParent(src);
                                            srcId = CellPath.create(src);
                                        }

                                        if (src == null) {
                                            geo.setTerminalPoint(
                                                new Point(pts[0].x / scale - tr.x + dx, pts[0].y / scale - tr.y + dy), true);
                                            this.model.setTerminal(cells[i], null, true);
                                        }
                                    }

                                    var trg = Cells.getTerminal(cells[i], false);

                                    if (trg != null && this.isCellDisconnectable(cells[i], trg, false)) {
                                        var trgId = CellPath.create(trg);

                                        while (trg != null && hash[trgId] == null) {
                                            trg = Cells.getParent(trg);
                                            trgId = CellPath.create(trg);
                                        }

                                        if (trg == null) {
                                            var n = pts.length - 1;
                                            geo.setTerminalPoint(
                                                new Point(pts[n].x / scale - tr.x + dx, pts[n].y / scale - tr.y + dy), false);
                                            this.model.setTerminal(cells[i], null, false);
                                        }
                                    }

                                    this.model.setGeometry(cells[i], geo);
                                }
                            }
                        }
                    }
                } finally {
                    this.model.endUpdate();
                }
            }
        }

        translateCell(cell: Cell, dx: number, dy: number) {
            /** Translates the geometry of the given cell and stores the new, translated geometry in the model as an atomic change. */
            var geo = Cells.getGeometry(cell);

            if (geo != null) {
                geo = geo.clone();
                geo.translate(dx, dy);

                if (!geo.relative && Cells.isVertex(cell) && !this.isAllowNegativeCoordinates()) {
                    geo.x = Math.max(0, geo.x);
                    geo.y = Math.max(0, geo.y);
                }

                if (geo.relative && !Cells.isEdge(cell)) {
                    var parent = Cells.getParent(cell);
                    var angle = 0;

                    if (Cells.isVertex(parent)) {
                        var state = this.view.getState(parent);
                        var style = (state != null) ? state.style : this.getCellStyle(parent);

                        angle = style.rotation;
                    }

                    if (angle != 0) {
                        var rad = Utils.toRadians(-angle);
                        var cos = Math.cos(rad);
                        var sin = Math.sin(rad);
                        var pt = Utils.getRotatedPoint(new Point(dx, dy), cos, sin, new Point(0, 0));
                        dx = pt.x;
                        dy = pt.y;
                    }

                    if (geo.offset == null) {
                        geo.offset = new Point(dx, dy);
                    } else {
                        geo.offset.x = geo.offset.x + dx;
                        geo.offset.y = geo.offset.y + dy;
                    }
                }

                this.model.setGeometry(cell, geo);
            }
        }

        resetEdges(cells: Cell[]) {
            /** Resets the control points of the edges that are connected to the givencells if not both ends of the edge are in the given cells array. */
            if (cells != null) {
                // Prepares a hashtable for faster cell lookups
                var hash = new Object();
                var i: number;
                for (i = 0; i < cells.length; i++) {
                    var id = CellPath.create(cells[i]);
                    hash[id] = cells[i];
                }

                this.model.beginUpdate();
                try {
                    for (i = 0; i < cells.length; i++) {
                        var edges = this.model.getEdges(cells[i]);

                        if (edges != null) {
                            for (var j = 0; j < edges.length; j++) {
                                var state = this.view.getState(edges[j]);

                                var source = (state != null) ? state.getVisibleTerminal(true) : this.view.getVisibleTerminal(edges[j], true);
                                var target = (state != null) ? state.getVisibleTerminal(false) : this.view.getVisibleTerminal(edges[j], false);

                                var sourceId = CellPath.create(source);
                                var targetId = CellPath.create(target);

                                // Checks if one of the terminals is not in the given array
                                if (hash[sourceId] == null || hash[targetId] == null) {
                                    this.resetEdge(edges[j]);
                                }
                            }
                        }

                        this.resetEdges(this.model.getChildren(cells[i]));
                    }
                } finally {
                    this.model.endUpdate();
                }
            }
        }

        isExtendParents(): boolean {
            return this.extendParents;
        }

        /** Returns the preferred width and height of the given <mxCell> as an <mxRectangle>. To implement a minimum width, add a new style eg. minWidth in the vertex and override this method as follows. */
        private getPreferredSizeForCell(cell: Cell): Rectangle {

            var getEdgePrefferedSize = (): Rectangle => {
                return new Rectangle();
            } 

            var getVertexPrefferedSize = () : Rectangle => {
                var state = this.view.getState(cell) || this.view.createState(cell);
                var style = state.style;
                var fontSize = style.fontSize;
                var dx = 0;
                var dy = 0;
                if (this.getImage(state) != null || style.image != null) {
                    if (style.shape == ShapeStyle.Label) {
                        if (style.vAlign == VerticalAlign.Middle) {
                            dx += style.imageWidth || LabelShape.imageSize;
                        }

                        if (style.hAlign != HorizontalAlign.Center) {
                            dy += style.imageHeight || LabelShape.imageSize;
                        }
                    }
                }
                dx += 2 * style.spacing;
                dx += style.spacingLeft;
                dx += style.spacingRight;
                dy += 2 * style.spacing;
                dy += style.spacingTop;
                dy += style.spacingBottom;
                var image = this.getFoldingImage(state);
                if (image != null) {
                    dx += image.width + 8;
                }
                var value = this.cellRenderer.getLabelValue(state);
                if (value != null && value.length > 0) {
                    if (!this.isHtmlLabel(state.cell)) {
                        value = Utils.htmlEntities(value);
                    }

                    value = value.replace(/\n/g, "<br>");

                    var maxLabelWidth = cell.geometry.getMaxWidth() - dx;
                    var size = Utils.getSizeForString(value, fontSize, style.fontFamily, maxLabelWidth);
                    var width = size.width + dx;
                    var height = size.height + dy;

                    if (style.portrait) {
                        var tmp = height;

                        height = width;
                        width = tmp;
                    }

                    if (this.gridEnabled) {
                        width = this.snap(width + this.gridSize / 2);
                        height = this.snap(height + this.gridSize / 2);
                    }

                    return new Rectangle(0, 0, width, height);
                } else {
                    var gs2 = 4 * this.gridSize;
                    return new Rectangle(0, 0, gs2, gs2);
                }
            }

            var result = Cells.isEdge(cell) ? getEdgePrefferedSize() : getVertexPrefferedSize();
            return cell.geometry.applySizeRestrictions(result);
        }

        private cellResized(cell: Cell, bounds: Rectangle, ignoreRelative: boolean, recurse: boolean) {
            /** Resizes the parents recursively so that they contain the complete area of the resized child cell.
             * cell - <mxCell> whose bounds should be changed.
             * bounds - <mxRectangles> that represent the new bounds.
             * ignoreRelative - Boolean that indicates if relative cells should be ignored.
             * recurse - Optional boolean that specifies if the children should be resized.
             */
            var geo = Cells.getGeometry(cell);

            if (geo != null && (geo.x != bounds.x || geo.y != bounds.y ||
                geo.width != bounds.width || geo.height != bounds.height)) {
                geo = geo.clone();

                if (!ignoreRelative && geo.relative) {
                    var offset = geo.offset;

                    if (offset != null) {
                        offset.x += bounds.x - geo.x;
                        offset.y += bounds.y - geo.y;
                    }
                } else {
                    geo.x = bounds.x;
                    geo.y = bounds.y;
                }

                geo.width = bounds.width;
                geo.height = bounds.height;

                if (!geo.relative && Cells.isVertex(cell) && !this.isAllowNegativeCoordinates()) {
                    geo.x = Math.max(0, geo.x);
                    geo.y = Math.max(0, geo.y);
                }

                this.model.beginUpdate();
                try {
                    if (recurse) {
                        this.resizeChildCells(cell, geo);
                    }

                    this.model.setGeometry(cell, geo);

                    if (this.isConstrainChildrenOnResize()) {
                        this.constrainChildCells(cell);
                    }
                } finally {
                    this.model.endUpdate();
                }
            }
        }

        private isConstrainChildrenOnResize(): boolean {
            return this.constrainChildrenOnResize;
        }

        updateCellSize(cell: Cell, ignoreChildren: boolean = false) {
            /** Updates the size of the given cell in the model using <cellSizeUpdated>. */
            this.model.beginUpdate();
            try {
                this.cellSizeUpdated(cell, ignoreChildren);
                this.onUpdateCellSize.fire(new UpdateCellSizeEvent(cell, ignoreChildren));
            } finally {
                this.model.endUpdate();
            }

            return cell;
        }

        private isConstrainChild(cell: Cell): boolean {
            /** Returns true if the given cell should be kept inside the bounds of its parent according to the rules defined by <getOverlap> and <isAllowOverlapParent>. 
             * This implementation returns false for all children of edges and <isConstrainChildren> otherwise.
             * cell - <mxCell> that should be constrained. */
            return this.isConstrainChildren() && !Cells.isEdge(Cells.getParent(cell));
        }

        private getCellContainmentArea(cell: Cell): Rectangle {
            /** Returns the <mxRectangle> inside which a cell is to be kept.
             * cell - <mxCell> for which the area should be returned. */
            if (cell != null && !Cells.isEdge(cell)) {
                var parent = Cells.getParent(cell);

                if (parent == this.getDefaultParent() || parent == this.getCurrentRoot()) {
                    return this.getMaximumGraphBounds();
                } else if (parent != null && parent != this.getDefaultParent()) {
                    var g = Cells.getGeometry(parent);

                    if (g != null) {
                        var x = 0;
                        var y = 0;
                        var w = g.width;
                        var h = g.height;

                        if (this.isSwimlane(parent)) {
                            var size = this.getStartSize(parent);

                            var state = this.view.getState(parent);
                            var style = (state != null) ? state.style : this.getCellStyle(parent);
                            var dir = style.direction || Direction.East;
                            var flipH = style.flipH;
                            var flipV = style.flipV;

                            if (dir.valueOf() === Direction.South || dir.valueOf() == Direction.North) {
                                var tmp = size.width;
                                size.width = size.height;
                                size.height = tmp;
                            }

                            if ((dir.valueOf() == Direction.East && !flipV) || (dir.valueOf() == Direction.North && !flipH) ||
                            (dir == Direction.West && flipV) || (dir == Direction.South && flipH)) {
                                x = size.width;
                                y = size.height;
                            }

                            w -= size.width;
                            h -= size.height;
                        }

                        return new Rectangle(x, y, w, h);
                    }
                }
            }

            return null;
        }

        private getMaximumGraphBounds(): Rectangle {
            return this.maximumGraphBounds;
        }

        private getOverlap(cell: Cell): number {
            /** Returns a decimal number representing the amount of the width and height of the given cell that is allowed to overlap its parent. A value of 0
             * means all children must stay inside the parent, 1 means the child is allowed to be placed outside of the parent such that it touches one of
             * the parents sides. If <isAllowOverlapParent> returns false for the given cell, then this method returns 0.
             * cell - <mxCell> for which the overlap ratio should be returned.
             */
            return (this.isAllowOverlapParent(cell)) ? this.defaultOverlap : 0;
        }

        private resizeChildCells(cell: Cell, newGeo: Geometry) {
            /** Resizes the child cells of the given cell for the given new geometry with respect to the current geometry of the cell.
             * cell - <mxCell> that has been resized.
             * newGeo - <mxGeometry> that represents the new bounds. */
            var geo = Cells.getGeometry(cell);
            var dx = newGeo.width / geo.width;
            var dy = newGeo.height / geo.height;
            var childCount = Cells.getChildCount(cell);

            for (var i = 0; i < childCount; i++) {
                this.scaleCell(Cells.getChildAt(cell, i), dx, dy, true);
            }
        }

        private scaleCell(cell: Cell, dx: number, dy: number, recurse: boolean) {
            /** Scales the points, position and size of the given cell according to the given vertical and horizontal scaling factors.
             * cell - <mxCell> whose geometry should be scaled.
             * dx - Horizontal scaling factor.
             * dy - Vertical scaling factor.
             * recurse - Boolean indicating if the child cells should be scaled.
             */
            var geo = Cells.getGeometry(cell);

            if (geo != null && this.isCellMovable(cell) && this.isCellResizable(cell)) {
                geo = geo.clone();
                geo.scale(dx, dy);

                if (Cells.isVertex(cell)) {
                    this.cellResized(cell, geo, true, recurse);
                } else {
                    this.model.setGeometry(cell, geo);
                }
            }
        }

        private constrainChildCells(cell: Cell) {
            /** Constrains the children of the given cell using <constrainChild>.   cell - <mxCell> that has been resized. */
            var childCount = Cells.getChildCount(cell);

            for (var i = 0; i < childCount; i++) {
                this.constrainChild(Cells.getChildAt(cell, i));
            }
        }

        private isConstrainChildren(): boolean {
            return this.constrainChildren;
        }

        private isAllowOverlapParent(cell: Cell): boolean {
            /** Returns true if the given cell is allowed to be placed outside of the parents area.
             * cell - <mxCell> that represents the child to be checked. */
            return false;
        }

        selectRegion(rect: Rectangle, evt: MouseEvent) {
            /** Selects and returns the cells inside the given rectangle for the specified event.
             * rect - <mxRectangle> that represents the region to be selected.
             * evt - Mouseevent that triggered the selection. */
            var cells = this.getCells(rect.x, rect.y, rect.width, rect.height);
            this.selectCellsForEvent(cells, evt);

            return cells;
        }

        private getCells(x: number, y: number, width: number, height: number, parent?: Cell, result?: Cell[]): Cell[] {
            /** Returns the children of the given parent that are contained in the given rectangle (x, y, width, height). The result is added to the optional
             * result array, which is returned from the function. If no result array is specified then a new array is created and returned.
             * x - X-coordinate of the rectangle.
             * y - Y-coordinate of the rectangle.
             * width - Width of the rectangle.
             * height - Height of the rectangle.
             * parent - <mxCell> that should be used as the root of the recursion.
             * Default is current root of the view or the root of the model.
             * result - Optional array to store the result in.
             */
            result = (result != null) ? result : [];

            if (width > 0 || height > 0) {
                var right = x + width;
                var bottom = y + height;

                if (parent == null) {
                    parent = this.getCurrentRoot();

                    if (parent == null) {
                        parent = this.getModel().getRoot();
                    }
                }

                if (parent != null) {
                    var childCount = Cells.getChildCount(parent);

                    for (var i = 0; i < childCount; i++) {
                        var cell = Cells.getChildAt(parent, i);
                        var state = this.view.getState(cell);

                        if (this.isCellVisible(cell) && state != null) {
                            var box: Rectangle;
                            box = state;
                            var deg = state.style.rotation;

                            if (deg != 0) {
                                box = Utils.getBoundingBox(box, deg);
                            }

                            // ReSharper disable once QualifiedExpressionMaybeNull
                            if (box.x >= x && box.y + box.height <= bottom && box.y >= y && box.x + box.width <= right) {
                                result.push(cell);
                            } else {
                                this.getCells(x, y, width, height, cell, result);
                            }
                        }
                    }
                }
            }

            return result;
        }

        private selectCellsForEvent(cells: Cell[], evt: MouseEvent) {
            /** Selects the given cells by either adding them to the selection or replacing the selection depending on whether the given mouse event is a
             * toggle event.
             * cells - Array of <mxCells> to be selected.
             * evt - Optional mouseevent that triggered the selection. */
            if (this.isToggleEvent(evt)) {
                this.addSelectionCells(cells);
            } else {
                this.setSelectionCells(cells);
            }
        }

        private addSelectionCells(cells: Cell[]) {
            this.getSelectionModel().addCells(cells);
        }

        insertVertex(parent: Cell, id: number, value: string, bounds: Rectangle, style?: AppliedStyle, relative: boolean = false, sizeRestriction?: ICellSizeRestrictions) {
            /** Adds a new vertex into the given parent <mxCell> using value as the user object and the given coordinates as the <mxGeometry> of the new vertex.
             * The id and style are used for the respective properties of the new <mxCell>, which is returned.
             * When adding new vertices from a mouse event, one should take into account the offset of the graph container and the scale and translation
             * of the view in order to find the correct unscaled, untranslated coordinates using <mxGraph.getPointForEvent> as follows:
             * (code)
             * var pt = graph.getPointForEvent(evt);
             * var parent = graph.getDefaultParent();
             * graph.insertVertex(parent, null,
             * 			'Hello, World!', x, y, 220, 30);
             * (end)
             * For adding image cells, the style parameter can be assigned as
             * (code)
             * stylename;image=imageUrl
             * (end)
             * parent - <mxCell> that specifies the parent of the new vertex.
             * id - Optional string that defines the Id of the new vertex.
             * value - Object to be used as the user object.
             * x - Integer that defines the x coordinate of the vertex.
             * y - Integer that defines the y coordinate of the vertex.
             * width - Integer that defines the width of the vertex.
             * height - Integer that defines the height of the vertex.
             * style - Optional string that defines the cell style.
             * relative - Optional boolean that specifies if the geometry is relative.
             * Default is false.
             */
            var geometry = new Geometry(bounds, sizeRestriction);
            geometry.relative = (relative != null) ? relative : false;

            // Creates the vertex
            var vertex = new Cell(value, geometry, style);
            vertex.setId(id);
            vertex.setVertex(true);
            vertex.setConnectable(true);

            return this.addCell(vertex, parent);
        }



        graphModelChanged(changes: IChange[]) {
            /** Called when the graph model changes. Invokes <processChange> on each item of the given array to update the view accordingly.
             * changes - Array that contains the individual changes.
             */
            for (var i = 0; i < changes.length; i++) {
                this.processChange(changes[i]);
            }

            this.removeSelectionCells(this.getRemovedCellsForChanges(changes));

            this.view.validate();
            this.sizeDidChange();
        }

        processChange(change: IChange) {
            /** Processes the given change and invalidates the respective cached data in <view>. This fires a <root> event if the root has changed in the model.
             * change - Object that represents the change on the model. */

            // Resets the view settings, removes all cells and clears
            // the selection if the root changes.
            if (change instanceof RootChange) {
                this.clearSelection();
                this.removeStateForCell((<RootChange>change).previous);

                if (this.resetViewOnRootChange) {
                    this.view.scale = 1;
                    this.view.translate.x = 0;
                    this.view.translate.y = 0;
                }

                this.onRootChange.fire();
            }
// Adds or removes a child to the view by online invaliding the minimal required portions of the cache, namely, the old and new parent and the child.
            else if (change instanceof ChildChange) {
                var child = (<ChildChange>change).child;
                var previous = (<ChildChange>change).previous;
                var newParent = Cells.getParent(child);
                this.view.invalidate(child, true, true);

                if (newParent == null || this.isCellCollapsed(newParent)) {
                    this.view.invalidate(child, true, true);
                    this.removeStateForCell(child);

                    // Handles special case of current root of view being removed
                    if (this.view.currentRoot === child) {
                        this.home();
                    }
                }

                if (newParent !== previous) {
                    // Refreshes the collapse/expand icons on the parents
                    if (newParent != null) {
                        this.view.invalidate(newParent, false, false);
                    }

                    if (previous != null) {
                        this.view.invalidate(previous, false, false);
                    }
                }
            }

            // Handles two special cases where the shape does not need to be recreated from scratch, it only needs to be invalidated.
            if (change instanceof TerminalChange)
                this.view.invalidate(change.cell);
            else if (change instanceof GeometryChange) {
                var geoChange = <GeometryChange>change;
                if ((geoChange.previous == null && geoChange.geometry != null) || (geoChange.previous != null && !geoChange.previous.equals(geoChange.geometry)))
                    this.view.invalidate(change.cell);
            }
            // Handles two special cases where only the shape, but no descendants need to be recreated
            else if (change instanceof ValueChange) {
                this.view.invalidate(change.cell, false, false);
            }
            // Requires a new Shape in JavaScript
            else if (change instanceof StyleChange) {
                var cell = change.cell;
                this.view.invalidate(cell, true, true);
                this.view.removeState(cell);
            }
            // Removes the state from the cache by default
            else if (change.cell != null && change.cell instanceof Cell) {
                this.removeStateForCell(change.cell);
            }
        }

        getRemovedCellsForChanges(changes: IChange[]): Cell[] {
            /** Returns the cells that have been removed from the model. */
            var result: Cell[] = [];

            for (var i = 0; i < changes.length; i++) {
                var change = changes[i];

                // Resets the view settings, removes all cells and clears
                // the selection if the root changes.
                if (change instanceof RootChange) {
                    break;
                } else if (change instanceof ChildChange) {
                    var childChange = <ChildChange>change;
                    if (childChange.previous != null && childChange.parent == null) {
                        result = result.concat(this.model.getDescendants(childChange.child));
                    }
                } else if (change instanceof VisibleChange) {
                    result = result.concat(this.model.getDescendants(change.cell));
                }
            }

            return result;
        }

        private removeSelectionCells(cells: Cell[]) {
            /** Removes the given cells from the selection. */
            this.getSelectionModel().removeCells(cells);
        }

        private removeStateForCell(cell: Cell) {
            /** Removes all cached information for the given cell and its descendants. This is called when a cell was removed from the model.
             * cell - <mxCell> that was removed from the model. */
            var childCount = Cells.getChildCount(cell);

            for (var i = 0; i < childCount; i++) {
                this.removeStateForCell(Cells.getChildAt(cell, i));
            }

            this.view.invalidate(cell, false, true);
            this.view.removeState(cell);
        }

        home() {
            /** Uses the root of the model as the root of the displayed cell hierarchy and selects the previous root. */
            var current = this.getCurrentRoot();

            if (current != null) {
                this.view.setCurrentRoot(null);
                var state = this.view.getState(current);

                if (state != null) {
                    this.setSelectionCell(current);
                }
            }
        }

        setEnabled(value: boolean) {
            this.enabled = value;
        }

        getStylesheet(): Stylesheet {
            return this.stylesheet;
        }

        /** Returns the visible child vertices of the given parent. */
        getChildVertices(parent?: Cell): Cell[] {
            return this.getChildCells(parent, true, false);
        }

        getBoundingBoxFromGeometry(cells: Cell[], includeEdges: boolean = false): Rectangle {
            /** Returns the bounding box for the geometries of the vertices in the given array of cells. This can be used to find the graph bounds during a layout operation (ie. before the last endUpdate) as follows:
             * cells - Array of <mxCells> whose bounds should be returned.
             * includeEdges - Specifies if edge bounds should be included by computing the bounding box for all points its geometry. Default is false. */
            var result = null;

            if (cells != null) {
                for (var i = 0; i < cells.length; i++) {
                    if (includeEdges || Cells.isVertex(cells[i])) {
                        // Computes the bounding box for the points in the geometry
                        var geo = this.getCellGeometry(cells[i]);

                        if (geo != null) {
                            var pts = geo.points;
                            var bbox = null;

                            if (Cells.isEdge(cells[i])) {
                                if (pts != null && pts.length > 0) {
                                    var tmp = new Rectangle(pts[0].x, pts[0].y, 0, 0);
                                    var addPoint = (pt: Point) => {
                                        if (pt != null) {
                                            // ReSharper disable once ClosureOnModifiedVariable
                                            tmp.add(new Rectangle(pt.x, pt.y, 0, 0));
                                        }
                                    };

                                    for (var j = 1; j < pts.length; j++) {
                                        addPoint(pts[j]);
                                    }

                                    addPoint(geo.getTerminalPoint(true));
                                    addPoint(geo.getTerminalPoint(false));

                                    bbox = tmp;
                                }
                            } else {
                                bbox = geo;
                            }

                            if (bbox != null) {
                                if (result == null) {
                                    result = new Rectangle(bbox.x, bbox.y, bbox.width, bbox.height);
                                } else {
                                    result.add(bbox);
                                }
                            }
                        }
                    }
                }
            }

            return result;
        }

        getConnections(cell: Cell, parent?: Cell): Cell[] {
            /** Returns all visible edges connected to the given cell without loops.
             * cell - <mxCell> whose connections should be returned.
             * parent - Optional parent of the opposite end for a connection to be returned. */
            return this.getEdges(cell, parent, true, true, false);
        }

        getOpposites(edges: Cell[], terminal: Cell, sources: boolean = true, targets: boolean = true): Cell[] {
            /** Returns all distinct visible opposite cells for the specified terminal on the given edges.
             * edges - Array of <mxCells> that contains the edges whose opposite terminals should be returned.
             * terminal - Terminal that specifies the end whose opposite should be returned.
             * source - Optional boolean that specifies if source terminals should be included in the result. Default is true.
             * targets - Optional boolean that specifies if targer terminals should be included in the result. Default is true.
             */
            var terminals: Cell[] = [];

            // Implements set semantic on the terminals array using a string
            // representation of each cell in an associative array lookup
            var hash = new Object();

            if (edges != null) {
                for (var i = 0; i < edges.length; i++) {
                    var state = this.view.getState(edges[i]);

                    var source = (state != null) ? state.getVisibleTerminal(true) : this.view.getVisibleTerminal(edges[i], true);
                    var target = (state != null) ? state.getVisibleTerminal(false) : this.view.getVisibleTerminal(edges[i], false);

                    // Checks if the terminal is the source of the edge and if the
                    // target should be stored in the result
                    var id: string;
                    if (source == terminal && target != null &&
                        target != terminal && targets) {
                        id = CellPath.create(target);
                        if (hash[id] == null) {
                            hash[id] = target;
                            terminals.push(target);
                        }
                    }
                    // Checks if the terminal is the taget of the edge and if the source should be stored in the result
                    else if (target == terminal && source != null &&
                        source != terminal && sources) {
                        id = CellPath.create(source);
                        if (hash[id] == null) {
                            hash[id] = source;
                            terminals.push(source);
                        }
                    }
                }
            }

            return terminals;
        }

        isEscapeEnabled(): boolean {
            return this.escapeEnabled;
        }

        escape(evt: KeyboardEvent) {
            this.onEscape.fire();
        }

        /** Clears all cell states or the states for the hierarchy starting at the given cell and validates the graph. This fires a refresh event as the last step.
         * cell - Optional <mxCell> for which the cell states should be cleared. */
        refresh(cell?: Cell) {
            this.view.clear(cell, cell == null);
            this.view.validate();
            this.sizeDidChange();
            this.onRefresh.fire();
        }

        /** Removes the given cells from the graph including all connected edges if includeEdges is true. The change is carried out using <cellsRemoved>.
         * This method fires <mxEvent.REMOVE_CELLS> while the transaction is in progress. The removed cells are returned as an array.
         * cells - Array of <mxCells> to remove. If null is specified then the selection cells which are deletable are used.
         * includeEdges - Optional boolean which specifies if all connected edges should be removed as well. Default is true. */
        removeCells(cells?: Cell[], includeEdges: boolean = true) {
            if (cells == null) {
                cells = this.getDeletableCells(this.getSelectionCells());
            }

            // Adds all edges to the cells
            if (includeEdges) {
                // FIXME: Remove duplicate cells in result or do not add if
                // in cells or descendant of cells
                cells = this.getDeletableCells(this.addAllEdges(cells));
            }

            this.model.beginUpdate();
            try {
                this.cellsRemoved(cells);
                this.onRemoveCells.fire(new RemoveCellsEvent(cells, includeEdges));
            } finally {
                this.model.endUpdate();
            }

            return cells;
        }

        private getDeletableCells(cells: Cell[]): Cell[] {
            return cells.filter(c => this.isCellDeletable(c));
        }

        /** Returns true if the given cell is moveable. This returns cellsDeletable for all given cells if a cells style does not specify Constants.STYLE_DELETABLE to be 0. */
        private isCellDeletable(cell: Cell): boolean {
            var state = this.view.getState(cell);
            var style = (state != null) ? state.style : this.getCellStyle(cell);

            return this.isCellsDeletable() && style[Constants.styleDeletable] != '0';
        }

        private isCellsDeletable(): boolean {
            return this.cellsDeletable;
        }

        /** Returns an array with the given cells and all edges that are connected to a cell or one of its descendants. */
        private addAllEdges(cells: Cell[]): Cell[] {
            var allCells = cells.slice(); // FIXME: Required?
            allCells = allCells.concat(this.getAllEdges(cells));
            return allCells;
        }

        /** Returns all edges connected to the given cells or its descendants. */
        private getAllEdges(cells: Cell[]): Cell[] {
            var edges = [];
            if (cells != null) {
                for (var i = 0; i < cells.length; i++) {
                    var edgeCount = Cells.getEdgeCount(cells[i]);

                    for (var j = 0; j < edgeCount; j++) {
                        edges.push(Cells.getEdgeAt(cells[i], j));
                    }

                    // Recurses
                    var children = this.model.getChildren(cells[i]);
                    edges = edges.concat(this.getAllEdges(children));
                }
            }
            return edges;
        }

        /** Removes the given cells from the model. This method fires Event.CELLS_REMOVED while the transaction is in progress. */
        private cellsRemoved(cells: Cell[]) {
            if (cells != null && cells.length > 0) {
                var scale = this.view.scale;
                var tr = this.view.translate;

                this.model.beginUpdate();
                try {
                    // Creates hashtable for faster lookup
                    var hash = new Object();
                    var i: number;
                    var id: string;
                    for (i = 0; i < cells.length; i++) {
                        id = CellPath.create(cells[i]);
                        hash[id] = cells[i];
                    }

                    for (i = 0; i < cells.length; i++) {
                        // Disconnects edges which are not in cells
                        var edges = this.getConnections(cells[i]);

                        for (var j = 0; j < edges.length; j++) {
                            id = CellPath.create(edges[j]);
                            if (hash[id] == null) {
                                var geo = Cells.getGeometry(edges[j]);

                                if (geo != null) {
                                    var state = this.view.getState(edges[j]);

                                    if (state != null) {
                                        geo = geo.clone();
                                        var source = state.getVisibleTerminal(true) == cells[i];
                                        var pts = state.absolutePoints;
                                        var n = (source) ? 0 : pts.length - 1;

                                        geo.setTerminalPoint(
                                            new Point(pts[n].x / scale - tr.x, pts[n].y / scale - tr.y), source);
                                        this.model.setTerminal(edges[j], null, source);
                                        this.model.setGeometry(edges[j], geo);
                                    }
                                }
                            }
                        }

                        this.model.remove(cells[i]);
                    }

                    this.onCellsRemoved.fire(new CellsEvent(cells));
                } finally {
                    this.model.endUpdate();
                }
            }
        }

        /* Returns the cells which may be exported in the given array of cells. */
        getExportableCells(cells: Cell[]): Cell[] {
            return cells.filter(c => this.canExportCell(c));
        }

        /** Returns true if the given cell may be exported to the clipboard. This implementation returns <exportEnabled> for all cells. */
        private canExportCell(cell: Cell): boolean {
            return this.exportEnabled;
        }

        /** Returns the cells which may be imported in the given array of cells. */
        getImportableCells(cells: Cell[]): Cell[] {
            return cells.filter(c => this.canImportCell(c));
        }

        /** Returns true if the given cell may be imported from the clipboard. This implementation returns <importEnabled> for all cells. */
        canImportCell(cell: Cell): boolean {
            return this.importEnabled;
        }

        /** Clones and inserts the given cells into the graph using the move method and returns the inserted cells. This shortcut is used if
         * cells are inserted via datatransfer. */
        importCells(cells: Cell[], dx: number, dy: number, target: Cell, evt?: MouseEvent): Cell[] {
            return this.moveCells(cells, dx, dy, true, target, evt);
        }

        /** Ungroups the given cells by moving the children the children to their parents parent and removing the empty groups. Returns the children that
         * have been removed from the groups.
         * cells - Array of cells to be ungrouped. If null is specified then the selection cells are used. */
        ungroupCells(cells?: Cell[]) {
            var result = [];
            var i: number;
            if (cells == null) {
                cells = this.getSelectionCells();

                // Finds the cells with children
                var tmp = [];

                for (i = 0; i < cells.length; i++) {
                    if (Cells.getChildCount(cells[i]) > 0) {
                        tmp.push(cells[i]);
                    }
                }

                cells = tmp;
            }

            if (cells.length > 0) {
                this.model.beginUpdate();
                try {
                    for (i = 0; i < cells.length; i++) {
                        var children = this.model.getChildren(cells[i]);

                        if (children != null && children.length > 0) {
                            children = children.slice();
                            var parent = Cells.getParent(cells[i]);
                            var index = Cells.getChildCount(parent);

                            this.cellsAdded(children, parent, index, null, null, true);
                            result = result.concat(children);
                        }
                    }

                    this.cellsRemoved(this.addAllEdges(cells));
                    this.onUngroupCells.fire(new CellsEvent(cells));
                } finally {
                    this.model.endUpdate();
                }
            }

            return result;
        }

        /** Removes the specified cells from their parents and adds them to the default parent. Returns the cells that were removed from their parents.
         * cells - Array of <mxCells> to be removed from their parents. */
        removeCellsFromParent(cells?: Cell[]): Cell[] {
            if (cells == null) {
                cells = this.getSelectionCells();
            }

            this.model.beginUpdate();
            try {
                var parent = this.getDefaultParent();
                var index = Cells.getChildCount(parent);

                this.cellsAdded(cells, parent, index, null, null, true);
                this.onRemoveCellsFromParent.fire(new CellsEvent(cells));
            } finally {
                this.model.endUpdate();
            }

            return cells;
        }

        zoomIn() {
            this.zoom(this.zoomFactor);
        }

        zoomOut() {
            this.zoom(1 / this.zoomFactor);
        }

        zoomActual() {
            if (this.view.scale == 1) {
                this.view.setTranslate(0, 0);
            } else {
                this.view.translate.x = 0;
                this.view.translate.y = 0;

                this.view.setScale(1);
            }
        }

        /** Scales the graph such that the complete diagram fits into <container> and returns the current scale in the view. To fit an initial graph prior to
         * rendering, set <mxGraphView.rendering> to false prior to changing the model and execute the following after changing the model.
         * border - Optional number that specifies the border. Default is 0.
         * keepOrigin - Optional boolean that specifies if the translate should be changed. Default is false. */
        fit(border: number = 0, keepOrigin: boolean = false) {
            if (this.container != null) {
                var client = this.container.getClientSize(); 
                var w1 = client.x;
                var h1 = client.y;

                var bounds = this.view.getGraphBounds();

                if (keepOrigin && bounds.x != null && bounds.y != null) {
                    bounds.width += bounds.x;
                    bounds.height += bounds.y;
                    bounds.x = 0;
                    bounds.y = 0;
                }

                var s = this.view.scale;
                var w2 = bounds.width / s;
                var h2 = bounds.height / s;

                // Fits to the size of the background image if required
                if (this.backgroundImage != null) {
                    w2 = Math.max(w2, this.backgroundImage.width - bounds.x / s);
                    h2 = Math.max(h2, this.backgroundImage.height - bounds.y / s);
                }

                var b = (keepOrigin) ? border : 2 * border;
                var s2 = Math.floor(Math.min(w1 / (w2 + b), h1 / (h2 + b)) * 100) / 100;

                if (this.minFitScale != null) {
                    s2 = Math.max(s2, this.minFitScale);
                }

                if (this.maxFitScale != null) {
                    s2 = Math.min(s2, this.maxFitScale);
                }

                if (!keepOrigin) {
                    if (!this.container.hasScrollbars()) {
                        var x0 = (bounds.x != null) ? Math.floor(this.view.translate.x - bounds.x / s + border + 1) : border;
                        var y0 = (bounds.y != null) ? Math.floor(this.view.translate.y - bounds.y / s + border + 1) : border;

                        this.view.scaleAndTranslate(s2, x0, y0);
                    } else {
                        this.view.setScale(s2);
                        var b2 = this.getGraphBounds();

                        var scroll = this.container.getScroll();
                        if (b2.x != null) {
                            scroll.x = b2.x;
                        }

                        if (b2.y != null) {
                            scroll.y = b2.y;
                        }
                        this.container.setScroll(scroll.x, scroll.y);
                    }
                } else if (this.view.scale != s2) {
                    this.view.setScale(s2);
                }
            }

            return this.view.scale;
        }

        /** Selects all children of the given parent cell or the children of the default parent if no parent is specified. To select leaf vertices and/or
         * edges use <selectCells>.
         * parent - Optional <mxCell> whose children should be selected. Default is <defaultParent>. */
        selectAll(parent?: Cell) {
            parent = parent || this.getDefaultParent();

            var children = this.model.getChildren(parent);

            if (children != null) {
                this.setSelectionCells(children);
            }
        }

        /** Select all vertices inside the given parent or the default parent. */
        selectVertices(parent?: Cell) {
            this.selectCells(true, false, parent);
        }

        /** Select all vertices inside the given parent or the default parent. */
        selectEdges(parent?: Cell) {
            this.selectCells(false, true, parent);
        }

        /** Selects all vertices and/or edges depending on the given boolean arguments recursively, starting at the given parent or the default
         * parent if no parent is specified. Use <selectAll> to select all cells.
         * vertices - Boolean indicating if vertices should be selected.
         * edges - Boolean indicating if edges should be selected.
         * parent - Optional <mxCell> that acts as the root of the recursion. Default is <defaultParent>. */
        private selectCells(vertices: boolean, edges: boolean, parent?: Cell) {
            parent = parent || this.getDefaultParent();

            var filter = (cell: Cell) => {
                return this.view.getState(cell) != null &&
                    Cells.getChildCount(cell) == 0 &&
                    ((Cells.isVertex(cell) && vertices) ||
                    (Cells.isEdge(cell) && edges));
            };

            var cells = this.model.filterDescendants(filter, parent);
            this.setSelectionCells(cells);
        }

        /** Moves the given cells to the front or back. The change is carried out using <cellsOrdered>. This method fires <mxEvent.ORDER_CELLS> while the
         * transaction is in progress.
         * back - Boolean that specifies if the cells should be moved to back.
         * cells - Array of <mxCells> to move to the background. If null is specified then the selection cells are used. */
        orderCells(back: boolean, cells?: Cell[]): Cell[] {
            if (cells == null) {
                cells = Utils.sortCells(this.getSelectionCells(), true);
            }

            this.model.beginUpdate();
            try {
                this.cellsOrdered(cells, back);
            this.onOrderCells.fire(new OrderCellsEvent(cells, back));
            } finally {
                this.model.endUpdate();
            }

            return cells;
        }

        /** Moves the given cells to the front or back. This method fires <mxEvent.CELLS_ORDERED> while the transaction is in progress.
         * cells - Array of <mxCells> whose order should be changed.
         * back - Boolean that specifies if the cells should be moved to back. */
        private cellsOrdered(cells: Cell[], back: boolean) {
            if (cells != null) {
                this.model.beginUpdate();
                try {
                    for (var i = 0; i < cells.length; i++) {
                        var parent = Cells.getParent(cells[i]);

                        if (back) {
                            this.model.add(parent, cells[i], i);
                        } else {
                            this.model.add(parent, cells[i],
                                Cells.getChildCount(parent) - 1);
                        }
                    }

                    this.onCellsOrdered.fire(new OrderCellsEvent(cells, back));
                } finally {
                    this.model.endUpdate();
                }
            }
        }

        /** Uses the given cell as the root of the displayed cell hierarchy. If no cell is specified then the selection cell is used. The cell is only used if <isValidRoot> returns true.
         * cell - Optional <mxCell> to be used as the new root. Default is the selection cell. */
        enterGroup(cell?: Cell) {
            cell = cell || this.getSelectionCell();

            if (cell != null && this.isValidRoot(cell)) {
                this.view.setCurrentRoot(cell);
                this.clearSelection();
            }
        }

        /** Returns true if the given cell is a valid root for the cell display hierarchy. This implementation returns true for all non-null values.
         * cell - <mxCell> which should be checked as a possible root. */
        isValidRoot(cell: Cell): boolean {
            return (cell != null);
        }

        /** Changes the current root to the next valid root in the displayed cell hierarchy. */
        exitGroup() {
            var root = this.model.getRoot();
            var current = this.getCurrentRoot();

            if (current != null) {
                var next = Cells.getParent(current);

                // Finds the next valid root in the hierarchy
                while (next != root && !this.isValidRoot(next) &&
                    Cells.getParent(next) != root) {
                    next = Cells.getParent(next);
                }

                // Clears the current root if the new root is
                // the model's root or one of the layers.
                if (next == root || Cells.getParent(next) == root) {
                    this.view.setCurrentRoot(null);
                } else {
                    this.view.setCurrentRoot(next);
                }

                var state = this.view.getState(current);

                // Selects the previous root in the graph
                if (state != null) {
                    this.setSelectionCell(current);
                }
            }
        }

        selectPreviousCell() {
            this.selectCell();
        }

        selectNextCell() {
            this.selectCell(true);
        }

        selectParentCell() {
            this.selectCell(false, true);
        }

        selectChildCell() {
            this.selectCell(false, false, true);
        }

        /** Selects the next, parent, first child or previous cell, if all arguments are false.
         * isNext - Boolean indicating if the next cell should be selected.
         * isParent - Boolean indicating if the parent cell should be selected.
         * isChild - Boolean indicating if the first child cell should be selected. */
        private selectCell(isNext: boolean = false, isParent: boolean = false, isChild: boolean = false) {
            var sel = this.selectionModel;
            var cell = (sel.cells.length > 0) ? sel.cells[0] : null;

            if (sel.cells.length > 1) {
                sel.clear();
            }

            var parent = (cell != null) ?
                Cells.getParent(cell) :
                this.getDefaultParent();

            var childCount = Cells.getChildCount(parent);
            var child: Cell;
            if (cell == null && childCount > 0) {
                child = Cells.getChildAt(parent, 0);
                this.setSelectionCell(child);
            } else if ((cell == null || isParent) &&
                this.view.getState(parent) != null && Cells.getGeometry(parent) != null) {
                if (this.getCurrentRoot() != parent) {
                    this.setSelectionCell(parent);
                }
            } else if (cell != null && isChild) {
                var tmp = Cells.getChildCount(cell);

                if (tmp > 0) {
                    child = Cells.getChildAt(cell, 0);
                    this.setSelectionCell(child);
                }
            } else if (childCount > 0) {
                var i = parent.getIndex(cell);

                if (isNext) {
                    i++;
                    child = Cells.getChildAt(parent, i % childCount);
                    this.setSelectionCell(child);
                } else {
                    i--;
                    var index = (i < 0) ? childCount - 1 : i;
                    child = Cells.getChildAt(parent, index);
                    this.setSelectionCell(child);
                }
            }
        }


        /** Aligns the given cells vertically or horizontally according to the given alignment using the optional parameter as the coordinate.
         * param - Optional coordinate for the alignment. */
        alignCells(align: HorizontalAlign, valign: VerticalAlign, cells?: Cell[], param?: number) {
            if (cells == null) {
                cells = this.getSelectionCells();
            }

            if (cells != null && cells.length > 1) {
                // Finds the required coordinate for the alignment
                var state: CellState;
                var i: number;
                if (param == null) {
                    for (i = 0; i < cells.length; i++) {
                        state = this.view.getState(cells[i]);
                        if (state != null && !Cells.isEdge(cells[i])) {
                            if (param == null) {
                                if (align == HorizontalAlign.Center) {
                                    param = state.x + state.width / 2;
                                    break;
                                } else if (align == HorizontalAlign.Right) {
                                    param = state.x + state.width;
                                } else if (valign == VerticalAlign.Top) {
                                    param = state.y;
                                } else if (valign == VerticalAlign.Middle) {
                                    param = state.y + state.height / 2;
                                    break;
                                } else if (valign == VerticalAlign.Bottom) {
                                    param = state.y + state.height;
                                } else {
                                    param = state.x;
                                }
                            } else {
                                if (align == HorizontalAlign.Right) {
                                    param = Math.max(param, state.x + state.width);
                                } else if (valign == VerticalAlign.Top) {
                                    param = Math.min(param, state.y);
                                } else if (valign == VerticalAlign.Bottom) {
                                    param = Math.max(param, state.y + state.height);
                                } else {
                                    param = Math.min(param, state.x);
                                }
                            }
                        }
                    }
                }

                // Aligns the cells to the coordinate
                if (param != null) {
                    var s = this.view.scale;

                    this.model.beginUpdate();
                    try {
                        for (i = 0; i < cells.length; i++) {
                            state = this.view.getState(cells[i]);
                            if (state != null) {
                                var geo = this.getCellGeometry(cells[i]);

                                if (geo != null && !Cells.isEdge(cells[i])) {
                                    geo = geo.clone();

                                    if (align == HorizontalAlign.Center) {
                                        geo.x += (param - state.x - state.width / 2) / s;
                                    } else if (align == HorizontalAlign.Right) {
                                        geo.x += (param - state.x - state.width) / s;
                                    } else if (valign == VerticalAlign.Top) {
                                        geo.y += (param - state.y) / s;
                                    } else if (valign == VerticalAlign.Middle) {
                                        geo.y += (param - state.y - state.height / 2) / s;
                                    } else if (valign == VerticalAlign.Bottom) {
                                        geo.y += (param - state.y - state.height) / s;
                                    } else {
                                        geo.x += (param - state.x) / s;
                                    }

                                    this.resizeCell(cells[i], geo);
                                }
                            }
                        }

                    this.onAlignCells.fire(new AlignCellsEvent(cells, align, valign));
                    } finally {
                        this.model.endUpdate();
                    }
                }
            }

            return cells;
        }

        setTooltips(enabled: boolean) {
            this.tooltipHandler.setEnabled(enabled);
        }

        setPanning(enabled: boolean) {
            this.panningHandler.panningEnabled = enabled;
        }

        /** Returns the cells to be selected for the given array of changes. */
        getSelectionCellsForChanges(changes: IChange[]): Cell[] {
            var cells = [];

            for (var i = 0; i < changes.length; i++) {
                var change = changes[i];

                if (change.constructor != RootChange) {
                    var cell = null;

                    if (change instanceof ChildChange && (<ChildChange>change).previous == null) {
                        cell = (<ChildChange>change).child;
                    } else if (change.cell != null && change.cell instanceof Cell) {
                        cell = change.cell;
                    }

                    if (cell != null && Utils.indexOf(cells, cell) < 0) {
                        cells.push(cell);
                    }
                }
            }

            return this.getModel().getTopmostCells(cells);
        }

        /** Validates the graph by validating each descendant of the given cell or the root of the model. Context is an object that contains the validation
            * state for the complete validation run. The validation errors are attached to their cells using <setCellWarning>. This function returns true
            * if no validation errors exist in the graph.
            * cell - Optional <mxCell> to start the validation recursion. Default is the graph root.
            * context - Object that represents the global validation state. */
        validateGraph(cell?: Cell, context?: Object) {
            cell = (cell != null) ? cell : this.model.getRoot();
            context = context || new Object();

            var isValid = true;
            var childCount = Cells.getChildCount(cell);

            for (var i = 0; i < childCount; i++) {
                var tmp = Cells.getChildAt(cell, i);
                var ctx = context;

                if (this.isValidRoot(tmp)) {
                    ctx = new Object();
                }

                var warn = this.validateGraph(tmp, ctx);

                if (warn != null) {
                    this.setCellWarning(tmp, warn.replace(/\n/g, '<br>'));
                } else {
                    this.setCellWarning(tmp, null);
                }

                isValid = isValid && warn == null;
            }

            var warning = '';

            // Adds error for invalid children if collapsed (children invisible)
            if (this.isCellCollapsed(cell) && !isValid) {
                warning += Resources.get(this.containsValidationErrorsResource) + '\n';
            }

            // Checks edges and cells using the defined multiplicities
            if (Cells.isEdge(cell)) {
                warning += this.getEdgeValidationError(cell,
                    Cells.getTerminal(cell, true),
                    Cells.getTerminal(cell, false)) || '';
            } else {
                warning += this.getCellValidationError(cell) || '';
            }

            // Checks custom validation rules
            var err = this.validateCell(cell, context);

            if (err != null) {
                warning += err;
            }

            // Updates the display with the warning icons
            // before any potential alerts are displayed.
            // LATER: Move this into addCellOverlay. Redraw
            // should check if overlay was added or removed.
            if (Cells.getParent(cell) == null) {
                this.view.validate();
            }

            return (warning.length > 0 || !isValid) ? warning : null;
        }

        /** Creates an overlay for the given cell using the warning and image or <warningImage> and returns the new <mxCellOverlay>. The warning is
         * displayed as a tooltip in a red font and may contain HTML markup. If the warning is null or a zero length string, then all overlays are removed from the cell.
         * cell - <mxCell> whose warning should be set.
         * warning - String that represents the warning to be displayed.
         * img - Optional <mxImage> to be used for the overlay. Default is <warningImage>.
         * isSelect - Optional boolean indicating if a click on the overlay should select the corresponding cell. Default is false.
         */
        private setCellWarning(cell: Cell, warning: string, img?: Image, isSelect = false) {
            if (warning != null && warning.length > 0) {
                img = (img != null) ? img : this.warningImage;

                // Creates the overlay with the image and warning
                var overlay = new CellOverlay(img, '<font color=red>' + warning + '</font>');

                // Adds a handler for single mouseclicks to select the cell
                if (isSelect) {
                    overlay.onClick.add(() => { if (this.isEnabled()) this.setSelectionCell(cell) });
                }

                // Sets and returns the overlay in the graph
                return this.addCellOverlay(cell, overlay);
            } else {
                this.removeCellOverlays(cell);
            }

            return null;
        }

        /** Removes all <mxCellOverlays> from the given cell. This method fires a <removeoverlay> event for each <mxCellOverlay> and returns the array of <mxCellOverlays> that was removed from the cell.
         * cell - <mxCell> whose overlays should be removed */
        private removeCellOverlays(cell: Cell): CellOverlay[] {
            var overlays = cell.overlays;

            if (overlays != null) {
                cell.overlays = null;

                // Immediately updates the cell display if the state exists
                var state = this.view.getState(cell);

                if (state != null) {
                    this.cellRenderer.redraw(state);
                }

                for (var i = 0; i < overlays.length; i++) {
                    this.onRemoveOverlay.fire(new CellOverlayEvent(cell, overlays[i]));
                }
            }

            return overlays;
        }

        /** Checks all <multiplicities> that cannot be enforced while the graph is being modified, namely, all multiplicities that require a minimum of 1 edge.
         * cell - <mxCell> for which the multiplicities should be checked. */
        getCellValidationError(cell: Cell): string {
            var outCount = this.model.getDirectedEdgeCount(cell, true);
            var inCount = this.model.getDirectedEdgeCount(cell, false);
            var value = Cells.getValue(cell);
            var error = '';

            if (this.multiplicities != null) {
                for (var i = 0; i < this.multiplicities.length; i++) {
                    var rule = this.multiplicities[i];

                    if (rule.source && Utils.isNode(value, rule.type,
                        rule.attr, rule.value) && ((rule.max == 0 && outCount > 0) ||
                    (rule.min == 1 && outCount == 0) || (rule.max == 1 && outCount > 1))) {
                        error += rule.countError + '\n';
                    } else if (!rule.source && Utils.isNode(value, rule.type,
                        rule.attr, rule.value) && ((rule.max == 0 && inCount > 0) ||
                    (rule.min == 1 && inCount == 0) || (rule.max == 1 && inCount > 1))) {
                        error += rule.countError + '\n';
                    }
                }
            }

            return (error.length > 0) ? error : null;
        }

        /** Hook method for subclassers to return an error message for the given cell and validation context. This implementation returns null. 
         * Any HTML breaks will be converted to linefeeds in the calling method.
         * cell - <mxCell> that represents the cell to validate.
         * context - Object that represents the global validation state. */
        private validateCell(cell: Cell, context: Object) {
            return null;
        }

        /** Returns all children in the given parent which do not have incoming edges. 
        * If the result is empty then the with the greatest difference between incoming and outgoing edges is returned.
        * parent - <mxCell> whose children should be checked.
        * isolate - Optional boolean that specifies if edges should be ignored if the opposite end is not a child of the given parent cell. Default is false.
        * invert - Optional boolean that specifies if outgoing or incoming edges should be counted for a tree root. If false then outgoing edges will be counted. Default is false. */
        findTreeRoots(parent: Cell, isolate = false, invert = false): Cell[] {
            var roots: Cell[] = [];

            if (parent != null) {
                var model = this.getModel();
                var childCount = Cells.getChildCount(parent);
                var best = null;
                var maxDiff = 0;

                for (var i = 0; i < childCount; i++) {
                    var cell = Cells.getChildAt(parent, i);

                    if (Cells.isVertex(cell) && this.isCellVisible(cell)) {
                        var conns = this.getConnections(cell, (isolate) ? parent : null);
                        var fanOut = 0;
                        var fanIn = 0;

                        for (var j = 0; j < conns.length; j++) {
                            var src = this.view.getVisibleTerminal(conns[j], true);

                            if (src == cell) {
                                fanOut++;
                            } else {
                                fanIn++;
                            }
                        }

                        if ((invert && fanOut == 0 && fanIn > 0) ||
                        (!invert && fanIn == 0 && fanOut > 0)) {
                            roots.push(cell);
                        }

                        var diff = (invert) ? fanIn - fanOut : fanOut - fanIn;

                        if (diff > maxDiff) {
                            maxDiff = diff;
                            best = cell;
                        }
                    }
                }

                if (roots.length == 0 && best != null) {
                    roots.push(best);
                }
            }

            return roots;
        }

        /** Returns the edges between the given source and target. This takes into account collapsed and invisible cells and returns the connected edges as displayed on the screen.
            * source -
            * target -
            * directed -
            */
        getEdgesBetween(source: Cell, target: Cell, directed: boolean): Cell[] {
            directed = (directed != null) ? directed : false;
            var edges = this.getEdges(source);
            var result: Cell[] = [];

            // Checks if the edge is connected to the correct
            // cell and returns the first match
            for (var i = 0; i < edges.length; i++) {
                var state = this.view.getState(edges[i]);

                var src = (state != null) ? state.getVisibleTerminal(true) : this.view.getVisibleTerminal(edges[i], true);
                var trg = (state != null) ? state.getVisibleTerminal(false) : this.view.getVisibleTerminal(edges[i], false);

                if ((src == source && trg == target) || (!directed && src == target && trg == source)) {
                    result.push(edges[i]);
                }
            }

            return result;
        }

        /** Specifies if the graph should allow new connections. This implementation updates <mxConnectionHandler.enabled> in <connectionHandler>.
         * connectable - Boolean indicating if new connections should be allowed. */
        setConnectable(connectable: boolean) {
            this.connectionHandler.setEnabled(connectable);
        }


        /** Returns the bounds to be used for the given group and children. */
        private getBoundsForGroup(group: Cell, children: Cell[], border: number): Rectangle {
            var result = this.getBoundingBoxFromGeometry(children);

            if (result != null) {
                if (this.isSwimlane(group)) {
                    var size = this.getStartSize(group);

                    result.x -= size.width;
                    result.y -= size.height;
                    result.width += size.width;
                    result.height += size.height;
                }

                // Adds the border
                result.x -= border;
                result.y -= border;
                result.width += 2 * border;
                result.height += 2 * border;
            }

            return result;
        }

        /** Adds the cells into the given group. The change is carried out using <cellsAdded>, <cellsMoved> and <cellsResized>. This method fires
        * <mxEvent.GROUP_CELLS> while the transaction is in progress. Returns the new group. A group is only created if there is at least one entry in the
        * given array of cells.
        * group - <mxCell> that represents the target group. If null is specified then a new group is created using <createGroupCell>.
        * border - Optional integer that specifies the border between the child area and the group bounds. Default is 0.
        * cells - Optional array of <mxCells> to be grouped. If null is specified then the selection cells are used. */
        groupCells(group: Cell, border: number, cells?: Cell[]): Cell {
            if (cells == null) {
                cells = Utils.sortCells(this.getSelectionCells(), true);
            }

            cells = this.getCellsForGroup(cells);

            if (group == null) {
                group = this.createGroupCell(cells);
            }

            var bounds = this.getBoundsForGroup(group, cells, border);

            if (cells.length > 0 && bounds != null) {
                // Uses parent of group or previous parent of first child
                var parent = Cells.getParent(group);

                if (parent == null) {
                    parent = Cells.getParent(cells[0]);
                }

                this.model.beginUpdate();
                try {
                    // Checks if the group has a geometry and
                    // creates one if one does not exist
                    if (this.getCellGeometry(group) == null) {
                        this.model.setGeometry(group, new Geometry());
                    }

                    // Adds the group into the parent
                    var index = Cells.getChildCount(parent);
                    this.cellsAdded([group], parent, index, null, null, false);

                    // Adds the children into the group and moves
                    index = Cells.getChildCount(group);
                    this.cellsAdded(cells, group, index, null, null, false, false);
                    this.cellsMoved(cells, -bounds.x, -bounds.y, false, true);

                    // Resizes the group
                    this.cellsResized([group], [bounds], false);

                    this.onGroupCells.fire(new GroupCellsEvent(group, border, cells ));
                } finally {
                    this.model.endUpdate();
                }
            }

            return group;
        }


        /** Hook for creating the group cell to hold the given array of <mxCells> if no group cell was given to the <group> function.
         * The following code can be used to set the style of new group cells. */
        createGroupCell(cells: Cell[]): Cell {
            var group = new Cell('');
            group.setVertex(true);
            group.setConnectable(false);

            return group;
        }

        /** Returns the cells with the same parent as the first cell in the given array. */
        private getCellsForGroup(cells: Cell[]): Cell[] {
            var result: Cell[] = [];

            if (cells != null && cells.length > 0) {
                var parent = Cells.getParent(cells[0]);
                result.push(cells[0]);

                // Filters selection cells with the same parent
                for (var i = 1; i < cells.length; i++) {
                    if (Cells.getParent(cells[i]) == parent) {
                        result.push(cells[i]);
                    }
                }
            }

            return result;
        }

        /** Returns the scaled, translated bounds for the given cell. See <mxGraphView.getBounds> for arrays.
         * cell - <mxCell> whose bounds should be returned.
         * includeEdge - Optional boolean that specifies if the bounds ofthe connected edges should be included. Default is false.
         * includeDescendants - Optional boolean that specifies if the bounds of all descendants should be included. */
        getCellBounds(cell: Cell, includeEdges = false, includeDescendants = false) {
            var cells = [cell];

            // Includes all connected edges
            if (includeEdges) {
                cells = cells.concat(this.model.getEdges(cell));
            }

            var result = this.view.getBounds(cells);

            // Recursively includes the bounds of the children
            if (includeDescendants) {
                var childCount = Cells.getChildCount(cell);

                for (var i = 0; i < childCount; i++) {
                    var tmp = this.getCellBounds(Cells.getChildAt(cell, i),
                        includeEdges, true);

                    if (result != null) {
                        result.add(tmp);
                    } else {
                        result = tmp;
                    }
                }
            }

            return result;
        }

        isResizeContainer() : boolean{
            return this.resizeContainer;
        }

        /** value - Boolean indicating if the container should be resized. */
        setResizeContainer(value: boolean) {
            this.resizeContainer = value;
        }

        /** Specifies if the graph should allow dropping of cells onto or into other cells. */
        setDropEnabled(value: boolean) {
            this.dropEnabled = value;
        }

        setSplitEnabled(value: boolean) {
            this.splitEnabled = value;
        }
    }
}


    
 
module Five {
    /**
     * Represents the current state of a cell in a given GraphView.
     * For edges, the edge label position is stored in <absoluteOffset>.
     * The size for oversize labels can be retrieved using the boundingBox property of the <text> field as shown below.
     * var bbox = (state.text != null) ? state.text.boundingBox : null;
     */
    export class CellState extends Rectangle {

        constructor(view: GraphView, cell: Cell, style: {[key: string]: string}) {
            ///<summary>Constructs a new object that represents the current state of the given cell in the specified view.</summary>
            ///<param name="view">GraphView that contains the state</param>
            ///<param name="cell">Cell that this state represents</param>
            ///<param name="stylr">Array of key, value pairs that constitute the style</param>
            super(0, 0, 0, 0);
            this.view = view;
            this.cell = cell;
            this.style = style;

            this.origin = new Point();
            this.absoluteOffset = new Point();
        }

        view: GraphView = null;

        /** Reference to the <mxCell> that is represented by this state. */
        cell: Cell = null;

        /** Contains an array of key, value pairs that represent the style of the cell. */
        style: { [key: string] : string } = {};

        /** Specifies if the state is invalid. Default is true. */
        invalid = true;

        /** Point that holds the origin for all child cells. Default is a new empty Point. */
        origin: Point = null;

        /** Holds an array of Point that represent the absolute points of an edge. */
        private _absolutePoints: Point[];

        get absolutePoints(): Point[] { return this._absolutePoints; }
        set absolutePoints(value: Point[]) {
            if (value)
                for (var i = 0; i < value.length; i++)
                    if (value[i])
                        value[i].check();
            this._absolutePoints = value;
        }

        /** Point that holds the absolute offset. For edges, this is the absolute coordinates of the label position.  
        * For vertices, this is the offset of the label relative to the top, left corner of the vertex.  */
        private _absoluteOffset: Point = null;

        /** Caches the visible source terminal state. */
        private visibleSourceState: CellState = null;

        /** Caches the visible target terminal state. */
        private visibleTargetState: CellState = null;

        /** Caches the distance between the end points for an edge. */
        terminalDistance: number = 0;

        /** Caches the length of an edge. */
        length: number = 0;

        /** Array of numbers that represent the cached length of each segment of the edge. */
        segments: number[] = null;

        /** Holds the Shape that represents the cell graphically. */
        shape: Shape = null;

        /** Holds the <mxText> that represents the label of the cell. Thi smay be null if the cell has no label. */
        text: TextShape = null;

        cellBounds : Rectangle;
        paintBounds: Rectangle;

        control: ImageShape;
        overlays: Dictionary<CellOverlay, ImageShape>;

        get absoluteOffset(): Point {
            return this._absoluteOffset;
        }

        set absoluteOffset(value: Point) {
            this._absoluteOffset = value;
        }

        /** Returns the <mxRectangle> that should be used as the perimeter of the cell.
         * border - Optional border to be added around the perimeter bounds.
         * bounds - Optional <mxRectangle> to be used as the initial bounds. */
        getPerimeterBounds(border: number = 0, bounds?: Rectangle) : Rectangle {
            bounds = (bounds != null) ? bounds : new Rectangle(this.x, this.y, this.width, this.height);

            if (this.shape != null && this.shape.stencil != null) {
                var aspect = this.shape.stencil.computeAspect(bounds.x, bounds.y, bounds.width, bounds.height);

                bounds.x = aspect.x;
                bounds.y = aspect.y;
                bounds.width = this.shape.stencil.w0 * aspect.width;
                bounds.height = this.shape.stencil.h0 * aspect.height;
            }

            if (border !== 0) {
                bounds.grow(border);
            }

            return bounds;
        }

        /** Sets the first or last point in <absolutePoints> depending on isSource.
         * point - <mxPoint> that represents the terminal point.
         * isSource - Boolean that specifies if the first or last point should be assigned.
         */
        setAbsoluteTerminalPoint(point: Point, isSource: boolean) {
            if (isSource) {
                if (this.absolutePoints == null) {
                    this.absolutePoints = [];
                }

                if (this.absolutePoints.length == 0) {
                    this.absolutePoints.push(point);
                } else {
                    this.absolutePoints[0] = point;
                }
            } else {
                if (this.absolutePoints == null) {
                    this.absolutePoints = [];
                    this.absolutePoints.push(null);
                    this.absolutePoints.push(point);
                } else if (this.absolutePoints.length == 1) {
                    this.absolutePoints.push(point);
                } else {
                    this.absolutePoints[this.absolutePoints.length - 1] = point;
                }
            }
        }

        /** Sets the given cursor on the shape and text shape. */
        setCursor(cursor: string) {
            if (this.shape != null) {
                this.shape.setCursor(cursor);
            }

            if (this.text != null) {
                this.text.setCursor(cursor);
            }
        }

        getVisibleTerminal(source: boolean): Cell {
            var tmp = this.getVisibleTerminalState(source);

            return (tmp != null) ? tmp.cell : null;
        }

        getVisibleTerminalState(source: boolean): CellState {
            return (source) ? this.visibleSourceState : this.visibleTargetState;
        }

        /** Sets the visible source or target terminal state. 
        * terminalState - <mxCellState> that represents the terminal.
        * source - Boolean that specifies if the source or target state should be set. */
        setVisibleTerminalState(terminalState: CellState, source: boolean) {
            if (source) {
                this.visibleSourceState = terminalState;
            } else {
                this.visibleTargetState = terminalState;
            }
        }

        /** Returns the unscaled, untranslated bounds. */
        getCellBounds(): Rectangle {
            return this.cellBounds;
        }

        /** Returns the unscaled, untranslated paint bounds. This is the same as <getCellBounds> but with a 90 degree rotation if the shape's isPaintBoundsInverted returns true. */
        getPaintBounds(): Rectangle {
            return this.paintBounds;
        }

        updateCachedBounds() {
            /// <summary>Updates the cellBounds and paintBounds.</summary>
            var tr = this.view.translate;
            var s = this.view.scale;
            this.cellBounds = new Rectangle(this.x / s - tr.x, this.y / s - tr.y, this.width / s, this.height / s);
            this.paintBounds = Utils.clone(this.cellBounds);

            if (this.shape != null && this.shape.isPaintBoundsInverted()) {
                this.paintBounds.rotate90();
            }
        }

        destroy() {
            this.view.graph.cellRenderer.destroy(this);
        }

        clone() {
            var clone = new CellState(this.view, this.cell, this.style);

            // Clones the absolute points
            if (this.absolutePoints != null) {
                clone.absolutePoints = [];

                for (var i = 0; i < this.absolutePoints.length; i++) {
                    clone.absolutePoints[i] = this.absolutePoints[i].clone();
                }
            }

            if (this.origin != null) {
                clone.origin = this.origin.clone();
            }

            if (this.absoluteOffset != null) {
                clone.absoluteOffset = this.absoluteOffset.clone();
            }

            //if (this.boundingBox != null) {
            //    clone.boundingBox = this.boundingBox.clone();
            //}

            clone.terminalDistance = this.terminalDistance;
            clone.segments = this.segments;
            clone.length = this.length;
            clone.x = this.x;
            clone.y = this.y;
            clone.width = this.width;
            clone.height = this.height;

            return clone;
        }
    }
}
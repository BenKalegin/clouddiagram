module Five {
    "use strict"; 
    
    // Extends Rectangle to represent the geometry of a cell.
    //
    // For vertices, the geometry consists of the x - and y - location, and the width
    // and height.For edges, the geometry consists of the optional terminal - and
    // control points.The terminal points are only required if an edge is
    // unconnected, and are stored in the sourcePoint > and < targetPoint >
    // variables, respectively.
    // 
    // Example:
    //
    // If an edge is unconnected, that is, it has no source or target terminal,
    // then a geometry with terminal points for a new edge can be defined as
    // follows.
    //
    // (code)
    // geometry.setTerminalPoint(new mxPoint(x1, y1), true);
    // geometry.points = [new mxPoint(x2, y2)];
    // geometry.setTerminalPoint(new mxPoint(x3, y3), false);
    // (end)
    //
    // Control points are used regardless of the connected state of an edge and may
    // be ignored or interpreted differently depending on the edge's <mxEdgeStyle>.
    //
    // To disable automatic reset of control points after a cell has been moved or
    // resized, the the < mxGraph.resizeEdgesOnMove > and
    // <mxGraph.resetEdgesOnResize> may be used.
    //
    // Edge Labels:
    //
    // Using the x - and y - coordinates of a cell's geometry, it is possible to
    // position the label on edges on a specific location on the actual edge shape
    // as it appears on the screen.The x - coordinate of an edge's geometry is used
    // to describe the distance from the center of the edge from - 1 to 1 with 0
    // being the center of the edge and the default value.The y - coordinate of an
    // edge's geometry is used to describe the absolute, orthogonal distance in
    // pixels from that point.In addition, the < mxGeometry.offset > is used as an
    // absolute offset vector from the resulting point.
    //
    // This coordinate system is applied if <relative> is true, otherwise the
    // offset defines the absolute vector from the edge's center point to the
    // label and the values for <x> and < y > are ignored.
    //
    // The width and height parameter for edge geometries can be used to set the
    // label width and height(eg.for word wrapping).
    // 
    // Ports:
    //
    // The term "port" refers to a relatively positioned, connectable child cell,
    // which is used to specify the connection between the parent and another cell
    // in the graph.Ports are typically modeled as vertices with relative geometries.
    // 
    // Offsets:
    // 
    // The < offset > field is interpreted in 3 different ways, depending on the cell
    // and the geometry.For edges, the offset defines the absolute offset for the
    // edge label.For relative geometries, the offset defines the absolute offset
    // for the origin(top, left corner) of the vertex, otherwise the offset
    // defines the absolute offset for the label inside the vertex or group.
    // 
    // Constructor: mxGeometry
    // 
    // Constructs a new object to describe the size and location of a vertex or
    // the control points of an edge.
    
    export class Geometry extends Rectangle {

        constructor(x: number = 0, y: number = 0, width: number = 0, height: number = 0, private sizeRestrictions?: ICellSizeRestrictions) {
            super(x, y, width, height);
        }

        // Global switch to translate the points in translate. Default is true.
        private translateControlPoints = true;

        // Stores alternate values for x, y, width and height in a rectangle. See swap to exchange the values. Default is null.
        alternateBounds: Rectangle = null;

        // Defines the source Point of the edge. This is used if the corresponding edge does not have a source vertex. Otherwise it is ignored. 
        private sourcePoint: Point = null;

        // Defines the target Point of the edge. This is used if the corresponding edge does not have a target vertex. Otherwise it is ignored. 
        private targetPoint: Point = null;

        // Array of Point which specifies the control points along the edge. These points are the intermediate points on the edge, for the endpoints
        // use targetPoint and sourcePoint or set the terminals of the edge to a non-null value. Default is null.
        points: Point[] = null;

        // For edges, this holds the offset (in pixels) from the position defined by x and y on the edge. 
        // For relative geometries (for vertices), this defines the absolute offset from the point defined by the relative coordinates. 
        // For absolute geometries (for vertices), this defines the offset for the label. Default is null.
        private _offset: Point = null;

        get offset(): Point {
            return this._offset;
        }

        set offset(value: Point) {
            this._offset = value;
        }

        // Specifies if the coordinates in the geometry are to be interpreted as relative coordinates. For edges, this is used to define the location of
        // the edge label relative to the edge as rendered on the display. For vertices, this specifies the relative location inside the bounds of the  parent cell.
        // If this is false, then the coordinates are relative to the origin of the parent cell or, for edges, the edge label position is relative to the
        // center of the edge as rendered on screen.
        relative = false;

        // Swaps the x, y, width and height with the values stored in
        // <alternateBounds> and puts the previous values into <alternateBounds> as
        // a rectangle. This operation is carried-out in-place, that is, using the
        // existing geometry instance. If this operation is called during a graph
        // model transactional change, then the geometry should be cloned before
        // calling this method and setting the geometry of the cell using
        // <mxGraphModel.setGeometry>.
        swap() {
            if (this.alternateBounds != null) {
                var old = new Rectangle(this.x, this.y, this.width, this.height);

                this.x = this.alternateBounds.x;
                this.y = this.alternateBounds.y;
                this.width = this.alternateBounds.width;
                this.height = this.alternateBounds.height;

                this.alternateBounds = old;
            }
        }

        clone(): Geometry {
            return Utils.clone(this);
        }

        getTerminalPoint(isSource) {
            /// <summary>Returns the Point representing the source or target point of this edge. This is only used if the edge has no source or target vertex.</summary>
            /// <param name="isSource" type="">Boolean that specifies if the source or target point should be returned</param>
            /// <returns type=""></returns>
            return (isSource) ? this.sourcePoint : this.targetPoint;
        }

        setTerminalPoint(point: Point, isSource: boolean): Point {
            /// <summary>Sets the sourcePoint or targetPoint to the given Point and returns the new point</summary>
            /// <param name="point">Point to be used as the new source or target point</param>
            /// <param name="isSource">Boolean that specifies if the source or target point</param>
            /// <returns type="Object"></returns>
            if (isSource) {
                this.sourcePoint = point;
            } else {
                this.targetPoint = point;
            }

            return point;
        }

        rotate(angle, cx) {
            /// <summary>Rotates the geometry by the given angle around the given center. That is, x and y of the geometry, the sourcePoint, targetPoint and all points are translated by the given amount. 
            /// x and y are only translated if relative is false.</summary>
            /// <param name="angle" type="number">rotation angle in degrees</param>
            /// <param name="cx" type="Point">center of the rotation</param>
            var rad = Utils.toRadians(angle);
            var cos = Math.cos(rad);
            var sin = Math.sin(rad);

            // Rotates the geometry
            var pt: Point;

            if (!this.relative) {
                var ct = new Point(this.getCenterX(), this.getCenterY());
                pt = Utils.getRotatedPoint(ct, cos, sin, cx);
                this.x = Math.round(pt.x - this.width / 2);
                this.y = Math.round(pt.y - this.height / 2);
            }

            // Rotates the source point
            if (this.sourcePoint != null) {
                pt = Utils.getRotatedPoint(this.sourcePoint, cos, sin, cx);
                this.sourcePoint.x = Math.round(pt.x);
                this.sourcePoint.y = Math.round(pt.y);
            }

            // Translates the target point
            if (this.targetPoint != null) {
                pt = Utils.getRotatedPoint(this.targetPoint, cos, sin, cx);
                this.targetPoint.x = Math.round(pt.x);
                this.targetPoint.y = Math.round(pt.y);
            }

            // Translate the control points
            if (this.points != null) {
                for (var i = 0; i < this.points.length; i++) {
                    if (this.points[i] != null) {
                        pt = Utils.getRotatedPoint(this.points[i], cos, sin, cx);
                        this.points[i].x = Math.round(pt.x);
                        this.points[i].y = Math.round(pt.y);
                    }
                }
            }
        }

        translate(dx: number, dy: number) {
            /// <summary> Translates the geometry by the specified amount. x and y are only translated if relative is false. If translateControlPoints is false, then points are not modified by this function.</summary>
            /// <param name="dx" type="Number">x-coordinate of the translation</param>
            /// <param name="dy" type="Object">y-coordinate of the translation</param>

            // Translates the geometry
            if (!this.relative) {
                this.x += dx;
                this.y += dy;
            }

            // Translates the source point
            if (this.sourcePoint != null) {
                this.sourcePoint.x += dx;
                this.sourcePoint.y += dy;
            }

            // Translates the target point
            if (this.targetPoint != null) {
                this.targetPoint.x += dx;
                this.targetPoint.y += dy;
            }

            // Translate the control points
            if (this.translateControlPoints && this.points != null) {
                for (var i = 0; i < this.points.length; i++) {
                    if (this.points[i] != null) {
                        this.points[i].x += dx;
                        this.points[i].y += dy;
                    }
                }
            }
        }

        scale(sx: number, sy: number) {
            /// <summary>Scales the geometry by the given amount. x, y, width and height are only scaled if relative is false.</summary>
            /// <param name="sx" type="number">horizontal scale factor</param>
            /// <param name="sy" type="number">vertical scale factor</param>

            // Translates the geometry
            if (!this.relative) {
                this.x *= sx;
                this.y *= sy;
                this.width *= sx;
                this.height *= sy;
            }

            // Translates the source point
            if (this.sourcePoint != null) {
                this.sourcePoint.x *= sx;
                this.sourcePoint.y *= sy;
            }

            // Translates the target point
            if (this.targetPoint != null) {
                this.targetPoint.x *= sx;
                this.targetPoint.y *= sy;
            }

            // Translate the control points
            if (this.points != null) {
                for (var i = 0; i < this.points.length; i++) {
                    if (this.points[i] != null) {
                        this.points[i].x *= sx;
                        this.points[i].y *= sy;
                    }
                }
            }
        }

        equals(obj: Geometry): boolean {
            /// <summary>Returns true if the given object equals this geometry</summary>
            /// <param name="obj" type="Geometry"></param>
            /// <returns type=""></returns>
            return super.equals(obj) &&
                this.relative === obj.relative &&
                ((this.sourcePoint == null && obj.sourcePoint == null) || (this.sourcePoint != null && this.sourcePoint.equals(obj.sourcePoint))) &&
                ((this.targetPoint == null && obj.targetPoint == null) || (this.targetPoint != null && this.targetPoint.equals(obj.targetPoint))) &&
                ((this.points == null && obj.points == null) || (this.points != null && Utils.equalPoints(this.points, obj.points))) &&
                ((this.alternateBounds == null && obj.alternateBounds == null) || (this.alternateBounds != null && this.alternateBounds.equals(obj.alternateBounds))) &&
                ((this.offset == null && obj.offset == null) || (this.offset != null && this.offset.equals(obj.offset)));
        }

        setRelative(value: boolean) {
            this.relative = value;
        }

        applySizeRestrictions(rect: Rectangle): Rectangle {
            var restrictions = this.sizeRestrictions;
            if (restrictions) {
                if (restrictions.minWidth)
                    rect.width = Math.max(rect.width, restrictions.minWidth());
                if (restrictions.maxWidth)
                    rect.width = Math.min(rect.width, restrictions.maxWidth());
                if (restrictions.minHeight)
                    rect.height = Math.max(rect.height, restrictions.minHeight());
                if (restrictions.maxHeight)
                    rect.height = Math.min(rect.height, restrictions.maxHeight());
            }
            return rect;
        }

        get maxWidth(): number {
            if (this.sizeRestrictions && this.sizeRestrictions.maxWidth)
                return this.sizeRestrictions.maxWidth();
            return NaN;
        }
    }
}
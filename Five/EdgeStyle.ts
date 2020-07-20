module Five {
    export interface IEdgeStyle {
	    /* Implements an entity relation style for edges (as used in database schema diagrams). At the time the function is called, the result
        * array contains a placeholder (null) for the first and last absolute point, that is, the point where the edge and source terminal are connected.
        * The implementation of the style then adds all intermediate waypoints except for the last point, that is, the connection point between the
        * edge and the target terminal. The first ant the last point in the result array are then replaced with Points that take into account
        * the terminal's perimeter and next point on the edge.
		* @param state  Edge to be updated
		* @param source Source terminal.
		* @param target target terminal
		* @param points List of relative control points 
		* @param result Array of <Points> that represent the actual points of the edge. 
		*/
        (state: CellState, source: CellState, target: CellState, points: Point[], result: Point[]): void;  
    }

    export class EdgeStyle {

        static entityRelation(state: CellState, source: CellState, target: CellState, points: Point[], result: Point[]) {
            var view = state.view;
            var graph = view.graph;
            var segment = Utils.getInt(state.style, Constants.styleSegment, Constants.entitySegment) * view.scale;

            var pts = state.absolutePoints;
            var p0 = pts[0];
            var pe = pts[pts.length - 1];

            var isSourceLeft = false;
            var constraint: number;
            if (p0 != null) {
                source = new CellState(null, null, null);
                source.x = p0.x;
                source.y = p0.y;
            } else if (source != null) {
                constraint = Utils.getPortConstraints(source, state, true, Constants.directionMaskNone);
                if (constraint != Constants.directionMaskNone) {
                    isSourceLeft = constraint == Constants.directionMaskWest;
                } else {
                    var sourceGeometry = graph.getCellGeometry(source.cell);

                    if (sourceGeometry.relative) {
                        isSourceLeft = sourceGeometry.x <= 0.5;
                    } else if (target != null) {
                        isSourceLeft = target.x + target.width < source.x;
                    }
                }
            } else {
                return;
            }

            var isTargetLeft = true;

            if (pe != null) {
                target = new CellState(null, null, null);
                target.x = pe.x;
                target.y = pe.y;
            } else if (target != null) {
                constraint = Utils.getPortConstraints(target, state, false, Constants.directionMaskNone);
                if (constraint != Constants.directionMaskNone) {
                    isTargetLeft = constraint == Constants.directionMaskWest;
                } else {
                    var targetGeometry = graph.getCellGeometry(target.cell);

                    if (targetGeometry.relative) {
                        isTargetLeft = targetGeometry.x <= 0.5;
                    } else if (source != null) {
                        isTargetLeft = source.x + source.width < target.x;
                    }
                }
            }

            if (source != null && target != null) {
                var x0 = (isSourceLeft) ? source.x : source.x + source.width;
                var y0 = view.getRoutingCenterY(source);

                var xe = (isTargetLeft) ? target.x : target.x + target.width;
                var ye = view.getRoutingCenterY(target);

                var seg = segment;

                var dx = (isSourceLeft) ? -seg : seg;
                var dep = new Point(x0 + dx, y0);

                dx = (isTargetLeft) ? -seg : seg;
                var arr = new Point(xe + dx, ye);

                // Adds intermediate points if both go out on same side
                if (isSourceLeft == isTargetLeft) {
                    var x = (isSourceLeft) ?
                        Math.min(x0, xe) - segment :
                        Math.max(x0, xe) + segment;

                    result.push(new Point(x, y0));
                    result.push(new Point(x, ye));
                } else if ((dep.x < arr.x) == isSourceLeft) {
                    var midY = y0 + (ye - y0) / 2;

                    result.push(dep);
                    result.push(new Point(dep.x, midY));
                    result.push(new Point(arr.x, midY));
                    result.push(arr);
                } else {
                    result.push(dep);
                    result.push(arr);
                }
            }
        } // Implements a self-reference, aka. loop.
        static loop(state: CellState, source: CellState, target: CellState, points: Point[], result: Point[]) {
            var pts = state.absolutePoints;

            var p0 = pts[0];
            var pe = pts[pts.length - 1];
            var pt: Point;
            if (p0 != null && pe != null) {
                // TODO: Implement loop routing for different edge styles
                /*var edgeStyle = !Utils.getValue(state.style,
                        Constants.STYLE_NOEDGESTYLE, false) ?
                                state.style[Constants.STYLE_EDGE] :
                                    null;
			
                if (edgeStyle != null && edgeStyle != '')
                {
				
                }
                else */
                if (points != null && points.length > 0) {
                    for (var i = 0; i < points.length; i++) {
                        pt = points[i];
                        pt = state.view.transformControlPoint(state, pt);
                        result.push(new Point(pt.x, pt.y));
                    }
                }

                return;
            }

            if (source != null) {
                var view = state.view;
                var graph = view.graph;
                pt = (points != null && points.length > 0) ? points[0] : null;
                if (pt != null) {
                    pt = view.transformControlPoint(state, pt);

                    if (Utils.contains(source, pt.x, pt.y)) {
                        pt = null;
                    }
                }

                var x = 0;
                var dx = 0;
                var y = 0;
                var dy = 0;

                var seg = Utils.getInt(state.style, Constants.styleSegment, graph.gridSize) * view.scale;
                var dir: Direction = Direction[Utils.getValue(state.style, Constants.styleDirection, Direction[Direction.West])];

                if (dir == Direction.North || dir == Direction.South) {
                    x = view.getRoutingCenterX(source);
                    dx = seg;
                } else {
                    y = view.getRoutingCenterY(source);
                    dy = seg;
                }

                if (pt == null ||
                    pt.x < source.x ||
                    pt.x > source.x + source.width) {
                    if (pt != null) {
                        x = pt.x;
                        dy = Math.max(Math.abs(y - pt.y), dy);
                    } else {
                        if (dir == Direction.North) {
                            y = source.y - 2 * dx;
                        } else if (dir == Direction.South) {
                            y = source.y + source.height + 2 * dx;
                        } else if (dir == Direction.East) {
                            x = source.x - 2 * dy;
                        } else {
                            x = source.x + source.width + 2 * dy;
                        }
                    }
                } else if (pt != null) {
                    x = view.getRoutingCenterX(source);
                    dx = Math.max(Math.abs(x - pt.x), dy);
                    y = pt.y;
                    dy = 0;
                }

                result.push(new Point(x - dx, y - dy));
                result.push(new Point(x + dx, y + dy));
            }
        }

        /**
	     * Uses either <SideToSide> or <TopToBottom> depending on the horizontal
	     * flag in the cell style. <SideToSide> is used if horizontal is true or
	     * unspecified. See <EntityRelation> for a description of the
	     * parameters.
	     */
        static elbowConnector(state: CellState, source: CellState, target: CellState, points: Point[], result: Point[]) {
            var pt = (points != null && points.length > 0) ? points[0] : null;

            var vertical = false;
            var horizontal = false;

            if (source != null && target != null) {
                var left: number;
                var right: number;
                var top: number;
                var bottom: number;
                if (pt != null) {
                    left = Math.min(source.x, target.x);
                    right = Math.max(source.x + source.width,
                        target.x + target.width);
                    top = Math.min(source.y, target.y);
                    bottom = Math.max(source.y + source.height,
                        target.y + target.height);
                    pt = state.view.transformControlPoint(state, pt);

                    vertical = pt.y < top || pt.y > bottom;
                    horizontal = pt.x < left || pt.x > right;
                } else {
                    left = Math.max(source.x, target.x);
                    right = Math.min(source.x + source.width,
                        target.x + target.width);
                    vertical = left == right;

                    if (!vertical) {
                        top = Math.max(source.y, target.y);
                        bottom = Math.min(source.y + source.height,
                            target.y + target.height);
                        horizontal = top == bottom;
                    }
                }
            }

            if (!horizontal && (vertical ||
                state.style[Constants.styleElbow] == Constants.elbowVertical)) {
                EdgeStyle.topToBottom(state, source, target, points, result);
            } else {
                EdgeStyle.sideToSide(state, source, target, points, result);
            }
        }

        // Implements a vertical elbow edge. See <EntityRelation> for a description of the parameters.
        static sideToSide(state: CellState, source: CellState, target: CellState, points: Point[], result: Point[]) {
            var view = state.view;
            var pt = (points != null && points.length > 0) ? points[0] : null;
            var pts = state.absolutePoints;
            var p0 = pts[0];
            var pe = pts[pts.length - 1];

            if (pt != null) {
                pt = view.transformControlPoint(state, pt);
            }

            if (p0 != null) {
                source = new CellState(null, null, null);
                source.x = p0.x;
                source.y = p0.y;
            }

            if (pe != null) {
                target = new CellState(null, null, null);
                target.x = pe.x;
                target.y = pe.y;
            }

            if (source != null && target != null) {
                var left = Math.max(source.x, target.x);
                var right = Math.min(source.x + source.width, target.x + target.width);

                var x = (pt != null) ? pt.x : right + (left - right) / 2;

                var y1 = view.getRoutingCenterY(source);
                var y2 = view.getRoutingCenterY(target);

                if (pt != null) {
                    if (pt.y >= source.y && pt.y <= source.y + source.height) {
                        y1 = pt.y;
                    }

                    if (pt.y >= target.y && pt.y <= target.y + target.height) {
                        y2 = pt.y;
                    }
                }

                if (!Utils.contains(target, x, y1) &&
                    !Utils.contains(source, x, y1)) {
                    result.push(new Point(x, y1));
                }

                if (!Utils.contains(target, x, y2) &&
                    !Utils.contains(source, x, y2)) {
                    result.push(new Point(x, y2));
                }

                if (result.length == 1) {
                    if (pt != null) {
                        if (!Utils.contains(target, x, pt.y) &&
                            !Utils.contains(source, x, pt.y)) {
                            result.push(new Point(x, pt.y));
                        }
                    } else {
                        var t = Math.max(source.y, target.y);
                        var b = Math.min(source.y + source.height,
                            target.y + target.height);

                        result.push(new Point(x, t + (b - t) / 2));
                    }
                }
            }
        }

        // Implements a horizontal elbow edge. See <EntityRelation> for a description of the parameters.
        static topToBottom(state: CellState, source: CellState, target: CellState, points: Point[], result: Point[]) {
            var view = state.view;
            var pt = (points != null && points.length > 0) ? points[0] : null;
            var pts = state.absolutePoints;
            var p0 = pts[0];
            var pe = pts[pts.length - 1];

            if (pt != null) {
                pt = view.transformControlPoint(state, pt);
            }

            if (p0 != null) {
                source = new CellState(null, null, null);
                source.x = p0.x;
                source.y = p0.y;
            }

            if (pe != null) {
                target = new CellState(null, null, null);
                target.x = pe.x;
                target.y = pe.y;
            }

            if (source != null && target != null) {
                var t = Math.max(source.y, target.y);
                var b = Math.min(source.y + source.height,
                    target.y + target.height);

                var x = view.getRoutingCenterX(source);

                if (pt != null &&
                    pt.x >= source.x &&
                    pt.x <= source.x + source.width) {
                    x = pt.x;
                }

                var y = (pt != null) ? pt.y : b + (t - b) / 2;

                if (!Utils.contains(target, x, y) &&
                    !Utils.contains(source, x, y)) {
                    result.push(new Point(x, y));
                }

                if (pt != null &&
                    pt.x >= target.x &&
                    pt.x <= target.x + target.width) {
                    x = pt.x;
                } else {
                    x = view.getRoutingCenterX(target);
                }

                if (!Utils.contains(target, x, y) &&
                    !Utils.contains(source, x, y)) {
                    result.push(new Point(x, y));
                }

                if (result.length == 1) {
                    if (pt != null && result.length == 1) {
                        if (!Utils.contains(target, pt.x, y) &&
                            !Utils.contains(source, pt.x, y)) {
                            result.push(new Point(pt.x, y));
                        }
                    } else {
                        var l = Math.max(source.x, target.x);
                        var r = Math.min(source.x + source.width,
                            target.x + target.width);

                        result.push(new Point(l + (r - l) / 2, y));
                    }
                }
            }
        }

        static topToSide(state: CellState, source: CellState, target: CellState, points: Point[], result: Point[]) {
            var view = state.view;
            var pts = state.absolutePoints;
            var p0 = pts[0];
            var pe = pts[pts.length - 1];

            if (p0 != null) {
                source = new CellState(null, null, null);
                source.x = p0.x;
                source.y = p0.y;
            }

            if (pe != null) {
                target = new CellState(null, null, null);
                target.x = pe.x;
                target.y = pe.y;
            }

            if (source != null && target != null) {

	            var tolerance = 10;
	            var sourceY = view.getRoutingCenterY(source);
				var targetY = view.getRoutingCenterY(target);

				function diagonalConnector() : Point
	            {
					return new Point(view.getRoutingCenterX(source), view.getRoutingCenterY(target));    
				}

				function horizontalConnector() : Point {
					var targetHorizontalOffset = source.x < target.x ? 0.1 : 0.9;
					var sourceHorizontalOffset = 1 - targetHorizontalOffset;
					var p1 = new Point(source.x + sourceHorizontalOffset * source.width, source.y + 0.5 * source.height);
					var p2 = new Point(target.x + targetHorizontalOffset * target.width, target.y + 0.5 * target.height);
						
					return Utils.MiddlePoint(p1, p2);    
				}

	            var p = Math.abs(sourceY - targetY) + tolerance < Math.max(target.height, source.height * 0.75) ?
		            horizontalConnector() :
		            diagonalConnector();
				
				result.push(p);
            }
        }

        // Implements an orthogonal edge style. Use <mxEdgeSegmentHandler> as an interactive handler for this style.
        static segmentConnector(state: CellState, source: CellState, target: CellState, hints: Point[], result: Point[]) {
            // Creates array of all way- and terminalpoints
            var pts = state.absolutePoints;
            var horizontal = true;
            var hint = null;

            // Adds the first point
            var pt = pts[0];

            if (pt == null && source != null) {
                pt = new Point(state.view.getRoutingCenterX(source), state.view.getRoutingCenterY(source));
            } else if (pt != null) {
                pt = Utils.clone(pt);
            }

            var lastInx = pts.length - 1;

            // Adds the waypoints
            if (hints != null && hints.length > 0) {
                hint = state.view.transformControlPoint(state, hints[0]);

                var currentTerm = source;
                var currentPt = pts[0];
                var hozChan = false;
                var vertChan = false;
                var currentHint = hint;
                var hintsLen = hints.length;
	            var i: number;
	            for (i = 0; i < 2; i++) {
                    var fixedVertAlign = currentPt != null && currentPt.x == currentHint.x;
                    var fixedHozAlign = currentPt != null && currentPt.y == currentHint.y;
                    var inHozChan = currentTerm != null && (currentHint.y >= currentTerm.y &&
                        currentHint.y <= currentTerm.y + currentTerm.height);
                    var inVertChan = currentTerm != null && (currentHint.x >= currentTerm.x &&
                        currentHint.x <= currentTerm.x + currentTerm.width);

                    hozChan = fixedHozAlign || (currentPt == null && inHozChan);
                    vertChan = fixedVertAlign || (currentPt == null && inVertChan);

                    if (currentPt != null && (!fixedHozAlign && !fixedVertAlign) && (inHozChan || inVertChan)) {
                        horizontal = !inHozChan;
                        break;
                    }

                    if (vertChan || hozChan) {
                        horizontal = hozChan;

                        if (i == 1) {
                            // Work back from target end
                            horizontal = hints.length % 2 == 0 ? hozChan : vertChan;
                        }

                        break;
                    }

                    currentTerm = target;
                    currentPt = pts[lastInx];
                    currentHint = state.view.transformControlPoint(state, hints[hintsLen - 1]);
                }

                if (horizontal && ((pts[0] != null && pts[0].y != hint.y) ||
                (pts[0] == null && source != null &&
                (hint.y < source.y || hint.y > source.y + source.height)))) {
                    result.push(new Point(pt.x, hint.y));
                } else if (!horizontal && ((pts[0] != null && pts[0].x != hint.x) ||
                (pts[0] == null && source != null &&
                (hint.x < source.x || hint.x > source.x + source.width)))) {
                    result.push(new Point(hint.x, pt.y));
                }

                if (horizontal) {
                    pt.y = hint.y;
                } else {
                    pt.x = hint.x;
                }

                for (i = 0; i < hints.length; i++) {
                    horizontal = !horizontal;
                    hint = state.view.transformControlPoint(state, hints[i]);

                    //				mxLog.show();
                    //				mxLog.debug('hint', i, hint.x, hint.y);

                    if (horizontal) {
                        pt.y = hint.y;
                    } else {
                        pt.x = hint.x;
                    }

                    result.push(pt.clone());
                }
            } else {
                hint = pt;
                // FIXME: First click in connect preview toggles orientation
                horizontal = true;
            }

            // Adds the last point
            pt = pts[lastInx];

            if (pt == null && target != null) {
                pt = new Point(state.view.getRoutingCenterX(target), state.view.getRoutingCenterY(target));
            }

            if (horizontal && ((pts[lastInx] != null && pts[lastInx].y != hint.y) ||
            (pts[lastInx] == null && target != null &&
            (hint.y < target.y || hint.y > target.y + target.height)))) {
                result.push(new Point(pt.x, hint.y));
            } else if (!horizontal && ((pts[lastInx] != null && pts[lastInx].x != hint.x) ||
            (pts[lastInx] == null && target != null &&
            (hint.x < target.x || hint.x > target.x + target.width)))) {
                result.push(new Point(hint.x, pt.y));
            }

            // Removes bends inside the source terminal for floating ports
            if (pts[0] == null && source != null) {
                while (result.length > 1 && Utils.contains(source, result[1].x, result[1].y)) {
                    result = result.splice(1, 1);
                }
            }

            // Removes bends inside the target terminal
            if (pts[lastInx] == null && target != null) {
                while (result.length > 1 && Utils.contains(target, result[result.length - 1].x, result[result.length - 1].y)) {
                    result = result.splice(result.length - 1, 1);
                }
            }

        }

        static orthBuffer = 10;

        static orthPointsFallback = true;

        static dirVectors = [[-1, 0], [0, -1], [1, 0], [0, 1], [-1, 0], [0, -1], [1, 0]];

        static wayPoints1 = [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]];

        static routePatterns = [
            [
                [513, 2308, 2081, 2562], [513, 1090, 514, 2184, 2114, 2561],
                [513, 1090, 514, 2564, 2184, 2562],
                [513, 2308, 2561, 1090, 514, 2568, 2308]
            ],
            [
                [514, 1057, 513, 2308, 2081, 2562], [514, 2184, 2114, 2561],
                [514, 2184, 2562, 1057, 513, 2564, 2184],
                [514, 1057, 513, 2568, 2308, 2561]
            ],
            [
                [1090, 514, 1057, 513, 2308, 2081, 2562], [2114, 2561],
                [1090, 2562, 1057, 513, 2564, 2184],
                [1090, 514, 1057, 513, 2308, 2561, 2568]
            ],
            [
                [2081, 2562], [1057, 513, 1090, 514, 2184, 2114, 2561],
                [1057, 513, 1090, 514, 2184, 2562, 2564],
                [1057, 2561, 1090, 514, 2568, 2308]
            ]
        ];

        static inlineRoutePatterns = [
            [null, [2114, 2568], null, null],
            [null, [514, 2081, 2114, 2568], null, null],
            [null, [2114, 2561], null, null],
            [
                [2081, 2562], [1057, 2114, 2568],
                [2184, 2562],
                null
            ]
        ];
        static vertexSeperations = [];

        static limits = [[0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0]];

        static leftMask = 32;

        static topMask = 64;

        static rightMask = 128;

        static bottomMask = 256;

        static left = 1;

        static top = 2;

        static right= 4;

        static bottom= 8;

        // TODO remove magic numbers
        static sideMask= 480;
        //EdgeStyle.LEFT_MASK | EdgeStyle.TOP_MASK | EdgeStyle.RIGHT_MASK
        //| EdgeStyle.BOTTOM_MASK;

        static centerMask= 512;

        static sourceMask= 1024;

        static targetMask= 2048;

        static vertexMask= 3072;

// EdgeStyle.SOURCE_MASK | EdgeStyle.TARGET_MASK,

        /**
	 * Function: OrthConnector
	 * 
	 * Implements a local orthogonal router between the given
	 * cells.
	 * 
	 * Parameters:
	 * 
	 * state - <mxCellState> that represents the edge to be updated.
	 * source - <mxCellState> that represents the source terminal.
	 * target - <mxCellState> that represents the target terminal.
	 * points - List of relative control points.
	 * result - Array of <Points> that represent the actual points of the
	 * edge.
	 * 
	 */
        static orthConnector(state: CellState, source: CellState, target: CellState, points: Point[], result: Point[]) {
            var graph = state.view.graph;
            var sourceEdge = source == null ? false : graph.getModel().isEdge(source.cell);
            var targetEdge = target == null ? false : graph.getModel().isEdge(target.cell);

            if (EdgeStyle.orthPointsFallback && (points != null && points.length > 0) || (sourceEdge) || (targetEdge)) {
                EdgeStyle.segmentConnector(state, source, target, points, result);
                return;
            }

            var pts = state.absolutePoints;
            var p0 = pts[0];
            var pe = pts[pts.length - 1];

            var sourceX = source != null ? source.x : p0.x;
            var sourceY = source != null ? source.y : p0.y;
            var sourceWidth = source != null ? source.width : 1;
            var sourceHeight = source != null ? source.height : 1;

            var targetX = target != null ? target.x : pe.x;
            var targetY = target != null ? target.y : pe.y;
            var targetWidth = target != null ? target.width : 1;
            var targetHeight = target != null ? target.height : 1;

            var scaledOrthBuffer = state.view.scale * EdgeStyle.orthBuffer;
            // Determine the side(s) of the source and target vertices
            // that the edge may connect to
            // portConstraint [source, target]
            var portConstraint = [Constants.directionMaskAll, Constants.directionMaskAll];
            var rotation = 0;
            var newRect: Rectangle;
            if (source != null) {
                portConstraint[0] = Utils.getPortConstraints(source, state, true, Constants.directionMaskAll);
                rotation = Utils.getInt(source.style, Constants.styleRotation, 0);

                if (rotation != 0) {
                    newRect = Utils.getBoundingBox(new Rectangle(sourceX, sourceY, sourceWidth, sourceHeight), rotation);
                    sourceX = newRect.x;
                    sourceY = newRect.y;
                    sourceWidth = newRect.width;
                    sourceHeight = newRect.height;
                }
            }

            if (target != null) {
                portConstraint[1] = Utils.getPortConstraints(target, state, false,
                    Constants.directionMaskAll);
                rotation = Utils.getInt(target.style, Constants.styleRotation, 0);

                if (rotation != 0) {
                    newRect = Utils.getBoundingBox(new Rectangle(targetX, targetY, targetWidth, targetHeight), rotation);
                    targetX = newRect.x;
                    targetY = newRect.y;
                    targetWidth = newRect.width;
                    targetHeight = newRect.height;
                }
            }

            var dir = [0, 0];

            // Work out which faces of the vertices present against each other
            // in a way that would allow a 3-segment connection if port constraints
            // permitted.
            // geo -> [source, target] [x, y, width, height]
            var geo = [
                [sourceX, sourceY, sourceWidth, sourceHeight],
                [targetX, targetY, targetWidth, targetHeight]
            ];
	        var i: number;
	        for (i = 0; i < 2; i++) {
                EdgeStyle.limits[i][1] = geo[i][0] - scaledOrthBuffer;
                EdgeStyle.limits[i][2] = geo[i][1] - scaledOrthBuffer;
                EdgeStyle.limits[i][4] = geo[i][0] + geo[i][2] + scaledOrthBuffer;
                EdgeStyle.limits[i][8] = geo[i][1] + geo[i][3] + scaledOrthBuffer;
            }

            // Work out which quad the target is in
            var sourceCenX = geo[0][0] + geo[0][2] / 2.0;
            var sourceCenY = geo[0][1] + geo[0][3] / 2.0;
            var targetCenX = geo[1][0] + geo[1][2] / 2.0;
            var targetCenY = geo[1][1] + geo[1][3] / 2.0;

            var dx = sourceCenX - targetCenX;
            var dy = sourceCenY - targetCenY;

            var quad = 0;

            if (dx < 0) {
                if (dy < 0) {
                    quad = 2;
                } else {
                    quad = 1;
                }
            } else {
                if (dy <= 0) {
                    quad = 3;

                    // Special case on x = 0 and negative y
                    if (dx == 0) {
                        quad = 2;
                    }
                }
            }

            // Check for connection constraints
            var currentTerm = null;

            if (source != null) {
                currentTerm = p0;
            }

            var constraint = [[0.5, 0.5], [0.5, 0.5]];

            for (i = 0; i < 2; i++) {
                if (currentTerm != null) {
                    constraint[i][0] = (currentTerm.x - geo[i][0]) / geo[i][2];

                    if (constraint[i][0] < 0.01) {
                        dir[i] = Constants.directionMaskWest;
                    } else if (constraint[i][0] > 0.99) {
                        dir[i] = Constants.directionMaskEast;
                    }

                    constraint[i][1] = (currentTerm.y - geo[i][1]) / geo[i][3];

                    if (constraint[i][1] < 0.01) {
                        dir[i] = Constants.directionMaskNorth;
                    } else if (constraint[i][1] > 0.99) {
                        dir[i] = Constants.directionMaskSouth;
                    }
                }

                currentTerm = null;

                if (target != null) {
                    currentTerm = pe;
                }
            }

            var sourceTopDist = geo[0][1] - (geo[1][1] + geo[1][3]);
            var sourceLeftDist = geo[0][0] - (geo[1][0] + geo[1][2]);
            var sourceBottomDist = geo[1][1] - (geo[0][1] + geo[0][3]);
            var sourceRightDist = geo[1][0] - (geo[0][0] + geo[0][2]);

            EdgeStyle.vertexSeperations[1] = Math.max(sourceLeftDist - 2 * scaledOrthBuffer, 0);
            EdgeStyle.vertexSeperations[2] = Math.max(sourceTopDist - 2 * scaledOrthBuffer, 0);
            EdgeStyle.vertexSeperations[4] = Math.max(sourceBottomDist - 2 * scaledOrthBuffer, 0);
            EdgeStyle.vertexSeperations[3] = Math.max(sourceRightDist - 2 * scaledOrthBuffer, 0);

            //==============================================================
            // Start of source and target direction determination

            // Work through the preferred orientations by relative positioning
            // of the vertices and list them in preferred and available order

            var dirPref = [];
            var horPref: number[] = [];
            var vertPref: number[] = [];

            horPref[0] = (sourceLeftDist >= sourceRightDist) ? Constants.directionMaskWest : Constants.directionMaskEast;
            vertPref[0] = (sourceTopDist >= sourceBottomDist) ? Constants.directionMaskNorth: Constants.directionMaskSouth;

            horPref[1] = Utils.reversePortConstraints(horPref[0]);
            vertPref[1] = Utils.reversePortConstraints(vertPref[0]);

            var preferredHorizDist = sourceLeftDist >= sourceRightDist ? sourceLeftDist
                : sourceRightDist;
            var preferredVertDist = sourceTopDist >= sourceBottomDist ? sourceTopDist
                : sourceBottomDist;

            var prefOrdering = [[0, 0], [0, 0]];
            var preferredOrderSet = false;

            // If the preferred port isn't available, switch it
            for (i = 0; i < 2; i++) {
                if (dir[i] != 0x0) {
                    continue;
                }

                if ((horPref[i] & portConstraint[i]) == 0) {
                    horPref[i] = Utils.reversePortConstraints(horPref[i]);
                }

                if ((vertPref[i] & portConstraint[i]) == 0) {
                    vertPref[i] = Utils
                        .reversePortConstraints(vertPref[i]);
                }

                prefOrdering[i][0] = vertPref[i];
                prefOrdering[i][1] = horPref[i];
            }

            if (preferredVertDist > scaledOrthBuffer * 2
                && preferredHorizDist > scaledOrthBuffer * 2) {
                // Possibility of two segment edge connection
                if (((horPref[0] & portConstraint[0]) > 0)
                    && ((vertPref[1] & portConstraint[1]) > 0)) {
                    prefOrdering[0][0] = horPref[0];
                    prefOrdering[0][1] = vertPref[0];
                    prefOrdering[1][0] = vertPref[1];
                    prefOrdering[1][1] = horPref[1];
                    preferredOrderSet = true;
                } else if (((vertPref[0] & portConstraint[0]) > 0)
                    && ((horPref[1] & portConstraint[1]) > 0)) {
                    prefOrdering[0][0] = vertPref[0];
                    prefOrdering[0][1] = horPref[0];
                    prefOrdering[1][0] = horPref[1];
                    prefOrdering[1][1] = vertPref[1];
                    preferredOrderSet = true;
                }
            }
            if (preferredVertDist > scaledOrthBuffer * 2 && !preferredOrderSet) {
                prefOrdering[0][0] = vertPref[0];
                prefOrdering[0][1] = horPref[0];
                prefOrdering[1][0] = vertPref[1];
                prefOrdering[1][1] = horPref[1];
                preferredOrderSet = true;

            }
            if (preferredHorizDist > scaledOrthBuffer * 2 && !preferredOrderSet) {
                prefOrdering[0][0] = horPref[0];
                prefOrdering[0][1] = vertPref[0];
                prefOrdering[1][0] = horPref[1];
                prefOrdering[1][1] = vertPref[1];
                preferredOrderSet = true;
            }

            // The source and target prefs are now an ordered list of
            // the preferred port selections
            // It the list can contain gaps, compact it

            for (i = 0; i < 2; i++) {
                if (dir[i] != 0x0) {
                    continue;
                }

                if ((prefOrdering[i][0] & portConstraint[i]) == 0) {
                    prefOrdering[i][0] = prefOrdering[i][1];
                }

                dirPref[i] = prefOrdering[i][0] & portConstraint[i];
                dirPref[i] |= (prefOrdering[i][1] & portConstraint[i]) << 8;
                dirPref[i] |= (prefOrdering[1 - i][i] & portConstraint[i]) << 16;
                dirPref[i] |= (prefOrdering[1 - i][1 - i] & portConstraint[i]) << 24;

                if ((dirPref[i] & 0xF) == 0) {
                    dirPref[i] = dirPref[i] << 8;
                }
                if ((dirPref[i] & 0xF00) == 0) {
                    dirPref[i] = (dirPref[i] & 0xF) | dirPref[i] >> 8;
                }
                if ((dirPref[i] & 0xF0000) == 0) {
                    dirPref[i] = (dirPref[i] & 0xFFFF)
                        | ((dirPref[i] & 0xF000000) >> 8);
                }

                dir[i] = dirPref[i] & 0xF;

                if (portConstraint[i] == Constants.directionMaskWest
                    || portConstraint[i] == Constants.directionMaskNorth
                    || portConstraint[i] == Constants.directionMaskEast
                    || portConstraint[i] == Constants.directionMaskSouth) {
                    dir[i] = portConstraint[i];
                }
            }

            //==============================================================
            // End of source and target direction determination

            var sourceIndex = dir[0] == Constants.directionMaskEast ? 3 : dir[0];
            var targetIndex = dir[1] == Constants.directionMaskEast ? 3 : dir[1];

            sourceIndex -= quad;
            targetIndex -= quad;

            if (sourceIndex < 1) {
                sourceIndex += 4;
            }
            if (targetIndex < 1) {
                targetIndex += 4;
            }

            var routePattern = EdgeStyle.routePatterns[sourceIndex - 1][targetIndex - 1];

            EdgeStyle.wayPoints1[0][0] = geo[0][0];
            EdgeStyle.wayPoints1[0][1] = geo[0][1];

            switch (dir[0]) {
            case Constants.directionMaskWest:
                EdgeStyle.wayPoints1[0][0] -= scaledOrthBuffer;
                EdgeStyle.wayPoints1[0][1] += constraint[0][1] * geo[0][3];
                break;
            case Constants.directionMaskSouth:
                EdgeStyle.wayPoints1[0][0] += constraint[0][0] * geo[0][2];
                EdgeStyle.wayPoints1[0][1] += geo[0][3] + scaledOrthBuffer;
                break;
            case Constants.directionMaskEast:
                EdgeStyle.wayPoints1[0][0] += geo[0][2] + scaledOrthBuffer;
                EdgeStyle.wayPoints1[0][1] += constraint[0][1] * geo[0][3];
                break;
            case Constants.directionMaskNorth:
                EdgeStyle.wayPoints1[0][0] += constraint[0][0] * geo[0][2];
                EdgeStyle.wayPoints1[0][1] -= scaledOrthBuffer;
                break;
            }

            var currentIndex = 0;

            // Orientation, 0 horizontal, 1 vertical
            var lastOrientation = (dir[0] & (Constants.directionMaskEast | Constants.directionMaskWest)) > 0 ? 0
                : 1;
            var initialOrientation = lastOrientation;
            var currentOrientation = 0;

            for (i = 0; i < routePattern.length; i++) {
                var nextDirection = routePattern[i] & 0xF;

                // Rotate the index of this direction by the quad
                // to get the real direction
                var directionIndex = nextDirection == Constants.directionMaskEast ? 3
                    : nextDirection;

                directionIndex += quad;

                if (directionIndex > 4) {
                    directionIndex -= 4;
                }

                var direction = EdgeStyle.dirVectors[directionIndex - 1];

                currentOrientation = (directionIndex % 2 > 0) ? 0 : 1;
                // Only update the current index if the point moved
                // in the direction of the current segment move,
                // otherwise the same point is moved until there is 
                // a segment direction change
                if (currentOrientation != lastOrientation) {
                    currentIndex++;
                    // Copy the previous way point into the new one
                    // We can't base the new position on index - 1
                    // because sometime elbows turn out not to exist,
                    // then we'd have to rewind.
                    EdgeStyle.wayPoints1[currentIndex][0] = EdgeStyle.wayPoints1[currentIndex - 1][0];
                    EdgeStyle.wayPoints1[currentIndex][1] = EdgeStyle.wayPoints1[currentIndex - 1][1];
                }

                var tar = (routePattern[i] & EdgeStyle.targetMask) > 0;
                var sou = (routePattern[i] & EdgeStyle.sourceMask) > 0;
                var side = (routePattern[i] & EdgeStyle.sideMask) >> 5;
                side = side << quad;

                if (side > 0xF) {
                    side = side >> 4;
                }

                var center = (routePattern[i] & EdgeStyle.centerMask) > 0;

                if ((sou || tar) && side < 9) {
                    var limit = 0;
                    var souTar = sou ? 0 : 1;

                    if (center && currentOrientation == 0) {
                        limit = geo[souTar][0] + constraint[souTar][0] * geo[souTar][2];
                    } else if (center) {
                        limit = geo[souTar][1] + constraint[souTar][1] * geo[souTar][3];
                    } else {
                        limit = EdgeStyle.limits[souTar][side];
                    }

                    if (currentOrientation == 0) {
                        var lastX = EdgeStyle.wayPoints1[currentIndex][0];
                        var deltaX = (limit - lastX) * direction[0];

                        if (deltaX > 0) {
                            EdgeStyle.wayPoints1[currentIndex][0] += direction[0]
                                * deltaX;
                        }
                    } else {
                        var lastY = EdgeStyle.wayPoints1[currentIndex][1];
                        var deltaY = (limit - lastY) * direction[1];

                        if (deltaY > 0) {
                            EdgeStyle.wayPoints1[currentIndex][1] += direction[1]
                                * deltaY;
                        }
                    }
                } else if (center) {
                    // Which center we're travelling to depend on the current direction
                    EdgeStyle.wayPoints1[currentIndex][0] += direction[0]
                        * Math.abs(EdgeStyle.vertexSeperations[directionIndex] / 2);
                    EdgeStyle.wayPoints1[currentIndex][1] += direction[1]
                        * Math.abs(EdgeStyle.vertexSeperations[directionIndex] / 2);
                }

                if (currentIndex > 0
                    && EdgeStyle.wayPoints1[currentIndex][currentOrientation] == EdgeStyle.wayPoints1[currentIndex - 1][currentOrientation]) {
                    currentIndex--;
                } else {
                    lastOrientation = currentOrientation;
                }
            }

            for (i = 0; i <= currentIndex; i++) {
                if (i == currentIndex) {
                    // Last point can cause last segment to be in
                    // same direction as jetty/approach. If so,
                    // check the number of points is consistent
                    // with the relative orientation of source and target
                    // jettys. Same orientation requires an even
                    // number of turns (points), different requires
                    // odd.
                    var targetOrientation = (dir[1] & (Constants.directionMaskEast | Constants.directionMaskWest)) > 0 ? 0
                        : 1;
                    var sameOrient = targetOrientation == initialOrientation ? 0 : 1;

                    // (currentIndex + 1) % 2 is 0 for even number of points,
                    // 1 for odd
                    if (sameOrient != (currentIndex + 1) % 2) {
                        // The last point isn't required
                        break;
                    }
                }

                result.push(new Point(EdgeStyle.wayPoints1[i][0], EdgeStyle.wayPoints1[i][1]));
            }
        }

        static getRoutePattern(dir: Direction[], quad, dx, dy) {
            var sourceIndex = dir[0] == Constants.directionMaskEast ? 3 : dir[0];
            var targetIndex = dir[1] == Constants.directionMaskEast ? 3 : dir[1];

            sourceIndex -= quad;
            targetIndex -= quad;

            if (sourceIndex < 1) {
                sourceIndex += 4;
            }
            if (targetIndex < 1) {
                targetIndex += 4;
            }

            var result = EdgeStyle.routePatterns[sourceIndex - 1][targetIndex - 1];

            if (dx == 0 || dy == 0) {
                if (EdgeStyle.inlineRoutePatterns[sourceIndex - 1][targetIndex - 1] != null) {
                    result = EdgeStyle.inlineRoutePatterns[sourceIndex - 1][targetIndex - 1];
                }
            }

            return result;
        }
    }

}

module Five {
    export class ConstraintHandler {
        // Handles constraints on connection targets.This class is in charge of showing fixed points when the mouse is over a vertex and 
        // handles constraints to establish new connections.

        constructor(graph: Graph) {
            /// <summary>factoryMethod - Optional function to create the edge.
            /// The function takes the source and target Cell as the first and second argument and returns the Cell that represents the new edge.</summary>
            this.graph = graph;
        }

        /** Image to be used as the image for fixed connection points.
         */
        private pointImage = new Image(FileStructure.imageBasePath + "/point.gif", 5, 5);

        /** Reference to the enclosing Graph. */
        private graph: Graph = null;

        /** Specifies if events are handled. Default is true.*/
        private enabled = true;

        /** Specifies the color for the highlight. Default is <Constants.DEFAULT_VALID_COLOR>. */
        private highlightColor = Constants.defaultValidColor;

        focusIcons: ImageShape[];
        focusPoints: Point[];
        focusHighlight: Shape;
        currentFocusArea: Rectangle;
        currentFocus: CellState;
        currentPoint: Point;
        constraints: ConnectionConstraint[];
        currentConstraint: ConnectionConstraint;

        private isEnabled() : boolean {
            return this.enabled;
        }

        private setEnabled(enabled: boolean) {
            this.enabled = enabled;
        }

        reset() {
            if (this.focusIcons != null) {
                for (var i = 0; i < this.focusIcons.length; i++) {
                    this.focusIcons[i].destroy();
                }

                this.focusIcons = null;
            }

            if (this.focusHighlight != null) {
                this.focusHighlight.destroy();
                this.focusHighlight = null;
            }

            this.currentConstraint = null;
            this.currentFocusArea = null;
            this.currentPoint = null;
            this.currentFocus = null;
            this.focusPoints = null;
        }

        /** Returns the tolerance to be used for intersecting connection points. */
        private getTolerance() : number {
            return this.graph.getTolerance();
        }

        private getImageForConstraint(state, constraint, point) {
            return this.pointImage;
        }

        /** Returns true if the given <mxMouseEvent> should be ignored in <update>. This implementation always returns false. */
        private isEventIgnored(me: MouseEventContext, source) {
            return false;
        }

        /** Returns true if the given state should be ignored. This always returns false. */
        private isStateIgnored(state: CellState, source) {
            return false;
        }

        /** Destroys the <focusIcons> if they exist. */
        private destroyIcons() {
            if (this.focusIcons != null) {
                for (var i = 0; i < this.focusIcons.length; i++) {
                    this.focusIcons[i].destroy();
                }

                this.focusIcons = null;
                this.focusPoints = null;
            }
        }

        /** Destroys the <focusHighlight> if one exists. */
        private destroyFocusHighlight() {
            if (this.focusHighlight != null) {
                this.focusHighlight.destroy();
                this.focusHighlight = null;
            }
        }

        /**
         * Function: update
         * 
         * Updates the state of this handler based on the given <mxMouseEvent>.
         * Source is a boolean indicating if the cell is a source or target.
         */
        update(me: MouseEventContext, source) {
            if (this.isEnabled() && !this.isEventIgnored(me, source)) {
                var tol = this.getTolerance();
                var mouse = new Rectangle(me.getGraphX() - tol, me.getGraphY() - tol, 2 * tol, 2 * tol);
                var connectable = (me.getCell() != null) ? this.graph.isCellConnectable(me.getCell()) : false;
                var i: number;
                if ((this.currentFocusArea == null || (!Utils.intersects(this.currentFocusArea, mouse) ||
                    (me.getState() != null && this.currentFocus != null && connectable)))) {
                    this.currentFocusArea = null;

                    if (me.getState() != this.currentFocus) {
                        this.currentFocus = null;
                        this.constraints = (me.getState() != null && connectable && !this.isStateIgnored(me.getState(), source)) ?
                        this.graph.getAllConnectionConstraints(me.getState(), source) : null;

                        // Only uses cells which have constraints
                        if (this.constraints != null) {
                            this.currentFocus = me.getState();
                            this.currentFocusArea = new Rectangle(me.getState().x, me.getState().y, me.getState().width, me.getState().height);

                            if (this.focusIcons != null) {
                                for (i = 0; i < this.focusIcons.length; i++) {
                                    this.focusIcons[i].destroy();
                                }

                                this.focusIcons = null;
                                this.focusPoints = null;
                            }

                            this.focusIcons = [];
                            this.focusPoints = [];

                            for (i = 0; i < this.constraints.length; i++) {
                                var cp = this.graph.getConnectionPoint(me.getState(), this.constraints[i]);
                                var img = this.getImageForConstraint(me.getState(), this.constraints[i], cp);

                                var src = img.src;
                                var bounds = new Rectangle(cp.x - img.width / 2,
                                    cp.y - img.height / 2, img.width, img.height);
                                var icon = new ImageShape(bounds, src);
                                icon.dialect = (this.graph.dialect != Dialect.Svg) ? Dialect.MixedHtml : Dialect.Svg;
                                icon.preserveImageAspect = false;
                                icon.init(this.graph.getView().getDecoratorPane());

                                // Fixes lost event tracking for images in quirks / IE8 standards
                                if (Client.isQuirks || document.documentMode == 8) {
                                    Events.addListener(icon.node, "dragstart", evt => {
                                        Events.consume(evt);

                                        return false;
                                    });
                                }

                                // Move the icon behind all other overlays
                                if (icon.node.previousSibling != null) {
                                    icon.node.parentNode.insertBefore(icon.node, icon.node.parentNode.firstChild);
                                }

                                var getState = Utils.bind(this, () => {
                                    return (this.currentFocus != null) ? this.currentFocus : me.getState();
                                });

                                icon.redraw();

                                Events.redirectMouseEvents(icon.node, this.graph, getState);
                                this.currentFocusArea.add(icon.bounds);
                                this.focusIcons.push(icon);
                                this.focusPoints.push(cp);
                            }

                            this.currentFocusArea.grow(tol);
                        }
                        else {
                            this.destroyIcons();
                            this.destroyFocusHighlight();
                        }
                    }
                }

                this.currentConstraint = null;
                this.currentPoint = null;

                if (this.focusIcons != null && this.constraints != null &&
                    (me.getState() == null || this.currentFocus == me.getState())) {
                    for (i = 0; i < this.focusIcons.length; i++) {
                        if (Utils.intersects(this.focusIcons[i].bounds, mouse)) {
                            this.currentConstraint = this.constraints[i];
                            this.currentPoint = this.focusPoints[i];

                            var tmp = this.focusIcons[i].bounds.clone();
                            var delta = Client.isIe ? 3 : 2;
                            tmp.grow(delta);

                            if (Client.isIe) {
                                tmp.width -= 1;
                                tmp.height -= 1;
                            }

                            if (this.focusHighlight == null) {
                                var hl = new RectangleShape(tmp, null, this.highlightColor, 3);
                                hl.pointerEvents = false;

                                hl.dialect = (this.graph.dialect == Dialect.Svg) ? Dialect.Svg : Dialect.Vml;
                                hl.init(this.graph.getView().getOverlayPane());
                                this.focusHighlight = hl;

                                var getState1 = Utils.bind(this, () => {
                                    return (this.currentFocus != null) ? this.currentFocus : me.getState();
                                });

                                Events.redirectMouseEvents(hl.node, this.graph, getState1);
                            }
                            else {
                                this.focusHighlight.bounds = tmp;
                                this.focusHighlight.redraw();
                            }

                            break;
                        }
                    }
                }

                if (this.currentConstraint == null) {
                    this.destroyFocusHighlight();
                }
            }
            else {
                this.currentConstraint = null;
                this.currentFocus = null;
                this.currentPoint = null;
            }
        }

        /**
         * Function: destroy
         * 
         * Destroy this handler.
         */
        destroy() {
            this.reset();
        }

    }
}
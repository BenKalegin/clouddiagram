module Five {
    /** Implements the alignment of selection cells to other cells in the graph. */
    export class Guide {
        constructor(private graph: Graph, states: CellState[]) {
            this.setStates(states);
        }

        /** Contains the <mxCellStates> that are used for alignment. */
        private states: CellState[] = null;

        /** Specifies if horizontal guides are enabled. Default is true. */
        private horizontal = true;

        /** Specifies if vertical guides are enabled. Default is true. */
        private vertical = true;

        /** Holds the <mxShape> for the horizontal guide. */
        private guideX: Shape = null;

        /** Holds the <mxShape> for the vertical guide. */
        private guideY: Shape = null;

        /** Sets the CellStates that should be used for alignment. */
        private setStates(states: CellState[]) {
            this.states = states;
        }

        /** Returns true if the guide should be enabled for the given native event. This implementation always returns true. */
        isEnabledForEvent(evt: MouseEvent) {
            return true;
        }

        /** Returns the tolerance for the guides. Default value is gridSize * scale / 2. */
        private getGuideTolerance() : number {
            return this.graph.gridSize * this.graph.view.scale / 2;
        }

        /** Returns the mxShape to be used for painting the respective guide. This implementation returns a new, dashed and crisp <mxPolyline> using
         * <Constants.GUIDE_COLOR> and <Constants.GUIDE_STROKEWIDTH> as the format. */
        private createGuideShape(horizontal: boolean): Shape {
            var guide = new PolylineShape([], Constants.guideColor, Constants.guideStrokewidth);
            guide.isDashed = true;

            return guide;
        }

        /** Moves the <bounds> by the given Point and returnt the snapped point. */
        move(bounds: Rectangle, delta: Point, gridEnabled: boolean) {
            if (this.states != null && (this.horizontal || this.vertical) && bounds != null && delta != null) {
                var trx = this.graph.getView().translate;
                var scale = this.graph.getView().scale;
                var dx = delta.x;
                var dy = delta.y;

                var overrideX = false;
                var overrideY = false;

                var tt = this.getGuideTolerance();
                var ttX = tt;
                var ttY = tt;

                var b = bounds.clone();
                b.x += delta.x;
                b.y += delta.y;

                var left = b.x;
                var right = b.x + b.width;
                var center = b.getCenterX();
                var top = b.y;
                var bottom = b.y + b.height;
                var middle = b.getCenterY();

                // Snaps the left, center and right to the given x-coordinate
                var snapX = x => {
                    x += this.graph.panDx;
                    var override = false;

                    if (Math.abs(x - center) < ttX) {
                        dx = x - bounds.getCenterX();
                        ttX = Math.abs(x - center);
                        override = true;
                    } else if (Math.abs(x - left) < ttX) {
                        dx = x - bounds.x;
                        ttX = Math.abs(x - left);
                        override = true;
                    } else if (Math.abs(x - right) < ttX) {
                        dx = x - bounds.x - bounds.width;
                        ttX = Math.abs(x - right);
                        override = true;
                    }

                    if (override) {
                        if (this.guideX == null) {
                            this.guideX = this.createGuideShape(true);

                            // Makes sure to use either VML or SVG shapes in order to implement
                            // event-transparency on the background area of the rectangle since
                            // HTML shapes do not let mouseevents through even when transparent
                            this.guideX.dialect = (this.graph.dialect != Dialect.Svg) ? Dialect.Vml : Dialect.Svg;
                            this.guideX.pointerEvents = false;
                            this.guideX.init(ElementInitializer(this.graph.getView().getOverlayPane()));
                        }

                        var c = this.graph.container;
                        x -= this.graph.panDx;
                        this.guideX.points = [new Point(x, -this.graph.panDy), new Point(x, c.getScroll().height - 3 - this.graph.panDy)];
                    }

                    overrideX = overrideX || override;
                };

                // Snaps the top, middle or bottom to the given y-coordinate
                var snapY = y => {
                    y += this.graph.panDy;
                    var override = false;

                    if (Math.abs(y - middle) < ttY) {
                        dy = y - bounds.getCenterY();
                        ttY = Math.abs(y - middle);
                        override = true;
                    } else if (Math.abs(y - top) < ttY) {
                        dy = y - bounds.y;
                        ttY = Math.abs(y - top);
                        override = true;
                    } else if (Math.abs(y - bottom) < ttY) {
                        dy = y - bounds.y - bounds.height;
                        ttY = Math.abs(y - bottom);
                        override = true;
                    }

                    if (override) {
                        if (this.guideY == null) {
                            this.guideY = this.createGuideShape(false);

                            // Makes sure to use either VML or SVG shapes in order to implement
                            // event-transparency on the background area of the rectangle since
                            // HTML shapes do not let mouseevents through even when transparent
                            this.guideY.dialect = (this.graph.dialect != Dialect.Svg) ? Dialect.Vml : Dialect.Svg;
                            this.guideY.pointerEvents = false;
                            this.guideY.init(ElementInitializer(this.graph.getView().getOverlayPane()));
                        }

                        var c = this.graph.container;
                        y -= this.graph.panDy;
                        this.guideY.points = [new Point(-this.graph.panDx, y), new Point(c.getScroll().width - 3 - this.graph.panDx, y)];
                    }

                    overrideY = overrideY || override;
                };

                for (var i = 0; i < this.states.length; i++) {
                    var state = this.states[i];

                    if (state != null) {
                        // Align x
                        if (this.horizontal) {
                            snapX.call(this, state.getCenterX());
                            snapX.call(this, state.x);
                            snapX.call(this, state.x + state.width);
                        }

                        // Align y
                        if (this.vertical) {
                            snapY.call(this, state.getCenterY());
                            snapY.call(this, state.y);
                            snapY.call(this, state.y + state.height);
                        }
                    }
                }

                if (!overrideX && this.guideX != null) {
                    Utils.nodeStyle(this.guideX.node).visibility = "hidden";
                } else if (this.guideX != null) {
                    Utils.nodeStyle(this.guideX.node).visibility = "visible";
                    this.guideX.redraw();
                }

                if (!overrideY && this.guideY != null) {
                    Utils.nodeStyle(this.guideY.node).visibility = "hidden";
                } else if (this.guideY != null) {
                    Utils.nodeStyle(this.guideY.node).visibility = "visible";
                    this.guideY.redraw();
                }

                // Moves cells that are off-grid back to the grid on move
                if (gridEnabled) {
                    if (!overrideX) {
                        var tx = bounds.x - (this.graph.snap(bounds.x /
                            scale - trx.x) + trx.x) * scale;
                        dx = this.graph.snap(dx / scale) * scale - tx;
                    }

                    if (!overrideY) {
                        var ty = bounds.y - (this.graph.snap(bounds.y /
                            scale - trx.y) + trx.y) * scale;
                        dy = this.graph.snap(dy / scale) * scale - ty;
                    }
                }

                delta = new Point(dx, dy);
            }
            return delta;
        }

        /**
         * Function: hide
         * 
         * Hides all current guides.
         */
        hide() {
            if (this.guideX != null) {
                Utils.nodeStyle(this.guideX.node).visibility = "hidden";
            }

            if (this.guideY != null) {
                Utils.nodeStyle(this.guideY.node).visibility = "hidden";
            }
        }

        /**
         * Function: destroy
         * 
         * Destroys all resources that this object uses.
         */
        destroy() {
            if (this.guideX != null) {
                this.guideX.destroy();
                this.guideX = null;
            }

            if (this.guideY != null) {
                this.guideY.destroy();
                this.guideY = null;
            }
        }
    }
}
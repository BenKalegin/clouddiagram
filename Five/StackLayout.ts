/// <reference path="GraphLayout.ts"/>

module Five {
    export class StackLayout extends BasicLayout implements ILayout {
        constructor(graph: Graph, horizontal: boolean = true, spacing: number = 0, x0: number = 0, y0: number = 0, border: number = 0) {
            super(graph);
            this.horizontal = horizontal;
            this.spacing = spacing;
            this.x0 = x0;
            this.y0 = y0;
            this.border = border;
        }

        /** Specifies the orientation of the layout */
        private horizontal: boolean;

        /** Specifies the spacing between the cells */
        private spacing: number;

        /** Specifies the horizontal origin of the layout */
        private x0: number;

        /** Specifies the vertical origin of the layout. */
        private y0: number;

        /** Border to be added if fill is true.  */
        private border: number;

        /** Top margin for the child area. Default is 0.*/
        private marginTop = 0;

        /** Top margin for the child area. Default is 0. */
        private marginLeft = 0;

        /** Top margin for the child area. Default is 0. */
        private marginRight = 0;

        /** Top margin for the child area. Default is 0. */
        private marginBottom = 0;

        /** Boolean indicating if the location of the first cell should be kept, that is, it will not be moved to x0 or y0. */
        private keepFirstLocation = false;

        /** Boolean indicating if dimension should be changed to fill out the parent cell. Default is false. */
        fill = false;
	
        /** If the parent should be resized to match the width/height of the stack. Default is false. */
        resizeParent = false;

        /** If the last element should be resized to fill out the parent. Default is false. If <resizeParent> is true then this is ignored. */
        private resizeLast = false;

        /** Value at which a new column or row should be created. Default is null. */
        private wrap: number = null;

        /** If the strokeWidth should be ignored. Default is true. */
        private borderCollapse = true;

        private isHorizontal() : boolean {
            return this.horizontal;
        }

        /** Implements GraphLayout.moveCell */
        moveCell(cell: Cell, x: number, y: number) {
            var model = this.graph.getModel();
            var parent = model.getParent(cell);
            var horizontal = this.isHorizontal();

            if (cell != null && parent != null) {
                var last = 0;
                var childCount = model.getChildCount(parent);
                var value = (horizontal) ? x : y;
                var pstate = this.graph.getView().getState(parent);

                if (pstate != null) {
                    value -= (horizontal) ? pstate.x : pstate.y;
                }
	            var i: number;
	            for (i = 0; i < childCount; i++) {
                    var child = model.getChildAt(parent, i);

                    if (child != cell) {
                        var bounds = Cells.getGeometry(child);

                        if (bounds != null) {
                            var tmp = (horizontal) ?
                                bounds.x + bounds.width / 2 :
                                bounds.y + bounds.height / 2;

                            if (last < value && tmp > value) {
                                break;
                            }

                            last = tmp;
                        }
                    }
                }

                // Changes child order in parent
                var idx = parent.getIndex(cell);
                idx = Math.max(0, i - ((i > idx) ? 1 : 0));

                model.add(parent, cell, idx);
            }
        }

        /** Returns the size for the parent container or the size of the graph  container if the parent is a layer or the root of the model. */
        private getParentSize(parent: Cell): Geometry {
            var model = this.graph.getModel();
            var pgeo = Cells.getGeometry(parent);

            // Handles special case where the parent is either a layer with no
            // geometry or the current root of the view in which case the size
            // of the graph's container will be used.
            if (this.graph.container != null && ((pgeo == null &&
                model.isLayer(parent)) || parent == this.graph.getView().currentRoot)) {
                var width = this.graph.container.offsetWidth - 1;
                var height = this.graph.container.offsetHeight - 1;
                pgeo = new Geometry(0, 0, width, height);
            }

            return pgeo;
        }

        /** Implements <mxGraphLayout.execute>. Only children where <isVertexIgnored> returns false are taken into account. */
        public execute(parent: Cell) {
            if (parent != null) {
                var pgeo = this.getParentSize(parent);
                var horizontal = this.isHorizontal();
                var model = this.graph.getModel();
                var fillValue = null;

                if (pgeo != null) {
                    if (horizontal)
                        fillValue = pgeo.height - this.marginTop - this.marginBottom;
                    else
                        fillValue = pgeo.width - this.marginLeft - this.marginRight;
                }

                fillValue -= 2 * this.spacing + 2 * this.border;
                var x0 = this.x0 + this.border + this.marginLeft;
                var y0 = this.y0 + this.border + this.marginTop;

                // Handles swimlane start size
                if (this.graph.isSwimlane(parent)) {
                    // Uses computed style to get latest 
                    var style = this.graph.getCellStyle(parent);
                    var start = Utils.getInt(style, Constants.styleStartsize, Constants.defaultStartsize);
                    var horz = Utils.getBoolean(style, Constants.styleHorizontal, true);

                    if (pgeo != null) {
                        if (horz) {
                            start = Math.min(start, pgeo.height);
                        } else {
                            start = Math.min(start, pgeo.width);
                        }
                    }

                    if (horizontal === horz) {
                        fillValue -= start;
                    }

                    if (horz) {
                        y0 += start;
                    } else {
                        x0 += start;
                    }
                }

                model.beginUpdate();
                try {
                    var tmp = 0;
                    var last: Rectangle = null;
                    var lastValue = 0;
                    var childCount = model.getChildCount(parent);

                    for (var i = 0; i < childCount; i++) {
                        var child = model.getChildAt(parent, i);

                        if (!this.isVertexIgnored(child) && this.isVertexMovable(child)) {
                            var geo = Cells.getGeometry(child);

                            if (geo != null) {
                                geo = geo.clone();

                                if (this.wrap != null && last != null) {
                                    if ((horizontal && last.x + last.width +
                                        geo.width + 2 * this.spacing > this.wrap) ||
                                    (!horizontal && last.y + last.height +
                                        geo.height + 2 * this.spacing > this.wrap)) {
                                        last = null;

                                        if (horizontal) {
                                            y0 += tmp + this.spacing;
                                        } else {
                                            x0 += tmp + this.spacing;
                                        }

                                        tmp = 0;
                                    }
                                }

                                tmp = Math.max(tmp, (horizontal) ? geo.height : geo.width);
                                var sw = 0;

                                if (!this.borderCollapse) {
                                    var childStyle = this.graph.getCellStyle(child);
                                    sw = Utils.getInt(childStyle, Constants.styleStrokeWidth, 1);
                                }

                                if (last != null) {
                                    if (horizontal) {
                                        geo.x = lastValue + this.spacing + Math.floor(sw / 2);
                                    } else {
                                        geo.y = lastValue + this.spacing + Math.floor(sw / 2);
                                    }
                                } else if (!this.keepFirstLocation) {
                                    if (horizontal) {
                                        geo.x = x0;
                                    } else {
                                        geo.y = y0;
                                    }
                                }

                                if (horizontal) {
                                    geo.y = y0;
                                } else {
                                    geo.x = x0;
                                }

                                if (this.fill && fillValue != null) {
                                    if (horizontal) {
                                        geo.height = fillValue;
                                    } else {
                                        geo.width = fillValue;
                                    }
                                }

                                this.setChildGeometry(child, geo);
                                last = geo;

                                if (horizontal) {
                                    lastValue = last.x + last.width + Math.floor(sw / 2);
                                } else {
                                    lastValue = last.y + last.height + Math.floor(sw / 2);
                                }
                            }
                        }
                    }

                    if (this.resizeParent && pgeo != null && last != null &&
                        !this.graph.isCellCollapsed(parent)) {
                        this.updateParentGeometry(parent, pgeo, last);
                    } else if (this.resizeLast && pgeo != null && last != null) {
                        if (horizontal) {
                            last.width = pgeo.width - last.x - this.spacing - this.marginRight - this.marginLeft;
                        } else {
                            last.height = pgeo.height - last.y - this.spacing - this.marginBottom;
                        }
                    }
                } finally {
                    model.endUpdate();
                }
            }
        }

        private setChildGeometry(child: Cell, geo: Geometry) {
            this.graph.getModel().setGeometry(child, geo);
        }

        private updateParentGeometry(parent: Cell, pgeo: Geometry, last) {
            var horizontal = this.isHorizontal();
            var model = this.graph.getModel();

            pgeo = pgeo.clone();

            if (horizontal) {
                pgeo.width = last.x + last.width + this.spacing + this.marginRight;
            } else {
                pgeo.height = last.y + last.height + this.spacing + this.marginBottom;
            }

            model.setGeometry(parent, pgeo);
        }

    }
} 
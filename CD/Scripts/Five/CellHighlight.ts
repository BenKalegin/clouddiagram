module Five {
    export class CellHighlight {
        constructor(graph: Graph, highlightColor: string = Constants.defaultValidColor, strokeWidth: number = Constants.highlightStrokewidth, dashed: boolean = false) {
            if (graph != null) {
                this.graph = graph;
                this.highlightColor = highlightColor;
                this.strokeWidth = strokeWidth;
                this.dashed = dashed;

                // Updates the marker if the graph changes
                this.repaintHandler = Utils.bind(this, () => {
                    // Updates reference to state
                    if (this.state != null) {
                        var tmp = this.graph.view.getState(this.state.cell);

                        if (tmp == null) {
                            this.hide();
                        } else {
                            this.state = tmp;
                            this.repaint();
                        }
                    }
                });

                this.graph.getView().onScale.add(this.repaintHandler);
                this.graph.getView().onTranslate.add(this.repaintHandler);
                this.graph.getView().onScaleAndTranslate.add(this.repaintHandler);
                this.graph.getModel().onChange.add(this.repaintHandler);

                // Hides the marker if the current root changes
                this.resetHandler = () => this.hide();
                this.graph.getView().onRootChange.add(this.resetHandler);
            }
        }

        /** Specifies if the highlights should appear on top of everything else in the overlay pane. Default is false. */
        private keepOnTop = false;

        /** Reference to the enclosing Graph*/
        private graph: Graph = null;

        /** Reference to the CellState.*/
        private state: CellState = null;

        /** Specifies the spacing between the highlight for vertices and the vertex. Default is 2.*/
        private spacing = 2;

        /** Holds the handler that automatically invokes reset if the highlight should be hidden.*/
        private resetHandler: () => void;
        shape: Shape;
        private highlightColor: string;
        private strokeWidth: number;
        private dashed: boolean;
        private repaintHandler: () => any;

        setHighlightColor(color: string) {
            this.highlightColor = color;

            if (this.shape != null) {
                this.shape.stroke = color;
            }
        }

        private drawHighlight() {
            this.shape = this.createShape();
            this.repaint();

            if (!this.keepOnTop && this.shape.node.parentNode.firstChild != this.shape.node) {
                this.shape.node.parentNode.insertBefore(this.shape.node, this.shape.node.parentNode.firstChild);
            }
        }

        private createShape(): Shape {
            var key = this.state.style.shape;
            var stencil = StencilRegistry.getStencil(key);
            var shape: Shape;

            if (stencil != null) {
                shape = new Shape(stencil);
            } else {
                var constructor = <any>this.state.shape.constructor;
                shape = new constructor();
            }

            shape.scale = this.state.view.scale;
            shape.outline = true;
            shape.points = this.state.absolutePoints;
            shape.apply(this.state);
            shape.strokewidth = this.strokeWidth / this.state.view.scale / this.state.view.scale;
            shape.arrowStrokewidth = this.strokeWidth;
            shape.stroke = this.highlightColor;
            shape.isDashed = this.dashed;
            shape.isShadow = false;

            shape.dialect = (this.graph.dialect != Dialect.Svg) ? Dialect.Vml : Dialect.Svg;
            shape.init(ElementInitializer(this.graph.getView().getOverlayPane()));
            Events.redirectMouseEvents(shape.node, this.graph, () => this.state);

            if (this.graph.dialect != Dialect.Svg) {
                shape.pointerEvents = false;
            } else {
                shape.svgPointerEvents = "stroke";
            }

            return shape;
        }


        /** Updates the highlight after a change of the model or view. */
        repaint() {
            if (this.state != null && this.shape != null) {
                if (Cells.isEdge(this.state.cell)) {
                    this.shape.points = this.state.absolutePoints;
                } else {
                    this.shape.bounds = new Rectangle(this.state.x - this.spacing, this.state.y - this.spacing,
                        this.state.width + 2 * this.spacing, this.state.height + 2 * this.spacing);
                    this.shape.rotation = this.state.style.rotation;
                }

                // Uses cursor from shape in highlight
                if (this.state.shape != null) {
                    this.shape.setCursor(this.state.shape.getCursor());
                }

                this.shape.redraw();
            }
        }

        /** Resets the state of the cell marker. */
        hide() {
            this.highlight(null);
        }

        /** Marks the <markedState> and fires a <mark> event.*/
        highlight(state: CellState) {
            if (this.state != state) {
                if (this.shape != null) {
                    this.shape.destroy();
                    this.shape = null;
                }

                this.state = state;

                if (this.state != null) {
                    this.drawHighlight();
                }
            }
        }

        /** Destroys the handler and all its resources and DOM nodes. */
        destroy() {
            this.graph.getView().onScale.remove(this.repaintHandler);
            this.graph.getView().onTranslate.remove(this.repaintHandler);
            this.graph.getView().onScaleAndTranslate.remove(this.repaintHandler);
            this.graph.getModel().onChange.remove(this.repaintHandler);
            this.graph.getView().onRootChange.remove(this.resetHandler);

            if (this.shape != null) {
                this.shape.destroy();
                this.shape = null;
            }
        }
    }
}
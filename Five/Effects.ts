module Five {
    export class Effects {

        /** Asynchronous animated move operation. See also: <mxMorphing>.
	 * graph - <mxGraph> that received the changes.
	 * changes - Array of changes to be animated.
	 * done - Optional function argument that is invoked after the last step of the animation. */
        static animateChanges(graph: Graph, changes: IChange[], done?: () => void) {
            var maxStep = 10;
            var step = 0;

            var animate = () => {
                var isRequired = false;

                for (var i = 0; i < changes.length; i++) {
                    var change = changes[i];

                    if (change instanceof GeometryChange ||
                        change instanceof TerminalChange ||
                        change instanceof ValueChange ||
                        change instanceof ChildChange ||
                        change instanceof StyleChange) {
                        var child = change instanceof ChildChange ? (<ChildChange>change).child : null;
                        var state = graph.getView().getState(change.cell || child, false);

                        if (state != null) {
                            isRequired = true;

                            if (change.constructor != GeometryChange || graph.model.isEdge(change.cell)) {
                                Utils.setOpacity(state.shape.node, 100 * step / maxStep);
                            } else {
                                var geoChange = <GeometryChange>change;
                                var scale = graph.getView().scale;

                                var dx = (geoChange.geometry.x - geoChange.previous.x) * scale;
                                var dy = (geoChange.geometry.y - geoChange.previous.y) * scale;

                                var sx = (geoChange.geometry.width - geoChange.previous.width) * scale;
                                var sy = (geoChange.geometry.height - geoChange.previous.height) * scale;

                                if (step == 0) {
                                    state.x -= dx;
                                    state.y -= dy;
                                    state.width -= sx;
                                    state.height -= sy;
                                } else {
                                    state.x += dx / maxStep;
                                    state.y += dy / maxStep;
                                    state.width += sx / maxStep;
                                    state.height += sy / maxStep;
                                }

                                graph.cellRenderer.redraw(state);

                                // Fades all connected edges and children
                                Effects.cascadeOpacity(graph, change.cell, 100 * step / maxStep);
                            }
                        }
                    }
                }

                if (step < maxStep && isRequired) {
                    step++;
                    window.setTimeout(animate, delay);
                } else if (done != null) {
                    done();
                }
            };

            var delay = 30;
            animate();
        }

        /** Sets the opacity on the given cell and its descendants.
	     * graph - <mxGraph> that contains the cells.
	     * cell - <mxCell> to set the opacity for.
	     * opacity - New value for the opacity in %. */
        static cascadeOpacity(graph: Graph, cell: Cell, opacity: number) {
            // Fades all children
            var childCount = graph.model.getChildCount(cell);

            for (var i = 0; i < childCount; i++) {
                var child = graph.model.getChildAt(cell, i);
                var childState = graph.getView().getState(child);

                if (childState != null) {
                    Utils.setOpacity(childState.shape.node, opacity);
                    Effects.cascadeOpacity(graph, child, opacity);
                }
            }

            // Fades all connected edges
            var edges = graph.model.getEdges(cell);

            if (edges != null) {
                edges.forEach(edge => {
                    var edgeState = graph.getView().getState(edge);

                    if (edgeState != null) {
                        Utils.setOpacity(edgeState.shape.node, opacity);
                    }
                });
            }
        }

        /** Asynchronous fade-out operation. */
        static fadeOut(node: Element, from = 100, remove = false, step = 40, delay = 30, isEnabled = true) {
            var opacity = from;
            Utils.setOpacity(node, opacity);

            if (isEnabled) {
                var f = () => {
                    opacity = Math.max(opacity - step, 0);
                    Utils.setOpacity(node, opacity);

                    if (opacity > 0) {
                        window.setTimeout(f, delay);
                    } else {
                        Utils.nodeStyle(node).visibility = 'hidden';

                        if (remove && node.parentNode) {
                            node.parentNode.removeChild(node);
                        }
                    }
                };
                window.setTimeout(f, delay);
            } else {
                Utils.nodeStyle(node).visibility = 'hidden';

                if (remove && node.parentNode) {
                    node.parentNode.removeChild(node);
                }
            }
        }
    }
} 
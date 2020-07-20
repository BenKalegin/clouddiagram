module Five {
    export class PanningManager {
        
        /** Damper value for the panning. Default is 1/6. */
        private damper = 1 / 6;

        /** Delay in milliseconds for the panning. Default is 10. */
        private delay = 10;

        /** Specifies if mouse events outside of the component should be handled. Default is true. */
        private handleMouseOut = true;

        /** Border to handle automatic panning inside the component. Default is 0 (disabled). */
        private border = 0;

        private active = false;
        private thread: number = null;
        private tdx = 0;
        private tdy = 0;
        private t0: Point = new Point(0, 0);
        private dx = 0;
        private dy = 0;
        private scrollbars = false;
        private scrollLeft = 0;
        private scrollTop = 0;
        private mouseListener: IMouseListener;
        createThread: () => number;

        constructor(private graph: Graph) {
            this.mouseListener =
            {
                mouseDown() {
                },
                mouseMove() {
                },
                mouseUp: Utils.bind(this, () => {
                    if (this.active) {
                        this.stop();
                    }
                })
            }

            graph.addMouseListener(this.mouseListener);

            // Stops scrolling on every mouseup anywhere in the document
            Events.addListener(document, "mouseup", Utils.bind(this, () => {
                if (this.active) {
                    this.stop();
                }
            }));

            this.createThread = Utils.bind(this, () => {
                this.scrollbars = Utils.hasScrollbars(graph.container);
                this.scrollLeft = graph.container.scrollLeft;
                this.scrollTop = graph.container.scrollTop;

                return window.setInterval(Utils.bind(this, ()=> {
                    this.tdx -= this.dx;
                    this.tdy -= this.dy;

                    if (this.scrollbars) {
                        var left = -graph.container.scrollLeft - Math.ceil(this.dx);
                        var top = -graph.container.scrollTop - Math.ceil(this.dy);
                        graph.panGraph(left, top);
                        graph.panDx = this.scrollLeft - graph.container.scrollLeft;
                        graph.panDy = this.scrollTop - graph.container.scrollTop;
                        graph.onPan.fire();
                        // TODO: Implement graph.autoExtend
                    } else {
                        graph.panGraph(this.getDx(), this.getDy());
                    }
                }), this.delay);
            });
        }

        isActive() : boolean{
            return this.active;
        }

        getDx() : number {
            return Math.round(this.tdx);
        }

        getDy() : number {
            return Math.round(this.tdy);
        }

        start() {
            this.t0.x = this.graph.view.translate.x;
            this.t0.y = this.graph.view.translate.y;
            this.active = true;
        }

        panTo(x: number, y: number, w: number = 0, h: number = 0) {
            if (!this.active) {
                this.start();
            }

            this.scrollLeft = this.graph.container.scrollLeft;
            this.scrollTop = this.graph.container.scrollTop;

            var c = this.graph.container;
            this.dx = x + w - c.scrollLeft - c.clientWidth;

            if (this.dx < 0 && Math.abs(this.dx) < this.border) {
                this.dx = this.border + this.dx;
            } else if (this.handleMouseOut) {
                this.dx = Math.max(this.dx, 0);
            } else {
                this.dx = 0;
            }

            if (this.dx == 0) {
                this.dx = x - c.scrollLeft;

                if (this.dx > 0 && this.dx < this.border) {
                    this.dx = this.dx - this.border;
                } else if (this.handleMouseOut) {
                    this.dx = Math.min(0, this.dx);
                } else {
                    this.dx = 0;
                }
            }

            this.dy = y + h - c.scrollTop - c.clientHeight;

            if (this.dy < 0 && Math.abs(this.dy) < this.border) {
                this.dy = this.border + this.dy;
            } else if (this.handleMouseOut) {
                this.dy = Math.max(this.dy, 0);
            } else {
                this.dy = 0;
            }

            if (this.dy == 0) {
                this.dy = y - c.scrollTop;

                if (this.dy > 0 && this.dy < this.border) {
                    this.dy = this.dy - this.border;
                } else if (this.handleMouseOut) {
                    this.dy = Math.min(0, this.dy);
                } else {
                    this.dy = 0;
                }
            }

            if (this.dx != 0 || this.dy != 0) {
                this.dx *= this.damper;
                this.dy *= this.damper;

                if (this.thread == null) {
                    this.thread = this.createThread();
                }
            } else if (this.thread != null) {
                window.clearInterval(this.thread);
                this.thread = null;
            }
        }

        stop() {
            if (this.active) {
                this.active = false;

                if (this.thread != null) {
                    window.clearInterval(this.thread);
                    this.thread = null;
                }

                this.tdx = 0;
                this.tdy = 0;

                if (!this.scrollbars) {
                    var px = this.graph.panDx;
                    var py = this.graph.panDy;

                    if (px != 0 || py != 0) {
                        this.graph.panGraph(0, 0);
                        this.graph.view.setTranslate(this.t0.x + px / this.graph.view.scale, this.t0.y + py / this.graph.view.scale);
                    }
                } else {
                    this.graph.panDx = 0;
                    this.graph.panDy = 0;
                    this.graph.onPan.fire();
                }
            }
        }

        destroy() {
            this.graph.removeMouseListener(this.mouseListener);
        }

    }
}
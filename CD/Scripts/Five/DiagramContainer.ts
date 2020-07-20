module Five {
    export interface IDiagramContainer extends IShapeInitializer {
        setSize(width: number, height: number): void; 
        setScroll(dx: number, dy: number): void; 
        hasScrollbars(): boolean;
        getBorderSizes(): Rectangle;
        convertPoint(x: number, y: number): Point; 
        getClientSize() : Point;
        getOffsetSize(): Point;
        getScroll(): Rectangle;
        eventTarget() : EventTarget;
        leftPreview(canvasParent: Node);
        rightPreview(canvasParent: Node, dx: number, dy: number);
        is(node: Node);
        isVisible(): boolean;
        setCanvas(canvas: Node): void;
        getAbsoluteOffset(scrollOffset?: boolean) : Point;
        getScrollOrigin() : Point;
        setTextEditor(text: HTMLTextAreaElement): void;
        setDragPreview(previewElement: HTMLElement): void;
        afterDrop(): void;
        setRubberband(htmlDivElement: HTMLDivElement): void;
        hasChildNode(child: Element): boolean;
    }

    class DiagramContainer implements IDiagramContainer {
        private htmlElement: HTMLElement;
        private shiftPreview1: HTMLDivElement;
        private shiftPreview2: HTMLDivElement;

        constructor(htmlElement: HTMLElement) { this.htmlElement = htmlElement; }

        setSize(width: number, height: number) {
            this.htmlElement.style.width = Math.ceil(width) + "px";
            this.htmlElement.style.height = Math.ceil(height) + "px";
        }

        setScroll(dx: number, dy: number) {
            this.htmlElement.scrollLeft = dx;
            this.htmlElement.scrollTop = dy;
        }

        convertPoint(x: number, y: number): Point {
            return Utils.convertPoint(this.htmlElement, x, y);
        } 

        getClientSize(): Point {
            return new Point(this.htmlElement.clientWidth, this.htmlElement.clientHeight);
        }

        getOffsetSize(): Point {
            return new Point(this.htmlElement.offsetWidth, this.htmlElement.offsetHeight);
           
        }

        getScroll(): Rectangle {
            return new Rectangle(this.htmlElement.scrollLeft, this.htmlElement.scrollTop, this.htmlElement.scrollWidth, this.htmlElement.scrollHeight);
        }

        hasScrollbars(): boolean {
            var style = Utils.getCurrentStyle(this.htmlElement);

            return style != null && (style.overflow == "scroll" || style.overflow == "auto");
        }

        /**
         * Returns the size of the border and padding on all four sides of the container. 
         * The left, top, right and bottom borders are stored in the x, y, width and height of the returned rectangle, respectively.
         */
        getBorderSizes(): Rectangle {
            // Helper function to handle string values for border widths (approx)
            function parseBorder(value: string): number {
                var result;
                if (value == "thin") {
                    result = 2;
                } else if (value == "medium") {
                    result = 4;
                } else if (value == "thick") {
                    result = 6;
                } else {
                    result = parseInt(value);
                }

                if (isNaN(result)) {
                    result = 0;
                }

                return result;
            }

            var style = Utils.getCurrentStyle(this.htmlElement);
            return new Rectangle(
                parseBorder(style.borderLeftWidth) + parseInt(style.paddingLeft || 0),
                parseBorder(style.borderTopWidth) + parseInt(style.paddingTop || 0),
                parseBorder(style.borderRightWidth) + parseInt(style.paddingRight || 0),
                parseBorder(style.borderBottomWidth) + parseInt(style.paddingBottom || 0));
        }

        eventTarget(): EventTarget { return this.htmlElement }

        leftPreview(canvasParent: Node) {
            if (this.shiftPreview1 != null) {
                let child = this.shiftPreview1.firstChild;
                let next: ChildNode;
                while (child != null) {
                    next = child.nextSibling;
                    this.htmlElement.appendChild(child);
                    child = next;
                }

                if (this.shiftPreview1.parentNode != null) {
                    this.shiftPreview1.parentNode.removeChild(this.shiftPreview1);
                }

                this.shiftPreview1 = null;

                this.htmlElement.appendChild(canvasParent);

                child = this.shiftPreview2.firstChild;

                while (child != null) {
                    next = child.nextSibling;
                    this.htmlElement.appendChild(child);
                    child = next;
                }

                if (this.shiftPreview2.parentNode != null) {
                    this.shiftPreview2.parentNode.removeChild(this.shiftPreview2);
                }

                this.shiftPreview2 = null;
            }
        }

        rightPreview(canvasParent: Node, dx: number, dy: number) {
            if (this.shiftPreview1 == null) {
                // Needs two divs for stuff before and after the SVG element
                this.shiftPreview1 = document.createElement("div");
                this.shiftPreview1.style.position = "absolute";
                this.shiftPreview1.style.overflow = "visible";

                this.shiftPreview2 = document.createElement("div");
                this.shiftPreview2.style.position = "absolute";
                this.shiftPreview2.style.overflow = "visible";

                var current = this.shiftPreview1;
                var child = this.htmlElement.firstChild;
                while (child != null) {
                    var next = child.nextSibling; // SVG element is moved via transform attribute
                    if (child != canvasParent) {
                        current.appendChild(child);
                    } else {
                        current = this.shiftPreview2;
                    }

                    child = next;
                }

                // Inserts elements only if not empty
                if (this.shiftPreview1.firstChild != null) {
                    this.htmlElement.insertBefore(this.shiftPreview1, canvasParent);
                }

                if (this.shiftPreview2.firstChild != null) {
                    this.htmlElement.appendChild(this.shiftPreview2);
                }
            }

            this.shiftPreview1.style.left = dx + "px";
            this.shiftPreview1.style.top = dy + "px";
            this.shiftPreview2.style.left = dx + "px";
            this.shiftPreview2.style.top = dy + "px";
            
        }

        is(node: Node) {
            return this.htmlElement === node;
        }

        isVisible(): boolean {
            return this.htmlElement.style.display != "none" && this.htmlElement.style.visibility != "hidden";
        }

        /** Updates the style of the container after installing the SVG DOM elements. */
        private updateContainerStyle() {
            // Workaround for offset of container
            var style = Utils.getCurrentStyle(this.htmlElement);

            if (style.position == "static") {
                Utils.nodeStyle(this.htmlElement).position = "relative";
            }

            // Disables built-in pan and zoom in IE10 and later
            if (Client.isPointer) {
                Utils.nodeStyle(this.htmlElement).msTouchAction = "none";
            }
        }


        setCanvas(canvas: Node): void {
            this.htmlElement.appendChild(canvas);
            this.updateContainerStyle();

        }

        getAbsoluteOffset(scrollOffset?: boolean): Point {
            return Utils.getOffset(this.htmlElement, scrollOffset);
        }

        setTextEditor(text: HTMLTextAreaElement) {
            this.htmlElement.appendChild(text);
        }

        getScrollOrigin(): Point {
            return Utils.getScrollOrigin(this.htmlElement);
        }

        setDragPreview(previewElement: HTMLElement) {
            this.htmlElement.appendChild(previewElement);
        }

        afterDrop(): void {
            // Had to move this to after the insert because it will affect the scrollbars of the window in IE to try and
            // make the complete container visible.
            // LATER: Should be made optional.
            if (this.htmlElement.style.visibility != 'hidden') {
                this.htmlElement.focus();
            }
        }

        setRubberband(rubberband: HTMLDivElement): void {
            this.htmlElement.appendChild(rubberband);
        }

        hasChildNode(child: Element): boolean {
            return Utils.isAncestorNode(this.htmlElement, child);
        }

        isSvg(): boolean {
            return (<SVGElement><any>this.htmlElement).ownerSVGElement != null;
        }

        addShape(shape: Element) {
            this.htmlElement.appendChild(shape);
        }
    }

    export function createDiagramContainer(htmlElement: HTMLElement): IDiagramContainer {
        return new DiagramContainer(htmlElement);
    }
}
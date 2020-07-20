module Five {
    /** Maintains the size of a div element in Internet Explorer. This is a workaround for the right and bottom style being ignored in IE.
     * Constructs an object that maintains the size of a div element when the window is being resized. This is only required for Internet Explorer as it ignores the respective
     * stylesheet information for DIV elements.
     * If you need a div to cover the scrollwidth and -height of a document, then you can use this class as follows:
     * resizer.getDocumentHeight = () => document.body.scrollHeight;
     * resizer.getDocumentWidth = () => document.body.scrollWidth;
     * resizer.resize();
     */
    export class DivResizer {

     /* div - Reference to the DOM node whose size should be maintained.
      * container - Optional Container that contains the div.Default is the window.*/
        constructor(div: HTMLElement, container?: EventTarget) {
            if (div.nodeName.toLowerCase() == 'div') {
                if (container == null) {
                    container = window;
                }

                this.div = div;
                var style = Utils.getCurrentStyle(div);

                if (style != null) {
                    this.resizeWidth = style.width == 'auto';
                    this.resizeHeight = style.height == 'auto';
                }

                Events.addListener(container, 'resize', () => {
                    if (!this.handlingResize) {
                        this.handlingResize = true;
                        this.resize();
                        this.handlingResize = false;
                    }
                });

                this.resize();
            }
        }

        private div: HTMLElement;

        /** Boolean specifying if the width should be updated. */
        private resizeWidth = true;

        /** Boolean specifying if the height should be updated. */
        private resizeHeight = true;

        /** Boolean specifying if the width should be updated. */
        private handlingResize = false;

        /** Updates the style of the DIV after the window has been resized. */
        private resize() {
            var w = this.getDocumentWidth();
            var h = this.getDocumentHeight();

            var l = parseInt(this.div.style.left);
            var r = parseInt(this.div.style.right);
            var t = parseInt(this.div.style.top);
            var b = parseInt(this.div.style.bottom);

            if (this.resizeWidth &&
                !isNaN(l) &&
                !isNaN(r) &&
                l >= 0 &&
                r >= 0 &&
                w - r - l > 0) {
                this.div.style.width = (w - r - l) + 'px';
            }

            if (this.resizeHeight &&
                !isNaN(t) &&
                !isNaN(b) &&
                t >= 0 &&
                b >= 0 &&
                h - t - b > 0) {
                this.div.style.height = (h - t - b) + 'px';
            }
        }

        /** Hook for subclassers to return the width of the document (without scrollbars). */
        private getDocumentWidth(): number {
            return document.body.clientWidth;
        }

        /** Hook for subclassers to return the height of the document (without scrollbars). */
        private getDocumentHeight(): number {
            return document.body.clientHeight;
        }
    } 
} 
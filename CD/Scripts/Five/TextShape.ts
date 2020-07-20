///<reference path="Shape.ts" />

module Five {
    /**
     * Class: mxText
     *
     * Extends <mxShape> to implement a text shape. To change vertical text from
     * bottom to top to top to bottom, the following code can be used:
     * 
     * (code)
     * private verticalTextRotation = 90;
     * (end)
     */
    export class TextShape extends Shape {
         /* 
         * Constructor: mxText
         *
         * Constructs a new text shape.
         * 
         * Parameters:
         * 
         * value - String that represents the text to be displayed. This is stored in <value>.
         * bounds - <Rectangle> that defines the bounds. This is stored in <Shape.bounds>.
         * align - Specifies the horizontal alignment. Default is ''. This is stored in <align>.
         * valign - Specifies the vertical alignment. Default is ''. This is stored in <valign>.
         * color - String that specifies the text color. Default is 'black'. This is stored in <color>.
         * family - String that specifies the font family. Default is <Constants.DEFAULT_FONTFAMILY>. This is stored in <family>.
         * size - Integer that specifies the font size. Default is <Constants.DEFAULT_FONTSIZE>. This is stored in <size>.
         * fontStyle - Specifies the font style. Default is 0. This is stored in <fontStyle>.
         * spacing - Integer that specifies the global spacing. Default is 2. This is stored in <spacing>.
         * spacingTop - Integer that specifies the top spacing. Default is 0. The sum of the spacing and this is stored in <spacingTop>.
         * spacingRight - Integer that specifies the right spacing. Default is 0. The sum of the spacing and this is stored in <spacingRight>.
         * spacingBottom - Integer that specifies the bottom spacing. Default is 0.The sum of the spacing and this is stored in <spacingBottom>.
         * spacingLeft - Integer that specifies the left spacing. Default is 0. The sum of the spacing and this is stored in <spacingLeft>.
         * horizontal - Boolean that specifies if the label is horizontal. Default is true. This is stored in <horizontal>.
         * background - String that specifies the background color. Default is null. This is stored in <background>.
         * border - String that specifies the label border color. Default is null. This is stored in <border>.
         * wrap - Specifies if word-wrapping should be enabled. Default is false.
         * This is stored in <wrap>.
         * clipped - Specifies if the label should be clipped. Default is false.
         * This is stored in <clipped>.
         * overflow - Value of the overflow style. Default is 'visible'.
         */
        constructor(
            public value: string,
            bounds: Rectangle,
            private align: HorizontalAlign,
            private valign: VerticalAlign,
            private color: Color = "black",
            private family: string = Constants.defaultFontFamily, 
            public size: number = Constants.defaultFontSize,
            private fontStyle: number = Constants.defaultFontstyle,
            spacing: number = 2, 
            public spacingTop: number = 0, 
            public spacingRight: number = 0, 
            public spacingBottom: number = 0, 
            public spacingLeft: number = 0,
            horizontal: boolean = true,
            private background?: string,
            private border?: string,
            private wrap: boolean = false,
            private clipped: boolean = false,
            private overflow: Overflow = Overflow.visible,
            private labelPadding: number = 0) {
            super();
            this.bounds = bounds;
            this.rotation = 0;
            this.spacing = spacing;
            this.horizontal = horizontal,
            this.updateMargin();
        }

        // Specifies the spacing to be added to the top spacing. Default is 0. Use the value 5 here to get the same label positions as in mxGraph 1.x.
        static baseSpacingTop = 0;

        // Specifies the spacing to be added to the bottom spacing. Default is 0. Use the value 1 here to get the same label positions as in mxGraph 1.x.
        static baseSpacingBottom = 0;

        /** Specifies the spacing to be added to the left spacing. Default is 0. */
        static baseSpacingLeft = 0;

        /** Specifies the spacing to be added to the right spacing. Default is 0. */
        static baseSpacingRight = 0;

        /** Specifies if linefeeds in HTML labels should be replaced with BR tags. */
        replaceLinefeeds = true;

        /** Rotation for vertical text. Default is -90 (bottom to top). */
        static verticalTextRotation = -90;

        /** Specifies if the string size should be measured in <updateBoundingBox> if the label is clipped and the label position is center and middle. 
         * If this is true, then the bounding box will be set to <bounds>. Default is true. <ignoreStringSize> has precedence over this switch. */
        ignoreClippedStringSize = true;

        /** Specifies if the actual string size should be measured. If disabled the boundingBox will not ignore the actual size of the string, otherwise
         * <bounds> will be used instead. Default is false. */
        ignoreStringSize = false;

        /**
         * Variable: textWidthPadding
         * 
         * Specifies the padding to be added to the text width for the bounding box.
         * This is needed to make sure no clipping is applied to borders. Default is 4
         * for IE 8 standards mode and 3 for all others.
         */
        textWidthPadding = 3;

        offsetWidth: number;
        offsetHeight: number;
        margin: Point = null;

        /** Specifies the spacing to be added to the top spacing. Default is 0. Use the value 5 here to get the same label positions as in mxGraph 1.x.       */
        baseSpacingTop = 0;

        /** Specifies the spacing to be added to the bottom spacing. Default is 0. Use the value 1 here to get the same label positions as in mxGraph 1.x.         */
        baseSpacingBottom = 0;

        /** Specifies the spacing to be added to the left spacing. Default is 0. */
        baseSpacingLeft = 0;

        /** Specifies the spacing to be added to the right spacing. Default is 0. */
        baseSpacingRight = 0;

        private _horizontal = true;

        isWrapping: boolean;
        isClipping: boolean;

        get horizontal(): boolean {
            return this._horizontal;
        }

        set horizontal(value: boolean) {
            this._horizontal = value;
        }

        /** Disables offset in IE9 for crisper image output. */
        getSvgScreenOffset() {
            return 0;
        }

        /** Returns true if the bounds are not null and all of its variables are numeric. */
        checkBounds() : boolean {
            return (this.bounds != null && !isNaN(this.bounds.x) && !isNaN(this.bounds.y) &&
                !isNaN(this.bounds.width) && !isNaN(this.bounds.height));
        }

        apply(state: CellState) {
            /// <summary>Extends Shape.apply to update the text styles</summary>

            super.apply(state);

            if (this.style != null) {
                this.fontStyle = this.style.fontSize || this.fontStyle;
                this.family = this.style.fontFamily || this.family;
                this.size = this.style.fontSize || this.size;
                this.color = this.style.fontColor || this.color;
                this.align = this.style.hAlign || this.align;
                this.valign = this.style.vAlign || this.valign;
                this.spacingTop = this.style.spacingTop || this.spacingTop;
                this.spacingRight = this.style.spacingRight || this.spacingRight;
                this.spacingBottom = this.style.spacingBottom || this.spacingBottom;
                this.spacingLeft = this.style.spacingLeft || this.spacingLeft;
                this.horizontal = this.style.portrait == null ? this.horizontal : this.style.portrait;
                this.background = this.style.labelBackgroundColor || this.background;
                this.border = this.style.LabelBorderColor || this.border;
                this.updateMargin();
            }
        }

        updateBoundingBox() {
            /// <summary>Updates the field boundingBox for this shape using the given node and position</summary>
            var node = this.node;
            this.boundingBox = Utils.clone(this.bounds);
            var rot = this.getTextRotation();

            var h = (this.style != null) ? this.style.labelPosition || HorizontalAlign.Center : null;
            var v = (this.style != null) ? this.style.verticalLabelPosition || VerticalAlign.Middle : null;

            if (!this.ignoreStringSize && node != null && this.overflow != Overflow.fill &&
            (!this.clipped || !this.ignoreClippedStringSize || h != HorizontalAlign.Center || v != VerticalAlign.Middle)) {
                var ow = null;
                var oh = null;

                if (node instanceof SVGElement) {
                    if (node.firstChild != null && node.firstChild.firstChild != null && node.firstChild.firstChild.nodeName == "foreignObject") {
                        node = <HTMLObjectElement>(node.firstChild.firstChild);
                        ow = parseInt(node.getAttribute("width")) * this.scale;
                        oh = parseInt(node.getAttribute("height")) * this.scale;
                    } else {
                        try {
                            var getBBox = (<any>node).getBBox;
                            if (typeof getBBox === "function") {
                                var b = <SVGRect>getBBox();

                                // Workaround for bounding box of empty string
                                if (Utils.trim(this.value).length === 0) {
                                    return;
                                }

                                if (b.width == 0 && b.height == 0) {
                                    return;
                                }

                                this.boundingBox = new Rectangle(b.x, b.y, b.width, b.height);
                                rot = 0;
                            }
                        } catch (e) {
                            // Ignores NS_ERROR_FAILURE in FF if container display is none.
                        }
                    }
                } else {
                    var td = (this.state != null) ? this.state.view.textDiv : null;

                    // Use cached offset size
                    if (this.offsetWidth != null && this.offsetHeight != null) {
                        ow = this.offsetWidth * this.scale;
                        oh = this.offsetHeight * this.scale;
                    } else {
                        // Cannot get node size while container hidden so a
                        // shared temporary DIV is used for text measuring
                        if (td != null) {
                            this.updateFont(td);
                            this.updateSize(td, false);
                            this.updateInnerHtml(td);

                            node = td;
                        }

                        var elem = <HTMLElement>node;
                        var sizeDiv = elem;

                        if (sizeDiv.firstChild != null && sizeDiv.firstChild.nodeName == "DIV") {
                            sizeDiv = <HTMLElement>(sizeDiv.firstChild);
                        }

                        ow = (sizeDiv.offsetWidth + this.textWidthPadding) * this.scale;
                        oh = sizeDiv.offsetHeight * this.scale;
                    }
                }

                if (ow != null && oh != null) {
                    var x0 = this.bounds.x + this.margin.x * ow;
                    var y0 = this.bounds.y + this.margin.y * oh;

                    this.boundingBox = new Rectangle(x0, y0, ow, oh);
                }
            } else {
                this.boundingBox.x += this.margin.x * this.boundingBox.width;
                this.boundingBox.y += this.margin.y * this.boundingBox.height;
            }

            if (this.boundingBox != null) {
                if (rot != 0) {
                    var bbox = Utils.getBoundingBox(this.boundingBox, rot);

                    this.boundingBox.x = bbox.x;
                    this.boundingBox.y = bbox.y;

                    if (!Client.isQuirks) {
                        this.boundingBox.width = bbox.width;
                        this.boundingBox.height = bbox.height;
                    }
                }
            }
        }

        /** Returns 0 to avoid using rotation in the canvas via updateTransform. */
        getShapeRotation(): number {
            return 0;
        }

        /** Returns the rotation for the text label of the corresponding shape. */
        getTextRotation() : number {
            return (this.state != null && this.state.shape != null) ? this.state.shape.getTextRotation() : 0;
        }

        /** Inverts the bounds if <mxShape.isBoundsInverted> returns true or if the horizontal style is false. */
        isPaintBoundsInverted(): boolean {
            return !this.horizontal && this.state != null && Cells.isVertex(this.state.cell);
        }

        configureCanvas(c: AbstractCanvas2D, x: number, y: number, w: number, h: number) {
            super.configureCanvas(c, x, y, w, h);

            c.setFontColor(this.color);
            c.setFontBackgroundColor(this.background);
            c.setFontBorderColor(this.border);
            c.setFontFamily(this.family);
            c.setFontSize(this.size);
            c.setFontStyle(this.fontStyle);
        }

        paint(c: AbstractCanvas2D) {
            // Scale is passed-through to canvas
            var s = this.scale;
            var x = this.bounds.x / s;
            var y = this.bounds.y / s;
            var w = this.bounds.width / s;
            var h = this.bounds.height / s;

            this.updateTransform(c, x, y, w, h);
            this.configureCanvas(c, x, y, w, h);

            // Checks if text contains HTML markup
            var realHtml = /*Utils.isNode(this.value) || */this.dialect == Dialect.StrictHtml;

            // Always renders labels as HTML in VML
            var fmt = (realHtml) ? "html" : "";
            var val = this.value;

            val = (/*!Utils.isNode(this.value) &&*/ this.replaceLinefeeds && fmt == "html") ?
            val.replace(/\n/g, "<br/>") : val;

            c.text(x, y, w, h, val, this.align, this.valign, this.wrap, fmt, this.overflow, this.clipped, this.getTextRotation());
        }

        // Updates the HTML node(s) to reflect the latest bounds and scale.
        public redrawHtmlShape() {
            var style = this.nodeStyle();

            if (this.opacity < 1) {
                style.opacity = String(this.opacity);
            }
            else {
                style.opacity = "";
            }

            // Resets CSS styles
            style.whiteSpace = "normal";
            style.overflow = "";
            style.width = "";
            style.height = "";

            this.updateValue();
            this.updateFont(this.node);
            this.updateSize(this.node, (this.state == null || this.state.view.textDiv == null));

            this.offsetWidth = null;
            this.offsetHeight = null;

            this.updateHtmlTransform();
        }

        private updateHtmlTransform() {
            var theta = this.getTextRotation();
            var style = this.nodeStyle();
            var dx = this.margin.x;
            var dy = this.margin.y;

            if (theta != 0) {
                Utils.setPrefixedStyle(style, "transformOrigin", (-dx * 100) + "%" + " " + (-dy * 100) + "%");
                Utils.setPrefixedStyle(style, "transform", "translate(" + (dx * 100) + "%" + "," + (dy * 100) + "%)" +
                    "scale(" + this.scale + ") rotate(" + theta + "deg)");
            }
            else {
                Utils.setPrefixedStyle(style, "transformOrigin", "0% 0%");
                Utils.setPrefixedStyle(style, "transform", "scale(" + this.scale + ")" +
                    "translate(" + (dx * 100) + "%" + "," + (dy * 100) + "%)");
            }

            style.left = Math.round(this.bounds.x) + "px";
            style.top = Math.round(this.bounds.y) + "px";
        }

        /** Sets the inner HTML of the given element to the <value>. */
        private updateInnerHtml(elt) {
            /*
            if (Utils.isNode(this.value)) {
                elt.innerHTML = this.value.outerHTML;
            }
            else 
            */
            {
                var val = this.value;

                if (this.dialect != Dialect.StrictHtml) {
                    // LATER: Can be cached in updateValue
                    val = Utils.htmlEntities(val, false);
                }

                val = (this.replaceLinefeeds) ? val.replace(/\n/g, "<br/>") : val;
                val = "<div style=\"display:inline-block;_display:inline;\">" + val + "</div>";

                elt.innerHTML = val;
            }
        }

        /** Rotated text rendering quality is bad for IE9 quirks/IE8 standards */
        private updateHtmlFilter() {
            var style = this.nodeStyle();
            var dx = this.margin.x;
            var dy = this.margin.y;
            var s = this.scale;

            // Resets filter before getting offsetWidth
            style.filter = "";

            // Adds 1 to match table height in 1.x
            var ow = 0;
            var oh = 0;
            var td = (this.state != null) ? this.state.view.textDiv : null;
            var sizeDiv = this.node;

            // Fallback for hidden text rendering in IE quirks mode
            var w: number;
            if (td != null) {
                td.style.overflow = "";
                td.style.height = "";
                td.style.width = "";

                this.updateFont(td);
                this.updateSize(td, false);
                this.updateInnerHtml(td);
                w = Math.round(this.bounds.width / this.scale);
                if (this.wrap && w > 0) {
                    td.style.whiteSpace = "normal";
                    ow = w;

                    if (this.clipped) {
                        ow = Math.min(ow, this.bounds.width);
                    }

                    td.style.width = ow + "px";
                }
                else {
                    td.style.whiteSpace = "nowrap";
                }

                sizeDiv = td;

                if (sizeDiv.firstChild != null && sizeDiv.firstChild.nodeName == "DIV") {
                    sizeDiv = <Element>(sizeDiv.firstChild);
                }

                // Required to update the height of the text box after wrapping width is known 
                if (!this.clipped && this.wrap && w > 0) {
                    ow = (<any>sizeDiv).offsetWidth + this.textWidthPadding;
                    td.style.width = ow + "px";
                }

                oh = (<any>sizeDiv).offsetHeight + 2;

                if (Client.isQuirks && this.border != null && this.border != Constants.none) {
                    oh += 3;
                }
            }
            else if (sizeDiv.firstChild != null && sizeDiv.firstChild.nodeName == "DIV") {
                sizeDiv = <Element>(sizeDiv.firstChild);

                oh = (<any>sizeDiv).offsetHeight;
            }

            ow = (<any>sizeDiv).offsetWidth + this.textWidthPadding;

            if (this.clipped) {
                oh = Math.min(oh, this.bounds.height);
            }

            // Stores for later use
            this.offsetWidth = ow;
            this.offsetHeight = oh;
            w = this.bounds.width / s;
            var h = this.bounds.height / s;

            // Simulates max-height CSS in quirks mode
            if (Client.isQuirks && (this.clipped || (this.overflow == Overflow.width && h > 0))) {
                h = Math.min(h, oh);
                style.height = Math.round(h) + "px";
            }
            else {
                h = oh;
            }

            if (this.overflow != Overflow.fill && this.overflow != Overflow.width) {
                if (this.clipped) {
                    ow = Math.min(w, ow);
                }

                w = ow;

                // Simulates max-width CSS in quirks mode
                if ((Client.isQuirks && this.clipped) || this.wrap) {
                    style.width = Math.round(w) + "px";
                }
            }

            h *= s;
            w *= s;

            // Rotation case is handled via VML canvas
            var rad = this.getTextRotation() * (Math.PI / 180);

            // Precalculate cos and sin for the rotation
            var realCos = parseFloat(Math.cos(rad).toFixed(8));
            var realSin = parseFloat(Math.sin(-rad).toFixed(8));

            rad %= 2 * Math.PI;

            if (rad < 0) {
                rad += 2 * Math.PI;
            }

            rad %= Math.PI;

            if (rad > Math.PI / 2) {
                rad = Math.PI - rad;
            }

            var cos = Math.cos(rad);
            var sin = Math.sin(-rad);

            var tx = w * -(dx + 0.5);
            var ty = h * -(dy + 0.5);

            var topFix = (h - h * cos + w * sin) / 2 + realSin * tx - realCos * ty;
            var leftFix = (w - w * cos + h * sin) / 2 - realCos * tx - realSin * ty;

            if (rad != 0) {
                style.filter = "progid:DXImageTransform.Microsoft.Matrix(M11=" + realCos + ", M12=" +
                realSin + ", M21=" + (-realSin) + ", M22=" + realCos + ", sizingMethod='auto expand')";
            }

            // if it is MSCSSProperties
            (<any>style).zoom = s;
            style.left = Math.round(this.bounds.x + leftFix - w / 2) + "px";
            style.top = Math.round(this.bounds.y + topFix - h / 2) + "px";
        }

        /** Updates the HTML node(s) to reflect the latest bounds and scale. */
        private updateValue() {
            /*
            if (Utils.isNode(this.value)) {
                this.node.innerHTML = '';
                this.node.appendChild(this.value);
            }
            else 
            */
            {
                var val = this.value;

                if (this.dialect != Dialect.StrictHtml) {
                    val = Utils.htmlEntities(val, false);
                }

                val = (this.replaceLinefeeds) ? val.replace(/\n/g, "<br/>") : val;
                var bg = (this.background != null && this.background != Constants.none) ? this.background : null;
                var bd = (this.border != null && this.border != Constants.none) ? this.border : null;

                if (this.overflow == Overflow.fill || this.overflow == Overflow.width) {
                    if (bg != null) {
                        this.nodeStyle().backgroundColor = bg;
                    }

                    if (bd != null) {
                        this.nodeStyle().border = "1px solid " + bd;
                    }
                }
                else {
                    var css = "";

                    if (bg != null) {
                        css += "background-color:" + bg + ";";
                    }

                    if (bd != null) {
                        css += "border:1px solid " + bd + ";";
                    }

                    // Wrapper DIV for background, zoom needed for inline in quirks
                    // and to measure wrapped font sizes in all browsers
                    // FIXME: Background size in quirks mode for wrapped text
                    val = "<div style=\"zoom:1;" + css + "display:inline-block;_display:inline;" +
                    "text-decoration:inherit;padding-bottom:1px;padding-right:1px;line-height:" +
                    this.nodeStyle().lineHeight + "\">" + val + "</div>";
                    this.nodeStyle().lineHeight = "";
                }

                (<HTMLElement>this.node).innerHTML = val;
            }
        }

        /** Updates the HTML node(s) to reflect the latest bounds and scale.*/
        private updateFont(node: Element) {
            var style = Utils.nodeStyle(node);

            if (Constants.absoluteLineHeight)
                style.lineHeight = "" + Math.round(this.size * Constants.lineHeight) + "px";
            else
                style.lineHeight = "" + Constants.lineHeight;
            style.fontSize = Math.round(this.size) + "px";
            style.fontFamily = this.family;
            style.verticalAlign = "top";
            style.color = this.color;

            if ((this.fontStyle & FontStyle.Bold) == FontStyle.Bold) {
                style.fontWeight = "bold";
            }
            else {
                style.fontWeight = "";
            }

            if ((this.fontStyle & FontStyle.Italic) == FontStyle.Italic) {
                style.fontStyle = "italic";
            }
            else {
                style.fontStyle = "";
            }

            if ((this.fontStyle & FontStyle.Underline) == FontStyle.Underline) {
                style.textDecoration = "underline";
            }
            else {
                style.textDecoration = "";
            }

            if (this.align == HorizontalAlign.Center) {
                style.textAlign = "center";
            }
            else if (this.align == HorizontalAlign.Right) {
                style.textAlign = "right";
            }
            else {
                style.textAlign = "left";
            }
        }

        /** Updates the HTML node(s) to reflect the latest bounds and scale. */
        private updateSize(node, enableWrap) {
            var w = Math.round(this.bounds.width / this.scale);
            var h = Math.round(this.bounds.height / this.scale);
            var style = node.style;

            // NOTE: Do not use maxWidth here because wrapping will
            // go wrong if the cell is outside of the viewable area
            if (this.clipped) {
                style.overflow = "hidden";
                style.width = w + "px";

                if (!Client.isQuirks) {
                    style.maxHeight = h + "px";
                }
            }
            else if (this.overflow == Overflow.fill) {
                style.width = w + "px";
                style.height = h + "px";
            }
            else if (this.overflow == Overflow.width) {
                style.width = w + "px";
                style.maxHeight = h + "px";
            }

            if (this.wrap && w > 0) {
                style.whiteSpace = "normal";
                style.width = w + "px";

                if (enableWrap) {
                    var sizeDiv = node;

                    if (sizeDiv.firstChild != null && sizeDiv.firstChild.nodeName == "DIV") {
                        sizeDiv = sizeDiv.firstChild;
                    }

                    var tmp = sizeDiv.offsetWidth + 3;

                    if (this.clipped) {
                        tmp = Math.min(tmp, w);
                    }

                    style.width = tmp + "px";
                }
            }
            else {
                style.whiteSpace = "nowrap";
            }
        }

        // Returns the spacing as an mxPoint.
        private updateMargin() {
            this.margin = Utils.getAlignmentAsPoint(this.align, this.valign);
        }

        // Returns the spacing as a Point.
        getSpacing() {
            var dx: number;
            var dy: number;

            if (this.align == HorizontalAlign.Center) {
                dx = (this.spacingLeft - this.spacingRight) / 2;
            }
            else if (this.align == HorizontalAlign.Right) {
                dx = -this.spacingRight - this.baseSpacingRight;
            }
            else {
                dx = this.spacingLeft + this.baseSpacingLeft;
            }

            if (this.valign == VerticalAlign.Middle) {
                dy = (this.spacingTop - this.spacingBottom) / 2;
            }
            else if (this.valign == VerticalAlign.Bottom) {
                dy = -this.spacingBottom - this.baseSpacingBottom;;
            }
            else {
                dy = this.spacingTop + this.baseSpacingTop;
            }

            return new Point(dx, dy);
        }
        
        static factory(
            value: string, 
            bounds: Rectangle, 
            align: HorizontalAlign, 
            valign: VerticalAlign,
            color: string,
            family: string,
            size: number,
            fontStyle: number,
            spacing: number,
            spacingTop: number,
            spacingRight: number,
            spacingBottom: number,
            spacingLeft: number,
            horizontal: boolean,
            background: string,
            border: string,
            wrap: boolean,
            clipped: boolean,
            overflow: Overflow,
            labelPadding: number): Shape {
            return new TextShape(value, bounds, align, valign, color, family, size, fontStyle, spacing, spacingTop, spacingRight, spacingBottom, spacingLeft, horizontal, background, border,wrap,clipped,overflow,labelPadding); }
    }
}
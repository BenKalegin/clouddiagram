module Five {
    export class Stencil {

        // Static global variable that specifies the default value for the localized
        // attribute of the text element. Default is false.
        defaultLocalized = false;

        // Static global switch that specifies if the use of eval is allowed for
        // evaluating text content. Default is true. Set this to false if stencils may
        // contain user input (see the section on security in the manual).
        static allowEval = true;

        // Holds the XML node with the stencil description.
        desc: Element = null;

        // Holds an array of <ConnectionConstraints> as defined in the shape.
        constraints: ConnectionConstraint[] = null;

        // Holds the aspect of the shape. Default is 'auto'.
        aspect = null;

        // Holds the width of the shape. Default is 100.
        w0 = 100;

        // Holds the height of the shape. Default is 100.
        h0 = 100;

        // Holds the XML node with the stencil description.
        bgNode: Element = null;

        // Holds the XML node with the stencil description.
        fgNode: Element = null;

        // <length> | <percentage> | inherit
        strokewidth: string = null;

        // Static global variable that specifies the default value for the localized attribute of the text element.Default is false.
        static defaultLocalized = false;


        drawShape(canvas: AbstractCanvas2D, shape: Shape, x: number, y: number, w: number, h: number) {
            /// <summary>// Draws this stencil inside the given bounds</summary>
            /// <param name="canvas" type=""></param>
            /// <param name="shape" type=""></param>
            /// <param name="x" type=""></param>
            /// <param name="y" type=""></param>
            /// <param name="w" type=""></param>
            /// <param name="h" type=""></param>
            // TODO: Internal structure (array of special structs?), relative and absolute coordinates (eg. note shape, process vs star, actor etc.), text rendering
            // and non-proportional scaling, how to implement pluggable edge shapes (start, segment, end blocks), pluggable markers, how to implement
            // swimlanes (title area) with this API, add icon, horizontal/vertical label, indicator for all shapes, rotation
            this.drawChildren(canvas, shape, x, y, w, h, this.bgNode, false);
            this.drawChildren(canvas, shape, x, y, w, h, this.fgNode, true);
        }

        drawChildren(canvas: AbstractCanvas2D, shape: Shape, x: number, y: number, w: number, h: number, node: Element, disableShadow: boolean) {
            if (node != null && w > 0 && h > 0) {
                var direction: Direction = Direction[Utils.getValue(shape.style, Constants.styleDirection, null)];
                var aspect = this.computeAspect(x, y, w, h, direction);
                var minScale = Math.min(aspect.width, aspect.height);
                var sw = (this.strokewidth === "inherit") ?
                    Number(Utils.getInt(shape.style, Constants.styleStrokeWidth, 1)) :
                    Number(this.strokewidth) * minScale;
                canvas.setStrokeWidth(sw);

                var tmp = <HTMLElement>node.firstChild;

                while (tmp != null) {
                    if (tmp.nodeType == NodeType.Element) {
                        this.drawNode(canvas, shape, tmp, aspect, disableShadow);
                    }
                    tmp = <HTMLElement>tmp.nextSibling;
                }
            }
        }

        // Draws this stencil inside the given bounds.
        drawNode(canvas: AbstractCanvas2D, shape: Shape, node: HTMLElement, aspect: Rectangle, disableShadow: boolean) {
            var name = node.nodeName;
            var x0 = aspect.x;
            var y0 = aspect.y;
            var sx = aspect.width;
            var sy = aspect.height;
            var minScale = Math.min(sx, sy);

            if (name === "save") {
                canvas.save();
            } else if (name === "restore") {
                canvas.restore();
            } else if (name === "path") {
                canvas.begin();

                // Renders the elements inside the given path
                var childNode = <Element>node.firstChild;

                while (childNode != null) {
                    if (childNode.nodeType === NodeType.Element) {
                        this.drawNode(canvas, shape, <HTMLElement>childNode, aspect, disableShadow);
                    }

                    childNode = <Element>(childNode.nextSibling);
                }
            } else if (name === "close") {
                canvas.close();
            } else if (name === "move") {
                canvas.moveTo(x0 + Number(node.getAttribute("x")) * sx, y0 + Number(node.getAttribute("y")) * sy);
            } else if (name == "line") {
                canvas.lineTo(x0 + Number(node.getAttribute("x")) * sx, y0 + Number(node.getAttribute("y")) * sy);
            } else if (name == "quad") {
                canvas.quadTo(x0 + Number(node.getAttribute("x1")) * sx,
                    y0 + Number(node.getAttribute("y1")) * sy,
                    x0 + Number(node.getAttribute("x2")) * sx,
                    y0 + Number(node.getAttribute("y2")) * sy);
            } else if (name == "curve") {
                canvas.curveTo(x0 + Number(node.getAttribute("x1")) * sx,
                    y0 + Number(node.getAttribute("y1")) * sy,
                    x0 + Number(node.getAttribute("x2")) * sx,
                    y0 + Number(node.getAttribute("y2")) * sy,
                    x0 + Number(node.getAttribute("x3")) * sx,
                    y0 + Number(node.getAttribute("y3")) * sy);
            } else if (name == "arc") {
                canvas.arcTo(Number(node.getAttribute("rx")) * sx,
                    Number(node.getAttribute("ry")) * sy,
                    Number(node.getAttribute("x-axis-rotation")),
                    Number(node.getAttribute("large-arc-flag")),
                    Number(node.getAttribute("sweep-flag")),
                    x0 + Number(node.getAttribute("x")) * sx,
                    y0 + Number(node.getAttribute("y")) * sy);
            } else if (name == "rect") {
                canvas.rect(x0 + Number(node.getAttribute("x")) * sx,
                    y0 + Number(node.getAttribute("y")) * sy,
                    Number(node.getAttribute("w")) * sx,
                    Number(node.getAttribute("h")) * sy);
            } else if (name == "roundrect") {
                var arcsize = Number(node.getAttribute("arcsize"));

                if (arcsize == 0) {
                    arcsize = Constants.rectangleRoundingFactor * 100;
                }

                var w = Number(node.getAttribute("w")) * sx;
                var h = Number(node.getAttribute("h")) * sy;
                var factor = Number(arcsize) / 100;
                var r = Math.min(w * factor, h * factor);

                canvas.roundrect(x0 + Number(node.getAttribute("x")) * sx,
                    y0 + Number(node.getAttribute("y")) * sy,
                    w, h, r, r);
            } else if (name == "ellipse") {
                canvas.ellipse(x0 + Number(node.getAttribute("x")) * sx,
                    y0 + Number(node.getAttribute("y")) * sy,
                    Number(node.getAttribute("w")) * sx,
                    Number(node.getAttribute("h")) * sy);
            } else if (name == "image") {
                var src = this.evaluateAttribute(node, "src", shape);

                canvas.image(x0 + Number(node.getAttribute("x")) * sx,
                    y0 + Number(node.getAttribute("y")) * sy,
                    Number(node.getAttribute("w")) * sx,
                    Number(node.getAttribute("h")) * sy,
                    src, false, node.getAttribute("flipH") == "1",
                    node.getAttribute("flipV") == "1");
            } else if (name == "text") {
                var str = this.evaluateTextAttribute(node, "str", shape);
                var rotation = node.getAttribute("vertical") == "1" ? -90 : 0;

                if (node.getAttribute("align-shape") == "0") {
                    var dr = shape.rotation;

                    // Depends on flipping
                    var flipH = Utils.getInt(shape.style, Constants.styleFlipH, 0) === 1;
                    var flipV = Utils.getInt(shape.style, Constants.styleFlipV, 0) === 1;

                    if (flipH && flipV) {
                        rotation -= dr;
                    } else if (flipH || flipV) {
                        rotation += dr;
                    } else {
                        rotation -= dr;
                    }
                }

                rotation -= parseInt(node.getAttribute("rotation"));

                canvas.text(x0 + Number(node.getAttribute("x")) * sx,
                    y0 + Number(node.getAttribute("y")) * sy,
                    0, 0, str, node.getAttribute("align") || "left",
                    node.getAttribute("valign") || "top", false, "",
                    null, false, rotation);
            } else if (name == "include-shape") {
                var stencil = StencilRegistry.getStencil(node.getAttribute("name"));

                if (stencil != null) {
                    var x = x0 + Number(node.getAttribute("x")) * sx;
                    var y = y0 + Number(node.getAttribute("y")) * sy;
                    var w = Number(node.getAttribute("w")) * sx;
                    var h = Number(node.getAttribute("h")) * sy;

                    stencil.drawShape(canvas, shape, x, y, w, h);
                }
            } else if (name == "fillstroke") {
                canvas.fillAndStroke();
            } else if (name == "fill") {
                canvas.fill();
            } else if (name == "stroke") {
                canvas.stroke();
            } else if (name == "strokewidth") {
                var s = (node.getAttribute("fixed") == "1") ? 1 : minScale;
                canvas.setStrokeWidth(Number(node.getAttribute("width")) * s);
            } else if (name == "dashed") {
                canvas.setDashed(node.getAttribute("dashed") == "1");
            } else if (name == "dashpattern") {
                var value = node.getAttribute("pattern");

                if (value != null) {
                    var tmp = value.split(" ");
                    var pat = [];

                    for (var i = 0; i < tmp.length; i++) {
                        if (tmp[i].length > 0) {
                            pat.push(Number(tmp[i]) * minScale);
                        }
                    }

                    value = pat.join(" ");
                    canvas.setDashPattern(value);
                }
            } else if (name == "strokecolor") {
                canvas.setStrokeColor(node.getAttribute("color"));
            } else if (name == "linecap") {
                canvas.setLineCap(node.getAttribute("cap"));
            } else if (name == "linejoin") {
                canvas.setLineJoin(node.getAttribute("join"));
            } else if (name == "miterlimit") {
                canvas.setMiterLimit(Number(node.getAttribute("limit")));
            } else if (name == "fillcolor") {
                canvas.setFillColor(node.getAttribute("color"));
            } else if (name == "alpha") {
                canvas.setAlpha(+node.getAttribute("alpha"));
            } else if (name == "fontcolor") {
                canvas.setFontColor(node.getAttribute("color"));
            } else if (name == "fontstyle") {
                canvas.setFontStyle(+node.getAttribute("style"));
            } else if (name == "fontfamily") {
                canvas.setFontFamily(node.getAttribute("family"));
            } else if (name == "fontsize") {
                canvas.setFontSize(Number(node.getAttribute("size")) * minScale);
            }

            if (disableShadow && (name == "fillstroke" || name == "fill" || name == "stroke")) {
                disableShadow = false;
                canvas.setShadow(false);
            }
        } // Returns a rectangle that contains the offset in x and y and the horizontal
        // and vertical scale in width and height used to draw this shape inside the
        // given Rectangle.
        // 
        // shape - <mxShape> to be drawn.
        // bounds - <Rectangle> that should contain the stencil.
        // direction - Optional direction of the shape to be darwn.
        computeAspect(x: number, y: number, w: number, h: number, direction?: Direction): Rectangle {
            var x0 = x;
            var y0 = y;
            var sx = w / this.w0;
            var sy = h / this.h0;

            var inverse = (direction == Direction.North || direction == Direction.South);

            if (inverse) {
                sy = w / this.h0;
                sx = h / this.w0;

                var delta = (w - h) / 2;

                x0 += delta;
                y0 -= delta;
            }

            if (this.aspect == "fixed") {
                sy = Math.min(sx, sy);
                sx = sy;

                // Centers the shape inside the available space
                if (inverse) {
                    x0 += (h - this.w0 * sx) / 2;
                    y0 += (w - this.h0 * sy) / 2;
                } else {
                    x0 += (w - this.w0 * sx) / 2;
                    y0 += (h - this.h0 * sy) / 2;
                }
            }

            return new Rectangle(x0, y0, sx, sy);
        }

        // Gets the attribute for the given name from the given node.If the attribute
        // does not exist then the text content of the node is evaluated and if it is
        // a function it is invoked with <state> as the only argument and the return
        // value is used as the attribute value to be returned.
        evaluateAttribute(node: HTMLElement, attribute: string, shape: Shape) {
            var result = node.getAttribute(attribute);

            if (result == null) {
                var text = Utils.getTextContent(node);

                if (text != null && Stencil.allowEval) {
                    var funct = Utils.eval(text);

                    if (typeof (funct) == "function") {
                        result = funct(shape);
                    }
                }
            }

            return result;
        }

        // Gets the given attribute as a text. The return value from < evaluateAttribute >
        // is used as a key to < mxResources.get> if the localized attribute in the text node is 1 or if <defaultLocalized> is true.
        evaluateTextAttribute(node, attribute, state) {
            var result = this.evaluateAttribute(node, attribute, state);
            var loc = node.getAttribute("localized");

            if ((Stencil.defaultLocalized && loc == null) || loc == "1") {
                result = Resources.get(result);
            }

            return result;
        }
    }
   
}
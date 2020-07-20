module Five {
    export class SvgCanvas2D extends AbstractCanvas2D {
        // Specifies if pointer events should be handled. Default is true.
        pointerEvents = true;

        // Reference to the container for the SVG content.
        root: SVGElement;

        // Local cache of gradients for quick lookups
        gradients: SVGLinearGradientElement[] = [];

        // Reference to the defs section of the SVG document. Only for export.
        defs: Element = null;

        // Adds transparent paths for strokes.
        strokeTolerance = 0;

        // Default value for active pointer events.Default is all.
        pointerEventsValue = "all";

        // Specifies if a transparent rectangle should be added on top of images to absorb
        // all pointer events.Default is false.This is only needed in Firefox to disable
        // control - clicks on images.
        blockImagePointerEvents = false;

        // Holds the current DOM node.
        node: SVGElement = null;

        styleEnabled: boolean;

        // Specifies if text output should be enabled.Default is true.
        textEnabled = true;

        // Specifies if use of foreignObject for HTML markup is allowed.Default is true.
        foEnabled = true;

        // Padding to be added for text that is not wrapped to account for differences in font metrics on different platforms in pixels.Default is 10.
        fontMetricsPadding = 10;

        // Correction factor for <Constants.LINE_HEIGHT> in HTML output.Default is 1.05.
        lineHeightCorrection = 1.05;

        // Specifies the fallback text for unsupported foreignObjects in exported documents.Default is '[Object]'.
        // If this is set to null then no fallback text is added to the exported document.
        foAltText = "[Object]";

        // Specifies if plain text output should match the vertical HTML alignment. Defaul is true.
        matchHtmlAlignment = true;

        originalRoot: Element;

        // Local counter for references in SVG export.
        refCount = 0;


        constructor(root: SVGElement, styleEnabled: boolean) {
            super();

            this.root = root;
            this.styleEnabled = (styleEnabled != null) ? styleEnabled : false;

            var svg: Element = null;
            // Adds optional defs section for export
            if (root.ownerDocument != document) {
                var node: Element = root;

                // Finds owner SVG element in XML DOM
                while (node != null && node.nodeName != "svg") {
                    node = <Element>node.parentNode;
                }

                svg = node;
            }

            if (svg != null) {
                // Tries to get existing defs section
                // ReSharper disable once Html.TagNotResolved
                var tmp = svg.getElementsByTagName("defs");

                if (tmp.length > 0) {
                    // ReSharper disable once Html.TagNotResolved
                    this.defs = <Element>svg.getElementsByTagName("defs")[0];
                }

                // Adds defs section if none exists
                if (this.defs == null) {
                    this.defs = this.createElement("defs");

                    if (svg.firstChild != null) {
                        svg.insertBefore(this.defs, svg.firstChild);
                    } else {
                        svg.appendChild(this.defs);
                    }
                }

                // Adds stylesheet
                if (this.styleEnabled) {
                    this.defs.appendChild(this.createStyle());
                }
            }
        }

        private createGElement(className: string): SVGGElement {
            // todo unify construction
            var result = <SVGGElement>this.createElement("g");
            result.id = className + "#" + ObjectIdentity.nodeCounter++;
            return result;
        }

        private createElement(tagName: string, namespace: string = null) {
            if (this.root.ownerDocument.createElementNS != null) {
                return this.root.ownerDocument.createElementNS(namespace || Constants.nsSvg, tagName);
            } else {
                var elt = this.root.ownerDocument.createElement(tagName);

                if (namespace != null) {
                    elt.setAttribute("xmlns", namespace);
                }

                return elt;
            }
        }

        createStyle(): Element {
            /// <summary>Creates the optional style section</summary>
            /// <returns type="Element"></returns>
            var style = this.createElement("style");
            style.setAttribute("type", "text/css");
            Utils.write(style, "svg{font-family:" + Constants.defaultFontFamily +
                ";font-size:" + Constants.defaultFontSize +
                ";fill:none;stroke-miterlimit:10}");

            return style;
        }

        createSvgRect(): SVGRectElement {
            return <SVGRectElement>this.createElement("rect");
        }

        rect(x: number, y: number, w: number, h: number): void {
            var s = this.state;
            var n = this.createSvgRect();
            n.x.baseVal.value = this.format1((x + s.dx) * s.scale);
            n.y.baseVal.value = this.format1((y + s.dy) * s.scale);
            n.width.baseVal.value = this.format1(w * s.scale);
            n.height.baseVal.value = this.format1(h * s.scale);
            this.node = n;

        }

        roundrect(x: number, y: number, w: number, h: number, dx: number, dy: number): void {
            this.rect(x, y, w, h);

            if (dx > 0) {
                this.node.setAttribute("rx", "" + this.format1(dx * this.state.scale));
            }

            if (dy > 0) {
                this.node.setAttribute("ry", "" + this.format1(dy * this.state.scale));
            }
        }

        ellipse(x: number, y: number, w: number, h: number): void {
            var s = this.state;
            var n = <SVGEllipseElement>this.createElement("ellipse");
            // No rounding for consistent output with 1.x
            n.cx.baseVal.value = Math.round((x + w / 2 + s.dx) * s.scale);
            n.cy.baseVal.value = Math.round((y + h / 2 + s.dy) * s.scale);
            n.rx.baseVal.value = w / 2 * s.scale;
            n.ry.baseVal.value = h / 2 * s.scale;
            this.node = n;
        }

        // Private helper function to create SVG elements
        image(x: number, y: number, w: number, h: number, src: string, aspect = true, flipH = false, flipV = false) {
            src = this.converter.convert(src);
            var s = this.state;
            x += s.dx;
            y += s.dy;

            var node = this.createElement("image");
            node.setAttribute("x", "" + this.format1(x * s.scale));
            node.setAttribute("y", "" + this.format1(y * s.scale));
            node.setAttribute("width", "" + this.format1(w * s.scale));
            node.setAttribute("height", "" + this.format1(h * s.scale));

            // Workaround for missing namespace support
            if (node.setAttributeNS == null) {
                node.setAttribute("xlink:href", src);
            } else {
                node.setAttributeNS(Constants.nsXlink, "xlink:href", src);
            }

            if (!aspect) {
                node.setAttribute("preserveAspectRatio", "none");
            }

            if (s.alpha < 1) {
                node.setAttribute("opacity", "" + s.alpha);
            }

            var tr = this.state.transform || "";

            if (flipH || flipV) {
                var sx = 1;
                var sy = 1;
                var dx = 0;
                var dy = 0;

                if (flipH) {
                    sx = -1;
                    dx = -w - 2 * x;
                }

                if (flipV) {
                    sy = -1;
                    dy = -h - 2 * y;
                }

                // Adds image tansformation to existing transform
                tr += "scale(" + sx + "," + sy + ")translate(" + dx + "," + dy + ")";
            }

            if (tr.length > 0) {
                node.setAttribute("transform", tr);
            }

            if (!this.pointerEvents) {
                node.setAttribute("pointer-events", "none");
            }

            this.root.appendChild(node);

            // Disables control-clicks on images in Firefox to open in new tab
            // by putting a rect in the foreground that absorbs all events and
            // disabling all pointer-events on the original image tag.
            if (this.blockImagePointerEvents) {
                node.setAttribute("style", "pointer-events:none");

                node = this.createSvgRect();
                node.setAttribute("visibility", "hidden");
                node.setAttribute("pointer-events", "fill");
                node.setAttribute("x", "" + this.format1(x * s.scale));
                node.setAttribute("y", "" + this.format1(y * s.scale));
                node.setAttribute("width", "" + this.format1(w * s.scale));
                node.setAttribute("height", "" + this.format1(h * s.scale));
                this.root.appendChild(node);
            }
        }

        // Paints the given text. Possible values for format are empty string for plain
        // text and html for HTML markup. Note that HTML markup is only supported if
        // foreignObject is supported and <foEnabled> is true. (This means IE9 and later
        // does currently not support HTML text as part of shapes.)

        text(x: number, y: number, w: number, h: number, str, align: HorizontalAlign, valign: VerticalAlign, wrap: boolean, format: string, overflow: Overflow, clip: boolean, rotation: number): void {
            if (this.textEnabled && str != null) {
                rotation = (rotation != null) ? rotation : 0;

                var s = this.state;
                x += s.dx;
                y += s.dy;

                if (this.foEnabled && format == "html") {
					this.foreignObjectText(x, y, w, h, str, align, valign, wrap, format, overflow, clip, rotation, s);
                } else {
                    this.plainText(x, y, w, h, str, align, valign, wrap, overflow, clip, rotation);
                }
            }
        }

		foreignObjectText(x: number, y: number, w: number, h: number, str, align: HorizontalAlign, valign: VerticalAlign, wrap: boolean, format: string, overflow: Overflow, clip: boolean, rotation: number, s: CanvasState) {
			var style = "vertical-align:top;";

			if (clip) {
				style += "overflow:hidden;max-height:" + Math.round(h) + "px;width:" + Math.round(w) + "px;";
			} else if (overflow === Overflow.fill) {
				style += "width:" + Math.round(w) + "px;height:" + Math.round(h) + "px;";
            } else if (overflow == Overflow.width) {
				style += "width:" + Math.round(w) + "px;";

				if (h > 0) {
					style += "max-height:" + Math.round(h) + "px;";
				}
			}

			if (wrap && w > 0) {
				style += "width:" + Math.round(w) + "px;white-space:normal;";
			} else {
				style += "white-space:nowrap;";
			}

			// Uses outer group for opacity and transforms to fix rendering order in Chrome
			var group = this.createGElement("chromeOpacityFix");

			if (s.alpha < 1) {
				group.setAttribute("opacity", "" + s.alpha);
			}

			var fo = this.createElement("foreignObject");
			fo.setAttribute("pointer-events", "all");

			var div = this.createDiv(str, align, valign, style, overflow);

			// Ignores invalid XHTML labels
			if (div == null) {
				return;
			}

			group.appendChild(fo);
			this.root.appendChild(group);

			// Code that depends on the size which is computed after
			// the element was added to the DOM.
			var ow = 0;
			var oh = 0;

			// Padding avoids clipping on border and wrapping for differing font metrics on platforms
			var padX = 2;
			var padY = 2;

			// NOTE: IE is always export as it does not support foreign objects
			var tmp: number;
			var ws: string;
			if (Client.isIe && ((Client.isIe9 || !Client.isIe10) || !Client.isSvg)) {
				// Handles non-standard namespace for getting size in IE
				var clone = document.createElement("div");

				clone.style.cssText = div.getAttribute("style");
				clone.style.display = (Client.isQuirks) ? "inline" : "inline-block";
				clone.style.position = "absolute";
				clone.style.visibility = "hidden";

				// Inner DIV is needed for text measuring
				var div2 = document.createElement("div");
				div2.style.display = (Client.isQuirks) ? "inline" : "inline-block";
				div2.innerHTML = (Utils.isNode(str)) ? str.outerHTML : str;
				clone.appendChild(div2);

				document.body.appendChild(clone);

				// Workaround for different box models
				if (!Client.isIe8Or9 && s.fontBorderColor != null) {
					padX += 2;
					padY += 2;
				}

				if (wrap && w > 0) {
					tmp = div2.offsetWidth; // Workaround for adding padding twice in IE8/IE9 standards mode if label is wrapped
					var padDx = 0;

					// For export, if no wrapping occurs, we add a large padding to make
					// sure there is no wrapping even if the text metrics are different.
					// This adds support for text metrics on different operating systems.
					if (!clip && this.root.ownerDocument != document) {
						ws = clone.style.whiteSpace;
						clone.style.whiteSpace = "nowrap";

						// Checks if wrapped width is equal to non-wrapped width (ie no wrapping)
						if (tmp == div2.offsetWidth) {
							padX += this.fontMetricsPadding;
						} else if (Client.isIe8Or9) {
							padDx = -2;
						}

						// Restores the previous white space
						// This is expensive!
						clone.style.whiteSpace = ws;
					}

					// Required to update the height of the text box after wrapping width is known
					tmp = tmp + padX;

					if (clip) {
						tmp = Math.min(tmp, w);
					}

					clone.style.width = tmp + "px";

					// Padding avoids clipping on border
					ow = div2.offsetWidth + padX + padDx;
					oh = div2.offsetHeight + padY;

					// Overrides the width of the DIV via XML DOM by using the
					// clone DOM style, getting the CSS text for that and
					// then setting that on the DIV via setAttribute
					clone.style.display = "inline-block";
					clone.style.position = "";
					clone.style.visibility = "";
					clone.style.width = ow + "px";

					div.setAttribute("style", clone.style.cssText);
				} else {
					// Padding avoids clipping on border
					ow = div2.offsetWidth + padX;
					oh = div2.offsetHeight + padY;
				}

				clone.parentNode.removeChild(clone);
				fo.appendChild(div);
			} else {
				// Workaround for export and Firefox where sizes are not reported or updated correctly
				// when inside a foreignObject (Opera has same bug but it cannot be fixed for all cases
				// using this workaround so foreignObject is disabled).
				if (this.root.ownerDocument != document || Client.isFf) {
					// Getting size via local document for export
					div.style.visibility = "hidden";
					document.body.appendChild(div);
				} else {
					fo.appendChild(div);
				}

				var sizeDiv = div;

				if (sizeDiv.firstChild != null && sizeDiv.firstChild.nodeName === "DIV") {
					sizeDiv = <HTMLDivElement>sizeDiv.firstChild;
				}
				tmp = sizeDiv.offsetWidth; // For export, if no wrapping occurs, we add a large padding to make
				// sure there is no wrapping even if the text metrics are different.
				if (!clip && wrap && w > 0 && this.root.ownerDocument != document) {
					ws = div.style.whiteSpace;
					div.style.whiteSpace = "nowrap";

					if (tmp == sizeDiv.offsetWidth) {
						padX += this.fontMetricsPadding;
					}

					div.style.whiteSpace = ws;
				}

				ow = tmp + padX;

				// Recomputes the height of the element for wrapped width
				if (wrap) {
					if (clip) {
						ow = Math.min(ow, w);
					}

					div.style.width = ow + "px";
				}

				ow = sizeDiv.offsetWidth + padX;
				oh = sizeDiv.offsetHeight + 2;

				if (div.parentNode != fo) {
					fo.appendChild(div);
					div.style.visibility = "";
				}
			}

			if (clip) {
				oh = Math.min(oh, h);
			}

			if (overflow == Overflow.fill) {
				w = Math.max(w, ow);
				h = Math.max(h, oh);
            } else if (overflow == Overflow.width) {
				w = Math.max(w, ow);
				h = oh;
			} else {
				w = ow;
				h = oh;
			}

			if (s.alpha < 1) {
				group.setAttribute("opacity", "" + s.alpha);
			}

			var dx = 0;
			var dy = 0;

			if (align == HorizontalAlign.Center) {
				dx -= w / 2;
			} else if (align == HorizontalAlign.Right) {
				dx -= w;
			}

			x += dx;

			// FIXME: LINE_HEIGHT not ideal for all text sizes, fix for export
			if (valign == VerticalAlign.Middle) {
				dy -= h / 2 - 1;
			} else if (valign == VerticalAlign.Bottom) {
				dy -= h - 2;
			}

			y += dy;

			var tr = (s.scale != 1) ? "scale(" + s.scale + ")" : "";

			if (s.rotation != 0 && this.rotateHtml) {
				tr += "rotate(" + (s.rotation) + "," + (w / 2) + "," + (h / 2) + ")";
				var pt = this.rotatePoint((x + w / 2) * s.scale,(y + h / 2) * s.scale,
					s.rotation, s.rotationCx, s.rotationCy);
				x = pt.x - w * s.scale / 2;
				y = pt.y - h * s.scale / 2;
			} else {
				x *= s.scale;
				y *= s.scale;
			}

			if (rotation != 0) {
				tr += "rotate(" + (rotation) + "," + (-dx) + "," + (-dy) + ")";
			}

			group.setAttribute("transform", "translate(" + Math.round(x) + "," + Math.round(y) + ")" + tr);
			fo.setAttribute("width", "" + Math.round(Math.max(1, w)));
			fo.setAttribute("height", "" + Math.round(Math.max(1, h)));

			// Adds alternate content if foreignObject not supported in viewer
			if (this.root.ownerDocument != document) {
				var alt = this.createAlternateContent(fo, x, y, w, h, str, align, valign, wrap, format, overflow, clip, rotation);

				if (alt != null) {
					fo.setAttribute("requiredFeatures", "http://www.w3.org/TR/SVG11/feature#Extensibility");
					var sw = this.createElement("switch");
					sw.appendChild(fo);
					sw.appendChild(alt);
					group.appendChild(sw);
				}
			}

		}

        // Private helper function to create SVG elements
        createDiv(str: string, align: HorizontalAlign, valign: VerticalAlign, style: string, overflow: Overflow): HTMLDivElement {
            var s = this.state;

            // Inline block for rendering HTML background over SVG in Safari
            var lh = "" + (Constants.absoluteLineHeight) ? Math.round(s.fontSize * Constants.lineHeight) + "px" : "" + (Constants.lineHeight * this.lineHeightCorrection);

            style = "display:inline-block;font-size:" + Math.round(s.fontSize) + "px;font-family:" + s.fontFamily +
            ";color:" + s.fontColor + ";line-height:" + lh + ";" + style;

            if ((s.fontStyle & FontStyle.Bold) == FontStyle.Bold) {
                style += "font-weight:bold;";
            }

            if ((s.fontStyle & FontStyle.Italic) == FontStyle.Italic) {
                style += "font-style:italic;";
            }

            if ((s.fontStyle & FontStyle.Underline) == FontStyle.Underline) {
                style += "text-decoration:underline;";
            }

            var css = "";

            if (align == HorizontalAlign.Center) {
                style += "text-align:center;";
            } else if (align == HorizontalAlign.Right) {
                style += "text-align:right;";
            }

            if (s.fontBackgroundColor != null) {
                css += "background-color:" + s.fontBackgroundColor + ";";
            }

            if (s.fontBorderColor != null) {
                css += "border:1px solid " + s.fontBorderColor + ";";
            }

            var val = str;

            //if (!Utils.isNode(val)) 
            var ta = document.createElement("textarea");
            ta.innerHTML = val.replace(/&lt;/g, "&amp;lt;").replace(/&gt;/g, "&amp;gt;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
            val = ta.value;
            if (overflow != Overflow.fill && overflow != Overflow.width) {
                // Inner div always needed to measure wrapped text
                val = "<div xmlns=\"http://www.w3.org/1999/xhtml\" style=\"display:inline-block;text-align:inherit;text-decoration:inherit;" + css + "\">" + val + "</div>";
            } else {
                style += css;
            } // Uses DOM API where available. This cannot be used in IE9/10 to avoid
            // an opening and two (!) closing TBODY tags being added to tables.
            if (!Client.isIe && !Client.isIe11 && document.createElementNS) {
                var div = <HTMLDivElement>document.createElementNS(Constants.nsXhtml, "div");
                div.setAttribute("style", style);

                //            if (Utils.isNode(val)) {
                //                // Creates a copy for export
                //                if (this.root.ownerDocument != document) {
                //                    div.appendChild(val.cloneNode(true));
                //                }
                //                else {
                //                    div.appendChild(val);
                //                }
                //            }
                //            else 
                div.innerHTML = val;
                return div;
            } else {
                // Serializes for export
                //            if (Utils.isNode(val) && this.root.ownerDocument != document) {
                //                val = val.outerHTML;
                //            }

                // Converts invalid tags to XHTML
                // LATER: Check for all unclosed tags
                val = val.replace(/<br>/g, "<br />").replace(/<hr>/g, "<hr />");

                // NOTE: FF 3.6 crashes if content CSS contains "height:100%"
                return <HTMLDivElement>Utils.parseXml("<div xmlns=\"" + Constants.nsXhtml + "\" style=\"" + style + "\">" + val + "</div>").documentElement;
            }
        }

        // Returns the alternate content for the given foreignObject.
        createAlternateContent(fo: Element, x: number, y: number, w: number, h: number, str, align, valign, wrap: boolean, format: string, overflow: Overflow, clip: boolean, rotation: number) {
            if (this.foAltText != null) {
                var s = this.state;
                var alt = this.createElement("text");
                alt.setAttribute("x", "" + Math.round(w / 2));
                alt.setAttribute("y", "" + Math.round((h + s.fontSize) / 2));
                alt.setAttribute("fill", s.fontColor || "black");
                alt.setAttribute("text-anchor", "middle");
                alt.setAttribute("font-size", Math.round(s.fontSize) + "px");
                alt.setAttribute("font-family", s.fontFamily);

                if ((s.fontStyle & FontStyle.Bold) == FontStyle.Bold) {
                    alt.setAttribute("font-weight", "bold");
                }

                if ((s.fontStyle & FontStyle.Italic) == FontStyle.Italic) {
                    alt.setAttribute("font-style", "italic");
                }

                if ((s.fontStyle & FontStyle.Underline) == FontStyle.Underline) {
                    alt.setAttribute("text-decoration", "underline");
                }

                Utils.write(alt, this.foAltText);

                return alt;
            } else {
                return null;
            }
        }

        begin() {
            super.begin();
            this.node = <SVGPathElement>this.createElement("path");
        }

        private textFlow(myText: string, textToAppend: SVGTextElement, maxWidth: number, x: number, ddy: number, justified: boolean) {
            //extract and add line breaks for start
            var dashArray: number[] = [];
            var dashFound = true;
            var indexPos = 0;
            var cumulY = 0;
            var checkDashPosition = (pos: number) : boolean => {
                for (var j = 0; j < dashArray.length; j++) {
                    if (dashArray[j] === pos) {
                        return true;
                    }
                }
                return false;
            }

            while (dashFound) {
                var result = myText.indexOf("-", indexPos);
                if (result === -1) {
                    //could not find a dash
                    dashFound = false;
                } else {
                    dashArray.push(result);
                    indexPos = result + 1;
                }
            }
            //split the text at all spaces and dashes
            var words = myText.split(/[\s-]/);
            var line = "";
            var dy = 0;
            var curNumChars = 0;
            var computedTextLength = 0;
            var myTextNode: Text;
            var tspanEl: SVGTSpanElement;

            var addTextSpan = (text: string) => {
                tspanEl = <SVGTSpanElement>(this.createElement("tspan"));
                tspanEl.setAttributeNS(null, "x", String(x));
                tspanEl.setAttributeNS(null, "dy", String(dy));
                myTextNode = document.createTextNode(text);
                tspanEl.appendChild(myTextNode);
                textToAppend.appendChild(tspanEl);
            }

            for (var i = 0; i < words.length; i++) {
                var word = words[i];
                curNumChars += word.length + 1;
                var tempText;
                if (computedTextLength > maxWidth || i == 0) {
                    if (computedTextLength > maxWidth) {
                        tempText = tspanEl.firstChild.nodeValue;
                        tempText = tempText.slice(0, (tempText.length - words[i - 1].length - 2)); //the -2 is because we also strip off white space
                        tspanEl.firstChild.nodeValue = tempText;
                        if (justified) {
                            //determine the number of words in this line
                            var nrWords = tempText.split(/\s/).length;
                            computedTextLength = tspanEl.getComputedTextLength();
                            var additionalWordSpacing = (maxWidth - computedTextLength) / (nrWords - 1);
                            tspanEl.setAttributeNS(null, "word-spacing", String(additionalWordSpacing));
                            //alternatively one could use textLength and lengthAdjust, however, currently this is not too well supported in SVG UA's
                        }
                    }
                    addTextSpan(line);

                    if (checkDashPosition(curNumChars - 1)) {
                        line = word + "-";
                    } else {
                        line = word + " ";
                    }
                    if (i != 0) {
                        line = words[i - 1] + " " + line;
                    }
                    dy = ddy;
                    cumulY += dy;
                } else {
                    if (checkDashPosition(curNumChars - 1)) {
                        line += word + "-";
                    } else {
                        line += word + " ";
                    }
                }
                tspanEl.firstChild.nodeValue = line;
                computedTextLength = tspanEl.getComputedTextLength();
                if (i == words.length - 1) {
                    if (computedTextLength > maxWidth) {
                        tempText = tspanEl.firstChild.nodeValue;
                        tspanEl.firstChild.nodeValue = tempText.slice(0, (tempText.length - words[i].length - 1));
                        addTextSpan(words[i]);
                    }

                }
            }
            return cumulY;
        }

        // Paints the given text.Possible values for format are empty string for
        // plain text and html for HTML markup.
        plainText(x: number, y: number, w: number, h: number, str: string, align: HorizontalAlign, valign: VerticalAlign, wrap: boolean, overflow: Overflow, clip: boolean, rotation: number) {
            rotation = (rotation != null) ? rotation : 0;
            var s = this.state;
            var size = Math.round(s.fontSize);
            var node = this.createGElement("textcontainer");
            var tr = s.transform || "";
            this.updateFont(node);

            // Non-rotated text
            if (rotation != 0) {
                tr += "rotate(" + rotation + "," + this.format1(x * s.scale) + "," + this.format1(y * s.scale) + ")";
            }
            var cy: number;
            if (clip && w > 0 && h > 0) {
                var cx = x;
                cy = y;
                if (align == HorizontalAlign.Center) {
                    cx -= w / 2;
                } else if (align == HorizontalAlign.Right) {
                    cx -= w;
                }

                if (overflow != Overflow.fill) {
                    if (valign == VerticalAlign.Middle) {
                        cy -= h / 2;
                    } else if (valign == VerticalAlign.Bottom) {
                        cy -= h;
                    }
                }

                // LATER: Remove spacing from clip rectangle
                var c = this.createClip(cx * s.scale - 2, cy * s.scale - 2, w * s.scale + 4, h * s.scale + 4);

                if (this.defs != null) {
                    this.defs.appendChild(c);
                } else {
                    // Makes sure clip is removed with referencing node
                    this.root.appendChild(c);
                }

                if (!Client.isIe && this.root.ownerDocument == document) {
                    // Workaround for potential base tag
                    node.setAttribute("clip-path", "url(" + this.getBaseUrl() + "#" + c.getAttribute("id") + ")");
                } else {
                    node.setAttribute("clip-path", "url(#" + c.getAttribute("id") + ")");
                }
            }

            // Default is left
            var anchor = (align == HorizontalAlign.Right) ? "end" :
                (align == HorizontalAlign.Center) ? "middle" :
                "start";

            // Text-anchor start is default in SVG
            if (anchor != "start") {
                node.setAttribute("text-anchor", anchor);
            }

            if (!this.styleEnabled || size != Constants.defaultFontSize) {
                node.setAttribute("font-size", Math.round(size * s.scale) + "px");
            }

            if (tr.length > 0) {
                node.setAttribute("transform", tr);
            }

            if (s.alpha < 1) {
                node.setAttribute("opacity", "" + s.alpha);
            }
            var text: SVGTextElement;
            var dy: number;
            var lh = Math.round(size * Constants.lineHeight);
            if (wrap) {
                text = <SVGTextElement>this.createElement("text");
                node.appendChild(text);
                this.root.appendChild(node);
                var scaledX = Math.round(x * s.scale);
                dy = this.textFlow(str, text, 160, scaledX, lh, false);
                cy = y + size - 1;
                if (valign == VerticalAlign.Middle) {
                    if (overflow == Overflow.fill) {
                        cy -= h / 2;
                    } else {
                        dy = ((this.matchHtmlAlignment && clip && h > 0) ? Math.min(dy, h) : dy) / 2;
                        cy -= dy + 1;
                    }
                } else if (valign == VerticalAlign.Bottom) {
                    if (overflow == Overflow.fill) {
                        cy -= h;
                    } else {
                        dy = (this.matchHtmlAlignment && clip && h > 0) ? Math.min(dy, h) : dy;
                        cy -= dy + 2;
                    }
                }
                var scaledY = Math.round(cy * s.scale);
                text.setAttribute("x", "" + scaledX);
                text.setAttribute("y", "" + scaledY);

            } else {
                var lines = str.split("\n");
                var textHeight = size + (lines.length - 1) * lh;
                cy = y + size - 1;
                if (valign == VerticalAlign.Middle) {
                    if (overflow == Overflow.fill) {
                        cy -= h / 2;
                    } else {
                        dy = ((this.matchHtmlAlignment && clip && h > 0) ? Math.min(textHeight, h) : textHeight) / 2;
                        cy -= dy + 1;
                    }
                } else if (valign == VerticalAlign.Bottom) {
                    if (overflow == Overflow.fill) {
                        cy -= h;
                    } else {
                        dy = (this.matchHtmlAlignment && clip && h > 0) ? Math.min(textHeight, h) : textHeight;
                        cy -= dy + 2;
                    }
                }

                for (var i = 0; i < lines.length; i++) {
                    // Workaround for bounding box of empty lines and spaces
                    if (lines[i].length > 0 && Utils.trim(lines[i]).length > 0) {
                        text = <SVGTextElement>this.createElement("text"); // LATER: Match horizontal HTML alignment
                        text.setAttribute("x", "" + this.format1(x * s.scale));
                        text.setAttribute("y", "" + this.format1(cy * s.scale));

                        Utils.write(text, lines[i]);
                        node.appendChild(text);
                    }

                    cy += lh;
                }
                this.root.appendChild(node);
                this.addTextBackground(node, str, x, y, w, (overflow == Overflow.fill) ? h : textHeight, align, valign, overflow);
            }

        }

        // Updates the text properties for the given node.(NOTE: For this to work in
        // IE, the given node must be a text or tspan element.)
        updateFont(node: Element) {
            var s = this.state;

            node.setAttribute("fill", s.fontColor);

            if (!this.styleEnabled || s.fontFamily != Constants.defaultFontFamily) {
                node.setAttribute("font-family", s.fontFamily);
            }

            if ((s.fontStyle & FontStyle.Bold) == FontStyle.Bold) {
                node.setAttribute("font-weight", "bold");
            }

            if ((s.fontStyle & FontStyle.Italic) == FontStyle.Italic) {
                node.setAttribute("font-style", "italic");
            }

            if ((s.fontStyle & FontStyle.Underline) == FontStyle.Underline) {
                node.setAttribute("text-decoration", "underline");
            }
        }

        // Creates a clip for the given coordinates.
        createClip(x: number, y: number, w: number, h: number) {
            x = Math.round(x);
            y = Math.round(y);
            w = Math.round(w);
            h = Math.round(h);

            var id = "mx-clip-" + x + "-" + y + "-" + w + "-" + h;

            var counter = 0;
            var tmp = id + "-" + counter;

            // Resolves ID conflicts
            while (document.getElementById(tmp) != null) {
                tmp = id + "-" + (++counter);
            }

            var clip = <SVGClipPathElement>this.createElement("clipPath");
            clip.setAttribute("id", tmp);

            var rect = this.createSvgRect();
            rect.x.baseVal.value = x;
            rect.y.baseVal.value = y;
            rect.width.baseVal.value = w;
            rect.height.baseVal.value = h;

            clip.appendChild(rect);

            return clip;
        }

        // Returns the URL of the page without the hash part.This needs to use href to
        // include any search part with no params(ie question mark alone).This is a
        // workaround for the fact that window.location.search is empty if there is
        //  no search string behind the question mark.
        getBaseUrl(): string {
            var href = window.location.href;
            var hash = href.lastIndexOf("#");

            if (hash > 0) {
                href = href.substring(0, hash);
            }

            return href;
        }

        // Private helper function to create SVG elements
        private addNode(filled: boolean, stroked: boolean): void {
            var node = this.node;
            var s = this.state;

            if (node != null) {
                if (node.nodeName == "path") {
                    // Checks if the path is not empty
                    if (this.path != null && this.path.length > 0) {
                        node.setAttribute("d", this.path.join(" "));
                    } else {
                        return;
                    }
                }

                if (filled && s.fillColor != null) {
                    this.updateFill();
                } else if (!this.styleEnabled) {
                    // Workaround for https://bugzilla.mozilla.org/show_bug.cgi?id=814952
                    if (node.nodeName == "ellipse" && Client.isFf) {
                        node.setAttribute("fill", "transparent");
                    } else {
                        node.setAttribute("fill", "none");
                    }

                    // Sets the actual filled state for stroke tolerance
                    filled = false;
                }

                if (stroked && s.strokeColor != null) {
                    this.updateStroke();
                } else if (!this.styleEnabled) {
                    node.setAttribute("stroke", "none");
                }

                if (s.transform != null && s.transform.length > 0) {
                    node.setAttribute("transform", s.transform);
                }

                if (s.shadow) {
                    this.root.appendChild(this.createShadow(node));
                }

                // Adds stroke tolerance
                if (this.strokeTolerance > 0 && !filled) {
                    this.root.appendChild(this.createTolerance(node));
                }

                // Adds pointer events
                if (this.pointerEvents && (node.nodeName != "path" ||
                    this.path[this.path.length - 1] == this.closeOp)) {
                    node.setAttribute("pointer-events", this.pointerEventsValue);
                }
                // Enables clicks for nodes inside a link element
                else if (!this.pointerEvents && this.originalRoot == null) {
                    node.setAttribute("pointer-events", "none");
                }

                // LATER: Update existing DOM for performance
                this.root.appendChild(node);
            }
        }

        // Transfers the stroke attributes from<state> to <node>.
        updateFill() {
            var s = this.state;

            if (s.alpha < 1) {
                this.node.setAttribute("fill-opacity", "" + s.alpha);
            }

            if (s.fillColor != null) {
                if (s.gradientColor != null) {
                    var id = this.getSvgGradient(s.fillColor, s.gradientColor, s.fillAlpha, s.gradientAlpha, s.gradientDirection);

                    if (!Client.isIe && this.root.ownerDocument == document) {
                        // Workaround for potential base tag
                        this.node.setAttribute("fill", "url(" + this.getBaseUrl() + "#" + id + ")");
                    } else {
                        this.node.setAttribute("fill", "url(#" + id + ")");
                    }
                } else {
                    this.node.setAttribute("fill", s.fillColor.toLowerCase());
                }
            }
        }

        // Background color and border
        private addTextBackground(node: SVGGElement, str: string, x: number, y: number, w: number, h: number, align: HorizontalAlign, valign: VerticalAlign, overflow: Overflow) {
            var s = this.state;

            if (s.fontBackgroundColor != null || s.fontBorderColor != null) {
                var bbox = null;

                if (overflow == Overflow.fill || overflow == Overflow.width) {
                    if (align == HorizontalAlign.Center) {
                        x -= w / 2;
                    } else if (align == HorizontalAlign.Right) {
                        x -= w;
                    }

                    if (valign == VerticalAlign.Middle) {
                        y -= h / 2;
                    } else if (valign == VerticalAlign.Bottom) {
                        y -= h;
                    }

                    bbox = new Rectangle((x + 1) * s.scale, y * s.scale, (w - 2) * s.scale, (h + 2) * s.scale);
                } else if (node.getBBox != null && this.root.ownerDocument == document) {
                    // Uses getBBox only if inside document for correct size
                    try {
                        bbox = node.getBBox();
                        var ie = Client.isIe && Client.isSvg;
                        bbox = new Rectangle(bbox.x, bbox.y + ((ie) ? 0 : 1), bbox.width, bbox.height + ((ie) ? 1 : 0));
                    } catch (e) {
                        // Ignores NS_ERROR_FAILURE in FF if container display is none.
                    }
                } else {
                    // Computes size if not in document or no getBBox available
                    var div = document.createElement("div");

                    // Wrapping and clipping can be ignored here
                    div.style.lineHeight = (Constants.absoluteLineHeight) ? "" + Math.round(s.fontSize * Constants.lineHeight) + "px" : "" + Constants.lineHeight;
                    div.style.fontSize = Math.round(s.fontSize) + "px";
                    div.style.fontFamily = s.fontFamily;
                    div.style.whiteSpace = "nowrap";
                    div.style.position = "absolute";
                    div.style.visibility = "hidden";
                    div.style.display = (Client.isQuirks) ? "inline" : "inline-block";
                    div.style.zoom = "1";

                    if ((s.fontStyle & FontStyle.Bold) == FontStyle.Bold) {
                        div.style.fontWeight = "bold";
                    }

                    if ((s.fontStyle & FontStyle.Italic) == FontStyle.Italic) {
                        div.style.fontStyle = "italic";
                    }

                    str = Utils.htmlEntities(str, false);
                    div.innerHTML = str.replace(/\n/g, "<br/>");

                    document.body.appendChild(div);
                    w = div.offsetWidth;
                    h = div.offsetHeight;
                    div.parentNode.removeChild(div);

                    if (align == HorizontalAlign.Center) {
                        x -= w / 2;
                    } else if (align == HorizontalAlign.Right) {
                        x -= w;
                    }

                    if (valign == VerticalAlign.Middle) {
                        y -= h / 2;
                    } else if (valign == VerticalAlign.Bottom) {
                        y -= h;
                    }

                    bbox = new Rectangle((x + 1) * s.scale, (y + 2) * s.scale, w * s.scale, (h + 1) * s.scale);
                }

                if (bbox != null) {
                    var n = this.createSvgRect();
                    n.setAttribute("fill", s.fontBackgroundColor || "none");
                    n.setAttribute("stroke", s.fontBorderColor || "none");
                    n.x.baseVal.value = Math.floor(bbox.x - 1);
                    n.y.baseVal.value = Math.floor(bbox.y - 1);
                    n.width.baseVal.value = Math.ceil(bbox.width + 2);
                    n.height.baseVal.value = Math.ceil(bbox.height);

                    var sw = (s.fontBorderColor != null) ? Math.max(1, this.format1(s.scale)) : 0;
                    n.setAttribute("stroke-width", "" + sw);

                    // Workaround for crisp rendering - only required if not exporting
                    if (this.root.ownerDocument == document && Utils.mod(sw, 2) == 1) {
                        n.setAttribute("transform", "translate(0.5, 0.5)");
                    }

                    node.insertBefore(n, node.firstChild);
                }
            }
        }

        // Transfers the stroke attributes from<state> to <node>.
        updateStroke() {
            var s = this.state;

            this.node.setAttribute("stroke", s.strokeColor.toLowerCase());

            if (s.alpha < 1) {
                this.node.setAttribute("stroke-opacity", "" + s.alpha);
            }

            var sw = this.getCurrentStrokeWidth();

            if (sw !== 1) {
                this.node.setAttribute("stroke-width", "" + sw);
            }

            if (this.node.nodeName == "path") {
                this.updateStrokeAttributes();
            }

            if (s.dashed) {
                this.node.setAttribute("stroke-dasharray", this.createDashPattern(s.strokeWidth * s.scale));
            }
        }

        // Creates a shadow for the given node.
        createShadow(node: SVGElement): Node {
            var shadow = <SVGElement>node.cloneNode(true);
            var s = this.state;

            if (shadow.getAttribute("fill") != "none") {
                shadow.setAttribute("fill", s.shadowColor);
            }

            if (shadow.getAttribute("stroke") != "none") {
                shadow.setAttribute("stroke", s.shadowColor);
            }

            shadow.setAttribute("transform", "translate(" + this.format1(s.shadowDx * s.scale) + "," + this.format1(s.shadowDy * s.scale) + ")" + (s.transform || ""));
            shadow.setAttribute("opacity", "" + s.shadowAlpha);

            return shadow;
        }

        // Creates a hit detection tolerance shape for the given node.
        createTolerance(node: Element) {
            var tol = <Element>node.cloneNode(true);
            var sw: number = parseFloat(tol.getAttribute("stroke-width") || "1") + this.strokeTolerance;
            tol.setAttribute("pointer-events", "stroke");
            tol.setAttribute("visibility", "hidden");
            tol.removeAttribute("stroke-dasharray");
            tol.setAttribute("stroke-width", String(sw));
            tol.setAttribute("fill", "none");

            // Workaround for Opera ignoring the visiblity attribute above while
            // other browsers need a stroke color to perform the hit-detection but
            // do not ignore the visibility attribute. Side-effect is that Opera's
            // hit detection for horizontal/vertical edges seems to ignore the tol.
            tol.setAttribute("stroke", (Client.isOp) ? "none" : "white");

            return tol;
        }

        private getSvgGradient(start: string, end: string, alpha1: number, alpha2: number, direction: Direction) {
            var id = this.createGradientId(start, end, alpha1, alpha2, direction);
            var gradient: SVGLinearGradientElement = this.gradients[id];

            if (gradient == null) {
                var svg = this.root.ownerSVGElement;

                var counter = 0;
                var tmpId = id + "-" + counter;

                if (svg != null) {
                    gradient = <SVGLinearGradientElement>svg.getElementById(tmpId);

                    while (gradient != null && gradient.ownerSVGElement != svg) {
                        tmpId = id + "-" + counter++;
                        gradient = <SVGLinearGradientElement>svg.getElementById(tmpId);
                    }
                } else {
                    // Uses shorter IDs for export
                    tmpId = "id" + (++this.refCount);
                }

                if (gradient == null) {
                    gradient = this.createSvgGradient(start, end, alpha1, alpha2, direction);
                    gradient.setAttribute("id", tmpId);

                    if (this.defs != null) {
                        this.defs.appendChild(gradient);
                    } else {
                        svg.appendChild(gradient);
                    }
                }

                this.gradients[id] = gradient;
            }

            return gradient.getAttribute("id");
        }

        // Returns the current stroke width (>= 1), ie. max(1, this.format(this.state.strokeWidth * this.state.scale)).
        private getCurrentStrokeWidth(): number {
            return Math.max(1, this.format1(this.state.strokeWidth * this.state.scale));
        }

        // Transfers the stroke attributes from<state> to <node>.
        updateStrokeAttributes() {
            var s = this.state;

            // Linejoin miter is default in SVG
            if (s.lineJoin != null && s.lineJoin != "miter") {
                this.node.setAttribute("stroke-linejoin", s.lineJoin);
            }

            if (s.lineCap != null) {
                // flat is called butt in SVG
                var value = s.lineCap;

                if (value == "flat") {
                    value = "butt";
                }

                // Linecap butt is default in SVG
                if (value != "butt") {
                    this.node.setAttribute("stroke-linecap", value);
                }
            }

            // Miterlimit 10 is default in our document
            if (s.miterLimit != null && (!this.styleEnabled || s.miterLimit != 10)) {
                this.node.setAttribute("stroke-miterlimit", "" + s.miterLimit);
            }
        }

        // Creates the SVG dash pattern for the given state.
        private createDashPattern(scale: number): string {
            var pat = [];

            if (typeof (this.state.dashPattern) === "string") {
                var dash = this.state.dashPattern.split(" ");

                if (dash.length > 0) {
                    for (var i = 0; i < dash.length; i++) {
                        pat[i] = Number(dash[i]) * scale;
                    }
                }
            }

            return pat.join(" ");
        }

        private createGradientId(start: string, end: string, alpha1: number, alpha2: number, direction: Direction) {
            // Removes illegal characters from gradient ID
            if (start.charAt(0) == "#") {
                start = start.substring(1);
            }

            if (end.charAt(0) == "#") {
                end = end.substring(1);
            }

            // Workaround for gradient IDs not working in Safari 5 / Chrome 6
            // if they contain uppercase characters
            start = start.toLowerCase() + "-" + alpha1;
            end = end.toLowerCase() + "-" + alpha2;

            // Wrong gradient directions possible?
            var dir = null;

            if (direction == null || direction == Direction.South) {
                dir = "s";
            } else if (direction == Direction.East) {
                dir = "e";
            } else {
                var tmp = start;
                start = end;
                end = tmp;

                if (direction == Direction.North) {
                    dir = "s";
                } else if (direction == Direction.West) {
                    dir = "e";
                }
            }

            return "mx-gradient-" + start + "-" + end + "-" + dir;
        }

        private createSvgGradient(start: string, end: string, alpha1: number, alpha2: number, direction: Direction) : SVGLinearGradientElement {
            var gradient = <SVGLinearGradientElement>this.createElement("linearGradient");
            gradient.x1.baseVal.newValueSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_PERCENTAGE, 0);
            gradient.y1.baseVal.newValueSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_PERCENTAGE, 0);
            gradient.x2.baseVal.newValueSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_PERCENTAGE, 0);
            gradient.y2.baseVal.newValueSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_PERCENTAGE, 0);

            switch (direction) {

            case Direction.South:
            default:
                gradient.y2.baseVal.newValueSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_PERCENTAGE, 100);
                break;
            case Direction.East:
                gradient.x2.baseVal.newValueSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_PERCENTAGE, 100);
                break;
            case Direction.North:
                gradient.y1.baseVal.newValueSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_PERCENTAGE, 100);
                break;
            case Direction.West:
                gradient.x1.baseVal.newValueSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_PERCENTAGE, 100);
                break;
            }

            var stop = <SVGStopElement>this.createElement("stop");
            stop.offset.baseVal = 0;
            stop.style.stopColor = start;
            if (alpha1 < 1)
                stop.style.stopOpacity = "" + alpha1;
            gradient.appendChild(stop);

            stop = <SVGStopElement>this.createElement("stop");
            stop.offset.baseVal = 100;
            stop.style.stopColor = end;
            if (alpha2 < 1)
                stop.style.stopOpacity = "" + alpha2;
            gradient.appendChild(stop);

            return gradient;
        }

        // Fills and paints the outline of the current path.
        fillAndStroke(): void {
            this.addNode(true, true);
        }

        fill(): void {
            this.addNode(true, false);
        }

        stroke(): void {
            this.addNode(false, true);
        }

/*
        createFilters() {
            <filter id="shadow" width= "1.5" height= "1.5" x= "-.25" y= "-.25" >
            <feGaussianBlur in="SourceAlpha" stdDeviation= "2.5" result= "blur" />
            <feColorMatrix result="bluralpha" type= "matrix" values=
            "1 0 0 0   0
            0 1 0 0   0
            0 0 1 0   0
            0 0 0 0.4 0 "/>
            < feOffset in="bluralpha" dx= "3" dy= "3" result= "offsetBlur" />
            <feMerge>
            <feMergeNode in="offsetBlur" />
            <feMergeNode in="SourceGraphic" />
            </feMerge>
            < /filter>

            < !--a transparent grey glow with no offset -- >
            <filter id="black-glow" >
            <feColorMatrix type="matrix" values=
            "0 0 0 0   0
            0 0 0 0   0
            0 0 0 0   0
            0 0 0 0.7 0"/>
            < feGaussianBlur stdDeviation= "2.5" result= "coloredBlur" />
            <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
            </feMerge>
            < /filter>

            < !--a transparent glow that takes on the colour of the object it's applied to -->
            < filter id= "glow" >
            <feGaussianBlur stdDeviation="2.5" result= "coloredBlur" />
            <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
            </feMerge>
            < /filter>
            < rect x= "0" y= "5" width= "80" height= "30" rx= "6" ry= "6"
            style = "stroke-width: 2; xstroke: #FFFFFF; fill: #555555; filter:url(#shadow)" />
                  
        }
*/

    }
}
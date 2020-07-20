module Five {

    export class CellEditor {
        constructor(graph) {
            this.graph = graph;
        }

        // Reference to the enclosing Graph.
        private graph: Graph = null;

        // Holds the input textarea. Note that this may be null before the first edit. Instantiated in <init>.
        private textarea: HTMLTextAreaElement = null;

        //Reference to the Cell that is currently being edited.
        private editingCell: Cell = null;

        // Reference to the event that was used to start editing.
        private trigger: MouseEvent = null;

        // Specifies if the label has been modified.
        private modified = false;

        // Specifies if the textarea should be resized while the text is being edited.
        private autoSize = true;

        //Specifies if the text should be selected when editing starts. 
        private selectText = true;

        // Text to be displayed for empty labels. Default is ''. This can be set to eg. "[Type Here]" to easier visualize editing of empty labels. 
        // The value is only displayed before the first keystroke and is never used as the actual editing value.
        private emptyLabelText = "";

        // Reference to the label DOM node that has been hidden.
        private textNode: Element;

        // Specifies the zIndex for the textarea. Default is 5.
        private zIndex = 5;

        changeHandler: (event) => void;

        textDiv: HTMLDivElement;
        bounds: Rectangle;
        clearOnChange: boolean;

        init() {
            /// <summary>Creates the textarea and installs the event listeners. The key handler updates the modified state</summary>
            this.textarea = document.createElement("textarea");
            this.textarea.className = "CellEditor";
            this.textarea.style.position = "absolute";
            this.textarea.style.overflow = "visible";

            this.textarea.setAttribute("cols", "20");
            this.textarea.setAttribute("rows", "4");

            //        if (Client.isNs) {
            //            this.textarea.style.resize = 'none';
            //        }

            this.installListeners(this.textarea);
        }

        installListeners(elt) {
            /// <summary>Installs listeners for focus, change and standard key event handling. NOTE: This code requires support for a value property in elt.</summary>
            /// <param name="elt" type="Object"></param>
            Events.addListener(elt, "blur", Utils.bind(this, evt => {
                this.focusLost(evt);
            }));

            Events.addListener(elt, "change", Utils.bind(this, () =>  {
                this.setModified(true);
            }));

            Events.addListener(elt, "keydown", Utils.bind(this, (evt: KeyboardEvent) => {
                if (!Events.isConsumed(evt)) {
                    if (this.isStopEditingEvent(evt)) {
                        this.graph.stopEditing(false);
                        Events.consume(evt);
                    } else if (evt.keyCode == 27 /* Escape */) {
                        this.graph.stopEditing(true);
                        Events.consume(evt);
                    } else {
                        // Clears the initial empty label on the first keystroke
                        if (this.clearOnChange && elt.value == this.getEmptyLabelText()) {
                            this.clearOnChange = false;
                            elt.value = "";
                        }

                        // Updates the modified flag for storing the value
                        this.setModified(true);
                    }
                }
            }));

            // Adds handling of deleted cells while editing
            this.changeHandler = () =>  {
                if (this.editingCell != null && this.graph.getView().getState(this.editingCell) == null) {
                    this.stopEditing(true);
                }
            };

            this.graph.getModel().onChange.add(this.changeHandler);

            // Adds automatic resizing of the textbox while typing
            // Use input event in all browsers and IE >= 9 for resize
            var evtName = (!Client.isIe || document.documentMode >= 9) ? "input" : "keypress";
            Events.addListener(elt, evtName, Utils.bind(this, evt =>  {
                if (this.autoSize && !Events.isConsumed(evt)) {
                    setTimeout(Utils.bind(this, () => {
                        this.resize();
                    }), 0);
                }
            }));
        }

        isStopEditingEvent(evt: KeyboardEvent) {
            /// <summary>Returns true if the given keydown event should stop cell editing. This returns true if F2 is pressed of if Graph.enterStopsCellEditing is true and enter is pressed without control or shift.</summary>
            /// <param name="evt" type="Object"></param>
            /// <returns type="Object"></returns>
            return evt.keyCode === 113 /* F2 */ || (this.graph.isEnterStopsCellEditing() &&
                evt.keyCode === 13 /* Enter */ && !Events.isControlDown(evt) &&
                !Events.isShiftDown(evt));
        }

        isEventSource(evt: Event): boolean {
            /// <summary>Returns true if this editor is the source for the given native event.</summary>
            return Events.getSource(evt) === this.textarea;
        }

        resize() {
            if (this.textDiv != null) {
                var state = this.graph.getView().getState(this.editingCell);

                if (state == null) {
                    this.stopEditing(true);
                } else {
                    var clip = this.graph.isLabelClipped(state.cell);
                    var wrap = this.graph.isWrapping(state.cell);
                    var isEdge = this.graph.getModel().isEdge(state.cell);
                    var scale = this.graph.getView().scale;
                    var spacing = parseInt(state.style[Constants.styleSpacing] || "0") * scale;
                    var spacingTop = (parseInt(state.style[Constants.styleSpacingTop] || "0") + TextShape.baseSpacingTop) * scale + spacing;
                    var spacingRight = (parseInt(state.style[Constants.styleSpacingRight] || "0") + TextShape.baseSpacingRight) * scale + spacing;
                    var spacingBottom = (parseInt(state.style[Constants.styleSpacingBottom] || "0") + TextShape.baseSpacingBottom) * scale + spacing;
                    var spacingLeft = (parseInt(state.style[Constants.styleSpacingLeft] || "0") + TextShape.baseSpacingLeft) * scale + spacing;

                    var bds = new Rectangle(state.x, state.y, state.width - spacingLeft - spacingRight, state.height - spacingTop - spacingBottom);
                    bds = (state.shape != null) ? state.shape.getLabelBounds(bds) : bds;

                    if (isEdge) {
                        this.bounds.x = state.absoluteOffset.x;
                        this.bounds.y = state.absoluteOffset.y;
                        this.bounds.width = 0;
                        this.bounds.height = 0;
                    } else if (this.bounds != null) {
                        this.bounds.x = bds.x + state.absoluteOffset.x;
                        this.bounds.y = bds.y + state.absoluteOffset.y;
                        this.bounds.width = bds.width;
                        this.bounds.height = bds.height;
                    }

                    var value = this.textarea.value;

                    if (value.charAt(value.length - 1) == "\n" || value == "") {
                        value += "&nbsp;";
                    }

                    value = Utils.htmlEntities(value, false);

                    if (wrap) {
                        // TODO: Invert initial for vertical
                        this.textDiv.style.whiteSpace = "normal";
                        this.textDiv.style.width = this.bounds.width + "px";
                    } else {
                        value = value.replace(/ /g, "&nbsp;");
                    }

                    value = value.replace(/\n/g, "<br/>");
                    this.textDiv.innerHTML = value;
                    var ow = this.textDiv.offsetWidth + 30;
                    var oh = this.textDiv.offsetHeight + 16;

                    ow = Math.max(ow, 40);
                    oh = Math.max(oh, 20);

                    if (clip) {
                        ow = Math.min(this.bounds.width, ow);
                        oh = Math.min(this.bounds.height, oh);
                    } else if (wrap) {
                        ow = Math.max(this.bounds.width, this.textDiv.scrollWidth);
                    }

                    var m = (state.text != null) ? state.text.margin : null;

                    if (m == null) {
                        var align = Utils.getValue(state.style, Constants.styleAlign, Constants.alignCenter);
                        var valign = Utils.getValue(state.style, Constants.styleVerticalAlign, Constants.alignMiddle);

                        m = Utils.getAlignmentAsPoint(align, valign);
                    }

                    if (m != null) {
                        // TODO: Keep in visible area, add spacing
                        this.textarea.style.left = Math.max(0, Math.round(this.bounds.x - m.x * this.bounds.width + m.x * ow) - 3) + "px";
                        this.textarea.style.top = Math.max(0, Math.round(this.bounds.y - m.y * this.bounds.height + m.y * oh) + 4) + "px";
                    }

                    var dx = this.textarea.offsetWidth - this.textarea.clientWidth + 4;
                    this.textarea.style.width = (ow + dx) + "px";
                    this.textarea.style.height = oh + "px";
                }
            }
        }

        isModified(): boolean {
            return this.modified;
        }

        setModified(value: boolean) {
            this.modified = value;
        }

        /** Called if the textarea has lost focus. */
        focusLost(evt) {
            this.stopEditing(!this.graph.isInvokesStopCellEditing());
        }

        /** Starts the editor for the given cell.
         * cell - <mxCell> to start editing.
         * trigger - Optional mouse event that triggered the editor.
         */
        startEditing(cell: Cell, trigger: MouseEvent) {
            // Lazy instantiates textarea to save memory in IE
            if (this.textarea == null) {
                this.init();
            }

            this.stopEditing(true);
            var state = this.graph.getView().getState(cell);

            if (state != null) {
                this.editingCell = cell;
                this.trigger = trigger;
                this.textNode = null;

                if (state.text != null && this.isHideLabel(state)) {
                    this.textNode = state.text.node;
                    Utils.nodeStyle(this.textNode).visibility = "hidden";
                }

                // Configures the style of the in-place editor
                var scale = this.graph.getView().scale;
                var size = Utils.getInt(state.style, Constants.styleFontsize, Constants.defaultFontSize) * scale;
                var family = Utils.getValue(state.style, Constants.styleFontfamily, Constants.defaultFontFamily);
                var color = Utils.getValue(state.style, Constants.styleFontcolor, "black");
                var align = Utils.getValue(state.style, Constants.styleAlign, Constants.alignLeft);
                var bold = (Utils.getInt(state.style, Constants.styleFontstyle, 0) & Constants.fontBold) == Constants.fontBold;
                var italic = (Utils.getInt(state.style, Constants.styleFontstyle, 0) & Constants.fontItalic) == Constants.fontItalic;
                var uline = (Utils.getInt(state.style, Constants.styleFontstyle, 0) & Constants.fontUnderline) == Constants.fontUnderline;

                this.textarea.style.lineHeight = (Constants.absoluteLineHeight) ? Math.round(size * Constants.lineHeight) + "px" : "" + Constants.lineHeight;
                this.textarea.style.textDecoration = (uline) ? "underline" : "";
                this.textarea.style.fontWeight = (bold) ? "bold" : "normal";
                this.textarea.style.fontStyle = (italic) ? "italic" : "";
                this.textarea.style.fontSize = Math.round(size) + "px";
                this.textarea.style.fontFamily = family;
                this.textarea.style.textAlign = align;
                this.textarea.style.overflow = "auto";
                this.textarea.style.outline = "none";
                this.textarea.style.color = color;

                // Specifies the bounds of the editor box
                var bounds = this.getEditorBounds(state);
                this.bounds = bounds;

                this.textarea.style.left = bounds.x + "px";
                this.textarea.style.top = bounds.y + "px";
                this.textarea.style.width = bounds.width + "px";
                this.textarea.style.height = bounds.height + "px";
                this.textarea.style.zIndex = String(this.zIndex);

                var value = this.getInitialValue(state, trigger);

                // Uses an optional text value for empty labels which is cleared
                // when the first keystroke appears. This makes it easier to see
                // that a label is being edited even if the label is empty.
                if (value == null || value.length == 0) {
                    value = this.getEmptyLabelText();
                    this.clearOnChange = value.length > 0;
                } else {
                    this.clearOnChange = false;
                }

                this.setModified(false);
                this.textarea.value = value;
                this.graph.container.appendChild(this.textarea);

                if (this.textarea.style.display != "none") {
                    if (this.autoSize) {
                        this.textDiv = this.createTextDiv();
                        document.body.appendChild(this.textDiv);
                        this.resize();
                    }

                    this.textarea.focus();

                    if (this.isSelectText() && this.textarea.value.length > 0) {
                        if (Client.isIos) {
                            document.execCommand("selectAll");
                        } else {
                            this.textarea.select();
                        }
                    }
                }
            }
        }

        isSelectText(): boolean {
            return this.selectText;
        }

/**
 * Creates the textDiv used for measuring text.
 */
        createTextDiv(): HTMLDivElement {
            var div = document.createElement("div");
            var style = div.style;
            style.position = "absolute";
            style.whiteSpace = "nowrap";
            style.visibility = "hidden";
            style.display = (Client.isQuirks) ? "inline" : "inline-block";
            style.zoom = "1";
            style.verticalAlign = "top";
            style.lineHeight = this.textarea.style.lineHeight;
            style.fontSize = this.textarea.style.fontSize;
            style.fontFamily = this.textarea.style.fontFamily;
            style.fontWeight = this.textarea.style.fontWeight;
            style.textAlign = this.textarea.style.textAlign;
            style.fontStyle = this.textarea.style.fontStyle;
            style.textDecoration = this.textarea.style.textDecoration;

            return div;
        }

/**
 * Stops the editor and applies the value if cancel is false.
 */
        stopEditing(cancel: boolean) {
            cancel = cancel || false;

            if (this.editingCell != null) {
                if (this.textNode != null) {
                    Utils.nodeStyle(this.textNode).visibility = "visible";
                    this.textNode = null;
                }

                if (!cancel && this.isModified()) {
                    this.graph.labelChanged(this.editingCell, this.getCurrentValue(), this.trigger);
                }

                if (this.textDiv != null) {
                    document.body.removeChild(this.textDiv);
                    this.textDiv = null;
                }

                this.editingCell = null;
                this.trigger = null;
                this.bounds = null;
                this.textarea.blur();

                if (this.textarea.parentNode != null) {
                    this.textarea.parentNode.removeChild(this.textarea);
                }
            }
        }

        /** Gets the initial editing value for the given cell. */
        getInitialValue(state: CellState, trigger) : string {
            return this.graph.getEditingValue(state.cell, trigger);
        }

        /** Returns the current editing value.*/
        getCurrentValue() : string {
            return this.textarea.value.replace(/\r/g, "");
        }

        /** Returns true if the label should be hidden while the cell is being edited. */
        isHideLabel(state: CellState): boolean {
            return true;
        }

        /** Returns the minimum width and height for editing the given state. */
        private getMinimumSize(state: CellState) {
            var scale = this.graph.getView().scale;

            return new Rectangle(0, 0, (state.text == null) ? 30 : state.text.size * scale + 20,
            (this.textarea.style.textAlign == "left") ? 120 : 40);
        }

        /** Returns the <Rectangle> that defines the bounds of the editor. */
        private getEditorBounds(state: CellState) {
            var isEdge = this.graph.getModel().isEdge(state.cell);
            var scale = this.graph.getView().scale;
            var minSize = this.getMinimumSize(state);
            var minWidth = minSize.width;
            var minHeight = minSize.height;

            var spacing = parseInt(state.style[Constants.styleSpacing] || "0") * scale;
            var spacingTop = (parseInt(state.style[Constants.styleSpacingTop] || "0") + TextShape.baseSpacingTop) * scale + spacing;
            var spacingRight = (parseInt(state.style[Constants.styleSpacingRight] || "0") + TextShape.baseSpacingRight) * scale + spacing;
            var spacingBottom = (parseInt(state.style[Constants.styleSpacingBottom] || "0") + TextShape.baseSpacingBottom) * scale + spacing;
            var spacingLeft = (parseInt(state.style[Constants.styleSpacingLeft] || "0") + TextShape.baseSpacingLeft) * scale + spacing;

            var result = new Rectangle(state.x, state.y,
                Math.max(minWidth, state.width - spacingLeft - spacingRight),
                Math.max(minHeight, state.height - spacingTop - spacingBottom));

            result = (state.shape != null) ? state.shape.getLabelBounds(result) : result;

            if (isEdge) {
                result.x = state.absoluteOffset.x;
                result.y = state.absoluteOffset.y;

                if (state.text != null && state.text.boundingBox != null) {
                    // Workaround for label containing just spaces in which case
                    // the bounding box location contains negative numbers 
                    if (state.text.boundingBox.x > 0) {
                        result.x = state.text.boundingBox.x;
                    }

                    if (state.text.boundingBox.y > 0) {
                        result.y = state.text.boundingBox.y;
                    }
                }
            } else if (state.text != null && state.text.boundingBox != null) {
                result.x = Math.min(result.x, state.text.boundingBox.x);
                result.y = Math.min(result.y, state.text.boundingBox.y);
            }

            result.x += spacingLeft;
            result.y += spacingTop;

            if (state.text != null && state.text.boundingBox != null) {
                if (!isEdge) {
                    result.width = Math.max(result.width, state.text.boundingBox.width);
                    result.height = Math.max(result.height, state.text.boundingBox.height);
                } else {
                    result.width = Math.max(minWidth, state.text.boundingBox.width);
                    result.height = Math.max(minHeight, state.text.boundingBox.height);
                }
            }

            // Applies the horizontal and vertical label positions
            if (this.graph.getModel().isVertex(state.cell)) {
                var horizontal = Utils.getValue(state.style, Constants.styleLabelPosition, Constants.alignCenter);

                if (horizontal == Constants.alignLeft) {
                    result.x -= state.width;
                } else if (horizontal == Constants.alignRight) {
                    result.x += state.width;
                }

                var vertical = Utils.getValue(state.style, Constants.styleVerticalLabelPosition, Constants.alignMiddle);

                if (vertical == Constants.alignTop) {
                    result.y -= state.height;
                } else if (vertical == Constants.alignBottom) {
                    result.y += state.height;
                }
            }

            return result;
        }

        /**
         * Returns the initial label value to be used of the label of the given
         * cell is empty. This label is displayed and cleared on the first keystroke.
         * This implementation returns <emptyLabelText>.
         */
        getEmptyLabelText() {
            return this.emptyLabelText;
        }

        /** Returns the cell that is currently being edited or null if no cell is being edited. */
        getEditingCell(): Cell {
            return this.editingCell;
        }

        /** Destroys the editor and removes all associated resources. */
        destroy() {
            if (this.textarea != null) {
                Events.release(this.textarea);

                if (this.textarea.parentNode != null) {
                    this.textarea.parentNode.removeChild(this.textarea);
                }

                this.textarea = null;

                if (this.changeHandler != null) {
                    this.graph.getModel().onChange.remove(this.changeHandler);
                    this.changeHandler = null;
                }
            }
        }

    }
}
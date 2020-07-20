module Five {

    export class WindowActivateEvent extends BasicEvent {
        constructor(public previousWindow: Window) { super(); }
    } 
    
    export class WindowResizeEvent extends BasicEvent {
        constructor(public event: Event) { super(); }
    }

    export class Window  {
        outline: Outline;
        /**
         * title - String that represents the title of the new window.
         * content - DOM node that is used as the window content.
         * x - X-coordinate of the window location.
         * y - Y-coordinate of the window location.
         * width - Width of the window.
         * height - Optional height of the window. Default is to match the height of the content at the specified width.
         * minimizable - Optional boolean indicating if the window is minimizable.
         * movable - Optional boolean indicating if the window is movable. 
         * replaceNode - Optional DOM node that the window should replace.
         * style - Optional base classname for the window elements. 
         */
        constructor(title: string, content: HTMLElement, x: number, y: number, width: number, height: number, minimizable = true, movable = true, replaceNode?: Element, style?: string) {
            if (content != null) {
                this.content = content;
                this.init(x, y, width, height, style);

                this.installMaximizeHandler();
                this.installMinimizeHandler();
                this.installCloseHandler();
                this.setMinimizable(minimizable);
                this.setTitle(title);

                if (movable) {
                    this.installMoveHandler();
                }

                if (replaceNode != null && replaceNode.parentNode != null) {
                    replaceNode.parentNode.replaceChild(this.div, replaceNode);
                } else {
                    document.body.appendChild(this.div);
                }
            }
        }


        /** URL of the image to be used for the close icon in the titlebar. */
        private closeImage = FileStructure.imageBasePath + "/close.gif";

        /** URL of the image to be used for the minimize icon in the titlebar. */
        private minimizeImage = FileStructure.imageBasePath + "/minimize.gif";

        /** URL of the image to be used for the normalize icon in the titlebar. */
        private normalizeImage = FileStructure.imageBasePath + "/normalize.gif";

        /** URL of the image to be used for the maximize icon in the titlebar. */
        private maximizeImage = FileStructure.imageBasePath + "/maximize.gif";

        /** URL of the image to be used for the resize icon. */
        private resizeImage = FileStructure.imageBasePath + "/resize.gif";

        /** Boolean flag that represents the visible state of the window. */
        private visible = false;

        /** <mxRectangle> that specifies the minimum width and height of the window. Default is (50, 40). */
        private minimumSize = new Rectangle(0, 0, 50, 40);

        /** Specifies if the window should be destroyed when it is closed. If this is false then the window is hidden using <setVisible>. Default is true. */
        destroyOnClose = true;

        /** Defines the correction factor for computing the height of the contentWrapper. Default is 6 for IE 7/8 standards mode and 2 for all other browsers and modes. */
        private contentHeightCorrection = 2;

        /** Reference to the DOM node (TD) that contains the title. */
        private title: HTMLTableCellElement = null;

        /** Reference to the DOM node that represents the window content. */
        content: HTMLElement = null;

        div: HTMLDivElement;
        private contentWrapper: HTMLDivElement;
        private table: HTMLTableElement;
        private td: HTMLTableCellElement;
        private resize: HTMLImageElement;
        private minimize: HTMLImageElement;
        private maximize: HTMLImageElement;
        private closeImg: HTMLImageElement;
        private image: HTMLImageElement;

        private static activeWindow: Window = null;

        onActivate = new EventListeners<WindowActivateEvent>();
        onBeforeResize = new EventListeners<WindowResizeEvent>();
        onResize = new EventListeners<WindowResizeEvent>();
        onAfterResize = new EventListeners<WindowResizeEvent>();
        onBeforeMove = new EventListeners<WindowResizeEvent>();
        onMove = new EventListeners<WindowResizeEvent>();
        onAfterMove = new EventListeners<WindowResizeEvent>();
        onMinimize = new EventListeners<WindowResizeEvent>();
        onMaximize = new EventListeners<WindowResizeEvent>();
        onNormalize = new EventListeners<WindowResizeEvent>();
        onClose = new EventListeners<BasicEvent>();
        onShow = new EventListeners<BasicEvent>();
        onHide = new EventListeners<BasicEvent>();
        onDestroy = new EventListeners<BasicEvent>();


        /** Initializes the DOM tree that represents the window. */
        private init(x: number, y: number, width: number, height: number, style: string) {
            style = (style != null) ? style : "Window";

            this.div = document.createElement("div");
            this.div.className = style;

            this.div.style.left = x + "px";
            this.div.style.top = y + "px";
            this.table = document.createElement("table");
            this.table.className = style;

            // Disables built-in pan and zoom in IE10 and later
            if (Client.isPointer) {
                this.div.style.msTouchAction = "none";
            }

            // Workaround for table size problems in FF
            if (width != null) {
                if (!Client.isQuirks) {
                    this.div.style.width = width + "px";
                }

                this.table.style.width = width + "px";
            }

            if (height != null) {
                if (!Client.isQuirks) {
                    this.div.style.height = height + "px";
                }

                this.table.style.height = height + "px";
            }

            // Creates title row
            var tbody = document.createElement("tbody");
            var tr = document.createElement("tr");

            this.title = document.createElement("td");
            this.title.className = style + "Title";
            tr.appendChild(this.title);
            tbody.appendChild(tr);

            // Creates content row and table cell
            tr = document.createElement("tr");
            this.td = document.createElement("td");
            this.td.className = style + "Pane";

            this.contentWrapper = document.createElement("div");
            this.contentWrapper.className = style + "Pane";
            this.contentWrapper.style.width = "100%";
            this.contentWrapper.appendChild(this.content);

            // Workaround for div around div restricts height
            // of inner div if outerdiv has hidden overflow
            if (Client.isQuirks || this.content.nodeName.toUpperCase() != "DIV") {
                this.contentWrapper.style.height = "100%";
            }

            // Puts all content into the DOM
            this.td.appendChild(this.contentWrapper);
            tr.appendChild(this.td);
            tbody.appendChild(tr);
            this.table.appendChild(tbody);
            this.div.appendChild(this.table);

            // Puts the window on top of other windows when clicked
            var activator = () => this.activate();

            Events.addGestureListeners(this.title, activator);
            Events.addGestureListeners(this.table, activator);

            this.hide();
        }

        /** Sets the window title to the given string. HTML markup inside the title will be escaped. */
        private setTitle(title: string) {
            // Removes all text content nodes (normally just one)
            var child = this.title.firstChild;

            while (child != null) {
                var next = child.nextSibling;

                if (child.nodeType == NodeType.Text) {
                    child.parentNode.removeChild(child);
                }

                child = next;
            }

            Utils.write(this.title, title || "");
        }

        /** Sets if the window contents should be scrollable. */
        private setScrollable(scrollable: boolean) {
            // Workaround for hang in Presto 2.5.22 (Opera 10.5)
            if (navigator.userAgent.indexOf("Presto/2.5") < 0) {
                if (scrollable) {
                    this.contentWrapper.style.overflow = "auto";
                } else {
                    this.contentWrapper.style.overflow = "hidden";
                }
            }
        }

        /** Puts the window on top of all other windows.*/
        private activate() {
            if (Window.activeWindow != this) {
                var style = Utils.getCurrentStyle(this.getElement());
                var index = (style != null) ? style.zIndex : 3;

                if (Window.activeWindow) {
                    var elt = Window.activeWindow.getElement();

                    if (elt != null && elt.style != null) {
                        elt.style.zIndex = index;
                    }
                }

                var previousWindow = Window.activeWindow;
                this.getElement().style.zIndex = "" + (parseInt(index) + 1);
                Window.activeWindow = this;

                this.onActivate.fire(new WindowActivateEvent(previousWindow));
            }
        }

        /** Returuns the outermost DOM node that makes up the window.*/
        private getElement(): HTMLDivElement {
            return this.div;
        }

        /** Makes sure the window is inside the client area of the window. */
        private fit() {
            Utils.fit(this.div);
        }

        /** Returns true if the window is resizable. */
        private isResizable(): boolean {
            if (this.resize != null) {
                return this.resize.style.display != "none";
            }

            return false;
        }

        /** Sets if the window should be resizable. To avoid interference with some built-in features of IE10 and later, the use of the following code is
         * recommended if there are resizable <mxWindow>s in the page:
         * (code)
         * if (Client.IS_POINTER)
         * {
         *   document.body.style.msTouchAction = 'none';
         * }
         * (end)
         */
        setResizable(resizable: boolean) {
            if (resizable) {
                if (this.resize == null) {
                    this.resize = document.createElement("img");
                    this.resize.style.position = "absolute";
                    this.resize.style.bottom = "2px";
                    this.resize.style.right = "2px";

                    this.resize.setAttribute("src", FileStructure.imageBasePath + "/resize.gif");
                    this.resize.style.cursor = "nw-resize";

                    var startX: number = null;
                    var startY: number = null;
                    var width: number = null;
                    var height: number = null;

                    // Adds a temporary pair of listeners to intercept the gesture event in the document
                    var dragHandler = (evt: MouseEvent) => {
                        if (startX != null && startY != null) {
                            var dx = Events.getClientX(evt) - startX;
                            var dy = Events.getClientY(evt) - startY;

                            this.setSize(width + dx, height + dy);

                            this.onResize.fire(new WindowResizeEvent(evt));
                            Events.consume(evt);
                        }
                    };

                    var dropHandler = (evt: MouseEvent) => {
                        if (startX != null && startY != null) {
                            startX = null;
                            startY = null;
                            Events.removeGestureListeners(document, null, dragHandler, dropHandler);
                            this.onAfterResize.fire(new WindowResizeEvent(evt));
                            Events.consume(evt);
                        }
                    };

                    var start = (evt: MouseEvent) => {
                        // LATER: msPointerDown starting on border of resize does start the drag operation but does not fire consecutive events via
                        // one of the listeners below (does pan instead). Workaround: document.body.style.msTouchAction = 'none'
                        this.activate();
                        startX = Events.getClientX(evt);
                        startY = Events.getClientY(evt);
                        width = this.div.offsetWidth;
                        height = this.div.offsetHeight;

                        Events.addGestureListeners(document, null, dragHandler, dropHandler);
                        this.onBeforeResize.fire(new WindowResizeEvent(evt));
                        Events.consume(evt);
                    };

                    Events.addGestureListeners(this.resize, start, dragHandler, dropHandler);
                    this.div.appendChild(this.resize);
                } else {
                    this.resize.style.display = "inline";
                }
            } else if (this.resize != null) {
                this.resize.style.display = "none";
            }
        }

        /** Sets the size of the window. */
        private setSize(width: number, height: number) {
            width = Math.max(this.minimumSize.width, width);
            height = Math.max(this.minimumSize.height, height);

            // Workaround for table size problems in FF
            if (!Client.isQuirks) {
                this.div.style.width = width + "px";
                this.div.style.height = height + "px";
            }

            this.table.style.width = width + "px";
            this.table.style.height = height + "px";

            if (!Client.isQuirks) {
                this.contentWrapper.style.height = (this.div.offsetHeight - this.title.offsetHeight - this.contentHeightCorrection) + "px";
            }
        }

        /** Sets if the window is minimizable. */
        private setMinimizable(minimizable: boolean) {
            this.minimize.style.display = (minimizable) ? "" : "none";
        }

        /** Returns an <mxRectangle> that specifies the size for the minimized window. A width or height of 0 means keep the existing width or height. This
         * implementation returns the height of the window title and keeps the width. */
        private getMinimumSize(): Rectangle {
            return new Rectangle(0, 0, 0, this.title.offsetHeight);
        }

        /** Installs the event listeners required for minimizing the window. */
        private installMinimizeHandler() {
            this.minimize = document.createElement("img");

            this.minimize.src = this.minimizeImage;
            this.minimize.align = "right";
            this.minimize.title = "Minimize";
            this.minimize.style.cursor = "pointer";
            this.minimize.style.marginRight = "1px";
            this.minimize.style.display = "none";

            this.title.appendChild(this.minimize);

            var minimized = false;
            var maxDisplay = null;
            var height = null;

            var funct = (evt: MouseEvent) => {
                this.activate();

                if (!minimized) {
                    minimized = true;

                    this.minimize.src = this.normalizeImage;
                    this.minimize.title = "Normalize";
                    this.contentWrapper.style.display = "none";
                    maxDisplay = this.maximize.style.display;

                    this.maximize.style.display = "none";
                    height = this.table.style.height;

                    var minSize = this.getMinimumSize();

                    if (minSize.height > 0) {
                        if (!Client.isQuirks) {
                            this.div.style.height = minSize.height + "px";
                        }

                        this.table.style.height = minSize.height + "px";
                    }

                    if (minSize.width > 0) {
                        if (!Client.isQuirks) {
                            this.div.style.width = minSize.width + "px";
                        }

                        this.table.style.width = minSize.width + "px";
                    }

                    if (this.resize != null) {
                        this.resize.style.visibility = "hidden";
                    }

                    this.onMinimize.fire(new WindowResizeEvent(evt));
                } else {
                    minimized = false;

                    this.minimize.src = this.minimizeImage;
                    this.minimize.title = "Minimize";
                    this.contentWrapper.style.display = ""; // default
                    this.maximize.style.display = maxDisplay;

                    if (!Client.isQuirks) {
                        this.div.style.height = height;
                    }

                    this.table.style.height = height;

                    if (this.resize != null) {
                        this.resize.style.visibility = "";
                    }

                    this.onNormalize.fire(new WindowResizeEvent(evt));
                }

                Events.consume(evt);
            };

            Events.addGestureListeners(this.minimize, funct);
        }

        /** Sets if the window is maximizable. */
        setMaximizable(maximizable: boolean) {
            this.maximize.style.display = (maximizable) ? "" : "none";
        }

        /** Installs the event listeners required for maximizing the window. */
        private installMaximizeHandler() {
            this.maximize = document.createElement("img");

            this.maximize.src = this.maximizeImage;
            this.maximize.align = "right";
            this.maximize.title = "Maximize";
            this.maximize.style.cursor = "default";
            this.maximize.style.marginLeft = "1px";
            this.maximize.style.cursor = "pointer";
            this.maximize.style.display = "none";

            this.title.appendChild(this.maximize);

            var maximized = false;
            var x = null;
            var y = null;
            var height = null;
            var width = null;

            var funct = (evt: MouseEvent) => {
                this.activate();

                if (this.maximize.style.display != "none") {
                    var style;
                    if (!maximized) {
                        maximized = true;

                        this.maximize.setAttribute("src", this.normalizeImage);
                        this.maximize.setAttribute("title", "Normalize");
                        this.contentWrapper.style.display = "";
                        this.minimize.style.visibility = "hidden";

                        // Saves window state
                        x = parseInt(this.div.style.left);
                        y = parseInt(this.div.style.top);
                        height = this.table.style.height;
                        width = this.table.style.width;

                        this.div.style.left = "0px";
                        this.div.style.top = "0px";
                        var docHeight = Math.max(document.body.clientHeight || 0, document.documentElement.clientHeight || 0);

                        if (!Client.isQuirks) {
                            this.div.style.width = (document.body.clientWidth - 2) + "px";
                            this.div.style.height = (docHeight - 2) + "px";
                        }

                        this.table.style.width = (document.body.clientWidth - 2) + "px";
                        this.table.style.height = (docHeight - 2) + "px";

                        if (this.resize != null) {
                            this.resize.style.visibility = "hidden";
                        }

                        if (!Client.isQuirks) {
                            style = Utils.getCurrentStyle(this.contentWrapper);
                            if (style.overflow == "auto" || this.resize != null) {
                                this.contentWrapper.style.height = (this.div.offsetHeight -
                                    this.title.offsetHeight - this.contentHeightCorrection) + "px";
                            }
                        }

                        this.onMaximize.fire(new WindowResizeEvent(evt));
                    } else {
                        maximized = false;

                        this.maximize.setAttribute("src", this.maximizeImage);
                        this.maximize.setAttribute("title", "Maximize");
                        this.contentWrapper.style.display = "";
                        this.minimize.style.visibility = "";

                        // Restores window state
                        this.div.style.left = x + "px";
                        this.div.style.top = y + "px";

                        if (!Client.isQuirks) {
                            this.div.style.height = height;
                            this.div.style.width = width;
                            style = Utils.getCurrentStyle(this.contentWrapper);
                            if (style.overflow == "auto" || this.resize != null) {
                                this.contentWrapper.style.height = (this.div.offsetHeight -
                                    this.title.offsetHeight - this.contentHeightCorrection) + "px";
                            }
                        }

                        this.table.style.height = height;
                        this.table.style.width = width;

                        if (this.resize != null) {
                            this.resize.style.visibility = "";
                        }

                        this.onNormalize.fire(new WindowResizeEvent(evt));
                    }

                    Events.consume(evt);
                }
            };

            Events.addGestureListeners(this.maximize, funct);
            Events.addListener(this.title, "dblclick", funct);
        }

        /** Installs the event listeners required for moving the window. */
        private installMoveHandler() {
            this.title.style.cursor = "move";

            Events.addGestureListeners(this.title,
            (evt: MouseEvent) => {
                var startX = Events.getClientX(evt);
                var startY = Events.getClientY(evt);
                var x = this.getX();
                var y = this.getY();

                // Adds a temporary pair of listeners to intercept
                // the gesture event in the document
                var dragHandler = (evt1: MouseEvent) => {
                    var dx = Events.getClientX(evt1) - startX;
                    var dy = Events.getClientY(evt1) - startY;
                    this.setLocation(x + dx, y + dy);
                    this.onMove.fire(new WindowResizeEvent(evt));
                    Events.consume(evt);
                };

                var dropHandler = (evt1: MouseEvent) => {
                    Events.removeGestureListeners(document, null, dragHandler, dropHandler);
                    this.onAfterResize.fire(new WindowResizeEvent(evt1));
                    Events.consume(evt1);
                };

                Events.addGestureListeners(document, null, dragHandler, dropHandler);
                this.onBeforeMove.fire(new WindowResizeEvent(evt));
                Events.consume(evt);
            });

            // Disables built-in pan and zoom in IE10 and later
            if (Client.isPointer) {
                this.title.style.msTouchAction = "none";
            }
        }

        /** Sets the upper, left corner of the window. */
        private setLocation(x: number, y: number) {
            this.div.style.left = x + "px";
            this.div.style.top = y + "px";
        }

        /** Returns the current position on the x-axis. */
        getX(): number {
            return parseInt(this.div.style.left);
        }

        /** Returns the current position on the y-axis. */
        getY(): number {
            return parseInt(this.div.style.top);
        }

        /** Adds the <closeImage> as a new image node in <closeImg> and installs the <close> event. */
        private installCloseHandler() {
            this.closeImg = document.createElement("img");

            this.closeImg.src = this.closeImage;
            this.closeImg.align = "right";
            this.closeImg.title = "Close";
            this.closeImg.style.marginLeft = "2px";
            this.closeImg.style.cursor = "pointer";
            this.closeImg.style.display = "none";

            this.title.insertBefore(this.closeImg, this.title.firstChild);

            Events.addGestureListeners(this.closeImg, (evt: MouseEvent) => {
                this.onClose.fire();

                if (this.destroyOnClose) {
                    this.destroy();
                } else {
                    this.setVisible(false);
                }

                Events.consume(evt);
            });
        }

        /** Sets the image associated with the window. */
        setImage(image: string) {
            this.image = document.createElement("img");
            this.image.src = image;
            this.image.align = "left";
            this.image.style.marginRight = "4px";
            this.image.style.marginLeft = "0px";
            this.image.style.marginTop = "-2px";

            this.title.insertBefore(this.image, this.title.firstChild);
        }

        setClosable(closable: boolean) {
            this.closeImg.style.display = (closable) ? "" : "none";
        }

        isVisible(): boolean {
            if (this.div != null) {
                return this.div.style.display != "none";
            }

            return false;
        }

        /** Shows or hides the window depending on the given flag.*/
        setVisible(visible: boolean) {
            if (this.div != null && this.isVisible() != visible) {
                if (visible) {
                    this.show();
                } else {
                    this.hide();
                }
            }
        }

        /** Shows the window. */
        private show() {
            this.div.style.display = "";
            this.activate();

            var style = Utils.getCurrentStyle(this.contentWrapper);

            if (!Client.isQuirks && (style.overflow == "auto" || this.resize != null)) {
                this.contentWrapper.style.height = (this.div.offsetHeight -
                    this.title.offsetHeight - this.contentHeightCorrection) + "px";
            }

            this.onShow.fire();
        }

        private hide() {
            this.div.style.display = "none";
            this.onHide.fire();
        }

        /** Destroys the window and removes all associated resources. Fires a <destroy> event prior to destroying the window. */
        destroy() {
            this.onDestroy.fire();

            if (this.div != null) {
                Events.release(this.div);
                this.div.parentNode.removeChild(this.div);
                this.div = null;
            }

            this.title = null;
            this.content = null;
            this.contentWrapper = null;
        }
    }
} 
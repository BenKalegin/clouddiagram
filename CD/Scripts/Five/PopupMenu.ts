module Five {
    /**
     * Basic popup menu. To add a vertical scrollbar to a given submenu, the following code can be used.
     * 
     */
    export interface IPopupMenuFactory {
        (menu: PopupMenu, cell: Cell, me: MouseEvent): void;
    }


    export class PopupMenu {
        constructor(factoryMethod?: IPopupMenuFactory) {
            this.factoryMethod = factoryMethod;

            if (factoryMethod != null) {
                this.init();
            }
        }

        /**
         * URL of the image to be used for the submenu icon.
         */
        submenuImage = FileStructure.imageBasePath + "/submenu.gif";

        /**
         * Specifies the zIndex for the popupmenu and its shadow. Default is 1006.
         */
        zIndex = 10006;

        /**
         * Function that is used to create the popup menu. The function takes the
         * current panning handler, the <mxCell> under the mouse and the mouse
         * event that triggered the call as arguments.
         */
        factoryMethod: IPopupMenuFactory = null;

        /**
         * Specifies if popupmenus should be activated by clicking the left mouse
         * button. Default is false.
         */
        useLeftButtonForPopup = false;

        /**
         * Specifies if events are handled. Default is true.
         */
        enabled = true;

        /**
         * Contains the number of times <addItem> has been called for a new menu.
         */
        private itemCount = 0;

        /**
         * Variable: autoExpand
         * 
         * Specifies if submenus should be expanded on mouseover. Default is false.
         */
        private autoExpand = false;

        /**
         * Variable: smartSeparators
         * 
         * Specifies if separators should only be added if a menu item follows them.
         * Default is false.
         */
        private smartSeparators = false;

        /**
         * Specifies if any labels should be visible. Default is true.
         */
        private labels = true;

        private table: HTMLTableElement;
        private tbody: HTMLTableSectionElement;
        div: HTMLDivElement;
        
        activeRow: HTMLTableRowElement;
        containsItems: boolean;
        private eventReceiver: HTMLTableRowElement; 

        onShow = new EventListeners<BasicEvent>();

        /**
         * Initializes the shapes required for this vertex handler.
         */
        public init() {
            // Adds the inner table
            this.table = document.createElement("table");
            this.table.className = "PopupMenu";

            this.tbody = document.createElement("tbody");
            this.table.appendChild(this.tbody);

            // Adds the outer div
            this.div = document.createElement("div");
            this.div.className = "mxPopupMenu";
            this.div.style.display = "inline";
            this.div.style.zIndex = String(this.zIndex);
            this.div.appendChild(this.table);

            // Disables the context menu on the outer div
            Events.disableContextMenu(this.div);
        }

        /**
         * Returns true if events are handled. This implementation returns <enabled>.
         */
        isEnabled(): boolean {
            return this.enabled;
        }

        /**
         * Enables or disables event handling. This implementation updates <enabled>.
         */
        private setEnabled(enabled: boolean) {
            this.enabled = enabled;
        }

        /**
         * Returns true if the given event is a popupmenu trigger for the optional given cell.
         * me - <mxMouseEvent> that represents the mouse event.
         */
        isPopupTrigger(me: MouseEventContext) : boolean {
            return me.isPopupTrigger() || (this.useLeftButtonForPopup && Events.isLeftMouseButton(me.getEvent()));
        }

        /**
         * Function: addItem
         * 
         * Adds the given item to the given parent item. If no parent item is specified
         * then the item is added to the top-level menu. The return value may be used
         * as the parent argument, ie. as a submenu item. The return value is the table
         * row that represents the item.
         * 
         * Paramters:
         * 
         * title - String that represents the title of the menu item.
         * image - Optional URL for the image icon.
         * funct - Function associated that takes a mouseup or touchend event.
         * parent - Optional item returned by <addItem>.
         * iconCls - Optional string that represents the CSS class for the image icon.
         * IconsCls is ignored if image is given.
         * enabled - Optional boolean indicating if the item is enabled. Default is true.
         */
        addItem(title: string, image: string, funct: Function, parent? : any, iconCls?: string, enabled: boolean = true) : HTMLTableRowElement{
            parent = parent || this;
            this.itemCount++;

            // Smart separators only added if element contains items
            if (parent.willAddSeparator) {
                if (parent.containsItems) {
                    this.addSeparator(parent, true);
                }

                parent.willAddSeparator = false;
            }

            parent.containsItems = true;
            var tr = document.createElement("tr");
            tr.className = "PopupMenuItem";
            var col1 = document.createElement("td");
            col1.className = "PopupMenuIcon";

            // Adds the given image into the first column
            if (image != null) {
                var img = document.createElement("img");
                img.src = image;
                col1.appendChild(img);
            }
            else if (iconCls != null) {
                var div = document.createElement("div");
                div.className = iconCls;
                col1.appendChild(div);
            }

            tr.appendChild(col1);

            if (this.labels) {
                var col2 = document.createElement("td");
                col2.className = "mxPopupMenuItem" +
                ((enabled != null && !enabled) ? " mxDisabled" : "");

                // KNOWN: Require <a href="#"> around label to avoid focus in
                // quirks and IE 8 (see above workaround). But the problem is
                // the anchor doesn't cover the complete active area of the
                // item and it inherits styles (underline, blue).
                Utils.write(col2, title);
                col2.align = "left";
                tr.appendChild(col2);

                var col3 = document.createElement("td");
                col3.className = "mxPopupMenuItem" +
                ((enabled != null && !enabled) ? " mxDisabled" : "");
                col3.style.paddingRight = "6px";
                col3.style.textAlign = "right";

                tr.appendChild(col3);

                if (parent.div == null) {
                    this.createSubmenu(parent);
                }
            }

            parent.tbody.appendChild(tr);

            if (enabled == null || enabled) {
                Events.addGestureListeners(tr, evt => {
                        this.eventReceiver = tr;

                        if (parent.activeRow != tr && parent.activeRow != parent) {
                            if (parent.activeRow != null &&
                                parent.activeRow.div.parentNode != null) {
                                this.hideSubmenu(parent);
                            }

                            if ((<any>tr).div != null) {
                                this.showSubmenu(parent, tr);
                                parent.activeRow = tr;
                            }
                        }

                        Events.consume(evt);
                    },
                    () => {
                        if (parent.activeRow != tr && parent.activeRow != parent) {
                            if (parent.activeRow != null &&
                                parent.activeRow.div.parentNode != null) {
                                this.hideSubmenu(parent);
                            }

                            if (this.autoExpand && (<any>tr).div != null) {
                                this.showSubmenu(parent, tr);
                                parent.activeRow = tr;
                            }
                        }

                        // Sets hover style because TR in IE doesn't have hover
                        tr.className = "sPopupMenuItemHover";
                    },
                    evt => {
                        // EventReceiver avoids clicks on a submenu item
                        // which has just been shown in the mousedown
                        if (this.eventReceiver == tr) {
                            if (parent.activeRow != tr) {
                                this.hideMenu();
                            }

                            if (funct != null) {
                                funct(evt);
                            }
                        }

                        this.eventReceiver = null;
                        Events.consume(evt);
                    }
                );

                // Resets hover style because TR in IE doesn't have hover
                Events.addListener(tr, "mouseout", () => {tr.className = "PopupMenuItem";});
            }

            return tr;
        }

        /**
         * Function: createSubmenu
         * 
         * Creates the nodes required to add submenu items inside the given parent
         * item. This is called in <addItem> if a parent item is used for the first
         * time. This adds various DOM nodes and a <submenuImage> to the parent.
         * 
         * Parameters:
         * 
         * parent - An item returned by <addItem>.
         */
        private createSubmenu(parent) {
            parent.table = document.createElement("table");
            parent.table.className = "mxPopupMenu";

            parent.tbody = document.createElement("tbody");
            parent.table.appendChild(parent.tbody);

            parent.div = document.createElement("div");
            parent.div.className = "mxPopupMenu";

            parent.div.style.position = "absolute";
            parent.div.style.display = "inline";
            parent.div.style.zIndex = this.zIndex;

            parent.div.appendChild(parent.table);

            var img = document.createElement("img");
            img.setAttribute("src", this.submenuImage);

            // Last column of the submenu item in the parent menu
            var td = parent.firstChild.nextSibling.nextSibling;
            td.appendChild(img);
        }

        /**
         * Function: showSubmenu
         * 
         * Shows the submenu inside the given parent row.
         */
        private showSubmenu(parent, row) {
            if (row.div != null) {
                row.div.style.left = (parent.div.offsetLeft +
                row.offsetLeft + row.offsetWidth - 1) + "px";
                row.div.style.top = (parent.div.offsetTop + row.offsetTop) + "px";
                document.body.appendChild(row.div);

                // Moves the submenu to the left side if there is no space
                var left = parseInt(row.div.offsetLeft);
                var width = parseInt(row.div.offsetWidth);
                var offset = Utils.getDocumentScrollOrigin(document);

                var b = document.body;
                var d = document.documentElement;

                var right = offset.x + (b.clientWidth || d.clientWidth);

                if (left + width > right) {
                    row.div.style.left = (parent.div.offsetLeft - width + ((Client.isIe) ? 6 : -6)) + "px";
                }

                Utils.fit(row.div);
            }
        }

        /** Adds a horizontal separator in the given parent item or the top-level menu if no parent is specified.
         * parent - Optional item returned by <addItem>.
         * force - Optional boolean to ignore <smartSeparators>. Default is false. */
        addSeparator(parent: any, force: boolean = false) {
            parent = parent || this;

            if (this.smartSeparators && !force) {
                parent.willAddSeparator = true;
            }
            else if (parent.tbody != null) {
                parent.willAddSeparator = false;
                var tr = document.createElement("tr");

                var col1 = document.createElement("td");
                col1.className = "mxPopupMenuIcon";
                col1.style.padding = "0 0 0 0px";

                tr.appendChild(col1);

                var col2 = document.createElement("td");
                col2.style.padding = "0 0 0 0px";
                col2.setAttribute("colSpan", "2");

                var hr = document.createElement("hr");
                hr.setAttribute("size", "1");
                col2.appendChild(hr);

                tr.appendChild(col2);

                parent.tbody.appendChild(tr);
            }
        }

        /**
         * Function: popup
         * 
         * Shows the popup menu for the given event and cell.
         * 
         * Example:
         * 
         * (code)
         * graph.panningHandler.popup = function(x, y, cell, evt)
         * {
         *   Utils.alert('Hello, World!');
         * }
         * (end)
         */
        popup(x: number, y: number, cell: Cell, evt: MouseEvent) {
            if (this.div != null && this.tbody != null && this.factoryMethod != null) {
                this.div.style.left = x + "px";
                this.div.style.top = y + "px";

                // Removes all child nodes from the existing menu
                while (this.tbody.firstChild != null) {
                    Events.release(<Element>this.tbody.firstChild);
                    this.tbody.removeChild(this.tbody.firstChild);
                }

                this.itemCount = 0;
                this.factoryMethod(this, cell, evt);

                if (this.itemCount > 0) {
                    this.showMenu();
                    this.onShow.fire();
                }
            }
        }

        /**
         * Function: isMenuShowing
         * 
         * Returns true if the menu is showing.
         */
        isMenuShowing() : boolean {
            return this.div != null && this.div.parentNode == document.body;
        }

        /**
         * Function: showMenu
         * 
         * Shows the menu.
         */
        private showMenu() {
            // Disables filter-based shadow in IE9 standards mode
            if (Client.isIe9) {
                this.div.style.filter = "none";
            }

            // Fits the div inside the viewport
            document.body.appendChild(this.div);
            Utils.fit(this.div);
        }

        /**
         * Function: hideMenu
         * 
         * Removes the menu and all submenus.
         */
        hideMenu() {
            if (this.div != null) {
                if (this.div.parentNode != null) {
                    this.div.parentNode.removeChild(this.div);
                }

                this.hideSubmenu(this);
                this.containsItems = false;
            }
        }

        /**
         * Function: hideSubmenu
         * 
         * Removes all submenus inside the given parent.
         * 
         * Parameters:
         * 
         * parent - An item returned by <addItem>.
         */
        private hideSubmenu(parent: any) {
            if (parent.activeRow != null) {
                this.hideSubmenu(parent.activeRow);

                if ((parent.activeRow).div.parentNode != null) {
                    (parent.activeRow).div.parentNode.removeChild((parent.activeRow).div);
                }

                parent.activeRow = null;
            }
        }

        /**
         * Function: destroy
         * 
         * Destroys the handler and all its resources and DOM nodes.
         */
        destroy() {
            if (this.div != null) {
                Events.release(this.div);

                if (this.div.parentNode != null) {
                    this.div.parentNode.removeChild(this.div);
                }

                this.div = null;
            }
        }

    }
}
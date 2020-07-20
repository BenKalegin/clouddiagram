module Five {
    interface IToolbarAttachment {
        initialClassName: string;
        altIcon: string;
    }

    export interface IDropHandler {
        (graph: Graph, evt: MouseEvent, cell: Cell): void;
    }

    export interface IClickHandler {
        (): void;
    }

    export class ToolbarSelectEvent extends BasicEvent {
        constructor(public funct: (evt: MouseEvent, cell: Cell) => void) { super(); }
    }

    export class Toolbar{
        constructor(container: Element) {
            this.container = container;
        }

        /** Reference to the DOM nodes that contains the toolbar. */
        private container: Element = null;

        /** Specifies if events are handled. Default is true. */
        private enabled = true;

        /** Specifies if <resetMode> requires a forced flag of true for resetting the current mode in the toolbar. Default is false. This is set to true
         * if the toolbar item is double clicked to avoid a reset after a single use of the item. */
        private noReset = false;

        /** Boolean indicating if the default mode should be the last selected switch mode or the first inserted switch mode. Default is true, that
         * is the last selected switch mode is the default mode. The default mode is the mode to be selected after a reset of the toolbar. If this is
         * false, then the default mode is the first inserted mode item regardless  of what was last selected. Otherwise, the selected item after a reset is
         * the previously selected item.*/
        private updateDefaultMode = true;

        private menu: PopupMenu;
        private currentImg: HTMLElement;
        private selectedMode: HTMLElement;
        private defaultMode: HTMLElement;
        private defaultFunction: (evt: MouseEvent, cell: Cell) => void;
        onSelect = new EventListeners<ToolbarSelectEvent>();

        /** Adds the given function as an image with the specified title and icon and returns the new image node. 
         * title - Optional string that is used as the tooltip.
         * icon - Optional URL of the image to be used. If no URL is given, then a
         * button is created.
         * funct - Function to execute on a mouse click.
         * pressedIcon - Optional URL of the pressed image. Default is a gray
         * background.
         * style - Optional style classname. Default is mxToolbarItem.
         * factoryMethod - Optional factory method for popup menu, eg. function(menu, evt, cell) { menu.addItem('Hello, World!'); }
         */
        addItem(title: string, icon: string, funct: () => void, pressedIcon?: string, style?: string, factoryMethod?) {
            var img = document.createElement((icon != null) ? 'img' : 'button');
            var initialClassName = style || ((factoryMethod != null) ? 'mxToolbarMode' : 'mxToolbarItem');
            img.className = initialClassName;
            img.setAttribute('src', icon);

            if (title != null) {
                if (icon != null) {
                    img.setAttribute('title', title);
                } else {
                    Utils.write(img, title);
                }
            }

            this.container.appendChild(img);

            // Invokes the function on a click on the toolbar item
            if (funct != null) {
                Events.addListener(img, 'click', funct);

                if (Client.isTouch) {
                    Events.addListener(img, 'touchend', funct);
                }
            }

            var mouseHandler = () => {
                if (pressedIcon != null) {
                    img.setAttribute('src', icon);
                } else {
                    img.style.backgroundColor = '';
                }
            };

            // Highlights the toolbar item with a gray background while it is being clicked with the mouse
            Events.addGestureListeners(img,
            (evt: MouseEvent) => {
                if (pressedIcon != null) {
                    img.setAttribute('src', pressedIcon);
                } else {
                    img.style.backgroundColor = 'gray';
                }

                // Popup Menu
                if (factoryMethod != null) {
                    if (this.menu == null) {
                        this.menu = new PopupMenu();
                        this.menu.init();
                    }

                    var last = this.currentImg;

                    if (this.menu.isMenuShowing()) {
                        this.menu.hideMenu();
                    }

                    if (last != img) {
                        // Redirects factory method to local factory method
                        this.currentImg = img;
                        this.menu.factoryMethod = factoryMethod;

                        var point = new Point(img.offsetLeft, img.offsetTop + img.offsetHeight);
                        this.menu.popup(point.x, point.y, null, evt);

                        // Sets and overrides to restore classname
                        if (this.menu.isMenuShowing()) {
                            img.className = initialClassName + 'Selected';

                            this.menu.hideMenu = () => {
                                PopupMenu.prototype.hideMenu.apply(this);
                                img.className = initialClassName;
                                this.currentImg = null;
                            };
                        }
                    }
                }
            }, null, mouseHandler);

            Events.addListener(img, 'mouseout', mouseHandler);

            return img;
        }

        /** Adds and returns a new SELECT element using the given style. The element is placed inside a DIV with the mxToolbarComboContainer style classname.*/
        addCombo(style?: string): HTMLSelectElement {
            var div = document.createElement('div');
            div.style.display = 'inline';
            div.className = 'ToolbarComboContainer';

            var select = document.createElement('select');
            select.className = style || 'ToolbarCombo';
            div.appendChild(select);

            this.container.appendChild(div);

            return select;
        }

        /** Adds and returns a new SELECT element using the given title as the default element. The selection is reset to this element after each change.  */
        addActionCombo(title: string, style?: string) : HTMLSelectElement{
            var select = document.createElement('select');
            select.className = style || 'ToolbarCombo';
            this.addOption(select, title, null);

            Events.addListener(select, 'change', evt => {
                var value = select.options[select.selectedIndex];
                select.selectedIndex = 0;

                if (value.funct != null) {
                    value.funct(evt);
                }
            });

            this.container.appendChild(select);

            return select;
        }

        /** Adds and returns a new OPTION element inside the given SELECT element. If the given value is a function then it is stored in the option's funct field.
         * combo - SELECT element that will contain the new entry.
         * title - String that specifies the title of the option.
         * value - Specifies the value associated with this option.
         */
        addOption(combo: HTMLSelectElement, title: string, value) {
            var option = document.createElement('option');
            Utils.writeln(option, title);

            option.value = value;

            combo.appendChild(option);

            return option;
        }

        /** Adds a new selectable item to the toolbar. Only one switch mode item may be selected at a time. The currently selected item is the default item after a reset of the toolbar. */
        addSwitchMode(title: string, icon: string, funct: IClickHandler, pressedIcon: string, style?: string) {
            var img = document.createElement('img');
            var imgAttachment = (<IToolbarAttachment><any>img);
            imgAttachment.initialClassName = style || 'ToolbarMode';
            img.className = imgAttachment.initialClassName;
            img.src = icon;
            imgAttachment.altIcon = pressedIcon;

            if (title != null) {
                img.setAttribute('title', title);
            }

            Events.addListener(img, "click",() => {
                var selAttachment = <IToolbarAttachment><any>this.selectedMode;
                var tmp = selAttachment.altIcon;

                if (tmp != null) {
                    selAttachment.altIcon = this.selectedMode.getAttribute('src');
                    this.selectedMode.setAttribute('src', tmp);
                } else {
                    this.selectedMode.className = selAttachment.initialClassName;
                }

                if (this.updateDefaultMode) {
                    this.defaultMode = img;
                }

                this.selectedMode = img;
                tmp = imgAttachment.altIcon;
                if (tmp != null) {
                    imgAttachment.altIcon = img.src;
                    img.src = tmp;
                } else {
                    img.className = imgAttachment.initialClassName + 'Selected';
                }

                this.onSelect.fire(new ToolbarSelectEvent(null));
                funct();
            });

            this.container.appendChild(img);

            if (this.defaultMode == null) {
                this.defaultMode = img;

                // Function should fire only once so
                // do not pass it with the select event
                this.selectMode(img);
                funct();
            }

            return img;
        }

        /** Adds a new item to the toolbar. The selection is typically reset after the item has been consumed, for example by adding a new vertex to the
         * graph. The reset is not carried out if the item is double clicked.
         * The function argument uses the following signature: funct(evt, cell) where evt is the native mouse event and cell is the cell under the mouse. */
        addMode(title: string, icon: string, funct: (evt: MouseEvent, cell: Cell) => void, pressedIcon, style, toggle) {
            toggle = (toggle != null) ? toggle : true;
            var img = document.createElement((icon != null) ? 'img' : 'button');
            var imgAttachment = (<IToolbarAttachment><any>img);

            imgAttachment.initialClassName = style || 'ToolbarMode';
            img.className = imgAttachment.initialClassName;
            img.setAttribute('src', icon);
            imgAttachment.altIcon = pressedIcon;

            if (title != null) {
                img.setAttribute('title', title);
            }

            if (this.enabled && toggle) {
                Events.addListener(img, 'click', () => {
                    this.selectMode(img, funct);
                    this.noReset = false;
                });

                Events.addListener(img, 'dblclick', () => {
                    this.selectMode(img, funct);
                    this.noReset = true;
                });

                if (this.defaultMode == null) {
                    this.defaultMode = img;
                    this.defaultFunction = funct;
                    this.selectMode(img, funct);
                }
            }

            this.container.appendChild(img);

            return img;
        }

        /** Resets the state of the previously selected mode and displays the given DOM node as selected. This function fires a select event with the given function as a parameter. */
        private selectMode(domNode: HTMLElement, funct?:  (evt: MouseEvent, cell: Cell) => void) {
            if (this.selectedMode != domNode) {
                var tmp: string;
                var selAttachment: IToolbarAttachment;
                if (this.selectedMode != null) {
                    selAttachment = <IToolbarAttachment><any>this.selectedMode;
                    tmp = selAttachment.altIcon;
                    if (tmp != null) {
                        selAttachment.altIcon = this.selectedMode.getAttribute('src');
                        this.selectedMode.setAttribute('src', tmp);
                    } else {
                        this.selectedMode.className = selAttachment.initialClassName;
                    }
                }

                this.selectedMode = domNode;
                selAttachment = <IToolbarAttachment><any>this.selectedMode;
                tmp = selAttachment.altIcon;
                if (tmp != null) {
                    selAttachment.altIcon = this.selectedMode.getAttribute('src');
                    this.selectedMode.setAttribute('src', tmp);
                } else {
                    this.selectedMode.className = selAttachment.initialClassName + 'Selected';
                }

                this.onSelect.fire(new ToolbarSelectEvent(funct));
            }
        }

        /** Selects the default mode and resets the state of the previously selected mode. */
        resetMode(forced: boolean) {
            if ((forced || !this.noReset) && this.selectedMode != this.defaultMode) {
                // The last selected switch mode will be activated so the function was already executed and is no longer required here
                this.selectMode(this.defaultMode, this.defaultFunction);
            }
        }

        /** Adds the specifies image as a separator. icon - URL of the separator icon. */
        addSeparator(icon: string) {
            return this.addItem(null, icon, null);
        }

        /** Adds a break to the container. */
        private addBreak() {
            Utils.br(this.container);
        }

        /** Adds a horizontal line to the container. */
        private addLine() {
            var hr = document.createElement('hr');

            hr.style.marginRight = '6px';
            hr.setAttribute('size', '1');

            this.container.appendChild(hr);
        }

        /** Removes the toolbar and all its associated resources. */
        destroy() {
            Events.release(this.container);
            this.container = null;
            this.defaultMode = null;
            this.defaultFunction = null;
            this.selectedMode = null;

            if (this.menu != null) {
                this.menu.destroy();
            }
        }

    }
} 
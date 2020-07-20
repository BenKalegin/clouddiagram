module Five {
    /** Creates popupmenus for mouse events. This object holds an XML node which is a description of the popup menu to be created. In
     * <createMenu>, the configuration is applied to the context and the resulting menu items are added to the menu dynamically. See
     * <createMenu> for a description of the configuration format.
     * This class does not create the DOM nodes required for the popup menu, it
     * only parses an XML description to invoke the respective methods on an
     * <mxPopupMenu> each time the menu is displayed.*/
    export class DefaultPopupMenu {
        constructor(config: Element) {
            this.config = config;
        }

        /** Base path for all icon attributes in the config. Default is null. */
        private imageBasePath: string = null;

        /** XML node used as the description of new menu items. This node is used in <createMenu> to dynamically create the menu items if their
         * respective conditions evaluate to true for the given arguments. */
        private config: Element;

         /*
         * editor - Enclosing <mxEditor> instance.
         * menu - <mxPopupMenu> that is used for adding items and separators.
         * cell - Optional <mxCell> which is under the mousepointer.
         * evt - Optional mouse event which triggered the menu. 
         */
        createMenu(editor: Editor, menu: PopupMenu, cell?: Cell, evt?: MouseEvent) {
            if (this.config != null) {
                var conditions = this.createConditions(editor, cell, evt);
                var item = this.config.firstChild;

                this.addItems(editor, menu, cell, evt, conditions, <Element>item, null);
            }
        }

        /** Recursively adds the given items and all of its children into the given menu.
         * editor - Enclosing <mxEditor> instance.
         * menu - <mxPopupMenu> that is used for adding items and separators.
         * cell - Optional <mxCell> which is under the mousepointer.
         * evt - Optional mouse event which triggered the menu.
         * conditions - Array of names boolean conditions.
         * item - XML node that represents the current menu item.
         * parent - DOM node that represents the parent menu item.
         */
        private addItems(editor: Editor, menu: PopupMenu, cell?: Cell, evt?: MouseEvent, conditions?: string[], item?: Element, parent?: Element) {
            var addSeparator = false;

            while (item != null) {
                if (item.nodeName == 'add') {
                    var condition = item.getAttribute('if');

                    if (condition == null || conditions[condition]) {
                        var as = item.getAttribute('as');
                        as = Resources.get(as);
                        var funct = Utils.eval(Utils.getTextContent(item));
                        var action = item.getAttribute('action');
                        var icon = item.getAttribute('icon');
                        var iconCls = item.getAttribute('iconCls');

                        if (addSeparator) {
                            menu.addSeparator(parent);
                            addSeparator = false;
                        }

                        if (icon != null && this.imageBasePath) {
                            icon = this.imageBasePath + icon;
                        }

                        var row = this.addAction(menu, editor, as, icon, funct, action, cell, parent, iconCls);
                        this.addItems(editor, menu, cell, evt, conditions, <Element>item.firstChild, row);
                    }
                } else if (item.nodeName == 'separator') {
                    addSeparator = true;
                }

                item = <Element>item.nextSibling;
            }
        }

        /** Helper method to bind an action to a new menu item.
         * menu - <mxPopupMenu> that is used for adding items and separators.
         * editor - Enclosing <mxEditor> instance.
         * lab - String that represents the label of the menu item.
         * icon - Optional URL that represents the icon of the menu item.
         * action - Optional name of the action to execute in the given editor.
         * funct - Optional function to execute before the optional action. The
         * function takes an <mxEditor>, the <mxCell> under the mouse and the
         * mouse event that triggered the call.
         * cell - Optional <mxCell> to use as an argument for the action.
         * parent - DOM node that represents the parent menu item.
         * iconCls - Optional CSS class for the menu icon.
         */
        private addAction(menu: PopupMenu, editor: Editor, lab: string, icon?:string, funct?:Function, action?:string, cell?:Cell, parent?:Element, iconCls?:string) {
            var clickHandler = evt => {
                funct.call(editor, editor, cell, evt);

                if (action != null) {
                    editor.execute(action, cell);
                }
            }

            return menu.addItem(lab, icon, clickHandler, parent, iconCls);
        }

        /** Evaluates the default conditions for the given context. */
        private createConditions(editor: Editor, cell: Cell, evt: MouseEvent) {
            // Creates array with conditions
            var model = editor.graph.getModel();
            var childCount = model.getChildCount(cell);

            // Adds some frequently used conditions
            var conditions = [];
            conditions['nocell'] = cell == null;
            conditions['ncells'] = editor.graph.getSelectionCount() > 1;
            conditions['notRoot'] = model.getRoot() !=
                model.getParent(editor.graph.getDefaultParent());
            conditions['cell'] = cell != null;

            var isCell = cell != null && editor.graph.getSelectionCount() == 1;
            conditions['nonEmpty'] = isCell && childCount > 0;
            conditions['expandable'] = isCell && editor.graph.isCellFoldable(cell, false);
            conditions['collapsable'] = isCell && editor.graph.isCellFoldable(cell, true);
            conditions['validRoot'] = isCell && editor.graph.isValidRoot(cell);
            conditions['emptyValidRoot'] = conditions['validRoot'] && childCount == 0;
            conditions['swimlane'] = isCell && editor.graph.isSwimlane(cell);

            // Evaluates dynamic conditions from config file

            // ReSharper disable once Html.TagNotResolved
            var condNodes = this.config.getElementsByTagName('condition');

            for (var i = 0; i < condNodes.length; i++) {
                var element = <Element>condNodes[i];
                var funct = Utils.eval(Utils.getTextContent(element));
                var name = element.getAttribute('name');

                if (name != null && typeof (funct) == 'function') {
                    conditions[name] = funct(editor, cell, evt);
                }
            }

            return conditions;
        }
    }
} 
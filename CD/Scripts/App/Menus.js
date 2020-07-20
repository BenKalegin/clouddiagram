var CloudDiagram;
(function (CloudDiagram) {
    var KeyCode = Five.KeyCode;
    var KeyModifier = Five.KeyModifier;
    var MenuItem = (function () {
        function MenuItem(control, group, action) {
            var _this = this;
            this.control = control;
            this.group = group;
            this.action = action;
            control.onclick = function () { return _this.fire(); };
        }
        MenuItem.prototype.fire = function () {
            if (this.action.isEnabled())
                this.action.execute();
        };
        return MenuItem;
    })();
    var Menus = (function () {
        function Menus() {
        }
        Menus.camelize = function (str) {
            return str.substr(0, 1).toUpperCase() + str.substr(1).toLowerCase();
        };
        Menus.createItem = function (group, action) {
            var code = action.getKeyCode();
            var mod = action.getKeyModifier();
            var hotkey = null;
            if (code) {
                switch (mod) {
                    case 2 /* ctrl */:
                        hotkey = "Ctrl+";
                        break;
                    case 1 /* shift */:
                        hotkey = "Shift+";
                        break;
                    case 3 /* ctrlShift */:
                        hotkey = "Ctrl+Shift+";
                        break;
                    default:
                        hotkey = '';
                }
                hotkey += this.camelize(KeyCode[code]);
            }
            var elem = this.itemFactory(group, action.getCaption(), hotkey);
            this.menuItems.push(new MenuItem(elem, group, action));
        };
        Menus.createGroup = function (caption, menuId, actions) {
            var _this = this;
            var menu = this.groupFactory(caption, menuId, function (id) { return Menus.enableDisableMenuItems(id); });
            var currentGroup = -1;
            actions.forEach(function (a) {
                var group = a.getGroup();
                if (currentGroup >= 0 && group != currentGroup)
                    _this.dividerFactory(menuId);
                currentGroup = group;
                _this.createItem(menuId, a);
                a.getGroup();
            });
            return menu;
        };
        Menus.setupFileActions = function (actions) {
            if (!this.fileGroup) {
                this.fileGroup = this.createGroup("File", Menus.menuFileId, actions);
            }
        };
        Menus.setupEditActions = function (actions) {
            if (!this.editGroup) {
                this.editGroup = this.createGroup("Edit", Menus.menuEditId, actions);
            }
        };
        Menus.setupMindMapActions = function (actions) {
            if (!this.mindMapGroup) {
                this.mindMapGroup = this.createGroup("Mind Map", Menus.menuMindMapId, actions);
            }
        };
        Menus.enableDisableMenuItems = function (groupId) {
            this.menuItems.filter(function (i) { return i.group === groupId; }).forEach(function (i) {
                if (i.action.isEnabled())
                    i.control.classList.remove("disabled");
                else
                    i.control.classList.add("disabled");
            });
        };
        Menus.menuFileId = "menu-group-file";
        Menus.menuEditId = "menu-group-edit";
        Menus.menuMindMapId = "menu-group-mindmap";
        Menus.menuItems = [];
        return Menus;
    })();
    CloudDiagram.Menus = Menus;
})(CloudDiagram || (CloudDiagram = {}));
//# sourceMappingURL=Menus.js.map
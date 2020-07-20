var Widgets;
(function (Widgets) {
    function createTreeWidget(container, events, model) {
        return new TreeWidget(container, events, model);
    }
    Widgets.createTreeWidget = createTreeWidget;
    var TreeWidget = (function () {
        function TreeWidget(container, events, model) {
            this.currentSelection = null;
            this.events = events;
            this.container = container;
            var rootList = this.injectRoot();
            this.appendChildren(rootList, model.roots);
        }
        TreeWidget.prototype.injectRoot = function () {
            var treeDiv = document.createElement("div");
            treeDiv.classList.add("tree");
            treeDiv.classList.add("well");
            var rootList = document.createElement("ul");
            treeDiv.appendChild(rootList);
            this.container.appendChild(treeDiv);
            return rootList;
        };
        TreeWidget.prototype.toggleFolderCollapsed = function (e) {
            var view = this.view;
            var children = view.children;
            var span = view.text;
            var icon = view.icon;
            if ($(children).is(":visible")) {
                $(children).hide("fast");
                $(span).attr("title", "Expand this branch");
                icon.classList.add(TreeWidget.closedFolderIcon);
                icon.classList.remove(TreeWidget.openedFolderIcon);
            }
            else {
                $(children).show("fast");
                $(span).attr("title", "Collapse this branch");
                icon.classList.remove(TreeWidget.closedFolderIcon);
                icon.classList.add(TreeWidget.openedFolderIcon);
            }
            e.stopPropagation();
        };
        TreeWidget.prototype.onLeafClick = function (view, e) {
            var _this = this;
            var showSelected = function (selected) {
                var classList = _this.currentSelection.text.classList;
                if (selected) {
                    classList.add("list-group-item");
                    classList.add("active");
                }
                else {
                    classList.remove("active");
                    classList.remove("list-group-item");
                }
            };
            if (this.currentSelection) {
                showSelected(false);
                this.currentSelection = null;
            }
            view.events.onLeafSelected(view.id);
            this.currentSelection = view;
            showSelected(true);
            e.stopPropagation();
        };
        TreeWidget.prototype.createView = function (node) {
            var _this = this;
            var result = {
                root: null,
                text: null,
                icon: null,
                children: null,
                events: this.events,
                id: node.id
            };
            result.icon = document.createElement("i");
            result.icon.classList.add("glyphicon");
            if (node.folder)
                result.icon.classList.add(TreeWidget.closedFolderIcon);
            result.icon.style.paddingRight = "4px";
            result.text = document.createElement("span");
            result.text.textContent = node.name;
            result.text.insertAdjacentElement("afterbegin", result.icon);
            result.root = document.createElement("li");
            result.root.appendChild(result.text);
            if (node.folder) {
                result.children = document.createElement("ul");
                result.children.style.display = "none";
                this.appendChildren(result.children, node.children);
                result.root.appendChild(result.children);
            }
            if (node.folder)
                result.root.onclick = this.toggleFolderCollapsed;
            else
                result.root.onclick = function (e) { return _this.onLeafClick(result, e); };
            result.root.view = result;
            return result;
        };
        TreeWidget.prototype.appendChildren = function (treeview, treedata) {
            var _this = this;
            treedata.forEach(function (node) {
                var view = _this.createView(node);
                treeview.appendChild(view.root);
            });
        };
        TreeWidget.closedFolderIcon = "glyphicon-chevron-right";
        TreeWidget.openedFolderIcon = "glyphicon-chevron-down";
        return TreeWidget;
    })();
})(Widgets || (Widgets = {}));
//# sourceMappingURL=TreeWidget.js.map
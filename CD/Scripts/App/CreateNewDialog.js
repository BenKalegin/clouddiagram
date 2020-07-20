var CloudDiagram;
(function (CloudDiagram) {
    (function (DiagramType) {
        DiagramType[DiagramType["MindMap"] = 0] = "MindMap";
        DiagramType[DiagramType["UmlSequence"] = 1] = "UmlSequence";
        DiagramType[DiagramType["UmlUsecase"] = 2] = "UmlUsecase";
        DiagramType[DiagramType["UmlClass"] = 3] = "UmlClass";
        DiagramType[DiagramType["UmlActivity"] = 4] = "UmlActivity";
    })(CloudDiagram.DiagramType || (CloudDiagram.DiagramType = {}));
    var DiagramType = CloudDiagram.DiagramType;
    function createNewDialog(events) {
        new CreateNewDialog(events).show();
    }
    CloudDiagram.createNewDialog = createNewDialog;
    var CreateNewDialog = (function () {
        function CreateNewDialog(events) {
            this.events = events;
        }
        CreateNewDialog.prototype.onOk = function (ctx) {
            this.events.onSelected(this.selectedDiagramId);
            ctx.close();
        };
        CreateNewDialog.prototype.onLeafSelected = function (id) {
            this.selectedDiagramId = id;
            this.okButton.toggleEnable(true);
        };
        CreateNewDialog.prototype.sampleTree = function () {
            return {
                roots: [
                    {
                        name: "Decision Making",
                        folder: true,
                        children: [{ id: 0 /* MindMap */, name: "Mind Mapping Diagram", folder: false }]
                    },
                    {
                        name: "UML",
                        folder: true,
                        children: [
                            {
                                name: "Structural",
                                folder: true,
                                children: [
                                    { id: 2 /* UmlUsecase */, name: "Usecase Diagram", folder: false },
                                    { id: 3 /* UmlClass */, name: "Class Diagram", folder: false }
                                ]
                            },
                            {
                                name: "Behavioral",
                                folder: true,
                                children: [
                                    { id: 1 /* UmlSequence */, name: "Sequence Diagram", folder: false },
                                    { id: 4 /* UmlActivity */, name: "Activity Diagram", folder: false }
                                ]
                            }
                        ]
                    }
                ]
            };
        };
        CreateNewDialog.prototype.show = function () {
            var _this = this;
            var pane = document.createElement("div");
            var caption = document.createElement("p");
            caption.textContent = "Please select diagram type to create:";
            pane.appendChild(caption);
            Widgets.createTreeWidget(pane, { onLeafSelected: function (id) { return _this.onLeafSelected(id); } }, this.sampleTree());
            var buttonId = "createDiagramButton";
            var options = {
                message: pane,
                type: BootstrapDialog.TYPE_PRIMARY,
                size: BootstrapDialog.SIZE_LARGE,
                title: "Create new diagram",
                description: "some description",
                buttons: [
                    {
                        id: buttonId,
                        label: "Create",
                        cssClass: "btn-primary",
                        action: function (ctx) { return _this.onOk(ctx); }
                    }
                ]
            };
            this.dialog = BootstrapDialog.show(options);
            this.okButton = this.dialog.getButton(buttonId);
            this.okButton.toggleEnable(false);
        };
        return CreateNewDialog;
    })();
})(CloudDiagram || (CloudDiagram = {}));
//# sourceMappingURL=CreateNewDialog.js.map
var CloudDiagram;
(function (CloudDiagram) {
    var KeyCode = Five.KeyCode;
    var KeyModifier = Five.KeyModifier;
    var behaviorAction = Five.behaviorAction;
    var Application = (function () {
        function Application() {
        }
        Application.initialize = function () {
            var _this = this;
            this.setupActions();
            CloudDiagram.Menus.setupFileActions(this.fileActions);
            CloudDiagram.Menus.setupEditActions(this.editActions);
            this.serverConnection = CloudDiagram.createServerConnection(this.baseUrl);
            this.serverConnection.startOptions.GetAll(function (startOptions) {
                var diagramId = startOptions[0].lastDiagram;
                if (diagramId != undefined) {
                    _this.serverConnection.diagrams.GetById(diagramId, function (diagram) { return _this.load(diagram, diagramId); });
                }
                else
                    _this.createNew();
            });
        };
        Application.setupActions = function () {
            var _this = this;
            this.fileActions = [
                behaviorAction("New Diagram", 1, 78 /* n */, 2 /* ctrl */, function () { return true; }, function () { return Application.createNew(); }),
                behaviorAction("Open From", 1, 79 /* o */, 2 /* ctrl */, function () { return false; }, function () {
                }),
                behaviorAction("Save", 2, 83 /* s */, 3 /* ctrlShift */, function () { return !!_this.editor; }, function () {
                    _this.save();
                })
            ];
            this.editActions = [
                behaviorAction("Undo", 1, 90 /* z */, 2 /* ctrl */, function () { return true; }, function () {
                }),
                behaviorAction("Redo", 1, 79 /* o */, 2 /* ctrl */, function () { return false; }, function () {
                })
            ];
        };
        Application.createGraph = function () {
            var model = new Five.GraphModel();
            var graph = new Five.Graph(document.getElementById("diagram"), this.defaultConfig(), model);
            return graph;
        };
        Application.createNew = function () {
            var _this = this;
            CloudDiagram.createNewDialog({
                onSelected: function (type) {
                    var graph = _this.createGraph();
                    var behavior;
                    switch (type) {
                        case 0 /* MindMap */:
                            behavior = Five.Mindmap.createMindMap();
                            break;
                        default:
                            throw new Error("unsupported language");
                    }
                    _this.editor = CloudDiagram.createDiagramEditor(graph, behavior, null, null);
                }
            });
        };
        Application.save = function () {
            var dto = this.editor.getDiagram();
            var id = this.editor.getDiagramId();
            if (id)
                this.serverConnection.diagrams.Update(dto, id);
            else
                this.serverConnection.diagrams.Create(dto);
        };
        Application.load = function (diagram, diagramId) {
            var graph = this.createGraph();
            var behavior = Five.Mindmap.createMindMap();
            this.editor = CloudDiagram.createDiagramEditor(graph, behavior, diagramId, diagram);
        };
        Application.defaultConfig = function () {
            return {
                nodeSelection: {
                    color: "#FF0000",
                    strokeWidth: 3,
                    dashed: true
                },
                selectionHandle: {
                    fillColor: "#00FF00",
                    strokeColor: "black",
                    size: 7
                }
            };
        };
        Application.baseUrl = "api/";
        return Application;
    })();
    CloudDiagram.Application = Application;
})(CloudDiagram || (CloudDiagram = {}));
//# sourceMappingURL=Application.js.map
module CloudDiagram {

    export interface ICreateNewDialogEvents {
        onSelected(id: DiagramType);            
    }

    export enum DiagramType {
        MindMap,
        UmlSequence,
        UmlUsecase,
        UmlClass,
        UmlActivity
    }

    export function createNewDialog(events: ICreateNewDialogEvents): void { new CreateNewDialog(events).show() }

    class CreateNewDialog {
        private events: ICreateNewDialogEvents;

        constructor(events: ICreateNewDialogEvents) {
            this.events = events;
        }

        private dialog: IBootstrapDialogInstance;
        okButton: IBootstrapDialogLiveButton;
        selectedDiagramId: number;

        private onOk(ctx: IBootstrapDialogContext) {
            this.events.onSelected(this.selectedDiagramId);
            ctx.close();
        }

        private onLeafSelected(id: number) {
            this.selectedDiagramId = id;
            this.okButton.toggleEnable(true);             
        }


        sampleTree(): ITreeWidgetModel {
            return {
                roots: [
                    {
                        name: "Decision Making",
                        folder: true,
                        children: [{ id: DiagramType.MindMap, name: "Mind Mapping Diagram", folder: false }]
                    }, {
                        name: "UML",
                        folder: true,
                        children: [
                            {
                                name: "Structural",
                                folder: true,
                                children: [
                                    { id: DiagramType.UmlUsecase, name: "Usecase Diagram", folder: false },
                                    { id: DiagramType.UmlClass, name: "Class Diagram", folder: false }
                                ]
                            },{
                                name: "Behavioral",
                                folder: true,
                                children: [
                                    { id: DiagramType.UmlSequence, name: "Sequence Diagram", folder: false },
                                    { id: DiagramType.UmlActivity, name: "Activity Diagram", folder: false }
                                ]
                            }
                        ]
                    }
                ]
            };
        }

        show() {
			var pane = document.createElement("div");
			var caption = document.createElement("p");
	        caption.textContent = "Please select diagram type to create:";
	        pane.appendChild(caption);
            createTreeWidget(pane, {onLeafSelected: (id) => this.onLeafSelected(id) }, this.sampleTree());

            var buttonId = "createDiagramButton";
            var options: IBootstrapDialogOptions = {
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
                    action: (ctx) => this.onOk(ctx)
                }]
            };
            this.dialog = BootstrapDialog.show(options);
            this.okButton = this.dialog.getButton(buttonId);
            this.okButton.toggleEnable(false);
        }

    }
}
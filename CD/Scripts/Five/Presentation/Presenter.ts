module Five {
    export interface IPresentationModel {
        beginUpdate(): void;
        endUpdate(): void;
        commitGeometryChange(change: IPresentationGeometryChange);
        changeNodeStyle(presentationNodeElement: IPresentationNodeElement, appliedStyle: AppliedStyle);
    }

    export interface IPresentationElement {
        semanticObject: Object;
        getHeight(): number;
    }

    export interface IPresentationGeometry {
        getBounds(): Rectangle;
    }

    export interface IPresentationGeometryChange extends IPresentationGeometry {
        translate(dx: number, dy: number);
    }

    export interface IPresentationNodeElement extends IPresentationElement {
        getGeometry(): IPresentationGeometry;
        startChangeGeometry(): IPresentationGeometryChange;
        setNodeStyle(style: AppliedStyle);
    }

    export interface IPresentationLinkElement extends IPresentationElement{
    }

    export interface IPresentationFactory {
        insertNode(parent: IPresentationElement, text: string, bounds: Rectangle, style: AppliedStyle, relative: boolean, cellSizeRestrictions: ICellSizeRestrictions): IPresentationNodeElement;
        insertLink(parent: IPresentationElement, text: string, source: IPresentationNodeElement, target: IPresentationNodeElement, style: AppliedStyle): IPresentationLinkElement; 
        removeLink(link: IPresentationLinkElement);
        removeNode(node: IPresentationNodeElement);
    }

    export type SelectionSubscriber =  () => void;

    export interface IPresentationSelection {
        setSelection(nodes: IPresentationNodeElement[]);
        getSelection(): IPresentationElement[];
        addSelectionListener(handler: SelectionSubscriber);
        removeSelectionListener();
    }

    export interface IPresenter extends IPresentationSelection {
        configuration(): IPresenterConfiguration;
        getStylesheet(): Stylesheet;
        getModel(): IPresentationModel;
        getRootParent() : IPresentationNodeElement;
        getFactory(): IPresentationFactory;
        editText(node: IPresentationNodeElement);

        /* please dont use */
        getGraphForLegacyCode(): Graph;
    }

    // todo split by cell, container, etc
    export interface IPresenterConfiguration {
        getAutoSizeCells(): boolean;
        setAutoSizeCells(value: boolean) : void;

        getAutoSizeCellsOnAdd(): boolean; 
        setAutoSizeCellsOnAdd(value: boolean): void;
         
        getResizeContainer(): boolean;
        setResizeContainer(value: boolean): void;
        
        getHtmlLabels() : boolean;
        setHtmlLabels(value: boolean);
    }
}
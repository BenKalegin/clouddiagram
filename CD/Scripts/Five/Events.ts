module Five {

    interface INamedListener {
        name: string;
        f: EventListener;
    }

    interface IEventTargetWithListeners extends EventTarget {
        listenerList: INamedListener[];
    }

    export class BasicEvent
    {
        private consumed_ = false;

        public consume() {
            this.consumed_ = true;
        }

        public isConsumed() {
            return this.consumed_;
        }
    }
    
    export interface IListener<T extends BasicEvent> {
        (event: T);            
    }

    export class EventListeners<T extends BasicEvent>  {

        private disabled_: boolean;
        private listeners_: Array<IListener<T>> = [];

        public set disabled(value: boolean) {this.disabled_ = value}


        public add(listener: IListener<T>) {
            this.remove(listener);
            this.listeners_.push(listener);
        } 
        
        public remove(listener: IListener<T>) {
            var i = 0;
            while (i < this.listeners_.length) {
                if (this.listeners_[i] === listener) {
                    this.listeners_.splice(i, 1);
                }
                else {
                    i++;
                }
            }
        }

        public fire(event?: T) {
            if (!this.disabled_) {
                this.listeners_.forEach(l => l(event));
            }
        }
    }

    export class Events {

        // Holds the event names and associated listeners in an array.The array
        // contains the event name followed by the respective listener for each registered listener.
        //static eventListeners: any[] = null;

        // Contains all objects where any listener was added using<addListener>.
        //  This is used to reduce memory leaks in IE, see<Client.dispose>.
        static objects: EventTarget[] = [];


        // <summary>Binds the function to the specified event on the given element. Use Utils.bind in order to bind the "this" keyword inside the function to a given execution scope.</summary>
        static addListener(element: EventTarget, eventName: string, funct: EventListener) {
            element.addEventListener(eventName, funct, false);
            Events.updateListenerList(<IEventTargetWithListeners>element, eventName, funct);
        }

        private static updateListener(element: IEventTargetWithListeners, eventName: string, funct) {
            var listeners = element.listenerList;
            if (listeners != null) {
                var listenerCount = listeners.length;

                for (var i = 0; i < listenerCount; i++) {
                    var entry = listeners[i];

                    if (entry.f == funct) {
                        listeners.splice(i, 1);
                        break;
                    }
                }

                if (listeners.length == 0) {
                    element.listenerList = null;

                    var idx = Utils.indexOf(Events.objects, element);

                    if (idx >= 0) {
                        Events.objects.splice(idx, 1);
                    }
                }
            }
        }

        static removeListener(element: EventTarget, eventName: string, funct: EventListener) {
            element.removeEventListener(eventName, funct, false);
            Events.updateListener(<IEventTargetWithListeners>element, eventName, funct);
        }

        // Disables the context menu for the given element.
        static disableContextMenu(element: Element) {
            element.setAttribute("oncontextmenu", "return false;");
        }

        // Returns true if the event has been consumed using<consume>.
        static isConsumed(evt) {
            return evt.isConsumed != null && evt.isConsumed;
        }


        static consume(evt: Event, preventDefault?: boolean, stopPropagation?: boolean) {
            preventDefault = (preventDefault != null) ? preventDefault : true;
            stopPropagation = (stopPropagation != null) ? stopPropagation : true;

            if (preventDefault) {
                if (evt.preventDefault) {
                    if (stopPropagation) {
                        evt.stopPropagation();
                    }

                    evt.preventDefault();
                } else if (stopPropagation) {
                    evt.cancelBubble = true;
                }
            }

            // Opera
            (<any>evt).isConsumed = true;

            // Other browsers
            if (!evt.preventDefault) {
                (<any>evt).returnValue = false;
            }
        }


        static change = "change";
        static scale = "scale";
        static translate = "translate";
        static scaleAndTranslate = "scaleAndTranslate";
        static down = "down";
        static up = "up";
        static escape = "escape";
        static startEditing = "startEditing";
        static undo = "undo";
        static redo = "redo";
        static mouseDown = "mouseDown";
        static mouseMove = "mouseMove";
        static mouseUp = "mouseUp";
        static show = "show";
        static hide = "hide";
        static destroy = "destroy";
        static gesture = "gesture";
    	static startEdit = "startEdit";
        static endEdit = "endEdit";
        static size = "size";
        static click = "click";
        static doubleClick = "doubleClick";
        static fireMouseEvent = "fireMouseEvent";
        static pan = "pan";
        static panStart = "panStart";
        static panEnd = "panEnd";
        static labelChanged = "labelChanged";
        static mark = "mark";
        static execute = "execute";
        static executed = "executed";
        static beginUpdate = "beginUpdate";
        static endUpdate = "endUpdate";
        static beforeUndo = "beforeUndo";
        static notify = "notify";
        static connectCell = "connectCell";
        static cellConnected = "cellConnected";
        static add = "add";
        static remove = "remove";
        static start = "start";
        static reset = "reset";
        static connect = "connect";
        static disconnect = "disconnect";
        static suspend = "suspend";
        static resume = "resume";
        static tapAndHold = "tapAndHold";
        static addOverlay = "addOverlay";
        static foldCells = "foldCells";
        static labelHandle = "labelHandle";
        static addCells = "addCells";
        static flipEdge = "flipEdge";
        static splitEdge = "splitEdge";
        static moveCells = "moveCells";
        static cellsFolded = "cellsFolded";
        static resizeCells = "resizeCells";
        static cellsAdded = "cellsAdded";
        static cellsMoved = "cellsMoved";
        static cellsResized = "cellsResized";
        static cellsRemoved = "cellsRemoved";
        static cellsOrdered = "cellsOrdered";
        static updateCellSize = "updateCellSize";
        static root = "root";
        static done = "done";
        static clear = "clear";
        static activate = "activate";
        static resizeStart = "resizeStart";
        static resize = "resize";
        static resizeEnd = "resizeEnd";
        static minimize = "minimize";
        static normalize = "normalize";
        static maximize = "maximize";
        static close = "close";
        static move = "move";
        static moveStart = "moveStart";
        static moveEnd = "moveEnd";
        static select = "select";
        static fired = "fired";
        static receive = "receive";
        static get = "get";
        static refresh = "refresh";
        static removeCells = "removeCells";
        static ungroupCells = "ungroupCells";
        static removeCellsFromParent = "removeCellsFromParent";
        static session = "session";
        static save = "save";
        static open = "open";
        static post = "post";
        static orderCells = "orderCells";
        static alignCells = "alignCells";
        static layoutCells = "layoutCells";
        static removeOverlay = "removeOverlay";
        static groupCells = "groupCells";
        static beforeAddVertex = "beforeAddVertex";
        static addVertex = "addVertex";
        static afterAddVertex = "afterAddVertex";


        static isControlDown(event: KeyboardEvent): boolean {
            /// <summary>Returns true if the control key is pressed for the given event.</summary>
            return (event != null) ? event.ctrlKey : false;
        }

        static isMouseControlDown(event: MouseEvent): boolean {
            /// <summary>Returns true if the control key is pressed for the given event.</summary>
            return (event != null) ? event.ctrlKey : false;
        }

        static isShiftDown(event: KeyboardEvent) {
            /// <summary>Returns true if the any shift key is pressed for the given event.</summary>
            return (event != null) ? event.shiftKey : false;
        }

        static isMouseShiftDown(event: MouseEvent) {
            /// <summary>Returns true if the any shift key is pressed for the given event.</summary>
            return (event != null) ? event.shiftKey : false;
        }

        static isMetaDown(event: KeyboardEvent) {
            /// <summary>Returns true if the any Meta key is pressed for the given event.</summary>
            return (event != null) ? event.metaKey : false;
        }

        static isMouseMetaDown(event: MouseEvent) {
            /// <summary>Returns true if the any Meta key is pressed for the given event.</summary>
            return (event != null) ? event.metaKey : false;
        }

        static isAltDown(event: KeyboardEvent) {
            /// <summary>Returns true if the any Alt key is pressed for the given event.</summary>
            return (event != null) ? event.altKey : false;
        }

        static isMouseAltDown(event: MouseEvent) {
            /// <summary>Returns true if the any Alt key is pressed for the given event.</summary>
            return (event != null) ? event.altKey : false;
        }

        /**
         * Returns the event's target or srcElement depending on the browser.
         */
        static getSource(event: Event): Element {
            return (event.srcElement != null) ? <Element>event.srcElement : <Element>event.target;
        }


        /**
         * Adds the given listeners for touch, mouse and/or pointer events. 
         * If <Client.IS_POINTER> is true then MSPointerEvents will be registered, else the respective mouse events will be registered. 
         * If <Client.IS_POINTER> is false and <Client.IS_TOUCH> is true then the respective touch events will be registered as well as the mouse events.
         */
        static addGestureListeners(node: EventTarget, startListener: (evt: any) => void, moveListener?: (evt: any) => void, endListener?: (evt: any) => void) {
            if (startListener != null) {
                Events.addListener(node, (Client.isPointer) ? "MSPointerDown" : "mousedown", startListener);
            }

            if (moveListener != null) {
                Events.addListener(node, (Client.isPointer) ? "MSPointerMove" : "mousemove", moveListener);
            }

            if (endListener != null) {
                Events.addListener(node, (Client.isPointer) ? "MSPointerUp" : "mouseup", endListener);
            }

            if (!Client.isPointer && Client.isTouch) {
                if (startListener != null) {
                    Events.addListener(node, "touchstart", startListener);
                }

                if (moveListener != null) {
                    Events.addListener(node, "touchmove", moveListener);
                }

                if (endListener != null) {
                    Events.addListener(node, "touchend", endListener);
                }
            }
        }

        /**
        * Removes the given listeners from mousedown, mousemove, mouseup and the
        * respective touch events if <Client.IS_TOUCH> is true.
        */
        static removeGestureListeners(node: EventTarget, startListener, moveListener, endListener) {
            if (startListener != null) {
                Events.removeListener(node, (Client.isPointer) ? "MSPointerDown" : "mousedown", startListener);
            }

            if (moveListener != null) {
                Events.removeListener(node, (Client.isPointer) ? "MSPointerMove" : "mousemove", moveListener);
            }

            if (endListener != null) {
                Events.removeListener(node, (Client.isPointer) ? "MSPointerUp" : "mouseup", endListener);
            }

            if (!Client.isPointer && Client.isTouch) {
                if (startListener != null) {
                    Events.removeListener(node, "touchstart", startListener);
                }

                if (moveListener != null) {
                    Events.removeListener(node, "touchmove", moveListener);
                }

                if (endListener != null) {
                    Events.removeListener(node, "touchend", endListener);
                }
            }
        }
        // Returns the touch or mouse event that contains the mouse coordinates.
        static getMainEvent(e: Event) : Touch {
            var touchEvent: TouchEvent;
            if ((e.type == "touchstart" || e.type == "touchmove")) {
                touchEvent = <TouchEvent>e;
                if (touchEvent.touches != null && touchEvent.touches[0] != null)
                    return touchEvent.touches[0];
            } else if (e.type == "touchend") {
                touchEvent = <TouchEvent>e;
                if (touchEvent.changedTouches != null && touchEvent.changedTouches[0] != null)
                    return touchEvent.changedTouches[0];
            }
            return null;
        }

        static getClientX(mouseEvent: MouseEvent): number {
            var touch = Events.getMainEvent(mouseEvent);
            return touch != null ? touch.clientX : mouseEvent.clientX;
        }

        static getClientY(mouseEvent: MouseEvent): number {
            var touch = Events.getMainEvent(mouseEvent);
            return touch != null ? touch.clientY : mouseEvent.clientY;
        }

        private static listenerList(element: EventTarget, createIfEmpty: boolean): { name: string; f: EventListener }[] {
            var obj = <any>element;
            return obj.ListenerList;
        }    
        
        private static clearListenerList(element: EventTarget) {
            var obj = <any>element;
            return obj.ListenerList = null;
        }

        private static updateListenerList(element: IEventTargetWithListeners, eventName: string, funct: EventListener) {
            if (element.listenerList == null) {
                element.listenerList = [];
                Events.objects.push(element);
            }
            element.listenerList.push({ name: eventName, f: funct });
        }

        private static removeAllListeners(element: EventTarget) {
            var list = Events.listenerList(element, false);

            if (list != null) {
                while (list.length > 0) {
                    var entry = list[0];
                    Events.removeListener(element, entry.name, entry.f);
                }
            }
        }

        /**
         * Removes the known listeners from the given DOM node and its descendants.
         * element - DOM node to remove the listeners from.
         */
        static release(element: EventTarget) {

            if (element != null) {
                Events.removeAllListeners(element);

                var children = (<Node>element).childNodes;

                if (children != null) {
                    var childCount = children.length;

                    for (var i = 0; i < childCount; i += 1) {
                        Events.release(children[i]);
                    }
                }
            }
        }

        static isPopupTrigger(evt: MouseEvent): boolean {
            ///	<summary>Returns true if the event is a popup trigger.
            /// This implementation returns true if the right button or the left button and control was pressed on a Mac.</summary>
            return Events.isRightMouseButton(evt) || (Client.isMac && Events.isMouseControlDown(evt) &&
                !Events.isMouseShiftDown(evt) && !Events.isMouseMetaDown(evt) && !Events.isMouseAltDown(evt));

        }

        static isRightMouseButton(evt: MouseEvent): boolean {
            return evt.button === 2;
        }

        static isLeftMouseButton(evt: MouseEvent): boolean {
            return evt.button === (Client.isIe && !Client.isIe9 ? 1 : 0);
        }

        // Returns true if the event was generated using a mouse(not a pen or touch device).
        static isMouseEvent(evt: any): boolean {
            return (evt.pointerType != null) ? (evt.pointerType == "mouse" || evt.pointerType ===
                evt.MSPOINTER_TYPE_MOUSE) : ((evt.mozInputSource != null) ?
                evt.mozInputSource == 1 : evt.type.indexOf("mouse") == 0);
        }

        /**
        * Returns true if the event was generated using a touch device (not a pen or mouse).
        */
        static isMultiTouchEvent(evt: MouseEvent) {
            return (evt.type != null && evt.type.indexOf("touch") == 0 && (<any>evt).touches != null && (<any>evt).touches.length > 1);
        }

        static isTouchEvent(evt: MouseEvent) {
            /// <summary>Returns true if the event was generated using a touch device (not a pen or mouse).</summary>
            if ((<any>evt).pointerType != null) {
                var pe = <MSPointerEvent>(evt);
                return pe.pointerType == "touch" || pe.pointerType === 2; //MSPOINTER_TYPE_TOUCH
            } else
                return ((<any>evt).mozInputSource != null) ?
                    (<any>evt).mozInputSource == 5 : evt.type.indexOf("touch") == 0;
        }

        static redirectMouseEvents(node: Element, graph: Graph, state: (ev: Event) => CellState, down?: (ev: Event) => void, move?: (ev: Event) => void, up?: (ev: Event) => void, dblClick?: (ev: Event) => void) {
            /** Redirects the mouse events from the given DOM node to the graph dispatch loop using the event and given state as event arguments. State can
             * either be an instance of <mxCellState> or a function that returns an CellState. The down, move, up and dblClick arguments are optional
             * functions that take the trigger event as arguments and replace the default behaviour.
             */
            Events.addGestureListeners(node, evt => {
                    if (down != null) {
                        down(evt);
                    } else if (!Events.isConsumed(evt)) {
                        graph.fireMouseEvent(Events.mouseDown, new MouseEventContext(evt, state(evt)));
                    }
                },
                evt => {
                    if (move != null) {
                        move(evt);
                    } else if (!Events.isConsumed(evt)) {
                        graph.fireMouseEvent(Events.mouseMove, new MouseEventContext(evt, state(evt)));
                    }
                },
                evt => {
                    if (up != null) {
                        up(evt);
                    } else if (!Events.isConsumed(evt)) {
                        graph.fireMouseEvent(Events.mouseUp, new MouseEventContext(evt, state(evt)));
                    }
                });

            Events.addListener(node, "dblclick", evt => {
                if (dblClick != null) {
                    dblClick(evt);
                } else if (!Events.isConsumed(evt)) {
                    var tmp = state;
                    graph.dblClick(<MouseEvent>evt, (tmp != null) ? tmp(evt).cell : null);
                }
            });
        }

    }

    export enum EventHandle {
        /** Index for the label handle in an MouseEventContext. This should be a negative value that does not interfere with any possible handle indices. Default is -1.*/
        Label = -1,
    
        /** Index for the rotation handle in an MouseEventContext. This should be a negative value that does not interfere with any possible handle indices. Default is -2. */
	    Rotation = -2,

    	/** Start index for the custom handles in an MouseEventContext. This should be a negative value and is the start index which is decremented for each custom handle. Default is -100.*/
	    Custom = -100
    }

    export class ModelChangeEvent extends BasicEvent {
        constructor(public edit: UndoableEdit, public changes: IChange[]) { super() }
    }

    export class NotifyEvent extends BasicEvent {
        constructor(public edit: UndoableEdit, public changes: IChange[]) { super(); }
    }

    export class AfterExecuteEvent extends BasicEvent {
        constructor(public change: IChange) { super()}
    }

    export class UndoEvent extends BasicEvent {
        constructor(public edit: UndoableEdit) { super()}
    }

    export class ScaleEvent extends BasicEvent {
        constructor(public scale: number, public previousScale: number) { super(); }
    }

    export class ScaleAndTranslateEvent extends BasicEvent {
        constructor(public scale: number, public previousScale: number, public translate: Point, public previousTranslate: Point) { super(); }
    }

    export class TranslateEvent extends BasicEvent {
        constructor(public translate: Point, public previousTranslate: Point) { super()}
    } 

    export class SizeEvent extends BasicEvent {
        constructor(public bounds: Rectangle) { super()}
    }

    export class GestureEvent extends BasicEvent {
        constructor(public event: MouseEvent, public cell: Cell) { super()}
    }

    export class BasicMouseEvent extends BasicEvent {
        constructor(public event: MouseEventContext) { super()}
    }

    export class FireMouseEvent extends BasicEvent {
        constructor(public eventName: string, public event: MouseEventContext) { super() }
    }

    export class ClickEvent extends BasicEvent {
        constructor(public event: Event, public cell: Cell) { super() }
    }

    export class DoubleClickEvent extends BasicEvent {
        constructor(public event: MouseEvent, public cell: Cell) { super() }
    }

    export class CellOverlayEvent extends BasicEvent {
        constructor(public cell: Cell, public overlay: CellOverlay) { super() }
    }

    export class FoldCellsEvent extends BasicEvent {
        constructor(public collapse: boolean, public recurse: boolean, public cells: Cell[]) { super() }
    }

    export class ResizeCellsEvent extends BasicEvent {
        constructor(public cells: Cell[], public bounds: Rectangle[]) { super() }
    }

    export class CellsResizeEvent extends BasicEvent {
        constructor(public cells: Cell[], public bounds: Rectangle[]) { super() }
    }

    export class LabelChangedEvent extends BasicEvent {
        constructor(public cell: Cell, public value: string, public old: Node, public event: MouseEvent) { super() }
    }

    export class ConnectCellEvent extends BasicEvent {
        constructor(public edge: Cell, public terminal: Cell, public source: boolean, public previous: Cell) { super() }
    }

    export class FlipEdgeEvent extends BasicEvent {
        constructor(public edge: Cell) { super() }
    }

    export class SplitEdgeEvent extends BasicEvent {
        constructor(public edge: Cell, public cells: Cell[], public newEdge: Cell, public dx: number, public dy: number) { super() }
    }

    export class StartEditingEvent extends BasicEvent {
        constructor(public cell: Cell, public event: MouseEvent) { super() }
    }

    export class AddCellsEvent extends BasicEvent {
        constructor(public cells: Cell[], public parent: Cell, public index: number, public source: Cell, public target: Cell) { super() }
    }

    export class CellsAddedEvent extends BasicEvent {
        constructor(public cells: Cell[], public parent: Cell, public index: number, public source: Cell, public target: Cell, public absolute: boolean) { super() }
    }

    export class RemoveCellsEvent extends BasicEvent {
        constructor(public cells: Cell[], public includeEdges: boolean) { super() }
    }

    export class MoveCellsEvent extends BasicEvent {
        constructor(public cells: Cell[], public dx: number, public dy: number, public clone: boolean, public target: Cell, public event: MouseEvent) { super() }
    }

    export class CellsMovedEvent extends BasicEvent {
        constructor(public cells: Cell[], public dx: number, public dy: number, public disconnect: boolean) { super() }
    }

    export class CellsEvent extends BasicEvent {
        constructor(public cells: Cell[]) { super() }
    }

    export class OrderCellsEvent extends BasicEvent {
        constructor(public cells: Cell[], public back: boolean) { super() }
    }

    export class AlignCellsEvent extends BasicEvent {
        constructor(public cells: Cell[], public halign: HorizontalAlign, public valign: VerticalAlign) { super() }
    }

    export class GroupCellsEvent extends BasicEvent {
        constructor(public group: Cell, public border: number, public cells: Cell[]) { super() }
    }

    export class UpdateCellSizeEvent extends BasicEvent {
        constructor(public cell: Cell, public ignoreChildren: boolean) { super() }
    }
}
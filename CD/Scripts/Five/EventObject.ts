module Five {
/**
 * Class: mxEventObject
 * 
 * The mxEventObject is a wrapper for all properties of a single event.
 * Additionally, it also offers functions to consume the event and check if it
 * was consumed as follows:
 * 
 * (code)
 * evt.consume();
 * INV: evt.isConsumed() == true
 * (end)
 * 
 * Constructor: mxEventObject
 *
 * Constructs a new event object with the specified name. An optional
 * sequence of key, value pairs can be appended to define properties.
 * 
 * Example:
 *
 * (code)
 * new mxEventObject("eventName", key1, val1, .., keyN, valN)
 * (end)
 */
    export class EventObject {
        constructor(name: string, ...params: {key: string; value}[]) {
            this.name = name;

            for(var i = 0; i < params.length; i ++) {
                this.properties[params[i].key] = params[i].value;
            }
        }

        private name: string;
        private properties: { [key: string] : any} = {};
        private consumed = false;

        getName() : string {
            return this.name;
        }

        getProperties(): { [key: string]: any } {
            return this.properties;
        } 
        
        getProperty(key: string) : any {
            return this.properties[key];
        }

        isConsumed() : boolean {
            return this.consumed;
        }

        consume() {
            this.consumed = true;
        }
    }
}
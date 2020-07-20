module Five {
    export class ObjectIdentity {
        /// <summary>Identity for JavaScript objects. This is implemented using a simple incremeting counter which is stored in each object under ID_NAME.
        /// The identity for an object does not change during its lifecycle.</summary> 

        // Name of the field to be used to store the object ID. Default is '_mxObjectId'.
        static fieldName = "__ObjectId";

        // Current counter for objects.
        private static counter = 0;

        // counter for Nodes.
        static nodeCounter = 0;

        static get(obj: any): string {
            /// <summary>Returns the object id for the given object.</summary>
            if (typeof (obj) == "object" && obj[ObjectIdentity.fieldName] == null) {
                var ctor = Utils.getFunctionName(obj.constructor);
                obj[ObjectIdentity.fieldName] = ctor + "#" + ObjectIdentity.counter++;
            }

            return obj[ObjectIdentity.fieldName];
        }

        static clear(obj) {
            /// <summary>Removes the object id from the given object.</summary>
            /// <param name="obj" type=""></param>
            if (typeof (obj) == "object") {
                delete obj[ObjectIdentity.fieldName];
            }
        }
    }
}
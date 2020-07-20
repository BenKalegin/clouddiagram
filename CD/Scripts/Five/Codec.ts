///<reference path="GraphModel.ts"/>
///<reference path="Utils.ts"/>

module Five {
    export class Codec {
        constructor(document?: Document) {
            this.document = document || Utils.createXmlDocument();
            this.objects = {};
        }

        /** The owner document of the codec.*/
        document: Document;

        /** Maps from IDs to objects.*/
        objects: { [id: string]: Object };

        /** Specifies if default values should be encoded. Default is false. */
        encodeDefaults = false;


        /** Assoiates the given object with the given ID and returns the given object. */
        putObject(id: string, obj: Object): Object {
            this.objects[id] = obj;

            return obj;
        }

        /** Returns the decoded object for the element with the specified ID in <document>. If the object is not known then <lookup> is used to find an
         * object. If no object is found, then the element with the respective ID from the document is parsed using <decode>. */
        getObject(id: string): Object {
            var obj: Object = null;

            if (id != null) {
                obj = this.objects[id];

                if (obj == null) {
                    obj = this.lookup(id);

                    if (obj == null) {
                        var node = this.getElementById(id);

                        if (node != null) {
                            obj = this.decode(node);
                        }
                    }
                }
            }

            return obj;
        }

        /** Hook for subclassers to implement a custom lookup mechanism for cell IDs. This implementation always returns null.
         * codec.lookup = function(id) { return model.getCell(id); }; */
        lookup(id: string): Object {
            return null;
        }

        /** Returns the element with the given ID from <document>. The optional attr argument specifies the name of the ID attribute. Default is "id". The
         * XPath expression used to find the element is //*[@attr='arg'] where attr is the name of the ID attribute and arg is the given id.
         * id - String that contains the ID.
         * attr - Optional string for the attributename. Default is "id". */
        private getElementById(id: string, attr = "id") : Node{
            return Utils.findNodeByAttribute(this.document.documentElement, attr, id);
        }

        /** Returns the ID of the specified object. This implementation calls <reference> first and if that returns null handles
         * the object as an <mxCell> by returning their IDs using <mxCell.getId>. If no ID exists for the given cell, then
         * an on-the-fly ID is generated using <mxCellPath.create>.  */
        getId(obj: Object): string {
            var id = null;

            if (obj != null) {
                id = this.reference(obj);

                if (id == null && obj instanceof Cell) {
                    var cell = <Cell>obj;
                    id = cell.getId();

                    if (id == null) {
                        // Uses an on-the-fly Id
                        id = CellPath.create(cell);

                        if (id.length == 0) {
                            id = 'root';
                        }
                    }
                }
            }

            return id;
        }

        /** Hook for subclassers to implement a custom method for retrieving IDs from objects. This implementation always returns null.
         * codec.reference = function(obj) { return obj.getCustomId(); };
         * obj - Object whose ID should be returned. */
        private reference(obj: Object): string {
            return null;
        }

        /** Encodes the specified object and returns the resulting XML node. */
        encode(obj: Object): Element {
            var node: Element = null;

            if (obj != null && obj.constructor != null) {
                var enc = CodecRegistry.getCodec(obj.constructor);

                if (enc != null) {
                    node = <Element>enc.encode(this, obj);
                } else {
                    if (Utils.isNode(obj)) {
                        node = <Element>Utils.importNode(this.document, <Element>obj, true);
                    } else {
                        console.warn('mxCodec.encode: No codec for ' + Utils.getFunctionName(obj.constructor));
                    }
                }
            }

            return node;
        }

        /** Decodes the given XML node. The optional "into" argument specifies an existing object to be used. If no object is given, then a new instance
         * is created using the constructor from the codec. The function returns the passed in object or the new instance if no object was given.
         * node - XML node to be decoded.
         * into - Optional object to be decodec into. */
        decode(node: Node, into?: Object) : Object {
            var obj = null;

            if (node != null && node.nodeType == NodeType.Element) {
                var ctor = null;

                try {
                    switch (node.nodeName) {
                    case "GraphModel":
                        ctor = GraphModel.constructor;
                        break;
                    default:
                        throw new Error("Unexpected node " + node.nodeName);        
                    }
                    //ctor = window[node.nodeName];
                } catch (err) {
                    // ignore
                }

                var dec = CodecRegistry.getCodec(ctor);

                if (dec != null) {
                    obj = dec.decode(this, <Element>node, into);
                } else {
                    obj = node.cloneNode(true);
                    obj.removeAttribute('as');
                }
            }

            return obj;
        }

        /** Encoding of cell hierarchies is built-into the core, but is a higher-level function that needs to be explicitely
         * used by the respective object encoders (eg. <mxModelCodec>, <mxChildChangeCodec> and <mxRootChangeCodec>). This
         * implementation writes the given cell and its children as a (flat) sequence into the given node. The children are not
         * encoded if the optional includeChildren is false. The function is in charge of adding the result into the given node and has no return value.
         * cell - <mxCell> to be encoded.
         * node - Parent XML node to add the encoded cell into.
         * includeChildren - Optional boolean indicating if the
         * function should include all descendents. Default is true. 
         */
        encodeCell(cell: Cell, node: Node, includeChildren: boolean = false) {
            node.appendChild(this.encode(cell));

            if (includeChildren) {
                var childCount = cell.getChildCount();

                for (var i = 0; i < childCount; i++) {
                    this.encodeCell(cell.getChildAt(i), node);
                }
            }
        }

        /** Returns true if the given codec is a cell codec. This uses <mxCellCodec.isCellCodec> to check if the codec is of the given type. */
        private isCellCodec(codec) {
            if (codec != null && typeof (codec.isCellCodec) == 'function') {
                return codec.isCellCodec();
            }

            return false;
        }

        /** Decodes cells that have been encoded using inversion, ie. where the user object is the enclosing node in the XML,
         * and restores the group and graph structure in the cells. Returns a new <mxCell> instance that represents the given node.
         * node - XML node that contains the cell data.
         * restoreStructures - Optional boolean indicating whether the graph structure should be restored by calling insert
         * and insertEdge on the parent and terminals, respectively. Default is true. */
        private decodeCell(node: Node, restoreStructures: boolean = true): Cell {
            var cell: Cell = null;
            if (node != null && node.nodeType == NodeType.Element) {
                // Tries to find a codec for the given node name. If that does not return a codec then the node is the user object (an XML node that contains the mxCell, aka inversion).
                var decoder = CodecRegistry.getCodec(node.nodeName);
                // Tries to find the codec for the cell inside the user object. 
                // This assumes all node names inside the user object are either not registered or they correspond to a class for cells.
                if (!this.isCellCodec(decoder)) {
                    var child = node.firstChild;

                    while (child != null && !this.isCellCodec(decoder)) {
                        decoder = CodecRegistry.getCodec(child.nodeName);
                        child = child.nextSibling;
                    }
                }

                if (!this.isCellCodec(decoder)) {
                    decoder = CodecRegistry.getCodec(Cell.constructor);
                }

                cell = <Cell>decoder.decode(this, <Element>node);

                if (restoreStructures) {
                    this.insertIntoGraph(cell);
                }
            }

            return cell;
        }

        /** Inserts the given cell into its parent and terminal cells. */
        private insertIntoGraph(cell: Cell) {
            var parent = cell.parent;
            var source = cell.getTerminal(true);
            var target = cell.getTerminal(false);

            // Fixes possible inconsistencies during insert into graph
            cell.setTerminal(null, false);
            cell.setTerminal(null, true);
            cell.parent = null;

            if (parent != null) {
                parent.insert(cell);
            }

            if (source != null) {
                source.insertEdge(cell, true);
            }

            if (target != null) {
                target.insertEdge(cell, false);
            }
        }

        /** Sets the attribute on the specified node to value. This is a helper method that makes sure the attribute and value arguments are not null.
         * node - XML node to set the attribute for.
         * attributes - Attributename to be set.
         * value - New value of the attribute. */
        setAttribute(node: Element, attribute, value) {
            if (attribute != null && value != null) {
                node.setAttribute(attribute, value);
            }
        }
    }

    class CodecRegistry {
        /* Maps from constructor names to codecs.*/
        static codecs: { [ctor: string]: ObjectCodec } = {};

        /** Maps from classnames to codecnames. */
        static aliases: { [className: string]: string } = {};

        /** Registers a new codec and associates the name of the template constructor in the codec with the codec object. */
        static register(codec: ObjectCodec) {
            if (codec != null) {
                var name = codec.getName();
                CodecRegistry.codecs[name] = codec;

                var classname = Utils.getFunctionName(codec.template.constructor);

                if (classname != name) {
                    CodecRegistry.addAlias(classname, name);
                }
            }

            return codec;
        }

        /** Adds an alias for mapping a classname to a codecname. */
        static addAlias(classname: string, codecname: string) {
            CodecRegistry.aliases[classname] = codecname;
        }

        /** Returns a codec that handles objects that are constructed using the given constructor. ctor - JavaScript constructor function.  */
        static getCodec(ctor: any): ObjectCodec {
            var codec = null;

            if (ctor != null) {
                var name = Utils.getFunctionName(ctor);
                var tmp = CodecRegistry.aliases[name];

                if (tmp != null) {
                    name = tmp;
                }

                codec = CodecRegistry.codecs[name];

                // Registers a new default codec for the given constructor
                // if no codec has been previously defined.
                if (codec == null) {
                    try {
                        codec = new ObjectCodec(new ctor());
                        CodecRegistry.register(codec);
                    } catch (e) {
                        // ignore
                    }
                }
            }

            return codec;
        }
    }

    export interface IStringStringMap {
        [key: string]: string;
    }

    export class ObjectCodec {
        /* template - Prototypical instance of the object to be encoded / decoded.
         * exclude - Optional array of fieldnames to be ignored.
         * idrefs - Optional array of fieldnames to be converted to/ from references.
         * mapping - Optional mapping from field- to attributenames. */
        constructor(template: Object, exclude: string[] = [], idrefs: string[] = [], mapping: IStringStringMap = {}) {
            this.template = template;

            this.exclude = exclude;
            this.idrefs = idrefs;
            this.mapping = mapping;

            this.reverse = {};

            for (var i in this.mapping) {
                this.reverse[this.mapping[i]] = i;
            }
        }

        /** Static global switch that specifies if expressions in arrays are allowed. Default is false. NOTE: Enabling this carries a possible security risk (see the section on security in the manual). */
        static allowEval = false;

        /** Holds the template object associated with this codec. */
        template: Object;

        /** Array containing the variable names that should be ignored by the codec. */
        private exclude: string[];

        /** Array containing the variable names that should be turned into or converted from references. See <mxCodec.getId> and <mxCodec.getObject>. */
        private idrefs: string[];

        /** Maps from from fieldnames to XML attribute names. */
        private mapping: IStringStringMap;

        /** Maps from from XML attribute names to fieldnames. */
        private reverse: IStringStringMap;

        /** Returns the name used for the nodenames and lookup of the codec when classes are encoded and nodes are decoded. For classes to work with
         * this the codec registry automatically adds an alias for the classname if that is different than what this returns. The default implementation
         * returns the classname of the template class.
         */
        getName(): string {
            return Utils.getFunctionName(this.template.constructor);
        }

        /** Returns a new instance of the template for this codec. */
        private cloneTemplate(): Object {
            return new (<any>this.template.constructor)();
        }

        /** Returns the fieldname for the given attributename. Looks up the value in the <reverse> mapping or returns the input if there is no reverse mapping for the given name. */
        private getFieldName(attributename: string): string {
            if (attributename != null) {
                var mapped = this.reverse[attributename];

                if (mapped != null) {
                    attributename = mapped;
                }
            }

            return attributename;
        }

        /** Returns the attributename for the given fieldname.  Looks up the value in the <mapping> or returns the input if there is no mapping for the given name.*/
        private getAttributeName(fieldname: string): string {
            if (fieldname != null) {
                var mapped = this.mapping[fieldname];

                if (mapped != null) {
                    fieldname = mapped;
                }
            }

            return fieldname;
        }

        /** Returns true if the given attribute is to be ignored by the codec. Thisimplementation returns true if the given fieldname is in <exclude> or
         * if the fieldname equals <mxObjectIdentity.FIELD_NAME>.
         * obj - Object instance that contains the field.
         * attr - Fieldname of the field.
         * value - Value of the field.
         * write - Boolean indicating if the field is being encoded or decoded.
         * Write is true if the field is being encoded, else it is being decoded.
         */
        private isExcluded(obj: Object, attr: string, value: any, write: boolean): boolean {
            return attr == ObjectIdentity.fieldName || Utils.indexOf(this.exclude, attr) >= 0;
        }

        /** Returns true if the given fieldname is to be treated as a textual reference (ID). This implementation returns true if the given fieldname is in <idrefs>.
         * obj - Object instance that contains the field.
         * attr - Fieldname of the field.
         * value - Value of the field. 
         * write - Boolean indicating if the field is being encoded or decoded.
         * Write is true if the field is being encoded, else it is being decoded.
         */
        private isReference(obj: Object, attr: string, value: any, write: boolean) {
            return Utils.indexOf(this.idrefs, attr) >= 0;
        }

        /** Encodes the specified object and returns a node representing then given object. Calls <beforeEncode>
         * after creating the node and <afterEncode> with the  resulting node after processing.
         *
         * Enc is a reference to the calling encoder. It is used to encode complex objects and create references.
         *
         * This implementation encodes all variables of an object according to the following rules:
         *
         * - If the variable name is in <exclude> then it is ignored.
         * - If the variable name is in <idrefs> then <mxCodec.getId> is used to replace the object with its ID.
         * - The variable name is mapped using <mapping>.
         * - If obj is an array and the variable name is numeric (ie. an index) then it is not encoded.
         * - If the value is an object, then the codec is used to create a child node with the variable name encoded into the "as" attribute.
         * - Else, if <encodeDefaults> is true or the value differs from the template value, then ...
         * - ... if obj is not an array, then the value is mapped to an attribute.
         * - ... else if obj is an array, the value is mapped to an add child with a value attribute or a text child node, if the value is a function.
         *
         * If no ID exists for a variable in <idrefs> or if an objectcannot be encoded, a warning is issued using <mxLog.warn>.
         *
         * Returns the resulting XML node that represents the givenobject.
         * enc - <mxCodec> that controls the encoding process.
         * obj - Object to be encoded.
         */
        encode(enc: Codec, obj: Object): Node {
            var node = enc.document.createElement(this.getName());

            obj = this.beforeEncode(enc, obj, node);
            this.encodeObject(enc, obj, node);

            return this.afterEncode(enc, obj, node);
        }

        /** Encodes the value of each member in then given obj into the given node using <encodeValue>.
         * enc - <mxCodec> that controls the encoding process.
         * obj - Object to be encoded.
         * node - XML node that contains the encoded object. */
        encodeObject(enc: Codec, obj: Object, node: Element) {
            enc.setAttribute(node, 'id', enc.getId(obj));

            for (var i in obj) {
                var name = i;
                var value = obj[name];

                if (value != null && !this.isExcluded(obj, name, value, true)) {
                    if (Utils.isNumeric(name)) {
                        name = null;
                    }

                    this.encodeValue(enc, obj, name, value, node);
                }
            }
        }

        /** Converts the given value according to the mappings and id-refs in this codec and uses <writeAttribute> to write the attribute into the given node.
         * enc - <mxCodec> that controls the encoding process.
         * obj - Object whose property is going to be encoded.
         * name - XML node that contains the encoded object.
         * value - Value of the property to be encoded.
         * node - XML node that contains the encoded object.
         */
        private encodeValue(enc: Codec, obj: Object, name: string, value: any, node: Element): void {
            if (value != null) {
                if (this.isReference(obj, name, value, true)) {
                    var tmp = enc.getId(value);

                    if (tmp == null) {
                        console.warn('ObjectCodec.encode: No ID for ' + this.getName() + '.' + name + '=' + value);
                        return; // exit
                    }

                    value = tmp;
                }

                var defaultValue = this.template[name];

                // Checks if the value is a default value and
                // the name is correct
                if (name == null || enc.encodeDefaults || defaultValue != value) {
                    name = this.getAttributeName(name);
                    this.writeAttribute(enc, obj, name, value, node);
                }
            }
        }

        /** Writes the given value into node using <writePrimitiveAttribute> or <writeComplexAttribute> depending on the type of the value. */
        private writeAttribute(enc: Codec, obj: Object, name: string, value: any, node: Element) {
            if (typeof (value) != 'object' /* primitive type */) {
                this.writePrimitiveAttribute(enc, obj, name, value, node);
            } else /* complex type */
            {
                this.writeComplexAttribute(enc, obj, name, value, node);
            }
        }

        /** Writes the given value as an attribute of the given node. */
        private writePrimitiveAttribute(enc: Codec, obj: Object, name: string, value: any, node: Element) {
            value = this.convertAttributeToXml(enc, obj, name, value);

            if (name == null) {
                var child = enc.document.createElement('add');

                if (typeof (value) == 'function') {
                    child.appendChild(enc.document.createTextNode(value));
                } else {
                    enc.setAttribute(child, 'value', value);
                }

                node.appendChild(child);
            } else if (typeof (value) != 'function') {
                enc.setAttribute(node, name, value);
            }
        }

        /** Writes the given value as a child node of the given node. */
        private writeComplexAttribute(enc: Codec, obj: Object, name: string, value: any, node: Node) {
            var child = enc.encode(value);

            if (child != null) {
                if (name != null) {
                    child.setAttribute('as', name);
                }

                node.appendChild(child);
            } else {
                console.warn('mxObjectCodec.encode: No node for ' + this.getName() + '.' + name + ': ' + value);
            }
        }

        /** Converts true to "1" and false to "0" is <isBooleanAttribute> returns true. All other values are not converted.
         * enc - <mxCodec> that controls the encoding process.
         * obj - Objec to convert the attribute for.
         * name - Name of the attribute to be converted.
         * value - Value to be converted. */
        private convertAttributeToXml(enc: Codec, obj: Object, name: string, value: any): any {
            // Makes sure to encode boolean values as numeric values
            if (this.isBooleanAttribute(enc, obj, name, value)) {
                // Checks if the value is true (do not use the value as is, because
                // this would check if the value is not null, so 0 would be true)
                if (<boolean>value)
                    value = "1";
                else
                    value = "0";
            }
            return value;
        }

        /** Returns true if the given object attribute is a boolean value.
         * enc - <mxCodec> that controls the encoding process.
         * obj - Objec to convert the attribute for.
         * name - Name of the attribute to be converted.
         * value - Value of the attribute to be converted. */
        private isBooleanAttribute(enc: Codec, obj: Object, name: string, value: any) {
            return (typeof (value.length) == 'undefined' && (value == true || value == false));
        }

        /** Converts booleans and numeric values to the respective types. Values are numeric if <isNumericAttribute> returns true.
         * dec - <mxCodec> that controls the decoding process.
         * attr - XML attribute to be converted.
         * obj - Objec to convert the attribute for. */
        private convertAttributeFromXml(dec: Codec, attr: Node, obj: Object) : any {
            var value: any = attr.nodeValue;

            if (this.isNumericAttribute(dec, attr, obj)) {
                value = parseFloat(value);
            }

            return value;
        }

        /** Returns true if the given XML attribute is a numeric value.
         * dec - <mxCodec> that controls the decoding process.
         * attr - XML attribute to be converted.
         * obj - Objec to convert the attribute for. */
        private isNumericAttribute(dec: Codec, attr: Node, obj: Object): boolean {
            return Utils.isNumeric(attr.nodeValue);
        }

        /** Hook for subclassers to pre-process the object before encoding. This returns the input object. The return
         * value of this function is used in <encode> to perform the default encoding into the given node.
         * enc - <mxCodec> that controls the encoding process.
         * obj - Object to be encoded.
         * node - XML node to encode the object into. */
        private beforeEncode(enc: Codec, obj: Object, node: Node): Object {
            return obj;
        }

        /** Hook for subclassers to post-process the node for the given object after encoding and return the post-processed node. 
         * This implementation returns the input node. The return value of this method is returned to the encoder from <encode>.
         * enc - <mxCodec> that controls the encoding process.
         * obj - Object to be encoded.
         * node - XML node that represents the default encoding.
         */
        private afterEncode(enc: Codec, obj: Object, node: Node): Node {
            return node;
        }

        /** Parses the given node into the object or returns a new object representing the given node.
         * Dec is a reference to the calling decoder. It is used to decode complex objects and resolve references.
         * If a node has an id attribute then the object cache is checked for the object. 
         * If the object is not yet in the cache then it is constructed using the constructor of <template> and cached in <mxCodec.objects>.
         * This implementation decodes all attributes and childs of a node according to the following rules:
         * - If the variable name is in <exclude> or if the attribute name is "id" or "as" then it is ignored.
         * - If the variable name is in <idrefs> then <mxCodec.getObject> is used to replace the reference with an object.
         * - The variable name is mapped using a reverse <mapping>. 
         * - If the value has a child node, then the codec is used to create a child object with the variable name taken from the "as" attribute.
         * - If the object is an array and the variable name is empty then the value or child object is appended to the array.
         * - If an add child has no value or the object is not an array then the child text content is evaluated using <Utils.eval>.
         * Returns the resulting object that represents the given XML node or the object given to the method as the into parameter.
         * dec - <mxCodec> that controls the decoding process.
         * node - XML node to be decoded.
         * into - Optional objec to encode the node into.
         */
        decode(dec: Codec, node: Element, into?: Object) {
            var id = node.getAttribute('id');
            var obj = dec.objects[id];

            if (obj == null) {
                obj = into || this.cloneTemplate();

                if (id != null) {
                    dec.putObject(id, obj);
                }
            }

            node = this.beforeDecode(dec, node, obj);
            this.decodeNode(dec, node, obj);

            return this.afterDecode(dec, node, obj);
        }

        /** Calls <decodeAttributes> and <decodeChildren> for the given node.
         * dec - <mxCodec> that controls the decoding process.
         * node - XML node to be decoded.
         * obj - Objec to encode the node into. */
        private decodeNode(dec: Codec, node: Element, obj: Object) {
            if (node != null) {
                this.decodeAttributes(dec, node, obj);
                this.decodeChildren(dec, node, obj);
            }
        }

        /** Decodes all attributes of the given node using <decodeAttribute>.
         * dec - <mxCodec> that controls the decoding process.
         * node - XML node to be decoded.
         * obj - Objec to encode the node into. */
        private decodeAttributes(dec: Codec, node: Element, obj: Object) {
            var attrs = node.attributes;

            if (attrs != null) {
                for (var i = 0; i < attrs.length; i++) {
                    this.decodeAttribute(dec, attrs[i], obj);
                }
            }
        }

        /** Reads the given attribute into the specified object.
         * dec - <mxCodec> that controls the decoding process.
         * attr - XML attribute to be decoded.
         * obj - Objec to encode the attribute into. */
        private decodeAttribute(dec: Codec, attr: Node, obj: Object) {
            var name = attr.nodeName;

            if (name != 'as' && name != 'id') {
                // Converts the string true and false to their boolean values. This may require an additional check on the obj to see if
                // the existing field is a boolean value or uninitialized, in which case we may want to convert true and false to a string.
                var value = this.convertAttributeFromXml(dec, attr, obj);
                var fieldname = this.getFieldName(name);

                if (this.isReference(obj, fieldname, value, false)) {
                    var tmp = dec.getObject(value);

                    if (tmp == null) {
                        console.warn('ObjectCodec.decode: No object for ' + this.getName() + '.' + name + '=' + value);
                        return; // exit
                    }

                    value = tmp;
                }

                if (!this.isExcluded(obj, name, value, false)) {
                    //mxLog.debug(mxUtils.getFunctionName(obj.constructor)+'.'+name+'='+value);
                    obj[name] = value;
                }
            }
        }

        /** Decodec all children of the given node using <decodeChild>.
         * dec - <mxCodec> that controls the decoding process.
         * node - XML node to be decoded.
         * obj - Objec to encode the node into. */
        private decodeChildren(dec: Codec, node: Node, obj: Object) {
            var child = node.firstChild;

            while (child != null) {
                var tmp = child.nextSibling;

                if (child.nodeType == NodeType.Element &&
                    !this.processInclude(dec, <Element>child, obj)) {
                    this.decodeChild(dec, <Element>child, obj);
                }

                child = tmp;
            }
        }

        /** Reads the specified child into the given object.
         * dec - <mxCodec> that controls the decoding process.
         * child - XML child element to be decoded.
         * obj - Objec to encode the node into. */
        decodeChild(dec: Codec, child: Element, obj: Object) {
            var fieldname = this.getFieldName(child.getAttribute('as'));

            if (fieldname == null || !this.isExcluded(obj, fieldname, child, false)) {
                var template = this.getFieldTemplate(obj, fieldname, child);
                var value;

                if (child.nodeName == 'add') {
                    value = child.getAttribute('value');

                    if (value == null && ObjectCodec.allowEval) {
                        value = Utils.eval(Utils.getTextContent(child));
                    }
                } else {
                    value = dec.decode(child, template);
                }

                this.addObjectValue(obj, fieldname, value, template);
            }
        }

        /** Returns the template instance for the given field. This returns the value of the field, null if the value is an array or an empty collection
         * if the value is a collection. The value is then used to populate the field for a new instance. For strongly typed languages it may be
         * required to override this to return the correct collection instance based on the encoded child. */
        private getFieldTemplate(obj: Object, fieldname: string, child: Element) {
            var template = obj[fieldname];

            // Non-empty arrays are replaced completely
            if (template instanceof Array && template.length > 0) {
                template = null;
            }

            return template;
        }

        /** Sets the decoded child node as a value of the given object. If theobject is a map, then the value is added with the given fieldname as a
         * key. If the fieldname is not empty, then setFieldValue is called or else, if the object is a collection, the value is added to the
         * collection. For strongly typed languages it may be required to override this with the correct code to add an entry to an object. */
        private addObjectValue(obj: Object, fieldname: string, value: any, template: Object) {
            if (value != null && value != template) {
                if (fieldname != null && fieldname.length > 0) {
                    obj[fieldname] = value;
                } else {
                    (<Array<any>>obj).push(value);
                }
            }
        }

        /** Returns true if the given node is an include directive and executes the include by decoding the XML document. Returns false if the given node is not an include directive.
         * dec - <mxCodec> that controls the encoding/decoding process.
         * node - XML node to be checked.
         * into - Optional object to pass-thru to the codec. */
        private processInclude(dec: Codec, node: Element, into?: Object): boolean {
            if (node.nodeName == 'include') {
                var name = node.getAttribute('name');

                if (name != null) {
                    try {
                        var xml = Utils.load(name).getDocumentElement();

                        if (xml != null) {
                            dec.decode(xml, into);
                        }
                    } catch (e) {
                        // ignore
                    }
                }

                return true;
            }

            return false;
        }

        /** Hook for subclassers to pre-process the node for the specified object and return the node to be
         * used for further processing by <decode>. The object is created based on the template in the  calling method and is never null. 
         * This implementation returns the input node. The return value of this function is used in <decode> to perform the default decoding into the given object.
         * dec - <mxCodec> that controls the decoding process.
         * node - XML node to be decoded.
         * obj - Object to encode the node into. */
        private beforeDecode(dec: Codec, node: Element, obj: Object): Element {
            return node;
        }

        /** Hook for subclassers to post-process the object after decoding. This implementation returns the given object without any changes. The return value of this method
         * is returned to the decoder from <decode>.
         * enc - <mxCodec> that controls the encoding process.
         * node - XML node to be decoded.
         * obj - Object that represents the default decoding. */
        private afterDecode(dec: Codec, node: Node, obj: Object) {
            return obj;
        }

    }


    CodecRegistry.register((() => {
        /** Codec for <mxGraphModel>s. This class is created and registered dynamically at load time and used implicitely via <mxCodec> and the <mxCodecRegistry>. */
        var codec = new ObjectCodec(new GraphModel());

        codec.encodeObject = (enc, obj, node) => {
            var rootNode = enc.document.createElement('root');
            enc.encodeCell((<GraphModel>obj).getRoot(), rootNode);
            node.appendChild(rootNode);
        };

        codec.decodeChild = function(dec, child, obj)
        {
            if (child.nodeName == 'root')
            {
                this.decodeRoot(dec, child, obj);
            }
            else
            {
                ObjectCodec.prototype.decodeChild.apply(this, arguments);
            }
        };

        (<any>codec).decodeRoot = (dec, root, model) => {
            var rootCell = null;
            var tmp = root.firstChild;
		
            while (tmp != null)
            {
                var cell = dec.decodeCell(tmp);
			
                if (cell != null && cell.getParent() == null)
                {
                    rootCell = cell;
                }
			
                tmp = tmp.nextSibling;
            }

            // Sets the root on the model if one has been decoded
            if (rootCell != null)
            {
                model.setRoot(rootCell);
            }
        };

        // Returns the codec into the registry
        return codec;

    })());

} 
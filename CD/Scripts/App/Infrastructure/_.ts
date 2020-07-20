module CloudDiagram {

    export class _ {
        private static ObjProto = Object.prototype;
        private static ArrayProto = Array.prototype;
        private static nativeIsArray = Array.isArray;
        private static nativeKeys = Object.keys;
        private static hasOwnProperty = _.ObjProto.hasOwnProperty;
        private static slice = _.ArrayProto.slice;

        // Is a given variable an object?
        static isObject(obj) {
            var type = typeof obj;
            return type === 'function' || type === 'object' && !!obj;
        }

        // Is a given value an array?
        // Delegates to ECMA5's native Array.isArray
        static isArray = _.nativeIsArray || (obj => (toString.call(obj) === '[object Array]'));

        // Retrieve all the property names of an object.
        static allKeys(obj): any[] {
            if (!_.isObject(obj)) return [];
            var keys = [];
            for (var key in obj) keys.push(key);
            return keys;
        }

        // Shortcut function for checking if an object has a given property directly
        // on itself (in other words, not on a prototype).
        private static has(obj, key) {
            return obj != null && _.hasOwnProperty.call(obj, key);
        }

        // Retrieve the names of an object's own properties.
        // Delegates to **ECMAScript 5**'s native `Object.keys`
        static keys(obj) {
            if (!_.isObject(obj)) return [];
            if (_.nativeKeys) return Object.keys(obj);
            var keys = [];
            for (var key in obj) if (_.has(obj, key)) keys.push(key);
            return keys;
        }

        // An internal function for creating assigner functions.
        private static createAssigner(keysFunc: (any) => any[], undefinedOnly?: Boolean, ...args: any[]) {
            return function(obj)  {
                var length = arguments.length;
                if (length < 2 || obj == null) return obj;
                for (var index = 1; index < length; index++) {
                    var source = arguments[index],
                        keys = keysFunc(source),
                        l = keys.length;
                    for (var i = 0; i < l; i++) {
                        var key = keys[i];
                        if (!undefinedOnly || obj[key] === void 0) obj[key] = source[key];
                    }
                }
                return obj;
            };
        }

        static sum<T, U>(arr: T[], func: (T) => number): number {
            if (arr && arr.length)
                return arr.reduce((result, elem) => result + (func(elem)), 0);
            return 0;
        }
        // Extend a given object with all the properties in passed-in object(s).
        static extend = (...args: any[]) => _.createAssigner(_.allKeys, null, args);

        static extendOwn = (...args: any[]) => _.createAssigner(_.keys, null, args);

        // Create a (shallow-cloned) duplicate of an object.
        static clone(obj) {
            if (!_.isObject(obj)) return obj;
            return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
        }

        // Internal function that returns an efficient (for current engines) version
        // of the passed-in callback, to be repeatedly applied in other Underscore
        // functions.
        private static optimizeCb(func, context, argCount?) {
            if (context === void 0) return func;
            switch (argCount == null ? 3 : argCount) {
            case 1:
                return value => func.call(context, value);
            case 2:
                return (value, other) => func.call(context, value, other);
            case 3:
                return (value, index, collection) => func.call(context, value, index, collection);
            case 4:
                return (accumulator, value, index, collection) => func.call(context, accumulator, value, index, collection);
            }
            return func.apply(context, arguments);
        }


        // Keep the identity function around for default iteratees.
        static identity(value) {
            return value;
        }

        // Optimize `isFunction` if appropriate. Work around some typeof bugs in old v8,
        // IE 11 (#1621), and in Safari 8 (#1929).
        //if (typeof /./ != 'function' && typeof Int8Array != 'object') {
        static isFunction(obj) {
            return typeof obj == 'function' || false;
        }

        // Returns whether an object has a given set of `key:value` pairs.
        static isMatch(object, attrs) {
            var keys = _.keys(attrs), length = keys.length;
            if (object == null) return !length;
            var obj = Object(object);
            for (var i = 0; i < length; i++) {
                var key = keys[i];
                if (attrs[key] !== obj[key] || !(key in obj)) return false;
            }
            return true;
        }

        // Returns a predicate for checking whether an object has a given set of 
        // `key:value` pairs.
        static matcher(attrs) {
            attrs = _.extendOwn({}, attrs);
            return obj => _.isMatch(obj, attrs);
        }

        static property(key) {
            return obj => (obj == null ? void 0 : obj[key]);
        }

        // A mostly-internal function to generate callbacks that can be applied
        // to each element in a collection, returning the desired result — either
        // identity, an arbitrary callback, a property matcher, or a property accessor.
        private static cb(value, context?, argCount?) {
            if (value == null) return _.identity;
            if (_.isFunction(value)) return this.optimizeCb(value, context, argCount);
            if (_.isObject(value)) return _.matcher(value);
            return _.property(value);
        }

        // Helper for collection methods to determine whether a collection
        // should be iterated as an array or as an object
        // Related: http://people.mozilla.org/~jorendorff/es6-draft.html#sec-tolength
        private static MAX_ARRAY_INDEX = Math.pow(2, 53) - 1;

        private static isArrayLike(collection) {
            var length = collection && collection.length;
            return typeof length == 'number' && length >= 0 && length <= _.MAX_ARRAY_INDEX;
        }

        // The cornerstone, an `each` implementation, aka `forEach`.
        // Handles raw objects in addition to array-likes. Treats all
        // sparse array-likes as if they were dense.
        static each(obj, iteratee, context?) {
            iteratee = _.optimizeCb(iteratee, context);
            var i, length;
            if (_.isArrayLike(obj)) {
                for (i = 0, length = obj.length; i < length; i++) {
                    iteratee(obj[i], i, obj);
                }
            } else {
                var keys = _.keys(obj);
                for (i = 0, length = keys.length; i < length; i++) {
                    iteratee(obj[keys[i]], keys[i], obj);
                }
            }
            return obj;
        }

        // Define a fallback version of the method in browsers (ahem, IE < 9), where
        // there isn't any inspectable "Arguments" type.
        private static isArguments(obj) {
            return _.has(obj, 'callee');
        }


        // Internal implementation of a recursive `flatten` function.
        private static flatten(input, shallow, strict, startIndex?) {
            var output = [], idx = 0;
            for (var i = startIndex || 0, length = input && input.length; i < length; i++) {
                var value = input[i];
                if (this.isArrayLike(value) && (_.isArray(value) || _.isArguments(value))) {
                    //flatten current level of array or arguments object
                    if (!shallow) value = this.flatten(value, shallow, strict);
                    var j = 0, len = value.length;
                    output.length += len;
                    while (j < len) {
                        output[idx++] = value[j++];
                    }
                } else if (!strict) {
                    output[idx++] = value;
                }
            }
            return output;
        }

        // Return all the elements that pass a truth test.
        // Aliased as `select`.
        static filter(obj, predicate, context?) {
            var results = [];
            predicate = this.cb(predicate, context);
            _.each(obj, (value, index, list) => {
                if (predicate(value, index, list)) results.push(value);
            });
            return results;
        }

        static select = _.filter;

        // Retrieve the values of an object's properties.
        static values(obj) {
            var keys = _.keys(obj);
            var length = keys.length;
            var values = Array(length);
            for (var i = 0; i < length; i++) {
                values[i] = obj[keys[i]];
            }
            return values;
        }


        // Use a comparator function to figure out the smallest index at which
        // an object should be inserted so as to maintain order. Uses binary search.
        static sortedIndex(array, obj, iteratee?, context?) {
            iteratee = this.cb(iteratee, context, 1);
            var value = iteratee(obj);
            var low = 0, high = array.length;
            while (low < high) {
                var mid = Math.floor((low + high) / 2);
                if (iteratee(array[mid]) < value) low = mid + 1;
                else high = mid;
            }
            return low;
        }

        // Generator function to create the findIndex and findLastIndex functions
        static createIndexFinder(dir) {
            return (array, predicate, context?) => {
                predicate = this.cb(predicate, context);
                var length = array != null && array.length;
                var index = dir > 0 ? 0 : length - 1;
                for (; index >= 0 && index < length; index += dir) {
                    if (predicate(array[index], index, array)) return index;
                }
                return -1;
            };
        }

        // Returns the first index on an array-like that passes a predicate test
        static findIndex = _.createIndexFinder(1);

        static isNumber(obj) {
            return toString.call(obj) === '[object Number]';
        }

        static isString(obj) {
            return toString.call(obj) === '[object String]';
        }

        // Is the given value `NaN`? (NaN is the only number which does not equal itself).
        static isNaN(obj) {
            return _.isNumber(obj) && obj !== +obj;
        }

        // Return the position of the first occurrence of an item in an array,
        // or -1 if the item is not included in the array.
        // If the array is large and already in sort order, pass `true`
        // for **isSorted** to use binary search.
        static indexOf(array, item, isSorted?) {
            var i = 0, length = array && array.length;
            if (typeof isSorted == 'number') {
                i = isSorted < 0 ? Math.max(0, length + isSorted) : isSorted;
            } else if (isSorted && length) {
                i = this.sortedIndex(array, item);
                return array[i] === item ? i : -1;
            }
            // ReSharper disable once SimilarExpressionsComparison
            if (item !== item) {
                return _.findIndex(array.slice(i), _.isNaN);
            }
            for (; i < length; i++) if (array[i] === item) return i;
            return -1;
        }

        // Determine if the array or object contains a given value (using `===`).
        // Aliased as `includes` and `include`.
        static contains(obj, target) {
            if (!this.isArrayLike(obj)) obj = _.values(obj);
            return _.indexOf(obj, target) >= 0;
        }

        static includes = _.contains;
        static include = _.contains;

        // Take the difference between one array and a number of other arrays.
        // Only the elements present in just the first array will remain.
        static difference(...args: any[]) {
            var rest = this.flatten(arguments, true, true, 1);
            return _.filter(args, value => (!_.contains(rest, value)));
        }

        // Returns the first key on an object that passes a predicate test
        static findKey(obj, predicate, context) {
            predicate = this.cb(predicate, context);
            var keys = _.keys(obj), key;
            for (var i = 0, length = keys.length; i < length; i++) {
                key = keys[i];
                if (predicate(obj[key], key, obj)) return key;
            }
            return null;
        }

        // Return the first value which passes a truth test. Aliased as `detect`.
        static find<T>(list: T[], predicate: (T) => boolean) : T {
            var length = list.length >>> 0;
            for (var i = 0; i < length; i++) {
                var value = list[i];
                if (predicate(value)) {
                    return value;
                }
            }
            return undefined;
        }

        static detect = _.find;

        // Return the number of elements in an object.
        static size(obj) {
            if (obj == null) return 0;
            return this.isArrayLike(obj) ? obj.length : _.keys(obj).length;
        }

        // Returns a negated version of the passed-in predicate.
        static negate(predicate) {
            return function() {return !predicate.apply(null, arguments)};
        }

        // Return all the elements for which a truth test fails.
        static reject(obj, predicate, context?) {
            return _.filter(obj, _.negate(this.cb(predicate)), context);
        }

        // Internal recursive comparison function for `isEqual`.
        private static eq(a, b, aStack?, bStack?) {
            // Identical objects are equal. `0 === -0`, but they aren't identical.
            // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
            if (a === b) return a !== 0 || 1 / a === 1 / b;
            // A strict comparison is necessary because `null == undefined`.
            if (a == null || b == null) return a === b;
            // Compare `[[Class]]` names.
            var className = toString.call(a);
            if (className !== toString.call(b)) return false;
            switch (className) {
                // Strings, numbers, regular expressions, dates, and booleans are compared by value.
            case '[object RegExp]':
            // RegExps are coerced to strings for comparison (Note: '' + /a/i === '/a/i')
            case '[object String]':
                // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
                // equivalent to `new String("5")`.
                return '' + a === '' + b;
            case '[object Number]':
                // `NaN`s are equivalent, but non-reflexive.
                // Object(NaN) is equivalent to NaN
                // ReSharper disable SimilarExpressionsComparison
                if (+a !== +a)
                    return +b !== +b;
                // ReSharper restore SimilarExpressionsComparison
                // An `egal` comparison is performed for other numeric values.
                return +a === 0 ? 1 / +a === 1 / b : +a === +b;
            case '[object Date]':
            case '[object Boolean]':
                // Coerce dates and booleans to numeric primitive values. Dates are compared by their
                // millisecond representations. Note that invalid dates with millisecond representations
                // of `NaN` are not equivalent.
                return +a === +b;
            }

            var areArrays = className === '[object Array]';
            if (!areArrays) {
                if (typeof a != 'object' || typeof b != 'object') return false;

                // Objects with different constructors are not equivalent, but `Object`s or `Array`s
                // from different frames are.
                var aCtor = a.constructor, bCtor = b.constructor;
                if (aCtor !== bCtor && !(_.isFunction(aCtor) && aCtor instanceof aCtor &&
                        _.isFunction(bCtor) && bCtor instanceof bCtor)
                    && ('constructor' in a && 'constructor' in b)) {
                    return false;
                }
            }
            // Assume equality for cyclic structures. The algorithm for detecting cyclic
            // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.

            // Initializing stack of traversed objects.
            // It's done here since we only need them for objects and arrays comparison.
            aStack = aStack || [];
            bStack = bStack || [];
            var length = aStack.length;
            while (length--) {
                // Linear search. Performance is inversely proportional to the number of
                // unique nested structures.
                if (aStack[length] === a) return bStack[length] === b;
            }

            // Add the first object to the stack of traversed objects.
            aStack.push(a);
            bStack.push(b);

            // Recursively compare objects and arrays.
            if (areArrays) {
                // Compare array lengths to determine if a deep comparison is necessary.
                length = a.length;
                if (length !== b.length) return false;
                // Deep compare the contents, ignoring non-numeric properties.
                while (length--) {
                    if (!this.eq(a[length], b[length], aStack, bStack)) return false;
                }
            } else {
                // Deep compare objects.
                var keys = _.keys(a), key;
                length = keys.length;
                // Ensure that both objects contain the same number of properties before comparing deep equality.
                if (_.keys(b).length !== length) return false;
                while (length--) {
                    // Deep compare each member
                    key = keys[length];
                    if (!(_.has(b, key) && this.eq(a[key], b[key], aStack, bStack))) return false;
                }
            }
            // Remove the first object from the stack of traversed objects.
            aStack.pop();
            bStack.pop();
            return true;
        }

        // Perform a deep comparison to check if two objects are equal.
        static isEqual(a, b): boolean {
            return _.eq(a, b);
        }

        // Create a reducing function iterating left or right.
        private static createReduce(dir) {
            // Optimized iterator function as using arguments.length
            // in the main function will deoptimize the, see #1991.
            function iterator(obj, iteratee, memo, keys, index, length) {
                for (; index >= 0 && index < length; index += dir) {
                    var currentKey = keys ? keys[index] : index;
                    memo = iteratee(memo, obj[currentKey], currentKey, obj);
                }
                return memo;
            }

            return function(obj, iteratee, memo, context?) {
                iteratee = this.optimizeCb(iteratee, context, 4);
                var keys = !this.isArrayLike(obj) && _.keys(obj),
                    length = (keys || obj).length,
                    index = dir > 0 ? 0 : length - 1;
                // Determine the initial value if none is provided.
                if (arguments.length < 3) {
                    memo = obj[keys ? keys[index] : index];
                    index += dir;
                }
                return iterator(obj, iteratee, memo, keys, index, length);
            };
        }

        // **Reduce** builds up a single result from a list of values, aka `inject`,
        // or `foldl`.
        static reduce = _.createReduce(1);
        static foldl = _.reduce;
        static inject = _.reduce;

        // Return a version of the array that does not contain the specified value(s).
        static without<T>(array: T[], ...args: T[]) {
            return _.difference(array, _.slice.call(arguments, 1));
        }

        // Determine whether all of the elements match a truth test.
        // Aliased as `all`.
        static every(obj, predicate, context?) {
            predicate = this.cb(predicate, context);
            var keys = !this.isArrayLike(obj) && _.keys(obj),
                length = (keys || obj).length;
            for (var index = 0; index < length; index++) {
                var currentKey = keys ? keys[index] : index;
                if (!predicate(obj[currentKey], currentKey, obj)) return false;
            }
            return true;
        }

        static all = _.every;

        // Return the maximum element (or element-based computation).
        static max<T>(obj: T[], iteratee?, context?): T {
            var result: T = null,
                lastComputed = -Infinity,
                value,
                computed;
            if (iteratee == null && obj != null) {
                obj = _.isArrayLike(obj) ? obj : _.values(obj);
                for (var i = 0, length = obj.length; i < length; i++) {
                    value = obj[i];
                    if (!result || value > result) {
                        result = value;
                    }
                }
            } else {
                iteratee = this.cb(iteratee, context);
                _.each(obj, (value, index, list) => {
                    computed = iteratee(value, index, list);
                    if (computed > lastComputed || computed === -Infinity && result == null) {
                        result = value;
                        lastComputed = computed;
                    }
                });
            }
            return result;
        }

        // Return the minimum element (or element-based computation).
        static min<T>(obj: T[], iteratee?, context?) : T {
            var result: T = null,
                lastComputed = Infinity,
                value,
                computed;
            if (iteratee == null && obj != null) {
                obj = this.isArrayLike(obj) ? obj : _.values(obj);
                for (var i = 0, length = obj.length; i < length; i++) {
                    value = obj[i];
                    if (!result|| value < result) {
                        result = value;
                    }
                }
            } else {
                iteratee = this.cb(iteratee, context);
                _.each(obj, (value, index, list) => {
                    computed = iteratee(value, index, list);
                    if (computed < lastComputed || computed === Infinity && result === null) {
                        result = value;
                        lastComputed = computed;
                    }
                });
            }
            return result;
        }

        // Return the results of applying the iteratee to each element.
        static map(obj, iteratee?, context?) {
            iteratee = this.cb(iteratee, context);
            var keys = !this.isArrayLike(obj) && _.keys(obj),
                length = (keys || obj).length,
                results = Array(length);
            for (var index = 0; index < length; index++) {
                var currentKey = keys ? keys[index] : index;
                results[index] = iteratee(obj[currentKey], currentKey, obj);
            }
            return results;
        }

        static collect = _.map;

        // Is a given array, string, or object empty?
        // An "empty" object has no enumerable own-properties.
        static isEmpty(obj) {
            if (obj == null) return true;
            if (_.isArrayLike(obj) && (_.isArray(obj) || _.isString(obj) || _.isArguments(obj))) return obj.length === 0;
            return _.keys(obj).length === 0;
        }

        // Return a copy of the object only containing the whitelisted properties.
        static pickBy(obj, iteratee: Function, context?) {
            var result = {};
            var key;
            if (obj == null) return result;
            var i: number;
            var keys: any[];
            iteratee = this.optimizeCb(iteratee, context);
            keys = _.allKeys(obj);
            for (i = 0; i < keys.length; i++) {
                key = keys[i];
                var value = obj[key];
                if (iteratee(value, key, obj)) result[key] = value;
            }
            return result;
        }
        
        static pick(obj, ...args: any[]) {
            var result = {};
            var key;
            if (obj == null) return result;
            var i: number;
            var keys: any[];
            keys = this.flatten(arguments, false, false, 1);
            obj = new Object(obj);
            var length = keys.length;
            for (i = 0; i < length; i++) {
                key = keys[i];
                if (key in obj) result[key] = obj[key];
            }
            return result;
        }

        // Sort the object's values by a criterion produced by an iteratee.
        static sortBy(obj, iteratee, context?) {
            iteratee = this.cb(iteratee, context);
            return _.pluck(_.map(obj, (value, index, list) => {
                return {
                    value: value,
                    index: index,
                    criteria: iteratee(value, index, list)
                };
            }).sort((left, right) => {
                var a = left.criteria;
                var b = right.criteria;
                if (a !== b) {
                    if (a > b || a === void 0) return 1;
                    if (a < b || b === void 0) return -1;
                }
                return left.index - right.index;
            }), 'value');
        }


        // Convenience version of a common use case of `map`: fetching a property.
        static pluck(obj, key) {
            return _.map(obj, _.property(key));
        }
    }
}
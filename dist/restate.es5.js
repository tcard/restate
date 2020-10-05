var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
var Map = /** @class */ (function () {
    function Map() {
        this._entries = [];
    }
    Map.prototype.set = function (key, value) {
        this._entries.splice(0, 0, [key, value]);
    };
    Map.prototype.get = function (key) {
        return (this._entries.filter(function (_a) {
            var k = _a[0];
            return k === key;
        })[0] || [])[1];
    };
    Map.prototype.forEach = function (callback) {
        var _this = this;
        this._entries.forEach(function (_a) {
            var k = _a[0], v = _a[1];
            return callback(v, k, _this);
        });
    };
    return Map;
}());
// # Restate
// ## The Restate function
// `Restate` is the only variable exported by the library. It takes the DOM
// element on which to put the DOM Restate produces, and the root of the 
// state tree with its present function.
var Restate = (function () {
    // From here on, it's all implementation details. Maybe some day it will be
    // commented too!
    var _a = Element.prototype, setAttribute = _a.setAttribute, removeAttribute = _a.removeAttribute, appendChild = _a.appendChild, removeChild = _a.removeChild, replaceChild = _a.replaceChild, insertBefore = _a.insertBefore;
    var createElement = document.createElement, createTextNode = document.createTextNode;
    // `onDOMOperation` may be a function to be notified about the DOM operations
    // the library performs. Useful for testing.
    //
    // We rely on minifiers to get rid of the overhead in case it's `null`, by
    // removing the whole `if` block.
    var onDOMOperation = null;
    if (onDOMOperation) {
        setAttribute = function (name, value) {
            onDOMOperation({
                type: 'setAttribute',
                element: this,
                name: name,
                value: value
            });
            return this.setAttribute(name, value);
        };
        removeAttribute = function (name) {
            onDOMOperation({
                type: 'removeAttribute',
                element: this,
                name: name
            });
            this.removeAttribute(name);
        };
        appendChild = function (child) {
            onDOMOperation({
                type: 'appendChild',
                parent: this,
                child: child
            });
            return this.appendChild(child);
        };
        removeChild = function (child) {
            onDOMOperation({
                type: 'removeChild',
                parent: this,
                child: child
            });
            return this.removeChild(child);
        };
        replaceChild = function (newChild, oldChild) {
            onDOMOperation({
                type: 'replaceChild',
                parent: this,
                newChild: newChild,
                oldChild: oldChild
            });
            return this.replaceChild(newChild, oldChild);
        };
        insertBefore = function (newChild, refChild) {
            onDOMOperation({
                type: 'insertBefore',
                parent: this,
                newChild: newChild,
                refChild: refChild
            });
            return this.insertBefore(newChild, refChild);
        };
        createElement = function (tagName) {
            var e = this.createElement(tagName);
            onDOMOperation({
                type: 'createElement',
                element: e
            });
            return e;
        };
        createTextNode = function (text) {
            var node = this.createTextNode(text);
            onDOMOperation({
                type: 'createTextNode',
                node: node
            });
            return node;
        };
    }
    function realizeAttr(e, name, value) {
        if (typeof value !== 'string') {
            e[name] = value;
        }
        else if (value) {
            setAttribute.call(e, name, value);
            if (name === 'value') {
                // value isn't just an attribute, but a field in the underlying
                // node object that isn't set when the attribute is set.
                e.value = value;
            }
        }
        else {
            removeAttribute.call(e, name);
        }
    }
    ;
    function realizeDOM(virtual) {
        if (!(virtual instanceof Array)) {
            return createTextNode.call(document, virtual.toString());
        }
        var tagName = virtual[0], attrs = virtual[1], children = virtual[2];
        var e = createElement.call(document, tagName);
        for (var attr in attrs) {
            realizeAttr(e, attr, attrs[attr]);
        }
        children.forEach(function (child) {
            appendChild.call(e, realizeDOM(child));
        });
        return e;
    }
    ;
    return function (rootElement, rootState, present) {
        var presentArgs = [];
        for (var _i = 3; _i < arguments.length; _i++) {
            presentArgs[_i - 3] = arguments[_i];
        }
        while (rootElement.firstChild) {
            removeChild.call(rootElement, rootElement.firstChild);
        }
        // Here's where the magic happens, mostly.
        var updateDOM = function (parent, e, oldDOM, newDOM) {
            if (oldDOM === newDOM) {
            }
            else if (newDOM === undefined) {
                // Nothing at new DOM; remove the old real DOM node from its parent.
                removeChild.call(parent, e);
            }
            else if (oldDOM === undefined) {
                // New node; just append it, as we know pos will be the last
                // one, given there's no corresponding node in the old DOM.
                appendChild.call(parent, realizeDOM(newDOM));
            }
            else if (!(newDOM instanceof Array)) {
                // New text node.
                if (oldDOM != newDOM) {
                    // Only replace if contents changed.
                    replaceChild.call(parent, realizeDOM(newDOM), e);
                }
            }
            else {
                var _a = oldDOM, oldTag = _a[0], oldAttrs_1 = _a[1], oldChildren_1 = _a[2];
                var _b = newDOM, newTag = _b[0], newAttrs_1 = _b[1], newChildren = _b[2];
                if (oldTag != newTag) {
                    // If tags differ, throw old away.
                    replaceChild.call(parent, realizeDOM(newDOM), e);
                    return;
                }
                // ### Attributes reconciliation
                var newKeys = Object.keys(newAttrs_1);
                newKeys.sort();
                var i_1 = 0;
                var oldKeys_1 = Object.keys(oldAttrs_1);
                oldKeys_1.sort();
                newKeys.concat([undefined]).forEach(function (newK) {
                    while (i_1 <= oldKeys_1.length) { // Will yield past the array, so last oldVal will be undefined.
                        var oldK = oldKeys_1[i_1];
                        var oldVal = oldAttrs_1[oldK];
                        var newVal = newAttrs_1[newK /* undefined yields undefined value, so it's fine */];
                        if (oldK == newK) {
                            if (oldVal != newVal) {
                                realizeAttr(e, newK, newVal);
                            }
                            i_1++;
                            return; // Advance both.
                        }
                        if (newK === undefined || newK > oldK) {
                            // Got deleted.
                            realizeAttr(e, oldK, null);
                            i_1++;
                            continue; // Advance oldK.
                        }
                        // Got added.
                        realizeAttr(e, newK, newVal);
                        return; // Advance newK.
                    }
                });
                // ### Children reconciliation
                // Here's the gist of it: since we memoize Markups, and only Markups
                // associated with state that changed gets regenerated, we can just
                // assume the same child still has _the same Markup object_, even
                // if the child got reordered with respect to its parent, and just
                // use identity comparison to find its corresponding DOM node.
                var newPositions_1 = new Map();
                newChildren.forEach(function (c, newPos) {
                    newPositions_1.set(c, newPos);
                });
                var swaps_1 = new Map();
                oldChildren_1.forEach(function (c, oldPos) {
                    var swapped = swaps_1.get(oldPos);
                    if (swapped !== undefined) {
                        oldPos = swapped;
                    }
                    var newPos = newPositions_1.get(c);
                    if (newPos === undefined || newPos === oldPos || newPos >= oldChildren_1.length) {
                        return;
                    }
                    swaps_1.set(newPos, oldPos);
                });
                swaps_1.forEach(function (l, r) {
                    if (l > r) {
                        var tmp_1 = l;
                        r = l;
                        l = tmp_1;
                    }
                    var tmp = oldChildren_1[l];
                    oldChildren_1[l] = oldChildren_1[r];
                    oldChildren_1[r] = tmp;
                    var lNode = e.childNodes[l];
                    var rNode = e.childNodes[r];
                    var rNext = rNode.nextSibling;
                    insertBefore.call(e, rNode, lNode);
                    insertBefore.call(e, lNode, rNext);
                });
                var realChildren_1 = [];
                Array.prototype.forEach.call(e.childNodes, function (v) { return realChildren_1.push(v); });
                for (var i_2 = 0; i_2 < Math.max(newChildren.length, oldChildren_1.length); i_2++) {
                    updateDOM(e, realChildren_1[i_2], oldChildren_1[i_2], newChildren[i_2]);
                }
            }
        };
        var updateRootElement = (function () {
            var currentDOM;
            return function (newDOM) {
                updateDOM(rootElement, rootElement.childNodes[0], currentDOM, newDOM);
                currentDOM = newDOM;
            };
        })();
        function cachedMarkupsForKey(markups) {
            return markups;
        }
        var rootCachedMarkup = {};
        var makeCursor = function (state, path, cachedMarkup, updatingPath, root, parent) {
            var updatingKey = updatingPath[0], nextUpdatingPath = updatingPath.slice(1);
            if (updatingPath.length == 1) {
                // We've reached the end of the updating cursor. Subtree
                // shouldn't use saved DOMs anymore, as they may change.
                cachedMarkup = {};
            }
            cachedMarkup.children = cachedMarkup.children || (state instanceof Array ? [] : {});
            var cursor = {
                parent: parent || null,
                root: root,
                child: function (key) {
                    if (state === undefined) {
                        return null;
                    }
                    var markupChildren = cachedMarkupsForKey(cachedMarkup.children);
                    var markupChild = markupChildren[key];
                    if (markupChild === undefined) {
                        markupChild = {};
                        markupChildren[key] = markupChild;
                    }
                    return makeCursor(state[key], __spreadArrays(path, [key]), markupChild, 
                    // Only pass nextUpdatingPath is the child is in the
                    // updating path.
                    key === updatingKey ? nextUpdatingPath : [], root, cursor);
                },
                state: state,
                set: function (newState) {
                    var updating = rootState;
                    path.forEach(function (k, i) {
                        if (i == path.length - 1) {
                            updating[k] = newState;
                        }
                        else {
                            updating = updating[k];
                        }
                    });
                    updateRootElement(present.apply(void 0, __spreadArrays([makeCursor(rootState, [], rootCachedMarkup, path)], presentArgs)));
                },
                present: function (present) {
                    var args = [];
                    for (var _i = 1; _i < arguments.length; _i++) {
                        args[_i - 1] = arguments[_i];
                    }
                    var cached = cachedMarkup.cached;
                    if (cached !== undefined && cached[0] === present && args.filter(function (v, i) { return cached[1][i] !== v; }).length == 0) {
                        return cached[2];
                    }
                    return present.apply(void 0, __spreadArrays([cursor], args));
                }
            };
            if (root === undefined) {
                cursor.root = cursor;
                root = cursor;
            }
            return cursor;
        };
        updateRootElement(present(makeCursor(rootState, [], rootCachedMarkup, [])));
    };
})();
//# sourceMappingURL=restate.es5.js.map
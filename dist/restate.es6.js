// # Restate
// ## The Restate function
// `Restate` is the only variable exported by the library. It takes the DOM
// element on which to put the DOM Restate produces, and the root of the 
// state tree with its present function.
const Restate = (() => {
    // From here on, it's all implementation details. Maybe some day it will be
    // commented too!
    let { setAttribute, removeAttribute, appendChild, removeChild, replaceChild, insertBefore } = Element.prototype;
    let { createElement, createTextNode } = document;
    // `onDOMOperation` may be a function to be notified about the DOM operations
    // the library performs. Useful for testing.
    //
    // We rely on minifiers to get rid of the overhead in case it's `null`, by
    // removing the whole `if` block.
    let onDOMOperation = null;
    if (onDOMOperation) {
        setAttribute = function (name, value) {
            onDOMOperation({
                type: 'setAttribute',
                element: this,
                name: name,
                value: value,
            });
            return this.setAttribute(name, value);
        };
        removeAttribute = function (name) {
            onDOMOperation({
                type: 'removeAttribute',
                element: this,
                name: name,
            });
            this.removeAttribute(name);
        };
        appendChild = function (child) {
            onDOMOperation({
                type: 'appendChild',
                parent: this,
                child: child,
            });
            return this.appendChild(child);
        };
        removeChild = function (child) {
            onDOMOperation({
                type: 'removeChild',
                parent: this,
                child: child,
            });
            return this.removeChild(child);
        };
        replaceChild = function (newChild, oldChild) {
            onDOMOperation({
                type: 'replaceChild',
                parent: this,
                newChild: newChild,
                oldChild: oldChild,
            });
            return this.replaceChild(newChild, oldChild);
        };
        insertBefore = function (newChild, refChild) {
            onDOMOperation({
                type: 'insertBefore',
                parent: this,
                newChild: newChild,
                refChild: refChild,
            });
            return this.insertBefore(newChild, refChild);
        };
        createElement = function (tagName) {
            let e = this.createElement(tagName);
            onDOMOperation({
                type: 'createElement',
                element: e,
            });
            return e;
        };
        createTextNode = function (text) {
            let node = this.createTextNode(text);
            onDOMOperation({
                type: 'createTextNode',
                node: node,
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
        let [tagName, attrs, children] = virtual;
        let e = createElement.call(document, tagName);
        for (let attr in attrs) {
            realizeAttr(e, attr, attrs[attr]);
        }
        children.forEach((child) => {
            appendChild.call(e, realizeDOM(child));
        });
        return e;
    }
    ;
    return (rootElement, rootState, present, ...presentArgs) => {
        while (rootElement.firstChild) {
            removeChild.call(rootElement, rootElement.firstChild);
        }
        // Here's where the magic happens, mostly.
        let updateDOM = (parent, e, oldDOM, newDOM) => {
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
                let [oldTag, oldAttrs, oldChildren] = oldDOM;
                let [newTag, newAttrs, newChildren] = newDOM;
                if (oldTag != newTag) {
                    // If tags differ, throw old away.
                    replaceChild.call(parent, realizeDOM(newDOM), e);
                    return;
                }
                // ### Attributes reconciliation
                let newKeys = Object.keys(newAttrs);
                newKeys.sort();
                let i = 0;
                let oldKeys = Object.keys(oldAttrs);
                oldKeys.sort();
                newKeys.concat([undefined]).forEach((newK) => {
                    while (i <= oldKeys.length) { // Will yield past the array, so last oldVal will be undefined.
                        let oldK = oldKeys[i];
                        let oldVal = oldAttrs[oldK];
                        let newVal = newAttrs[newK /* undefined yields undefined value, so it's fine */];
                        if (oldK == newK) {
                            if (oldVal != newVal) {
                                realizeAttr(e, newK, newVal);
                            }
                            i++;
                            return; // Advance both.
                        }
                        if (newK === undefined || newK > oldK) {
                            // Got deleted.
                            realizeAttr(e, oldK, null);
                            i++;
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
                let newPositions = new Map();
                newChildren.forEach((c, newPos) => {
                    newPositions.set(c, newPos);
                });
                let swaps = new Map();
                oldChildren.forEach((c, oldPos) => {
                    let swapped = swaps.get(oldPos);
                    if (swapped !== undefined) {
                        oldPos = swapped;
                    }
                    let newPos = newPositions.get(c);
                    if (newPos === undefined || newPos === oldPos || newPos >= oldChildren.length) {
                        return;
                    }
                    swaps.set(newPos, oldPos);
                });
                swaps.forEach((l, r) => {
                    if (l > r) {
                        let tmp = l;
                        r = l;
                        l = tmp;
                    }
                    let tmp = oldChildren[l];
                    oldChildren[l] = oldChildren[r];
                    oldChildren[r] = tmp;
                    let lNode = e.childNodes[l];
                    let rNode = e.childNodes[r];
                    let rNext = rNode.nextSibling;
                    insertBefore.call(e, rNode, lNode);
                    insertBefore.call(e, lNode, rNext);
                });
                let realChildren = [];
                Array.prototype.forEach.call(e.childNodes, v => realChildren.push(v));
                for (let i = 0; i < Math.max(newChildren.length, oldChildren.length); i++) {
                    updateDOM(e, realChildren[i], oldChildren[i], newChildren[i]);
                }
            }
        };
        const updateRootElement = (() => {
            let currentDOM;
            return (newDOM) => {
                updateDOM(rootElement, rootElement.childNodes[0], currentDOM, newDOM);
                currentDOM = newDOM;
            };
        })();
        function cachedMarkupsForKey(markups) {
            return markups;
        }
        let rootCachedMarkup = {};
        const makeCursor = (state, path, cachedMarkup, updatingPath, root, parent) => {
            let [updatingKey, ...nextUpdatingPath] = updatingPath;
            if (updatingPath.length == 1) {
                // We've reached the end of the updating cursor. Subtree
                // shouldn't use saved DOMs anymore, as they may change.
                cachedMarkup = {};
            }
            cachedMarkup.children = cachedMarkup.children || (state instanceof Array ? [] : {});
            let cursor = {
                parent: parent || null,
                root: root,
                child: (key) => {
                    if (state === undefined) {
                        return null;
                    }
                    let markupChildren = cachedMarkupsForKey(cachedMarkup.children);
                    let markupChild = markupChildren[key];
                    if (markupChild === undefined) {
                        markupChild = {};
                        markupChildren[key] = markupChild;
                    }
                    return makeCursor(state[key], [...path, key], markupChild, 
                    // Only pass nextUpdatingPath is the child is in the
                    // updating path.
                    key === updatingKey ? nextUpdatingPath : [], root, cursor);
                },
                state: state,
                set: (newState) => {
                    let updating = rootState;
                    if (path.length == 0) {
                        rootState = newState;
                    }
                    else {
                        path.forEach((k, i) => {
                            if (i == path.length - 1) {
                                updating[k] = newState;
                            }
                            else {
                                updating = updating[k];
                            }
                        });
                    }
                    updateRootElement(present(makeCursor(rootState, [], rootCachedMarkup, path), ...presentArgs));
                },
                present: (present, ...args) => {
                    let cached = cachedMarkup.cached;
                    if (cached !== undefined && cached[0] === present && args.filter((v, i) => cached[1][i] !== v).length == 0) {
                        return cached[2];
                    }
                    return present(cursor, ...args);
                },
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
//# sourceMappingURL=restate.es6.js.map
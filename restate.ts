// # Restate

// **Restate** is a ~1 KB gzipped, virtual DOM-based, React-inspired, reasonably
// performant JavaScript library for building interactive HTML.
//
// In Restate, you pass a value representing your application's **state** and a
// function to **present** it as HTML (or, more generally, as DOM objects).
// Restate will then call your present function any time the state changes to
// get the new HTML it corresponds to.
//
// Similarly to Elm and Redux, there's a **single state value** and a **pure
// HTML-producing function**; state mutation is more like React's. Compared to
// other libraries, it **doesn't need keys, reified actions nor immutable data
// structures** to achieve similar optimizations in most cases.
//
// This is its commented source code. [See examples and get the library on
// GitHub!](https://github.com/tcard/restate)
//
// ### ⚠️ Caution: not anywhere near production-ready
//
// This is all just an experiment. I haven't even used it that much. It may be
// broken, maybe irremediably so. 

// ## The state tree

// Typically, your state will be a tree: either an object or an array with
// other objects and arrays inside. If only some parts of your state change,
// Restate is smart enough to **only generate HTML for the parts that changed**,
// if you help a bit.

// ## Present

// A **present function** turns a **node from the state** tree into markup
// (typically, **HTML**). It may also take additional arguments.
//
// You'll want to make one of these for each node in your state tree. This way,
// Restate **will remember the Markup** each of these produced and, when
// refreshing the page's markup, **only call those whose state node and
// arguments changed**.
//
// A Present function should always **produce the same Markup given the same
// state and arguments** for this optimization to work.
type Present = (
    cursor: Cursor,
    ...args: any[]
) => Markup;

// Markup represents a DOM node as a tuple.
type Markup = 
    // it's either an element...
    Elem
    // ... or a text node.
    | {toString: () => string}
;

// Elem is a representation of a DOM element.
type Elem = [
    // It has a tag name: `p`, `div`, `a`, etc.
    string,
    // It has attributes, like: `{href: 'http://example.com', class: 'example'}`
    Dict<string | Function>,
    // And it has children.
    [Markup]
];

// Dict is an alias for an object with arbitrary keys.
type Dict<T> = {[key: string]: T};

// ## State cursor

// A present function is handed a **cursor** that points to a **node in the
// state tree**.
//
// From this cursor, it can **walk the tree**, getting cursor for parent and
// child nodes.
//
// A present function will typically **call `child`** to get a cursor for a
// child node from the state tree, and **then `present`** to include the child's
// HTML into its own.
//
// By **calling `set`, a new presentation is triggered** and new HTML to replace
// the old one is generated by the present functions. **Only the cursor's
// associated state tree node and its children** are assumed to have possibly
// changed; other nodes are assumed unchanged. This way, Restate can **avoid
// redundant calls** to present functions by **reusing parts of the old HTML**
// instead.
type Cursor = {
    parent: Cursor | null;
    root: Cursor;
    child: (key: StateKey) => Cursor | null;

    state: any;
    set: (newState: any) => void;

    present: (present: Present, ...presentArgs: any[]) => void;
};

type StateKey = string | number;

// ## The Restate function

// `Restate` is the only variable exported by the library. It takes the DOM
// element on which to put the DOM Restate produces, and the root of the 
// state tree with its present function.
const Restate: (
    rootElement: Element,
    rootState: any,
    present: Present,
    ...presentArgs: any[]
) => void = (() => {

// From here on, it's all implementation details. Maybe some day it will be
// commented too!

let { setAttribute, removeAttribute, appendChild, removeChild, replaceChild, insertBefore } = Element.prototype;
let { createElement, createTextNode } = document;


// `onDOMOperation` may be a function to be notified about the DOM operations
// the library performs. Useful for testing.
//
// We rely on minifiers to get rid of the overhead in case it's `null`, by
// removing the whole `if` block.
let onDOMOperation: ((operation: any) => void) | null = null;
if (onDOMOperation) {
    setAttribute = function(this: any, name: string, value: any) {
        onDOMOperation!({
            type: 'setAttribute',
            element: this,
            name: name,
            value: value,
        });
        return this.setAttribute(name, value);
    };

    removeAttribute = function(this: any, name: string) {
        onDOMOperation!({
            type: 'removeAttribute',
            element: this,
            name: name,
        });
        this.removeAttribute(name);
    };

    appendChild = function(this: any, child: Node) {
        onDOMOperation!({
            type: 'appendChild',
            parent: this,
            child: child,
        });
        return this.appendChild(child);
    };

    removeChild = function(this: any, child: Node) {
        onDOMOperation!({
            type: 'removeChild',
            parent: this,
            child: child,
        });
        return this.removeChild(child);
    };

    replaceChild = function(this: any, newChild: Node, oldChild: Node) {
        onDOMOperation!({
            type: 'replaceChild',
            parent: this,
            newChild: newChild,
            oldChild: oldChild,
        });
        return this.replaceChild(newChild, oldChild);
    };

    insertBefore = function(this: any, newChild: Node, refChild: Node) {
        onDOMOperation!({
            type: 'insertBefore',
            parent: this,
            newChild: newChild,
            refChild: refChild,
        });
        return this.insertBefore(newChild, refChild);
    };

    createElement = function(this: any, tagName: string) {
        let e = this.createElement(tagName);
        onDOMOperation!({
            type: 'createElement',
            element: e,
        });
        return e;
    };

    createTextNode = function(this: any, text: string) {
        let node = this.createTextNode(text);
        onDOMOperation!({
            type: 'createTextNode',
            node: node,
        });
        return node;
    };
}

function realizeAttr(e: Element, name: string, value: string | Function | null) {
    if (typeof value !== 'string') {
        (e as Dict<any>)[name] = value;
    } else if (value) {
        setAttribute.call(e, name, value);
        if (name === 'value') {
            // value isn't just an attribute, but a field in the underlying
            // node object that isn't set when the attribute is set.
            (e as any).value = value;
        }
    } else {
        removeAttribute.call(e, name);
    }
};

function realizeDOM(virtual: Markup): Node {
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
};

return (
    rootElement: Element,
    rootState: any,
    present: Present,
    ...presentArgs: any[]
): void => {
    while (rootElement.firstChild) { 
        removeChild.call(rootElement, rootElement.firstChild);
    }

    // Here's where the magic happens, mostly.
    let updateDOM = (
        parent: Node,
        e: Node,
        oldDOM?: Markup,
        newDOM?: Markup,
    ): void => {
        if (oldDOM === newDOM) {
        } else if (newDOM === undefined) {
            // Nothing at new DOM; remove the old real DOM node from its parent.
            removeChild.call(parent, e);
        } else if (oldDOM === undefined) {
            // New node; just append it, as we know pos will be the last
            // one, given there's no corresponding node in the old DOM.
            appendChild.call(parent, realizeDOM(newDOM));
        } else if (!(newDOM instanceof Array)) {
            // New text node.
            if (oldDOM != newDOM) {
                // Only replace if contents changed.
                replaceChild.call(parent, realizeDOM(newDOM), e);
            }
        } else {
            let [ oldTag, oldAttrs, oldChildren ] = oldDOM as Elem;
            let [ newTag, newAttrs, newChildren ] = newDOM as Elem;
            if (oldTag != newTag) {
                // If tags differ, throw old away.
                replaceChild.call(parent, realizeDOM(newDOM), e);
                return;
            }

            // ### Attributes reconciliation

            let newKeys: (string | undefined)[] = Object.keys(newAttrs);
            newKeys.sort();
            let i = 0;
            let oldKeys = Object.keys(oldAttrs);
            oldKeys.sort();

            newKeys.concat([undefined]).forEach((newK) => {
                while (i <= oldKeys.length) { // Will yield past the array, so last oldVal will be undefined.
                    let oldK = oldKeys[i];
                    let oldVal = oldAttrs[oldK];
                    let newVal = newAttrs[newK as string /* undefined yields undefined value, so it's fine */];

                    if (oldK == newK) {
                        if (oldVal != newVal) {
                            realizeAttr(e as Element, newK, newVal);
                        }
                        i++; return; // Advance both.
                    }

                    if (newK === undefined || newK > oldK) {
                        // Got deleted.
                        realizeAttr(e as Element, oldK, null);
                        i++; continue; // Advance oldK.
                    }

                    // Got added.
                    realizeAttr(e as Element, newK, newVal);
                    return; // Advance newK.
                }
            });

            // ### Children reconciliation

            // Here's the gist of it: since we memoize Markups, and only Markups
            // associated with state that changed gets regenerated, we can just
            // assume the same child still has _the same Markup object_, even
            // if the child got reordered with respect to its parent, and just
            // use identity comparison to find its corresponding DOM node.
            let newPositions = new Map<Markup, number>();
            newChildren.forEach((c, newPos) => {
                newPositions.set(c, newPos);
            });

            let swaps = new Map<number, number>();
            oldChildren.forEach((c, oldPos) => {
                let swapped = swaps.get(oldPos);
                if (swapped !== undefined) {
                    oldPos = swapped;
                }

                let newPos = newPositions.get(c);
                if (newPos === undefined || newPos === oldPos) {
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

                let lNode = parent.childNodes[l];
                let rNode = parent.childNodes[r];
                let rNext = rNode.nextSibling;
                insertBefore.call(parent, rNode, lNode);
                insertBefore.call(parent, lNode, rNext)
            });

            let realChildren: Node[] = [];
            Array.prototype.forEach.call(e.childNodes, v => realChildren.push(v));
            for (let i = 0; i < Math.max(newChildren.length, oldChildren.length); i++) {
                updateDOM(e, realChildren[i], oldChildren[i], newChildren[i]);
            }
        }
    };

    const updateRootElement = (() => {
        let currentDOM: Markup | undefined;
        return (newDOM: Markup) => {
            updateDOM(rootElement, rootElement.childNodes[0], currentDOM, newDOM);
            currentDOM = newDOM;
        };
    })();

    type CachedMarkup = {
        cached: [ Present, any[], Markup ] | undefined,
        children: CachedMarkups | undefined,
    };
    type CachedMarkups = CachedMarkup[] | Dict<CachedMarkup>;
    function cachedMarkupsForKey<K>(markups: CachedMarkups): K extends number ? CachedMarkup[] : Dict<CachedMarkup> {
        return markups as (K extends number ? CachedMarkup[] : Dict<CachedMarkup>);
    }

    let rootCachedMarkup = {} as CachedMarkup;

    const makeCursor = (
        state: any,
        path: StateKey[],
        cachedMarkup: CachedMarkup,
        updatingPath: StateKey[],
        root?: Cursor,
        parent?: Cursor,
    ): Cursor => {
        let [updatingKey, ...nextUpdatingPath] = updatingPath;
        if (updatingPath.length == 1) {
            // We've reached the end of the updating cursor. Subtree
            // shouldn't use saved DOMs anymore, as they may change.
            cachedMarkup = {} as CachedMarkup;
        }
        cachedMarkup.children = cachedMarkup.children || (state instanceof Array ? [] : {});

        let cursor = {
            parent: parent || null,
            root: root,
            child: (key: StateKey) => {
                if (state === undefined) {
                    return null;
                }
                
                let markupChildren = cachedMarkupsForKey(cachedMarkup.children as CachedMarkups);
                let markupChild = markupChildren[key];
                if (markupChild === undefined) {
                    markupChild = {} as CachedMarkup;
                    markupChildren[key] = markupChild;
                }

                return makeCursor(
                    state[key],
                    [...path, key],
                    markupChild,
                    // Only pass nextUpdatingPath is the child is in the
                    // updating path.
                    key === updatingKey ? nextUpdatingPath : [],
                    root,
                    cursor as Cursor,
                );
            },

            state: state,
            set: (newState: any) => {
                let updating: any = rootState;
                path.forEach((k, i) => {
                    if (i == path.length - 1) {
                        updating[k] = newState;
                    } else {
                        updating = updating[k];
                    }
                });
                updateRootElement(present(makeCursor(rootState, [], rootCachedMarkup, path), ...presentArgs));
            },

            present: (present: Present, ...args: any[]) => {
                let cached = cachedMarkup.cached;
                if (cached !== undefined && cached[0] === present && args.filter((v, i) => cached![1][i] !== v).length == 0) {
                    return cached[2];
                }
                return present(cursor as Cursor, ...args);
            },
        };

        if (root === undefined) {
            cursor.root = cursor as Cursor;
            root = cursor as Cursor;
        }

        return cursor as Cursor;
    };

    updateRootElement(present(makeCursor(rootState, [], rootCachedMarkup, [])));
};

})();
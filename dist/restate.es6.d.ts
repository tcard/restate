declare type Present = (cursor: Cursor, ...args: any[]) => Markup;
declare type Markup = Elem | {
    toString: () => string;
};
declare type Elem = [string, Dict<string | Function>, [Markup]];
declare type Dict<T> = {
    [key: string]: T;
};
declare type Cursor = {
    parent: Cursor | null;
    root: Cursor;
    child: (key: StateKey) => Cursor | null;
    state: any;
    set: (newState: any) => void;
    present: (present: Present, ...presentArgs: any[]) => void;
};
declare type StateKey = string | number;
declare const Restate: (rootElement: Element, rootState: any, present: Present, ...presentArgs: any[]) => void;

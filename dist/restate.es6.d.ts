declare type Present = (cursor: Cursor<any>, ...args: any[]) => Markup;
declare type Markup = Elem | {
    toString: () => string;
};
declare type Elem = [string, Dict<string | Function>, Markup[]];
declare type Dict<T> = {
    [key: string]: T;
};
declare type Cursor<State> = {
    parent: Cursor<any> | null;
    root: Cursor<any>;
    child: (key: StateKey) => Cursor<any> | null;
    state: State;
    set: (newState: State) => void;
    present: (present: Present, ...presentArgs: any[]) => Markup;
};
declare type StateKey = string | number;
declare const Restate: (rootElement: Element, rootState: any, present: Present, ...presentArgs: any[]) => void;

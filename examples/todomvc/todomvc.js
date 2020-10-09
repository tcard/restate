(function () {
    var toDoState = {
        items: []
    };
    function presentToDo(cursor) {
        var items = cursor.child('items');
        return ['body', {}, [
                ['section', { "class": 'todoapp' }, [
                        ['header', { "class": 'header' }, [
                                ['h1', {}, ['todos']],
                                ['input', {
                                        "class": 'new-todo',
                                        placeholder: 'What needs to be done?',
                                        autofocus: 'autofocus',
                                        onkeydown: function (ev) {
                                            if (ev.key !== 'Enter') {
                                                return;
                                            }
                                            items.set([{
                                                    text: ev.target.value,
                                                    completed: false,
                                                    editing: false
                                                }].concat(items.state));
                                        }
                                    }, []]
                            ]],
                        items.present(presentItems),
                    ]],
                ['footer', { "class": 'info' }, [
                        ['p', {}, ['Double-click to edit a todo']],
                    ]],
            ]];
    }
    ;
    function presentItems(_a) {
        var items = _a.state, child = _a.child, set = _a.set;
        var children = [];
        if (items.length > 0) {
            var footerChildren = [
                ['span', { "class": 'todo-count' }, [['strong', {}, [items.filter(function (i) { return !i.completed; }).length]], " item" + (items.length == 1 ? '' : 's') + " left"]],
            ];
            if (items.filter(function (i) { return i.completed; }).length > 0) {
                footerChildren.push(['button', { "class": 'clear-completed', onclick: function () {
                            set(items.filter(function (i) { return !i.completed; }));
                        } }, ['Clear completed']]);
            }
            children = [
                ['section', { "class": 'main' }, [
                        ['input', { id: 'toggle-all', "class": 'toggle-all', type: 'checkbox', onclick: function () {
                                    toDoState.items.forEach(function (item) { return item.completed = true; });
                                    set(toDoState.items);
                                } }, []],
                        ['label', { "for": 'toggle-all' }, ['Mark all as complete']],
                        ['ul', { "class": 'todo-list' }, items.map(function (_, i) { return child(i).present(presentItem, i); })],
                    ]],
                ['footer', { "class": 'footer' }, footerChildren],
            ];
        }
        return ['div', {}, children];
    }
    ;
    function presentItem(_a, i) {
        var item = _a.state, child = _a.child, parent = _a.parent, set = _a.set;
        var liAttrs = { "class": '' };
        var checkboxAttrs = {
            "class": 'toggle', type: 'checkbox',
            onclick: function () {
                child('completed').set(!item.completed);
            }
        };
        if (item.completed) {
            liAttrs["class"] += ' completed';
            checkboxAttrs.checked = 'checked';
        }
        var liChildren;
        if (item.editing) {
            liAttrs["class"] += ' editing';
            var save_1 = function (ev) {
                item.text = ev.target.value;
                item.editing = false;
                set(item);
            };
            liChildren = [['input', { "class": 'edit', value: item.text, onblur: save_1, onkeydown: function (ev) {
                            if (ev.key == 'Enter') {
                                save_1(ev);
                            }
                        } }, []]];
        }
        else {
            liChildren = [['div', { "class": 'view' }, [
                        ['input', checkboxAttrs, []],
                        ['label', { ondblclick: function () {
                                    child('editing').set(true);
                                } }, [item.text]],
                        ['button', { "class": 'destroy', onclick: function () {
                                    parent.state.splice(i, 1);
                                    parent.set(parent.state);
                                } }, []],
                    ]]];
        }
        return ['li', liAttrs, liChildren];
    }
    ;
    Restate(document.body, toDoState, presentToDo);
})();
//# sourceMappingURL=todomvc.js.map
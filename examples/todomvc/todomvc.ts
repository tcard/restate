
(function() {

type ToDoItem = {
	text: string,
	completed: boolean,
	editing: boolean,
};

const toDoState = {
	items: [] as ToDoItem[],
};

function presentToDo(cursor: Cursor<typeof toDoState>): Markup {
	let items = cursor.child('items')!;
	return ['body', {}, [
		['section', {class: 'todoapp'}, [
			['header', {class: 'header'}, [
				['h1', {}, ['todos']],
				['input', {
					class: 'new-todo',
					placeholder: 'What needs to be done?',
					autofocus: 'autofocus',
					onkeydown: (ev: Event) => {
						if ((ev as KeyboardEvent).key !== 'Enter') {
							return;
						}
						items.set([{
							text: (ev.target! as HTMLInputElement).value,
							completed: false,
							editing: false,
						}].concat(items.state));
					},
				}, []]
			]],
			items.present(presentItems),
		]],

		['footer', {class: 'info'}, [
			['p', {}, ['Double-click to edit a todo']],
		]],
	]];
};

function presentItems({ state: items, child, set }: Cursor<ToDoItem[]>): Markup {
	let children: Markup[] = [];

	if (items.length > 0) {
		let footerChildren: Markup[] = [
			['span', {class: 'todo-count'}, [['strong', {}, [items.filter(i => !i.completed).length]], ` item${items.length == 1 ? '' : 's'} left`]],
		];
		if (items.filter(i => i.completed).length > 0) {
			footerChildren.push(['button', {class: 'clear-completed', onclick: () => {
				set(items.filter(i => !i.completed));
			}}, ['Clear completed']]);
		}
		children = [
			['section', {class: 'main'}, [
				['input', {id: 'toggle-all', class: 'toggle-all', type: 'checkbox', onclick: () => {
					toDoState.items.forEach(item => item.completed = true);
					set(toDoState.items);
				}}, []],
				['label', {for: 'toggle-all'}, ['Mark all as complete']],
				['ul', {class: 'todo-list'}, items.map((_, i) => child(i)!.present(presentItem, i))],
			]],
			['footer', {class: 'footer'}, footerChildren],
		];
	}

	return ['div', {}, children];
};

function presentItem({ state: item, child, parent, set }: Cursor<ToDoItem>, i: number): Markup {
	let liAttrs: {[key: string]: any} = {class: ''};
	let checkboxAttrs: {[key: string]: any} = {
		class: 'toggle', type: 'checkbox',
		onclick: () => {
			child('completed')!.set(!item.completed);
		},
	};

	if (item.completed) {
		liAttrs.class += ' completed';
		checkboxAttrs.checked = 'checked';
	}

	let liChildren: Markup[];

	if (item.editing) {
		liAttrs.class += ' editing';

		const save = (ev: Event) => {
			item.text = (ev.target! as HTMLInputElement).value;
			item.editing = false;
			set(item);
		}

		liChildren = [['input', {class: 'edit', value: item.text, onblur: save, onkeydown: (ev: KeyboardEvent) => {
			if (ev.key == 'Enter') {
				save(ev);
			}
		}}, []]];
	} else {
		liChildren = [['div', {class: 'view'}, [
			['input', checkboxAttrs, []],
			['label', {ondblclick: () => {
				child('editing')!.set(true);
			}}, [item.text]],
			['button', {class: 'destroy', onclick: () => {
				(parent!.state as ToDoItem[]).splice(i, 1);
				parent!.set(parent!.state);
			}}, []],
		]]];
	}

	return ['li', liAttrs, liChildren];
};

Restate(document.body, toDoState, presentToDo);

})();

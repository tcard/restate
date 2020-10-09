
(function() {

function presentCounters(cursor: Cursor<number[]>): Markup {
	let counters = cursor.state;
	let order = counters.map((_, i) => i);
	order.sort((a, b) => counters[a] > counters[b] ? -1 : (counters[a] == counters[b] ? 0 : 1));
	return ['div', {}, [
		['button', {
			onclick: () => {
				counters.push(0);
				cursor.set(counters);
			},
		}, ['Add counter']],
		['br', {}, []],
		...order.map((i, pos) => cursor.child(i)!.present(presentCounter, i, pos)),
	]];
};

function presentCounter(cursor: Cursor<number>, i: number, pos: number): Markup {
	return ['p', {
		style: `background-color: ${pos % 2 == 0 ? 'white' : 'yellow'}`
	}, [
		['button', {onclick: () => {
			cursor.set(cursor.state - 1);
		}}, ['-']],
		`${String.fromCharCode(i + 'A'.charCodeAt(0))}: ${cursor.state}`,
		['button', {onclick: () => {
			cursor.set(cursor.state + 1);
		}}, ['+']],
	]];
};

let counters: number[] = [];
Restate(document.body, counters, presentCounters);

})();

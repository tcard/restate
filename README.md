# Restate

**Restate** is a ~1 KB gzipped, virtual DOM-based, React-inspired, reasonably
performant JavaScript library for building interactive HTML.

In Restate, you pass a value representing your application's **state** and a
function to **present** it as HTML (or, more generally, as DOM objects).
Restate will then call your present function any time the state changes to
get the new HTML it corresponds to.

Similarly to Elm and Redux, there's a **single state value** and a **pure
HTML-producing function**; state mutation is more like React's. Compared to
other libraries, it **doesn't need keys, reified actions nor immutable data
structures** to achieve similar optimizations in most cases.

[Grab the files](https://github.com/tcard/restate/tree/master/dist) and
[see the annotated source for some documentation](https://tcard.github.io/restate/).

### ⚠️ Caution: not anywhere near production-ready

This is all just an experiment. I haven't even used it that much. It may be
broken, maybe irremediably so. 

## Example

Here's a list of sorted counters ([see live](https://jsfiddle.net/p8huwokq/)):

```typescript
function presentCounters(cursor: Cursor): Markup {
	let counters = cursor.state as number[];
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

function presentCounter(cursor: Cursor, i: number, pos: number): Markup {
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
```

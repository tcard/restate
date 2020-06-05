var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
(function () {
    function presentCounters(cursor) {
        var counters = cursor.state;
        var order = counters.map(function (_, i) { return i; });
        order.sort(function (a, b) { return counters[a] > counters[b] ? -1 : (counters[a] == counters[b] ? 0 : 1); });
        return ['div', {}, __spreadArrays([
                ['button', {
                        onclick: function () {
                            counters.push(0);
                            cursor.set(counters);
                        }
                    }, ['Add counter']],
                ['br', {}, []]
            ], order.map(function (i, pos) { return cursor.child(i).present(presentCounter, i, pos); }))];
    }
    ;
    function presentCounter(cursor, i, pos) {
        return ['p', {
                style: "background-color: " + (pos % 2 == 0 ? 'white' : 'yellow')
            }, [
                ['button', { onclick: function () {
                            cursor.set(cursor.state - 1);
                        } }, ['-']],
                String.fromCharCode(i + 'A'.charCodeAt(0)) + ": " + cursor.state,
                ['button', { onclick: function () {
                            cursor.set(cursor.state + 1);
                        } }, ['+']],
            ]];
    }
    ;
    var counters = [];
    Restate(document.body, counters, presentCounters);
})();
//# sourceMappingURL=counters.js.map
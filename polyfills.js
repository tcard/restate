"use strict";
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
//# sourceMappingURL=polyfills.js.map
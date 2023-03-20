"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.daysElapsed = exports.withLock = void 0;
var locks = new Map();
var unstackLock = function (id, log) { return __awaiter(void 0, void 0, void 0, function () {
    var stack, fn, error_1, newStack;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                stack = locks.get(id);
                if (!stack) {
                    return [2 /*return*/];
                }
                if (stack.queue.length === 0) {
                    return [2 /*return*/];
                }
                if (!!stack.running) return [3 /*break*/, 7];
                fn = stack.queue.shift();
                if (!fn) return [3 /*break*/, 7];
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, 4, 6]);
                stack.running = fn();
                return [4 /*yield*/, stack.running];
            case 2:
                _a.sent();
                return [3 /*break*/, 6];
            case 3:
                error_1 = _a.sent();
                log === null || log === void 0 ? void 0 : log('error in unstackLock', { id: id, error: error_1 });
                return [3 /*break*/, 6];
            case 4:
                stack.running = undefined;
                return [4 /*yield*/, unstackLock(id)];
            case 5:
                _a.sent();
                return [7 /*endfinally*/];
            case 6:
                newStack = locks.get(id);
                if (newStack && newStack.queue.length === 0) {
                    locks["delete"](id);
                }
                _a.label = 7;
            case 7: return [2 /*return*/];
        }
    });
}); };
var withLock = function (id) { return function (fn, log) { return __awaiter(void 0, void 0, void 0, function () {
    var lock;
    return __generator(this, function (_a) {
        if (!locks.has(id)) {
            locks.set(id, { running: undefined, queue: [] });
        }
        lock = locks.get(id);
        if (!lock) {
            // Never happens but makes TS happy
            throw new Error('Lock is not defined');
        }
        lock.queue.push(fn);
        return [2 /*return*/, unstackLock(id, log)];
    });
}); }; };
exports.withLock = withLock;
var daysElapsed = function (fromDate, toDate) {
    var from = new Date(fromDate);
    var to = new Date(toDate);
    from.setHours(0, 0, 0, 0);
    to.setHours(0, 0, 0, 0);
    return Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
};
exports.daysElapsed = daysElapsed;
//# sourceMappingURL=util.js.map
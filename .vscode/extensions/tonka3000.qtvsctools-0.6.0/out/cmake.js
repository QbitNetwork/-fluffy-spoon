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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CMakeCache = exports.getCmakeCacheValue = void 0;
const fs = require("fs");
const readline = require("readline");
function getCmakeCacheValue(key, cachefile) {
    return __awaiter(this, void 0, void 0, function* () {
        let cache = new CMakeCache(cachefile);
        yield cache.readCache();
        return cache.getKeyOrDefault(key, "");
    });
}
exports.getCmakeCacheValue = getCmakeCacheValue;
class CMakeCache {
    constructor(filename = "") {
        this._filename = "";
        this.values = {};
        this._filename = filename;
    }
    get filename() {
        return this._filename;
    }
    set filename(value) {
        this._filename = value;
    }
    getKeyOrDefault(key, default_value = "") {
        let result = default_value;
        if (key in this.values) {
            result = this.values[key];
        }
        return result;
    }
    readCache() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve /*, reject*/) => {
                this.values = {};
                if (this._filename && fs.existsSync(this._filename)) {
                    const rl = readline.createInterface({
                        input: fs.createReadStream(this._filename),
                        output: process.stdout,
                        terminal: false
                    });
                    rl.on('line', (line) => {
                        line = line.trim();
                        if (line.startsWith("#") || line.startsWith("//")) {
                            return;
                        }
                        const groups = line.match(/(.+):(.+)=(.+)/);
                        if (groups && groups.length === 4) {
                            const varName = groups[1];
                            const varType = groups[2];
                            const varValue = groups[3];
                            if (varName.startsWith("Qt5") || varName.startsWith("CMAKE_PROJECT_NAME")) {
                                this.values[varName] = varValue;
                            }
                        }
                    });
                    rl.on('close', () => {
                        resolve(true);
                    });
                }
                else {
                    resolve(false);
                }
            });
        });
    }
}
exports.CMakeCache = CMakeCache;
//# sourceMappingURL=cmake.js.map
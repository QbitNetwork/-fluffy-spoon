"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getModTimeFromFile = exports.exeExtension = void 0;
const fs = require("fs");
function exeExtension() {
    let result = "";
    if (process.platform === "win32") {
        result = ".exe";
    }
    return result;
}
exports.exeExtension = exeExtension;
function getModTimeFromFile(filename) {
    let result = new Date();
    if (fs.existsSync(filename)) {
        result = fs.statSync(filename).mtime;
    }
    return result;
}
exports.getModTimeFromFile = getModTimeFromFile;
//# sourceMappingURL=tools.js.map
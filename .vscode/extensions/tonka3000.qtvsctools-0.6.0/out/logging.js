"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = exports.LogLevel = void 0;
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["none"] = 0] = "none";
    LogLevel[LogLevel["debug"] = 10] = "debug";
    LogLevel[LogLevel["info"] = 20] = "info";
    LogLevel[LogLevel["warning"] = 30] = "warning";
    LogLevel[LogLevel["error"] = 40] = "error";
    LogLevel[LogLevel["critical"] = 50] = "critical";
})(LogLevel = exports.LogLevel || (exports.LogLevel = {}));
class Logger {
    constructor(outputchannel) {
        this.level = LogLevel.none;
        this.outputchannel = outputchannel;
    }
    warning(text) {
        if (this.level >= LogLevel.warning) {
            this._writeLine(text, "warning");
        }
    }
    info(text) {
        if (this.level >= LogLevel.info) {
            this._writeLine(text, "info");
        }
    }
    error(text) {
        if (this.level >= LogLevel.error) {
            this._writeLine(text, "error");
        }
    }
    debug(text) {
        if (this.level >= LogLevel.debug) {
            this._writeLine(text, "debug");
        }
    }
    _writeLine(text, prefix = "") {
        if (this.outputchannel) {
            const date = new Date().toISOString();
            this.outputchannel.appendLine(`${date} [${prefix}] ${text}`);
        }
    }
    dispose() {
    }
}
exports.Logger = Logger;
//# sourceMappingURL=logging.js.map
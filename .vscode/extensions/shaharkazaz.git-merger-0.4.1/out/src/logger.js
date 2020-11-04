"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const moment = require("moment");
const string_constnats_1 = require("./constants/string-constnats");
class Logger {
    constructor() {
        this.outLogChannel = vscode_1.window.createOutputChannel('Git merger');
    }
    /**
     * Post an Error log message to vscode output channel.
     * @param {string} message - The error message
     * @param {string} errorHeader - the error's stderr
     */
    logError(message, errorHeader) {
        message = errorHeader ? string_constnats_1.default.error(errorHeader) + "\n" + message : message;
        this.logMessage(string_constnats_1.default.msgTypes.ERROR, message);
        vscode_1.window.showErrorMessage(string_constnats_1.default.windowErrorMessage, string_constnats_1.default.actionButtons.openLog).then((action) => {
            if (action) {
                this.openLog();
            }
        });
    }
    /**
     * Post any log message to vscode output channel.
     * @param {string} msgType - Error, Warning, Info etc.
     * @param {string} message - The message to post.
     */
    logMessage(msgType, message) {
        this.outLogChannel.appendLine(`[${msgType}-${moment().format(string_constnats_1.default.timeForamt.hours)}] ${message}`);
    }
    /**
     * Opens the vscode output channel
     * @returns {void}
     */
    openLog() {
        this.outLogChannel.show();
    }
}
exports.Logger = Logger;
//# sourceMappingURL=logger.js.map
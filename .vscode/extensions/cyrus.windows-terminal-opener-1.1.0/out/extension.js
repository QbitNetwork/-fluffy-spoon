"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const { exec } = require('child_process');
function activate(context) {
    let disposable = vscode.commands.registerCommand('windows-terminal-opener.openWindowsTerminal', (uri) => {
        if (uri && uri.scheme) {
            exec('wt -d "' + decodeURIComponent(uri.fsPath) + '"');
            return;
        }
        let folders = vscode.workspace.workspaceFolders;
        if (Array.isArray(folders) && folders.length) {
            const wt = exec('wt -d "' + folders[0]["uri"]["fsPath"] + '"');
        }
        else {
            const wt = exec('wt');
        }
    });
    context.subscriptions.push(disposable);
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map
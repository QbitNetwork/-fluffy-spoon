"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatusBar = void 0;
const vscode = require("vscode");
class StatusBar {
    constructor() {
        this._qtkitselect = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 2);
        this._activeKitName = '';
        this._qtkitselect.text = "Qt not found";
        this._qtkitselect.tooltip = "cmake configured with Qt?";
        this._qtkitselect.command = "qttools.scanqtkit";
        this._qtkitselect.show();
        this.setActiveKitName('');
    }
    setActiveKitName(v) {
        if (v === '') {
            this._activeKitName = "Qt not found";
            this._qtkitselect.tooltip = "cmake configured with Qt?";
        }
        else {
            this._activeKitName = "Qt found";
            this._qtkitselect.tooltip = v;
        }
        this._qtkitselect.text = this._activeKitName;
    }
}
exports.StatusBar = StatusBar;
//# sourceMappingURL=status.js.map
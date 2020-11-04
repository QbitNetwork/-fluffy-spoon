'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const string_constnats_1 = require("../../constants/string-constnats");
const child_process_1 = require("child_process");
const command_base_1 = require("../command-base");
class GitStash extends command_base_1.Command {
    getCommandName() {
        return "stash";
    }
    execute() {
        return __awaiter(this, void 0, void 0, function* () {
            this._openStashSelection();
        });
    }
    static stash(stashName, hideMsg) {
        return new Promise((resolve, reject) => {
            child_process_1.exec(string_constnats_1.default.git.stash("save ", false, stashName), {
                cwd: vscode_1.workspace.rootPath
            }, (error, stdout, stderr) => {
                if (error) {
                    command_base_1.Command.logger.logError(string_constnats_1.default.error("creating stash:"), stderr);
                    reject();
                    return;
                }
                if (stdout.indexOf("No local changes to save") != -1) {
                    let msg = "No local changes detected in tracked files";
                    command_base_1.Command.logger.logMessage(string_constnats_1.default.msgTypes.INFO, msg);
                    vscode_1.window.showInformationMessage(msg);
                    resolve();
                    return;
                }
                if (!hideMsg) {
                    let msg = string_constnats_1.default.success.general("Stash", "created");
                    command_base_1.Command.logger.logMessage(string_constnats_1.default.msgTypes.INFO, msg);
                    vscode_1.window.showInformationMessage(msg);
                }
                resolve();
            });
        });
    }
    _openStashSelection() {
        vscode_1.window.showInputBox({
            placeHolder: "Enter stash message (default will show no message)", validateInput: (input) => {
                if (input[0] == "-") {
                    return "The name can't start with '-'";
                }
                else if (new RegExp("[()&`|!]", 'g').test(input)) {
                    return "The name can't contain the following characters: '|', '&', '!', '(', ')' or '`'";
                }
                return "";
            }
        }).then((userInput) => {
            if (userInput === undefined) {
                return;
            }
            GitStash.stash(userInput, false);
        });
    }
}
exports.GitStash = GitStash;
//# sourceMappingURL=gitStash.js.map
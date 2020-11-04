"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const command_base_1 = require("../command-base");
const vscode_1 = require("vscode");
const string_constnats_1 = require("../../constants/string-constnats");
const executer_1 = require("../../services/executer");
class GitContinue extends command_base_1.Command {
    getCommandName() {
        return "continue";
    }
    execute() {
        return __awaiter(this, void 0, void 0, function* () {
            const cmds = {
                checkMergeInProcess: 'merge HEAD',
                searchConflicts: 'diff -S <<<<<<< HEAD -S ======= -S >>>>>>> --raw',
                commitMerge: 'commit --all --no-edit'
            };
            executer_1.gitExecutor(cmds.checkMergeInProcess)
                .then(() => {
                vscode_1.window.showInformationMessage('No merge in progress');
            })
                .catch(() => {
                executer_1.gitExecutor(cmds.searchConflicts)
                    .then((searchResults) => {
                    if (!searchResults) {
                        return executer_1.gitExecutor(cmds.commitMerge)
                            .then((commitMsg) => {
                            vscode_1.window.showInformationMessage('Merge was successfully completed');
                        });
                    }
                    else {
                        const msg = 'You still have some unresolved conflicts, please resolve before continuing';
                        command_base_1.Command.logger.logMessage(string_constnats_1.default.msgTypes.WARNING, msg);
                        vscode_1.window.showWarningMessage(msg);
                    }
                })
                    .catch((err) => {
                    command_base_1.Command.logger.logError(string_constnats_1.default.error("continuing merge"), err);
                });
            });
        });
    }
}
exports.GitContinue = GitContinue;
//# sourceMappingURL=gitContinue.js.map
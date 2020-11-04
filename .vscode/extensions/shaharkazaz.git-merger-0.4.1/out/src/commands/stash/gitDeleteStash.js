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
const util_1 = require("../../services/util");
const command_base_1 = require("../command-base");
class GitDeleteStash extends command_base_1.Command {
    getCommandName() {
        return "deleteStash";
    }
    execute() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.stashList = this._fetchStashList();
                if (this.stashList.length === 0) {
                    command_base_1.Command.logger.logMessage(string_constnats_1.default.msgTypes.INFO, "No stash exists");
                    vscode_1.window.showInformationMessage(string_constnats_1.default.msgTypes.INFO, "No stash exists");
                }
            }
            catch (error) {
                command_base_1.Command.logger.logError(string_constnats_1.default.error("fetching branch list"), error.message);
            }
            vscode_1.window.showQuickPick(this.stashList, {
                matchOnDescription: true,
                placeHolder: "Choose the stash you wish to drop"
            }).then(stashItem => {
                if (stashItem) {
                    GitDeleteStash.deleteStash(stashItem);
                }
            });
        });
    }
    static deleteStash(stashItem) {
        child_process_1.exec(string_constnats_1.default.git.stash("drop " + stashItem.index), {
            cwd: vscode_1.workspace.rootPath
        }, (error, stdout, stderr) => {
            if (error) {
                command_base_1.Command.logger.logError(string_constnats_1.default.error("droping stash:"), stderr);
                return;
            }
            if (stdout.indexOf("Dropped") != -1) {
                let msg = string_constnats_1.default.success.general("Stash", "removed");
                command_base_1.Command.logger.logMessage(string_constnats_1.default.msgTypes.INFO, msg);
                vscode_1.window.showInformationMessage(msg);
            }
        });
    }
    /**
     * Return a list of all the stashed items
     * @return {IGitStashResponse[]}
     * @private
     */
    _fetchStashList() {
        return util_1.getStashList(child_process_1.execSync(string_constnats_1.default.git.stash("list ", true), {
            cwd: vscode_1.workspace.rootPath
        }).toString());
    }
}
exports.GitDeleteStash = GitDeleteStash;
//# sourceMappingURL=gitDeleteStash.js.map
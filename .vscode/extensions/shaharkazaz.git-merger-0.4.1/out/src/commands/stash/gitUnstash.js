'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const string_constnats_1 = require("../../constants/string-constnats");
const child_process_1 = require("child_process");
const util_1 = require("../../services/util");
const command_base_1 = require("../command-base");
const gitDeleteStash_1 = require("./gitDeleteStash");
class GitUnstash extends command_base_1.Command {
    getCommandName() {
        return "unstash";
    }
    execute() {
        try {
            this._stashList = this._fetchStashList();
            if (this._stashList.length === 0) {
                command_base_1.Command.logger.logMessage(string_constnats_1.default.msgTypes.INFO, "No stash exists");
                vscode_1.window.showInformationMessage("No stash exists");
                return;
            }
            vscode_1.window.showQuickPick(this._stashList, {
                matchOnDescription: true,
                placeHolder: "Choose stash to apply"
            }).then(choosenStashItem => {
                if (choosenStashItem) {
                    this._stashItem = choosenStashItem;
                    GitUnstash.unstash(this._stashItem);
                }
            });
        }
        catch (error) {
            command_base_1.Command.logger.logError(string_constnats_1.default.error("fetching branch list"), error.message);
        }
    }
    static unstash(stashItem) {
        let command = stashItem ? string_constnats_1.default.git.stash("apply " + stashItem.index) : string_constnats_1.default.git.stash("pop ");
        child_process_1.exec(command, {
            cwd: vscode_1.workspace.rootPath
        }, (error, stdout, stderr) => {
            if (error) {
                command_base_1.Command.logger.logError(string_constnats_1.default.error("unstashing:"), stderr);
                return;
            }
            let msg = string_constnats_1.default.success.general("Stash", "applied on current branch");
            command_base_1.Command.logger.logMessage(string_constnats_1.default.msgTypes.INFO, msg);
            if (stashItem) {
                vscode_1.window.showInformationMessage(msg, "delete stash").then((action) => {
                    if (action) {
                        gitDeleteStash_1.GitDeleteStash.deleteStash(stashItem);
                    }
                });
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
exports.GitUnstash = GitUnstash;
//# sourceMappingURL=gitUnstash.js.map
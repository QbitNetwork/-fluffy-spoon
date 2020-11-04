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
const gitUnstash_1 = require("../stash/gitUnstash");
const gitStash_1 = require("../stash/gitStash");
class GitMerge extends command_base_1.Command {
    getCommandName() {
        return "mergeFrom";
    }
    execute() {
        return __awaiter(this, void 0, void 0, function* () {
            this.branchObj = this._fetchBranchs();
            this._showBranchQuickPick();
        });
    }
    /**
     * Exexute the git merge command
     * @param   {string} [customCommitMsg] The user's custom commit message
     * @returns {void}
     */
    merge(customCommitMsg) {
        child_process_1.exec(string_constnats_1.default.git.merge(this.optionsObj.validOptions, this.targetBranch.label, this.userCommitMessage), {
            cwd: vscode_1.workspace.rootPath
        }, (error, stdout, stderr) => {
            if (this.optionsObj.invalidOptions.length > 0) {
                vscode_1.window.showWarningMessage("Some of your options were invalid and were exluded, check the log for more info", string_constnats_1.default.actionButtons.openLog).then((chosenitem) => {
                    if (chosenitem) {
                        command_base_1.Command.logger.openLog();
                    }
                });
            }
            if (stdout) {
                if (stdout.toLowerCase().indexOf("conflict") != -1) {
                    let conflictedFiles = stdout.split("\n"), conflictedFilesLength = conflictedFiles.length - 1;
                    command_base_1.Command.logger.logMessage(string_constnats_1.default.msgTypes.WARNING, string_constnats_1.default.warnings.conflicts);
                    for (let i = 0; i < conflictedFilesLength; i++) {
                        let conflictIndex = conflictedFiles[i].indexOf(string_constnats_1.default.git.conflicts);
                        if (conflictIndex != -1) {
                            command_base_1.Command.logger.logMessage(string_constnats_1.default.msgTypes.WARNING, conflictedFiles[i].substr(38, conflictedFiles[i].length));
                        }
                    }
                    let message = string_constnats_1.default.windowConflictsMessage;
                    if (this.stashCreated) {
                        message += ", stash was not applied";
                    }
                    vscode_1.window.showWarningMessage(message);
                    this._setGitMessage();
                    return;
                }
                else if (stdout.indexOf(string_constnats_1.default.git.upToDate) != -1) {
                    command_base_1.Command.logger.logMessage(string_constnats_1.default.msgTypes.INFO, string_constnats_1.default.git.upToDate);
                    vscode_1.window.showInformationMessage(string_constnats_1.default.git.upToDate);
                    return;
                }
            }
            else if (error) {
                if (stderr.indexOf("Your local changes") != -1) {
                    vscode_1.window.showWarningMessage("Merge will fail due to uncommited changes, either commit\
                        the changes or use stash & patch option", "Stash & Patch").then((action) => {
                        if (action) {
                            gitStash_1.GitStash.stash("Temp stash - merge branch '" + this.targetBranch.label + "' into '" +
                                this.branchObj.currentBranch + "'", true).then(() => {
                                this.stashCreated = true;
                                this.merge();
                            });
                        }
                    });
                    return;
                }
                else {
                    command_base_1.Command.logger.logError(string_constnats_1.default.error("merging"), stderr);
                    return;
                }
            }
            if (this.optionsObj.addMessage) {
                this._setGitMessage();
            }
            if (this.stashCreated) {
                gitUnstash_1.GitUnstash.unstash();
            }
            command_base_1.Command.logger.logMessage(string_constnats_1.default.msgTypes.INFO, string_constnats_1.default.success.merge(this.targetBranch.label, this.branchObj.currentBranch));
            vscode_1.window.showInformationMessage(string_constnats_1.default.success.merge(this.targetBranch.label, this.branchObj.currentBranch));
        });
    }
    _setGitMessage() {
        if (vscode_1.scm.inputBox && vscode_1.scm.inputBox.value.length === 0) {
            vscode_1.scm.inputBox.value = "Merge branch '" + this.targetBranch.label + "' into branch '" + this.branchObj.currentBranch + "'";
        }
    }
    /**
     * Process the options, handle invalid ones and require a commit message if necessary
     * @returns {void}
     */
    _processMergeOptions() {
        this.optionsObj = util_1.processUserOptions(string_constnats_1.default.userSettings.get("mergeCommandOptions"), "merge");
        if (this.optionsObj.invalidOptions.length > 0) {
            command_base_1.Command.logger.logMessage(string_constnats_1.default.msgTypes.WARNING, "The following commands are not valid merge commands: " + this.optionsObj.invalidOptions.toString());
            command_base_1.Command.logger.logMessage(string_constnats_1.default.msgTypes.WARNING, "Yoc can check out which commands are valid at: https://git-scm.com/docs/git-merge");
        }
        if (this.optionsObj.requireCommitMessage) {
            vscode_1.window.showInputBox({
                placeHolder: "Enter a custom commit message"
            }).then((customCommitMsg) => {
                if (string_constnats_1.default.userSettings.get("extendAutoCommitMessage")) {
                    customCommitMsg = "Merge branch '" + this.targetBranch.label + "' into '" +
                        this.branchObj.currentBranch + "'\n" + customCommitMsg;
                }
                this.userCommitMessage = customCommitMsg;
                this.merge();
            });
        }
        else {
            this.merge();
        }
    }
    /**
     * Get the list of all the branches
     * @returns {void}
     */
    _fetchBranchs() {
        return util_1.getBranchList(child_process_1.execSync(string_constnats_1.default.git.getBranches, {
            cwd: vscode_1.workspace.rootPath
        }).toString());
    }
    _showBranchQuickPick() {
        vscode_1.window.showQuickPick(this.branchObj.branchList, {
            placeHolder: string_constnats_1.default.quickPick.chooseBranch
        }).then(chosenitem => {
            if (chosenitem) {
                this.targetBranch = chosenitem;
                this._processMergeOptions();
            }
        });
    }
}
exports.GitMerge = GitMerge;
//# sourceMappingURL=gitMerge.js.map
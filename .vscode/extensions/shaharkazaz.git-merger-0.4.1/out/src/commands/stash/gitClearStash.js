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
class GitClearStash extends command_base_1.Command {
    getCommandName() {
        return "clearStash";
    }
    execute() {
        return __awaiter(this, void 0, void 0, function* () {
            child_process_1.exec(string_constnats_1.default.git.stash("clear"), {
                cwd: vscode_1.workspace.rootPath
            }, (error, stdout, stderr) => {
                if (error) {
                    command_base_1.Command.logger.logError(string_constnats_1.default.error("fetching stash list"), stderr);
                    return;
                }
                command_base_1.Command.logger.logMessage(string_constnats_1.default.msgTypes.INFO, string_constnats_1.default.success.general("Stash list", "cleared"));
                vscode_1.window.showInformationMessage(string_constnats_1.default.success.general("Stash list", "cleared"));
            });
        });
    }
}
exports.GitClearStash = GitClearStash;
//# sourceMappingURL=gitClearStash.js.map
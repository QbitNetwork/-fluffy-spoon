"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const vscode_1 = require("vscode");
const defaultConfig = {
    execOptions: {
        cwd: vscode_1.workspace.rootPath
    },
    logProcess: false
};
function gitExecutor(args, cmdConfig) {
    return new Promise((resolve, reject) => {
        if (!args || !args.length) {
            reject("No arguments were given");
        }
        if (!Array.isArray(args)) {
            args = args.split(' ');
        }
        cmdConfig = Object.assign({}, defaultConfig, cmdConfig);
        if (cmdConfig.logProcess) {
            const message = cmdConfig.customMsg ? `${cmdConfig.customMsg}...` : `git ${args[0]} is executing...`;
            console.log('\x1b[36m%s\x1b[0m', message);
        }
        const commandExecuter = child_process_1.spawn('git', args, cmdConfig.execOptions);
        let stdOutData = '';
        let stderrData = '';
        const removeEmptyLine = (str) => str.replace(/\n$/, '');
        commandExecuter.stdout.on('data', (data) => stdOutData += data);
        commandExecuter.stderr.on('data', (data) => stderrData += data);
        commandExecuter.on('close', (code) => code != 0
            ? reject(removeEmptyLine(stderrData.toString()))
            : resolve(removeEmptyLine(stdOutData.toString())));
    });
}
exports.gitExecutor = gitExecutor;
//# sourceMappingURL=executer.js.map
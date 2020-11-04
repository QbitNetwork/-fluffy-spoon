"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 *  @fileOverview This file contains all the string constants
 *  @author       Shahar Kazaz
 *  @requires     workspace from vscode
 *  @requires     allowedOptions
 */
const vscode_1 = require("vscode");
const allowedOptions_1 = require("./allowedOptions");
exports.default = {
    userSettings: vscode_1.workspace.getConfiguration('gitMerger'),
    git: {
        status: 'git status',
        conflicts: 'CONFLICT (content): Merge conflict in',
        upToDate: 'Already up-to-date',
        noMerge: 'There is no merge to abort',
        getBranches: 'git for-each-ref --format="{\'description\':\'%(objectname:short)\',\'label\':\'%(refname:short)\',\'current\':\'%(HEAD)\'}," refs/heads refs/remotes',
        getCurrentBranch: 'git rev-parse --abbrev-ref HEAD',
        merge: (options, branchName, commitMessage) => {
            let command = `git merge ${branchName || ''}`;
            if (options) {
                options.forEach(option => {
                    if (option !== 'm') {
                        command += ' ' + allowedOptions_1.allowedOptions['merge'][option] + option;
                    }
                });
            }
            if (commitMessage) {
                command += ` -m '${commitMessage}'`;
            }
            return command;
        },
        stash: (stashCommand, includeOption = false, stashName) => {
            let option = includeOption ? '--pretty=format:"{\'detail\':\'%gd \u2022 %h \u2022 %cr\',\'label\':\'%s\',\'index\':\'%gd\'},"' : '', command = `git stash ${stashCommand} ${option} ${stashName || ''}`;
            return command;
        }
    },
    msgTypes: {
        ERROR: 'Error',
        WARNING: 'Warning',
        INFO: 'Info',
        DEBUG: 'Debug'
    },
    error: (command) => `Error4 while ${command}`,
    timeForamt: {
        fullDate: 'MM.DD.YYYY HH:mm:ss',
        hours: 'HH:mm:ss'
    },
    windowConflictsMessage: 'Seems like there are some conflicts, resolve before commiting',
    actionButtons: {
        openLog: 'open log'
    },
    warnings: {
        conflicts: 'Conflicts while mergning in the following files:'
    },
    windowErrorMessage: 'Oops! something didn\'t work check the \'Git Merger Log\' for more inforamtion',
    quickPick: {
        chooseBranch: 'Choose destination branch'
    },
    success: {
        general: (operation, functionality) => {
            return `${operation} was successfully ${functionality}`;
        },
        merge: (choosenBranch, currentBranch) => {
            return `Branch '${choosenBranch}' was successfully merged into branch '${currentBranch}'`;
        }
    }
};
//# sourceMappingURL=string-constnats.js.map
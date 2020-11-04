"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/** This is a barrel file for all the extensions commands */
const gitMerge_1 = require("./merge/gitMerge");
const gitAbort_1 = require("./merge/gitAbort");
const gitStash_1 = require("./stash/gitStash");
const gitUnstash_1 = require("./stash/gitUnstash");
const gitClearStash_1 = require("./stash/gitClearStash");
const gitDeleteStash_1 = require("./stash/gitDeleteStash");
const gitContinue_1 = require("./merge/gitContinue");
exports.commands = [gitMerge_1.GitMerge, gitAbort_1.GitAbort, gitStash_1.GitStash,
    gitUnstash_1.GitUnstash, gitClearStash_1.GitClearStash, gitDeleteStash_1.GitDeleteStash, gitContinue_1.GitContinue];
//# sourceMappingURL=index.js.map
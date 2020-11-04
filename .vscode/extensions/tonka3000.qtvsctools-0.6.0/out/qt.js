"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Qt = exports.findQtRootDirViaCmakeDir = exports.findQtRootDirViaPathEnv = void 0;
const fs = require("fs");
const path = require("path");
const tools = require("./tools");
const child_process_1 = require("child_process");
const os = require("os");
function searchFileInDirectories(directories, filenames) {
    for (let i = 0; i < directories.length; i++) {
        const dir = directories[i];
        if (dir) {
            for (let j = 0; j < filenames.length; j++) {
                const file = filenames[j];
                const search_path = path.join(dir, file);
                if (fs.existsSync(search_path)) {
                    return search_path;
                }
            }
        }
    }
    return "";
}
function findQtRootDirViaPathEnv() {
    let result = "";
    if ("PATH" in process.env) {
        const PATH = process.env.PATH || "";
        let splitter = ":";
        if (process.platform === "win32") {
            splitter = ";";
        }
        const paths = PATH.split(splitter);
        const exeExtension = tools.exeExtension();
        const mocFilenameOnly = `qmake${exeExtension}`;
        const mocPath = searchFileInDirectories(paths, [mocFilenameOnly]);
        if (mocPath) {
            result = path.dirname(mocPath);
        }
    }
    return result;
}
exports.findQtRootDirViaPathEnv = findQtRootDirViaPathEnv;
function findQtRootDirViaCmakeDir(qt5_dir) {
    let result = "";
    if (fs.existsSync(qt5_dir)) {
        const norm = qt5_dir.replace("\\", "/");
        let splits = norm.split("/");
        while (splits.length > 0) {
            const tmpBasePath = splits.join("/");
            const exeExtension = tools.exeExtension();
            const mocFilenameOnly = `qmake${exeExtension}`;
            const tmpPath = path.join(tmpBasePath, "bin", mocFilenameOnly);
            if (fs.existsSync(tmpPath)) {
                return path.dirname(tmpPath);
            }
            else {
                splits.pop();
            }
        }
    }
    return result;
}
exports.findQtRootDirViaCmakeDir = findQtRootDirViaCmakeDir;
class Qt {
    constructor(outputchannel, extensionRootFolder, qtbaseDir = "") {
        this._qtbaseDir = "";
        this._creatorFilename = "";
        this._extraSearchDirectories = [];
        this._extensionRootFolder = "";
        this._qtbaseDir = qtbaseDir;
        this.outputchannel = outputchannel;
        this._extensionRootFolder = extensionRootFolder;
    }
    get extraSearchDirectories() {
        return this._extraSearchDirectories;
    }
    set extraSearchDirectories(value) {
        this._extraSearchDirectories = value;
    }
    get designerFilename() {
        let searchdirs = [];
        let filesnames = ["designer" + tools.exeExtension(), "Designer" + tools.exeExtension()];
        if (this.basedir) {
            searchdirs.push(this.basedir);
            if (process.platform === "darwin") {
                filesnames.push(path.join("Designer.app", "Contents", "MacOS", "Designer"));
            }
        }
        searchdirs = searchdirs.concat(this.extraSearchDirectories);
        return searchFileInDirectories(searchdirs, filesnames);
    }
    launchDesigner(filename = "") {
        this.outputchannel.appendLine(`launch designer process`);
        const designerFilename = this.designerFilename;
        if (!fs.existsSync(designerFilename)) {
            throw new Error(`qt designer executable does not exists '${designerFilename}'`);
        }
        let args = [];
        if (filename.length > 0) {
            const extension = path.extname(filename);
            if (extension !== ".ui") {
                throw new Error(`file extension '${extension}' is not support by Qt Designer`);
            }
            args = [filename];
        }
        const designer = child_process_1.spawn(designerFilename, args);
        designer.on('close', (code) => {
            this.outputchannel.appendLine(`qt designer child process exited with code ${code}`);
        });
    }
    get assistantFilename() {
        let searchdirs = [];
        let filesnames = ["assistant" + tools.exeExtension(), "Assistant" + tools.exeExtension()];
        if (this.basedir) {
            searchdirs.push(this.basedir);
            if (process.platform === "darwin") {
                filesnames.push(path.join("Assistant.app", "Contents", "MacOS", "Assistant"));
            }
        }
        searchdirs = searchdirs.concat(this.extraSearchDirectories);
        return searchFileInDirectories(searchdirs, filesnames);
    }
    getInstalledCreatorFilenameWindows() {
        let result = "";
        try {
            const getCreator = path.join(this._extensionRootFolder, "res", "getcreator.ps1");
            const creatorRootFolder = child_process_1.execSync(`powershell -executionpolicy bypass "${getCreator}"`).toString().trim();
            if (fs.existsSync(creatorRootFolder)) {
                const creatorExec = path.join(creatorRootFolder, "bin", "qtcreator.exe");
                if (fs.existsSync(creatorExec)) {
                    result = creatorExec;
                }
            }
        }
        catch (error) {
        }
        return result;
    }
    get creatorFilename() {
        if (this._creatorFilename) {
            if (process.platform === "darwin" && this._creatorFilename.endsWith(".app")) {
                return path.join(this._creatorFilename, "Contents", "MacOS", "Qt Creator");
            }
            else {
                return this._creatorFilename;
            }
        }
        let result = "";
        let searchdirs = [];
        if (process.platform === "darwin") {
            const appName = path.join(os.homedir(), "Qt", "Qt Creator.app", "Contents", "MacOS", "Qt Creator");
            if (fs.existsSync(appName)) {
                result = appName;
            }
        }
        else if (process.platform === "win32") {
            result = this.getInstalledCreatorFilenameWindows();
        }
        else {
            // TODO auto detection for linux
        }
        return result;
    }
    set creatorFilename(value) {
        this._creatorFilename = value;
    }
    launchAssistant() {
        this.outputchannel.appendLine(`launch assistant process`);
        const assistantFilename = this.assistantFilename;
        if (!fs.existsSync(assistantFilename)) {
            throw new Error(`qt assistant executable does not exists '${assistantFilename}'`);
        }
        const assistant = child_process_1.spawn(assistantFilename, []);
        assistant.on('close', (code) => {
            this.outputchannel.appendLine(`qt assistant child process exited with code ${code}`);
        });
    }
    launchCreator(filename = "") {
        this.outputchannel.appendLine(`launch creator process`);
        const creatorFilename = this.creatorFilename;
        if (!fs.existsSync(creatorFilename)) {
            throw new Error(`qt creator executable does not exists '${creatorFilename}'`);
        }
        let args = [];
        if (filename.length > 0) {
            if (!fs.lstatSync(filename).isDirectory()) { // directories will be not checked
                const extension = path.extname(filename);
                if (extension !== ".qrc" && extension !== ".ui") {
                    throw new Error(`file extension '${extension}' is not support by Qt Creator`);
                }
            }
            args = [filename];
        }
        const assistant = child_process_1.spawn(creatorFilename, args);
        assistant.on('close', (code) => {
            this.outputchannel.appendLine(`qt creator child process exited with code ${code}`);
        });
    }
    /**
     * The Qt root directory where the bin, lib, ... directories are stored
     */
    get basedir() {
        return this._qtbaseDir;
    }
    /**
     * The Qt root directory where the bin, lib, ... directories are stored
     */
    set basedir(value) {
        this._qtbaseDir = value;
    }
}
exports.Qt = Qt;
//# sourceMappingURL=qt.js.map
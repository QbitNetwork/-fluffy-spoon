"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const path = require("path");
const qt = require("./qt");
const cmake = require("./cmake");
const status_1 = require("./status");
const fs = require("fs");
const downloader_1 = require("./downloader");
const open = require("open");
const logging_1 = require("./logging");
class ExtensionManager {
    constructor(extensionContext) {
        this.extensionContext = extensionContext;
        this.qtManager = null;
        this.cmakeCache = null;
        this._statusbar = new status_1.StatusBar();
        this._cmakeCacheWatcher = null;
        this.natvisDownloader = null;
        this.logger = new logging_1.Logger();
        this._context = extensionContext;
        this._channel = vscode.window.createOutputChannel("Qt");
        this.logger.outputchannel = this._channel;
        this.qtManager = new qt.Qt(this._channel, this._context.extensionPath);
        this.cmakeCache = new cmake.CMakeCache();
        this.natvisDownloader = new downloader_1.NatvisDownloader(this._context);
        this.logger.level = this.getLogLevel();
        this.natvisDownloader.downloadStateCallback = (text) => {
            this._channel.appendLine(text);
        };
        this._context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(() => __awaiter(this, void 0, void 0, function* () {
            this.logger.debug("config changed event");
            yield this.updateState();
        })));
    }
    /**
     * Update all internal state by checking all external files like f.e. CMakeCache.txt file
     */
    updateState() {
        return __awaiter(this, void 0, void 0, function* () {
            this._channel.appendLine("update state of ExtensionManager");
            this.logger.level = this.getLogLevel();
            this.logger.debug("update state");
            if (this.cmakeCache) {
                this.logger.debug(`cmake build directory: ${yield this.getCMakeBuildDirectory()}`);
                this.cmakeCache.filename = yield this.getCmakeCacheFilename();
                this.logger.debug(`read cmake cache from ${this.cmakeCache.filename}`);
                yield this.cmakeCache.readCache();
                const Qt5_DIR = this.cmakeCache.getKeyOrDefault("Qt5_DIR", this.cmakeCache.getKeyOrDefault("Qt5Core_DIR", ""));
                let qtRootDir = "";
                if (Qt5_DIR) {
                    this.logger.debug(`search Qt root directory in Qt5_DIR "${Qt5_DIR}"`);
                    qtRootDir = qt.findQtRootDirViaCmakeDir(Qt5_DIR);
                    if (!qtRootDir) {
                        this.logger.debug(`could not find executables in ${Qt5_DIR}, fallback to PATH search`);
                        // search in PATH
                        qtRootDir = qt.findQtRootDirViaPathEnv();
                    }
                    this.logger.debug(`Qt root directory is "${qtRootDir}"`);
                }
                else {
                    this.logger.warning(`Could not find Qt5_DIR or Qt5Core_DIR in ${this.cmakeCache.filename}`);
                }
                const extraSearchDirs = this.getExtraSearchDirectories();
                if (this.qtManager) {
                    this.logger.debug(`extra search directories: ${extraSearchDirs}`);
                    this.qtManager.extraSearchDirectories = extraSearchDirs;
                }
                this.setActiveKit(qtRootDir);
                this.setupCMakeCacheWatcher();
                if (qtRootDir) {
                    yield this.generateNativsFile();
                    this.injectNatvisFile();
                }
            }
            if (this.qtManager) {
                this.qtManager.creatorFilename = this.getCreatorFilenameSetting();
            }
        });
    }
    getCreatorFilenameSetting() {
        let result = "";
        const workbenchConfig = vscode.workspace.getConfiguration();
        let creatorFilename = workbenchConfig.get('qttools.creator');
        if (creatorFilename) {
            result = creatorFilename;
        }
        return result;
    }
    getLogLevel() {
        const config = vscode.workspace.getConfiguration();
        const logleveltext = config.get("qttools.loglevel");
        let result = logging_1.LogLevel.none;
        switch (logleveltext) {
            case "none":
                {
                    result = logging_1.LogLevel.none;
                }
                break;
            case "debug":
                {
                    result = logging_1.LogLevel.debug;
                }
                break;
            case "info":
                {
                    result = logging_1.LogLevel.info;
                }
                break;
            case "warning":
                {
                    result = logging_1.LogLevel.warning;
                }
                break;
            case "error":
                {
                    result = logging_1.LogLevel.error;
                }
                break;
            case "critical":
                {
                    result = logging_1.LogLevel.critical;
                }
                break;
        }
        return result;
    }
    setActiveKit(qtRootDir) {
        if (this.qtManager) {
            this.logger.debug(`set Qt kit to ${qtRootDir}`);
            this.qtManager.basedir = qtRootDir;
            this._statusbar.setActiveKitName(this.qtManager.basedir);
        }
    }
    getActiveDocumentFilename() {
        const editor = vscode.window.activeTextEditor;
        if (editor && editor.document) {
            return editor.document.fileName;
        }
        return "";
    }
    getExtraSearchDirectories() {
        const workbenchConfig = vscode.workspace.getConfiguration();
        let extraSearchDirectories = workbenchConfig.get('qttools.extraSearchDirectories');
        const workspaceFolder = vscode.workspace.rootPath;
        let result = [];
        if (workspaceFolder) {
            extraSearchDirectories.forEach((value) => {
                result.push(value.replace("${workspaceFolder}", workspaceFolder));
            });
        }
        return result;
    }
    getAllSubstitutionVariables(text) {
        let result = [];
        const regex = /\${(.+?)}/;
        let temp_text = text;
        while (true) {
            let match = regex.exec(temp_text);
            if (match) {
                result.push(match[1]);
                temp_text = temp_text.replace(match[0], "");
            }
            else {
                break;
            }
        }
        return result;
    }
    resolveSubstitutionVariables(text) {
        return __awaiter(this, void 0, void 0, function* () {
            let result = text;
            const replace = (key, value) => {
                if (value !== "") {
                    const toreplace = "${" + key + "}";
                    result = result.replace(toreplace, value);
                }
            };
            const variables = this.getAllSubstitutionVariables(text);
            for (const v of variables) {
                switch (v) {
                    case "workspaceFolder":
                        {
                            const workspaceFolder = vscode.workspace.rootPath || "";
                            replace(v, workspaceFolder);
                        }
                        break;
                    case "buildKit":
                        {
                            const buildKit = yield this.getActiveCMakeBuildKit();
                            replace(v, buildKit);
                        }
                        break;
                    case "buildType":
                        {
                            const buildType = yield this.getActiveCMakeBuildType();
                            replace(v, buildType);
                        }
                        break;
                }
            }
            return result;
        });
    }
    getCMakeBuildDirectory() {
        return __awaiter(this, void 0, void 0, function* () {
            let cmakeBuildDir = yield this.getActiveCMakeBuildDirectory();
            if (!cmakeBuildDir) {
                // fallback to config file when we can not get the info from cmake tools extension directly
                const workbenchConfig = vscode.workspace.getConfiguration();
                cmakeBuildDir = String(workbenchConfig.get('cmake.buildDirectory'));
                cmakeBuildDir = yield this.resolveSubstitutionVariables(cmakeBuildDir);
            }
            return cmakeBuildDir;
        });
    }
    getCmakeCacheFilename() {
        return __awaiter(this, void 0, void 0, function* () {
            const buildDir = yield this.getCMakeBuildDirectory();
            let cmakeCachefile = "";
            if (buildDir) {
                cmakeCachefile = path.join(buildDir, "CMakeCache.txt");
            }
            return cmakeCachefile;
        });
    }
    getActiveCMakeBuildType() {
        return __awaiter(this, void 0, void 0, function* () {
            let result = "";
            try {
                result = (yield vscode.commands.executeCommand("cmake.buildType")) || "";
            }
            catch (error) {
            }
            return result;
        });
    }
    getActiveCMakeBuildKit() {
        return __awaiter(this, void 0, void 0, function* () {
            let result = "";
            try {
                result = (yield vscode.commands.executeCommand("cmake.buildKit")) || "";
            }
            catch (error) {
            }
            return result;
        });
    }
    getActiveCMakeBuildDirectory() {
        return __awaiter(this, void 0, void 0, function* () {
            let result = "";
            const command = "cmake.buildDirectory";
            if ((yield vscode.commands.getCommands()).includes(command)) {
                try {
                    result = (yield vscode.commands.executeCommand(command)) || "";
                }
                catch (error) {
                }
            }
            return result;
        });
    }
    get outputchannel() {
        return this._channel;
    }
    registerCommand(command, callback, thisArg) {
        const disp = vscode.commands.registerCommand(command, callback, thisArg);
        this._context.subscriptions.push(disp);
        return disp;
    }
    setupCMakeCacheWatcher() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._cmakeCacheWatcher) {
                this.logger.debug("close old cmake cache watcher");
                this._cmakeCacheWatcher.close();
                this._cmakeCacheWatcher = null;
            }
            this.logger.debug(`set cmake cache watcher on ${yield this.getCMakeBuildDirectory()}`);
            this._cmakeCacheWatcher = fs.watch(yield this.getCMakeBuildDirectory(), (_, filename) => __awaiter(this, void 0, void 0, function* () {
                if (filename === "CMakeCache.txt") {
                    this.outputchannel.appendLine("CMakeCache.txt changed");
                    yield this.updateState();
                }
            }));
        });
    }
    getNatvisTemplateFilepath() {
        return __awaiter(this, void 0, void 0, function* () {
            const workbenchConfig = vscode.workspace.getConfiguration();
            let visualizerFile = workbenchConfig.get('qttools.visualizerFile');
            if (!visualizerFile) {
                visualizerFile = path.join(this._context.extensionPath, "res", "qt.natvis.xml");
            }
            else {
                if (visualizerFile.startsWith("http") && this.natvisDownloader) {
                    try {
                        visualizerFile = yield this.natvisDownloader.download(visualizerFile);
                    }
                    catch (error) {
                        this._channel.appendLine(`could not download ${visualizerFile}: ${error}`);
                        visualizerFile = "";
                    }
                }
            }
            return visualizerFile;
        });
    }
    generateNativsFile() {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.debug("generate natvis file");
            const natvisTempalteFilename = yield this.getNatvisTemplateFilepath();
            if (fs.existsSync(natvisTempalteFilename)) {
                const wnf = this.workspaceNatvisFilename();
                if (wnf) {
                    const template = fs.readFileSync(natvisTempalteFilename, "utf8");
                    let qtNamepsace = "";
                    let normalizedTemplateData = template.replace(/##NAMESPACE##::/g, "%%QT_NAMESPACE%%"); // normalize qtvstools style macros to our ones
                    normalizedTemplateData = normalizedTemplateData.replace(/##NAMESPACE##/g, "%%QT_NAMESPACE%%"); // normalize qtvstools style macros to our ones
                    const natvisdata = normalizedTemplateData.replace(/%%QT_NAMESPACE%%/g, qtNamepsace); // TODO extract qt namespace from headers
                    const basedir = path.dirname(wnf);
                    if (!fs.existsSync(basedir)) {
                        fs.mkdirSync(basedir, { recursive: true });
                    }
                    this.logger.debug(`write natvis file to ${wnf}`);
                    fs.writeFileSync(wnf, natvisdata, "utf8");
                }
            }
            else {
                this.outputchannel.appendLine(`could not find natvis template file ${natvisTempalteFilename}`);
            }
        });
    }
    injectNatvisFile() {
        const workbenchConfig = vscode.workspace.getConfiguration();
        let shouldInjectnatvisFile = workbenchConfig.get('qttools.injectNatvisFile');
        if (!shouldInjectnatvisFile) {
            return;
        }
        const nvf = this.workspaceNatvisFilename();
        if (fs.existsSync(nvf)) {
            const nvf_launch = this.workspaceNatvisFilename(true); // at the moment the natvis filepath had to be resolved
            const config = vscode.workspace.getConfiguration('launch');
            let values = config.get('configurations');
            let launch_change_required = false;
            if (values) {
                for (let i = 0; i < values.length; i++) {
                    let singleConf = values[i];
                    if ('type' in singleConf) {
                        const conftype = singleConf.type;
                        if (conftype === "cppdbg" || conftype === "cppvsdbg") {
                            let setvalue = true;
                            if ('visualizerFile' in singleConf) {
                                if (singleConf.visualizerFile === nvf_launch) {
                                    setvalue = false;
                                }
                            }
                            if (setvalue) {
                                singleConf.visualizerFile = nvf_launch;
                                if (!launch_change_required) {
                                    launch_change_required = true;
                                }
                            }
                        }
                    }
                }
            }
            if (launch_change_required) {
                this.logger.debug("inject natvis file into launch.json");
                this.outputchannel.appendLine("inject natvis file into launch.json");
                config.update('configurations', values, false);
            }
        }
    }
    dispose() {
        if (this._cmakeCacheWatcher) {
            this._cmakeCacheWatcher.close();
            this._cmakeCacheWatcher = null;
        }
        if (this.logger) {
            this.logger.dispose();
        }
        this.natvisDownloader = null;
    }
    workspaceNatvisFilename(resovled = true) {
        let result = "";
        const natvis_filename = "qt.natvis.xml";
        const generateNativsFileIntoWorkspaceSettings = false;
        if (!generateNativsFileIntoWorkspaceSettings) {
            const sp = this._context.storagePath;
            if (sp) {
                result = path.join(sp, "qt.natvis.xml");
            }
        }
        else {
            if (resovled) {
                const workspaceFolder = vscode.workspace.rootPath;
                if (workspaceFolder) {
                    const vscodeFolder = path.join(workspaceFolder, ".vscode");
                    if (fs.existsSync(vscodeFolder)) {
                        result = path.join(vscodeFolder, "qt.natvis.xml");
                    }
                }
            }
            else {
                result = path.join("${workspaceFolder}", natvis_filename);
            }
        }
        return result;
    }
}
/**
 * The global extension manager. There is only one of these.
 */
let _EXT_MANAGER = null;
function activate(context) {
    return __awaiter(this, void 0, void 0, function* () {
        _EXT_MANAGER = new ExtensionManager(context);
        const logger = _EXT_MANAGER.logger;
        const cmakeTools = vscode.extensions.getExtension('ms-vscode.cmake-tools');
        if (cmakeTools) {
            if (!cmakeTools.isActive) {
                logger.debug("cmake tools extension is not active, waiting for it");
                let activeCounter = 0;
                yield new Promise((resolve) => {
                    const isActive = () => {
                        if (cmakeTools && cmakeTools.isActive) {
                            logger.debug("cmake tools is active");
                            return resolve();
                        }
                        activeCounter++;
                        logger.debug(`wait for cmake tools to get active (${activeCounter})`);
                        if (activeCounter > 15) { // ~15 seconds timeout
                            logger.debug("cmake tools is not active, timed out");
                            return resolve(); // waiting for cmake tools timed out
                        }
                        setTimeout(isActive, 1000);
                    };
                    isActive();
                });
            }
        }
        else {
            yield vscode.window.showWarningMessage('cmake tools extension is not installed or enabled');
        }
        _EXT_MANAGER.updateState();
        _EXT_MANAGER.registerCommand('qttools.launchdesigneronly', () => __awaiter(this, void 0, void 0, function* () {
            if (_EXT_MANAGER && _EXT_MANAGER.qtManager) {
                yield _EXT_MANAGER.updateState();
                try {
                    _EXT_MANAGER.qtManager.launchDesigner();
                }
                catch (error) {
                    const ex = error;
                    _EXT_MANAGER.outputchannel.appendLine(`error during launching Qt Designer: ${ex.message}`);
                    vscode.window.showErrorMessage(`error launching Qt Designer: ${ex.message}`);
                }
            }
        }));
        _EXT_MANAGER.registerCommand('qttools.currentfileindesigner', (uri) => __awaiter(this, void 0, void 0, function* () {
            if (_EXT_MANAGER && _EXT_MANAGER.qtManager) {
                yield _EXT_MANAGER.updateState();
                const current_file = uri.fsPath;
                if (current_file) {
                    try {
                        _EXT_MANAGER.qtManager.launchDesigner(current_file);
                    }
                    catch (error) {
                        const ex = error;
                        _EXT_MANAGER.outputchannel.appendLine(`error during launching Qt Designer: ${ex.message}`);
                        vscode.window.showErrorMessage(`error launching Qt Designer: ${ex.message}`);
                    }
                }
                else {
                    _EXT_MANAGER.outputchannel.appendLine("no current file select in workspace");
                    vscode.window.showErrorMessage("no current file selected");
                }
            }
        }));
        _EXT_MANAGER.registerCommand('qttools.launchassistant', () => __awaiter(this, void 0, void 0, function* () {
            if (_EXT_MANAGER && _EXT_MANAGER.qtManager) {
                yield _EXT_MANAGER.updateState();
                try {
                    _EXT_MANAGER.qtManager.launchAssistant();
                }
                catch (error) {
                    const ex = error;
                    _EXT_MANAGER.outputchannel.appendLine(`error during launching Qt Designer: ${ex.message}`);
                    vscode.window.showErrorMessage(`error launching Qt Designer: ${ex.message}`);
                }
            }
        }));
        _EXT_MANAGER.registerCommand('qttools.launchcreatoronly', () => __awaiter(this, void 0, void 0, function* () {
            if (_EXT_MANAGER && _EXT_MANAGER.qtManager) {
                yield _EXT_MANAGER.updateState();
                try {
                    _EXT_MANAGER.qtManager.launchCreator();
                }
                catch (error) {
                    const ex = error;
                    _EXT_MANAGER.outputchannel.appendLine(`error during launching Qt Creator: ${ex.message}`);
                    vscode.window.showErrorMessage(`error launching Qt Creator: ${ex.message}`);
                }
            }
        }));
        _EXT_MANAGER.registerCommand('qttools.workspaceincreator', () => __awaiter(this, void 0, void 0, function* () {
            if (_EXT_MANAGER && _EXT_MANAGER.qtManager) {
                yield _EXT_MANAGER.updateState();
                try {
                    const workspaceFolder = vscode.workspace.rootPath;
                    _EXT_MANAGER.qtManager.launchCreator(workspaceFolder);
                }
                catch (error) {
                    const ex = error;
                    _EXT_MANAGER.outputchannel.appendLine(`error during launching Qt Creator: ${ex.message}`);
                    vscode.window.showErrorMessage(`error launching Qt Creator: ${ex.message}`);
                }
            }
        }));
        _EXT_MANAGER.registerCommand('qttools.currentfileincreator', (uri) => __awaiter(this, void 0, void 0, function* () {
            if (_EXT_MANAGER && _EXT_MANAGER.qtManager) {
                yield _EXT_MANAGER.updateState();
                const current_file = uri.fsPath;
                if (current_file) {
                    try {
                        _EXT_MANAGER.qtManager.launchCreator(current_file);
                    }
                    catch (error) {
                        const ex = error;
                        _EXT_MANAGER.outputchannel.appendLine(`error during launching Qt Creator: ${ex.message}`);
                        vscode.window.showErrorMessage(`error launching Qt Creator: ${ex.message}`);
                    }
                }
                else {
                    _EXT_MANAGER.outputchannel.appendLine("no current file select in workspace");
                    vscode.window.showErrorMessage("no current file selected");
                }
            }
        }));
        _EXT_MANAGER.registerCommand('qttools.scanqtkit', () => __awaiter(this, void 0, void 0, function* () {
            if (_EXT_MANAGER) {
                yield _EXT_MANAGER.updateState();
            }
        }));
        _EXT_MANAGER.registerCommand('qttools.removenatviscache', () => {
            if (_EXT_MANAGER && _EXT_MANAGER.natvisDownloader) {
                try {
                    _EXT_MANAGER.natvisDownloader.clearDownloadCache();
                }
                catch (error) {
                    _EXT_MANAGER.outputchannel.appendLine(`error: ${error}`);
                    vscode.window.showErrorMessage("error clearing natvis cache");
                }
            }
        });
        _EXT_MANAGER.registerCommand('qttools.launchvisualstudio', () => __awaiter(this, void 0, void 0, function* () {
            if (_EXT_MANAGER && _EXT_MANAGER.cmakeCache) {
                try {
                    yield _EXT_MANAGER.updateState();
                    const cmake_project_name = _EXT_MANAGER.cmakeCache.getKeyOrDefault("CMAKE_PROJECT_NAME", "");
                    if (cmake_project_name) {
                        const visualstudio_sln = path.join(yield _EXT_MANAGER.getCMakeBuildDirectory(), `${cmake_project_name}.sln`);
                        if (fs.existsSync(visualstudio_sln)) {
                            yield open(visualstudio_sln);
                        }
                        else {
                            throw new Error(`Visual Studio solution does not exist '${visualstudio_sln}'`);
                        }
                    }
                    else {
                        throw new Error("could not get cmake project name");
                    }
                }
                catch (error) {
                    _EXT_MANAGER.outputchannel.appendLine(`error: ${error}`);
                    vscode.window.showErrorMessage(`error: ${error}`);
                }
            }
        }));
    });
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() {
    if (_EXT_MANAGER) {
        _EXT_MANAGER.dispose();
    }
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map
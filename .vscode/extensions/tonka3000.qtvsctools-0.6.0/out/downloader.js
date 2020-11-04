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
exports.NatvisDownloader = void 0;
const download = require("download");
const path = require("path");
const fs = require("fs");
const shajs = require("sha.js");
const rimraf = require("rimraf");
class NatvisDownloader {
    constructor(extensionContext) {
        this.extensionContext = extensionContext;
        this.downloadStateCallback = null;
        this._context = extensionContext;
    }
    get natvisFolder() {
        return path.join(this._context.globalStoragePath, "natvis");
    }
    clearDownloadCache() {
        if (fs.existsSync(this.natvisFolder)) {
            rimraf.sync(this.natvisFolder);
        }
    }
    getCacheFilename(url) {
        return __awaiter(this, void 0, void 0, function* () {
            const url_hash = shajs("sha256").update(url).digest("hex");
            const cache_file = path.join(this.natvisFolder, url_hash);
            return cache_file;
        });
    }
    inCache(url) {
        return __awaiter(this, void 0, void 0, function* () {
            const cache_file = yield this.getCacheFilename(url);
            return fs.existsSync(cache_file);
        });
    }
    reportDownloadState(text) {
        if (this.downloadStateCallback) {
            this.downloadStateCallback(text);
        }
    }
    /**
     * Download the given natvis url. The files get cached, so when the url
     * is already download this function will return the cache_file name instantly.
     * @param url to the natvis file which should be downloaded
     * @returns absolute path to the local downloaded file
     */
    download(url) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!fs.existsSync(this.natvisFolder)) {
                fs.mkdirSync(this.natvisFolder, { recursive: true });
            }
            const cache_file = yield this.getCacheFilename(url);
            if (fs.existsSync(cache_file)) {
                return cache_file;
            }
            this.reportDownloadState(`downlad natvis file from ${url}`);
            const data = yield download(url);
            this.reportDownloadState("download succeeded");
            const text = data.toString();
            if (text.indexOf("QString") >= 0) {
                fs.writeFileSync(cache_file, data);
                if (fs.existsSync(cache_file)) {
                    return cache_file;
                }
            }
            else {
                this.reportDownloadState("download file seems no to be a Qt natvis file");
            }
            return "";
        });
    }
    dispose() {
    }
}
exports.NatvisDownloader = NatvisDownloader;
//# sourceMappingURL=downloader.js.map
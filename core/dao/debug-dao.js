"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var abstract_dao_1 = require("./abstract-dao");
var model_1 = require("../model");
var DebugDao = (function (_super) {
    __extends(DebugDao, _super);
    function DebugDao() {
        return _super.call(this, model_1.Model.Debug) || this;
    }
    DebugDao.prototype.collect = function (filename) {
        return this.middlewareClient.submitTaskWithDownload('debug.collect', [filename]);
    };
    return DebugDao;
}(abstract_dao_1.AbstractDao));
exports.DebugDao = DebugDao;

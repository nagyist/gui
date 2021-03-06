"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var abstract_dao_1 = require("./abstract-dao");
var model_1 = require("../model");
var BootEnvironmentDao = (function (_super) {
    __extends(BootEnvironmentDao, _super);
    function BootEnvironmentDao() {
        return _super.call(this, model_1.Model.BootEnvironment) || this;
    }
    BootEnvironmentDao.prototype.activate = function (bootEnvironment) {
        return this.middlewareClient.submitTask('boot.environment.activate', [bootEnvironment.persistedId]);
    };
    BootEnvironmentDao.prototype.clone = function (bootEnvironment, cloneName) {
        return this.middlewareClient.submitTask('boot.environment.clone', [cloneName, bootEnvironment.persistedId]);
    };
    return BootEnvironmentDao;
}(abstract_dao_1.AbstractDao));
exports.BootEnvironmentDao = BootEnvironmentDao;

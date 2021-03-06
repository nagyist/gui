"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var abstract_dao_1 = require("./abstract-dao");
var model_1 = require("../model");
var DockerHostDao = (function (_super) {
    __extends(DockerHostDao, _super);
    function DockerHostDao() {
        return _super.call(this, model_1.Model.DockerHost) || this;
    }
    return DockerHostDao;
}(abstract_dao_1.AbstractDao));
exports.DockerHostDao = DockerHostDao;

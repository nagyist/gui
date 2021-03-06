"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var abstract_dao_1 = require("./abstract-dao");
var model_1 = require("../model");
var DetachedVolumeDao = (function (_super) {
    __extends(DetachedVolumeDao, _super);
    function DetachedVolumeDao() {
        return _super.call(this, model_1.Model.DetachedVolume, {
            queryMethod: 'volume.find',
            preventQueryCaching: true
        }) || this;
    }
    DetachedVolumeDao.prototype.list = function () {
        return abstract_dao_1.AbstractDao.prototype.list.call(this).then(function (detachedVolumes) {
            for (var _i = 0, detachedVolumes_1 = detachedVolumes; _i < detachedVolumes_1.length; _i++) {
                var detachedVolume = detachedVolumes_1[_i];
                detachedVolume._isDetached = true;
            }
            return detachedVolumes;
        });
    };
    DetachedVolumeDao.prototype.import = function (volume) {
        return this.middlewareClient.submitTask('volume.import', [volume.id, volume.name]);
    };
    DetachedVolumeDao.prototype.delete = function (volume) {
        return this.middlewareClient.submitTask('volume.delete_exported', [volume.name]);
    };
    return DetachedVolumeDao;
}(abstract_dao_1.AbstractDao));
exports.DetachedVolumeDao = DetachedVolumeDao;

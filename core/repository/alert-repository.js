"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var abstract_repository_ng_1 = require("./abstract-repository-ng");
var model_event_name_1 = require("../model-event-name");
var alert_dao_1 = require("../dao/alert-dao");
var Promise = require("bluebird");
var model_1 = require("../model");
var AlertRepository = (function (_super) {
    __extends(AlertRepository, _super);
    function AlertRepository(alertDao) {
        var _this = _super.call(this, [model_1.Model.Alert]) || this;
        _this.alertDao = alertDao;
        return _this;
    }
    AlertRepository.getInstance = function () {
        if (!AlertRepository.instance) {
            AlertRepository.instance = new AlertRepository(new alert_dao_1.AlertDao());
        }
        return AlertRepository.instance;
    };
    AlertRepository.prototype.listAlerts = function () {
        return this.alerts ? Promise.resolve(this.alerts.valueSeq().toJS()) : this.alertDao.find({ active: true, dismissed: false });
    };
    AlertRepository.prototype.dismissAlert = function (alert) {
        return this.alertDao.dismiss(alert);
    };
    AlertRepository.prototype.handleStateChange = function (name, state) {
        this.alerts = this.dispatchModelEvents(this.alerts, model_event_name_1.ModelEventName.Alert, state);
    };
    AlertRepository.prototype.handleEvent = function (name, data) {
    };
    return AlertRepository;
}(abstract_repository_ng_1.AbstractRepository));
exports.AlertRepository = AlertRepository;

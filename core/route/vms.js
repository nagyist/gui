"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var model_descriptor_service_1 = require("../service/model-descriptor-service");
var event_dispatcher_service_1 = require("../service/event-dispatcher-service");
var vm_repository_1 = require("../repository/vm-repository");
var abstract_route_1 = require("./abstract-route");
var _ = require("lodash");
var Promise = require("bluebird");
var model_1 = require("../model");
var VmsRoute = (function (_super) {
    __extends(VmsRoute, _super);
    function VmsRoute(modelDescriptorService, eventDispatcherService, vmRepository) {
        var _this = _super.call(this, eventDispatcherService) || this;
        _this.modelDescriptorService = modelDescriptorService;
        _this.vmRepository = vmRepository;
        return _this;
    }
    VmsRoute.getInstance = function () {
        if (!VmsRoute.instance) {
            VmsRoute.instance = new VmsRoute(model_descriptor_service_1.ModelDescriptorService.getInstance(), event_dispatcher_service_1.EventDispatcherService.getInstance(), vm_repository_1.VmRepository.instance);
        }
        return VmsRoute.instance;
    };
    VmsRoute.prototype.get = function (vmId, stack) {
        var self = this, objectType = model_1.Model.Vm, columnIndex = 1, parentContext = stack[columnIndex - 1], context = {
            columnIndex: columnIndex,
            objectType: objectType,
            parentContext: parentContext,
            path: parentContext.path + '/vm/_/' + encodeURIComponent(vmId)
        };
        return Promise.all([
            this.vmRepository.listVms(),
            this.modelDescriptorService.getUiDescriptorForType(objectType)
        ]).spread(function (vms, uiDescriptor) {
            context.object = _.find(vms, { id: vmId });
            context.userInterfaceDescriptor = uiDescriptor;
            return self.updateStackWithContext(stack, context);
        });
    };
    VmsRoute.prototype.create = function (stack) {
        var self = this, objectType = model_1.Model.Vm, columnIndex = 1, parentContext = stack[columnIndex - 1], context = {
            columnIndex: columnIndex,
            objectType: objectType,
            parentContext: parentContext,
            path: parentContext.path + '/create'
        };
        return Promise.all([
            this.vmRepository.getNewVm(),
            this.modelDescriptorService.getUiDescriptorForType(objectType)
        ]).spread(function (vm, uiDescriptor) {
            context.object = vm;
            context.userInterfaceDescriptor = uiDescriptor;
            return self.updateStackWithContext(stack, context);
        });
    };
    VmsRoute.prototype.getReadme = function (stack) {
        var self = this, objectType = model_1.Model.VmReadme, columnIndex = 2, parentContext = stack[columnIndex - 1], context = {
            columnIndex: columnIndex,
            objectType: objectType,
            parentContext: parentContext,
            path: parentContext.path + '/readme'
        };
        return Promise.all([
            this.modelDescriptorService.getUiDescriptorForType(objectType)
        ]).spread(function (uiDescriptor) {
            context.object = parentContext.object._readme;
            context.userInterfaceDescriptor = uiDescriptor;
            return self.updateStackWithContext(stack, context);
        });
    };
    VmsRoute.prototype.getDevices = function (stack) {
        var self = this, objectType = model_1.Model.VmDevice, columnIndex = 2, parentContext = stack[columnIndex - 1], context = {
            columnIndex: columnIndex,
            objectType: objectType,
            parentContext: parentContext,
            path: parentContext.path + '/devices'
        };
        return Promise.all([
            this.modelDescriptorService.getUiDescriptorForType(objectType)
        ]).spread(function (uiDescriptor) {
            context.object = _.forEach(parentContext.object._nonVolumeDevices, function (device) { return device._objectType = objectType; });
            context.userInterfaceDescriptor = uiDescriptor;
            return self.updateStackWithContext(stack, context);
        });
    };
    VmsRoute.prototype.getDevice = function (deviceId, stack) {
        var self = this, objectType = model_1.Model.VmDevice, columnIndex = 3, parentContext = stack[columnIndex - 1], context = {
            columnIndex: columnIndex,
            objectType: objectType,
            parentContext: parentContext,
            path: parentContext.path + '/vm-device/_/' + encodeURIComponent(deviceId)
        };
        return Promise.all([
            this.modelDescriptorService.getUiDescriptorForType(objectType)
        ]).spread(function (uiDescriptor) {
            context.object = _.find(parentContext.object, { id: deviceId });
            context.userInterfaceDescriptor = uiDescriptor;
            return self.updateStackWithContext(stack, context);
        });
    };
    VmsRoute.prototype.selectNewDeviceType = function (stack) {
        var _this = this;
        var self = this, objectType = model_1.Model.VmDevice, columnIndex = 3, parentContext = stack[columnIndex - 1], context = {
            columnIndex: columnIndex,
            objectType: objectType,
            parentContext: parentContext,
            isCreatePrevented: true,
            path: parentContext.path + '/create'
        };
        return Promise.all([
            Promise.all(_.map(_.values(this.vmRepository.DEVICE_TYPE), function (type) { return _this.vmRepository.getNewVmDeviceForType(type); })),
            this.modelDescriptorService.getUiDescriptorForType(objectType)
        ]).spread(function (vmdevices, uiDescriptor) {
            context.object = _.compact(vmdevices);
            context.userInterfaceDescriptor = uiDescriptor;
            return self.updateStackWithContext(stack, context);
        });
    };
    VmsRoute.prototype.createDevice = function (deviceType, stack) {
        var self = this, objectType = model_1.Model.VmDevice, columnIndex = 3, parentContext = stack[columnIndex], context = {
            columnIndex: columnIndex,
            objectType: objectType,
            parentContext: parentContext,
            path: parentContext.path + '/' + encodeURIComponent(deviceType)
        };
        return Promise.all([
            this.modelDescriptorService.getUiDescriptorForType(objectType)
        ]).spread(function (uiDescriptor) {
            context.object = _.find(parentContext.object, { _tmpId: deviceType });
            context.userInterfaceDescriptor = uiDescriptor;
            return self.updateStackWithContext(stack, context);
        });
    };
    VmsRoute.prototype.getVolumes = function (stack) {
        var self = this, objectType = model_1.Model.VmVolume, columnIndex = 2, parentContext = stack[columnIndex - 1], context = {
            columnIndex: columnIndex,
            objectType: objectType,
            parentContext: parentContext,
            path: parentContext.path + '/volumes'
        };
        return Promise.all([
            this.modelDescriptorService.getUiDescriptorForType(objectType)
        ]).spread(function (uiDescriptor) {
            context.object = _.forEach(parentContext.object._volumeDevices, function (device) { return device._objectType = objectType; });
            context.userInterfaceDescriptor = uiDescriptor;
            return self.updateStackWithContext(stack, context);
        });
    };
    VmsRoute.prototype.getVolume = function (volumeId, stack) {
        var self = this, objectType = model_1.Model.VmVolume, columnIndex = 3, parentContext = stack[columnIndex - 1], context = {
            columnIndex: columnIndex,
            objectType: objectType,
            parentContext: parentContext,
            path: parentContext.path + '/vm-volume/_/' + encodeURIComponent(volumeId)
        };
        return Promise.all([
            this.modelDescriptorService.getUiDescriptorForType(objectType)
        ]).spread(function (uiDescriptor) {
            context.object = _.find(parentContext.object, { id: volumeId });
            context.userInterfaceDescriptor = uiDescriptor;
            return self.updateStackWithContext(stack, context);
        });
    };
    VmsRoute.prototype.createVolume = function (stack) {
        var self = this, objectType = model_1.Model.VmVolume, columnIndex = 3, parentContext = stack[columnIndex - 1], context = {
            columnIndex: columnIndex,
            objectType: objectType,
            parentContext: parentContext,
            path: parentContext.path + '/create'
        };
        return Promise.all([
            this.vmRepository.getNewVmVolume(),
            this.modelDescriptorService.getUiDescriptorForType(objectType)
        ]).spread(function (vmvolume, uiDescriptor) {
            context.object = vmvolume;
            context.userInterfaceDescriptor = uiDescriptor;
            return self.updateStackWithContext(stack, context);
        });
    };
    return VmsRoute;
}(abstract_route_1.AbstractRoute));
exports.VmsRoute = VmsRoute;

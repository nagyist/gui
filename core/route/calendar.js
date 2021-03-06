"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Promise = require("bluebird");
var event_dispatcher_service_1 = require("../service/event-dispatcher-service");
var model_descriptor_service_1 = require("../service/model-descriptor-service");
var sectionsDescriptors = require("../../data/sections-descriptors.json");
var calendar_repository_1 = require("../repository/calendar-repository");
var _ = require("lodash");
var model_event_name_1 = require("../model-event-name");
var abstract_route_1 = require("./abstract-route");
var model_1 = require("../model");
var CalendarRoute = (function (_super) {
    __extends(CalendarRoute, _super);
    function CalendarRoute(modelDescriptorService, eventDispatcherService, calendarRepository) {
        var _this = _super.call(this, eventDispatcherService) || this;
        _this.modelDescriptorService = modelDescriptorService;
        _this.calendarRepository = calendarRepository;
        return _this;
    }
    CalendarRoute.getInstance = function () {
        if (!CalendarRoute.instance) {
            CalendarRoute.instance = new CalendarRoute(model_descriptor_service_1.ModelDescriptorService.getInstance(), event_dispatcher_service_1.EventDispatcherService.getInstance(), calendar_repository_1.CalendarRepository.getInstance());
        }
        return CalendarRoute.instance;
    };
    CalendarRoute.prototype.get = function () {
        var self = this, objectType = model_1.Model.Calendar, sectionDescriptor = sectionsDescriptors.calendar, servicePromise;
        if (this.calendarService) {
            servicePromise = Promise.resolve(this.calendarService);
        }
        else {
            servicePromise = Promise.resolve().then(function () {
                return require.async(sectionDescriptor.service);
            }).then(function (module) {
                var exports = Object.keys(module);
                if (exports.length === 1) {
                    var clazz = module[exports[0]], instance = clazz.instance || new clazz(), instancePromise = instance.instanciationPromise;
                    self.calendarService = instance;
                    return instancePromise;
                }
            }).then(function (service) {
                service.sectionGeneration = 'new';
                service.section.id = sectionDescriptor.id;
                service.section.settings.id = sectionDescriptor.id;
                service.section.label = sectionDescriptor.label;
                service.section.icon = sectionDescriptor.icon;
                return service;
            });
        }
        if (Promise.is(servicePromise)) {
            return servicePromise.then(function (service) {
                return [
                    service,
                    self.modelDescriptorService.getUiDescriptorForType(objectType)
                ];
            }).spread(function (service, uiDescriptor) {
                var stack = [
                    {
                        object: service.entries[0],
                        userInterfaceDescriptor: uiDescriptor,
                        columnIndex: 0,
                        objectType: objectType,
                        path: '/' + sectionDescriptor.id
                    }
                ];
                self.eventDispatcherService.dispatch('sectionChange', service);
                self.eventDispatcherService.dispatch('pathChange', stack);
                return stack;
            }, function (error) {
                console.warn(error.message);
            });
        }
    };
    CalendarRoute.prototype.getTask = function (calendarTaskId, stack) {
        var self = this, objectType = model_1.Model.CalendarTask, columnIndex = 1, parentContext = stack[columnIndex - 1], context = {
            columnIndex: columnIndex,
            objectType: objectType,
            parentContext: parentContext,
            path: parentContext.path + '/calendar-task/_/' + encodeURIComponent(calendarTaskId)
        };
        return Promise.all([
            this.calendarRepository.listTasks(),
            this.modelDescriptorService.getUiDescriptorForType(objectType)
        ]).spread(function (calendarTasks, uiDescriptor) {
            context.object = _.find(calendarTasks, { id: calendarTaskId });
            context.userInterfaceDescriptor = uiDescriptor;
            while (stack.length > columnIndex) {
                var context_1 = stack.pop();
                if (context_1 && context_1.changeListener) {
                    self.eventDispatcherService.removeEventListener(model_event_name_1.ModelEventName[context_1.objectType].listChange, context_1.changeListener);
                }
            }
            stack.push(context);
            return stack;
        });
    };
    CalendarRoute.prototype.createTask = function (taskType, stack) {
        var self = this, objectType = model_1.Model.CalendarTask, columnIndex = 1, parentContext = stack[columnIndex - 1], context = {
            columnIndex: columnIndex,
            objectType: objectType,
            parentContext: parentContext,
            path: parentContext.path + '/calendar-task/create/' + encodeURIComponent(taskType)
        };
        return Promise.all([
            this.modelDescriptorService.getUiDescriptorForType(objectType)
        ]).spread(function (uiDescriptor) {
            context.object = parentContext.object._newTask;
            context.userInterfaceDescriptor = uiDescriptor;
            return self.updateStackWithContext(stack, context);
        });
    };
    return CalendarRoute;
}(abstract_route_1.AbstractRoute));
exports.CalendarRoute = CalendarRoute;

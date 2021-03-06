"use strict";
var event_dispatcher_service_1 = require("../service/event-dispatcher-service");
var model_descriptor_service_1 = require("../service/model-descriptor-service");
var AbstractRepository = (function () {
    function AbstractRepository(subscribedStateChanges, subscribedEvents) {
        if (subscribedStateChanges === void 0) { subscribedStateChanges = []; }
        if (subscribedEvents === void 0) { subscribedEvents = []; }
        this.eventDispatcherService = event_dispatcher_service_1.EventDispatcherService.getInstance();
        this.modelDescriptorService = model_descriptor_service_1.ModelDescriptorService.getInstance();
        var self = this;
        var _loop_1 = function (subscribedStateChange) {
            this_1.eventDispatcherService.addEventListener('stateChange', function (data) {
                self.dispatchStateChange(subscribedStateChange, data);
            });
        };
        var this_1 = this;
        for (var _i = 0, subscribedStateChanges_1 = subscribedStateChanges; _i < subscribedStateChanges_1.length; _i++) {
            var subscribedStateChange = subscribedStateChanges_1[_i];
            _loop_1(subscribedStateChange);
        }
        var _loop_2 = function (subscribedEvent) {
            this_2.eventDispatcherService.addEventListener(subscribedEvent, function (data) {
                self.handleEvent(subscribedEvent, data);
            });
        };
        var this_2 = this;
        for (var _a = 0, subscribedEvents_1 = subscribedEvents; _a < subscribedEvents_1.length; _a++) {
            var subscribedEvent = subscribedEvents_1[_a];
            _loop_2(subscribedEvent);
        }
    }
    AbstractRepository.prototype.dispatchStateChange = function (name, state) {
        if (state.has(name)) {
            if (!this.previousState || this.previousState.get(name) !== state.get(name)) {
                this.previousState = state;
                this.handleStateChange(name, state.get(name));
            }
        }
    };
    AbstractRepository.prototype.dispatchModelEvents = function (repositoryEntries, modelEventName, state) {
        var self = this, hasListContentChanged = false;
        this.eventDispatcherService.dispatch(modelEventName.listChange, state);
        state.forEach(function (stateEntry, id) {
            if (!repositoryEntries || !repositoryEntries.has(id)) {
                self.eventDispatcherService.dispatch(modelEventName.add(id), stateEntry);
                hasListContentChanged = true;
            }
            else if (repositoryEntries.get(id) !== stateEntry) {
                self.eventDispatcherService.dispatch(modelEventName.change(id), stateEntry);
            }
        });
        if (repositoryEntries) {
            repositoryEntries.forEach(function (repositoryEntry, id) {
                if (!state.has(id) || state.get(id) !== repositoryEntry) {
                    self.eventDispatcherService.dispatch(modelEventName.remove(id), repositoryEntry);
                    hasListContentChanged = true;
                }
            });
        }
        if (hasListContentChanged) {
            this.eventDispatcherService.dispatch(modelEventName.contentChange, state);
        }
        return state;
    };
    return AbstractRepository;
}());
exports.AbstractRepository = AbstractRepository;

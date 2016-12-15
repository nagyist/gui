"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var uuid = require("node-uuid");
var event_dispatcher_service_1 = require("./event-dispatcher-service");
var model_event_name_1 = require("../model-event-name");
var Promise = require("bluebird");
var _ = require("lodash");
var MiddlewareClient = (function () {
    function MiddlewareClient(eventDispatcherService) {
        this.eventDispatcherService = eventDispatcherService;
        this.REQUEST_TIMEOUT = 90000;
        this.KEEPALIVE_MSG = '{"namespace": "rpc", "name": "call", "id": "${ID}", "args": {"method": "session.whoami", "args": []}}';
        this.KEEPALIVE_PERIOD = 30000;
        this.handlers = new Map();
    }
    MiddlewareClient.getInstance = function () {
        if (!MiddlewareClient.instance) {
            MiddlewareClient.instance = new MiddlewareClient(event_dispatcher_service_1.EventDispatcherService.getInstance());
        }
        return MiddlewareClient.instance;
    };
    MiddlewareClient.prototype.connect = function (url) {
        if (this.socket) {
            if (this.socket.url !== url && this.socket.readyState === this.socket.OPEN) {
                this.closeConnection();
            }
            this.socket = null;
        }
        return this.openConnection(url);
    };
    MiddlewareClient.prototype.login = function (login, password) {
        var self = this;
        return this.connectionPromise.then(function () {
            var payload = {
                namespace: 'rpc',
                name: 'auth',
                args: {
                    username: login,
                    password: password
                }
            };
            return self.send(payload);
        }).then(function (message) {
            return self.startKeepAlive();
        }, function (error) {
            if (error) {
                if (error.name === 'MiddlewareError') {
                    var message = error.message;
                    if (message.args) {
                        if (message.args.code === 13) {
                            throw new Error(message.args.message);
                        }
                    }
                }
            }
        });
    };
    MiddlewareClient.prototype.callRpcMethod = function (name, args) {
        var self = this;
        return this.connectionPromise.then(function () {
            var payload = {
                namespace: 'rpc',
                name: 'call',
                args: {
                    method: name,
                    args: args || []
                }
            };
            return self.send(payload);
        });
    };
    MiddlewareClient.prototype.submitTask = function (name, args) {
        var self = this;
        return this.callRpcMethod("task.submit", [
            name,
            args || []
        ]).then(function (taskId) {
            return {
                taskId: taskId,
                taskPromise: new Promise(function (resolve, reject) {
                    var eventListener = self.eventDispatcherService.addEventListener(model_event_name_1.ModelEventName.Task.change(taskId), function (task) {
                        if (task.get('state') === 'FINISHED') {
                            resolve(task.get('result'));
                            self.eventDispatcherService.removeEventListener(model_event_name_1.ModelEventName.Task.change(taskId), eventListener);
                        }
                        else if (task.get('state') === 'FAILED') {
                            reject(task.get('error').toJS());
                            self.eventDispatcherService.removeEventListener(model_event_name_1.ModelEventName.Task.change(taskId), eventListener);
                        }
                    });
                })
            };
        });
    };
    MiddlewareClient.prototype.submitTaskWithDownload = function (name, args) {
        var self = this;
        return this.callRpcMethod("task.submit_with_download", [
            name,
            args || []
        ]).then(function (response) {
            var taskId = response[0];
            return {
                taskId: taskId,
                taskPromise: new Promise(function (resolve, reject) {
                    var eventListener = self.eventDispatcherService.addEventListener(model_event_name_1.ModelEventName.Task.change(taskId), function (task) {
                        if (task.get('state') === 'FINISHED') {
                            resolve(task.get('result'));
                            self.eventDispatcherService.removeEventListener(model_event_name_1.ModelEventName.Task.change(taskId), eventListener);
                        }
                        else if (task.get('state') === 'FAILED') {
                            reject(task.get('error').toJS());
                            self.eventDispatcherService.removeEventListener(model_event_name_1.ModelEventName.Task.change(taskId), eventListener);
                        }
                    });
                }),
                link: self.getRootURL('http') + response[1][0]
            };
        });
    };
    MiddlewareClient.prototype.submitTaskWithUpload = function (name, args, file) {
        var self = this;
        return this.callRpcMethod('task.submit_with_upload', _.concat([name], args)).then(function (response) {
            var token = Array.isArray(response) ? response[1][0] : response;
            self.sendFileWithToken(file, token);
        });
    };
    MiddlewareClient.prototype.uploadFile = function (file, destination, mode) {
        if (mode === void 0) { mode = '755'; }
        var self = this;
        return this.callRpcMethod('filesystem.upload', ["/root/" + file.name, file.size, mode]).then(function (response) {
            var token = Array.isArray(response) ? response[1][0] : response;
            self.sendFileWithToken(file, token);
        });
    };
    MiddlewareClient.prototype.sendFileWithToken = function (file, token) {
        var self = this, connection = new WebSocket(self.getRootURL('ws') + '/dispatcher/file'), BUFSIZE = 1024;
        connection.onopen = function () {
            var filePos = 0;
            connection.send(JSON.stringify({ token: token }));
            while (filePos + BUFSIZE <= file.size) {
                self.sendChunkOnConnection(connection, file, filePos, filePos + BUFSIZE);
                filePos = filePos + BUFSIZE;
            }
            if (filePos < file.size) {
                self.sendChunkOnConnection(connection, file, filePos, file.size);
            }
        };
    };
    MiddlewareClient.prototype.sendChunkOnConnection = function (connection, file, start, stop) {
        start = parseInt(start) || 0;
        stop = parseInt(stop) || file.size;
        var reader = new FileReader();
        reader.onloadend = function (event) {
            var target = event.target;
            if (target.readyState === FileReader.DONE) {
                connection.send(target.result);
                if (stop === file.size) {
                    connection.send("");
                }
            }
        };
        var blob = file.slice(start, stop);
        reader.readAsArrayBuffer(blob);
    };
    MiddlewareClient.prototype.subscribeToEvents = function (name) {
        return this.setEventSubscription(name, 'subscribe');
    };
    MiddlewareClient.prototype.unsubscribeFromEvents = function (name) {
        return this.setEventSubscription(name, 'unsubscribe');
    };
    MiddlewareClient.prototype.setEventSubscription = function (name, status) {
        var self = this, payload = {
            namespace: 'events',
            name: status,
            id: uuid.v4(),
            args: [name]
        };
        return this.connectionPromise.then(function () {
            return self.socket.send(JSON.stringify(payload));
        });
    };
    MiddlewareClient.prototype.startKeepAlive = function () {
        var self = this;
        this.keepAliveInterval = setInterval(function () { return self.socket.send(self.KEEPALIVE_MSG.replace('${ID}', uuid.v4())); }, this.KEEPALIVE_PERIOD);
    };
    MiddlewareClient.prototype.stopKeepalive = function () {
        if (this.keepAliveInterval) {
            clearInterval(this.keepAliveInterval);
            this.keepAliveInterval = null;
        }
    };
    MiddlewareClient.prototype.send = function (payload) {
        var self = this;
        return this.connectionPromise.then(function () {
            var resolve, reject, promise = new Promise(function (_resolve, _reject) {
                resolve = _resolve;
                reject = _reject;
            });
            payload.id = uuid.v4();
            self.socket.send(JSON.stringify(payload));
            self.handlers.set(payload.id, {
                resolve: resolve,
                reject: reject,
                promise: promise
            });
            return promise.timeout(self.REQUEST_TIMEOUT).catch(function (error) {
                if (error) {
                    if (error.name === 'TimeoutError') {
                        console.log('[' + self.url + '] Request timeout: ' + JSON.stringify(payload));
                        self.handlers.get(payload.id).reject();
                        self.handlers.delete(payload.id);
                    }
                }
                console.log(error);
                throw error;
            });
        });
    };
    MiddlewareClient.prototype.closeConnection = function () {
        console.log('Closing connection to ' + this.socket.url);
        this.stopKeepalive();
        this.socket.close(1000);
    };
    MiddlewareClient.prototype.openConnection = function (url) {
        var self = this;
        if (!this.socket) {
            this.connectionPromise = new Promise(function (resolve) {
                console.log('Opening connection to ' + url);
                self.socket = new WebSocket(url);
                self.stopKeepalive();
                self.socket.onopen = resolve;
                self.socket.onmessage = function (event) { return self.handleMessage(event); };
                self.socket.onerror = function (event) { return self.handleError(event); };
                self.socket.onclose = function (event) { return self.handleClose(event); };
            }).then(function () {
                return self.dispatchConnectionStatus();
            });
        }
        return this.connectionPromise;
    };
    MiddlewareClient.prototype.dispatchConnectionStatus = function () {
        this.eventDispatcherService.dispatch('connectionStatusChange', this.socket ? this.socket.status : 99);
    };
    MiddlewareClient.prototype.handleError = function (event) {
        console.warn('[' + event.currentTarget.url + '] WS connection error:', event);
        this.dispatchConnectionStatus();
        this.stopKeepalive();
        this.connectionPromise = null;
        this.socket = null;
    };
    MiddlewareClient.prototype.handleClose = function (event) {
        console.log('[' + event.currentTarget.url + '] WS connection closed', event);
        this.dispatchConnectionStatus();
        this.stopKeepalive();
        this.connectionPromise = null;
        this.socket = null;
    };
    MiddlewareClient.prototype.handleMessage = function (event) {
        try {
            var message = JSON.parse(event.data);
            if (message.namespace === 'rpc') {
                if (message.name === 'response') {
                    this.handleRpcResponse(message);
                }
                else if (message.name == 'error') {
                    this.handleRpcError(message);
                }
            }
            else if (message.namespace === 'events' && message.name === 'event') {
                this.handleEvent(message);
            }
        }
        catch (error) {
            console.warn('[' + event.currentTarget.url + '] Unable to parse message: -' + event.data + '-');
        }
    };
    MiddlewareClient.prototype.handleRpcResponse = function (message) {
        if (this.handlers.has(message.id)) {
            var deferred = this.handlers.get(message.id);
            this.handlers.delete(message.id);
            deferred.resolve(message.args);
        }
    };
    MiddlewareClient.prototype.handleRpcError = function (message) {
        if (this.handlers.has(message.id)) {
            var deferred = this.handlers.get(message.id);
            this.handlers.delete(message.id);
            deferred.reject(new MiddlewareError(message));
        }
    };
    MiddlewareClient.prototype.handleEvent = function (message) {
        if (message.args.name.indexOf('entity-subscriber.') === 0) {
            this.eventDispatcherService.dispatch('middlewareModelChange', message.args.args);
        }
        else if (message.args.name.indexOf('statd.') === 0) {
            this.eventDispatcherService.dispatch('statsChange', message.args);
        }
    };
    MiddlewareClient.prototype.getRootURL = function (protocol) {
        var scheme = protocol + (location.protocol === 'https:' ? 's' : ''), host = this.getHost();
        return scheme + "://" + host;
    };
    MiddlewareClient.prototype.getHost = function () {
        var result = location.host, hostParam = location.href.split(';').filter(function (x) { return x.split('=')[0] === 'host'; })[0];
        if (hostParam) {
            var host = hostParam.split('=')[1];
            if (host && host.length > 0) {
                result = host;
            }
        }
        return result;
    };
    return MiddlewareClient;
}());
exports.MiddlewareClient = MiddlewareClient;
var MiddlewareError = (function (_super) {
    __extends(MiddlewareError, _super);
    function MiddlewareError(middlewareMessage) {
        var _this = _super.call(this) || this;
        _this.name = 'MiddlewareError';
        _this.message = middlewareMessage.args.message;
        _this.middlewareMessage = middlewareMessage;
        return _this;
    }
    return MiddlewareError;
}(Error));
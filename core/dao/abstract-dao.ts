import { MiddlewareClient } from '../service/middleware-client';
import { DatastoreService } from '../service/datastore-service';
import { processor as taskProcessor } from '../service/data-processor/methodCleaner';
import { processor as cleaningProcessor } from '../service/data-processor/cleaner';
import { processor as diffProcessor } from '../service/data-processor/diff';
import { processor as nullProcessor } from '../service/data-processor/null';
import * as _ from 'lodash';
import * as Promise from 'bluebird';
import {ModelDescriptorService} from '../service/model-descriptor-service';

export class AbstractDao {
    protected middlewareClient: MiddlewareClient;
    protected datastoreService: DatastoreService;
    protected modelDescriptorService: ModelDescriptorService;

    private listPromise: Promise<Array<any>>;
    private propertyDescriptorsPromise: Promise<any>;
    private taskDescriptorsPromise: Map<string, Promise<any>>;

    private middlewareName: string;
    private objectType: string;
    private queryMethod: string;
    private createMethod: string;
    private updateMethod: string;
    private deleteMethod: string;
    private eventName: string;
    private preventQueryCaching: boolean;
    private isRegistered = false;

    public constructor(objectType: any, config?: any) {
        config = config || {};
        this.objectType = config.typeName || objectType;
        this.middlewareName = config.middlewareName || _.kebabCase(objectType);
        this.queryMethod = config.queryMethod || AbstractDao.dotCase(objectType) + '.query';
        this.updateMethod = config.updateMethod || AbstractDao.dotCase(objectType) + '.update';
        this.createMethod = config.createMethod || AbstractDao.dotCase(objectType) + '.create';
        this.deleteMethod = config.deleteMethod || AbstractDao.dotCase(objectType) + '.delete';
        this.eventName = config.eventName || 'entity-subscriber.' + this.middlewareName + '.changed';
        this.preventQueryCaching = config.preventQueryCaching;
        this.middlewareClient = MiddlewareClient.getInstance();
        this.datastoreService = DatastoreService.getInstance();
        this.modelDescriptorService = ModelDescriptorService.getInstance();
        this.taskDescriptorsPromise = new Map<string, Promise<any>>();
    }

    public list(): Promise<Array<any>> {
        return (this.listPromise && !this.preventQueryCaching) ?
            this.listPromise :
            this.listPromise = this.query();
    }

    public get(): Promise<any> {
        return this.list().then((x) => x[0]);
    }

    public findSingleEntry(criteria: any, params?: any): Promise<any> {
        params = params || {};
        params.single = true;
        return this.query(criteria, params).then(function(results) {
            return results[0];
        });
    }

    public find(criteria?: any, params?: any): Promise<any> {
        criteria = criteria || {};
        params = params || {};
        return this.query(criteria, params).then(function(results) {
            return results;
        });
    }

    public register() {
        if (!this.isRegistered) {
            this.middlewareClient.subscribeToEvents(this.eventName);
            this.isRegistered = true;
        }
    }

    public save(object: any, args?: Array<any>): Promise<any> {
        return object._isNew ? this.create(object, args) : this.update(object, args);
    }

    public delete(object: any, args?: Array<any>) {
        args = args || [];
        return this.middlewareClient.submitTask(this.deleteMethod, _.concat([object.id], args));
    }

    public getNewInstance(): Promise<any> {
        let self = this;
        return Promise.resolve(new Object({
            _isNew: true,
            _objectType: self.objectType
        }));
    }

    public getEmptyList(): Promise<Array<any>> {
        let self = this;
        let emptyList: any = [];
        emptyList._objectType = self.objectType;
        return Promise.resolve(emptyList);
    }

    private update(object: any, args?: Array<any>): Promise<any> {
        args = args || [];
        return Promise.all([
            this.loadPropertyDescriptors(),
            this.loadTaskDescriptor(this.updateMethod)
        ]).spread((propertyDescriptors, methodDescriptor) => {
            let update = taskProcessor.process(
                    diffProcessor.process(
                        cleaningProcessor.process(
                            object,
                            propertyDescriptors
                        ),
                    this.objectType,
                    object.id
                ),
                methodDescriptor
            );
            if (update || (args && args.length > 0)) {
                let payload = _.concat(object.id ? [object.id, update] : [update], args);
                return this.middlewareClient.submitTask(this.updateMethod, payload);
            }
        });
    }

    private create(object: any, args?: Array<any>): Promise<any> {
        args = args || [];
        return Promise.all([
            this.loadPropertyDescriptors(),
            this.loadTaskDescriptor(this.createMethod)
        ]).spread((propertyDescriptors, methodDescriptor) => {
            let newObject = taskProcessor.process(
                nullProcessor.process(
                    cleaningProcessor.process(
                        object,
                        propertyDescriptors
                    )
                ),
                methodDescriptor
            );
            if (newObject) {
                return this.middlewareClient.submitTask(this.createMethod, _.concat([newObject], args));
            }
        });
    }

    private query(criteria?: any, isSingle?: boolean): Promise<any> {
        let self = this,
            middlewareCriteria = criteria ? this.getMiddlewareCriteria(criteria, isSingle) : [];
        return this.datastoreService.query(self.objectType, self.queryMethod, middlewareCriteria).then(
            (entries) => {
                entries = Array.isArray(entries) ? entries : [entries];
                self.register();
                let results: any = entries.map((x: any) => {
                    x._objectType = self.objectType;
                    return x;
                });
                results._objectType = self.objectType;
                return results;
            }
        );
    }

    private getMiddlewareCriteria(criteria: Object, params?: Object): Array<any> {
        let keys = Object.keys(criteria),
            middlewareCriteria = [],
            key, value;
        for (let i = 0, length = keys.length; i < length; i++) {
            key = keys[i];
            value = criteria[key];
            if (typeof value === 'object') {
                let subCriteria = this.getMiddlewareCriteria(value);
                Array.prototype.push.apply(middlewareCriteria, subCriteria.map(function(x) { return [key + '.' + x[0], x[1], x[2]]; }));
            } else {
                middlewareCriteria.push([key, '=', value]);
            }
        }
        return params ? [middlewareCriteria, params] : [middlewareCriteria];
    }

    private static dotCase(aString: string) {
        return _.replace(_.snakeCase(aString), '_', '.');
    }

    private loadTaskDescriptor(method: string): Promise<Map<string, any>> {
        if (!this.taskDescriptorsPromise.has(method)) {
            this.taskDescriptorsPromise.set(method, this.modelDescriptorService.getTaskDescriptor(method));
        }
        return this.taskDescriptorsPromise.get(method);

    }

    private loadPropertyDescriptors(): Promise<any> {
        if (!this.propertyDescriptorsPromise) {
            this.propertyDescriptorsPromise = this.modelDescriptorService.getPropertyDescriptorsForType(this.objectType);
        }
        return this.propertyDescriptorsPromise;
    }
}

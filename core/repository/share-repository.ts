import { AbstractRepository } from './abstract-repository-ng';
import { ShareDao } from '../dao/share-dao';
import {ModelEventName} from '../model-event-name';
import {Map} from 'immutable';
import Promise = require('bluebird');
import {Model} from '../model';
import {PermissionsDao} from '../dao/permissions-dao';

export class ShareRepository extends AbstractRepository {
    private static instance: ShareRepository;
    private shares: Map<string, Map<string, any>>;

    private constructor(private shareDao: ShareDao,
                        private permissionsDao: PermissionsDao) {
        super([Model.Share]);
    }

    public static getInstance() {
        if (!ShareRepository.instance) {
            ShareRepository.instance = new ShareRepository(
                new ShareDao(),
                new PermissionsDao()
            );
        }
        return ShareRepository.instance;
    }

    public listShares(): Promise<Array<Object>> {
        return this.shares ? Promise.resolve(this.shares.valueSeq().toJS()) : this.shareDao.list();
    }

    public getNewShare(volume, shareType) {
        return this.shareDao.getNewInstance().then(function(share) {
            share._isNewObject = true;
            share._tmpId = shareType;
            share._volume = volume;
            share.type = shareType;
            share.enabled = true;
            share.description = '';

            return share;
        });
    }

    public saveShare(object: any, isServiceEnabled: boolean) {
        return this.shareDao.save(object, object._isNew ? [null, isServiceEnabled] : [isServiceEnabled]);
    }

    public getNewPermissions() {
        return this.permissionsDao.getNewInstance().then((permissions) => {
            permissions.user = {};
            permissions.group = {};
            permissions.others = {};
            return permissions;
        });
    }

    protected handleStateChange(name: string, state: any) {
        this.shares = this.dispatchModelEvents(this.shares, ModelEventName.Share, state);
    }

    protected handleEvent(name: string, data: any) {}
}




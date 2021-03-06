import {AbstractDao} from "./abstract-dao";import {Model} from '../model';
import { processor as cleaningProcessor } from '../service/data-processor/cleaner';
import { processor as diffProcessor } from '../service/data-processor/diff';
import { processor as nullProcessor } from '../service/data-processor/null';

export class SystemUiDao extends AbstractDao {
    public constructor() {
        super(Model.SystemUi, {
            queryMethod: 'system.ui.get_config'
        });
    }

    public save(object: any, args?: Array<any>) {
        let update = nullProcessor.process(
            diffProcessor.process(
                cleaningProcessor.process(
                    object,
                    this.propertyDescriptors
                ),
                'SystemUi',
                object.id
            )
        );
        if (update || (args && args.length > 0)) {
            return this.middlewareClient.submitTask('system.ui.update', [update]);
        }
    }
}

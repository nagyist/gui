import { AbstractDao } from './abstract-dao';
import * as systemSections from '../../data/system-sections.json';
import * as Promise from "bluebird";
import {Model} from "../model";

export class SystemSectionDao extends AbstractDao {

    public constructor() {
        super(Model.SystemSection);
    }

    public list(): Promise<Array<any>> {
        let self = this;
        return Promise.all(
            systemSections.map(function(definition, index) {
                return self.getNewInstance().then(function(systemSection) {
                    systemSection._isNew = false;
                    systemSection.id = systemSection.identifier = definition.id;
                    systemSection.label = definition.label;
                    systemSection.icon = definition.icon;
                    systemSection.order = index;
                    return systemSection;
                });
            })
        );
    }
}

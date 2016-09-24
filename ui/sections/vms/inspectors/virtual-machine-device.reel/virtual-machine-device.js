var AbstractInspector = require("ui/abstract/abstract-inspector").AbstractInspector,
    Model = require("core/model/model").Model,
    VmConfigBootloader = require("core/model/enumerations/vm-config-bootloader").VmConfigBootloader,
    VmDeviceType = require("core/model/enumerations/vm-device-type").VmDeviceType,
    CascadingList = require("ui/controls/cascading-list.reel").CascadingList,
    Promise = require("montage/core/promise").Promise,
    VmsSectionService = require("core/service/section/vms-section-service").VmsSectionService;

/**
 * @class VirtualMachineDevice
 * @extends Component
 */
exports.VirtualMachineDevice = AbstractInspector.specialize({

    _object: {
        value: null
    },

    object: {
        get: function() {
            return this._object;
        },
        set: function(object) {
            if (this._object !== object) {
                this._object = object;
                if (object) {
                    if (object.Type === Model.VmVolume) {
                        object.type = 'VOLUME'
                    }
                    if (!object.properties) {
                        object.properties = {};
                    }
                }
            }
        }
    },

    templateDidLoad: {
        value: function() {
            this._sectionService = VmsSectionService.instance;
        }
    },

    enterDocument: {
        value: function() {
            this.$super.enterDocument();
            if (this.object._isNew) {
                this._sectionService.initializeNewDevice(this.object);
            }
            this._vm = this.context.parentContext.parentContext.object;
            this._parentColumn = this.context.parentContext.cascadingListItem;
        }
    },

    save: {
        value: function() {
            this._sectionService.addNewDeviceToVm(this._vm, this.object);
            this._parentColumn.selectedObject = null;
        }
    },

    delete: {
        value: function() {
            this._sectionService.removeDeviceFromVm(this._vm, this.object);
        }
    }
});

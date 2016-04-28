/**
 * @module ui/snapshot.reel
 */
var Component = require("montage/ui/component").Component;

/**
 * @class Snapshot
 * @extends Component
 */
exports.Snapshot = Component.specialize(/** @lends Snapshot# */ {
    lifetime: {
        get: function() {
            return this.object.lifetime;
        },
        set: function(lifetime) {
            if (this.object) {
                if (lifetime && lifetime.length > 0) {
                    this.object.lifetime = +lifetime;
                } else {
                    this.object.lifetime = null
                }
            }
        }
    }
});

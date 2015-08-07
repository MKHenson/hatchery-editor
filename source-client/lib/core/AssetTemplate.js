define(["require", "exports"], function (require, exports) {
    var Animate;
    (function (Animate) {
        /**
        * The AssetTemplate object is used to define what assets are available to the scene.
        * Assets are predefined tempaltes of data that can be instantiated. The best way to think of an asset
        * is to think of it as a predefined object that contains a number of variables. You could for example
        * create Assets like cats, dogs, animals or humans. Its really up you the plugin writer how they want
        * to define their assets. This function can return null if no Assets are required.
        */
        var AssetTemplate = (function () {
            /**
            * @param {IPlugin} plugin The plugin who created this template
            */
            function AssetTemplate(plugin) {
                this.plugin = plugin;
                this.classes = [];
            }
            /**
            * Adds a class to this template
            * @param {string} name The name of the class
            * @param {string} img The optional image
            * @param {boolean} abstractClass A boolean to define if this class is abstract or not.
            * @returns {AssetClass}
            */
            AssetTemplate.prototype.addClass = function (name, img, abstractClass) {
                var toAdd = new AssetClass(name, null, img, abstractClass);
                this.classes.push(toAdd);
                return toAdd;
            };
            /**
            * Removes a class by name
            * @param {string} name The name of the class to remove
            */
            AssetTemplate.prototype.removeClass = function (name) {
                for (var i = 0, l = this.classes.length; i < l; i++)
                    if (this.classes[i].name == name) {
                        this.classes[i].dispose();
                        this.classes.splice(i, 1);
                        return;
                    }
            };
            /**
            * Finds a class by its name. Returns null if nothing is found
            */
            AssetTemplate.prototype.findClass = function (name) {
                var classes = this.classes;
                for (var i = 0, l = classes.length; i < l; i++) {
                    var aClass = classes[i].findClass(name);
                    if (aClass)
                        return aClass;
                }
                return null;
            };
            return AssetTemplate;
        })();
        Animate.AssetTemplate = AssetTemplate;
    })(Animate || (Animate = {}));
});

var Five;
(function (Five) {
    function behaviorAction(caption, group, keyCode, keyModifier, isEnabled, execute) {
        return new BehaviorAction(caption, group, keyCode, keyModifier, isEnabled, execute);
    }
    Five.behaviorAction = behaviorAction;
    var BehaviorAction = (function () {
        function BehaviorAction(caption, group, keyCode, keyModifier, _isEnabled, _execute) {
            this.caption = caption;
            this.group = group;
            this.keyCode = keyCode;
            this.keyModifier = keyModifier;
            this._isEnabled = _isEnabled;
            this._execute = _execute;
        }
        BehaviorAction.prototype.setSelectionProvider = function (provider) {
            this.selectionProvider = provider;
        };
        BehaviorAction.prototype.getKeyCode = function () {
            return this.keyCode;
        };
        BehaviorAction.prototype.getKeyModifier = function () {
            return this.keyModifier;
        };
        BehaviorAction.prototype.isEnabled = function () {
            return this._isEnabled(this.selectionProvider);
        };
        BehaviorAction.prototype.execute = function () {
            this._execute(this.selectionProvider);
        };
        BehaviorAction.prototype.getCaption = function () {
            return this.caption;
        };
        BehaviorAction.prototype.getGroup = function () {
            return this.group;
        };
        return BehaviorAction;
    })();
})(Five || (Five = {}));
//# sourceMappingURL=Behavior.js.map
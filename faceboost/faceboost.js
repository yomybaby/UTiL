var _ = _ || require((typeof ENV_TEST === 'boolean') ? 'alloy' : 'underscore')._;

facebook = require('facebook');
facebook.appid = Ti.App.Properties.getString('ti.facebook.appid');

facebook.retrievePermissions = function(_callback) {

    this.requestWithGraphPath('/me/permissions', {}, 'GET', function(FacebookGraphResponse) {

        if (!FacebookGraphResponse.success) {
            _callback(FacebookGraphResponse);
            return;
        }

        _callback({
            success: true,
            permissions: _.keys(JSON.parse(FacebookGraphResponse.result).data[0])
        });
    });
};

facebook.hasPermissions = function(_permissions, _callback) {

    if (_.isString(_permissions)) {
        _permissions = [_permissions];
    }

    this.retrievePermissions(function(_response) {

        if (!_response.success) {
            _callback(_response);
            return;
        }

        var missing = _.difference(_permissions, _response.permissions);

        _callback({
            success: missing.length === 0,
            missing: missing
        });
    });
};

facebook.requestPermissions = function(_permissions, _scope, _callback) {
    var self = this;

    if (_.isString(_permissions)) {
        _permissions = [_permissions];
    }

    if (!_.isString(_scope)) {
        _scope = 'friends';
    }

    this.hasPermissions(_permissions, function(_response) {

        // We have them all or failed retrieving
        if (_response.success || !_response.found) {
            _callback(_response);
            return;
        }

        self.reauthorize(_response.missing, _scope, function(FacebookReauthResponse) {

            if (!FacebookReauthResponse.success) {
                _callback(FacebookReauthResponse);
                return;
            }

            self.hasPermissions(_response.missing, _callback);
        });
    });
};

module.exports = facebook;
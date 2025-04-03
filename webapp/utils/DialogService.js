sap.ui.define([
    "sap/ui/core/Fragment"
], function(Fragment) {
    "use strict";

    return {
        _pDialogs: {},

        openDialog: function(oView, sFragmentName) {
            if (!this._pDialogs[sFragmentName]) {
                this._pDialogs[sFragmentName] = Fragment.load({
                    id: oView.getId(),
                    name: sFragmentName,
                    controller: oView.getController()
                }).then(function(oDialog) {
                    oView.addDependent(oDialog);
                    return oDialog;
                });
            }
            
            return this._pDialogs[sFragmentName].then(function(oDialog) {
                oDialog.open();
                return oDialog;
            });
        },

        closeDialog: function(sFragmentName) {
            if (this._pDialogs[sFragmentName]) {
                this._pDialogs[sFragmentName].then(function(oDialog) {
                    oDialog.close();
                });
            }
        }
    };
});
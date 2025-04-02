sap.ui.define([
    "com/bootcamp/sapui5/finalproject/controller/BaseController"
], function (BaseController) {
    "use strict";

    return BaseController.extend("com.bootcamp.sapui5.finalproject.controller.NotFound", {
        onNavBack() {
            this.getRouter().navTo("home");
        }
    });
});
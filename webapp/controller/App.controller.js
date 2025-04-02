sap.ui.define([
  "com/bootcamp/sapui5/finalproject/controller/BaseController"
], function (BaseController) {
  "use strict";

  return BaseController.extend("com.bootcamp.sapui5.finalproject.controller.App", {
      onInit() {
          // Apply content density mode based on device
          this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
      }
  });
});
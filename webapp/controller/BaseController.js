sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/UIComponent",
    "sap/ui/core/routing/History",
    "sap/ui/model/json/JSONModel"
], function(Controller, UIComponent, History, JSONModel) {
    "use strict";

    return Controller.extend("com.bootcamp.sapui5.finalproject.controller.BaseController", {
        /**
         * Get the component of this controller's view
         */
        getOwnerComponent() {
            return Controller.prototype.getOwnerComponent.apply(this, arguments);
        },

        /**
         * Get the router for this view's component
         */
        getRouter() {
            return UIComponent.getRouterFor(this);
        },

        /**
         * Get the view model by name
         */
        getModel(sName) {
            return this.getView().getModel(sName);
        },

        /**
         * Set the view model
         */
        setModel(oModel, sName) {
            return this.getView().setModel(oModel, sName);
        },

        /**
         * Get the resource bundle
         */
        getResourceBundle() {
            return this.getOwnerComponent().getModel("i18n").getResourceBundle();
        },

        /**
         * Navigate back in the browser history
         * If there is no previous history entry, navigate to the home route
         */
        onNavBack() {
            const sPreviousHash = History.getInstance().getPreviousHash();

            if (sPreviousHash !== undefined) {
                // The history contains a previous entry
                history.go(-1);
            } else {
                // Navigate to home route
                this.getRouter().navTo("home", {}, true);
            }
        },
        
        /**
         * Show a message toast with the given text
         */
        showMessage(sMessage) {
            sap.m.MessageToast.show(sMessage);
        },
        
        /**
         * Create and set a JSON model to the view or component
         */
        createAndSetJSONModel(oData, sName, bGlobal) {
            const oModel = new JSONModel(oData);
            
            if (bGlobal) {
                this.getOwnerComponent().setModel(oModel, sName);
            } else {
                this.setModel(oModel, sName);
            }
            
            return oModel;
        },
        
        /**
         * Handle service errors
         */
        handleServiceError(oError) {
            const sMessage = this.getResourceBundle().getText("errorMessage");
            sap.m.MessageBox.error(sMessage);
            console.error("Service error:", oError);
        }
    });
});
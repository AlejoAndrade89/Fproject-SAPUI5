sap.ui.define([
    "com/bootcamp/sapui5/finalproject/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Fragment",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "../utils/formatter"
], function (BaseController, JSONModel, Fragment, MessageToast, MessageBox, Filter, FilterOperator, formatter) {
    "use strict";

    return BaseController.extend("com.bootcamp.sapui5.finalproject.controller.Detail", {
        
        formatter: formatter,
        
        onInit() {
            // Set up products model for the selected product
            this.createAndSetJSONModel({
                selectedItem: null
            }, "productsModel");
            
            // Set up model for product dialog
            this.createAndSetJSONModel({
                dialogMode: "display", // "display" or "create"
                formData: {
                    ProductID: "",
                    ProductName: "",
                    QuantityPerUnit: "",
                    UnitPrice: 0,
                    UnitsInStock: 0,
                    Discontinued: false
                }
            }, "productDialog");
            
            // Register route pattern matched handler
            this.getRouter().getRoute("detail").attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched(oEvent) {
            const sSupplierID = oEvent.getParameter("arguments").supplierId;
            
            // Bind the view to the supplier details
            const sPath = `/Suppliers(${sSupplierID})`;
            this.getView().bindElement({
                path: sPath,
                events: {
                    dataReceived: this._onDataReceived.bind(this)
                }
            });
        },

        _onDataReceived() {
            // Get supplier data from the bound context
            const oContext = this.getView().getBindingContext();
            
            if (!oContext) {
                // If no data was found, navigate back to the home view
                this.getRouter().navTo("home");
                return;
            }
        },

        onBeforeRebindTable(oEvent) {
            const oBindingParams = oEvent.getParameter("bindingParams");
            const oContext = this.getView().getBindingContext();
            
            if (oContext) {
                const oSupplier = oContext.getObject();
                // Add filter for supplier ID
                oBindingParams.filters.push(new Filter("SupplierID", FilterOperator.EQ, oSupplier.SupplierID));
            }
        },

        onRowSelectionChange(oEvent) {
            const oTable = oEvent.getSource();
            const oSelectedItem = oTable.getSelectedItem();
            
            if (oSelectedItem) {
                const oContext = oSelectedItem.getBindingContext();
                this.getModel("productsModel").setProperty("/selectedItem", oContext.getObject());
            } else {
                this.getModel("productsModel").setProperty("/selectedItem", null);
            }
        },

        onCreateProduct() {
            // Set dialog mode to "create"
            this.getModel("productDialog").setProperty("/dialogMode", "create");
            
            // Reset the form data
            this.getModel("productDialog").setProperty("/formData", {
                ProductID: "",
                ProductName: "",
                QuantityPerUnit: "",
                UnitPrice: 0,
                UnitsInStock: 0,
                Discontinued: false
            });
            
            // Open the product creation dialog
            this._openProductDialog();
        },
        
        onDeleteProduct() {
            const oProductsModel = this.getModel("productsModel");
            const oSelectedProduct = oProductsModel.getProperty("/selectedItem");
            
            if (!oSelectedProduct) {
                return;
            }
            
            MessageBox.confirm(this.getResourceBundle().getText("deleteProductConfirmation"), {
                title: this.getResourceBundle().getText("deleteProductTitle"),
                onClose: (sAction) => {
                    if (sAction === MessageBox.Action.OK) {
                        // In a real app, we would delete the product from the backend
                        MessageToast.show(this.getResourceBundle().getText("productDeletedSuccess"));
                        
                        // Refresh the products table
                        this.byId("productsSmartTable").rebindTable();
                        
                        // Reset selection
                        oProductsModel.setProperty("/selectedItem", null);
                    }
                }
            });
        },

        _openProductDialog() {
            const oView = this.getView();
            
            // Create dialog lazily
            if (!this._pProductDialog) {
                this._pProductDialog = Fragment.load({
                    id: oView.getId(),
                    name: "com.bootcamp.sapui5.finalproject.view.fragment.ProductDialog",
                    controller: this
                }).then(oDialog => {
                    oView.addDependent(oDialog);
                    return oDialog;
                });
            }
            
            this._pProductDialog.then(oDialog => {
                oDialog.open();
            });
        },

        onCloseProductDialog() {
            this._pProductDialog.then(oDialog => {
                oDialog.close();
            });
        },

        onSaveProduct() {
            const oModel = this.getModel("productDialog");
            const oFormData = oModel.getProperty("/formData");
            
            // Validate required fields
            if (!this._validateProductForm(oFormData)) {
                MessageToast.show(this.getResourceBundle().getText("requiredFieldError"));
                return;
            }
            
            // In a real app, we would save the data to the backend
            // For this example, we'll just show a success message
            
            // Add supplier ID
            const oContext = this.getView().getBindingContext();
            if (oContext) {
                const oSupplier = oContext.getObject();
                oFormData.SupplierID = oSupplier.SupplierID;
            }
            
            MessageToast.show(this.getResourceBundle().getText("productCreatedSuccess"));
            
            // Close the dialog
            this.onCloseProductDialog();
            
            // Refresh the product list
            this.byId("productsSmartTable").rebindTable();
        },

        _validateProductForm(oFormData) {
            // Basic validation - check required fields
            return Boolean(oFormData.ProductName && oFormData.QuantityPerUnit);
        }
    });
});
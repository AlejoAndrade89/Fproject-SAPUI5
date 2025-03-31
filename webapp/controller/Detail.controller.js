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
            // Set up models
            this.createAndSetJSONModel({
                selectedItem: null,
                count: 0
            }, "productsModel");

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

            // Attach to smartTable's 'initialise' event
            this.byId("productsSmartTable").attachInitialise(this._onSmartTableInitialised, this);
        },

        _onSmartTableInitialised(oEvent) {
            const oTable = this.byId("productsSmartTable").getTable();
            
            // Set up table events
            oTable.attachSelectionChange(this.onRowSelectionChange, this);
            oTable.setSelectionMode("Single");
            
            // Add double-click or item press event to show product details
            oTable.attachItemPress(this.onProductRowDoubleClick, this);
        },

        _onRouteMatched(oEvent) {
            // Store the supplier ID for later use
            this._sCurrentSupplierId = oEvent.getParameter("arguments").supplierId;

            // Bind the view to the supplier details
            const sPath = `/Suppliers(${this._sCurrentSupplierId})`;
            this.getView().bindElement({
                path: sPath,
                events: {
                    dataReceived: this._onDataReceived.bind(this)
                }
            });

            // Reset selection and refresh table
            this.getModel("productsModel").setProperty("/selectedItem", null);
            if (this.byId("productsSmartTable")) {
                this.byId("productsSmartTable").rebindTable();
            }
        },

        _onDataReceived() {
            const oContext = this.getView().getBindingContext();
            if (!oContext) {
                this.getRouter().navTo("home");
            }
        },

        onBeforeRebindTable(oEvent) {
            const oBindingParams = oEvent.getParameter("bindingParams");

            // Add filter for current supplier
            if (this._sCurrentSupplierId) {
                const oFilter = new Filter("SupplierID", FilterOperator.EQ, this._sCurrentSupplierId);
                oBindingParams.filters.push(oFilter);
            }

            // Setup product counting
            oBindingParams.parameters = oBindingParams.parameters || {};
            oBindingParams.parameters.$count = true;
            oBindingParams.events = oBindingParams.events || {};
            
            const originalDataReceived = oBindingParams.events.dataReceived;
            oBindingParams.events.dataReceived = (oData) => {
                if (originalDataReceived) {
                    originalDataReceived(oData);
                }
                
                // Update product count
                const oBinding = oEvent.getSource().getTable().getBinding("items");
                if (oBinding && oBinding.getLength) {
                    this.getModel("productsModel").setProperty("/count", oBinding.getLength());
                }
            };
        },

        onRowSelectionChange(oEvent) {
            const oTable = oEvent.getSource();
            const aSelectedItems = oTable.getSelectedItems();
            
            if (aSelectedItems && aSelectedItems.length > 0) {
                const oContext = aSelectedItems[0].getBindingContext();
                if (oContext) {
                    this.getModel("productsModel").setProperty("/selectedItem", oContext.getObject());
                }
            } else {
                this.getModel("productsModel").setProperty("/selectedItem", null);
            }
        },
        
        // Method to open the dialog when a product is clicked
        onProductRowDoubleClick(oEvent) {
            // Get the data object of the selected product
            const oContext = oEvent.getParameter("listItem").getBindingContext();
            const oProduct = oContext.getObject();
            
            // Set dialog mode to "display"
            this.getModel("productDialog").setProperty("/dialogMode", "display");
            
            // Update form information with product data
            this.getModel("productDialog").setProperty("/formData", {
                ProductID: oProduct.ProductID,
                ProductName: oProduct.ProductName,
                QuantityPerUnit: oProduct.QuantityPerUnit,
                UnitPrice: oProduct.UnitPrice,
                UnitsInStock: oProduct.UnitsInStock,
                Discontinued: oProduct.Discontinued
            });
            
            // Open the product dialog
            this._openProductDialog();
        },

        onCreateProduct() {
            // Reset form and configure for creation
            this.getModel("productDialog").setProperty("/dialogMode", "create");
            this.getModel("productDialog").setProperty("/formData", {
                ProductID: "",
                ProductName: "",
                QuantityPerUnit: "",
                UnitPrice: 0,
                UnitsInStock: 0,
                Discontinued: false
            });
            
            this._openProductDialog();
        },

        onDeleteProduct() {
            const oSelectedProduct = this.getModel("productsModel").getProperty("/selectedItem");

            if (!oSelectedProduct) {
                MessageToast.show(this.getResourceBundle().getText("noProductSelected"));
                return;
            }

            MessageBox.confirm(this.getResourceBundle().getText("deleteProductConfirmation", [oSelectedProduct.ProductName]), {
                title: this.getResourceBundle().getText("deleteProductTitle"),
                onClose: (sAction) => {
                    if (sAction === MessageBox.Action.OK) {
                        // Deletion simulation
                        MessageToast.show(this.getResourceBundle().getText("productDeletedSuccess"));
                        
                        // Update table and clear selection
                        this.byId("productsSmartTable").rebindTable();
                        this.getModel("productsModel").setProperty("/selectedItem", null);
                    }
                }
            });
        },

        _openProductDialog() {
            const oView = this.getView();

            // Lazy load dialog
            if (!this._pProductDialog) {
                this._pProductDialog = Fragment.load({
                    id: oView.getId(),
                    name: "com.bootcamp.sapui5.finalproject.view.fragment.ProductDialog",
                    controller: this
                }).then(oDialog => {
                    oView.addDependent(oDialog);
                    return oDialog;
                }).catch(error => {
                    console.error("Error loading dialog:", error);
                });
            }

            this._pProductDialog.then(oDialog => {
                oDialog.open();
            }).catch(error => {
                MessageToast.show("Error opening dialog");
            });
        },

        onCloseProductDialog() {
            if (this._pProductDialog) {
                this._pProductDialog.then(oDialog => oDialog.close());
            }
        },

        onSaveProduct() {
            const oModel = this.getModel("productDialog");
            const oFormData = oModel.getProperty("/formData");

            if (!this._validateProductForm(oFormData)) {
                MessageToast.show(this.getResourceBundle().getText("requiredFieldError"));
                return;
            }

            // Simulate product creation
            oFormData.ProductID = Math.floor(Math.random() * 10000) + 1000;
            oFormData.SupplierID = parseInt(this._sCurrentSupplierId);

            MessageToast.show(this.getResourceBundle().getText("productCreatedSuccess"));
            this.onCloseProductDialog();
            
            // Simulate table update
            setTimeout(() => {
                this.byId("productsSmartTable").rebindTable();
            }, 500);
        },

        _validateProductForm(oFormData) {
            return oFormData.ProductName && oFormData.ProductName.trim() !== "" &&
                   oFormData.QuantityPerUnit && oFormData.QuantityPerUnit.trim() !== "";
        }
    });
});
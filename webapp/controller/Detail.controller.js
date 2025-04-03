sap.ui.define([
    "com/bootcamp/sapui5/finalproject/controller/BaseController",
    "com/bootcamp/sapui5/finalproject/utils/DetailHelper",
    "com/bootcamp/sapui5/finalproject/utils/DialogService",
    "com/bootcamp/sapui5/finalproject/utils/formatter",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (
    BaseController, 
    DetailHelper, 
    DialogService, 
    formatter,
    Filter,
    FilterOperator,
    JSONModel, 
    MessageToast, 
    MessageBox
) {
    "use strict";

    return BaseController.extend("com.bootcamp.sapui5.finalproject.controller.Detail", {

        formatter: formatter,

        onInit: function() {
            // Initialize local data with empty products array
            this._localData = {
                localProducts: [],
                productsAdded: false
            };

            // Initialize models
            this.setModel(new JSONModel({
                selectedItem: null,
                count: 0
            }), "productsModel");

            // Initialize dialog model with categories
            this.setModel(new JSONModel({
                dialogMode: "display",
                busy: false,
                fieldValidated: false,
                categories: [
                    { id: "1", name: "Beverages" },
                    { id: "2", name: "Condiments" },
                    { id: "3", name: "Confections" },
                    { id: "4", name: "Dairy Products" },
                    { id: "5", name: "Grains/Cereals" },
                    { id: "6", name: "Meat/Poultry" },
                    { id: "7", name: "Produce" },
                    { id: "8", name: "Seafood" }
                ],
                formData: this._getDefaultFormData()
            }), "productDialog");

            // Register event handlers
            this.getRouter().getRoute("detail").attachPatternMatched(this._onRouteMatched, this);
            this.byId("productsSmartTable").attachEventOnce("initialise", this._onSmartTableInitialised.bind(this));
        },

        _getDefaultFormData: function() {
            return {
                ProductID: "",
                ProductName: "",
                QuantityPerUnit: "",
                UnitPrice: 0,
                UnitsInStock: 0,
                CategoryID: "",
                ReorderLevel: 10,
                Discontinued: false
            };
        },

        _onSmartTableInitialised: function() {
            const oTable = this.byId("productsSmartTable").getTable();
            
            // Set table configuration
            oTable.setMode("SingleSelectMaster");
            oTable.attachSelectionChange(this.onRowSelectionChange.bind(this));
            oTable.attachItemPress(this.onProductItemPress.bind(this));
            
            // Set column alignment
            oTable.getColumns().forEach(function(oColumn) {
                oColumn.setHAlign("Begin");
            });
            
            this._smartTableInitialized = true;

            // If there was a pending rebind, do it now
            if (this._pendingRebind) {
                setTimeout(() => {
                    this.byId("productsSmartTable").rebindTable();
                    this._pendingRebind = false;
                }, 0);
            }
        },

        _onRouteMatched: function(oEvent) {
            // Get supplier ID from route
            this._sCurrentSupplierId = oEvent.getParameter("arguments").supplierId;
            
            // Bind view to supplier entity
            this.getView().bindElement(`/Suppliers(${this._sCurrentSupplierId})`);
            
            // Reset selection
            this.getModel("productsModel").setProperty("/selectedItem", null);
            
            // Reset local products
            this._localData.localProducts = [];
            this._localData.productsAdded = false;
            
            // Set pending rebind flag
            this._pendingRebind = true;
            
            // Rebind the table if it's already initialized
            const oSmartTable = this.byId("productsSmartTable");
            if (oSmartTable && oSmartTable.isInitialised()) {
                oSmartTable.rebindTable();
            }
        },
        
        onBeforeRebindTable: function(oEvent) {
            // Get binding parameters
            var oBindingParams = oEvent.getParameter("bindingParams");
            
            // Add filter for current supplier
            if (this._sCurrentSupplierId) {
                // Create a filter to only show products for the current supplier
                var oFilter = new Filter("SupplierID", FilterOperator.EQ, this._sCurrentSupplierId);
                oBindingParams.filters.push(oFilter);
                
                // Set up data received handling
                oBindingParams.events = oBindingParams.events || {};
                var originalDataReceived = oBindingParams.events.dataReceived;
                
                oBindingParams.events.dataReceived = function(oData) {
                    if (originalDataReceived) {
                        originalDataReceived(oData);
                    }
                    
                    // Get the table and binding
                    var oTable = this.byId("productsSmartTable").getTable();
                    var oBinding = oTable.getBinding("items");
                    
                    // Update product count
                    if (oBinding && oBinding.getLength) {
                        var iODataCount = oBinding.getLength();
                        var iTotalCount = iODataCount + this._localData.localProducts.length;
                        this.getModel("productsModel").setProperty("/count", iTotalCount);
                    }
                    
                    // Add local products to the table
                    setTimeout(function() {
                        if (!this._localData.productsAdded) {
                            this._addLocalProductsToTable(oTable);
                            this._localData.productsAdded = true;
                        }
                    }.bind(this), 300);
                }.bind(this);
            } else {
                // If no supplier ID is available, prevent table rebind
                oEvent.preventDefault();
            }
        },

        _addLocalProductsToTable: function(oTable) {
            if (!this._localData.localProducts || this._localData.localProducts.length === 0) {
                return;
            }

            // First, remove any existing local products
            this._removeLocalProductsFromTable(oTable);

            // For each local product, add a new row
            this._localData.localProducts.forEach(oProduct => {
                // Create cells for all columns
                const oCells = [];
                
                oCells.push(new sap.m.Text({ text: oProduct.ProductID.toString() }));
                oCells.push(new sap.m.Text({ text: oProduct.ProductName }));
                oCells.push(new sap.m.Text({ text: oProduct.QuantityPerUnit }));
                oCells.push(new sap.m.Text({ text: oProduct.UnitPrice.toString() }));
                oCells.push(new sap.m.Text({ text: oProduct.UnitsInStock.toString() }));
                oCells.push(new sap.m.Text({ text: oProduct.Discontinued ? "Yes" : "No" }));
                oCells.push(new sap.m.Text({ text: oProduct.CategoryID ? oProduct.CategoryID.toString() : "1" }));
                oCells.push(new sap.m.Text({ text: oProduct.ReorderLevel ? oProduct.ReorderLevel.toString() : "10" }));
                oCells.push(new sap.m.Text({ text: oProduct.SupplierID.toString() }));
                oCells.push(new sap.m.Text({ text: oProduct.UnitsOnOrder ? oProduct.UnitsOnOrder.toString() : "0" }));

                // Create the row with cells
                const oRow = new sap.m.ColumnListItem({
                    cells: oCells,
                    type: "Active"
                });

                // Mark as local product
                oRow.addCustomData(new sap.ui.core.CustomData({
                    key: "isLocalProduct",
                    value: "true"
                }));

                oRow.addCustomData(new sap.ui.core.CustomData({
                    key: "productId",
                    value: oProduct.ProductID
                }));

                // Attach press handler
                oRow.attachPress(this.onProductItemPress.bind(this));

                // Add to table
                oTable.addItem(oRow);
            });
        },

        _removeLocalProductsFromTable: function(oTable) {
            const aItems = oTable.getItems();
            const aLocalItems = [];

            // First identify all local products
            aItems.forEach(function(oItem) {
                const oData = oItem.getCustomData();
                for (let i = 0; i < oData.length; i++) {
                    if (oData[i].getKey() === "isLocalProduct" && oData[i].getValue() === "true") {
                        aLocalItems.push(oItem);
                        break;
                    }
                }
            });

            // Then remove them
            aLocalItems.forEach(function(oItem) {
                oTable.removeItem(oItem);
            });
        },

        onRowSelectionChange: function(oEvent) {
            const oTable = oEvent.getSource();
            const aSelectedItems = oTable.getSelectedItems();

            if (aSelectedItems && aSelectedItems.length > 0) {
                const oSelectedItem = aSelectedItems[0];

                // Check if it's a local product via custom data
                const oData = oSelectedItem.getCustomData();
                const isLocalProduct = oData.some(data =>
                    data.getKey() === "isLocalProduct" && data.getValue() === "true"
                );

                let oProduct = null;
                if (isLocalProduct) {
                    // Find product ID from custom data
                    const productIdData = oData.find(data => data.getKey() === "productId");
                    if (productIdData) {
                        const productId = parseInt(productIdData.getValue());
                        oProduct = this._localData.localProducts.find(p => p.ProductID === productId);
                    }
                } else {
                    // OData product
                    const oContext = oSelectedItem.getBindingContext();
                    oProduct = oContext ? oContext.getObject() : null;
                }

                if (oProduct) {
                    this.getModel("productsModel").setProperty("/selectedItem", oProduct);
                }
            } else {
                this.getModel("productsModel").setProperty("/selectedItem", null);
            }
        },

        onProductItemPress: function(oEvent) {
            const oItem = oEvent.getParameter("listItem") || oEvent.getSource();
            if (!oItem || oItem.getSelected()) return;

            // Determine if it's a local product
            const oData = oItem.getCustomData();
            const isLocalProduct = oData.some(data => 
                data.getKey() === "isLocalProduct" && data.getValue() === "true"
            );

            let oProduct = null;
            if (isLocalProduct) {
                // Get product ID from custom data
                const productIdData = oData.find(data => data.getKey() === "productId");
                if (productIdData) {
                    const productId = parseInt(productIdData.getValue());
                    oProduct = this._localData.localProducts.find(p => p.ProductID === productId);
                }
            } else {
                // Get OData product
                const oContext = oItem.getBindingContext();
                oProduct = oContext ? oContext.getObject() : null;
            }

            if (!oProduct) return;

            // Configure dialog
            const oDialogModel = this.getModel("productDialog");
            oDialogModel.setProperty("/dialogMode", "display");
            oDialogModel.setProperty("/formData", {
                ProductID: oProduct.ProductID,
                ProductName: oProduct.ProductName,
                QuantityPerUnit: oProduct.QuantityPerUnit,
                UnitPrice: oProduct.UnitPrice,
                UnitsInStock: oProduct.UnitsInStock,
                CategoryID: oProduct.CategoryID ? oProduct.CategoryID.toString() : "",
                ReorderLevel: oProduct.ReorderLevel || 10,
                Discontinued: oProduct.Discontinued
            });

            // Open dialog
            DialogService.openDialog(this.getView(), "com.bootcamp.sapui5.finalproject.view.fragment.ProductDialog");
        },

        onCreateProduct: function() {
            // Configure dialog for product creation
            const oDialogModel = this.getModel("productDialog");
            oDialogModel.setProperty("/dialogMode", "create");
            oDialogModel.setProperty("/fieldValidated", false);
            oDialogModel.setProperty("/formData", this._getDefaultFormData());
            
            // Open dialog
            DialogService.openDialog(this.getView(), "com.bootcamp.sapui5.finalproject.view.fragment.ProductDialog");
        },

        onDeleteProduct: function() {
            const oSelectedProduct = this.getModel("productsModel").getProperty("/selectedItem");

            if (!oSelectedProduct) {
                MessageToast.show(this.getResourceBundle().getText("noProductSelected"));
                return;
            }

            MessageBox.confirm(this.getResourceBundle().getText("deleteProductConfirmation", [oSelectedProduct.ProductName]), {
                title: this.getResourceBundle().getText("deleteProductTitle"),
                onClose: (sAction) => {
                    if (sAction === MessageBox.Action.OK) {
                        // Check if it's a local product
                        const localIndex = this._localData.localProducts.findIndex(p => p.ProductID === oSelectedProduct.ProductID);

                        if (localIndex !== -1) {
                            // Remove local product
                            this._localData.localProducts.splice(localIndex, 1);

                            // Update product count
                            const currentCount = this.getModel("productsModel").getProperty("/count");
                            this.getModel("productsModel").setProperty("/count", currentCount - 1);

                            // Refresh table
                            const oTable = this.byId("productsSmartTable").getTable();
                            this._removeLocalProductsFromTable(oTable);
                            this._addLocalProductsToTable(oTable);

                            // Clear selection
                            oTable.removeSelections(true);
                            this.getModel("productsModel").setProperty("/selectedItem", null);

                            MessageToast.show(this.getResourceBundle().getText("productDeletedSuccess"));
                        } else {
                            MessageToast.show(this.getResourceBundle().getText("cannotDeleteODataProduct"));
                        }
                    }
                }
            });
        },

        onCloseProductDialog: function() {
            // Reset validation state
            this.getModel("productDialog").setProperty("/fieldValidated", false);
            
            // Close dialog
            DialogService.closeDialog("com.bootcamp.sapui5.finalproject.view.fragment.ProductDialog");
        },

        onSaveProduct: function() {
            // Get form data
            const oDialogModel = this.getModel("productDialog");
            const oFormData = oDialogModel.getProperty("/formData");
            
            // Mark that validation has been attempted
            oDialogModel.setProperty("/fieldValidated", true);
            
            // Validate required fields
            if (!oFormData.ProductName || !oFormData.QuantityPerUnit || !oFormData.CategoryID) {
                MessageBox.error(this.getResourceBundle().getText("requiredFieldError"));
                return;
            }
            
            // Set busy state
            oDialogModel.setProperty("/busy", true);
            
            // Simulate server call
            setTimeout(() => {
                // Create new product with ALL fields
                const oNewProduct = {
                    ProductID: Math.floor(Math.random() * 1000) + 1000,
                    ProductName: oFormData.ProductName,
                    QuantityPerUnit: oFormData.QuantityPerUnit,
                    UnitPrice: parseFloat(oFormData.UnitPrice) || 0,
                    UnitsInStock: parseInt(oFormData.UnitsInStock) || 0,
                    Discontinued: oFormData.Discontinued,
                    SupplierID: parseInt(this._sCurrentSupplierId),
                    CategoryID: parseInt(oFormData.CategoryID) || 1,
                    ReorderLevel: parseInt(oFormData.ReorderLevel) || 10,
                    UnitsOnOrder: 0
                };
                
                // Add to local products
                this._localData.localProducts.push(oNewProduct);
                
                // Update product count
                const iCurrentCount = this.getModel("productsModel").getProperty("/count") || 0;
                this.getModel("productsModel").setProperty("/count", iCurrentCount + 1);
                
                // Clear busy state
                oDialogModel.setProperty("/busy", false);
                
                // Reset validation
                oDialogModel.setProperty("/fieldValidated", false);
                
                // Show success message and close dialog
                MessageToast.show(this.getResourceBundle().getText("productCreatedSuccess"));
                this.onCloseProductDialog();
                
                // Add to table
                const oTable = this.byId("productsSmartTable").getTable();
                this._addLocalProductsToTable(oTable);
            }, 1000);
        }
    });
});
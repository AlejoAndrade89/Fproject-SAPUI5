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
            console.log("Detail Controller: onInit");

            // Initialize local products array for simulating product creation
            this._localProducts = [];
            this._localProductsAdded = false;

            // Set up models
            this.createAndSetJSONModel({
                selectedItem: null,
                count: 0,
                products: []
            }, "productsModel");

            // Categories that match the data in your system
            const categories = [
                { id: "1", name: "Beverages" },
                { id: "2", name: "Condiments" },
                { id: "3", name: "Confections" },
                { id: "4", name: "Dairy Products" },
                { id: "5", name: "Grains/Cereals" },
                { id: "6", name: "Meat/Poultry" },
                { id: "7", name: "Produce" },
                { id: "8", name: "Seafood" }
            ];

            this.createAndSetJSONModel({
                dialogMode: "display", // "display" or "create"
                busy: false,
                fieldValidated: false, // Flag to track if validation has been attempted
                categories: categories,
                formData: {
                    ProductID: "",
                    ProductName: "",
                    QuantityPerUnit: "",
                    UnitPrice: 0,
                    UnitsInStock: 0,
                    CategoryID: "",
                    ReorderLevel: 10,
                    Discontinued: false
                }
            }, "productDialog");

            // Register route pattern matched handler
            this.getRouter().getRoute("detail").attachPatternMatched(this._onRouteMatched, this);

            // Attach to smartTable's 'initialise' event
            const oSmartTable = this.byId("productsSmartTable");
            if (oSmartTable) {
                oSmartTable.attachEventOnce("initialise", this._onSmartTableInitialised, this);
            }
        },

        _onSmartTableInitialised(oEvent) {
            console.log("Detail Controller: _onSmartTableInitialised");

            const oTable = this.byId("productsSmartTable").getTable();

            // Set up table events
            oTable.attachSelectionChange(this.onRowSelectionChange, this);

            // For responsive tables (sap.m.Table), use setMode instead of setSelectionMode
            oTable.setMode("SingleSelectMaster");

            // CRITICAL: Set up itemPress event for OData products
            oTable.attachItemPress(this.onProductItemPress, this);

            // Set alignment for all columns to left
            oTable.getColumns().forEach(function (oColumn) {
                oColumn.setHAlign("Begin");
            });

            this._smartTableInitialized = true;
        },

        _onRouteMatched(oEvent) {
            console.log("Detail Controller: _onRouteMatched");

            // Store the supplier ID for later use
            this._sCurrentSupplierId = oEvent.getParameter("arguments").supplierId;

            console.log("Current Supplier ID:", this._sCurrentSupplierId);

            // Reset local products when changing suppliers
            this._localProducts = [];
            this._localProductsAdded = false;

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

            // Rebind table if initialized
            if (this._smartTableInitialized) {
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
            console.log("Detail Controller: onBeforeRebindTable");

            // Check if supplier ID is available
            if (!this._sCurrentSupplierId) {
                console.warn("Supplier ID not available, skipping table rebind");
                oEvent.preventDefault();
                return;
            }

            const oBindingParams = oEvent.getParameter("bindingParams");

            // Add filter for current supplier
            const oFilter = new Filter("SupplierID", FilterOperator.EQ, this._sCurrentSupplierId);
            oBindingParams.filters.push(oFilter);

            // Setup product counting
            oBindingParams.parameters = oBindingParams.parameters || {};
            oBindingParams.parameters.$count = true;
            oBindingParams.events = oBindingParams.events || {};

            // Reset local products added flag
            this._localProductsAdded = false;

            const originalDataReceived = oBindingParams.events.dataReceived;
            oBindingParams.events.dataReceived = (oData) => {
                if (originalDataReceived) {
                    originalDataReceived(oData);
                }

                // Get the table and binding
                const oSmartTable = this.byId("productsSmartTable");
                const oTable = oSmartTable.getTable();
                const oBinding = oTable.getBinding("items");

                // Update product count (backend + local products)
                if (oBinding && oBinding.getLength) {
                    const iODataCount = oBinding.getLength();
                    const iTotalCount = iODataCount + this._localProducts.length;
                    this.getModel("productsModel").setProperty("/count", iTotalCount);

                    // Add our local products to the table for demo purposes
                    // Use setTimeout to ensure binding is complete
                    setTimeout(() => {
                        if (!this._localProductsAdded) {
                            this._addLocalProductsToTable(oTable);
                            this._localProductsAdded = true;
                        }
                    }, 300);
                }
            };
        },

        _addLocalProductsToTable(oTable) {
            console.log("Detail Controller: _addLocalProductsToTable, local products:", this._localProducts.length);

            if (!this._localProducts || this._localProducts.length === 0) {
                return;
            }

            // First, remove any existing local products to avoid duplicates
            this._removeLocalProductsFromTable(oTable);

            // For each local product, add a new row to the table
            this._localProducts.forEach(oProduct => {
                // Create a new list item with the appropriate cells
                const oCells = [];

                // Create cells for ALL visible fields in the table
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

                // Create and add the row
                const oRow = new sap.m.ColumnListItem({
                    cells: oCells,
                    type: "Active"
                });

                // Mark this item as a local product
                oRow.addCustomData(new sap.ui.core.CustomData({
                    key: "isLocalProduct",
                    value: "true"
                }));

                oRow.addCustomData(new sap.ui.core.CustomData({
                    key: "productId",
                    value: oProduct.ProductID
                }));

                // Attach press event directly to row
                oRow.attachPress(function (oEvent) {
                    this.onProductItemPress(oEvent);
                }.bind(this));

                // Add to table
                oTable.addItem(oRow);

                console.log("Added local product to table:", oProduct.ProductID, oProduct.ProductName);
            });
        },

        _removeLocalProductsFromTable(oTable) {
            const aItems = oTable.getItems();
            const aLocalItems = [];

            // First identify all local products
            aItems.forEach(function (oItem) {
                const oData = oItem.getCustomData();
                for (let i = 0; i < oData.length; i++) {
                    if (oData[i].getKey() === "isLocalProduct" && oData[i].getValue() === "true") {
                        aLocalItems.push(oItem);
                        break;
                    }
                }
            });

            // Then remove them
            aLocalItems.forEach(function (oItem) {
                oTable.removeItem(oItem);
            });

            console.log("Removed local products from table:", aLocalItems.length);
        },

        onRowSelectionChange(oEvent) {
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
                        oProduct = this._localProducts.find(p => p.ProductID === productId);
                    }
                } else {
                    // OData product
                    const oContext = oSelectedItem.getBindingContext();
                    oProduct = oContext ? oContext.getObject() : null;
                }

                if (oProduct) {
                    this.getModel("productsModel").setProperty("/selectedItem", oProduct);
                    console.log("Selected product:", oProduct.ProductID, oProduct.ProductName);
                }
            } else {
                this.getModel("productsModel").setProperty("/selectedItem", null);
            }
        },

        onProductItemPress(oEvent) {
            const oItem = oEvent.getParameter("listItem");
            if (!oItem) return;

            // Prevent opening dialog when trying to select for deletion
            if (oItem.getSelected()) return;

            let oProduct = null;
            const oContext = oItem.getBindingContext();

            if (oContext) {
                // OData product
                oProduct = oContext.getObject();
            } else {
                // Local product
                const oData = oItem.getCustomData();
                const productIdData = oData.find(data => data.getKey() === "productId");
                if (productIdData) {
                    const productId = parseInt(productIdData.getValue());
                    oProduct = this._localProducts.find(p => p.ProductID === productId);
                }
            }

            if (!oProduct) return;

            // Set dialog to display mode
            this.getModel("productDialog").setProperty("/dialogMode", "display");

            // Populate dialog with product details
            this.getModel("productDialog").setProperty("/formData", {
                ProductID: oProduct.ProductID,
                ProductName: oProduct.ProductName,
                QuantityPerUnit: oProduct.QuantityPerUnit,
                UnitPrice: oProduct.UnitPrice,
                UnitsInStock: oProduct.UnitsInStock,
                CategoryID: oProduct.CategoryID ? oProduct.CategoryID.toString() : "",
                ReorderLevel: oProduct.ReorderLevel || 10,
                Discontinued: oProduct.Discontinued
            });

            this._openProductDialog();
        },

        onCreateProduct() {
            console.log("Creating new product");

            // Reset form and configure for creation
            const oModel = this.getModel("productDialog");

            // Force create mode
            oModel.setProperty("/dialogMode", "create");

            // Reset validation flag
            oModel.setProperty("/fieldValidated", false);

            // Reset form data with default values
            oModel.setProperty("/formData", {
                ProductID: "",
                ProductName: "",
                QuantityPerUnit: "",
                UnitPrice: 0,
                UnitsInStock: 0,
                CategoryID: "",
                ReorderLevel: 10,
                Discontinued: false
            });

            // Open the dialog
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
                        // Check if it's a local product
                        const localIndex = this._localProducts.findIndex(p => p.ProductID === oSelectedProduct.ProductID);

                        if (localIndex !== -1) {
                            // Remove local product
                            this._localProducts.splice(localIndex, 1);

                            // Update product count
                            const currentCount = this.getModel("productsModel").getProperty("/count");
                            this.getModel("productsModel").setProperty("/count", currentCount - 1);

                            // Refresh table
                            const oTable = this.byId("productsSmartTable").getTable();
                            this._removeLocalProductsFromTable(oTable);
                            this._addLocalProductsToTable(oTable);

                            // Clear selection
                            oTable.removeSelections(true);
                            this.getModel("productsModel").
                                setProperty("/selectedItem", null);

                            MessageToast.show(this.getResourceBundle().getText("productDeletedSuccess"));
                        } else {
                            MessageToast.show(this.getResourceBundle().getText("cannotDeleteODataProduct"));
                        }
                    }
                }
            });
        },

        _openProductDialog() {
            const oView = this.getView();
            const dialogMode = this.getModel("productDialog").getProperty("/dialogMode");

            console.log("Opening product dialog in mode:", dialogMode);

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
                // Double-check the dialog mode just before opening
                console.log("Dialog mode before opening:", this.getModel("productDialog").getProperty("/dialogMode"));
                oDialog.open();
            }).catch(error => {
                MessageToast.show("Error opening dialog");
                console.error("Error:", error);
            });
        },

        onCloseProductDialog() {
            console.log("Closing product dialog");

            // Reset validation state
            this.getModel("productDialog").setProperty("/fieldValidated", false);

            // Close the dialog
            if (this._pProductDialog) {
                this._pProductDialog.then(oDialog => oDialog.close());
            }
        },

        onSaveProduct() {
            console.log("Saving product");

            // Get form data
            const oModel = this.getModel("productDialog");
            const oFormData = oModel.getProperty("/formData");

            // Mark that validation has been attempted
            oModel.setProperty("/fieldValidated", true);

            // Validate required fields
            if (!this._validateProductForm(oFormData)) {
                MessageBox.error(this.getResourceBundle().getText("requiredFieldError"));
                return;
            }

            // Set busy state while "saving"
            oModel.setProperty("/busy", true);

            // Simulate server call with a timeout
            setTimeout(() => {
                // Generate a unique ID for the new product
                const newProductId = Math.floor(Math.random() * 1000) + 1000;

                // Convert CategoryID to a number for consistent storage
                const categoryId = parseInt(oFormData.CategoryID) || 4; // Default to Dairy Products if not specified

                // Create new product object with ALL fields needed for display
                const oNewProduct = {
                    ProductID: newProductId,
                    ProductName: oFormData.ProductName,
                    QuantityPerUnit: oFormData.QuantityPerUnit,
                    UnitPrice: parseFloat(oFormData.UnitPrice) || 0,
                    UnitsInStock: parseInt(oFormData.UnitsInStock) || 0,
                    Discontinued: oFormData.Discontinued,
                    SupplierID: parseInt(this._sCurrentSupplierId),
                    CategoryID: categoryId,
                    ReorderLevel: parseInt(oFormData.ReorderLevel) || 10,
                    UnitsOnOrder: 0
                };

                console.log("Created new product:", oNewProduct);

                // Store in local products array (for demo only)
                this._localProducts.push(oNewProduct);

                // Update product count
                const iCurrentCount = this.getModel("productsModel").getProperty("/count") || 0;
                this.getModel("productsModel").setProperty("/count", iCurrentCount + 1);

                // Clear busy state
                oModel.setProperty("/busy", false);

                // Reset validation flag
                oModel.setProperty("/fieldValidated", false);

                // Show success message and close dialog
                MessageBox.success(this.getResourceBundle().getText("productCreatedSuccess"));
                this.onCloseProductDialog();

                // Add new product to table - more reliable than rebinding
                const oTable = this.byId("productsSmartTable").getTable();
                this._removeLocalProductsFromTable(oTable);
                this._addLocalProductsToTable(oTable);
            }, 1000); // Simulate a 1-second delay for the server response
        },

        _validateProductForm(oFormData) {
            // Validate required fields
            return oFormData.ProductName && oFormData.ProductName.trim() !== "" &&
                oFormData.QuantityPerUnit && oFormData.QuantityPerUnit.trim() !== "" &&
                oFormData.CategoryID && oFormData.CategoryID.trim() !== "";
        }
    });
});
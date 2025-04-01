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
            // Initialize local products array for simulating product creation
            this._localProducts = [];

            // Set up models
            this.createAndSetJSONModel({
                selectedItem: null,
                count: 0,
                products: []
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
            const oSmartTable = this.byId("productsSmartTable");
            if (oSmartTable) {
                oSmartTable.attachEventOnce("initialise", this._onSmartTableInitialised, this);
            }
        },

        _onSmartTableInitialised(oEvent) {
            const oTable = this.byId("productsSmartTable").getTable();

            // Set up table events
            oTable.attachSelectionChange(this.onRowSelectionChange, this);

            // For responsive tables (sap.m.Table), use setMode instead of setSelectionMode
            oTable.setMode("SingleSelectMaster");

            // Add item press event to show product details
            oTable.attachItemPress(this.onProductRowDoubleClick, this);

            // Set alignment for all columns to left
            oTable.getColumns().forEach(function (oColumn) {
                oColumn.setHAlign("Begin");
            });

            this._smartTableInitialized = true;
        },

        _onRouteMatched(oEvent) {
            // Store the supplier ID for later use
            this._sCurrentSupplierId = oEvent.getParameter("arguments").supplierId;

            // Reset local products when changing suppliers
            this._localProducts = [];

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
                    setTimeout(() => {
                        this._addLocalProductsToTable(oTable);
                    }, 100);
                }
            };
        },

        // Method to add local products to the table after OData binding completes
        _addLocalProductsToTable(oTable) {
            if (!this._localProducts || this._localProducts.length === 0) {
                return;
            }

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
                    type: "Active",
                    // Use the correct event handler
                    press: () => {
                        // Make a copy of the product to avoid reference issues
                        const oProductCopy = JSON.parse(JSON.stringify(oProduct));

                        // Set dialog mode to "display"
                        this.getModel("productDialog").setProperty("/dialogMode", "display");

                        // Update form data with the product
                        this.getModel("productDialog").setProperty("/formData", {
                            ProductID: oProductCopy.ProductID,
                            ProductName: oProductCopy.ProductName,
                            QuantityPerUnit: oProductCopy.QuantityPerUnit,
                            UnitPrice: oProductCopy.UnitPrice,
                            UnitsInStock: oProductCopy.UnitsInStock,
                            Discontinued: oProductCopy.Discontinued
                        });

                        // Open the dialog directly
                        this._openProductDialog();
                    }
                });

                oTable.addItem(oRow);
            });
        },

        // Method to show details for local products
        _showLocalProductDetails(oProduct) {
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
            // Get form data
            const oModel = this.getModel("productDialog");
            const oFormData = oModel.getProperty("/formData");

            // Validate required fields
            if (!this._validateProductForm(oFormData)) {
                MessageToast.show(this.getResourceBundle().getText("requiredFieldError"));
                return;
            }

            // Generate a unique ID for the new product
            const newProductId = Math.floor(Math.random() * 1000) + 1000;

            // Create new product object with ALL fields needed for display
            const oNewProduct = {
                ProductID: newProductId,
                ProductName: oFormData.ProductName,
                QuantityPerUnit: oFormData.QuantityPerUnit,
                UnitPrice: parseFloat(oFormData.UnitPrice) || 0,
                UnitsInStock: parseInt(oFormData.UnitsInStock) || 0,
                Discontinued: oFormData.Discontinued,
                SupplierID: parseInt(this._sCurrentSupplierId),
                // Add default values for missing fields that appear in the table
                CategoryID: 1,
                ReorderLevel: 10,
                UnitsOnOrder: 0
            };

            // Store in local products array (for demo only)
            this._localProducts.push(oNewProduct);

            // Update product count
            const iCurrentCount = this.getModel("productsModel").getProperty("/count") || 0;
            this.getModel("productsModel").setProperty("/count", iCurrentCount + 1);

            // Show success message and close dialog
            MessageToast.show(this.getResourceBundle().getText("productCreatedSuccess"));
            this.onCloseProductDialog();

            // Refresh table to include the new product
            this.byId("productsSmartTable").rebindTable();
        },

        _validateProductForm(oFormData) {
            return oFormData.ProductName && oFormData.ProductName.trim() !== "" &&
                oFormData.QuantityPerUnit && oFormData.QuantityPerUnit.trim() !== "";
        }
    });
});
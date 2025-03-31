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
            // Set up model for selected product
            this.createAndSetJSONModel({
                selectedItem: null,
                count: 0
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

            // Need to attach to smartTable's 'initialise' event to get the inner table
            this.byId("productsSmartTable").attachInitialise(this._onSmartTableInitialised, this);
        },

        _onSmartTableInitialised: function (oEvent) {
            // Get the inner table from the SmartTable
            const oTable = this.byId("productsSmartTable").getTable();

            // Attach to the selection change event
            oTable.attachSelectionChange(this.onRowSelectionChange, this);

            // Set selection mode to single
            oTable.setSelectionMode("Single");
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

            // Reset selection
            this.getModel("productsModel").setProperty("/selectedItem", null);

            // Refresh the SmartTable to trigger onBeforeRebindTable
            if (this.byId("productsSmartTable")) {
                this.byId("productsSmartTable").rebindTable();
            }
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
            // This is the key method for filtering the SmartTable
            const oBindingParams = oEvent.getParameter("bindingParams");

            // Make sure we have the supplier ID
            if (this._sCurrentSupplierId) {
                // Create a filter for the current supplier
                const oFilter = new Filter("SupplierID", FilterOperator.EQ, this._sCurrentSupplierId);

                // Add the filter to the binding parameters
                oBindingParams.filters.push(oFilter);

                // Log for debugging
                console.log("Filtering products for supplier:", this._sCurrentSupplierId);
            }

            // Add a count function to get the total number of filtered products
            oBindingParams.parameters = oBindingParams.parameters || {};
            oBindingParams.parameters.$count = true;

            // When data is received, update the count
            oBindingParams.events = oBindingParams.events || {};

            // Keep the original dataReceived handler if any
            const originalDataReceived = oBindingParams.events.dataReceived;

            oBindingParams.events.dataReceived = (oData) => {
                // Call the original handler if exists
                if (originalDataReceived) {
                    originalDataReceived(oData);
                }

                // Get the count from the response
                const oBinding = oEvent.getSource().getTable().getBinding("items");
                if (oBinding && oBinding.getLength) {
                    const iCount = oBinding.getLength();
                    // Update the count in our model
                    this.getModel("productsModel").setProperty("/count", iCount);
                }
            };
        },

        onRowSelectionChange(oEvent) {
            const oTable = oEvent.getSource();
            const aSelectedItems = oTable.getSelectedItems();

            if (aSelectedItems && aSelectedItems.length > 0) {
                const oContext = aSelectedItems[0].getBindingContext();
                if (oContext) {
                    const oSelectedProduct = oContext.getObject();
                    this.getModel("productsModel").setProperty("/selectedItem", oSelectedProduct);
                    console.log("Producto seleccionado:", oSelectedProduct);
                }
            } else {
                this.getModel("productsModel").setProperty("/selectedItem", null);
            }
        },

        onCreateProduct() {
            console.log("Se ha iniciado la creación de un producto");

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
            const oSelectedProduct = this.getModel("productsModel").getProperty("/selectedItem");

            if (!oSelectedProduct) {
                MessageToast.show(this.getResourceBundle().getText("noProductSelected"));
                return;
            }

            console.log("Iniciando eliminación del producto:", oSelectedProduct.ProductName);

            MessageBox.confirm(this.getResourceBundle().getText("deleteProductConfirmation", [oSelectedProduct.ProductName]), {
                title: this.getResourceBundle().getText("deleteProductTitle"),
                onClose: (sAction) => {
                    if (sAction === MessageBox.Action.OK) {
                        // Simular la eliminación del producto
                        console.log("Producto simulado como eliminado:", oSelectedProduct);

                        // Mostrar mensaje de éxito
                        MessageToast.show(this.getResourceBundle().getText("productDeletedSuccess"));

                        // Actualizar la tabla para mostrar los datos actualizados
                        this.byId("productsSmartTable").rebindTable();

                        // Reiniciar la selección
                        this.getModel("productsModel").setProperty("/selectedItem", null);
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
                }).catch(error => {
                    console.error("Error al cargar el fragmento ProductDialog:", error);
                });
            }

            this._pProductDialog.then(oDialog => {
                oDialog.open();
            }).catch(error => {
                console.error("Error al abrir el diálogo:", error);
                MessageToast.show("Error al abrir el diálogo de producto");
            });
        },

        onCloseProductDialog() {
            if (this._pProductDialog) {
                this._pProductDialog.then(oDialog => {
                    oDialog.close();
                }).catch(error => {
                    console.error("Error al cerrar el diálogo:", error);
                });
            }
        },

        onSaveProduct() {
            const oModel = this.getModel("productDialog");
            const oFormData = oModel.getProperty("/formData");

            // Validate required fields
            if (!this._validateProductForm(oFormData)) {
                MessageToast.show(this.getResourceBundle().getText("requiredFieldError"));
                return;
            }

            // Generate a random product ID (simulating backend generation)
            oFormData.ProductID = Math.floor(Math.random() * 10000) + 1000;

            // Add supplier ID from the current context
            oFormData.SupplierID = parseInt(this._sCurrentSupplierId);

            // Log the product being "created"
            console.log("Simulando creación de nuevo producto:", oFormData);

            // Show success message
            MessageToast.show(this.getResourceBundle().getText("productCreatedSuccess"));

            // Close the dialog
            this.onCloseProductDialog();

            // Simulate adding the product to the local model
            // In a real app, this would happen automatically when the backend is updated
            // For simulation purposes we just rebind the table
            setTimeout(() => {
                this.byId("productsSmartTable").rebindTable();
            }, 500);
        },

        _validateProductForm(oFormData) {
            // Basic validation - check required fields
            if (!oFormData.ProductName || oFormData.ProductName.trim() === "") {
                return false;
            }

            if (!oFormData.QuantityPerUnit || oFormData.QuantityPerUnit.trim() === "") {
                return false;
            }

            return true;
        }
    });
});
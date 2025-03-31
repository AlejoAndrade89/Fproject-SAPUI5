sap.ui.define([
    "com/bootcamp/sapui5/finalproject/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function (BaseController, JSONModel, Filter, FilterOperator) {
    "use strict";

    return BaseController.extend("com.bootcamp.sapui5.finalproject.controller.Home", {
        
        onInit() {
            // Set up view model for filtering
            const oViewModel = new JSONModel({
                filter: {
                    supplierID: "",
                    companyName: "",
                    city: ""
                },
                headerExpanded: true
            });
            this.setModel(oViewModel, "viewModel");
            
            // Get router and attach route matched event handler
            this.getRouter().getRoute("home").attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched() {
            // Reset selected row
            const oTable = this.byId("suppliersTable");
            oTable.clearSelection();
            
            // Load initial data
            this._loadSuppliersData();
        },

        _loadSuppliersData() {
            const oTable = this.byId("suppliersTable");
            oTable.setBusy(true);
            
            // Reset any filters
            oTable.getBinding("rows").filter([]);
            
            // Set busy state to false when data is loaded
            oTable.getBinding("rows").attachEventOnce("dataReceived", () => {
                oTable.setBusy(false);
            });
        },

        onApplyFilter() {
            const oViewModel = this.getModel("viewModel");
            const oFilterData = oViewModel.getProperty("/filter");
            const aFilters = [];
            
            // Create filters based on input values
            if (oFilterData.supplierID) {
                aFilters.push(new Filter("SupplierID", FilterOperator.EQ, oFilterData.supplierID));
            }
            
            if (oFilterData.companyName) {
                aFilters.push(new Filter("CompanyName", FilterOperator.Contains, oFilterData.companyName));
            }
            
            if (oFilterData.city) {
                aFilters.push(new Filter("City", FilterOperator.Contains, oFilterData.city));
            }
            
            // Apply filters to the table
            const oTable = this.byId("suppliersTable");
            oTable.getBinding("rows").filter(aFilters);
            
            // Collapse header after filtering
            this.getModel().setProperty("/headerExpanded", false);
        },

        onResetFilter() {
            // Reset filter model values
            const oViewModel = this.getModel("viewModel");
            oViewModel.setProperty("/filter/supplierID", "");
            oViewModel.setProperty("/filter/companyName", "");
            oViewModel.setProperty("/filter/city", "");
            
            // Clear all filters from table
            const oTable = this.byId("suppliersTable");
            oTable.getBinding("rows").filter([]);
        },

        onRefresh() {
            const oTable = this.byId("suppliersTable");
            oTable.setBusy(true);
            
            // Refresh the OData model
            this.getModel().refresh(true);
            
            // Set busy state to false when data is refreshed
            oTable.getBinding("rows").attachEventOnce("dataReceived", () => {
                oTable.setBusy(false);
            });
        },
        
        onCellClick(oEvent) {
            // Get the row index from the event
            const iRowIndex = oEvent.getParameter("rowIndex");
            
            // Navigate to detail view
            this._navigateToSupplierDetail(iRowIndex);
        },
        
        _navigateToSupplierDetail(iRowIndex) {
            const oTable = this.byId("suppliersTable");
            const oContext = oTable.getContextByIndex(iRowIndex);
            
            if (oContext) {
                const oSupplier = oContext.getObject();
                
                // Navigate to detail view with supplier ID
                this.getRouter().navTo("detail", {
                    supplierId: oSupplier.SupplierID
                });
            }
        }
    });
});
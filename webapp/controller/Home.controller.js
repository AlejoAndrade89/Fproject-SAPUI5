sap.ui.define([
    "com/bootcamp/sapui5/finalproject/controller/BaseController",
    "../utils/HomeHelper",
    "sap/ui/model/json/JSONModel"
], function (BaseController, HomeHelper, JSONModel) {
    "use strict";

    return BaseController.extend("com.bootcamp.sapui5.finalproject.controller.Home", {

        onInit() {
            // Modelo para filtros
            this.setModel(new JSONModel(HomeHelper.initViewModel()), "viewModel");
            
            // Eventos de ruta
            this.getRouter().getRoute("home").attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched() {
            this.byId("suppliersTable").clearSelection();
            this._loadSuppliersData();
        },

        _loadSuppliersData() {
            const oTable = this.byId("suppliersTable");
            oTable.setBusy(true);
            oTable.getBinding("rows").filter([]);
            oTable.getBinding("rows").attachEventOnce("dataReceived", () => oTable.setBusy(false));
        },

        onApplyFilter() {
            const oViewModel = this.getModel("viewModel");
            const aFilters = HomeHelper.createFilters(oViewModel.getProperty("/filter"));
            this.byId("suppliersTable").getBinding("rows").filter(aFilters);
            oViewModel.setProperty("/headerExpanded", false);
        },

        onResetFilter() {
            HomeHelper.resetFilters(this.getModel("viewModel"));
            this.byId("suppliersTable").getBinding("rows").filter([]);
        },

        onRefresh() {
            const oTable = this.byId("suppliersTable");
            oTable.setBusy(true);
            this.getModel().refresh(true);
            oTable.getBinding("rows").attachEventOnce("dataReceived", () => oTable.setBusy(false));
        },

        onCellClick(oEvent) {
            const iRowIndex = oEvent.getParameter("rowIndex");
            this._navigateToSupplierDetail(iRowIndex);
        },

        _navigateToSupplierDetail(iRowIndex) {
            const oContext = this.byId("suppliersTable").getContextByIndex(iRowIndex);
            if (oContext) {
                this.getRouter().navTo("detail", {
                    supplierId: oContext.getObject().SupplierID
                });
            }
        }
    });
});
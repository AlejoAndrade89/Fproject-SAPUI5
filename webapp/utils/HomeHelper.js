sap.ui.define([
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function (Filter, FilterOperator) {
    "use strict";

    return {
        initViewModel: function() {
            return {
                filter: {
                    supplierID: "",
                    companyName: "",
                    city: ""
                },
                headerExpanded: true
            };
        },

        createFilters: function(oFilterData) {
            const aFilters = [];
            if (oFilterData.supplierID) {
                aFilters.push(new Filter("SupplierID", FilterOperator.EQ, oFilterData.supplierID));
            }
            if (oFilterData.companyName) {
                aFilters.push(new Filter("CompanyName", FilterOperator.Contains, oFilterData.companyName));
            }
            if (oFilterData.city) {
                aFilters.push(new Filter("City", FilterOperator.Contains, oFilterData.city));
            }
            return aFilters;
        },

        resetFilters: function(oViewModel) {
            oViewModel.setProperty("/filter", {
                supplierID: "",
                companyName: "",
                city: ""
            });
        }
    };
});
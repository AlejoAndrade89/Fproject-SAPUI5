sap.ui.define([], function() {
    "use strict";

    return {
        initLocalData: function() {
            return {
                localProducts: [],
                productsAdded: false
            };
        },

        initDialogModel: function() {
            return {
                dialogMode: "display",
                busy: false,
                fieldValidated: false
            };
        },

        getDefaultFormData: function() {
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

        validateProductForm: function(oFormData) {
            return oFormData.ProductName?.trim() && 
                   oFormData.QuantityPerUnit?.trim() && 
                   oFormData.CategoryID;
        },

        createProduct: function(oFormData, supplierId) {
            return {
                ProductID: Math.floor(Math.random() * 1000) + 1000,
                ProductName: oFormData.ProductName,
                QuantityPerUnit: oFormData.QuantityPerUnit,
                UnitPrice: parseFloat(oFormData.UnitPrice) || 0,
                UnitsInStock: parseInt(oFormData.UnitsInStock) || 0,
                Discontinued: oFormData.Discontinued,
                SupplierID: parseInt(supplierId),
                CategoryID: parseInt(oFormData.CategoryID) || 1,
                ReorderLevel: parseInt(oFormData.ReorderLevel) || 10,
                UnitsOnOrder: 0
            };
        }
    };
});
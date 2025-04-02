sap.ui.define([], function () {
    "use strict";

    return {
        formatCurrency(fValue) {
            if (!fValue) {
                return "$0.00";
            }
            
            return `$${parseFloat(fValue).toFixed(2)}`;
        },
        
        formatDiscontinued(bValue) {
            // Get resource bundle
            const oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
            
            // Return text based on value
            return bValue ? oResourceBundle.getText("yes") : oResourceBundle.getText("no");
        },
        
        formatWebpage(sValue) {
            if (!sValue) {
                return "";
            }
            
            // Ensure the URL has http/https prefix
            if (!sValue.startsWith("http://") && !sValue.startsWith("https://")) {
                return `http://${sValue}`;
            }
            
            return sValue;
        }
    };
});
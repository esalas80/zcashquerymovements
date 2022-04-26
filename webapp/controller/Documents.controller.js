sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/routing/History",
    "../model/formatter",
    "sap/m/Dialog",
    "sap/ui/core/Fragment",
    "sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function(BaseController, JSONModel, History, formatter, Dialog, Fragment, Filter, FilterOperator) {
	"use strict";

	return BaseController.extend("GASS.zcashquerymovements.controller.Documents", {
        formatter: formatter,
        onInit : function () {
            // Model used to manipulate control states. The chosen values make sure,
            // detail page shows busy indication immediately so there is no break in
            // between the busy indication for loading the view's meta data
            var oViewModel = new JSONModel({
                    busy : true,
                    delay : 0
            });
            //this.getRouter().getRoute("documents").attachPatternMatched(this._onObjectMatched, this);
        },
         /**
         * Event handler  for navigating back.
         * It there is a history entry we go one step back in the browser history
         * If not, it will replace the current entry of the browser history with the worklist route.
         * @public
         */
          onNavBack : function() {
            var sPreviousHash = History.getInstance().getPreviousHash();
            if (sPreviousHash !== undefined && sPreviousHash !== "") {
                // eslint-disable-next-line sap-no-history-manipulation
                history.go(-1);
            } else {
                
                this.getRouter().navTo("object", {
                    objectId: new Date().getMilliseconds().toString() + this.create_UUID().toString() + new Date().getMilliseconds().toString()
                }, true);
            }
        },
         /* =========================================================== */
        /* internal methods                                            */
        /* =========================================================== */

        /**
         * Binds the view to the object path.
         * @function
         * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
         * @private
         */
         _onObjectMatched : function (oEvent) {
            //this.loadQuery();
        },
        _bindView : function (sObjectPath) {
            //var oViewModel = this.getModel("objectView");
        }
        
	});
});
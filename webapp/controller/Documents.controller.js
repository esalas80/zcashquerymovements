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

	return BaseController.extend("GASS.zcashqmovements.controller.Documents", {
        formatter: formatter,
        onInit : function () {
            // Model used to manipulate control states. The chosen values make sure,
            // detail page shows busy indication immediately so there is no break in
            // between the busy indication for loading the view's meta data
            var oViewModel = new JSONModel({
                    busy : true,
                    delay : 0
            });
            sap.ui.getCore().getConfiguration().setLanguage("es-MX");
            this.getRouter().getRoute("documents").attachPatternMatched(this._onObjectMatched, this);
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
            this.loadDocumentDetal();
        },
       
        loadDocumentDetal: async function(){
            var that = this;
            var i18n = this.getView().getModel("i18n").getResourceBundle();
            var docModel = sap.ui.getCore().getModel("SelectedDocument")
            var data = docModel.getData()
            this.byId("pageTitle").setText(i18n.getText("expandTitle", [data.NroDocumento]))
            this.byId("snappedTitle").setText(i18n.getText("expandTitle", [data.NroDocumento]))
            
            var entity="DetalleDocumentoSet"
            var filters=[];
            filters.push({name:"Documento", values:[data.NroDocumento]});
            filters.push({name:"Sociedad", values:[data.Sociedad]});
            filters.push({name:"Ejercicio", values:[data.Ejercicio]});
            var vexpand = "NavDocDetalle"
            var oModel=this.getView().getModel()
            sap.ui.core.BusyIndicator.show();
            var data = await  this._GEToDataV2ajaxComp(oModel,entity, filters, vexpand,"","ES")
            sap.ui.core.BusyIndicator.hide();
            if(data.d.results[0].Documento !== ""){
                console.log(data.d.results[0])
                var year  = data.d.results[0].FechaContabilizacion.substring(0,4);
                var month  = data.d.results[0].FechaContabilizacion.substring(4,6);
                var day  = data.d.results[0].FechaContabilizacion.substring(6,8);
                var fec = day +"-"+ month +"-" + year;
                data.d.results[0].FechaConta = fec;
                year  = data.d.results[0].FechaDocumento.substring(0,4);
                month  = data.d.results[0].FechaDocumento.substring(4,6);
                day  = data.d.results[0].FechaDocumento.substring(6,8);
                fec = day +"-"+ month +"-" + year;
                data.d.results[0].FechaDocto = fec;
                year  = data.d.results[0].FechaRegistro.substring(0,4);
                month  = data.d.results[0].FechaRegistro.substring(4,6);
                day  = data.d.results[0].FechaRegistro.substring(6,8);
                fec = day +"-"+ month +"-" + year;
                data.d.results[0].FechaReg = fec;
                if(data.d.results[0].NavDocDetalle.results.length > 0 ){
                    data.d.results[0].NavDocDetalle.results.forEach(element => {
                        debugger
                        element.Importe = element.Importe.trim()
                        var indexNeg = element.Importe.indexOf("-")
                        if(indexNeg > 0) {
                            element.Importe = -1 * (element.Importe.replace("-",""))
                        }
                    });
                }
                var detailModel = new sap.ui.model.json.JSONModel(data.d.results[0]);
                var movementsModel = new sap.ui.model.json.JSONModel(data.d.results[0].NavDocDetalle);
                this.getView().setModel(detailModel,"detailModel");
                this.getView().setModel(movementsModel,"movementsModel");
            } 
          
            
            
        }
        
	});
});
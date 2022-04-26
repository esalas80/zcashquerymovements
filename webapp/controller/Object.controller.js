sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/routing/History",
    "../model/formatter",
    "sap/m/Dialog",
    "sap/ui/core/Fragment",
    "./DialogCloseCash"
], function (BaseController, JSONModel, History, formatter, Dialog, Fragment,DialogCloseCash) {
    "use strict";

    return BaseController.extend("GASS.zcashquerymovements.controller.Object", {

        formatter: formatter,

        /**
         * Called when the worklist controller is instantiated.
         * @public
         */
        onInit : function () {
            // Model used to manipulate control states. The chosen values make sure,
            // detail page shows busy indication immediately so there is no break in
            // between the busy indication for loading the view's meta data
            var oViewModel = new JSONModel({
                    busy : true,
                    delay : 0
            });
            this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);
        },

        loadIngresos: async function(){
            var that = this;
            var userdata = sessionStorage.getItem("UserItems") ? JSON.parse(sessionStorage.getItem("UserItems")) :  [];
            var url = "/sap/opu/odata/sap/Z_CASHBOX_SRV/";
            var oModel = new sap.ui.model.odata.v2.ODataModel(url, {
                json: true,
                loadMetadataAsync: true
            });
            var entity="CierreCajaSet"
            var filters=[];
            filters.push({name:"Segmento", values:[userdata.Segmento]});
            filters.push({name:"Sociedad", values:[userdata.Sociedad]});
            filters.push({name:"Caja", values:[userdata.Caja]});
            filters.push({name:"Usuario", values:[userdata.Usuario]});
            var vexpand = "NavIngresos,NavMovimientos"
            var data = await  this._GEToDataV2ajaxComp(oModel,entity, filters, vexpand,"")
            if(data.d.results.length > 0){
                var anio  = data.d.results[0].Fecha.substring(0,4);
                var mes  = data.d.results[0].Fecha.substring(4,6);
                var dia  = data.d.results[0].Fecha.substring(6,8);
                var toDay = dia +"-" + mes + "-" +anio ;
                userdata.Fecha=anio +"-"+mes+"-"+dia;
                sessionStorage.removeItem("UserItems");
                sessionStorage.setItem("UserItems", JSON.stringify(userdata));
                data.d.results[0].FechaFact = toDay;
                if(data.d.results[0].NavIngresos.results.length > 0){ 
                    var sumImporte =0.00 ; 
                    var sumImporteML=0.00;
                    var impMoneda="";
                    for (var i=0; i < data.d.results[0].NavIngresos.results.length; i++){
                        sumImporte = sumImporte +  parseFloat(data.d.results[0].NavIngresos.results[i].Ingreso);
                        sumImporteML = sumImporteML + parseFloat(data.d.results[0].NavIngresos.results[i].Total);
                        impMoneda = data.d.results[0].NavIngresos.results[i].IngresoMoneda;
                    }
                    data.d.results[0].SumTotal = sumImporte;
                    data.d.results[0].SumTotalMoneda = impMoneda;
                    data.d.results[0].SumTotalML = sumImporteML;
                }
                if(data.d.results[0].NavMovimientos.results.length > 0){
                    for (var i=0; i < data.d.results[0].NavMovimientos.results.length; i++){
                        var year  = data.d.results[0].NavMovimientos.results[i].FechaContabilizacion.substring(0,4);
                        var month  = data.d.results[0].NavMovimientos.results[i].FechaContabilizacion.substring(4,6);
                        var day  = data.d.results[0].NavMovimientos.results[i].FechaContabilizacion.substring(6,8);
                        var fec = day +"-"+ month +"-" + year;
                        data.d.results[0].NavMovimientos.results[i].FechaCont = fec;
                        year  = data.d.results[0].NavMovimientos.results[i].FechaVencimiento.substring(0,4);
                        month  = data.d.results[0].NavMovimientos.results[i].FechaVencimiento.substring(4,6);
                        day  = data.d.results[0].NavMovimientos.results[i].FechaVencimiento.substring(6,8);
                        var fecVen = day +"-"+ month +"-" + year;
                        data.d.results[0].NavMovimientos.results[i].FechaVen = fecVen;

                    }
                }
                //console.log(data.d.results[0])
                var closeCashModel = new sap.ui.model.json.JSONModel(data.d.results);
                that.getView().setModel(closeCashModel,"cajaModel");
            }
        },
        /**
         * Event handler  for navigating back.
         * It there is a history entry we go one step back in the browser history
         * If not, it will replace the current entry of the browser history with the worklist route.
         * @public
         */
        onNavBack : function() {
            var sPreviousHash = History.getInstance().getPreviousHash();
            if (sPreviousHash !== undefined) {
                // eslint-disable-next-line sap-no-history-manipulation
                history.go(-1);
            } else {
                this.getRouter().navTo("worklist", {}, true);
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
            this.loadIngresos();
        },

        /**
         * Binds the view to the object path.
         * @function
         * @param {string} sObjectPath path to the object to be bound
         * @private
         */
        _bindView : function (sObjectPath) {
            var oViewModel = this.getModel("objectView");
        },
        /**
         * Método para abrir modal de Consulta de movimientos 
         */
        _onClosingCash:function(){
            var sDialogName = "DialogCloseCash";
			this.mDialogs = this.mDialogs || {};
			var oDialog = this.mDialogs[sDialogName];
            if(!oDialog){
				oDialog = new DialogCloseCash(this.oView);
				this.mDialogs[sDialogName]=oDialog;
				oDialog.setRouter(this.oRouter);
				this._oDialog = sap.ui.xmlfragment("GASS.zcashquerymovements.view.DialogCloseCash", this);
				this.getView().addDependent(this._oDialog);	
                
			}
            oDialog.open();
           
        },
        _onGetQueryPrint:function(){
            this.getRouter().navTo("queryprinter");
        },
        _onViewDoc:function(){
            this.getRouter().navTo("documents");
        }
    });

});

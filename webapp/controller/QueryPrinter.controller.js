sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/routing/History",
    "../model/formatter",
    "sap/m/Dialog",
    "sap/ui/core/Fragment",
    "sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function (BaseController, JSONModel, History, formatter, Dialog, Fragment, Filter, FilterOperator) {
    "use strict"
    return BaseController.extend("GASS.zcashqmovements.controller.QueryPrinter", {
        formatter: formatter,
        onInit : function () {
            // Model used to manipulate control states. The chosen values make sure,
            // detail page shows busy indication immediately so there is no break in
            // between the busy indication for loading the view's meta data
            var oViewModel = new JSONModel({
                    busy : true,
                    delay : 0
            });
            this.getRouter().getRoute("queryprinter").attachPatternMatched(this._onObjectMatched, this);
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
            this.loadQuery();
        },
        _bindView : function (sObjectPath) {
            //var oViewModel = this.getModel("objectView");
        },
        loadQuery: async function(){
            var that = this;
            var userdata = sessionStorage.getItem("UserItems") ? JSON.parse(sessionStorage.getItem("UserItems")) :  [];
            var url = "/sap/opu/odata/sap/Z_CASHBOX_SRV/";
            var oModel = new sap.ui.model.odata.v2.ODataModel(url, {
                json: true,
                loadMetadataAsync: true
            });
            var entity="ImpresionQuerySet"
            var filters=[];
            filters.push({name:"Segmento", values:[userdata.Segmento]});
            filters.push({name:"Sociedad", values:[userdata.Sociedad]});
            filters.push({name:"Caja", values:[userdata.Caja]});
            filters.push({name:"Usuario", values:[userdata.Usuario]});
            filters.push({name:"Fecha", values:[userdata.Fecha.replace(/-/g,"")]});
            var vexpand = "NavQueryMovs"
            var data = await  this._GEToDataV2ajaxComp(oModel,entity, filters, vexpand,"")
            if(data.d.results[0].NavQueryMovs.results.length > 0){
                
                for (var i=0; i < data.d.results[0].NavQueryMovs.results.length; i++){
                    var year  = data.d.results[0].NavQueryMovs.results[i].FechaContabillizacion.substring(0,4);
                    var month  = data.d.results[0].NavQueryMovs.results[i].FechaContabillizacion.substring(4,6);
                    var day  = data.d.results[0].NavQueryMovs.results[i].FechaContabillizacion.substring(6,8);
                    var fecConta = day +"-"+ month +"-" + year;
                    data.d.results[0].NavQueryMovs.results[i].FechaConta = fecConta;
                    year  = data.d.results[0].NavQueryMovs.results[i].FechaDocumento.substring(0,4);
                    month  = data.d.results[0].NavQueryMovs.results[i].FechaDocumento.substring(4,6);
                    day  = data.d.results[0].NavQueryMovs.results[i].FechaDocumento.substring(6,8);
                    var fecDoc = day +"-"+ month +"-" + year;
                    var HH = data.d.results[0].NavQueryMovs.results[i].HoraDocumento.substring(0,2);
                    var mm = data.d.results[0].NavQueryMovs.results[i].HoraDocumento.substring(2,4);
                    var ss = data.d.results[0].NavQueryMovs.results[i].HoraDocumento.substring(4,6);
                    var horaDoc = HH +":"+mm+":"+ss;
                    data.d.results[0].NavQueryMovs.results[i].HoraDocumento = horaDoc;
                    var indexNeg = data.d.results[0].NavQueryMovs.results[i].Importe.indexOf("-")
                    if(indexNeg > 0) {
                        data.d.results[0].NavQueryMovs.results[i].Importe = (-1 * (data.d.results[0].NavQueryMovs.results[i].Importe.replace("-",""))).toString();
                    }
                }
            
                var newData = this.generatePrintQuery(data.d.results[0].NavQueryMovs.results);
                var movModel = new sap.ui.model.json.JSONModel(newData);
                this.getView().setModel(movModel,"MovimientosModel");
            }
        },
        _onSearchFieldLiveChange: function (oEvent) {

			var sQuery = oEvent.getParameter("query");
			this._oGlobalFilter = null;
			if (sQuery) {
				this._oGlobalFilter = new Filter([
					new Filter("CajeroSecuencia", FilterOperator.Contains, sQuery),
					new Filter("Operacion", FilterOperator.Contains, sQuery),
					new Filter("Cliente", FilterOperator.Contains, sQuery),
					new Filter("CuentaBancaria", FilterOperator.Contains, sQuery),
					new Filter("Documento", FilterOperator.Contains, sQuery),
					new Filter("Importe", FilterOperator.Contains, sQuery),
					new Filter("ImporteMoneda", FilterOperator.Contains, sQuery),
					new Filter("Pagador", FilterOperator.Contains, sQuery),
					new Filter("ReferenciaPago", FilterOperator.Contains, sQuery),
					new Filter("ViaPago", FilterOperator.Contains, sQuery),
					new Filter("BancoCajero", FilterOperator.Contains, sQuery),
					new Filter("ClaveAutorizacion", FilterOperator.Contains, sQuery),
					new Filter("FechaDoc", FilterOperator.Contains, sQuery),
					new Filter("FechaConta", FilterOperator.Contains, sQuery)
				], false);
			}
			this._filter();
		},
        _filter: function () {
			var oFilter = null;
			if (this._oGlobalFilter) {
				oFilter = new sap.ui.model.Filter([this._oGlobalFilter], true);
			} else {
				oFilter = this._oGlobalFilter;
			}
			this.byId("tblMovimientos").getBinding("rows").filter(oFilter, "Application");
		},
        downloadExcel: async function () {
			sap.ui.core.BusyIndicator.show();
            var that = this;
            var userdata = sessionStorage.getItem("UserItems") ? JSON.parse(sessionStorage.getItem("UserItems")) :  [];
            var url = "/sap/opu/odata/sap/Z_CASHBOX_SRV/";
            var oModel = new sap.ui.model.odata.v2.ODataModel(url, {
                json: true,
                loadMetadataAsync: true
            });
            var entity="ImpresionQuerySet"
            var filters=[];
            filters.push({name:"Segmento", values:[userdata.Segmento]});
            filters.push({name:"Sociedad", values:[userdata.Sociedad]});
            filters.push({name:"Caja", values:[userdata.Caja]});
            filters.push({name:"Usuario", values:[userdata.Usuario]});
            filters.push({name:"Fecha", values:[userdata.Fecha.replace(/-/g,"")]});
            var vexpand = "NavQueryMovs"
            var data = await  this._GEToDataV2ajaxComp(oModel,entity, filters, vexpand,"")
            if(data.d.results[0].NavQueryMovs.results.length > 0){
            
                for (var i=0; i < data.d.results[0].NavQueryMovs.results.length; i++){
                    var year  = data.d.results[0].NavQueryMovs.results[i].FechaContabillizacion.substring(0,4);
                    var month  = data.d.results[0].NavQueryMovs.results[i].FechaContabillizacion.substring(4,6);
                    var day  = data.d.results[0].NavQueryMovs.results[i].FechaContabillizacion.substring(6,8);
                    var fecConta = day +"-"+ month +"-" + year;
                    data.d.results[0].NavQueryMovs.results[i].FechaConta = fecConta;
                    year  = data.d.results[0].NavQueryMovs.results[i].FechaDocumento.substring(0,4);
                    month  = data.d.results[0].NavQueryMovs.results[i].FechaDocumento.substring(4,6);
                    day  = data.d.results[0].NavQueryMovs.results[i].FechaDocumento.substring(6,8);
                    var fecDoc = day +"-"+ month +"-" + year;
                    data.d.results[0].NavQueryMovs.results[i].FechaDoc = fecDoc;
                    var HH = data.d.results[0].NavQueryMovs.results[i].HoraDocumento.substring(0,2);
                    var mm = data.d.results[0].NavQueryMovs.results[i].HoraDocumento.substring(2,4);
                    var ss = data.d.results[0].NavQueryMovs.results[i].HoraDocumento.substring(4,6);
                    var horaDoc = HH +":"+mm+":"+ss;
                    data.d.results[0].NavQueryMovs.results[i].HoraDocumento = horaDoc;
                    var indexNeg = data.d.results[0].NavQueryMovs.results[i].Importe.indexOf("-")
                    if(indexNeg > 0) {
                        data.d.results[0].NavQueryMovs.results[i].Importe = (-1 * (data.d.results[0].NavQueryMovs.results[i].Importe.replace("-",""))).toString();
                    }
                }
                var newData = this.generatePrintQuery(data.d.results[0].NavQueryMovs.results);
                this._onGetExcel(newData);
                sap.ui.core.BusyIndicator.hide();
            }else{
                sap.ui.core.BusyIndicator.hide();
            }
		},
    });
});    
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/UIComponent",
    "sap/m/library",
    "sap/m/MessageBox",
	"sap/m/MessageToast",
	"sap/ui/export/Spreadsheet",
	"sap/ushell/services/Container"
], function (Controller, UIComponent, mobileLibrary, MessageBox, MessageToast, Spreadsheet, Container) {
    "use strict";

    // shortcut for sap.m.URLHelper
    var URLHelper = mobileLibrary.URLHelper;

    return Controller.extend("GASS.zcashqmovements.controller.BaseController", {
        /**
         * Convenience method for accessing the router.
         * @public
         * @returns {sap.ui.core.routing.Router} the router for this component
         */
        getRouter : function () {
            return UIComponent.getRouterFor(this);
        },

        /**
         * Convenience method for getting the view model by name.
         * @public
         * @param {string} [sName] the model name
         * @returns {sap.ui.model.Model} the model instance
         */
        getModel : function (sName) {
            return this.getView().getModel(sName);
        },

        /**
         * Convenience method for setting the view model.
         * @public
         * @param {sap.ui.model.Model} oModel the model instance
         * @param {string} sName the model name
         * @returns {sap.ui.mvc.View} the view instance
         */
        setModel : function (oModel, sName) {
            return this.getView().setModel(oModel, sName);
        },

        /**
         * Getter for the resource bundle.
         * @public
         * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
         */
        getResourceBundle : function () {
            return this.getOwnerComponent().getModel("i18n").getResourceBundle();
        },

        /**
         * Event handler when the share by E-Mail button has been clicked
         * @public
         */
        onShareEmailPress : function () {
            var oViewModel = (this.getModel("objectView") || this.getModel("worklistView"));
            URLHelper.triggerEmail(
                null,
                oViewModel.getProperty("/shareSendEmailSubject"),
                oViewModel.getProperty("/shareSendEmailMessage")
            );
        },
        create_UUID: function () {
            var dt = new Date().getTime();
            var uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
                var r = (dt + Math.random() * 16) % 16 | 0;
                dt = Math.floor(dt / 16);
                return (c == "x" ? r : (r & 0x3 | 0x8)).toString(16);
            });
            return uuid;
        },
        getCatalogoV2: function(modelo, entidad, vfilters){
            return new Promise(function(resolve, reject) {
                modelo.read(entidad, {
                    filters: vfilters,
                    success: function(data){
                        resolve(data);
                    },
                    reject: function(err){
                        reject(err);
                    }
                });
            });
        },
        	/* Método generrico para obtener catálogos para ODATA V2 Ajax.
		* @param  {} urlDest | Ur destino de configuracion de sistema SAP.
		* @param  {} modelo | Modelo o entidad que se quiere consultar.
		* @param  {} query | filtros para Obtener.
		*/
		_getOdataV2Ajax: function (urlDest, modelo, query) {
			var that = this;
			var sUrl = urlDest + modelo + query;
			return new Promise(function(resolve, reject){
				$.ajax({
					url: sUrl,
					type: "GET",
					dataType: "json",
					contentType: "application/json; charset=utf-8; IEEE754Compatible=true",
					success: function (dataResponse) {
						resolve(dataResponse);
					},
					error: function (error) {
						sap.ui.core.BusyIndicator.hide();
						MessageBox.error("Error: ", {
							icon: MessageBox.Icon.ERROR,
							title: "Error"
						});
						reject(error);
					}
				});
			});
		},
        _GEToDataV2ajaxComp: function(model, entity, filter, expand, select, language="") {
			var that = this;
			var urlAux = new Array();
			var modelURL = model.sServiceUrl;
			var entityADD = "/" + entity;
			var environmentSrc = window.location.origin;

			if (expand != "") {
				urlAux.push("$expand=" + expand);
			}
			if (select != "") {
				urlAux.push("$select=" + select);
			}
		
			if (filter.length > 0) {
				var auxFilterObject = new Array();
				var auxQuery = "";
				for (var item in filter) {
					var name = filter[item].name;
					var values = filter[item].values;
					var vLength = values.length;
					auxQuery = "(";
					for (var elem in values) {
						auxQuery = auxQuery + name + " eq '" + values[elem] + "' or ";
					}
					auxQuery = auxQuery.slice(0, -4) + ")";
					auxFilterObject.push(auxQuery);
				}
				auxQuery = "";
				for (var vfilter in auxFilterObject) {
					auxQuery = auxQuery + auxFilterObject[vfilter] + " and ";
				}
				auxQuery = auxQuery.slice(0, -5);
				urlAux.push("$filter=" + auxQuery);
			}
			var queryOptions = "";
			if (urlAux.length > 0) {
				queryOptions = "?";
				for (var option in urlAux) {
					queryOptions = queryOptions + urlAux[option] + "&";
				}
				queryOptions = queryOptions.slice(0, -1);
			}
			
			var metadataParams=""
			if(language !== "" ){
				metadataParams = "&sap-language='"+language+"'";
				
			}
			var sUrl = environmentSrc + modelURL + entityADD + queryOptions + metadataParams;
			return new Promise(function(fnResolve, fnReject){
				$.ajax({
					url: sUrl,
					type: "GET",
					dataType: "json",
					contentType: "application/json; charset=utf-8; IEEE754Compatible=true",
					success: function(dataResponse) {
						//console.log("dataResponse-------> ",dataResponse)
						fnResolve(dataResponse);
					},
					error: function(error, status, err) {
						sap.ui.core.BusyIndicator.hide();
						//console.log("error",error)
						/*MessageBox.error(error.responseText.replaceAll("\n",""), {
							icon: MessageBox.Icon.ERROR,
							title: err
						});*/
						fnReject(new Error(error));
					}
				});
			});
		},
		_CreateCloseChasV2: function (entity, aData) {
			var that = this;
			return new Promise(function (fnResolve, fnReject) {
				that._oView.getModel().create(entity, aData, {
					success: function (oData, oResponse) {
						fnResolve(oResponse);
					},
					error: function (oError) {
						fnReject(new Error(oError.message));
					}
				});
			})

		},
		_onGetExcel: function (oModel) {
			var aCols, aProducts, oSettings, oSheet;
			aCols = this.createColumns();
			aProducts = oModel;
			var dtValue = new Date();
			//oView.setModel(aProducts, "modelV4");
			oSettings = {
				workbook: {
					columns: aCols
				},
				dataSource: aProducts,
				fileName: "RptMovimientos_" + String(dtValue.getDate()) + String(dtValue.getMonth()+1) + String(dtValue.getFullYear()) + String(dtValue.getHours()) + String(dtValue.getMinutes())				
			};
			oSheet = new Spreadsheet(oSettings);
			oSheet.build()
				.then(function () {
					sap.ui.core.BusyIndicator.hide();
					MessageToast.show('Termino la descarga!');
				})
				.finally(function () {
					oSheet.destroy();
				});
		},
		//Complemento para downloadExcel
		createColumns: function () {
			return [{
				label: 'Usuario',
				property: 'Usuario',
			}, {
				label: 'Caja',
				property: 'CajeroSecuencia',
			}, {
				label: 'Operacion',
				property: 'Operacion',
			}, {
				label: 'Cliente',
				property: 'Cliente',
			}, {
				label: 'Via Pago',
				property: 'ViaPago',
			}, {
				label: 'Ref. Pago',
				property: 'ReferenciaPago',
			}, {
				label: 'Moneda',
				property: 'ImporteMoneda',
			}, {
				label: 'Importe',
				property: 'Importe',
			}, {
				label: 'Nro. Documento',
				property: 'Documento',
			}, {
				label: 'Fecha Contabilización',
				property: 'FechaConta',
                format: "dd-mm-yyyy"
			}, {
				label: 'Fecha Documento',
				property: 'FechaDoc',
                format: "dd-mm-yyyy"
			},{
				label: 'Hora Documento',
				property: 'HoraDocumento',
			},  {
				label: 'Banco/Cajero',
				property: 'BancoCajero',
			}, {
				label: 'Cta. Bancaria',
				property: 'CuentaBancaria',
			}, {
				label: 'Cv. Autorización',
				property: 'vin',
			}, {
				label: 'Pagador',
				property: 'Pagador',
			}];
		},
		generatePrintQuery: function(model){
			var granTotal = 0
			var totalGrupo=0;
			var vDataGroup =  model.sort(function(a, b){
				if(a.ViaPago < b.ViaPago) return -1;
				if(a.ViaPago > b.ViaPago) return 1;
				return 0
			});
			var viaPagoAnt = ""
			var cajeroAnt = ""
			var viaPagoAnt = ""
			var cajeroAnt = ""
			
			var newData=[];
			for (let index = 0; index < vDataGroup.length; index++) {
				var nViaPago = vDataGroup[index].ViaPago;
				var objQueryMov = {
					BancoCajero: vDataGroup[index].BancoCajero,
					Caja:  vDataGroup[index].Caja,
					CajeroSecuencia:  vDataGroup[index].CajeroSecuencia,
					ClaveAutorizacion:  vDataGroup[index].ClaveAutorizacion,
					Cliente: vDataGroup[index].Cliente,
					CuentaBancaria: vDataGroup[index].CuentaBancaria,
					Documento: vDataGroup[index].Documento,
					FechaConta: vDataGroup[index].FechaConta,
					FechaContabillizacion: vDataGroup[index].FechaContabillizacion,
					FechaDoc: vDataGroup[index].FechaDoc,
					FechaDocumento: vDataGroup[index].FechaDocumento,
					HoraDocumento: vDataGroup[index].HoraDocumento,
					Importe:  vDataGroup[index].Importe,
					ImporteMoneda: vDataGroup[index].ImporteMoneda,
					ImporteUSD: vDataGroup[index].ImporteUSD,
					Indice: vDataGroup[index].Indice,
					Operacion: vDataGroup[index].Operacion,
					Pagador: vDataGroup[index].Pagador,
					ReferenciaPago: vDataGroup[index].ReferenciaPago,
					TipoCambio: vDataGroup[index].TipoCambio,
					Usuario:  vDataGroup[index].Usuario,
					ViaPago: vDataGroup[index].ViaPago
				}
				if((vDataGroup[index].ViaPago !== viaPagoAnt) && (viaPagoAnt !=="")){
					var objTotal = {
						BancoCajero: "",
						Caja:  vDataGroup[index].Caja,
						CajeroSecuencia:  vDataGroup[index].CajeroSecuencia,
						ClaveAutorizacion:  "",
						Cliente: "",
						CuentaBancaria: "",
						Documento: "",
						FechaConta: "",
						FechaContabillizacion: "",
						FechaDoc: "",
						FechaDocumento: "",
						HoraDocumento: "",
						Importe: totalGrupo.toFixed(3) ,
						ImporteMoneda: vDataGroup[index].ImporteMoneda,
						ImporteUSD: vDataGroup[index].ImporteUSD,
						Indice: "",
						Operacion: "",
						Pagador: "",
						ReferenciaPago: "",
						TipoCambio: "",
						Usuario:  "",
						ViaPago: viaPagoAnt,
						Status: "Information"
					}
					newData.push(objTotal)
					totalGrupo=0;
				}
				totalGrupo += parseFloat(vDataGroup[index].Importe.trim());
				granTotal += parseFloat(vDataGroup[index].Importe.trim());
				newData.push(objQueryMov)
				viaPagoAnt= vDataGroup[index].ViaPago;
				cajeroAnt= vDataGroup[index].BancoCajero;
				if(index === vDataGroup.length-1){
					var objTotal = {
						BancoCajero: "",
						Caja:  vDataGroup[index].Caja,
						CajeroSecuencia:  vDataGroup[index].CajeroSecuencia,
						ClaveAutorizacion:  "",
						Cliente: "",
						CuentaBancaria: vDataGroup[index].CuentaBancaria,
						Documento: vDataGroup[index].Documento,
						FechaConta: "",
						FechaContabillizacion: "",
						FechaDoc: "",
						FechaDocumento: "",
						HoraDocumento: "",
						Importe: totalGrupo.toFixed(3) ,
						ImporteMoneda: vDataGroup[index].ImporteMoneda,
						ImporteUSD: vDataGroup[index].ImporteUSD,
						Indice: "",
						Operacion: "",
						Pagador: "",
						ReferenciaPago: "",
						TipoCambio: "",
						Usuario:  "",
						ViaPago: viaPagoAnt,
						Status: "Information"
					}
					newData.push(objTotal)
				}  
			}
			newData[0].SumTotal=granTotal.toFixed(3)
			return newData;
		}
    });
});
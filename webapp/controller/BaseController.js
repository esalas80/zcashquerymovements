sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/UIComponent",
    "sap/m/library",
    "sap/m/MessageBox"
], function (Controller, UIComponent, mobileLibrary, MessageBox) {
    "use strict";

    // shortcut for sap.m.URLHelper
    var URLHelper = mobileLibrary.URLHelper;

    return Controller.extend("NAMESPACE.zcashclose.controller.BaseController", {
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
        _GEToDataV2ajaxComp: function(model, entity, filter, expand, select) {
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

			var sUrl = environmentSrc + modelURL + entityADD + queryOptions;
			
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

		}
    });

});
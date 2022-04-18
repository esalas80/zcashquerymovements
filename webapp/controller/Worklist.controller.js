sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "../model/formatter",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/Fragment",
    "sap/m/MessageBox",
    "sap/m/Token",
    "sap/m/Dialog"
], function (BaseController, JSONModel, formatter, Filter, FilterOperator, Fragment, MessageBox, Token, Dialog) {
    "use strict";

    return BaseController.extend("NAMESPACE.zcashclose.controller.Worklist", {

        formatter: formatter,

        onInit : function () {
            var oViewModel;
            // Model used to manipulate control states
            oViewModel = new JSONModel({});
            this.setModel(oViewModel, "worklistView");

        },
        /**
         * Event handler when a table item gets pressed
         * @param {sap.ui.base.Event} oEvent the table selectionChange event
         * @public
         */
        onPress : function (oEvent) {
            // The source is the list item that got pressed
            this._showObject(oEvent.getSource());
        },

        /**
         * Event handler for navigating back.
         * Navigate back in the browser history
         * @public
         */
        onNavBack : function() {
            // eslint-disable-next-line sap-no-history-manipulation
            history.go(-1);
        },

        /* =========================================================== */
        /* internal methods                                            */
        /* =========================================================== */

        /**
         * Shows the selected item on the object page
         * @param {sap.m.ObjectListItem} oItem selected Item
         * @private
         */
        _showObject : function (oItem) {
            this.getRouter().navTo("object", {
                objectId: oItem.getBindingContext().getPath().substring("/ViasDePagoSet".length)
            });
        },
        /*================================================================*
         * Método para hacer login para cierre de operaciones de caja  
         =================================================================*/
        _onLoginClosingCash:function(){
            var that = this;
            var sociedad = this.getView().byId("help_Society").getValue();
            var segmento = this.getView().byId("help_Div").getValue();
            var caja = this.getView().byId("idCaja").getValue();
            var usuario = this.getView().byId("idUser").getValue();
            if(sociedad === "" || segmento === "" || caja === "" || usuario === ""){
                this.getView().byId("help_Society").setValueState("Error");
                this.getView().byId("help_Div").setValueState("Error");
                this.getView().byId("idCaja").setValueState("Error");
                this.getView().byId("idUser").setValueState("Error");
                return;
            }
            else{
                this.getView().byId("help_Society").setValueState("None");
                this.getView().byId("help_Div").setValueState("None");
                this.getView().byId("idCaja").setValueState("None");
                this.getView().byId("idUser").setValueState("None");
            }
            var destination = "/sap/opu/odata/sap/Z_CASHBOX_SRV/";
            var modelo="ValidacionSociedadSet"
            var query = "(Sociedad='"+ sociedad +"',Segmento='"+ segmento +"',Caja='"+caja+"',Usuario='"+ usuario +"')"
            sap.ui.core.BusyIndicator.show();
            
            this._getOdataV2Ajax(destination,modelo,query).then(function(data){
                sap.ui.core.BusyIndicator.hide();
                var resp = data.d;
                if(sessionStorage.getItem("UserItems")){
                    sessionStorage.removeItem("UserItems")
                } 
                sessionStorage.setItem("UserItems", JSON.stringify(resp))
                
                this.getRouter().navTo("object", {
                    objectId: new Date().getMilliseconds().toString() + this.create_UUID().toString() + new Date().getMilliseconds().toString() + this.create_UUID().toString()
                });

                // if(resp.Codigo !== "3"){
                //     if(sessionStorage.getItem("UserItems")){
                //         sessionStorage.removeItem("UserItems")
                //     } 
                //     sessionStorage.setItem("UserItems", JSON.stringify(resp))
                    
                //     this.getRouter().navTo("object", {
                //         objectId: new Date().getMilliseconds().toString() + this.create_UUID().toString() + new Date().getMilliseconds().toString() + this.create_UUID().toString()
                //     });
                // }
                // else{
                //     MessageBox.error("Error:" + resp.Descripcion, {
                //         icon: MessageBox.Icon.ERROR,
                //         title: "Error"
                //     });
                // }
                
            }.bind(this)).catch(function(err){
                sap.ui.core.BusyIndicator.hide();
                MessageBox.error("Error:", {
                    icon: MessageBox.Icon.ERROR,
                    title: "Error"
                });
            });
        },
        onLiveTextChange: function(oEvent){
            var input = oEvent.getSource();
            input.setValue(input.getValue().toString().toUpperCase());
        }
    });
});

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

    return BaseController.extend("GASS.zcashquerymovements.controller.Worklist", {

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
			var caja = this.getView().byId("help_Caja").getValue(); 
            var dpFec = this.getView().byId("idDPFecha").getValue()
            var usuario = this.getView().byId("idUser").getValue();
			sociedad = sociedad ===""? this.getView().byId("help_Society").getTokens().length > 0 ?  this.getView().byId("help_Society").getTokens()[0].getKey() : "" : sociedad;
            segmento = segmento === ""? this.getView().byId("help_Div").getTokens().length > 0 ?  this.getView().byId("help_Div").getTokens()[0].getKey() : "" :segmento;
            caja = caja ===""? this.getView().byId("help_Caja").getTokens().length > 0 ?  this.getView().byId("help_Caja").getTokens()[0].getKey() : "":caja;
            
            if(sociedad === "" || segmento === "" || caja === "" || usuario === ""){
                this.getView().byId("help_Society").setValueState("Error");
                this.getView().byId("help_Div").setValueState("Error");
                this.getView().byId("help_Caja").setValueState("Error");
                this.getView().byId("idUser").setValueState("Error");
                return;
            }
            else{
                this.getView().byId("help_Society").setValueState("None");
                this.getView().byId("help_Div").setValueState("None");
                this.getView().byId("help_Caja").setValueState("None");
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
        },
        /*================================================================*
         * Método para hacer Ayudas de busqueda de catalogos   
         =================================================================*/
        /**
         * ernesto.valencia@seidor.com
		 * 20/04/2022
         * Ayuda de busqueda  para sociedades
         */
        handleSelectSociety:function(){
            var that=this;
            var oView = this.getView();
			let model = oView.getModel();
			let modelAux = new sap.ui.model.json.JSONModel();
			model.read("/ZsociedadesSet", {
				success: function (result) {
					let dataresponse = result.results
					modelAux.setData(dataresponse);
				},
				error: function (err) {
					console.log(err)
				}
			});
			// create dialog lazily
			if (!this.byId("SelectDialog_Soc")) {
				// load asynchronous XML fragment
				Fragment.load({
					id: oView.getId(),
					name: "GASS.zcashquerymovements.view.SelectDialogSociedad",
					controller: that
				}).then(function (oDialog) {
					// connect dialog to the root view of this component (models, lifecycle)
					oView.addDependent(oDialog);
					oDialog.setModel(modelAux,"catSociedad")
					oDialog.open();
				});
			} else {
				this.byId("SelectDialog_Soc").setModel(modelAux,"catSociedad")
				this.byId("SelectDialog_Soc").open();
			}
        },
        /**
         * ernesto.valencia@seidor.com
		 * 20/04/2022
		 * Método para asignar items de ayudad de busqueda de sociedades.
         * @param  {} oEvent || evento de objeto DOM"
         */
        handleValueSocHelppress: function (oEvent) {
			/*eliminar todos los tokens antes de cerrar el the value help*/
			this.byId("help_Society").removeAllTokens();
			this.getView().byId("help_Society").setValue("")
			
			this.SociedadCodigos = [];
			var oSelectedItems = oEvent.getParameter("selectedItems"),
				oInput = this.byId("productInput");
			var aTitle = [];
			var cFilter = [];
			if (oSelectedItems !== "undefined") {
				for (var title = 0; title < oSelectedItems.length; title++) {

					var text = oSelectedItems[title].getTitle();
					aTitle.push(text);
					this.SociedadCodigos.push(oSelectedItems[title].getInfo());
				}
				for (var plant = 0; plant < aTitle.length; plant++) {
					this.byId("help_Society").addToken(new sap.m.Token({
						key: this.SociedadCodigos[plant],
						text: aTitle[plant]
					}));
				}
				for (var ifil = 0; ifil <= this.SociedadCodigos.length; ifil++) {
					cFilter.push(new sap.ui.model.Filter("Butxt", sap.ui.model.FilterOperator.EQ, this.SociedadCodigos.text));
				}
				/* agregando los valores seleccionados a los tokens.*/
			} else {
				oInput.resetProperty("value");
			}
		},
        /**
         * Método para filtrar dentro de la ayuda de busqueda de sociedades
         * ernesto.valencia@seidor.com
		 * 20/04/2022
         * @param  {} oEvent || Evento del objeto DOM
         */
        handleSearchSociedad: function (oEvent) {
			var sValue = oEvent.getParameter("value");
			var sQuery = sValue.toUpperCase();
			var aFilters = new sap.ui.model.Filter({
				filters: [
					new sap.ui.model.Filter("Butxt", sap.ui.model.FilterOperator.Contains, sValue.toUpperCase()),
					new sap.ui.model.Filter("Bukrs", sap.ui.model.FilterOperator.Contains, sValue)
				],
				and: false
			});
			var oBinding = oEvent.getSource().getBinding("items");
			oBinding.filter(aFilters);

		},


        /**
         * ernesto.valencia@seidor.com
		 * 20/04/2022
         * Ayuda de busqueda  para Segmentos
         */
        handleSelectSegmento: function(){
            var that=this;
            var oView = this.getView();
			let model = oView.getModel();
			let modelAux = new sap.ui.model.json.JSONModel();
			model.read("/ZsegmentosSet", {
				success: function (result) {
					let dataresponse = result.results
					modelAux.setData(dataresponse);
				},
				error: function (err) {
					console.log(err)
				}
			});
			// create dialog lazily
			if (!this.byId("SelectDialog_Seg")) {
				// load asynchronous XML fragment
				Fragment.load({
					id: oView.getId(),
					name: "GASS.zcashquerymovements.view.SelectDialogSegmento",
					controller: that
				}).then(function (oDialog) {
					// connect dialog to the root view of this component (models, lifecycle)
					oView.addDependent(oDialog);
					oDialog.setModel(modelAux,"catSegmento")
					oDialog.open();
				});
			} else {
				this.byId("SelectDialog_Seg").setModel(modelAux,"catSegmento")
				this.byId("SelectDialog_Seg").open();
			}
        },
         /**
         * ernesto.valencia@seidor.com
		 * 20/04/2022
		 * Método para asignar items de ayudad de busqueda de Segmento.
         * @param  {} oEvent || evento de objeto DOM"
         */
          handleValueSegHelppress: function (oEvent) {
			this.getView().byId("help_Div").setValue("")
			this.byId("help_Div").removeAllTokens();
			var SegmentosCodigos = [];
			var oSelectedItems = oEvent.getParameter("selectedItems");
			var aTitle = [];
			var cFilter = [];
			if (oSelectedItems !== "undefined") {
				for (var title = 0; title < oSelectedItems.length; title++) {

					var text = oSelectedItems[title].getTitle();
					aTitle.push(text);
					SegmentosCodigos.push(oSelectedItems[title].getInfo());
				}
				for (var plant = 0; plant < aTitle.length; plant++) {
					this.byId("help_Div").addToken(new sap.m.Token({
						key: SegmentosCodigos[plant],
						text: aTitle[plant]
					}));
				}
				for (var ifil = 0; ifil <= SegmentosCodigos.length; ifil++) {
					cFilter.push(new sap.ui.model.Filter("Segment", sap.ui.model.FilterOperator.EQ, SegmentosCodigos.text));
				}
				/* agregando los valores seleccionados a los tokens.*/
			}
		},
        /**
         * Método para filtrar dentro de la ayuda de busqueda de segmento
         * ernesto.valencia@seidor.com
		 * 20/04/2022
         * @param  {} oEvent || Evento del objeto DOM
         */
        handleSearchSegmento: function(oEvent){
            var sValue = oEvent.getParameter("value");
			var sQuery = sValue.toUpperCase();
			var aFilters = new sap.ui.model.Filter({
				filters: [
					new sap.ui.model.Filter("Segment", sap.ui.model.FilterOperator.Contains, sValue.toUpperCase())
				],
				and: false
			});
			var oBinding = oEvent.getSource().getBinding("items");
			oBinding.filter(aFilters);
        },
        

        /**
         * ernesto.valencia@seidor.com
		 * 20/04/2022
         * Ayuda de busqueda  para Caja
        */
          handleSelectCaja: function(){
            var that=this;
            var oView = this.getView();
			let model = oView.getModel();
			let modelAux = new sap.ui.model.json.JSONModel();
			model.read("/ZShCajaSet", {
				success: function (result) {
					let dataresponse = result.results
					modelAux.setData(dataresponse);
				},
				error: function (err) {
					console.log(err)
				}
			});
			// create dialog lazily
			if (!this.byId("SelectDialog_Caja")) {
				// load asynchronous XML fragment
				Fragment.load({
					id: oView.getId(),
					name: "GASS.zcashquerymovements.view.SelectDialogCaja",
					controller: that
				}).then(function (oDialog) {
					// connect dialog to the root view of this component (models, lifecycle)
					oView.addDependent(oDialog);
					oDialog.setModel(modelAux,"catCaja")
					oDialog.open();
				});
			} else {
				this.byId("SelectDialog_Caja").setModel(modelAux,"catCaja")
				this.byId("SelectDialog_Caja").open();
			}
        },
         /**
         * ernesto.valencia@seidor.com
		 * 20/04/2022
		 * Método para asignar items de ayudad de busqueda de Caja.
         * @param  {} oEvent || evento de objeto DOM"
         */
          handleValueCajaHelppress: function (oEvent) {
			this.getView().byId("help_Caja").setValue("")
			this.byId("help_Caja").removeAllTokens();
			var CajaCodigos = [];
			var oSelectedItems = oEvent.getParameter("selectedItems");
			var aTitle = [];
			var cFilter = [];
			if (oSelectedItems !== "undefined") {
				for (var title = 0; title < oSelectedItems.length; title++) {

					var text = oSelectedItems[title].getTitle();
					aTitle.push(text);
					CajaCodigos.push(oSelectedItems[title].getInfo());
				}
				for (var plant = 0; plant < aTitle.length; plant++) {
					this.byId("help_Caja").addToken(new sap.m.Token({
						key: CajaCodigos[plant],
						text: aTitle[plant]
					}));
				}
				for (var ifil = 0; ifil <= CajaCodigos.length; ifil++) {
					cFilter.push(new sap.ui.model.Filter("Segment", sap.ui.model.FilterOperator.EQ, CajaCodigos.text));
				}
				/* agregando los valores seleccionados a los tokens.*/
			}
		},
        /**
         * Método para filtrar dentro de la ayuda de busqueda de Caja
         * ernesto.valencia@seidor.com
		 * 20/04/2022
         * @param  {} oEvent || Evento del objeto DOM
         */
         handleSearchCaja: function(oEvent){
            var sValue = oEvent.getParameter("value");
			var sQuery = sValue.toUpperCase();
			var aFilters = new sap.ui.model.Filter({
				filters: [
					new sap.ui.model.Filter("Caja", sap.ui.model.FilterOperator.Contains, sValue.toUpperCase())
				],
				and: false
			});
			var oBinding = oEvent.getSource().getBinding("items");
			oBinding.filter(aFilters);
        }
    });
});

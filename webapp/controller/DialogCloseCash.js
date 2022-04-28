sap.ui.define([
	"./BaseController",
	"sap/m/MessageBox",
	"sap/ui/core/Fragment",
	"sap/ui/core/routing/History",
	"./BaseController"
], function(BaseController, MessageBox, Utilities, Fragment, History, Edit) {

	return BaseController.extend("GASS.zcashqmovements.controller.DialogCloseCash", {
	// return BaseController.extend("GASS.zcashqmovements.controller.DialogCloseCash", {
		constructor: function(oView) {
			this._oView = oView;
			this._oControl = sap.ui.xmlfragment(oView.getId(), "GASS.zcashqmovements.view.DialogCloseCash", this);
			this._bInit = false;
		},

		exit: function() {
			delete this._oView;
		},

		getView: function() {
			return this._oView;
		},

		getControl: function() {
			return this._oControl;
		},

		getOwnerComponent: function() {
			return this._oView.getController().getOwnerComponent();
		},

		open: function() {
			var oView = this._oView;
			var oControl = this._oControl;
			if (!this._bInit) {

				// Initialize our fragment
				this.onInit();

				this._bInit = true;

				// connect fragment to the root view of this component (models, lifecycle)
				oView.addDependent(oControl);
			}

			var args = Array.prototype.slice.call(arguments);
			if (oControl.open) {
				oControl.open.apply(oControl, args);
			} else if (oControl.openBy) {
				oControl.openBy.apply(oControl, args);
			}
            var otable=this._oView.byId("tblClose");
			var model = this._oView.getModel("cajaModel");
			var data = model.getData()[0].NavMovimientos.results;
			if(data.length > 0){
				for (let index = 0; index < data.length; index++) {
					data[index].Banco="";
					data[index].SaldoFinal="";
					data[index].Cheque="";
					data[index].Descricpcion="";
					data[index].ImportePerdido="";
					data[index].Diferencia="";
				}
			}			
			var modelAux = new sap.ui.model.json.JSONModel(data);
            otable.setModel(modelAux,"closeCahsModel")
		},

		close: function() {
			this._oControl.close();
		},

		setRouter: function(oRouter) {
			this.oRouter = oRouter;

		},
		getBindingParameters: function() {
			return {};

		},
		_onButtonPress: function() {
			this.close();
		},
		_onEditarOp: function(oEvent){
			var sDialogName = "Edit";
			this.mDialogs = this.mDialogs || {};
			var oDialog = this.mDialogs[sDialogName];
			//Crear instancia dialogo si no existe
			if (!oDialog) {
				oDialog = new Edit(this.getView());
				this.mDialogs[sDialogName] = oDialog;
				oDialog.setRouter(this.oRouter);
			}
			var context = oEvent.getSource().getBindingContext();
			oDialog._oControl.setBindingContext(context);
			oDialog.open();
		},
		onInit: function() {
			this._oDialog = this.getControl();
		},
		onExit: function() {
			this._oDialog.destroy();

		},
		_onCompleteBalnce: function(){
			var otable=this._oView.byId("tblClose");
			var data = otable.getModel("closeCahsModel").getData();
			var tableModel=this._oView.byId("tblClose").getModel("closeCahsModel");
			if(data.length > 0){
				for (let i = 0; i < data.length; i++) {
					tableModel.setProperty("/"+ i +"/SaldoFinal",tableModel.getProperty("/"+ i +"/Importe").trim());
					tableModel.setProperty("/"+ i +"/ImportePerdido",tableModel.getProperty("/"+ i +"/Importe").trim());
				}
			}
		},
		_onApplyClosure: function(){
			that = this;
			var otable=this._oView.byId("tblClose");
			var tableModel=this._oView.byId("tblClose").getModel("closeCahsModel");
			var tableData=tableModel.getData();
			if (tableData.length > 0){
				for (let index = 0; index < tableData.length; index++) {
					var saldoFin = tableData[index].SaldoFinal;
					if(saldoFin===""){
						MessageBox.error("Debe seleccionar primero Completar saldos.", {
							icon: MessageBox.Icon.ERROR,
							title: "Error"
						});
						this._oView.byId("inputSaldoFin").setValueState("Error");
						return;
					}
					else{
						this._oView.byId("inputSaldoFin").setValueState("None");
					}
				}
			}
			else{
				MessageBox.error("No existen Movimientos de caja.", {
                    icon: MessageBox.Icon.ERROR,
                    title: "Error"
                });
				return;
			}
			var userdata = sessionStorage.getItem("UserItems") ? JSON.parse(sessionStorage.getItem("UserItems")) :  [];
			var Movements=[]
			var dataTable = otable.getModel("closeCahsModel").getData();
			if (dataTable.length > 0 ) {
				for (let i= 0; i < dataTable.length; i++) {
					var arrFec = dataTable[i].FechaVen.split("-");
					var fec=arrFec[2]+arrFec[1]+arrFec[0];
					var itemMovement = {
						"Caja" : dataTable[i].Caja,
						"Indice" : dataTable[i].Indice,
						"Moneda" : dataTable[i].ImporteMoneda,
						"MetodoPago" : dataTable[i].ViaPago,
						"MetodoDesc" : "",
						"Importe" : dataTable[i].Importe.trim().replace(/,/g, ","),
						"Banco" : "",
						"Cheque" : "",
						"Fecha" : fec,
						"CveAutorizacion" : dataTable[i].ClaveAutorizacion,
						"Pagador" : dataTable[i].Pagador,
						"ImportePerdido" :  dataTable[i].Importe.trim().replace(/,/g, ","),
						"Diferencia" : "00.0"
					}
					Movements.push(itemMovement)
				}
			}
			var jsondata ={
				"IvBukrs" : userdata.Sociedad,
				"IvSegment" : userdata.Segmento,
				"IvCashbox" : userdata.Caja,
				"IvUser" : userdata.Usuario,
				"EvCode" : "",
				"EvDescription" : "",
				"CashClosingMov" : Movements
			}

			sap.ui.core.BusyIndicator.show();
			var modelClose = this._oView.getModel();
			this._CreateCloseChasV2("/CashClosingSet", jsondata).then(function(dataResp){
				var resp = dataResp.data;
				var message = resp.EvDescription != undefined? resp.EvDescription: "";
				if(resp.EvCode =="1"){
					sap.ui.core.BusyIndicator.hide();
					MessageBox.success("Consulta de movimientos realizado con exito \n " + message  , {
						icon: MessageBox.Icon.SUCCESS,
						title: "Éxito",
						onClose: function(){
							that._onButtonPress();
						}
					});
				}
				else{
					MessageBox.error("Error al solicitar Consulta de movimientos", {
						icon: MessageBox.Icon.ERROR,
						title: "Error",
						onClose: function(){
							that._onButtonPress();
						}
					});	
				}
			}.bind(this)).catch(function(err){
                sap.ui.core.BusyIndicator.hide();
                MessageBox.error("Error al solicitar Consulta de movimientos", {
                    icon: MessageBox.Icon.ERROR,
                    title: "Error",
					onClose: function(){
						that._onButtonPress();
					}
                });
            });

		},
		
	});
}, /* bExport= */ true);

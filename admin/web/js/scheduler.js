class Scheduler extends MylsObject {

	constructor(table, ext_id, view, mode, tHistory, viewMode, params) {
		super(table, ext_id, view, mode, tHistory, viewMode, params);
		this.type = 'scheduler';
	}

	async init() {
		super.init();
		this.textColumn = this.columns.getColumnsByColumnType("text", true);
		this.startDateColumn = this.columns.getColumnsByColumnType("start_date", true);
		this.endDateColumn = this.columns.getColumnsByColumnType("end_date", true);
		this.minTimeColumn = this.columns.getColumnsByColumnType("min_time", true);
		this.maxTimeColumn = this.columns.getColumnsByColumnType("max_time", true);
		this.minTime = 8;
		this.maxTime = 21;
		this.dataSource.paginate(false);
		this.createObject();
		$("#" + this.idn).data('mylsObject', this);
		this.toolbar.init();
	}

	createObject() {
		this.object = $("#" + this.idn).dxScheduler(this.getOptions()).dxScheduler('instance');
	}

	getOptions() {
		const self = this;
		return {
			dataSource: self.dataSource,
			keyExpr: "id",
			allDayExpr: self.columns.getColumnsByColumnType("all_day", true).dataField,
			startDateExpr: self.startDateColumn.dataField,
			endDateExpr: self.endDateColumn.dataField,
			textExpr: self.textColumn.dataField,
			recurrenceRuleExpr: self.columns.getColumnsByColumnType("repeate_rule", true).dataField,
			recurrenceExceptionExpr: self.columns.getColumnsByColumnType("recurrence_exception", true).dataField,
			views: self.tableInfo.view.split(','),
			currentView: self.tableInfo.view.split(',')[0],
			startDayHour: self.minTime,
			endDayHour: self.maxTime,
			editing: {
				allowAdding: false, //tableInfo.a == 1 ? true : false,
				allowUpdating: false, //tableInfo.e == 1 ? true : false,
				allowDragging: false, //tableInfo.e == 1 ? true : false,
				allowResizing: false, //tableInfo.e == 1 ? true : false,
				allowDeleting: false, //tableInfo.d == 1 ? true : false,
			},
			dateSerializationFormat: "yyyy-MM-ddTHH:mm:ssx",
			onContentReady: function (e) {
				self.scheduleContentReady(e);
			},
			onAppointmentRendered: function (e) {
				self.appointmentRendered(e);
			},
			onAppointmentDblClick: function (e) {
				self.appointmentDblClick(e);
			},
			onAppointmentClick: function (e) {
				self.appointmentClick(e);
				self.toolbar.setEnabledToolbar();
			},
			onCellClick: function () {
				self.id = undefined;
				self.toolbar.setEnabledToolbar();
			},
			appointmentTemplate: function (e) {
				return self.appointmentTemplate(e);
			},
			onAppointmentFormOpening: function (e) {
				e.cancel = true;
			},
			appointmentTooltipTemplate: function (e) {
				return self.appointmentTooltipTemplate(e);
			},
			/*
			onDisposing: function (e) {
				//console.log(e.element.attr('id'));
				setDataToForm.dispose();
				//objects[idn].saveFunction = null;
				columns = null;
				tableInfo = null;
				tHistory = null;
				menu = null;
				//objects[idn].object = null;
				objects[idn] = null;
				filterObjects[table] = null;
				startData = null;
				selParams = null;
				setDataToForm = null;
				idn = null;
			},
			//showBorders: true
			 */
		};
	}

	appointmentRendered(e) {
		const column = this.columns.getColumnsByColumnType("color", true);
		if (column) {
			e.appointmentElement[0].style.backgroundColor = e.appointmentData[column.dataField];
			if (e.appointmentData[column.dataField]) {
				const colorClass = $.Color(e.appointmentData[column.dataField]).contrastColor();
				e.appointmentElement[0].classList.add(colorClass);
			}
		}
	}

	appointmentTooltipTemplate(e) {
		if (this.textColumn.dataType == "block") {
			let result = this.columns.getFormattedCellValue(null, this.textColumn, e.appointmentData);
			this.object.selectedId = e.appointmentData.id;
			result = $("<div class='myls-scheduler-tooltip d-flex p-3 justify-content-between'>" +
				"           <div class='myls-scheduler-tooltip-data text-left'> " + result +
				"                <div class='myls-scheduler-tooltip-time'>" + e.appointmentData[this.startDateColumn.dataField].slice(11, 16) +
				" - " + e.appointmentData[this.endDateColumn.dataField].slice(11, 16) +
				"                </div>" +
				"           </div>" +
				"           <div class='myls-scheduler-tooltip-buttons'><div id='" + this.idn + "_edit_btn'></div><div id='" + this.idn + "_delete_btn'></div>" +
				"</div>" +
				"</div>");
			this.addEditBtn(e, result);
			this.addDeleteBtn(e, result);
			$(result).on("dxclick", function (e1) {
				e1.stopPropagation();
				/*processDblClick({
					component: scheduler,
					element: $("#" + idn)
				}, tableInfo, e.appointmentData.id, tHistory, 'scheduler', columns);*/
			});
			return result;
		} else return "item";
	}

	addDeleteBtn(e, result) {
		if (this.tableInfo.d == 1 && e.appointmentData.id > 0) {
			const btn = $("<div>").dxButton(this.toolbar.getDeleteBtnOptions(false));
			$(result).find("#" + this.idn + '_delete_btn').append(btn);
		}
	}

	addEditBtn(e, result) {
		if (this.tableInfo.e == 1 && e.appointmentData.id > 0) {
			const btn = $("<div>").dxButton(this.toolbar.getEditBtnOptions(false));
			$(result).find("#" + this.idn + '_edit_btn').append(btn);
		}
	}

	appointmentTemplate(e) {
		if (this.textColumn.dataType == "block") {
			let result = this.columns.getFormattedCellValue(null, this.textColumn, e.appointmentData);
			result += "<div>" + e.appointmentData[this.startDateColumn.dataField].slice(11, 16) +
				" - " + e.appointmentData[this.endDateColumn.dataField].slice(11, 16) +
				"</div>";
			return result;
		} else return "item";
	}

	appointmentClick(e) {
		e.cancel = true;
		if (e.component.myTimeout) {
			clearTimeout(e.component.myTimeout);
		}
		e.component.myTimeout = setTimeout(function () {
			e.component.showAppointmentTooltip(e.appointmentData, e.appointmentElement, e.targetedAppointmentData);
		}, 300);
		this.id = e.appointmentData.id;
	}

	appointmentDblClick(e) {
		e.cancel = true;
		if (e.component.myTimeout) {
			clearTimeout(e.component.myTimeout);
		}
		this.object.hideAppointmentTooltip();
		this.processDblClick();
	}

	scheduleContentReady(e) {
		this.contentReady(e);
		const d = new Date();
		if (this.object.getEndViewDate() >= d && this.object.getStartViewDate() <= d)
			this.object.scrollToTime(d.getHours(), d.getMinutes(), d);
	}

	getCurrentId() {
		return this.id;
	}

	getSelectedRows() {
		if (this.id)
			return [this.id];
		else return [];
	}

	async refresh(changesOnly = true, useLoadPanel = true) {
		super.refresh(changesOnly, useLoadPanel);
		await this.dataSource.reload();
		this.toolbar.setEnabledToolbar();
	}

	destroy() {
		super.destroy();
		$("#" + this.idn).data('mylsObject', null);
		this.close();
	}
}
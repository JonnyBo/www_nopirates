function initScheduler(table, ext_id, view, mode, tHistory) {
	var deferred = new $.Deferred;
	var idn = getIdn(table, ext_id, 'scheduler', view);
	//получаем данные
	var startData = initData(table, ext_id, 'scheduler');
	//получаем данные таблицы
	//var tableData = getData('/form/tabledata', 'get', {'id': table, 'extId': ext_id, 'mode': mode});
	//стартуем окошко загрузки
	openLoadPanel(idn);
	//выводим таблицу
	$.when(startData.tableColumns, startData.contextMenuData, startData.tableInfo).done(function (columns, menu, tableInfo) {

		//processCellTemplates(columns['columns']);
		columns = columns.columns;
		tableInfo.idn = idn;

		//convertDateTimeColumns(tableData, columns);
		var selParams = getSelParams(tableInfo);
		var loadData = createDataSource(table, ext_id, idn, tHistory, columns, tableInfo, selParams);
		var textColumn = getColumnByColumnType("text", columns);
		var startDateColumn = getColumnByColumnType("start_date", columns);
		var endDateColumn = getColumnByColumnType("end_date", columns);
		var minTimeColumn = getColumnByColumnType("min_time", columns);
		var maxTimeColumn = getColumnByColumnType("max_time", columns);
		var minTime = 8;
		var maxTime = 21;

		loadData.paginate(false);
		var scheduler = $("#" + idn).dxScheduler({
			dataSource: loadData,
			//startDayHour: 9,
			// dataSource: data,
			keyExpr: "id",
			allDayExpr: getColumnByColumnType("all_day", columns).dataField,
			startDateExpr: startDateColumn.dataField,
			endDateExpr: endDateColumn.dataField,
			textExpr: textColumn.dataField,
			recurrenceRuleExpr: getColumnByColumnType("repeate_rule", columns).dataField,
			recurrenceExceptionExpr: getColumnByColumnType("recurrence_exception", columns).dataField,
			views: tableInfo.view.split(','),
			currentView: tableInfo.view.split(',')[0],
			startDayHour:minTime,
			endDayHour:maxTime,
			editing: {
				allowAdding: false, //tableInfo.a == 1 ? true : false,
				allowUpdating: false, //tableInfo.e == 1 ? true : false,
				allowDragging: false, //tableInfo.e == 1 ? true : false,
				allowResizing: false, //tableInfo.e == 1 ? true : false,
				allowDeleting: false, //tableInfo.d == 1 ? true : false,
			},
			dateSerializationFormat: "yyyy-MM-ddTHH:mm:ssx",
			onContentReady: function (e) {
				console.log(e);
				contentReady(idn, e, 'scheduler');
				var d = new Date();
				scheduler.scrollToTime(d.getHours(), d.getMinutes(), d);
			},
			onAppointmentRendered: function (e) {
				//debugger
				var column = getColumnByColumnType("color", columns);
				if (column)
					e.appointmentElement[0].style.backgroundColor = e.appointmentData[column.dataField];
			},
			onAppointmentDblClick: function (e) {
				e.cancel = true;
				if (e.component.myTimeout) {
					clearTimeout(e.component.myTimeout);
				}
				processDblClick(e, tableInfo, e.appointmentData.id, tHistory, 'scheduler', columns);
			},
			onAppointmentClick: function (e) {
				e.cancel = true;
				if (e.component.myTimeout) {
					clearTimeout(e.component.myTimeout);
				}
				;
				e.component.myTimeout = setTimeout(function () {
					e.component.showAppointmentTooltip(
						e.appointmentData,
						e.appointmentElement,
						e.targetedAppointmentData
					);
				}, 300);
			},
			appointmentTemplate: function (e) {
				if (textColumn.dataType == "block") {
					var result = getFormattedCellValue(null, textColumn, columns, e.appointmentData, idn);

					result += "<div>" + e.appointmentData[startDateColumn.dataField].slice(11, 16) +
						" - " + e.appointmentData[endDateColumn.dataField].slice(11, 16) +
						"</div>";
					//console.log(template);
					return result;
				} else return "item";
			},
            onAppointmentFormOpening:function(e) {
			    e.cancel = true;
            },
			appointmentTooltipTemplate: function (e) {
				if (textColumn.dataType == "block") {
					var result = getFormattedCellValue(null, textColumn, columns, e.appointmentData, idn);
                    objects[idn].selectedId = e.appointmentData.id;
					result = $("<div class='myls-scheduler-tooltip d-flex p-3 justify-content-between'>" +
						"           <div class='myls-scheduler-tooltip-data text-left'> " + result +
						"                <div class='myls-scheduler-tooltip-time'>" + e.appointmentData[startDateColumn.dataField].slice(11, 16) +
						" - " + e.appointmentData[endDateColumn.dataField].slice(11, 16) +
						"                </div>" +
						"           </div>" +
						"           <div class='myls-scheduler-tooltip-buttons'><div id='" + idn + "_edit_btn'></div><div id='" + idn + "_delete_btn'></div>" +
						"</div>" +
						"</div>");
					if (tableInfo.e == 1 && e.appointmentData.id > 0) {
					    var btn = $("<div>").dxButton(getEditBtnOptions(false, tableInfo, 'scheduler', tHistory, table, columns, idn));
					    $(result).find("#" + idn + '_edit_btn').append(btn);
                    }
                    if (tableInfo.d == 1 && e.appointmentData.id > 0) {
                        var btn = $("<div>").dxButton(getDeleteBtnOptions(false, 'scheduler', idn));
                        $(result).find("#" + idn + '_delete_btn').append(btn);
                    }

					$(result).on("dxclick", function (e1) {
						e1.stopPropagation();
						/*processDblClick({
							component: scheduler,
							element: $("#" + idn)
						}, tableInfo, e.appointmentData.id, tHistory, 'scheduler', columns);*/
					});
					return result;
				} else return "item";
			},
			onDisposing: function (e) {
				//console.log(e.element.attr('id'));
				loadData.dispose();
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
				loadData = null;
				idn = null;
			},
			//showBorders: true
		}).dxScheduler("instance");

		let object = {
			object: scheduler,
			columns: columns.columns,
			tableInfo: tableInfo,
			menu: menu,
			type: 'scheduler',
			tHistory: tHistory,
			idn: idn,
			dataSource: loadData,
		};
		objects[idn] = object;

		$("#" + idn).prepend('<div class="dx-datagrid-header-panel"></div>');
		$("#" + idn + " .dx-datagrid-header-panel").append('<div role="toolbar"></div>');
		var items = [];
		initToolbar(undefined, items, tableInfo, table, ext_id, 'scheduler', tHistory, columns);
		var toolbar = $("#" + idn + " [role=toolbar]").dxToolbar({
			items: items,
		}).dxToolbar("instance");

		deferred.resolve(object);
		// initContextMenu(idn, menu, '#' + idn + ' .dx-treelist-content');
	}).fail(function (error) {
		showError(idn, error);
		deferred.reject();
	});

	return deferred.promise();
}

function disposeSheduler(table, ext_id, type, view) {
	var idn = getIdn(table, ext_id, type, view);
	$('#' + idn).dxScheduler('dispose');
	$("#" + idn + " [role=toolbar]").dxToolbar('dispose');
}

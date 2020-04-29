function initPivot(table, ext_id, view, mode, tHistory) {
	var deferred = new $.Deferred;
	var idn = getIdn(table, ext_id, 'pivot', view);
	var chartIdn = getIdn(table, ext_id, 'chart', view);
	//получаем данные
	var startData = initData(table, ext_id, 'pivot');
	var structureList = getTemplate(table);
	//стартуем окошко загрузки
	/*var datas = [];
	datas[table] = getData('/pivot/tabledata', 'get', {'id': table, 'extId': ext_id});
	getData('/pivot/tabledata', 'get', {'id': table, 'extId': ext_id});*/

	var columns = startData.tableColumns;
	var menu = startData.contextMenuData;
	var tableInfo = startData.tableInfo;
	//var structure = structureList;
	var dataSources = {};
	var pivotSel = [];
    var datas = {};

	fillDataSources();
	showToolbar();
	//var pivotGridChart = getChart();
	var options = preparePivots();
	preparePivots();

	showReport(0);

	/*var object = {
		object: pivotGrid,
		columns: columns.columns,
		tableInfo: tableInfo,
		menu: menu,
		type: 'pivot',
		tHistory: tHistory,
		idn: idn
	};*/

	//closeLoadPanel(idn);
	deferred.resolve(objects[idn + '-pivotContainer']);

	function preparePivots() {
		return {
			allowSortingBySummary: true,
			allowFiltering: true,
			showBorders: true,
			showColumnGrandTotals: true,
			showRowGrandTotals: true,
			showRowTotals: false,
			showColumnTotals: false,
			fieldChooser: {
				enabled: true,
				height: 400
			},
			onDisposing: function (e) {
				//console.log(e.element.attr('id'));
				objects[idn] = null;
				objects[idn + '-pivotContainer'] = null;
			}
		};
	}

	function fillDataSources() {
		if (!$.isArray(structureList.report)) {
			var arrStr = [];
			arrStr[0] = structureList.report;
			structureList.report = arrStr;
		}
		//console.log(structureList.report);
		if (structureList.report.length > 0) {
			$.each(structureList.report, function (index, item) {
				pivotSel.push({
					'id': index,
					'name': item.hasOwnProperty("@attributes") ? item['@attributes'].caption : item['attributes'].caption,
				});
				var tableId = item.hasOwnProperty("@attributes") ? item['@attributes'].tableId : item['attributes'].tableId;
				if (!tableId) {
					tableId = table;
				}
				if (!dataSources.hasOwnProperty(tableId)) {
					dataSources[tableId] = {
						fields: getTableColumns(tableId).columns,
						store: new DevExpress.data.CustomStore({
							key: "id",
							loadMode: "raw",
							load: function (loadOptions) {
								if (datas.hasOwnProperty(tableId))
									return datas[tableId];
								else
								{
									var result = getData('/pivot/tabledata', 'post', prepareTableData(tableId, ext_id, null, null));
									//console.log(result);
									$.when(result).done(function(data) {
										datas[tableId] = data;
									});
									return result;
								}


							},
						})
					};
				}
			});
		}
	}

	function getChart() {
		if ($("#" + idn + '-chartContainer').length == 0) {
			$("#" + idn).append('<div id="' + idn + '-chartContainer" class="chart-container"></div>');
			$("#" + idn + '-chartContainer').append("<div id='" + idn + "_chart' class='myls-pivot-chart'>");
		}
		var pivotGridChart = $("#" + idn + "_chart").dxChart({
			commonSeriesSettings: {
				type: "bar"
			},
			tooltip: {
				enabled: true,
				customizeTooltip: function (pointInfo) {
					return {html: "<div class='chart-tooltip'><div class='chart-value'>" + pointInfo.valueText + "</div><div class='chart-serie'>" + pointInfo.seriesName + "</div></div>"};
				}
			},
			size: {
				height: $("#" + idn + '-chartContainer').innerHeight()
			},
			adaptiveLayout: {
				width: 500
			},
			onDisposing: function (e) {
				//console.log(e.element.attr('id'));
				//console.log(idn, chartIdn);
				objects[chartIdn] = null;
			}
		}).dxChart("instance");
		return pivotGridChart;
	}

	function showToolbar() {
		if ($("#" + idn + ' .dx-datagrid-header-panel').length == 0) {
			$("#" + idn).prepend('<div class="dx-datagrid-header-panel"></div>');
			$("#" + idn + " .dx-datagrid-header-panel").append('<div role="toolbar"></div>');
		}
		var items = [];
		initToolbar(undefined, items, tableInfo, table, ext_id, 'pivot', tHistory, columns);
		if (structureList.report.length > 1) {
			items.push({
				widget: "dxSelectBox",
				name: 'selectRow',
				locateInMenu: 'auto',
				options: {
					elementAttr: {
						toolbarrole: "always",
						//buttonrole: "refresh",

					},
					//icon: "/img/refresh.svg",
					//visible: !isEdit,
					dataSource: pivotSel,
					displayExpr: "name",
					valueExpr: "id",
					value: 0,
					width: 250,
					onValueChanged: function (e) {
						showReport(e.value);
					}
				},
				location: "center"
			});
		}
		var toolbar = $("#" + idn + " [role=toolbar]").dxToolbar({
			items: items,
		}).dxToolbar("instance");
	}

	function showReport(rNum) {
		var list = $.isArray(structureList.report) ? structureList.report[rNum] : structureList.report;

		//var list = structureList.report;
		//console.log(list);
		var tableId = list.hasOwnProperty("@attributes") ? list['@attributes'].tableId : list['attributes'].tableId;
		if (!tableId) {
			tableId = table;
		}
		var chartType = list.hasOwnProperty("@attributes") ? list['@attributes'].chart : list['attributes'].chart;
		options.dataSource = dataSources[tableId];
		setAreas(list);

		if ($("#" + idn + '-pivotContainer').length) {
			$("#" + idn + '-pivotContainer').dxPivotGrid("instance").dispose();
			$("#" + idn + '-pivotContainer').remove();
		}

		var pivotGrid = false;
		$("#" + idn + "_chart").dxChart('dispose');
		$("#" + idn + '-chartContainer').remove();
		if (chartType !== undefined) {
			var pivotGridChart = getChart();
			pivotGrid = createReport();
			pivotGridChart.option('commonSeriesSettings.type', chartType);
			pivotGrid.bindChart(pivotGridChart, {
				dataFieldsDisplayMode: "splitPanes",
				alternateDataFields: false
			});
		} else {
			pivotGrid = createReport();
		}

		var object = {
			object:pivotGrid,
			columns:columns,
			tableInfo:tableInfo,
			menu:menu,
			type:'pivot',
			tHistory: tHistory,
			idn:idn + '-pivotContainer',
			dataSource: pivotGrid.getDataSource()
		};
		objects[idn + '-pivotContainer'] = object;

	}

	function createReport() {
		$("#" + idn).append('<div id="' + idn + '-pivotContainer" class="pivot-container"></div>');
		return $("#" + idn + '-pivotContainer').dxPivotGrid(options).dxPivotGrid("instance");
	}

	function setAreas(list) {
		//console.log(list);
		if (options.dataSource.fields) {
			$.each(options.dataSource.fields, function (_, item) {
				item['area'] = undefined;
			});
		}
		if ($.isArray(list.row.field))
			$.each(list.row.field, function (_, item) {
				options.dataSource.fields[item.toLowerCase()]['area'] = 'row';
			});
		else
			options.dataSource.fields[list.row.field.toLowerCase()]['area'] = 'row';

		if ($.isArray(list.column.field))
			$.each(list.column.field, function (_, item) {
				options.dataSource.fields[item.toLowerCase()]['area'] = 'column';
			});
		else
			options.dataSource.fields[list.column.field.toLowerCase()]['area'] = 'column';

		if ($.isArray(list.data.field))
			$.each(list.data.field, function (_, item) {
				options.dataSource.fields[item.toLowerCase()]['area'] = 'data';
			});
		else
			options.dataSource.fields[list.data.field.toLowerCase()]['area'] = 'data';

	}

	return deferred;
}

function disposePivot(table, ext_id, type, view) {
	var idn = getIdn(table, ext_id, type, view);
	$("#" + idn + "_chart").dxChart('dispose');
	$("#" + idn + '-pivotContainer').dxPivotGrid('dispose');
	$("#" + idn + " [role=toolbar]").dxToolbar('dispose');
	filterObjects[table] = null;
}
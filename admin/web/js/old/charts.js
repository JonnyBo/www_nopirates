function initChart(table, ext_id, view, mode, tHistory, viewMode) {
	var deferred = new $.Deferred;
	var idn = getIdn(table, ext_id, 'chart', view);
	//console.log(idn);
	//alert(idn);
	//получаем данные
	var startData = initData(table, ext_id, 'chart');
	//стартуем окошко загрузки
	//openLoadPanel(idn);

	var columns = startData.tableColumns;
	var menu = startData.contextMenuData;
	var tableInfo = startData.tableInfo;
	var structureList = getTemplate(table);
	var structure = structureList;
	var pivotSel = [];
	var dataSources = {};
	var datas = {};

	//выводим таблицу
	$.when(startData.tableColumns, startData.contextMenuData, startData.tableInfo).done(function (columns, menu, tableInfo) {
			var selParams = getSelParams(tableInfo);
			var loadData = createDataSource(table, ext_id, idn, tHistory, columns.columns, tableInfo, null);
			var arrTypes = {
				'bar': 'dxChart',
				'area': 'dxChart',
				'doughnut': 'dxPieChart',
				'map': 'dxVectorMap',
				'funnel': 'dxFunnel'
			};
			var type = 'bar';
			var element = 'dxChart';

			//console.log(tableInfo);
			if (tableInfo.view !== '') {
				//тип диаграммы
				type = tableInfo.view;
				element = arrTypes[tableInfo.view];
			}

			var series = [];
			$.each(getColumnsByColumnType('serie', columns.columns), function (index, item) {
				series.push({valueField: item.dataField, name: item.caption});
			});

			var argument = getColumnByColumnType('argument', columns.columns).dataField;

			var chartPromise;

			switch (element) {
				case 'dxVectorMap':
					chartPromise = showVectorMap(argument, series, loadData, type);
					break;
				case 'dxChart':
					chartPromise = showChart(argument, series, loadData, type);
					break;
				case 'dxPieChart':
					chartPromise = showPieChart(argument, series, loadData, type);
					break;
				case 'dxFunnel':
					chartPromise = showFunnel(argument, series, loadData, type);
					break;
			}
			$.when(chartPromise).done(function (chart) {
				let object = {
					object: chart,
					columns: columns.columns,
					tableInfo: tableInfo,
					menu: menu,
					type: 'chart',
					tHistory: tHistory,
					idn: idn,
					dataSource: loadData
				};
				objects[idn] = object;
				if (element == 'dxVectorMap') {
					objects[idn].showReport = showReport;
					objects[idn].rNum = 0;
				}
				showToolbar();
				deferred.resolve(object);
			});

		}
	).fail(function (error) {
		showError(idn, error);
		deferred.reject();
	});
	return deferred;

	function showToolbar() {
		if (viewMode != 'compact') {
			$("#" + idn).prepend('<div class="dx-datagrid-header-panel"></div>');
			$("#" + idn + " .dx-datagrid-header-panel").append('<div role="toolbar"></div>');
			var items = [];
			initToolbar(undefined, items, tableInfo, table, ext_id, 'chart', tHistory, columns, view);
			if (pivotSel.length > 0) {
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
							objects[idn].rNum = e.value;
						}
					},
					location: "center"
				});
			}
			var toolbar = $("#" + idn + " [role=toolbar]").dxToolbar({
				items: items,
			}).dxToolbar("instance");


		}
	}

	function fillDataSources() {
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
					//dataSources[tableId] = createDataSource(tableId, ext_id, idn, tHistory, columns.columns, tableInfo);
					dataSources[tableId] = new DevExpress.data.DataSource({
						fields: getTableColumns(tableId).columns,
						store: new DevExpress.data.CustomStore({
							key: "id",
							loadMode: "raw",
							load: function (loadOptions) {
								if (datas.hasOwnProperty(tableId))
									return datas[tableId];
								else {
									var result = getData('/chart/tabledata', 'post', prepareTableData(tableId, ext_id, null, null));
									$.when(result).done(function (data) {
										datas[tableId] = data;
									});
									return result;
								}

							},
						})
					});

				}
			});
		}
	}

	function getChartOptions(loadData, argument, series, type) {
		return {
			palette: "soft",
			dataSource: loadData,
			commonSeriesSettings: {
				argumentField: argument,
				type: type
			},
			series: series,
			margin: {
				bottom: 20
			},
			legend: {
				verticalAlignment: "top",
				horizontalAlignment: "center"
			},
			"export": {
				enabled: false
			},
			"valueAxis": {
				autoBreaksEnabled: false,
			},
			tooltip: {
				enabled: true,
				customizeTooltip: function (pointInfo) {
					return {html: "<div class='chart-tooltip'><div class='chart-value'>" + pointInfo.valueText + "</div><div class='chart-serie'>" + pointInfo.argumentText + "</div></div>"};
				}
			},
			onDisposing: function (e) {
			}
		};
	}

	function getFunnelOptions(loadData, argument, series, type) {
		return {
			palette: "soft",
			dataSource: loadData,
			argumentField: argument,
			valueField: "item",
			margin: {
				bottom: 20
			},
			tooltip: {
				enabled: true,
				format: "fixedPoint"
			},
			item: {
				border: {
					visible: true
				}
			},
			label: {
				visible: true,
				position: "outside",
				backgroundColor: "none",
				customizeText: function (e) {
					return "<span class='mylsThemeLargeFont mylsMainFont'>" +
						e.percentText +
						"</span><br/>" +
						e.item.argument;
				}
			},
			sortData: false,
			"export": {
				enabled: false
			},
			onDisposing: function (e) {
			}
		};
	}

	function getCompactChartOptions(loadData, argument, series, type) {
		return {
			palette: "pastel",
			dataSource: loadData,
			commonSeriesSettings: {
				ignoreEmptyPoints: true,
				argumentField: argument,
				type: type,
				valueField: 'item',
			},
			commonAxisSettings: {
				visible: false,
				tick: {
					visible: false,
				},
				label: {
					visible: false,
				},
			},
			seriesTemplate: {
				nameField: argument,
			},
			legend: {
				visible: false,
			},
			"export": {
				enabled: false
			},
			"valueAxis": {
				autoBreaksEnabled: false,
			},
			tooltip: {
				enabled: true,
				customizeTooltip: function (pointInfo) {
					//console.log(pointInfo);
					return {html: "<div class='chart-tooltip'><div class='chart-value'>" + pointInfo.valueText + "</div><div class='chart-serie'>" + pointInfo.argumentText + "</div></div>"};
				}
			},
			onDisposing: function (e) {
			}
		};
	}

	function getPieChartOptions(loadData, argument, series, type) {
		var topN = getColumnByColumnType('topn', columns.columns).dataField;
		var options = {};

		if (viewMode == 'compact')
			options = getCompactChartOptions(loadData, argument, series, type);
		else
			options = getChartOptions(loadData, argument, series, type);

		if (topN) {
			options.commonSeriesSettings.smallValuesGrouping = {
				mode: "topN",
				topCount: 10
			};
		}
		options.legend = {visible: false};
		options.resolveLabelOverlapping = 'shift';
		options.commonSeriesSettings.label = {
			visible: true,
			connector: {
				visible: true,
				width: 0.5
			},
			position: "columns",
			customizeText: function (arg) {
				return arg.argument + " (" + arg.percentText + ")";
			}
		};

		/*series: [{
			smallValuesGrouping: {
				mode: "topN",
				topCount: 10
			},
		}*/
		return options;
	}

	function showChart(argument, series, loadData, type) {
		var chart = '';

		if (viewMode == 'compact')
			chart = $("#" + idn).dxChart(getCompactChartOptions(loadData, argument, series, type)).dxChart("instance");
		else
			chart = $("#" + idn).dxChart(getChartOptions(loadData, argument, series, type)).dxChart("instance");
		//showToolbar();
		return chart;
	}

	function showPieChart(argument, series, loadData, type) {
		var chart = '';

		chart = $("#" + idn).dxPieChart(getPieChartOptions(loadData, argument, series, type)).dxPieChart("instance");
		//showToolbar();
		return chart;
	}

	function showFunnel(argument, series, loadData, type) {
		var chart = '';

		/*if (viewMode == 'compact')
			chart = $("#" + idn).dxChart(getCompactChartOptions(setDataToForm, argument, series, type)).dxChart("instance");
		else*/
		chart = $("#" + idn).dxFunnel(getFunnelOptions(loadData, argument, series, type)).dxFunnel("instance");
		//showToolbar();
		return chart;
	}

	function showVectorMap(argument, series, loadData, type) {
		fillDataSources();
		$.when(dataSources[table].load()).done(function () {
			var mapData = getMapValues(argument, series[0].valueField, dataSources[table].items());
			var maxValue = getMapMax(mapData);
			var groupField = getGroupFields(maxValue);
			//console.log(groupField);
			var mapOptions = {
				bounds: [-180, 85, 180, -60],
				layers: {
					name: "areas",
					dataSource: DevExpress.viz.map.sources.world,
					palette: "Violet",
					colorGroups: groupField,
					colorGroupingField: argument,
					customize: function (elements) {
						//console.log(setDataToForm.items());
						//console.log(getMapValues(argument, series[0].valueField, setDataToForm.items()));
						$.each(elements, function (_, element) {
							var name = element.attribute('name');
							for (key in mapData) {
								if (name == key) {
									element.attribute(argument, mapData[key]);
								}
							}
						});

					}
				},
				legends: [{
					source: {layer: "areas", grouping: "color"},
					customizeText: function (arg) {
						var text;
						text = DevExpress.localization.formatNumber(arg.start, "#,##0") + " - " + DevExpress.localization.formatNumber(arg.end, "#,##0");
						return text;
					}
				}],
				tooltip: {
					enabled: true,
					customizeTooltip: function (arg) {
						if (arg.attribute(argument)) {
							return {text: arg.attribute("name") + ": " + DevExpress.localization.formatNumber(arg.attribute(argument), "#,##0")};
						}
					}
				}
			};
			var chart = $("#" + idn).dxVectorMap(mapOptions).dxVectorMap("instance");
			objects[idn].dataSource = dataSources[table];
			//showToolbar();
		});
	}

	function showReport(rNum) {
		var list = structure.report[rNum];
		var tableId = list.hasOwnProperty("@attributes") ? list['@attributes'].tableId : list['attributes'].tableId;
		if (!tableId) {
			tableId = table;
		}
		$.when(dataSources[tableId].load()).done(function () {
			var obj = $("#" + idn).dxVectorMap("instance");
			updateMap(obj, rNum, dataSources[tableId], columns);
			objects[idn].dataSource = dataSources[tableId];

		});
	}

	function updateMap(obj, rNum, dataSource, columns) {
		var series = [];
		$.each(getColumnsByColumnType('serie', columns.columns), function (index, item) {
			series.push({valueField: item.dataField, name: item.caption});
		});
		//console.log(series);
		var currentSerie = series[rNum];
		var elements = obj.getLayers()[0].getElements();
		var argument = getColumnByColumnType('argument', columns.columns).dataField;
		var mapData = getMapValues(argument, currentSerie.valueField, dataSource.items());
		var maxValue = getMapMax(mapData);
		var groupField = getGroupFields(maxValue);
		$.each(elements, function (_, element) {
			var name = element.attribute('name');
			element.attribute(argument, undefined);
			for (key in mapData) {
				if (name == key) {
					element.attribute(argument, mapData[key]);
				}
			}
		});
		obj.option("layers.colorGroups", groupField);
	}

}

function disposeCharts(table, ext_id, type, view) {
	var idn = getIdn(table, ext_id, type, view);
	$('#' + idn).dxChart('dispose');
	$('#' + idn).dxPieChart('dispose');
	filterObjects[table] = null;
}


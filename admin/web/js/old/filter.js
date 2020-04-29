function initSearch(e, type, columns, table) {
	var arrTypes = {
		'bar': 'dxChart',
		'area': 'dxChart',
		'doughnut': 'dxPieChart',
		'map': 'dxVectorMap',
		'funnel': 'dxFunnel'
	};
	//let typeChart = 'bar';
	let element = 'dxChart';
	if (appInfo.tables[table].view != '') {
		//typeChart = appInfo.tables[table].view;
		element = arrTypes[appInfo.tables[table].view];
	}
	var obj = getCurrentObj(e, type, element);
	var idn = obj._$element.attr('id');
	if ($('#' + idn + '_popupContainer').length === 0) {
		$("#" + idn).append('<div id="' + idn + '_popupContainer"><div id="' + idn + '_scrollView"><div class="myls-filters"></div></div></div>');
	}
	//var table = getTableId(idn);
	var tableData = objects[idn].dataSource;
	//var allTableData = tableData.store().__rawData;
	var allTableData = [];
	/*
	var allTableData = tableData.items();
	if (type == 'pivot') {
		//allTableData = tableData.store()._dataSource.store().__rawData;
		allTableData = tableData.store()._dataSource.items();
	}

	 */
	var cols = columns;
	if (type == 'grid' || type == 'pivot' || type == 'chart') {
		cols = columns['columns'];
	}
	//console.log(cols);
	cols = getFilterColumns(cols);
	//console.log(cols);
	//var filterObjects = [];
	var filterValues = [];
	var resultArray = [];
	var dateArray = getDateArray();
	var arrMonth = [saveString('Январь'), saveString('Февраль'), saveString('Март'), saveString('Апрель'), saveString('Май'), saveString('Июнь'), saveString('Июль'), saveString('Август'), saveString('Сентябрь'), saveString('Октябрь'), saveString('Ноябрь'), saveString('Декабрь')];
	var arrQuarter = [saveString('I квартал'), saveString('II квартал'), saveString('III квартал'), saveString('IV квартал')];
	$('#' + idn + '_scrollView').dxScrollView({
		scrollByContent: true,
		scrollByThumb: true,
		showScrollbar: "onScroll",
		//onReachBottom: updateBottomContent,
		//reachBottomText: "Updating..."
	}).dxScrollView("instance");
	//console.log(filterObjects);
	$.each(cols, function (index, item) {
		var itemData = [];
		/*
		$.each(allTableData, function (ind, elem) {
			itemData.push(elem[item.dataField]);
		});

		 */
		//console.log(itemData);
		if (item.dataType == 'string' || item.dataType == 'tagbox') {
			var idx = createFilterElement(idn, item, 'tagbox', false);
			//console.log(item);
			//itemData = arrayUnique(itemData).sort();
			/*
			itemData = getData('frame/get-filter-string-data', 'post', {
				table: table,
				field: item.dataField,
				extId: objects[idn].ext_id,
				selParams: objects[idn].selParams
			});
			//itemData.unshift('Любой', 'Никакой');
			var idx = createFilterElement(idn, item, 'tagbox', false);
			$.when(idx, itemData).done(function (id, dataAll) {
				//console.log(createArrayFromObject(data));
				if (!issetFilterObject(table, item)) {
					filterObjects[table].push({
						'column': item, 'widget': $("#" + id).dxTagBox({
							//items: createArrayFromObject(data),
							dataSource: dataAll,
							//value: [],
							displayExpr: item.dataField,
							valueExpr: item.dataField,
							searchEnabled: true,
							showSelectionControls: true,
						}).dxTagBox('instance'),
						'radio': $('#' + id + '_radio').dxRadioGroup('instance'),
					});
				}
			});
			*/
		}
		if (item.dataType == 'number') {
			var idx = createFilterElement(idn, item, 'range', true);
			/*
			itemData = getData('frame/get-filter-number-data', 'post', {
				table: table,
				field: item.dataField,
				extId: objects[idn].ext_id,
				selParams: objects[idn].selParams
			});

			$.when(idx, itemData).done(function (id, dataAll) {
				var allData = dataAll[0];
				if (!issetFilterObject(table, item)) {
					filterObjects[table].push({
						'column': item, 'widget': $("#" + id).dxRangeSelector({
							scale: {
								startValue: parseFloat(allData.min),
								endValue: parseFloat(allData.max),
								minorTick: {
									visible: false,
								},
							},
							size: {
								width: 617
							},
							//value: [parseFloat(allData.min), parseFloat(allData.max)],
							onValueChanged: function (data) {
								var startObj = $("#" + id + '_start').dxNumberBox('instance');
								var endObj = $("#" + id + '_end').dxNumberBox('instance');
								startObj.option('value', data.value[0]);
								endObj.option('value', data.value[1]);
							}
						}).dxRangeSelector('instance'),
						'radio': $('#' + id + '_radio').dxRadioGroup('instance'),
					});
					var startObj = $("#" + id + '_start').dxNumberBox({
						value: parseFloat(allData.min),
						showSpinButtons: true,
						onValueChanged: function (data) {
							var sliderObj = $("#" + id).dxRangeSelector('instance');
							sliderObj.option('value', [data.value, sliderObj.option('value')[1]]);
						}
					}).dxNumberBox("instance");
					var endObj = $("#" + id + '_end').dxNumberBox({
						value: parseFloat(allData.max),
						showSpinButtons: true,
						onValueChanged: function (data) {
							var sliderObj = $("#" + id).dxRangeSelector('instance');
							sliderObj.option('value', [sliderObj.option('value')[0], data.value]);
						}
					}).dxNumberBox("instance");
				} else {
					var startObj = $("#" + id + '_start').dxNumberBox("instance");
					var endObj = $("#" + id + '_end').dxNumberBox("instance");
				}
				if (item.format.precision !== undefined && item.format.precision != "0") {
					// if (form[key].editorOptions.format === undefined)
					var format = '#,##0';
					format += '.' + '0'.repeat(item.format.precision);
					startObj.option('format', format);
					endObj.option('format', format);

				}
				if (item.format.precision === undefined || item.format.precision == "0") {
					var format = '#,##0';
					startObj.option('format', format);
					endObj.option('format', format);
				}
			});

			 */
		}
		if (item.dataType == 'date') {
			var idx = createFilterElement(idn, item, 'date', true);
			/*
			itemData = getData('frame/get-filter-string-data', 'post', {
				table: table,
				field: item.dataField,
				extId: objects[idn].ext_id,
				selParams: objects[idn].selParams
			});
			$.when(idx, itemData).done(function (id, dataAll) {

				resultArray[item.dataField] = dateArray.slice(0);
				//добавляем имеющиеся интервалы месяц+год
				var addMonth = [];
				var addQuarter = [];
				var addYear = [];
				$.each(dataAll, function (i, a) {
					if (a != null) {
						var date = new Date(a[item.dataField]);
						addMonth.push(new Date(date.getFullYear(), date.getMonth(), 1).getTime());
						var quarter = 3 * Math.floor(date.getMonth() / 3);
						addQuarter.push(new Date(date.getFullYear(), quarter, 1).getTime());
						addYear.push(new Date(date.getFullYear(), 1, 1).getTime());
					}

				});
				//добавляем имеющиеся интервалы месяц+год
				addMonth = arrayUnique(addMonth.sort());
				if (addMonth.length > 0) {
					var nn = resultArray[item.dataField].length;
					$.each(addMonth, function (ind, arr) {
						var newDate = new Date(arr);
						++nn;
						resultArray[item.dataField].push({
							'id': nn,
							'name': arrMonth[newDate.getMonth()] + ' ' + newDate.getFullYear(),
							'start': newDate,
							'end': new Date(newDate.getFullYear(), newDate.getMonth() + 1, 0, 23, 59, 59)
						});
					});
				}
				//добавляем имеющиеся интервалы квартал+год
				if (addQuarter.length > 0) {
					addQuarter = arrayUnique(addQuarter.sort());
					$.each(addQuarter, function (ind, arr) {
						var newDate = new Date(arr);
						var quarter = Math.floor(newDate.getMonth() / 3);
						++nn;
						resultArray[item.dataField].push({
							'id': nn,
							'name': arrQuarter[quarter] + ' ' + newDate.getFullYear(),
							'start': newDate,
							'end': new Date(newDate.getFullYear(), newDate.getMonth() + 3, 0, 23, 59, 59)
						});
					});
				}
				//добавляем имеющиеся интервалы год
				if (addYear.length > 0) {
					addYear = arrayUnique(addYear.sort());
					$.each(addYear, function (ind, arr) {
						var newDate = new Date(arr);
						++nn;
						resultArray[item.dataField].push({
							'id': nn,
							'name': newDate.getFullYear(),
							'start': newDate,
							'end': new Date(newDate.getFullYear() + 1, 0, 0, 23, 59, 59)
						});
					});
				}
				var currValue = sessionStorage.getItem(item.dataField);
				var lastValue = null;
				if (currValue != null) {
					lastValue = resultArray[item.dataField][currValue];
				}
				if (!issetFilterObject(table, item)) {
					filterObjects[table].push({
						'column': item, 'widget': $("#" + id).dxSelectBox({
							//items: dateArray,
							dataSource: resultArray[item.dataField],
							displayExpr: "name",
							keyExpr: "id",
							//showDataBeforeSearch: true,
							//showSelectionControls: true,
							value: lastValue,
							onValueChanged: function (data) {
								if (data.value != null) {
									var startObj = $("#" + id + '_start').dxDateBox('instance');
									var endObj = $("#" + id + '_end').dxDateBox('instance');
									startObj.option('value', data.value.start);
									endObj.option('value', data.value.end);
									if (data.value.id == 0) {
										startObj.option('readOnly', false);
										endObj.option('readOnly', false);
									} else {
										startObj.option('readOnly', true);
										endObj.option('readOnly', true);
									}
								}
							},
						}).dxSelectBox('instance'),
						'radio': $('#' + id + '_radio').dxRadioGroup('instance'),
					});
					$("#" + id + '_start').dxDateBox({
						displayFormat: "shortdate",
						type: "date",
						readOnly: true,
						//value: now,
						onValueChanged: function (data) {
							$.each(resultArray[item.dataField], function (index, arr) {
								if (arr.id == 0) {
									arr.start = data.value;
									return false;
								}
							});
						}
					}).dxDateBox('instance');
					$("#" + id + '_end').dxDateBox({
						displayFormat: "shortdate",
						type: "date",
						readOnly: true,
						//value: now,
						onValueChanged: function (data) {
							$.each(resultArray[item.dataField], function (index, arr) {
								if (arr.id == 0) {
									arr.end = data.value;
									return false;
								}
							});
						}
					}).dxDateBox('instance');
				}
			});
			*/
		}
		/* if (item.dataType == 'tagbox') {
			 //itemData = arrayUnique(itemData);
			 itemData = getData('frame/get-filter-string-data', 'post', {table: table, field: item.dataField, extId: objects[idn].ext_id, selParams: objects[idn].selParams});
			 var idx = createFilterElement(idn, item, 'tagbox', false);
			 $.when(idx, itemData).done(function (id, dataAll) {
				 if (!issetFilterObject(table, item)) {
					 filterObjects[table].push({
						 'column': item, 'widget': $("#" + id).dxTagBox({
							 //items: newResults,
							 dataSource: dataAll,
							 //value: [],
							 displayExpr: item.dataField,
							 valueExpr: item.dataField,
							 searchEnabled: true,
							 showSelectionControls: true,
						 }).dxTagBox('instance'),
						 'radio': $('#' + id + '_radio').dxRadioGroup('instance'),
					 });
				 }
			 });
		 }*/
		if (item.dataType == 'color') {
			//itemData = arrayUnique(itemData);
			var idx = createFilterElement(idn, item, 'tagbox', false, 'myls-filter-color');
			/*
			itemData = getData('frame/get-filter-string-data', 'post', {
				table: table,
				field: item.dataField,
				extId: objects[idn].ext_id,
				selParams: objects[idn].selParams
			});
			//itemData.unshift('Любой', 'Никакой');

			$.when(idx, itemData).done(function (id, dataAll) {
				//dataAll = arrayUnique(dataAll);
				removeNullFromArray(dataAll);
				dataAll = removeEmptyFromArray(dataAll);
				if (!issetFilterObject(table, item)) {
					filterObjects[table].push({
						'column': item, 'widget': $("#" + id).dxTagBox({
							//items: itemData,
							dataSource: dataAll,
							//value: [],
							displayExpr: item.dataField,
							valueExpr: item.dataField,
							searchEnabled: false,
							showSelectionControls: true,
							itemTemplate: function (tagData) {
								if (tagData[item.dataField] != null) {
									if (tagData[item.dataField].charAt(0) == '#')
										return "<div style='width: 20px; height: 20px; background-color: " + tagData[item.dataField] + "'></div>";
									else
										return "<div style='width: 20px; height: 20px;'>" + tagData[item.dataField] + "</div>";
								}
							},
							tagTemplate: function (tagData) {
								if (tagData[item.dataField] != null) {
									if (tagData[item.dataField].charAt(0) == '#')
										return "<div style='width: 20px; height: 20px; background-color: " + tagData[item.dataField] + "'></div>";
									else
										return "<div style='height: 20px;'>" + tagData[item.dataField] + "</div>";
								}
							}
						}).dxTagBox('instance'),
						'radio': $('#' + id + '_radio').dxRadioGroup('instance'),
					});
				}
			});

			 */
		}
		if (item.dataType == 'boolean') {
			var idx = createFilterElement(idn, item, 'switch', false);
			if (!issetFilterObject(table, item)) {
				filterObjects[table].push({
					'column': item, 'widget': $("#" + idx).dxSwitch({
						//value: false,
					}).dxSwitch('instance'),
					'radio': $('#' + idx + '_radio').dxRadioGroup('instance'),
				});
			}
		}
	});
	var popup = $('#' + idn + '_popupContainer').dxPopup({
		title: saveString("Фильтр"),
		width: "700px",
		height: "75%",
		showCloseButton: false,
		toolbarItems: [{
			//text: "Title",
			location: "after"
		}, {
			widget: "dxButton",
			toolbar: "bottom",
			location: "center",
			options: {
				text: saveString("Применить"),
				type: "success",
				stylingMode: "outlined",
				onClick: function (e2) {
					var filter = [];
					$.each(filterObjects[table], function (index, elem) {
						//console.log(elem.widget.element().attr('id'));
						var checkBox = $('#' + elem.widget.element().attr('id') + '_checkbox').dxCheckBox('instance');
						if (checkBox.option('value')) {
							if (elem.radio.option('value')) {
								//console.log(elem.radio.option('value'));
								var term = '=';
								if (elem.radio.option('value') == 1) {
									// не пустое
									var out = [];
									out.push([elem.column.dataField, 'is not', null]);
									if (out.length > 0) {
										if (filter.length > 0) {
											filter.push('and');
										}
										filter.push(out);
									}
								}
								if (elem.radio.option('value') == 2) {
									//кроме
									/*
									var out = [];
									out.push([elem.column.dataField, 'is not', null]);
									if (out.length > 0) {
										if (filter.length > 0) {
											filter.push('and');
										}
										filter.push(out);
									}
									*/
									term = 'is distinct from';
								}
								if (elem.radio.option('value') == 3) {
									//содержит
									if (elem.text.option('value')) {
										var out = [];
										out.push([elem.column.dataField.toLowerCase(), 'containing', elem.text.option('value')]);
										if (out.length > 0) {
											if (filter.length > 0) {
												filter.push('and');
											}
											filter.push(out);
										}
									}
									//term = 'containing';
									//var text = elem.text.option('value');
									//console.log(text);
								}
								if (elem.widget.NAME == 'dxTagBox') {
									if (elem.widget.option('value').length > 0) {
										var out = [];
										$.each(elem.widget.option('value'), function (index, arr) {
											if (out.length > 0) {
												if (term == '=')
													out.push('or');
												else
													out.push('and');
											}
											if (elem.column.dataType == 'tagbox')
												out.push([[elem.column.dataField, 'like', arr + '%,'], 'or', [elem.column.dataField, 'like', ', %' + arr], 'or', [elem.column.dataField, 'containing', ', ' + arr + ','], 'or', [elem.column.dataField, '=', arr]]);
											else
												if (term == 'containing')
													out.push([elem.column.dataField.toLowerCase(), term, arr]);
												else
													out.push([elem.column.dataField, term, arr]);
										});
										if (out.length > 0) {
											if (filter.length > 0) {
												filter.push('and');
											}
											filter.push(out);
										}
									}
								}
								if (elem.widget.NAME == 'dxRangeSelector') {
									if (elem.widget.option('value').length > 0) {
										var out = [];
										out.push([elem.column.dataField, '>=', elem.widget.option('value')[0]]);
										out.push('and');
										out.push([elem.column.dataField, '<=', elem.widget.option('value')[1]]);
										if (out.length > 0) {
											if (filter.length > 0) {
												filter.push('and');
											}
											filter.push(out);
										}
									}
								}
								if (elem.widget.NAME == 'dxSelectBox') {
									if (elem.widget.option('value') != null && elem.widget.option('value') != undefined) {
										if (Object.keys(elem.widget.option('value')).length > 0) {
											var out = [];
											sessionStorage.setItem(elem.column.dataField, elem.widget.option('value').id);
											/*if (elem.widget.option('value').id == 0) {
												$.each(resultArray[elem.column.dataField], function (i, arr) {
													if (arr.id == 0) {
														out.push([elem.column.dataField, '>=', DevExpress.localization.formatDate(arr.start, 'yyyy-MM-dd')]);
														out.push('and');
														out.push([elem.column.dataField, '<=', DevExpress.localization.formatDate(arr.end, 'yyyy-MM-dd')]);
														return false;
													}
												});
											} else {*/
											//out.push([elem.column.dataField, 'between', DevExpress.localization.formatDate(elem.widget.option('value').start + ' - ' + 'yyyy-MM-dd'), DevExpress.localization.formatDate(elem.widget.option('value').end, 'yyyy-MM-dd')]);
											if (elem.widget.option('value').start != undefined)
												out.push([elem.column.dataField, '>=', DevExpress.localization.formatDate(elem.widget.option('value').start, 'yyyy-MM-dd')]);
											if (elem.widget.option('value').start != undefined && elem.widget.option('value').end != undefined)
												out.push('and');
											if (elem.widget.option('value').end != undefined)
												out.push([elem.column.dataField, '<=', DevExpress.localization.formatDate(elem.widget.option('value').end, 'yyyy-MM-dd')]);

											/* }*/
											if (out.length > 0) {
												if (filter.length > 0) {
													filter.push('and');
												}
												filter.push(out);
											}
										}
									}
								}
								if (elem.widget.NAME == 'dxSwitch') {
									//if (elem.widget.option('value').length > 0) {
									var out = [];
									out.push([elem.column.dataField, '=', elem.widget.option('value') ? 1 : 0]);
									if (out.length > 0) {
										if (filter.length > 0) {
											filter.push('and');
										}
										filter.push(out);
									}
									//}
								}
							} else {
								//пустое
								var out = [];
								out.push([elem.column.dataField, 'is', null]);
								//out.push('or');
								//out.push([elem.column.dataField, '=', '']);
								if (out.length > 0) {
									if (filter.length > 0) {
										filter.push('and');
									}
									filter.push(out);
								}
							}
						}
					});

					if (filter.length == 0) {
						filter = null;
					}
					if (filter == null) {
						e.element.removeClass('myls-filter-active');
					} else {
						e.element.addClass('myls-filter-active');
					}
					console.log(filter);
					var tableId = getTableId(idn);
					//var ext_id = getTableExtId(idn);
					var tableInfo = getTableInfo(tableId);
					tableInfo.idn = idn;
					//var selParams = getSelParams(tableInfo);
					if (filter !== null) {
						/*
						console.log(tableInfo);
						selParams.filter = filter;
						console.log(selParams);
						//var setDataToForm = createDataSource(tableId, ext_id, idn, [], columns.columns, tableInfo, selParams);
						var setDataToForm = tableData.load(selParams);
						console.log(setDataToForm);

						 */
					}

					//console.log(tableData);
					tableData.mylsFilter = filter;
					//refreshObject(obj, type,true);
					//tableData.store().clearRawDataCache();
					/*
					var dsLoad = tableData.store().load();
					//var items = tableData.items();

					$.when(dsLoad).done(function () {
						console.log('done');

					}).fail(function (error) {
						console.log(error);
					});
					*/

						$.when(refreshObject(obj, type, true)).done(function () {
							//tableData.filter();
							/*
							if (element == 'dxVectorMap') {

								var series = [];
								$.each(getColumnsByColumnType('serie', columns.columns), function (index, item) {
									series.push({valueField: item.dataField, name: item.caption});
								});
								var elements = obj.getLayers()[0].getElements();
								var argument = getColumnByColumnType('argument', columns.columns).dataField;
								var mapData = getMapValues(argument, series[0].valueField, tableData.items());
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
								//obj.option()
								obj.option("layers.colorGroups", groupField);

							 */
								/*
                                $.each(elements, function (index, item) {
                                    item.attribute(argument, tableData[element.attribute("name")]);
                                });
                                    element.attribute("population", updatedPopulations[element.attribute("name")]);
                                }
                                var layer = obj.option('layers');
                                obj.option('layers.palette', 'Red');
                                obj.option('layers', layer);
                                //.customize(obj.getLayers()[0].getElements());
                                console.log(tableData);
                                console.log(obj);

                                 */

							//}
						});

					popup.dxPopup("instance").hide();

				}
			}
		}, {
			widget: "dxButton",
			toolbar: "bottom",
			location: "center",
			options: {
				text: saveString("Очистить"),
				type: "clear",
				stylingMode: "outlined",
				onClick: function (e2) {
					$.each(filterObjects[table], function (index, elem) {
						if (elem.widget.NAME == 'dxRangeSelector') {
							elem.widget.option('value', []);
						} else if (elem.widget.NAME == 'dxSwitch') {
							elem.widget.option('value', false);
						} else {
							elem.widget.option('value', '');
						}
						sessionStorage.removeItem(elem.column.dataField);
					});
					//tableData.filter(null);
					tableData.mylsFilter = null;
					e.element.removeClass('myls-filter-active');
					$.when(refreshObject(obj, type, true)).done(function () {

					});
					//tableData.load();
					popup.dxPopup("instance").hide();
				}
			}
		}, {
			widget: "dxButton",
			toolbar: "bottom",
			location: "center",
			options: {
				text: saveString("Закрыть"),
				type: "cancel",
				stylingMode: "outlined",
				onClick: function (e2) {
					popup.dxPopup("instance").hide();
				}
			}
		},
			{
				widget: "dxButton",
				toolbar: "top",
				location: "after",
				options: {
					icon: "close",
					type: "normal",
					stylingMode: "text",
					elementAttr: {
						id: idn + '_close-button',
						class: "myls-close-btn"
					},
					onClick: function (e) {
						popup.dxPopup("instance").hide();
					}
				}
			}
		]
	});
	popup.dxPopup("instance").show();

	function createFilterElement(idn, item, type, addFields, addClass) {
		var idx = idn + '_' + item.dataField + '_' + type;
		if ($('#' + idx + '_label').length == 0) {
			var $filter = $('<div class="myls-filter d-flex"><div id="' + idx + '_checkbox" class="myls-left-col"></div><div class="myls-right-col"></div></div>');
			$('.myls-right-col', $filter).append('<div id="' + idx + '_label" class="myls-filter-label">' + saveString(item.caption) + '</div><div id="' + idx + '_radio" class="myls-filter-radio"></div><div id="' + idx + '" class="myls-filter-field ' + addClass + '"></div>');

			if (addFields) {
				$('.myls-right-col', $filter).append('<div class="myls-filter-block d-flex"><div id="' + idx + '_start" class="myls-filter-field"></div><div id="' + idx + '_end" class="myls-filter-field"></div></div>');
			}
			$('#' + idn + '_popupContainer .myls-filters').append($filter);
			if (type == 'range') {
				$("#" + idx).css('height', '80px');
			}
			addfilterCheckbox(idx, item);
			addfilterRadio(idx, item);
		}
		return idx;
	}

	function addfilterCheckbox(idx, item) {
		$('#' + idx + '_checkbox').dxCheckBox({
			value: false,
			onValueChanged: function (data) {
				var radioGroup = $('#' + idx + '_radio').dxRadioGroup('instance');
				if (data.value) {
					radioGroup.option('visible', true);
					if (radioGroup.option('value') == null)
						radioGroup.option('value', 1);
					data.element.closest('.myls-filter').addClass('active');
					//грузим данные
					if (item.dataType == 'string' || item.dataType == 'tagbox') {
						getStringFilter(idx, item);
					}
					if (item.dataType == 'color') {
						getColorFilter(idx, item);
					}
					if (item.dataType == 'number') {
						getNumberFilter(idx, item);
					}
					if (item.dataType == 'date') {
						getDateFilter(idx, item);
					}
				} else {
					radioGroup.option('visible', false);
					data.element.closest('.myls-filter').removeClass('active');
				}
			}
		}).dxCheckBox('instance');
	}

	function addfilterRadio(idx, item) {
		var radioItems = [{
			id: 0,
			text: saveString('Пустое'),
		}, {
			id: 1,
			text: saveString('Не пустое'),
		}];
		if (item.dataType == 'string') {
			radioItems.push({
				id: 2,
				text: saveString('Кроме'),
			});
			radioItems.push({
				id: 3,
				text: saveString('Содержит'),
			});
		}
		if (item.dataType == 'color') {
			radioItems.push({
				id: 2,
				text: saveString('Кроме'),
			});
		}
		$('#' + idx + '_radio').dxRadioGroup({
			dataSource: radioItems,
			valueExpr: 'id',
			displayExpr: 'text',
			layout: "horizontal",
			visible: false,
			onValueChanged: function (data) {
				if (data.value) {
					data.element.closest('.myls-filter').addClass('active');
				} else {
					data.element.closest('.myls-filter').removeClass('active');
				}
				if (data.value == 3) {
					//console.log(idx);
					if ($('#' + idx + '_contain').length == 0) {
						$('#' + idx).before('<div class="myls-filter-block d-flex"><div id="' + idx + '_contain" class="myls-filter-field"></div></div>');
						$('#' + idx + '_contain').dxTextBox({
							placeholder: "ведите текст..."
						}).dxTextBox('instance');
					} else {
						$('#' + idx + '_contain').show();
					}
					$("#" + idx).hide();
					//filterObjects[table].push({'text': $('#' + idx + '_contain').dxTextBox('instance')});
				} else {
					$('#' + idx + '_contain').hide();
					$("#" + idx).show();
				}
			}
		}).dxRadioGroup("instance");
	}

	function getFilterData(item) {
		var deferred = $.Deferred();
		if (!allTableData[item.dataField]) {
			var url = 'frame/get-filter-string-data';
			if (item.dataType == 'number') {
				url = 'frame/get-filter-number-data';
			}
			if (item.dataType == 'date') {
				url = 'frame/get-filter-string-data';
			}
			var itemData = getData(url, 'post', {
				table: table,
				field: item.dataField,
				extId: objects[idn].ext_id,
				selParams: objects[idn].selParams
			});
			$.when(itemData).done(function (data) {
				allTableData[item.dataField] = data;
				deferred.resolve();
			});
		}
		return deferred;
	}

	function getStringFilter(idx, item) {
		$.when(idx, getFilterData(item)).done(function (id, _) {
			//console.log(createArrayFromObject(data));
			var dataAll = allTableData[item.dataField];
			if (!issetFilterObject(table, item)) {
				filterObjects[table].push({
					'column': item, 'widget': $("#" + id).dxTagBox({
						//items: createArrayFromObject(data),
						dataSource: dataAll,
						//value: [],
						displayExpr: item.dataField,
						valueExpr: item.dataField,
						searchEnabled: true,
						showSelectionControls: true,
					}).dxTagBox('instance'),
					'radio': $('#' + id + '_radio').dxRadioGroup('instance'),
					'text': $('#' + idx + '_contain').dxTextBox('instance'),
				});
			}
		});
	}

	function getColorFilter(idx, item) {
		$.when(idx, getFilterData(item)).done(function (id, _) {
			//dataAll = arrayUnique(dataAll);
			var dataAll = allTableData[item.dataField];
			removeNullFromArray(dataAll);
			dataAll = removeEmptyFromArray(dataAll);
			if (!issetFilterObject(table, item)) {
				filterObjects[table].push({
					'column': item, 'widget': $("#" + id).dxTagBox({
						//items: itemData,
						dataSource: dataAll,
						//value: [],
						displayExpr: item.dataField,
						valueExpr: item.dataField,
						searchEnabled: false,
						showSelectionControls: true,
						itemTemplate: function (tagData) {
							if (tagData[item.dataField] != null) {
								if (tagData[item.dataField].charAt(0) == '#')
									return "<div style='width: 20px; height: 20px; background-color: " + tagData[item.dataField] + "'></div>";
								else
									return "<div style='width: 20px; height: 20px;'>" + tagData[item.dataField] + "</div>";
							}
						},
						tagTemplate: function (tagData) {
							if (tagData[item.dataField] != null) {
								if (tagData[item.dataField].charAt(0) == '#')
									return "<div style='width: 20px; height: 20px; background-color: " + tagData[item.dataField] + "'></div>";
								else
									return "<div style='height: 20px;'>" + tagData[item.dataField] + "</div>";
							}
						}
					}).dxTagBox('instance'),
					'radio': $('#' + id + '_radio').dxRadioGroup('instance'),
				});
			}
		});
	}

	function getNumberFilter(idx, item) {
		//var idx = createFilterElement(idn, item, 'range', true);
		$.when(idx, getFilterData(item)).done(function (id, _) {
			var allData = allTableData[item.dataField][0];
			if (!issetFilterObject(table, item)) {
				filterObjects[table].push({
					'column': item, 'widget': $("#" + id).dxRangeSelector({
						scale: {
							startValue: parseFloat(allData.min),
							endValue: parseFloat(allData.max),
							minorTick: {
								visible: false,
							},
						},
						size: {
							width: 617
						},
						//value: [parseFloat(allData.min), parseFloat(allData.max)],
						onValueChanged: function (data) {
							var startObj = $("#" + id + '_start').dxNumberBox('instance');
							var endObj = $("#" + id + '_end').dxNumberBox('instance');
							startObj.option('value', data.value[0]);
							endObj.option('value', data.value[1]);
						}
					}).dxRangeSelector('instance'),
					'radio': $('#' + id + '_radio').dxRadioGroup('instance'),
				});
				var startObj = $("#" + id + '_start').dxNumberBox({
					value: parseFloat(allData.min),
					showSpinButtons: true,
					onValueChanged: function (data) {
						var sliderObj = $("#" + id).dxRangeSelector('instance');
						sliderObj.option('value', [data.value, sliderObj.option('value')[1]]);
					}
				}).dxNumberBox("instance");
				var endObj = $("#" + id + '_end').dxNumberBox({
					value: parseFloat(allData.max),
					showSpinButtons: true,
					onValueChanged: function (data) {
						var sliderObj = $("#" + id).dxRangeSelector('instance');
						sliderObj.option('value', [sliderObj.option('value')[0], data.value]);
					}
				}).dxNumberBox("instance");
			} else {
				var startObj = $("#" + id + '_start').dxNumberBox("instance");
				var endObj = $("#" + id + '_end').dxNumberBox("instance");
			}
			if (item.format.precision !== undefined && item.format.precision != "0") {
				// if (form[key].editorOptions.format === undefined)
				var format = '#,##0';
				format += '.' + '0'.repeat(item.format.precision);
				startObj.option('format', format);
				endObj.option('format', format);

			}
			if (item.format.precision === undefined || item.format.precision == "0") {
				var format = '#,##0';
				startObj.option('format', format);
				endObj.option('format', format);
			}
		});
	}

	function getDateFilter(idx, item) {
		$.when(idx, getFilterData(item)).done(function (id, _) {
			var dataAll = allTableData[item.dataField];
			resultArray[item.dataField] = dateArray.slice(0);
			//добавляем имеющиеся интервалы месяц+год
			var addMonth = [];
			var addQuarter = [];
			var addYear = [];
			$.each(dataAll, function (i, a) {
				if (a != null) {
					var date = new Date(a[item.dataField]);
					addMonth.push(new Date(date.getFullYear(), date.getMonth(), 1).getTime());
					var quarter = 3 * Math.floor(date.getMonth() / 3);
					addQuarter.push(new Date(date.getFullYear(), quarter, 1).getTime());
					addYear.push(new Date(date.getFullYear(), 1, 1).getTime());
				}

			});
			//добавляем имеющиеся интервалы месяц+год
			addMonth = arrayUnique(addMonth.sort());
			if (addMonth.length > 0) {
				var nn = resultArray[item.dataField].length;
				$.each(addMonth, function (ind, arr) {
					var newDate = new Date(arr);
					++nn;
					resultArray[item.dataField].push({
						'id': nn,
						'name': arrMonth[newDate.getMonth()] + ' ' + newDate.getFullYear(),
						'start': newDate,
						'end': new Date(newDate.getFullYear(), newDate.getMonth() + 1, 0, 23, 59, 59)
					});
				});
			}
			//добавляем имеющиеся интервалы квартал+год
			if (addQuarter.length > 0) {
				addQuarter = arrayUnique(addQuarter.sort());
				$.each(addQuarter, function (ind, arr) {
					var newDate = new Date(arr);
					var quarter = Math.floor(newDate.getMonth() / 3);
					++nn;
					resultArray[item.dataField].push({
						'id': nn,
						'name': arrQuarter[quarter] + ' ' + newDate.getFullYear(),
						'start': newDate,
						'end': new Date(newDate.getFullYear(), newDate.getMonth() + 3, 0, 23, 59, 59)
					});
				});
			}
			//добавляем имеющиеся интервалы год
			if (addYear.length > 0) {
				addYear = arrayUnique(addYear.sort());
				$.each(addYear, function (ind, arr) {
					var newDate = new Date(arr);
					++nn;
					resultArray[item.dataField].push({
						'id': nn,
						'name': newDate.getFullYear(),
						'start': newDate,
						'end': new Date(newDate.getFullYear() + 1, 0, 0, 23, 59, 59)
					});
				});
			}
			var currValue = sessionStorage.getItem(item.dataField);
			var lastValue = null;
			if (currValue != null) {
				lastValue = resultArray[item.dataField][currValue];
			}
			if (!issetFilterObject(table, item)) {
				filterObjects[table].push({
					'column': item, 'widget': $("#" + id).dxSelectBox({
						//items: dateArray,
						dataSource: resultArray[item.dataField],
						displayExpr: "name",
						keyExpr: "id",
						//showDataBeforeSearch: true,
						//showSelectionControls: true,
						value: lastValue,
						/*
                        onInitialized: function (e1) {
                            e1.component.option('value', sessionStorage.getItem(item.dataField));
                        },

                         */
						onValueChanged: function (data) {
							if (data.value != null) {
								var startObj = $("#" + id + '_start').dxDateBox('instance');
								var endObj = $("#" + id + '_end').dxDateBox('instance');
								startObj.option('value', data.value.start);
								endObj.option('value', data.value.end);
								if (data.value.id == 0) {
									startObj.option('readOnly', false);
									endObj.option('readOnly', false);
								} else {
									startObj.option('readOnly', true);
									endObj.option('readOnly', true);
								}
							}
						},
					}).dxSelectBox('instance'),
					'radio': $('#' + id + '_radio').dxRadioGroup('instance'),
				});
				$("#" + id + '_start').dxDateBox({
					displayFormat: "shortdate",
					type: "date",
					readOnly: true,
					showClearButton: true,
					buttons: ["clear", "dropDown"],
					onValueChanged: function (data) {
						$.each(resultArray[item.dataField], function (index, arr) {
							if (arr.id == 0) {
								arr.start = data.value;
								return false;
							}
						});
					}
				}).dxDateBox('instance');
				$("#" + id + '_end').dxDateBox({
					displayFormat: "shortdate",
					type: "date",
					readOnly: true,
					showClearButton: true,
					buttons: ["clear", "dropDown"],
					onValueChanged: function (data) {
						$.each(resultArray[item.dataField], function (index, arr) {
							if (arr.id == 0) {
								arr.end = data.value;
								return false;
							}
						});
					}
				}).dxDateBox('instance');
			}
		});
	}

}

function getCurrentWeek() {
	var fdWeek = new Date();
	var cdWeek = new Date();
	var dia = fdWeek.getDay();
	if (dia == 0)
		dia = 7;
	var prevWeekEnd = new Date();
	prevWeekEnd.setTime(fdWeek.setUTCHours(-((dia) * 24)));
	var prevWeekStart = new Date();
	prevWeekStart.setTime(fdWeek.setUTCHours(-((dia + 6) * 24)));
	var currWeekStart = new Date();
	currWeekStart.setTime(cdWeek.setUTCHours(-((dia - 1) * 24)));
	var currWeekEnd = new Date();
	currWeekEnd.setTime(cdWeek.setUTCHours((8 - dia) * 24));
	var out = {
		prevWeekEnd: prevWeekEnd,
		prevWeekStart: prevWeekStart,
		currWeekStart: currWeekStart,
		currWeekEnd: currWeekEnd
	};
	return out;
}

function getCurrentMonth() {
	var fdMonth = new Date();
	var year = fdMonth.getFullYear();
	var month = fdMonth.getMonth();
	var startCurrMonth = new Date(year, month, 1);
	var endCurrMonth = new Date(year, month + 1, 0, 23, 59, 59);
	var startPrevMonth = new Date(year, month - 1, 1);
	var endPrevMonth = new Date(year, month, 0, 23, 59, 59);
	var out = {
		startCurrMonth: startCurrMonth,
		endCurrMonth: endCurrMonth,
		startPrevMonth: startPrevMonth,
		endPrevMonth: endPrevMonth
	};
	return out;
}

function getCurrentYear() {
	var fdYear = new Date();
	var year = fdYear.getFullYear();
	var startCurrYear = new Date(year, 0, 1);
	var endCurrYear = new Date(year + 1, 0, 0, 23, 59, 59);
	var startPrevYear = new Date(year - 1, 0, 1);
	var endPrevYear = new Date(year, 0, 0, 23, 59, 59);
	var out = {
		startCurrYear: startCurrYear,
		endCurrYear: endCurrYear,
		startPrevYear: startPrevYear,
		endPrevYear: endPrevYear
	};
	return out;
}

function getCurrentQuarter() {
	var fdQuarter = new Date();
	var year = fdQuarter.getFullYear();
	var month = fdQuarter.getMonth();
	var quarter = 3 * Math.floor(month / 3);
	var startCurrQuarter = new Date(year, quarter, 1);
	var endCurrQuarter = new Date(year, quarter + 3, 0, 23, 59, 59);
	var startPrevQuarter = new Date(year, quarter - 3, 1);
	var endPrevQuarter = new Date(year, quarter, 0, 23, 59, 59);
	var out = {
		startCurrQuarter: startCurrQuarter,
		endCurrQuarter: endCurrQuarter,
		startPrevQuarter: startPrevQuarter,
		endPrevQuarter: endPrevQuarter
	};
	return out;
}

function getDateArray() {
	var now = new Date();
	var month = getCurrentMonth();
	var week = getCurrentWeek();
	var year = getCurrentYear();
	var quarter = getCurrentQuarter();
	return [{
		'id': 0,
		'name': saveString("Выбрать период"),
		'start': now,
		'end': now
	}, {
		'id': 1,
		'name': saveString("Сегодня"),
		'start': new Date(now.getFullYear(), now.getMonth(), now.getDate()),
		'end': new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
	}, {
		'id': 2,
		'name': saveString("Вчера"),
		'start': new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1),
		'end': new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59)
	}, {
		'id': 3,
		'name': saveString("Эта неделя"),
		'start': week.currWeekStart,
		'end': week.currWeekEnd
	}, {
		'id': 4,
		'name': saveString("Прошлая неделя"),
		'start': week.prevWeekStart,
		'end': week.prevWeekEnd
	}, {
		'id': 5,
		'name': saveString("Этот месяц"),
		'start': month.startCurrMonth,
		'end': month.endCurrMonth
	}, {
		'id': 6,
		'name': saveString("Прошлый месяц"),
		'start': month.startPrevMonth,
		'end': month.endPrevMonth
	}, {
		'id': 7,
		'name': saveString("Этот квартал"),
		'start': quarter.startCurrQuarter,
		'end': quarter.endCurrQuarter
	}, {
		'id': 8,
		'name': saveString("Прошлый квартал"),
		'start': quarter.startPrevQuarter,
		'end': quarter.endPrevQuarter
	}, {
		'id': 9,
		'name': saveString("Этот год"),
		'start': year.startCurrYear,
		'end': year.endCurrYear
	}, {
		'id': 10,
		'name': saveString("Прошлый год"),
		'start': year.startPrevYear,
		'end': year.endPrevYear
	}];
}


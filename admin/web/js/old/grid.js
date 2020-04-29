function initTable(table, ext_id, view, mode, tHistory, viewMode) {
	var deferred = new $.Deferred;
	var idn = getIdn(table, ext_id, 'grid', view);
	//получаем данные
	var startData = initData(table, ext_id, 'grid');
	//стартуем окошко загрузки
	// openLoadPanel(idn);
	if (viewMode == 'compact') {
		$("#" + idn).addClass('mylscompact');
	}
	//выводим таблицу
	$.when(startData.tableColumns, startData.contextMenuData, startData.tableInfo).done(function (columns, menu, tableInfo) {

		processCellTemplates(columns['columns'], idn);

		tableInfo.idn = idn;
		var selParams = getSelParams(tableInfo);
		var loadData = createDataSource(table, ext_id, idn, tHistory, columns.columns, tableInfo, selParams);
		var lData = loadData.load();
		var curState = JSON.stringify({});

		var isReadField = getColumnByColumnType("is_read", columns.columns);

		if (tableInfo.view !== '')
			$("#" + idn).addClass("myls" + tableInfo.view);

		var masterDetail = {};
		var newMenu = [];
		$.each(menu, function (index, item) {
			if (item.isInner == 1) {
				var param = convertUrlToParam(item.url);
				masterDetail = {
					enabled: true,
					template: function (container, option) {
						var idx = getIdn(param.table, option.data[item.extIdField], item.objectType, 'tabs');
						container.addClass('myls-master-detail-container');
						container.append('<div class="myls-master-detail-caption">' + item.text + '</div>');
						container.append(getObjectContainer(idx));
						initObject(param.table, option.data[item.extIdField], 'tabs', item.objectType, 'sel', addHistory(item.extIdField, option.data[item.extIdField], idn, tHistory, 'sel'), [], 'compact');
					},
				};
				//menu.splice(index, 1);
				//return false;
			} else
				newMenu.push(item);
		});
		menu = newMenu;
		if (columns['summaries'] && columns['summaries'].length > 0) {
			$.each(columns['summaries'], function (index, item) {
				item.displayFormat = "{0}";
			});
		}
		var usedColumns = getUsedColumns(columns['columns']);
		usedColumns.__lastColumn__ = {
			width: "auto",
			cssClass: 'last-column', // this class in the CSS block
			// removes paddings and borders of the last column
			visibleIndex: 100000,
			cellTemplate: function (container) {
				// this empty template removes the
				// spaces from data cells
			}
		};

		var grid = $("#" + idn).dxDataGrid({
			dataSource: loadData,
			columns: usedColumns,
			summary: {
				totalItems: columns['summaries'],
			},
			sorting: {
				mode: "multiple"
			},
			editing: {
				refreshMode: "reshape",
				selectTextOnEditStart: true,
				startEditAction: "click"
			},
			scrolling: {
				mode: "virtual",
				rowRenderingMode: "virtual",
				preloadEnabled: true,
				showScrollbar: "always",
				//columnRenderingMode: "virtual"
			},
			focusedRowEnabled: true,
			focusedRowIndex: 0,
			headerFilter: {
				visible: false,
				allowSearch: true
			},
			/*paging: {
				pageSize: 50,
			},*/
			selection: {
				mode: "multiple",
				showCheckBoxesMode: "always",
			},
			renderAsync:true,
			export: {
				enabled: true,
				fileName: tableInfo.name, //"Employees",
				allowExportSelectedData: false,
				customizeExcelCell: function (options) {
					var gridCell = options.gridCell;
					if (!gridCell) {
						return;
					}
					if (gridCell.rowType === "data") {
						if (gridCell.column.dataType === "block") {
							var currElem = getFormattedCellValue(gridCell.value, gridCell.column, columns['columns'], gridCell.data, idn);
							$elem = $('<div>');
							$elem.attr('data-dir', 'v');
							$elem.append(currElem);
							//console.log(currElem);
							var currData = '';
							$('div[data-dir="v"] > *', $elem).each(function () {
								var delimer = "\n";
								if ($.trim($(this).text()) !== '')
									currData += $(this).text() + delimer;
							});
							options.value = currData;
							//console.log(options.value);
						}
						if (gridCell.column.dataType === "boolean") {
							if (gridCell.value == 1) {
								options.value = DevExpress.localization.formatMessage("myls-yes");
							} else {
								options.value = DevExpress.localization.formatMessage("myls-no");
							}
						}
					}
				}
			},
			repaintChangesOnly: true,
			searchPanel: {visible: true},
			wordWrapEnabled: true,
			showColumnLines: true,
			showRowLines: false,
			rowAlternationEnabled: true,
			// filterRow: {visible: (viewMode != 'compact' && tableInfo.view !== 'compact')},
			columnResizingMode: 'widget',
			allowColumnResizing: true,
			allowColumnReordering: true,
			columnAutoWidth: false,
			dateSerializationFormat: "yyyy-MM-ddTHH:mm:ssx",
			//filterPanel: {visible: tableInfo.view !== 'compact'},
			loadPanel: {
				enabled: false
			},
			/*filterBuilder: {
				fields: getFilterColumns(columns.columns)
			},*/
			//disabled: true,
			canFinishEdit: true,
			columnChooser: {
				enabled: true
			},
			/*onInitialized: function (e) {
				saveFileTranslate();
			},*/
			onContentReady: function (e) {
				if (e.component.option('editing.mode') == 'row') {
					contentReady(idn, e, 'grid');
				}
				var dataSource = e.component.getDataSource();
				if (dataSource != undefined) {
					$('#' + idn + '_totalCount').text(saveString("Всего записей:") + ' ' + dataSource._totalCount);
				}
				//console.log(e.component.getDataSource());
				//$('#' + idn + '_totalCount').text(DevExpress.localization.formatMessage("myls-totalCount", [e.component.getDataSource()._totalCount]));
			},
			onContextMenuPreparing: function (e) {
				if (e.row !== undefined)
					openContextMenu(idn, e.row.key, e.row.data, tHistory);
			},
			onRowDblClick: function (e) {
				e.event.stopPropagation();
				processDblClick(e, tableInfo, e.key, tHistory, 'grid', columns);
			},
			onToolbarPreparing: function (e) {
				initToolbar(e, e.toolbarOptions.items, tableInfo, table, ext_id, 'grid', tHistory, columns);
			},
			onExporting: function (e) {
				e.component.beginUpdate();
				setColumnsByTypeVisible(columns['columns'], e.component, 'image', false);
			},
			onExported: function (e) {
				setColumnsByTypeVisible(columns['columns'], e.component, 'image', true);
				e.component.endUpdate();
			},
			onRowValidating: function (e) {
				if (!e.isValid) e.component.canFinishEdit = false;
			},
			onDataErrorOccurred: function (e) {
				e.component.canFinishEdit = false;
			},
			onSelectionChanged: function (e) {
				var countSelected = e.component.getSelectedRowKeys().length;
				if (countSelected > 0) {
					$('#' + idn + '_totalSelected').closest('.myls-total-selected').removeClass('dx-state-invisible');
					$('#' + idn + '_totalSelected').text(saveString("Всего выделено:") + ' ' + countSelected);
				} else {
					$('#' + idn + '_totalSelected').closest('.myls-total-selected').addClass('dx-state-invisible');
					$('#' + idn + '_totalSelected').text(saveString("Всего выделено:") + ' ' + 0);
				}
			},
			stateStoring: {
				enabled: true,
				type: "custom",
				savingTimeout: 500,
				customLoad: function () {
					return sendStorageRequest("storage", "json", "GET", false, table, usedColumns);
				},
				customSave: function (state) {
					prepareStorage(state);
					var cState = JSON.stringify(state);
					if (curState != cState) {
						sendStorageRequest("storage", "json", "POST", state, table);
						curState = cState;
					}
				}
			},
			masterDetail: masterDetail,
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

				startData = null;
				selParams = null;
				loadData = null;
				curState = null;
				masterDetail = null;
				idn = null;
				filterObjects[table] = null;
			},
			onEditorPreparing: function (e) {
				if (e.parentType === "dataRow" && e.dataField)
					if (columns.columns[e.dataField] && columns.columns[e.dataField].dataType === 'lookup' && columns.columns[e.dataField].template)
						e.editorOptions.itemTemplate = function (data) {
							columns.columns[e.dataField].editor = 1;
							var value = getFormattedCellValue(null, columns.columns[e.dataField], columns.columns, data, idn);

							columns.columns[e.dataField].editor = null;
							return value;
						};
			},
			onRowPrepared: function (e) {
				if (isReadField && e.rowType == 'data' && !e.data[isReadField.dataField]) {
					e.rowElement.addClass('mylsThemeBold');
				}
				if (e.rowType == 'data' && e.data['row__class']) {
					e.rowElement.addClass(e.data['row__class']);
				}
				if (e.rowType == 'data' && e.data['row__color']) {
					e.rowElement.css('color', e.data['row__color']);
				}
				if (e.rowType == 'data' && e.data['row__bgcolor']) {
					e.rowElement.css('background_color', e.data['row__bgcolor']);
				}
			},
			onFocusedRowChanged: function (e) {
				if (isReadField && e.row && e.row.rowType == 'data' && !e.row.data[isReadField.dataField]) {
					var store = grid.getDataSource().store();
					var data = {};
					data[isReadField.dataField] = 1;
					store.push([{type: "update", data: data, key: e.row.data['id']}]);
					var params = {};
					params.table = table;
					params.ext_id = e.row.data['id'];
					params.type = 'upd';
					params.data = JSON.stringify(data);
					setData('/frame/update', 'post', params);
					var focusedRow = e.rowIndex;
					//grid.repaintRows([e.rowIndex]);
					grid.option('focusedRowIndex', focusedRow);
				}
			}
			//showBorders: true
		}).dxDataGrid("instance");

		/*if (isReadField) {
			grid.onCellPrepared = function(e) {
				console.log(e);
			}
		}*/

		initContextMenu(idn, menu, '#' + idn + ' .dx-datagrid-content');

		var object = {
			object: grid,
			columns: columns.columns,
			tableInfo: tableInfo,
			menu: menu,
			type: 'grid',
			tHistory: tHistory,
			idn: idn,
			dataSource: loadData,
			ext_id: ext_id,
			selParams: selParams,
			saveFunction: function () {
				return grid.saveEditData();
			}
		};
		objects[idn] = object;

		deferred.resolve(object);
		//var total = grid.getDataSource()._totalCount;
		initBottomToollbar(idn, 0, 0);



	}).fail(function (error) {
		showError(idn, error);
		deferred.reject();
	});
	return deferred;
}

function disposeTable(table, ext_id, view, type) {
	var idn = getIdn(table, ext_id, type, view);
	$('#' + idn).dxDataGrid('instanse');
}
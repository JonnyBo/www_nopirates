class Grid extends MylsEditableObject {

	constructor(table, ext_id, view, mode, tHistory, viewMode, params) {
		super(table, ext_id, view, mode, tHistory, viewMode, params);
		this.type = 'grid';
		this.masterDetail = {};
	}

	async init() {
		super.init();
		this.columns.processCellTemplates();
		this.dataSource.load();
		this.curState = JSON.stringify({});
		this.isReadField = this.columns.getColumnsByColumnType("is_read", true);
		this.createMasterDetail();
		this.usedColumns = this.columns.getUsedColumns();
		this.usedColumns.__lastColumn__ = {
			width: "auto",
			cssClass: 'last-column', // this class in the CSS block
			// removes paddings and borders of the last column
			visibleIndex: 100000,
			cellTemplate: function (container) {
				// this empty template removes the
				// spaces from data cells
			}
		};
		this.createObject();
		$("#" + this.idn).data('mylsObject', this);
		this.contextMenu = new ContextMenu(this);
		this.contextMenu.init(this.contextMenuData, '#' + this.idn + ' .dx-datagrid-content');
	}

	createObject() {
		this.object = $("#" + this.idn).dxDataGrid(this.getOptions()).dxDataGrid('instance');
	}

	getOptions() {
		const self = this;
		return {
			dataSource: this.dataSource,
			columns: this.usedColumns,
			summary: {
				totalItems: this.columns.summary,
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
			selection: {
				mode: "multiple",
				showCheckBoxesMode: "always",
			},
			renderAsync: false,
			export: {
				enabled: true,
				fileName: app.appInfo.tables[this.table].name, //"Employees",
				allowExportSelectedData: false,
				customizeExcelCell: function (options) {
					self.customizeExcelCell(options);
				}
			},
			repaintChangesOnly: true,
			searchPanel: {visible: true},
			wordWrapEnabled: true,
			showColumnLines: true,
			showRowLines: false,
			rowAlternationEnabled: true,
			columnResizingMode: 'widget',
			allowColumnResizing: true,
			allowColumnReordering: true,
			columnAutoWidth: false,
			dateSerializationFormat: "yyyy-MM-ddTHH:mm:ssx",
			loadPanel: {
				enabled: false
			},
			canFinishEdit: true,
			columnChooser: {
				enabled: true
			},
			onContentReady: function (e) {
				self.gridContentReady(e);
			},
			onContextMenuPreparing: function (e) {
				if (e.row !== undefined)
					self.contextMenu.show(e.row.key, e.row.data);
			},
			onRowDblClick: function (e) {
				e.event.stopPropagation();
				self.processDblClick(e);
			},
			onToolbarPreparing: function (e) {
				self.toolbar.init(e);
				//initToolbar(e, e.toolbarOptions.items, tableInfo, table, ext_id, 'grid', tHistory, columns);
			},
			onExporting: function (e) {
				e.component.beginUpdate();
				self.columns.setColumnsByTypeVisible(e.component, 'image', false);
			},
			onExported: function (e) {
				self.columns.setColumnsByTypeVisible(e.component, 'image', true);
				e.component.endUpdate();
			},
			onRowValidating: function (e) {
				if (!e.isValid) e.component.canFinishEdit = false;
			},
			onDataErrorOccurred: function (e) {
				e.component.canFinishEdit = false;
			},
			onSelectionChanged: function (e) {
				self.selectionChanged(e);
			},
			stateStoring: {
				enabled: true,
				type: "custom",
				savingTimeout: 500,
				customLoad: function () {
					return self.sendStorageRequest("storage", "json", "GET", false, self.table, self.usedColumns);
				},
				customSave: function (state) {
					self.customSave(state);
				}
			},
			masterDetail: this.masterDetail,
			onEditorPreparing: function (e) {
				self.editorPreparing(e);
			},
			onRowPrepared: function (e) {
				self.rowPrepared(e);
			},
			onFocusedRowChanged: function (e) {
				self.focusedRowChanged(e);
				self.toolbar.setEnabledToolbar();
			}

			//showBorders: true
		};
	}

	focusedRowChanged(e) {
		if (this.isReadField && e.row && e.row.rowType == 'data' && !e.row.data[this.isReadField.dataField]) {
			let store = this.object.getDataSource().store();
			let data = {};
			data[this.isReadField.dataField] = 1;
			store.push([{type: "update", data: data, key: e.row.data['id']}]);
			let params = {};
			params.table = this.table;
			params.ext_id = e.row.data['id'];
			params.type = 'upd';
			params.data = JSON.stringify(data);
			app.processData('frame/update', 'post', params);
			const focusedRow = e.rowIndex;
			this.object.option('focusedRowIndex', focusedRow);
		}
	}

	rowPrepared(e) {
		if (this.isReadField && e.rowType == 'data' && !e.data[this.isReadField.dataField]) {
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
	}

	editorPreparing(e) {
		const self = this;
		if (e.parentType === "dataRow" && e.dataField)
			if (this.columns.columns[e.dataField] && this.columns.columns[e.dataField].dataType === 'lookup' && this.columns.columns[e.dataField].template)
				e.editorOptions.itemTemplate = function (data) {
					self.columns.columns[e.dataField].editor = 1;
					const value = self.columns.getFormattedCellValue(null, self.columns.columns[e.dataField], data);
					self.columns.columns[e.dataField].editor = null;
					return value;
				};
	}

	customSave(state) {
		app.prepareStorage(state);
		const cState = JSON.stringify(state);
		if (this.curState != cState) {
			this.sendStorageRequest("storage", "json", "POST", state, this.table);
			this.curState = cState;
		}
	}

	selectionChanged(e) {
		const countSelected = e.component.getSelectedRowKeys().length;
		if (countSelected > 0) {
			$('#' + this.idn + '_totalSelected').closest('.myls-total-selected').removeClass('dx-state-invisible');
			$('#' + this.idn + '_totalSelected').text(app.translate.saveString("Всего выделено:") + ' ' + countSelected);
		} else {
			$('#' + this.idn + '_totalSelected').closest('.myls-total-selected').addClass('dx-state-invisible');
			$('#' + this.idn + '_totalSelected').text(app.translate.saveString("Всего выделено:") + ' ' + 0);
		}
	}

	gridContentReady(e) {
		if (e.component.option('editing.mode') == 'row') {
			this.contentReady(e);
		}
		const dataSource = e.component.getDataSource();
		if (dataSource != undefined) {
			$('#' + this.idn + '_totalCount').text(app.translate.saveString("Всего записей:") + ' ' + dataSource._totalCount);
		}
	}

	customizeExcelCell(options) {
		let gridCell = options.gridCell;
		if (!gridCell) {
			return;
		}
		if (gridCell.rowType === "data") {
			if (gridCell.column.dataType === "block") {
				this.excelCellBlock(gridCell, options);
			}
			if (gridCell.column.dataType === "boolean") {
				this.excelCellBoolean(gridCell, options);
			}
		}
	}

	excelCellBoolean(gridCell, options) {
		if (gridCell.value == 1) {
			options.value = DevExpress.localization.formatMessage("myls-yes");
		} else {
			options.value = DevExpress.localization.formatMessage("myls-no");
		}
	}

	excelCellBlock(gridCell, options) {
		let currElem = this.columns.getFormattedCellValue(gridCell.value, gridCell.column, gridCell.data);
		let $elem = $('<div>');
		$elem.attr('data-dir', 'v');
		$elem.append(currElem);
		let currData = '';
		$(/*'div[data-dir="v"] > *', */$elem).each(function () {
			var delimer = "\n";
			if ($.trim($(this).text()) !== '')
				currData += $(this).text() + delimer;
		});
		options.value = currData;
	}

	createMasterDetail() {
		let newMenu = [];
		const self = this;
		$.each(this.contextMenuData, function (index, item) {
			if (item.isInner == 1) {
				const param = app.parseUrl(item.url);
				self.masterDetail = {
					enabled: true,
					template: function (container, option) {
						self.templateMasterdetail(item, param, option, container);
					},
				};
				//menu.splice(index, 1);
				//return false;
			} else
				newMenu.push(item);
		});
		this.contextMenuData = newMenu;
	}

	templateMasterdetail(item, param, option, container) {
		const idn = app.getIdn(item.objectType, param.table, option.data[item.extIdField], 'tabs');
		container.addClass('myls-master-detail-container');
		container.append('<div class="myls-master-detail-caption">' + item.text + '</div>');
		container.append(app.getObjectContainer(idn));
		const object = app.getObject(param.table, option.data[item.extIdField], 'tabs', item.objectType, 'sel', app.addHistory(item.extIdField, option.data[item.extIdField], idn, this.tHistory, 'sel'), 'compact');
		object.init();
	}

	getCurrentId() {
		return this.object.option('focusedRowKey');
	}

	getSelectedRows() {
		return this.object.getSelectedRowKeys();
	}

	async refresh(changesOnly = true, useLoadPanel = true) {
		this.object.refresh();
		this.toolbar.setEnabledToolbar();
		this.changed();
	}

	destroy() {
		super.destroy();
		$("#" + this.idn).data('mylsObject', null);
		app.destroyArray(this.masterDetail);
		app.destroyArray(this.usedColumns);
		this.curState = null;
		this.close();
	}

	showEditButtons(mode) {
		this.object.option('editing').allowUpdating = mode == 'batch' && this.tableInfo.e == 1;
		this.object.option('editing').allowAdding = mode == 'batch' && this.tableInfo.a == 1;
		this.object.option('editing').allowDeleting = mode == 'batch' && this.tableInfo.d == 1;
	}

	async editInline(params) {
		const self = this;
		return new Promise(async (resolve) => {
			//переходим в режим редактирования строки
			self.object.beginUpdate();
			self.showEditButtons('batch');
			if (self.object.option("editing").mode != 'batch') {
				self.object.option('editing', {
					mode: "batch",
					selectTextOnEditStart: true,
					startEditAction: "click",
				});
				self.object.option("focusedRowEnabled", false);
			}
			if (self.mode == 'ins') {
				let data = await app.processData('frame/tabledata', 'post', self.prepareTableData(-1, 'ins'));
				self.updatedExtId[data[0]['id']] = data['ext_id'];
				self.updatedExtField[data[0]['id']] = data['ext_field'];
				self.rawValues[data['ext_id']] = app.cloneObject(data[0]);
				data = data[0];

				// Проходим по истории и добавляем, если необходимо, внешние ключи
				self.passHistoryValues(data);
				self.columns.setDefaultValues(data);
				// Проставляем значения, пришедшие в параметрах
				self.passParamsValues(data, params);

				self.object.on('initNewRow', function (e) {
					e.data = data;
				});
				self.object.addRow();
				//});
			}
			self.object.endUpdate();
			resolve();
		});
	}

	hasUncommitedData() {
		return this.object.hasEditData();
	}
}
class MylsObject {

	constructor(table, ext_id, view, mode, tHistory, viewMode, params = {}) {
		this.idn = '';
		this.table = table;
		this.ext_id = ext_id;
		this.view = view;
		this.type = undefined;
		this.mode = mode;
		this.tHistory = tHistory;
		this.viewMode = viewMode;
		this.object = {};
		this.params = params;
		this.tableData = {};
		this.promise = new Promise(function (resolve, reject) {
			this.close = resolve;
		}.bind(this));
	}

	async init() {
		this.idn = app.getIdn(this.type, this.table, this.ext_id, this.view);
		this.initData();
		this.dependencies = new Dependencies(this);
		this.setDefaultExtId();
		this.selParams = this.getSelParams();
		this.dataSource = this.createDataSource();
		if (this.viewMode == 'compact') {
			$("#" + this.idn).addClass('mylscompact');
		}
		this.initToolbar();
		this.initFilter();
		this.initProgressBar();
	}

	setDefaultExtId() {
		// Проставляем ext_id, если ключевое поле - company_id
		if (this.tableInfo.idField == 'company_id' && (this.ext_id === null || this.ext_id === undefined))
			this.ext_id = app.config.company_id;
	}

	initData() {
		this.tableInfo = this.getTableInfo();
		this.tableColumns = this.getTableColumns();
		this.contextMenuData = this.getContextMenu();
		this.template = this.getTemplate();
		this.columns = new Columns(this.tableColumns, this.idn, this);
	}

	initProgressBar() {
		this.progressBar = new ProgressBar(this);
	}

	initToolbar() {
		this.toolbar = new Toolbar(this);
	}

	initFilter() {
		this.filter = new Filter(this);
	}

	getTableInfo() {
		return app.cloneObject(app.appInfo.tables[this.table]);
	}

	getContextMenu() {
		if (app.appInfo.contextMenu[this.table])
			return app.cloneObject(app.appInfo.contextMenu[this.table]);
		else
			return null;
	}

	getTableColumns() {
		return app.cloneObject(app.appInfo.columns[this.table]);
	}

	getTemplate() {
		if (app.appInfo.templates[this.table])
			return app.cloneObject(app.appInfo.templates[this.table]);
		else
			return null;
	}

	refreshRow(ext_id, mode) {
		const self = this;
		return new Promise((resolve, reject) => {
			if (self.object && self.dataSource) {
				const store = self.dataSource.store();
				app.openLoadPanel(self.idn);
				$.ajax({
					url: 'frame/tablerow',
					type: 'get',
					data: {'id': self.table, 'extId': ext_id},
					success: function (data) {
						data = JSON.parse(data)[0];
						if (mode == 'ins') {
							store.push([{type: "insert", data: data}]);
							//refreshObject(obj, getType(idn), true);
						} else
							store.push([{type: "update", data: data, key: ext_id}]);
						app.closeLoadPanel(self.idn);
						self.changed();
						resolve();
					},
					error: async function (error) {
						await app.dialog.showError(self.idn, error);
						reject();
					}
				});
			} else {
				resolve();
			}
		});
	}

	getSelParams() {
		let selParams = {};
		let curDate = new Date();
		let date30 = new Date();
		date30.setDate(date30.getDate() - 30);
		if (this.tableInfo.selParams) {
			let self = this;
			$.each(this.tableInfo.selParams, function (_, item) {
				if (item == 'table_date' || item == 'end_date') {
					if (item == 'table_date' && app.findInArray('end_date', self.tableInfo.selParams) !== -1) {
						selParams[':' + item] = self.convertFromDateTime(date30).slice(0, 10);
					} else
						selParams[':' + item] = self.convertFromDateTime(curDate).slice(0, 10);
				} else
					selParams[':' + item] = null;

			});
		}
		return selParams;
	}

	/*findInArray(text, items) {
		let searchText = text.trim().toLowerCase();
		return items.findIndex((item) => {
			if (item.trim().toLowerCase() == searchText) {
				return true;
			}
		});
	}*/

	findInDataSource(text, items, field = 'item') {
		//if (!text) return -1;
		let searchText = text.trim().toLowerCase();
		return items.findIndex((item) => {
			if (item[field] && String(item[field]).trim().toLowerCase() == searchText) {
				return true;
			}
		});
	}

	convertFromDateTime(date) {
		if (!date) return null;
		const regex = /\d{4}-\d{2}-\d{2}((T|\ )\d{2}:\d{2}:\d{2})?/g;
		if (String(date).search(regex) == -1)
			date = DevExpress.localization.formatDate(new Date(date), 'yyyy-MM-ddTHH:mm:ssx');
		date = date.slice(0, 19).replace('T', ' ');
		return date;
	}

	async processResult(res) {
		if (!res) return;
		if (res.error && res.error != '') {
			await app.dialog.showError(this.idn, res.error);
		} else if (res.success) {
			if (res.success.error_msg && res.success.error_type) {
				res = res.success;
				res.error_msg = app.replaceAll(res.error_msg, '__idn__', this.idn);
				if (res.error_type == 1) {
					await app.dialog.showWarning(this.idn, res.error_msg);
				} else {
					await app.dialog.showError(this.idn, res.error_msg);
				}
			}
		} else if (typeof res == 'string') {
			await app.dialog.showError(this.idn, res);
		} else await app.dialog.showError(this.idn, res.toString());
	}

	async processDelete(key) {
		try {
			let data = await app.processData("frame/delete?table=" + this.table + "&extId=" + key + "&lang=" + app.config.lang, "DELETE");
			this.processResult(data);
		} catch (e) {
			this.processResult(e);
		}
		this.changed();
	}

	prepareTableData(ext_id, mode) {
		let params = {};
		params.table = this.table;
		params.extId = ext_id ? ext_id : this.ext_id;
		params.mode = mode ? mode : this.mode;
		this.passParamsToSelParams();
		if (this.selParams) {
			params.selParams = JSON.stringify(this.selParams);
		}
		return params;
	}

	createDataSource() {
		let self = this;
		if (!this.selParams)
			this.selParams = {};
		let ds = new DevExpress.data.DataSource({
			reshapeOnPush: true,
			paginate: false,
			mylsFilter: [],
			postProcess: function (data) {
				$.each(data, function (index, item) {
					self.columns.convertDateTimeColumns(item);
				});
				return data;
			},
			store: new DevExpress.data.CustomStore({
				key: "id",
				//filter: [],
				loadMode: 'raw',
				remove: function (key) {
					return self.processDelete(key);
				},
				load: async function (loadOptions) {
					let params = self.prepareTableData();
					params.filter = JSON.stringify(ds.mylsFilter);
					app.openLoadPanel(self.idn);
					let result = await app.processData('frame/tabledata', 'POST', params);
					app.closeLoadPanel(self.idn);
					self.changed();
					return result;
				},
				onUpdating: async (key, values) => {
					self.rawData = await ds.store().byKey(key);
				},
				update: (key, values) => {
					self.update(key, values);
				},
				insert: (values) => {
					return self.insert(values);
				},
			})
		});
		ds.selParams = this.selParams;
		return ds;
	}

	/*async update(ds, key, values) {

	}

	insert(values) {

	}*/

	getElement(e) {
		let element = '';
		if (e.hasOwnProperty("element"))
			element = e.element;
		else if (e.hasOwnProperty("NAME"))
			element = e.element();
		else
			element = e;
		return element;
	}

	contentReady(e) {
		if (this.type != 'scheduler')
			this.lockObject(false);
	}

	processDblClick() {
		if (this.tableInfo.e == 1 && this.mode !== 'ins') {
			const id = this.getCurrentId();
			this.editRecord(id, app.addHistory(this.tableInfo.idField, id, this.idn, this.tHistory, 'upd'), 'upd');
		}
	}

	processInsert() {
		this.editRecord(-1, app.addHistory(this.tableInfo.idField, -1, this.idn, this.tHistory, 'ins'), 'ins');
	}

	async editInline() {
		console.log(`${this.idn} - Нет режима инлайн редактирования`);
	}

	editRecord(id, tHistory, mode, params) {
		const self = this;
		return new Promise(async (resolve) => {
			// Если мы начинаем добавлять что-то в форме во внешнем объекте (грид, шедулер и тд) при этом форма тоже в insert,
			// мы обязаны сначала сохранить данные формы
			try {
				await self.saveDataIfInsert(mode, tHistory);
				if (self.tableInfo.formId) {
					await app.openPopup(self.tableInfo.formId, id, 'form', mode, tHistory, params);
				} else {
					//self.params = app.cloneObject(params);
					self.mode = mode;
					await self.editInline(params);
				}
				//});
			} catch (e) {

			}
			resolve();
		});
	}

	saveDataIfInsert(mode, tHistory) {
		const self = this;
		return new Promise(async (resolve, reject) => {
			if (mode == 'ins' && tHistory.length > 1 && tHistory[tHistory.length - 2].mode == 'ins') {

				const idn = tHistory[tHistory.length - 2].idn;
				const mylsObject = $(`#${idn}`).data('mylsObject');
				if (mylsObject && mylsObject.type == 'form') {
					const confirmed = app.dialog.confirm(self.idn, app.translate.saveString('Для корректной работы необходимо сохранить данные формы.<br>Продолжить?'), app.translate.saveString('Подтвержение'));
					if (await confirmed) {
						try {
							mylsObject.updatedValues = mylsObject.tableData;
							await mylsObject.save(mylsObject.ext_id);
							tHistory[tHistory.length - 1].mode = 'upd';
							resolve();
						} catch (error) {
							reject();
						}
					} else reject();
				} else resolve();
			} else resolve();
		});
	}

	async refresh(changesOnly = true, useLoadPanel = true) {
		this.changed();
		//console.log(`У объекта ${this.idn} отсутствует метод refresh`);
	}

	getCurrentId() {
		return undefined;
	}

	getSelectedRows() {
		return [];
	}

	async sendStorageRequest(storageKey, dataType, method, data, table, usedColumns) {
		const self = this;
		return new Promise((resolve, reject) => {
			let storageRequestSettings = {
				url: "site/" + storageKey,
				method: method,
				dataType: dataType,
				success: function (data) {
					if (method == 'GET') {
						if (data.columns) {
							let columns = [];
							$.each(data.columns, function (index, item) {
								if (item) {
									if (!item['width']) {
										item['width'] = 100;
									}
									if (!item['dataField']) {
										item.visibleIndex = 10000;
										columns.push(item);
									} else if (usedColumns[item.dataField] && usedColumns[item.dataField].visible) {
										columns.push(item);
									}
								}
							});
							data.columns = columns;
						}
					}
					resolve(data);
				},
				fail: function (error) {
					reject();
				}
			};
			storageRequestSettings.data = {'table': table};
			if (data) {
				storageRequestSettings.data = {'table': table, 'data': JSON.stringify(data)};
			}
			$.ajax(storageRequestSettings);
		});
	}

	async getParams(arr) {
		let params = {};
		for (let key in arr) {
			params[arr[key]] = await this.getFieldValue(arr[key]);
		}
		return params;
	}

	async getFieldValue(field, toDB) {

		let value = null;
		value = app.getConfigParam(':' + field);
		if (value !== null) return this.prepareValue(value, field, toDB);

		const complexField = field.split('.');
		field = complexField[0];

		if (this.columns.columns.hasOwnProperty(field)) {
			// Если простое значение
			if (complexField.length == 1) {
				value = this.tableData[field];
			} else
				// Если комплексное значение и лукап
			if (this.columns.columns[field].dataType == 'lookup' && this.columns.columns[field].editor) {
				value = await this.getLookupValue(field, complexField[1]);
			} else
				// Если комплексное значение и объект
			if (this.columns.isObject(field)) {
				if (complexField[1] === 'changed')
					value = true;
			}
		}

		// Проходим по истории и добавляем, если необходимо, внешние ключи
		if (!value && complexField.length == 1) {
			const reverseHistory = this.tHistory.slice(0, this.tHistory.length - 1);
			$.each(reverseHistory.reverse(), function (index, item) {
				if (item.extField !== undefined && field == item.extField && item.extId !== undefined) {
					value = item.extId;
				}
			});
		}

		return this.prepareValue(value, field, toDB);
	}

	async getLookupValue(field, param) {
		// Promise version
		try {
			const data = await this.columns.columns[field].editor.getDataSource().store().byKey(this.tableData[field]);
			return data[param];
		} catch (error) {
			return null;
		}
	}

	prepareValue(value, field, toDB) {
		if (value !== null && value !== undefined && this.columns.columns[field]) {
			switch (this.columns.columns[field].dataType) {
				case 'boolean':
					value = value ? 1 : 0;
					break;
				case 'time':
				case 'datetime':
					value = toDB ? app.convertFromDateTime(value) : app.getJsDate(value, false, this.columns.columns[field]);
					value = "\'" + value + "\'";
					break;
				case 'date':
					value = toDB ? app.convertFromDateTime(value) : app.getJsDate(value, false, this.columns.columns[field]);
					value = "\'" + value.slice(0, 10) + "\'";
					break;
				default:
					value = $.isNumeric(value) ? parseFloat(value) : "\'" + value + "\'";
			}
		}
		return value;
	}

	async loadLookupData(column) {
		let params = {};
		if (column.hasOwnProperty('dataConditions') && this.tableInfo)
			params = await this.getParams(column.dataConditions);
		app.addConfigParams(params);

		params = {'id': column.id, 'params': params, 'selParams': this.selParams};
		const jpParams = JSON.stringify(params);

		// Не загружаем данные у лукапа и тэгбокса, если параметры не изменились /* или это первая загрузка и есть комплексная зависимость от другого выпадающего списка*/
		if ((column.dataType == 'lookup' || column.dataType == 'tagbox') && ((column.dataParams && column.dataParams == jpParams && column.editor)/* || (!column.dataParams && cols && cols.length > 0)*/)) {
			return column.editor.getDataSource().items();
		} else {
			if (column.editor && column.editor.NAME !== 'dxButtonGroup')
				column.editor.getDataSource().store().clearRawDataCache();
			column.dataParams = jpParams;
			return app.processData('form/getlookup', 'post', params);
		}
	}

	lookupAfterLoad(column) {
		//if (column.dataType !== 'lookup' || !column.loadPromise) return;
		if (column.loadIndicator && column.dropDownButton) {
			column.dropDownButton.show();
			column.loadIndicator.option("visible", false);
		}
	}

	initLookupDataSource(column, form, deps) {
		const self = this;
		let ds = {/*new DevExpress.data.DataSource({*/
			paginate: false,
			store: new DevExpress.data.CustomStore({
				key: "id",
				loadMode: "raw",
				load: function (loadOptions) {
					if (column.toCache && app.colCaches[column.id]) {
						return app.colCaches[column.id];
					} else {
						/*let data = form ? form.option('formData') : self.dataSource.items();*/
						if (column.loadIndicator && column.dropDownButton) {
							column.dropDownButton.hide();
							column.loadIndicator.option("visible", true);
						}
						let result = self.loadLookupData(column);
						column.loadPromise = result;
						result.then(() => {
							if (column.toCache && !app.colCaches[column.id]) {
								app.colCaches[column.id] = result;
							}
							self.lookupAfterLoad(column);
						});
						return result;
					}
				},
			})
		};
		//});
		return ds;
	}

	lockObject(lock = false) {
		try {
			this.object.option('disabled', lock);
		} catch (e) {

		}
	}

	async deleteRowById(keys) {
		this.progressBar.init(keys.length);
		for (let i = 0; i < keys.length; i++) {
			try {
				await this.dataSource.store().remove(keys[i]);
				this.progressBar.step();
			} catch (e) {
				this.progressBar.remove();
				this.lockObject();
				await app.dialog.showError(this.idn, e.message);
				break;
			}
		}
	}

	//функция для определения выбранного родителя в дереве
	getCheckParent(items, id) {
		const currParent = items[id].parent_id;
		let parentIndex = false;
		if ((currParent == undefined) || (currParent == null)) {
			return items[id];
		} else {
			$.each(items, function (index, item) {
				if (item.id == currParent) {
					parentIndex = index;
				}
			});
		}
		if (parentIndex !== false) {
			if (items[parentIndex].selected == true) {
				if (items[parentIndex].parent_id !== null) {
					return this.getCheckParent(items, parentIndex);
				} else {
					return items[parentIndex];
				}
			} else {
				return items[id];
			}
		}
	}

	dblClick() {
		let prevClickTime = this.lastClickTime;

		this.lastClickTime = new Date();
		if (prevClickTime && (this.lastClickTime - prevClickTime < 300)) {
			//Double click code
			this.processDblClick();
		}
	}

	destroy() {
		this.tHistory = null;
		this.object = null;
		this.params = null;
		this.tableData = null;
		this.selParams = null;
		this.dataSource = null;
		if (this.toolbar)
			this.toolbar.destroy();
		if (this.filter)
			this.filter.destroy();
		if (this.progressBar)
			this.progressBar.destroy();
		if (this.columns)
			this.columns.destroy();
		this.toolbar = null;
		this.filter = null;
		this.progressBar = null;
	}

	passParamsValues(tableData, params) {
		const self = this;
		params = params ? params : this.params;
		$.each(params, function (index, item) {
			if (tableData.hasOwnProperty(index)) {
				if (self.columns.columns[index].dataType == 'lookup')
					tableData[index] = parseInt(item, 10);
				else
					tableData[index] = item;
			}
		});
	}

	passHistoryValues(tableData) {
		let reverseHistory = this.tHistory.slice(0, this.tHistory.length);
		$.each(reverseHistory.reverse(), function (index, item) {
			if (item.extField !== undefined && tableData.hasOwnProperty(item.extField) && item.extId !== undefined && tableData[item.extField] == null) {
				tableData[item.extField] = item.extId;
			}
		});
	}

	passParamsToSelParams() {
		const self = this;
		$.each(this.params, function (index, item) {
			if (self.selParams.hasOwnProperty(':' + index)) {
				self.selParams[':' + index] = item;
			}
		});
	}

	async setParams(params) {
		Object.assign(this.params, params);
		await this.refresh();
	}

	changed() {

	}

	hasUncommitedData() {
		return false;
	}

}
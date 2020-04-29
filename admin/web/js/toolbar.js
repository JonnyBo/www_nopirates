class Toolbar {

	constructor(object) {
		this.currentFilter = [];
		this.table = object.table;
		this.ext_id = object.ext_id;
		this.view = object.view;
		this.type = object.type;
		this.mode = object.mode;
		this.tHistory = object.tHistory;
		this.items = [];
		this.mylsObject = object;
	}

	createObject() {
		$("#" + this.mylsObject.idn).prepend('<div class="dx-datagrid-header-panel"></div>');
		$("#" + this.mylsObject.idn + " .dx-datagrid-header-panel").append('<div role="toolbar"></div>');
		//initToolbar(undefined, items, tableInfo, table, ext_id, 'cards', tHistory, columns);
		this.object = $("#" + this.mylsObject.idn + " [role=toolbar]").dxToolbar({
			items: this.items,
		}).dxToolbar("instance");
		$(document.body).on('click', '#' + this.mylsObject.idn + ' .dx-datagrid-filter-panel-left', function () {
			$('#' + this.mylsObject.idn + '_popupContainer').dxPopup("show");
		});
	}

	//инициализация тулбара
	async init(e) {
		this.isEdit = false;
		this.currentFilter = [];

		if (e /*this.type == 'grid' || this.type == 'tree'*/) {
			const obj = e.component;
			this.isEdit = obj.option('editing').mode == 'batch';
			obj.option('editing').useIcons = true;
			this.items = e.toolbarOptions.items;
			this.object = e;
			this.getOptions();
		} else {
			this.createObject();
			this.object.option('items', this.getOptions());
		}

		this.editMode();
	}

	createAddButton() {
		if (this.mylsObject.tableInfo.a == 1 && !this.toolbarButtonExists("buttonAdd")) {
			this.items.push({
				widget: "dxButton",
				name: 'buttonAdd',
				locateInMenu: 'auto',
				options: this.getAddBtnOptions(),
				location: "before"
			});
		}
	}

	createEditButton() {
		if (this.mylsObject.tableInfo.e == 1 && !this.toolbarButtonExists("buttonEdit") /*&& this.type !== 'scheduler'*/) {
			this.items.push({
				widget: "dxButton",
				name: 'buttonEdit',
				locateInMenu: 'auto',
				//disabled: true,
				options: this.getEditBtnOptions(),
				location: "before"
			});
		}
	}

	createDeleteButton() {
		if (this.mylsObject.tableInfo.d == 1/* && this.type !== 'scheduler'*/) {
			this.items.push({
				widget: "dxButton",
				name: 'buttonDelete',
				locateInMenu: 'auto',
				//disabled: true,
				options: this.getDeleteBtnOptions(),
				location: "before"
			});
		}
	}

	createRefreshButton() {
		this.items.push({
			widget: "dxButton",
			name: 'buttonRefresh',
			locateInMenu: 'auto',
			options: this.getRefreshBtnOptions(),
			location: "before"
		});
	}

	createImportButton() {
		if (this.mylsObject.tableInfo.a == 1 && this.mylsObject.tableInfo.import !== undefined) {
			this.items.push({
				widget: "dxButton",
				name: 'buttonImport',
				locateInMenu: 'auto',
				options: this.getImportBtnOptions(),
				location: "before"
			});
		}
	}

	createFilterButton() {
		this.items.push({
			widget: "dxButton",
			name: 'buttonSearch',
			locateInMenu: 'auto',
			options: this.getFilterBtnOptions(),
			location: "before"
		});
	}

	createAdminButton() {
		if (this.type == 'grid' || this.type == 'tree') {
			this.items.push({
				widget: "dxButton",
				name: 'buttonAdmin',
				locateInMenu: 'auto',
				options: this.getAdminBtnOptions(),
				location: "before"
			});
		}
	}

	createFilterFields() {
		const self = this;
		let filterColumns = this.mylsObject.columns.getColumnsByColumnType('filter', false);
		let isLoadSelectBoxData = [];
		if (filterColumns.length > 0) {
			$.each(filterColumns, function (i, item) {
				isLoadSelectBoxData[item.dataField] = false;
				self.items.push({
					widget: "dxSelectBox",
					name: 'tableFilter',
					locateInMenu: 'auto',
					options: self.getFilterFieldsOptions(item, isLoadSelectBoxData),
					location: "center"
				});
			});
		}
	}

	createDateFilter() {
		let curDate = new Date();
		let date30 = new Date();
		date30.setDate(date30.getDate() - 30);
		if (this.mylsObject.tableInfo.selParams && app.findInArray('table_date', this.mylsObject.tableInfo.selParams) !== -1) {
			this.items.push(this.getStartDateBox());
		}
		if (this.mylsObject.tableInfo.selParams && app.findInArray('end_date', this.mylsObject.tableInfo.selParams) !== -1 && app.findInArray('table_date', this.mylsObject.tableInfo.selParams) !== -1) {
			this.items.push({
				text: " − ",
				location: "center"
			});
		}
		if (this.mylsObject.tableInfo.selParams && app.findInArray('end_date', this.mylsObject.tableInfo.selParams) !== -1) {
			this.items.push(this.getEndDateBox());
		}
	}

	getStartDateBox() {
		const self = this;
		let curDate = new Date();
		let date30 = new Date();
		date30.setDate(date30.getDate() - 30);
		return {
			widget: "dxDateBox",
			name: 'tableDate',
			locateInMenu: 'auto',
			options: {
				showClearButton: true,
				width: 125,
				value: app.findInArray('end_date', this.mylsObject.tableInfo.selParams) !== -1 ? date30 : curDate,
				onValueChanged: function (e) {
					self.dateValueChanged(':table_date', e);
				}
			},
			location: "center"
		}
	}

	getEndDateBox() {
		let curDate = new Date();
		const self = this;
		return {
			widget: "dxDateBox",
			name: 'tableDate',
			locateInMenu: 'auto',
			options: {
				width: 125,
				value: curDate,
				showClearButton: true,
				onValueChanged: function (e) {
					self.dateValueChanged(':end_date', e);
				}
			},
			location: "center"
		}
	}

	getOptions() {
		// кнопка Добавить
		this.createAddButton();
		// кнопка Редактировать
		this.createEditButton();
		// кнопка Удалить
		this.createDeleteButton();
		// кнопка Обновить
		this.createRefreshButton();
		//кнопка Импорт
		this.createImportButton();
		//кнопка Фильтр
		this.createFilterButton();
		//кнопка Админского сохранения
		this.createAdminButton();//----------------------------------------- Временно прикрыл, чтобы никто не нажал
		//поля быстрой фильтрации
		this.createFilterFields();
		//фильтр по дате
		this.createDateFilter();
		return this.items;
	}

	toolbarButtonExists(name) {
		return this.items.find((item) => {
			return item.name == name;
		}) !== undefined;
	}

	requiredField(item) {
		let isRequired = false;
		if ($.isArray(item.columnType)) {
			$.each(item.columnType, function (i, el) {
				if ($.type(el) == 'object') {
					if ('filter' in el) {
						if ($.inArray('required', el.filter) != -1) {
							isRequired = true;
							return false;
						}
					}
				}
			});
		}
		return isRequired;
	}

	async selectValueChanged(e, field) {
		let tableData = this.mylsObject.dataSource;
		let filter = [];
		if (e.component.option('value') !== null) {
			this.currentFilter[field] = [[field, 'like', e.component.option('value') + '%,'], 'or', [field, 'like', ', %' + e.component.option('value')], 'or', [field, 'containing', ', ' + e.component.option('value') + ','], 'or', [field, '=', e.component.option('value')]];
		} else {
			delete this.currentFilter[field];
		}
		let out = [];
		for (let prop in this.currentFilter) {
			if (out.length > 0 && this.currentFilter[prop].length > 0) {
				out.push('and');
			}
			//console.log(prop);
			if (this.currentFilter[prop].length > 0)
				out.push(this.currentFilter[prop]);
		}
		filter.push(out);

		if (filter[0].length == 0) {
			filter = null;
		}
		tableData.mylsFilter = filter;
		//console.log(filter);
		this.mylsObject.refresh();
	}

	dateValueChanged(dateParam, e) {
		//let obj = getCurrentObj(e, type);
		if (this.mylsObject && this.mylsObject.dataSource) {
			let ds = this.mylsObject.dataSource;
			if (!ds.selParams)
				ds.selParams = {};
			if (e.value)
				ds.selParams[dateParam] = app.convertFromDateTime(e.value).slice(0, 10);
			else
				ds.selParams[dateParam] = null;
			this.mylsObject.refresh(false);
		}
	}

	editMode() {
		const self = this;
		const obj = this.mylsObject.object;
		if (!obj || !Object.keys(obj).length) return;

		function showEditButtons(mode) {
			if (self.mylsObject.type === 'grid') {
				self.mylsObject.object.option('editing').allowUpdating = mode === 'batch' && self.mylsObject.tableInfo.e === 1;
				self.mylsObject.object.option('editing').allowAdding = mode === 'batch' && self.mylsObject.tableInfo.a === 1;
				self.mylsObject.object.option('editing').allowDeleting = mode === 'batch' && self.mylsObject.tableInfo.d === 1;
			}
		}

		function exitFromEditing() {
			obj.beginUpdate();
			obj.option('editing', {
				mode: 'row'
			});
			obj.option("focusedRowEnabled", true);
			self.isEdit = false;
			self.mylsObject.mode = 'sel';
			showEditButtons('row');
			obj.endUpdate();
		}

		function getExitBtnOptions() {
			return {
				icon: "/img/exit.svg",
				elementAttr: {
					toolbarrole: "always",
					buttonrole: "exit",
				},
				onClick: function (e) {
					e.event.stopPropagation();
					exitFromEditing();
				}
			};
		}

		function createExitButton () {
			if (!self.toolbarButtonExists("exit")) {
				self.items.push({
					widget: "dxButton",
					name: 'buttonExit',
					locateInMenu: 'auto',
					//disabled: true,
					options: getExitBtnOptions(),
					location: "before"
				});
			}
		}

		if (this.mylsObject.type === 'grid') {
			let isEdit = obj.option('editing').mode == 'batch';

			if (isEdit) {
				createExitButton();
			}

			$.each(this.items, function (index, item) {
				if (item.name == 'saveButton' || item.name == 'revertButton') {
					item.location = 'before';
					item.sortIndex = 20;
					item.visible = isEdit;
					if (isEdit && item.hasNewOnClick === undefined) {
						item.hasNewOnClick = true;
						if (item.name == 'saveButton') {
							item.options.onClick = function (e) {
								obj.canFinishEdit = true;
								obj.saveEditData().done(function () {
									if (obj.canFinishEdit) {
										exitFromEditing();
									}
								});
							};
						}
						if (item.name == 'revertButton') {
							item.options.onClick = async function (e) {
								if (await app.dialog.confirm(self.mylsObject.idn, app.translate.saveString('Отменить все изменения?'), app.translate.saveString('Подтверждение'))) {
									obj.cancelEditData();
									exitFromEditing();
								}
							};
						}
					}
				}
				if (item.name == 'revertButton') {
					item.options.disabled = false;
				}
				if (item.name == 'addRowButton') {
					item.visible = false;
				}
				if (item.name == 'buttonEdit' || item.name == 'buttonDelete' || item.name == 'buttonRefresh') {
					item.visible = !isEdit;
					item.sortIndex = index;
				}
			});
		}
	}

	getAddBtnOptions() {
		const self = this;
		return {
			icon: "/img/insert.svg",
			elementAttr: {
				toolbarrole: "always",
				buttonrole: "add",
			},
			onClick: function (e) {
				e.event.stopPropagation();
				self.mylsObject.processInsert();
			}
		};
	}

	getEditBtnOptions(disable = true) {
		const self = this;
		return {
			elementAttr: {
				toolbarrole: "focused",
				buttonrole: "edit",
			},
			icon: "/img/edit.svg",
			visible: !this.isEdit,
			disabled: disable,
			onClick: function (e) {
				e.event.stopPropagation();
				self.mylsObject.processDblClick();
			}
		};
	}

	getDeleteBtnOptions(disable = true) {
		const self = this;
		return {
			elementAttr: {
				toolbarrole: "focused",
				buttonrole: "delete",
			},
			visible: !this.isEdit,
			icon: "/img/delete.svg",
			disabled: disable,
			onClick: async function (e) {
				//проверка отмеченных строк
				e.event.stopPropagation();
				let id = self.mylsObject.getCurrentId();
				let keys = self.mylsObject.getSelectedRows();
				// Кнопка по-умолчанию для диалога для любой ситуации
				let params = self.getDeleteOptions(id, keys);
				let dialogResult = await app.dialog.custom(app.translate.saveString("Вы действительно хотите удалить запись(и)?"), app.translate.saveString('Удаление'), params, 'myls-msg-error');
				if (dialogResult === 1) {
					keys = [id];
				}
				// Если не отмена, то вызываем функцию удаления
				if (dialogResult !== 0) {
					await self.mylsObject.deleteRowById(keys);
				}
			}
		};
	}

	getDeleteOptions(id, keys) {
		let params = [
			{
				text: "Удалить текущую",
				type: 'danger',
				tabIndex: 1,
				result: 1
			}];
		//текущая не совпадает с выделенной или несколько выделенных
		// Добавляем кнопку выбора выделенных строк
		if ((keys.length == 1 && id != keys[0]) || keys.length > 1) {
			params.push({
				text: app.translate.saveString("Удалить отмеченные"),
				type: 'danger',
				tabIndex: 2,
				stylingMode: 'outlined',
				result: 2
			});
		}
		// Добавляем кнопку отмены
		params.push({
			text: app.translate.saveString("Отменить"),
			type: 'default',
			stylingMode: 'outlined',
			tabIndex: 0,
			result: 0
		});
		return params;
	}

	getRefreshBtnOptions() {
		const self = this;
		return {
			elementAttr: {
				toolbarrole: "always",
				buttonrole: "refresh",
			},
			icon: "/img/refresh.svg",
			visible: !self.isEdit,
			onClick: function (e) {
				self.mylsObject.refresh();
			}
		};
	}

	getImportBtnOptions() {
		const self = this;
		return {
			elementAttr: {
				toolbarrole: "always",
				buttonrole: "import",
			},
			text: "Import",
			visible: !this.isEdit,
			onClick: function (e) {
				//открываем попап с полем ввода файла
				self.createImportPopup();

			}
		};
	}

	createImportPopup() {
		if (this.type == 'grid') {
			$("#" + this.mylsObject.idn).append('<div id="' + this.mylsObject.idn + '_popupContainer"></div>');
			$("#" + this.mylsObject.idn + '_popupContainer').append('<div id="' + this.mylsObject.idn + '_fileUploader"></div>');//добавляем fileupload
			if (this.mylsObject.tableInfo.import !== undefined) {
				$("#" + this.mylsObject.idn + '_popupContainer').append('<div id="' + this.mylsObject.idn + '_list"></div>');
				$("#" + this.mylsObject.idn + "_list").dxDataGrid({
					dataSource: this.mylsObject.tableInfo.import,
				});
			}
			$("#" + this.mylsObject.idn + '_popupContainer').append('<div id="' + this.mylsObject.idn + '_error"></div>');//добавляем поле длля ошибок
			this.importFilename = '';
			$('#' + this.mylsObject.idn + '_fileUploader').dxFileUploader(this.getImportFileUploadOptions()).dxFileUploader("instance");

			let popup = $('#' + this.mylsObject.idn + '_popupContainer').dxPopup({
				title: "Popup Title",
				toolbarItems: [{
					location: "after"
				},
					this.getPopupButtonOK(),
					this.getPopupButtonCancel(),
				],
			});
			popup.dxPopup("instance").show();
		}
	}

	getPopupButtonCancel() {
		return {
			widget: "dxButton",
			toolbar: "bottom",
			location: "after",
			options: {
				text: app.translate.saveString("Отмена"),
				onClick: function (e) {
					$('#' + this.mylsObject.idn + '_popupContainer').dxPopup("instance").hide();
				}
			}
		};
	}

	getPopupButtonOK() {
		const self = this;
		return {
			widget: "dxButton",
			toolbar: "bottom",
			location: "after",
			options: {
				text: app.translate.saveString("Ok"),
				onClick: function (e) {
					//импортируем
					self.fileImport();
				}
			}
		};
	}

	fileImport() {
		const self = this;
		if (this.filename !== '') {
			$.ajax({
				type: "POST",
				cache: false,
				url: "/frame/importfromfiles",
				data: {files: self.filename, table_id: self.table},
				success: function (data) {
					let res = $.parseJSON(data);
					if (res.type == 'error') {
						$('#' + self.mylsObject.idn + '_error').html(res.data);
					}
					if (res.type == 'success') {
						$('#' + self.mylsObject.idn + '_error').html(res.data);
					}
					//обновляем таблицу
					self.mylsObject.refresh(false);
				}
			});
		} else {
			//нет файлов
			$('#' + self.mylsObject.idn + '_error').text(app.translate.saveString('Нет файлов для импорта'));
		}
	}

	getImportFileUploadOptions() {
		const self = this;
		return {
			multiple: false,
			allowedFileExtensions: [".csv", ".xls", ".xlsx"],
			uploadMode: "instantly",
			uploadUrl: "/frame/uploadfile?field=" + this.mylsObject.idn + '_fileUploader',
			name: this.mylsObject.idn + '_fileUploader',
			minFileSize: 10,
			onUploaded: function (e) {
				let res = $.parseJSON(e.request.response);
				if (res == 'error') {
					$('#' + self.mylsObject.idn + '_error').html('<p class="error_str">' + saveString('Ошибка! Файл не загружен!') + '</p>');
				} else {
					self.filename = res;
					$('#' + self.mylsObject.idn + '_error').text('');
				}
			},
		}
	}

	getFilterBtnOptions() {
		const self = this;
		return {
			elementAttr: {
				toolbarrole: "always",
				buttonrole: "search",
			},
			icon: "filter",
			onClick: function (e) {
				self.mylsObject.filter.init(e);
			}
		};
	}

	getAdminBtnOptions() {
		return {
			elementAttr: {
				toolbarrole: "always",
				buttonrole: "admin",
			},
			icon: "preferences",
			onClick: function (e) {
				let state = this.mylsObject.state();
				app.prepareStorage(state);
				$.ajax({
					url: "/frame/tablesetting",
					method: 'post',
					data: {'table': this.table, 'state': JSON.stringify(state)},
					success: function (data) {
						console.log('ok');
					},
					fail: function (error) {
						console.log(error);
					}
				});
			}
		};
	}

	getFilterFieldsOptions(item, isLoadSelectBoxData) {
		const self = this;
		return {
			dataSource: [],
			displayExpr: item.dataField,
			valueExpr: item.dataField,
			searchEnabled: true,
			showSelectionControls: false,
			placeholder: item.caption,
			showClearButton: false,
			buttons: ["clear", "dropDown"],
			onInitialized: async function (e) {
				await self.filterFieldsInitialized(isLoadSelectBoxData, item, e);
			},
			onValueChanged: function (e) {
				self.filterFieldsValueChanged(item, e);
			}
		};
	}

	filterFieldsValueChanged(item, e) {
		if (this.requiredField(item)) {
			let selItems = e.component.option('items');
			if (selItems.length > 0) {
				if (e.component.option('value') == null) {
					e.component.option('value', selItems[0][item.dataField]);
				}
			}
		}
		this.selectValueChanged(e, item.dataField);
	}

	async filterFieldsInitialized(isLoadSelectBoxData, item, e) {
		if (isLoadSelectBoxData[item.dataField] === false) {
			/*
            let objIdn = getIdn(table, ext_id, type, view);
            console.log(objIdn);
            let obj;
            let objDataSource;
            if (type == 'grid' || type == 'tree') {
                obj = getCurrentObj(toolbar, type);
                objDataSource = obj.getDataSource();
            } else {
                obj = objects[objIdn].object;
                objDataSource = objects[objIdn].dataSource;
            }
            console.log(objects);

            //console.log(objDataSource.selParams);

             */
			let itemData = await app.processData('frame/get-filter-string-data', 'post', {
				table: this.table,
				field: item.dataField,
				extId: this.ext_id,
				selParams: this.mylsObject.dataSource.selParams
			});
			isLoadSelectBoxData[item.dataField] = true;
			app.removeNullFromArray(itemData);
			itemData = app.removeEmptyFromArray(itemData);

			this.mylsObject.object.beginUpdate();
			e.component.option('dataSource', itemData);
			if (this.requiredField(item)) {
				await this.mylsObject.dataSource.load();
				if (itemData.length > 0) {
					if (e.component.option('value') == null) {
						e.component.option('value', itemData[0][item.dataField]);
					}
					e.component.option('value', itemData[0][item.dataField]);
				}
				this.mylsObject.object.endUpdate();
			} else {
				e.component.option('showClearButton', true);
				this.mylsObject.object.endUpdate();
			}
		}
	}

	setEnabledToolbar() {
		const curId = this.mylsObject.getCurrentId();
		const focused = curId == 0 || curId === undefined ? false : true;
		const element = this.mylsObject.object.element();
		$.each(element.find('[toolbarrole=always]'), function (index, item) {
			$(item).dxButton("instance").option("disabled", false);
		});
		$.each(element.find('[toolbarrole=focused]'), function (index, item) {
			$(item).dxButton("instance").option("disabled", !focused);
		});
	}

	destroy() {
		this.mylsObject = null;
		this.object = null;
		app.destroyArray(this.items);
	}

}
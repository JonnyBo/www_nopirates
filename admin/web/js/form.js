class Form extends MylsEditableObject {

	constructor(table, ext_id, view, mode, tHistory, viewMode, params) {
		super(table, ext_id, view, mode, tHistory, viewMode, params);
		this.type = 'form';
		this.popup = null;
		this.customFormObjects = ['tagbox', 'treeview', 'image', 'colorbox', 'buttongroup', 'html', 'file'];

		this.objectValues = {};
		this.initialMode = this.mode;
		// Список форм
		this.forms = [];
		this.arrObjects = [];
		this.objectValues = {};
		this.tableData = {'0': []};

		// Кнопка сохранения
		this.saveBtn = {};
		this.saveAddBtn = {};
		this.cancelBtn = {};
		this.saveAndAdd = false;

		this.rawMode = this.mode;
		if (this.mode === 'updins')
			this.mode = 'upd';

		this.tData;
		this.idn = app.getIdn(this.type, this.table, this.ext_id, this.view);
	}

	async init() {
		console.time(this.idn);
		this.initData();
		this.dependencies = new Dependencies(this);
		this.selParams = this.getSelParams();
		this.dataSource = this.createDataSource();
		this.loadPromise = this.getData();
		await Promise.all([this.loadPromise, this.setPopup(), this.createForm()]);
		this.dependencies = new Dependencies(this);
		this.dependencies.init(this, this.tableData);
		this.afterLoad();
		await Promise.all([this.setPopupTitle(), this.setDataToForm(), this.showFormButtons()]);
		console.timeEnd(this.idn);
		$("#" + this.idn).data('mylsObject', this);
	}

	async getData() {
		const self = this;
		return new Promise(async (resolve, reject) => {
			try {
				if (this.mode != 'setup') {
					this.tData = app.processData('form/tabledata', 'post', this.prepareTableData());
				} else this.tData = {'0': []};
				this.tableData = await this.tData;
				if (this.mode == 'ins') {
					this.ext_id = this.tableData['ext_id'];
					this.updatedExtId[this.ext_id] = this.tableData['ext_id'];
					this.updatedExtField[this.ext_id] = this.tableData['ext_field'];
				} else {
					if (this.ext_id === undefined || this.ext_id === null) this.ext_id = this.tableData[0]['id'];
					this.updatedExtId[this.ext_id] = this.ext_id;
					this.updatedExtField[this.ext_id] = this.tableData['ext_field'];
				}
				this.tableData = this.tableData[0];
				resolve();
			} catch (error) {
				reject();
			}
			//Promise.resolve();
		});

	}

	async setPopup() {
		if (this.popup) {
			if (this.template[0].width) {
				this.popup.object.option("width", this.template[0].width);
			}
			if (this.template[0].height) {
				this.popup.object.option("height", this.template[0].height);
			}
			if (this.tableInfo.name) {
				let title = app.translate.saveString(this.tableInfo.name);
				this.popup.changeTitle(title);
			}

			let infoBtn = $("#" + this.idn + "_info-button").dxButton({
				onClick: function (e) {
					window.open(e.component.linkOut);
				}
			}).dxButton('instance');
			if (!this.tableInfo.description) {
				infoBtn.option("visible", false);
			} else {
				infoBtn.linkOut = this.tableInfo.description;
			}
		}
	}

	async afterLoad() {
		const self = this;
		//debugger;
		// Переводим все поля типа time и datetime в формат yyyy-MM-ddTHH:mm:ssZ
		this.columns.convertDateTimeColumns(this.tableData);
		this.rawData = this.columns.getTableDataByColumns(this.tableData);

		if (this.mode == 'ins') {
			// Заменяем -1 в истории на текущее значение ext_id при загрузке данных
			if (this.tHistory.length && this.updatedExtField[this.ext_id] == this.tHistory[this.tHistory.length - 1].extField) {
				this.tHistory[this.tHistory.length - 1].extId = this.updatedExtId[this.ext_id];
			}

			// Проходим по истории и добавляем, если необходимо, внешние ключи
			this.passHistoryValues(this.tableData);
			this.columns.setDefaultValues(this.tableData);
			// Проставляем значения, пришедшие в параметрах
			this.passParamsValues(this.tableData);
		}
		// Записываем все значения в столбцы
		if (!this.saveAndAdd)
			this.columns.setDataToColumns(this.tableData);
		await this.openFormDependencies();
		this.firstData = app.cloneObject(this.tableData);
	}

	async setPopupTitle() {
		if (this.popup) {
			// Заголовок формы
			if (this.tableInfo.titleField && this.tableData[this.tableInfo.titleField]) {
				let title = this.popup.object.option("title");
				title += ' ' + this.tableData[this.tableInfo.titleField];
				this.popup.changeTitle(title);
			}
			//addBottomTab(this.popup);
		}
	}

	async createForm() {
		const self = this;
		if (this.template[0].formtype == 'tabs') {
			// Подготавливаем табы и контейнеры
			let tabs = [];
			$.each(this.template[0].items, function (index, value) {
				tabs.push({
					'title': app.translate.saveString(value.title),
					'html': '<div id="' + self.idn + '-tab_' + index + '" class="myls-form-container"></div>'
				});
			});

			// Формируем табы
			this.tabPanel = $("#" + this.idn).dxTabPanel({
				items: tabs,
				selectedIndex: 0,
				repaintChangesOnly: true,
				showNavButtons: true,
				onTitleClick: function (e) {
					// Формируем содержимое таба только тогда, когда на него кликнули (исключая формы, их генерируем сразу)
					const itemIndex = e.component.option('selectedIndex');
					const tabId = self.idn + '-tab_' + itemIndex;
					if ($('#' + tabId).children().length === 0)
						self.processTab(self.template[0].items[itemIndex], tabId, self.template[0].items[itemIndex].tabcontent, itemIndex);
				}
			}).dxTabPanel('instance');
			// Заполняем только первый таб, остальые сделаются по нажатию
			//Заполняем табы
			$.each(self.template[0].items, function (index, value) {
				self.tabPanel.option('selectedIndex', index);
				const tabId = self.idn + '-tab_' + index;
				// Генерируем только формы и первый таб, все табы, заполненные объектами, генерируем только при нажатии на соответтвующий таб
				if (value.tabcontent == 'form' || index === 0)
					self.processTab(value, tabId, value.tabcontent, index);
			});
			this.tabPanel.option('selectedIndex', 0);
		} else {
			this.processTab(self.template[0], this.idn, 'form', null);
		}
	}

	async processTab(form, tabId, tabcontent, tabIndex) {
		const self = this;
		if (tabcontent == 'object') {
			const column = this.columns.columns[form.items[0].dataField];
			let idx = app.getIdn(form.items[0].objectType, column.tableId, this.tableData[column.extField], 'popup');
			//ищем на странице объект с таким же idx и если есть - меняем idx
			if ($("#" + tabId).is("#" + idx)) {
				let i = 0;
				while (i < 10) {
					if (!$("#" + tabId).is("#" + idx + i)) {
						idx = idx + i;
						break;
					}
					i++;
				}
			}

			$("#" + tabId).append(app.getObjectContainer(idx));
			let obj = app.getObject(column.tableId, this.tableData[column.extField], "popup", form.items[0].objectType, 'sel', app.addHistory(column.extTargetField ? column.extTargetField : column.extField, this.tableData[column.extField], this.idn, this.tHistory, this.initialMode), 'compact', []);
			this.initExternalObject(obj, column, tabIndex);
		}

		if (tabcontent == 'form') {

			// debugger
			$("#" + tabId).append('<div id="' + tabId + '-scroll"></div>');
			$("#" + tabId + '-scroll').append('<div id="' + tabId + '-scroll_content"></div>');
			//var saveBtn = $("#" + idn + "_save-button").dxButton('instance');
			let addForm = $("#" + tabId + '-scroll_content').dxForm({
				items: [],
				//formData: this.tableData,
				readOnly: false,
				showColonAfterLabel: true,
				labelLocation: "top",
				colCount: 1,
				showValidationSummary: true
			}).dxForm("instance");
			addForm.mylsInit = true;
			addForm.mylsTab = tabIndex;
			// Обрабатываем предварительно форматы и шаблоны
			//addForm.beginUpdate();
			if (form.items !== undefined) {
				this.processFormItemsFormats(form.items, "", addForm);
				this.processFormItemsTemplates(form.items, tabId, addForm, tabIndex);
			}
			addForm.option("items", form.items);

			$("#" + tabId + '-scroll_content .myls-all-space-height').closest('.dx-box-item').addClass('myls-flex-grow-1');
			$("#" + tabId + '-scroll_content .dx-field-item.h-100').closest('.dx-item.dx-box-item').addClass("h-100");
			//addForm.endUpdate();

			this.forms.push(addForm);

			const scrollViewWidget = $("#" + tabId + '-scroll').dxScrollView({
				scrollByContent: true,
				scrollByThumb: true,
				showScrollbar: "always",
			}).dxScrollView("instance");
		}

	}

	initExternalObject(obj, column, tabIndex) {
		const self = this;
		obj.changed = () => {
			self.fieldChanged(column);
		};
		obj.init();
		obj.formTabIndex = tabIndex;
		this.arrObjects.push(obj);
	}

	async processFormItemsTemplates(form, tabId, formObj, tabIndex) {
		const self = this;
		$.each(form, function (key, item) {
			if (item.hasOwnProperty("label") && item.label.hasOwnProperty("text") && item.label.text == '')
				item.label.visible = false;

			if (item.hasOwnProperty("objectType")) {
				if (app.objectTypes.indexOf(item.objectType) != -1) {
					item.template = function (itemData, itemElement) {
						self.createObjectTemplate(itemData, item, itemElement, tabIndex);
					};
				}
				if (item.objectType == 'image') {
					item.template = function (itemData, itemElement) {
						self.createFileTemplate(itemData, itemElement, tabId, item, "image");
					};
				}
				if (item.objectType == 'file') {
					item.template = function (itemData, itemElement) {
						self.createFileTemplate(itemData, itemElement, tabId, item, "file");
					};
				}
				if (item.objectType == 'treeview') {
					item.template = function (itemData, itemElement) {
						const column = self.columns.columns[itemData.dataField];
						if (column !== undefined) {
							const idnf = tabId + '_' + itemData.dataField + '_treeview';
							itemElement.append('<div id="' + idnf + '" class="myls-treeView"></div>');

							self.initTreeView(idnf, column);
						}
					};
				}
				if (item.objectType == 'colorbox') {
					item.template = function (itemData, itemElement) {
						self.createColorBoxTemplate(itemData, tabId, itemElement);
					};
				}
				if (item.objectType == 'tagbox') {
					item.template = function (itemData, itemElement) {
						const column = self.columns.columns[itemData.dataField];
						if (column !== undefined) {
							const idnf = tabId + '_' + itemData.dataField + '_tagbox';
							itemElement.append('<div id="' + idnf + '" class="tagBox"></div>');
							self.initTagBox(idnf, column, item, formObj);
						}
					};
				}
				if (item.objectType == 'buttongroup') {
					item.template = function (itemData, itemElement) {
						const column = self.columns.columns[itemData.dataField];
						if (column !== undefined) {
							const idnf = tabId + '_' + itemData.dataField + '_buttongroup';
							itemElement.append('<div id="' + idnf + '" class="buttonGroup"></div>');

							self.initButtonGroup(idnf, column, item);
						}
					};
				}
				if (item.objectType == 'label') {
					item.template = function (itemData, itemElement) {
						itemElement.append('<div>' + item.text + '</div>');
					};
				}
				if (item.objectType == 'button') {
					item.template = function (itemData, itemElement) {
						self.initButton(itemElement, null, item);
					};
				}
				if (item.objectType == 'html') {
					item.template = function (itemData, itemElement) {
						const idnf = tabId + '_' + itemData.dataField + '_html';
						const column = self.columns.columns[itemData.dataField];
						itemElement.append('<div id="' + idnf + '" class="myls-html"></div>');
						self.initHtml(idnf, column, item);
					};
				}
			}
			if (item.hasOwnProperty("items"))
				self.processFormItemsTemplates(item.items, tabId, formObj, tabIndex);
			if (item.hasOwnProperty("tabs"))
				self.processFormItemsTemplates(item.tabs, tabId, formObj, tabIndex);
		});
	}

	async createColorBoxTemplate(itemData, tabId, itemElement) {
		const self = this;
		await this.loadPromise;
		const column = this.columns.columns[itemData.dataField];
		if (column !== undefined) {
			column.customEditor = true;
			const idnf = tabId + '_' + itemData.dataField + '_colorbox';
			const value = (this.tableData[column.dataField] == null) ? '' : this.tableData[column.dataField];
			itemElement.append('<input id="' + idnf + '" class="myls-colorbox" type="text" value="' + value + '" />');
			let palette = [];
			for (let i = 20; i <= 90; i += 8) {
				let p = [];
				$.each(['hsl 5 99', 'hsl 21 98', 'hsl 36 98', 'hsl 47 97', 'hsl 60 99', 'hsl 73 67', 'hsl 95 56', 'hsl 197 49', 'hsl 224 99', 'hsl 251 71', 'hsl 286 99', 'hsl 334 81'], function (index, item) {
					p.push(item + ' ' + i);
				});
				palette.push(p);
			}
			column.editor = $('#' + idnf);
			$('#' + idnf).spectrum({
				showPalette: true,
				allowEmpty: true,
				showSelectionPalette: true, // true by default
				maxSelectionSize: 22,
				palette: palette,
				change: function (color) {
					column.changed = true;
					if (color)
						self.tableData[column.dataField] = color.toHexString();
					else
						self.tableData[column.dataField] = null;
					if (self.saveBtn)
						self.saveBtn.option('disabled', false);
				}
			});
		}
	}

	processFormItemsFormats(form, path, formObj) {
		const self = this;
		let curPath = path;
		app.translate.saveTranslateForm(form);
		$.each(form, function (key, it) {
			if (form[key].hasOwnProperty("items") || form[key].hasOwnProperty("tabs")) {
				//debugger
				if (form[key].itemType && form[key].itemType == 'group') {
					form[key].name = app.create_UUID();
					curPath = path + form[key].name + '.';
				}
			} else if (form[key].hasOwnProperty("editorType") || form[key].hasOwnProperty("objectType")) {
				const column = self.columns.columns[form[key].dataField];
				form[key].visible = true;

				if (column) {
					column.visible = true;
					column.form = formObj;
					column.validationRules = JSON.stringify([]);
				}
				if (column && path)
					column.path = path;
				if (form[key].hasOwnProperty("editorType")) {
					form[key].editorOptions.readOnly = !column.allowEditing;

					if (form[key].editorType == 'dxTextBox') {
						//console.log(column);
						if (column.pattern && self.tableData[column.dataField] != '' && self.tableData[column.dataField] != null) {
							if (!form[key].editorOptions.buttons)
								form[key].editorOptions.buttons = [];
							self.addButtons(form[key].editorOptions.buttons, ['clear', self.getButtonLink(column, self.tableData[column.dataField])]);
						}
						form[key].editorOptions.onInitialized = function (e) {
							self.initializeEditor(e, column);
						};
						form[key].editorOptions.onDisposing = function (e) {
							self.disposeEditor(column);
						};
						form[key].editorOptions.onValueChanged = function (e) {
							if (e.value)
								e.component.option('value', e.value.trim());
							self.setPatternButtons(column, e);
						};
					}
					if (form[key].editorType == 'dxNumberBox') {

						form[key].editorOptions.onInitialized = function (e) {
							self.initializeEditor(e, column);
							let buttons = [];
							self.addButtons(buttons, ['clear']);
							e.component.option('buttons', buttons);
						};
						form[key].editorOptions.onDisposing = function (e) {
							self.disposeEditor(column);
						};
						if (column.format.precision !== undefined && column.format.precision != "0") {
							form[key].editorOptions.format = '#,##0';
							form[key].editorOptions.format += '.' + '0'.repeat(column.format.precision);
						}
						if (column.format.precision === undefined || column.format.precision == "0") {
							form[key].editorOptions.format = '#,##0';
						}
						if (column.format.postCaption !== undefined) {
							form[key].editorOptions.format += column.format.postCaption;
						}
					}

					if (form[key].editorType == 'dxRadioGroup') {
						if (column !== undefined) {
							if (column.id !== undefined && column.id !== null) {
								self.initRadioGroup(form[key], column, formObj);
							}
						}
					}
					if (form[key].editorType == 'dxSelectBox') {
						if (column !== undefined) {
							if (column.id !== undefined && column.id !== null) {
								self.initSelectBox(form[key], column, formObj);
							}
						}
					}
					if (form[key].editorType == 'dxLookup') {
						form[key].editorType = 'dxSelectBox';
						if (column !== undefined) {
							if (column.id !== undefined && column.id !== null) {
								self.initLookup(form[key], column, formObj);
							}
						}
					}
					if (form[key].editorType == 'dxTagBox') {
						if (column !== undefined) {
							if (column.id !== undefined && column.id !== null) {
								//initTagBox(form[key], column);
								form[key].name = column.dataField;
							}
						}
					}
					if (form[key].editorType == 'dxDateBox') {
						form[key].editorOptions.onInitialized = function (e) {
							self.initializeEditor(e, column);
						};
						form[key].editorOptions.onDisposing = function (e) {
							self.disposeEditor(column);
						};
					}
					if (form[key].editorType == 'dxDateBox' && form[key].dataType == 'date') {
						form[key].editorOptions.displayFormat = 'dd.MM.y';
						form[key].editorOptions.dateSerializationFormat = 'yyyy-MM-dd';
						form[key].editorOptions.useMaskBehavior = true;
					}
					if (form[key].editorType == 'dxDateBox' && form[key].dataType == 'datetime') {
						form[key].editorOptions.displayFormat = 'dd.MM.y HH:mm';
						form[key].editorOptions.dateSerializationFormat = "yyyy-MM-ddTHH:mm:ssx";
						form[key].editorOptions.useMaskBehavior = true;
						form[key].editorOptions.type = 'datetime';
					}
					if (form[key].editorType == 'dxDateBox' && form[key].dataType == 'time') {
						form[key].editorOptions.displayFormat = 'HH:mm';
						form[key].editorOptions.dateSerializationFormat = "yyyy-MM-ddTHH:mm:ssx";
						form[key].editorOptions.type = 'time';
						form[key].editorOptions.useMaskBehavior = true;
					}
				}
			}
			if (form[key].hasOwnProperty("items")) {
				self.processFormItemsFormats(form[key].items, curPath, formObj);
			}
			if (form[key].hasOwnProperty("tabs")) {
				self.processFormItemsFormats(form[key].tabs, curPath, formObj);
			}
		});
	}

	async createObjectTemplate(itemData, item, itemElement, tabIndex) {
		const self = this;
		const column = this.columns.columns[itemData.dataField];
		if (column !== undefined) {
			this.loadPromise.then(() => {
				const ext_id = self.tableData[column.extField];
				const tableId = column.tableId;
				const idnObject = app.getIdn(item.objectType, tableId, ext_id, 'popup');

				itemElement.append(app.getObjectContainer(idnObject));

				if (item.hasOwnProperty("height")) {
					$('#' + idnObject).css("height", item.height);
				}

				//if (!column.editor) {
				const selParams = {};
				for (let param of app.appInfo.tables[tableId].selParams) {
					if (self.tableData.hasOwnProperty(param)) {
						selParams[param] = self.tableData[param];
					}
				}
				let obj = app.getObject(tableId, ext_id, "popup", item.objectType, 'sel', app.addHistory(column.extTargetField ? column.extTargetField : column.extField, ext_id, self.idn, self.tHistory, self.initialMode), 'compact', selParams);

				self.initExternalObject(obj, column, tabIndex);

				const objectSelParams = obj.selParams;
				self.columns.setDataDependenciesFromObject(column, objectSelParams);

				column.editor = obj;
				column.customEditor = true;
				//}
			});

		}
	}

	createFileTemplate(itemData, itemElement, tabId, item, fileType) {
		const self = this;
		const idn = tabId + '_' + item.dataField + '_file';
		const column = self.columns.columns[itemData.dataField];
		this.loadPromise.then(() => {
			let currentFile = '';
			currentFile = getFileTemplate(self.tableData[item.dataField], idn);

			column.objectType = fileType;
			itemElement.append(`<div id="${idn}"  class="myls-form-file-container" myls-field="${item.dataField}"><div id="${tabId}_${item.dataField}_fileuploader"></div><div id="selected-files"></div></div>`);

			column.editor = $("#" + tabId + '_' + item.dataField + '_fileuploader').dxFileUploader({
				multiple: false,
				accept: fileType === 'image' ? 'image/*' : '*',
				uploadMode: "instantly",
				uploadUrl: "form/uploadimage?field=" + idn,
				name: idn,
				showFileList: false,
				onUploaded: fileUploaded,
			}).dxFileUploader("instance");
			$("#" + tabId + '_' + item.dataField + '_fileuploader .dx-fileuploader-input-container').append(currentFile);
			$("#" + tabId + '_' + item.dataField + '_fileuploader .dx-fileuploader-button').addClass("order-1 mt-2 d-block");
			$("#" + tabId + '_' + item.dataField + '_fileuploader .dx-fileuploader-input-wrapper').addClass("d-flex flex-column p-0 mt-2 border-0");
			//$("#" + tabId + '_' + item.dataField + '_fileuploader .dx-fileuploader-input-label').addClass("d-flex align-items-center text-wrap text-center");
			$("#" + tabId + '_' + item.dataField + '_fileuploader .dx-fileuploader-input-container').addClass('d-flex justify-content-center');
			$("#" + tabId + '_' + item.dataField + '_fileuploader .dx-fileuploader-input').addClass('d-none');
			$("#" + tabId + '_' + item.dataField + '_fileuploader .dx-fileuploader-input-label').addClass("d-none");

			if (itemData.editorOptions.value !== '') {
				createDeleteButton();
			}
		});

		function fileUploaded(e) {
			const filename = $.parseJSON(e.request.response);
			if (filename !== '') {
				removeFileTemplate();
				$("#" + tabId + '_' + item.dataField + '_fileuploader .dx-fileuploader-input-container').append(getFileTemplate(filename));

				$('#' + idn + ' .myls-empty-image').remove();
				createDeleteButton();
				self.tableData[$('#' + idn).attr('myls-field')] = filename;
				if (column.extField) {
					self.tableData[column.extField] = e.file.name;
					self.columns.columns[column.extField].editor.option('value', e.file.name);
				}
			}
		}

		function getFileTemplate(filename) {
			if (filename) {
				if (fileType === 'image') {
					return `<img class="myls-field-image"  src="files/${filename}" /><div id="${idn}-buttonDeleteFile"></div>`;
				}
				if (fileType === 'file') {
					return `<a href="files/${filename}" target="_blank" id="${idn}-link"  class="myls-field-image"><img class="myls-form-file-image" id="${idn}-image" src="img/document.svg"/></a><div id="${idn}-buttonDeleteFile"></div>`;
				}
			} else
				return `<img  id="${idn}-image" src="img/file_empty.svg" class="myls-empty-image"/>`;

		}

		function createDeleteButton() {
			const column = self.columns.columns[itemData.dataField];
			$('#' + idn + '-buttonDeleteFile').dxButton({
				icon: "clear",
				onClick: function () {
					self.tableData[column.dataField] = null;
					removeFileTemplate(true);
				}
			});
		}

		function removeFileTemplate(empty = false) {
			$('#' + idn + ' .myls-field-image').remove();
			$('#' + idn + '-link').remove();
			$('#' + idn + '-buttonDeleteFile').remove();
			//$("#" + tabId + '_' + item.dataField + '_fileuploader .dx-fileuploader-input-label').removeClass("invisible");
			if (empty)
				$("#" + tabId + '_' + item.dataField + '_fileuploader .dx-fileuploader-input-container').append(getFileTemplate());
		}
	}

	async initTreeView(item, column, form) {
		const self = this;
		const data = this.initLookupDataSource(column, form, this.deps);
		let options = await this.initLookupValues(column);

		let v = [];
		$.each(options, function (index, item) {
			v.push(item.id);
		});
		column.oldValues = v;
		//console.log(v);

		const syncTreeViewSelection = function (treeView, value) {
			if (!value) {
				treeView.unselectAll();
				return;
			}

			value.forEach(function (key) {
				treeView.selectItem(key);
			});
		};

		column.editor = $("#" + item).dxDropDownBox({
			value: v,
			valueExpr: "id",
			displayExpr: "item",
			dataSource: data,
			contentTemplate: function (e) {
				let value = e.component.option("value");
				const treeview = $('<div id="' + item + '_treeview"></div>').dxTreeView({
					dataSource: e.component.option("dataSource"),
					dataStructure: "plain",
					showCheckBoxesMode: "selectAll",
					parentIdExpr: "parent_id",
					keyExpr: "id",
					displayExpr: "item",
					valueExpr: "item",

					onContentReady: function (args) {
						syncTreeViewSelection(args.component, value);
					},
					onInitialized: function (e) {
						self.initializeEditor(e, column);
					},
					onDisposing: function (e) {
						self.disposeEditor(column);
					},
					onSelectionChanged: function (et) {
						column.changed = true;
						let tags = [];
						let items = et.component.option('items');
						//console.log(items);
						$.each(items, function (index, item) {
							if (item.selected == true) {
								tags.push(self.getCheckParent(items, index));
							}
						});
						//удалить повторы
						var curr = '';
						var res = [];
						$.each(tags, function (index, item) {
							if (item.id !== curr) {
								res.push(item.id);
								curr = item.id;
							}
						});

						res = res.filter(function (item, pos) {
							return res.indexOf(item) == pos;
						});

						e.component.option("value", res);
						column.changed = true;
						self.validateCustomEditor(e, column);
					}
				});

				return treeview;
			}
		}).dxDropDownBox('instance');
	}

	initLookupValues(column) {
		let params = {};
		let v = [];

		if (column.hasOwnProperty('dependencies') && column.dependencies.hasOwnProperty('data') && this.tableData)
			params = this.getParams(column.dependencies.data, this.tableData);

		if (column.hasOwnProperty('extField'))
			params['ext_id'] = this.tableData[column.extField];

		app.addConfigParams(params);
		return app.processData('form/getlookupvalues', 'get', {'id': column.id, 'params': JSON.stringify(params)});
	}

	initializeEditor(e, column) {
		column.editor = e.component;
	}

	disposeEditor(column) {
		column.editor = null;
	}

	validateCustomEditor(e, column) {
		let isValid = true;
		if (!column || !e) return isValid;
		if (column.toClear) return true;
		if (column.required) {
			if (column.required[0] != '=' || (column.required[0] == '=' /*&& !doCondition(column.required, columns, tableData, tHistory)*/)) {
				let isEmpty = false;
				const component = (e.component) ? e.component : e;
				switch (column.dataType) {
					case 'tagbox':
						isEmpty = component.option('value').length == 0;
						break;
					case 'buttongroup':
						isEmpty = component.option('selectedItemKeys').length == 0;
						break;
					default:
						isEmpty = component.option('value') !== null && component.option('value') !== undefined && component.option('value') !== '';
				}
				if (isEmpty) {
					component.option({
						validationError: {message: app.translate.saveString("Поле необходимо заполнить")},
						isValid: false
					});
					isValid = false;
				} else
					component.option({
						isValid: true
					});
			}
		}
		return isValid;
	}

	initTagBox(item, column, formItem, form) {
		const self = this;
		column.customEditor = true;

		column.editor = $("#" + item).dxTagBox({
			dataSource: this.initLookupDataSource(column, form, this.deps),
			value: [],
			displayExpr: 'item',
			valueExpr: 'id',
			acceptCustomValue: column.canAdd,
			searchEnabled: true,
			showSelectionControls: true,
			showClearButton: true,
			showDropDownButton: true,
			buttons: ['clear', self.getAddButtonOptions(column), 'dropDown'],
			onOpened: getTagboxOnOpened,
			onKeyUp: getTagboxOnKeyUp,
			onClosed: function (e) {
				const buttonAdd = e.element.find('.searchTagBox');
				buttonAdd.remove();
			},
			onValueChanged: function (e) {
				column.changed = true;
				self.setButtonsVisible(e, column);
				self.validateCustomEditor(e, column);
			},
			onInitialized: function (e) {
				self.initializeEditor(e, column);
				self.setButtonsVisible(e, column);
			},
			onDisposing: function (e) {
				self.disposeEditor(column);
			},

		}).dxTagBox('instance');

		setTagboxItemTemplate();
		setTagboxTagTemplate();

		if (formItem.grouped) {
			column.editor.option('grouped', true);
			column.editor.getDataSource().group("category");
		}

		function getTagboxOnOpened(e) {
			let toolbarItems = [];
			toolbarItems.push({
				location: "center",
				toolbar: "bottom",
				html: '<span class="myls-lookup-cancel">' + app.translate.saveString("Закрыть") + '</span></div>',
				onClick: function (el) {
					e.component.option('text', '');
					e.component.close(self.ext_id);
				}
			});
			if (column.canAdd) {
				toolbarItems.push(
					{
						location: "before",
						toolbar: "bottom",
						html: '<span class="myls-lookup-addnewvalue hidden" id="' + self.idn + '_' + column.id + '_linkadd"></span>',
						onClick: async function (el) {
							await self.addNewLookupItem(e, column, e.component.option('text').toString().trim());
						}
					});
			}
			e.component._popup.option("toolbarItems", toolbarItems);
		}

		function setTagboxItemTemplate() {
			if (column.template) {
				column.editor.option('itemTemplate', function (data) {
					return self.columns.getFormattedCellValue(null, column, data);
				});
			} else column.editor.option('itemTemplate', function (data) {
				if (data.hasOwnProperty('color') && data.color !== null && data.color !== undefined)
					return `<span class='myls-colored-value ${$.Color(data.color).contrastColor()}' style='background-color: ${data.color}'>${data.item}</span>`;
				else return data.item;
			});
		}

		function setTagboxTagTemplate() {
			column.editor.option('tagTemplate', function (data) {
				if (data.hasOwnProperty('color') && data.color !== null && data.color !== undefined)
					return $("<div />")
						.addClass("dx-tag-content").css('background-color', data.color)
						.append(
							$("<span />").text(data.item).addClass($.Color(data.color).contrastColor()),
							$("<div />").addClass("dx-tag-remove-button")
						);
				else return $("<div />")
					.addClass("dx-tag-content")
					.append(
						$("<span />").text(data.item),
						$("<div />").addClass("dx-tag-remove-button")
					);
			});
		}

		function getTagboxOnKeyUp(e) {
			self.setButtonsVisible(e, column);
			if (column.canAdd) {
				//console.log(e.component.option('value'));
				const currText = e.component.option('text').toString().trim();
				const isFind = self.findInDataSource(currText, e.component.option('items'));
				if (currText && (isFind == -1)) {
					$("#" + self.idn + "_" + column.id + "_linkadd").removeClass('hidden').text(app.translate.saveString('Добавить "') + currText + app.translate.saveString('"'));
				} else {
					$("#" + self.idn + "_" + column.id + "_linkadd").removeClass('hidden').addClass('hidden').text('');
				}
			}
		}
	}

	updateTagBox() {
		const self = this;
		const result = [];
		$.each(this.columns.columns, function (index, item) {
			if ((item.dataType == 'tagbox' || item.dataType == 'treeview' || item.dataType == 'buttongroup') && item.changed) {
				var params = {};
				params.id = item.id;
				params.ext_id = self.tableData[item.extField];

				if (item.oldValues === undefined) item.oldValues = [];
				params.oldValues = JSON.stringify(item.oldValues);

				if (item.dataType == 'buttongroup')
					params.values = JSON.stringify(item.editor.option('selectedItemKeys'));
				else
					params.values = JSON.stringify(item.editor.option('value'));

				result.push(app.processData('form/updatetagbox', 'post', params));
			}
		});
		return result;
	}

	async addNewLookupItem(e, column, searchText) {
		const self = this;
		if (searchText && column.canAdd) {
			if (await app.dialog.confirm(this.idn, app.translate.saveString('Добавить новое значение') + ' "' + searchText + '"?', app.translate.saveString('Новое значение'))) {
				//if (dialogResult == true) {
				const values = {'item': searchText};

				if (column.extFormId) {
					// Добавление через форму
					await self.editInExternalForm(column, -1, 'ins', searchText);
				} else {
					// Просто добавление
					this.inlineAddNewValue(column, values, e);
				}
				e.component.close();
			} else
				e.component.option("value", null);
			e.component.close();
		}
	}

	inlineAddNewValue(column, values, e) {
		const self = this;
		if (column.insertConditions && column.insertConditions.length > 1) {
			$.each(column.insertConditions, function (_, item) {
				if (item !== 'item') {
					values[item] = self.getFieldValue(item);
				}
			});
		}
		$.ajax({
			type: "post",
			cache: false,
			url: "form/insertlookup",
			data: ({'id': column.id, 'params': values}),
			success: function (data) {
				//console.log(column);
				var res = $.parseJSON(data);
				if (Object.keys(res).length !== 0) {
					self.reloadColumn(column);
					if (e.component.NAME == 'dxSelectBox') {
						e.component.option("value", res[Object.keys(res)[0]]);
					} else {
						const opt = e.component.option("value");
						opt.push(res[Object.keys(res)[0]]);
						e.component.option("value", opt);
					}
					e.component.close();
				}
			}
		});
	}

	getExtFormParams(extFormField, searchText) {
		const self = this;
		let params = {};
		const re = /\s*,\s*/;
		const parts = extFormField.split(re);
		$.each(parts, (index, item) => {
			const re = /\s*=>\s*/;
			const fields = item.split(re);
			if (fields.length == 2) {
				params[fields[1]] = self.tableData[fields[0]];
			}
			if (fields.length == 1) {
				params[fields[0]] = searchText;
			}
		});
		return params;
	}

	async initButtonGroup(item, column) {
		const self = this;
		column.customEditor = true;
		column.editor = $("#" + item).dxButtonGroup({
			items: [],
			keyExpr: "id",
			stylingMode: "outlined",
			selectionMode: "multiple",
			selectedItemKeys: [],
			onSelectionChanged: function (e) {
				column.changed = true;
				self.validateCustomEditor(e, column);
			},
			onInitialized: function (e) {
				self.initializeEditor(e, column);
			},
			onDisposing: function (e) {
				self.disposeEditor(column);
			}
		}).dxButtonGroup('instance');

		let items = await self.loadLookupData(column);
		$.each(items, function (index, el) {
			el.text = el.item;
		});
		if (!column.toClear)
			column.editor.option("items", items);
	}

	async initButton(item, column, form) {
		const self = this;
		$(item).dxButton({
			stylingMode: "outlined",
			text: form.caption,
			type: "default",
			elementAttr: {
				class: "myls-form-button" + (form.cssClass ? " " + form.cssClass : '')
			},
			onClick: function () {
				self.dependencies.init(null, self.tableData);
				if (form.openForm && form.openForm.tableId) {
					self.buttonOpenForm(form);
				}
				if (form.openReport && form.openReport.reportId) {
					self.buttonOpenReport(form);
				}
				if (form.execProc && form.execProc.proc) {
					self.buttonExecProc(form);
				}
			}
		});
	}

	async buttonOpenReport(form) {
		const self = this;
		try {
			await this.save(this.ext_id);
			const params = {};
			const pr = [];
			if (form.openReport.params) {
				$.each(form.openReport.params, async function (index, param) {
					const promise = self.dependencies.doCondition('=' + param);
					pr.push(promise);
					params[index] = await promise;

				});
				await Promise.all(pr);
			}
			const data = {};
			data['id'] = form.openReport.reportId;
			data['params'] = params;
			window.location.href = '/site/pdf?id=' + form.openReport.reportId + '&params=' + JSON.stringify(params);
		} catch (error) {
			this.disableButtons(false);
		}
	}

	async buttonOpenForm(form) {
		try {
			await this.save(this.ext_id);
			if (form.openForm.extId) {
				const extId = await this.dependencies.doCondition(form.openForm.extId);
				if (extId) {
					await app.openPopup(form.openForm.tableId, extId, 'form', 'updins', app.addHistory(null, extId, this.idn, this.tHistory, 'upd'));
				} else {
					await app.dialog.showError(this.idn, app.translate.saveString(form.openForm.errorMsg));
				}
			}
		} catch (error) {
			this.processResult(error);
			this.disableButtons(false);
		}
	}

	async buttonExecProc(form) {
		try {
			await this.save(this.ext_id);
			if (form.execProc.proc) {
				const proc = await this.dependencies.doCondition(`='${form.execProc.proc}'`, undefined, false);
				if (proc) {
					const result = await app.processData('form/getdbdata', 'post', {'proc': proc, 'geterror': true});
					this.processResult(result);
					if (form.execProc.reload == 'reload') {
						this.reloadData('upd');
					}

				} else {
					await app.dialog.showError(this.idn, app.translate.saveString('Не указана процедура'));
				}
			}
		} catch (error) {
			this.processResult(error);
			this.disableButtons(false);
		}
	}

	async openFormDependencies() {

		const self = this;
		const pr = [];
		if (DEBUG)
			console.time('openFormDependencies');
		this.forms.every((form) => form.beginUpdate());

		$.each(self.columns.columns, async (_, column) => {
			if (column.form) {
				self.dependencies.init(column.form, self.tableData);
				pr.push(self.dependencies.setFieldVisible(column));
				pr.push(self.dependencies.setFieldCaption(column));
				pr.push(self.dependencies.setFieldValidation(column));
				pr.push(self.dependencies.setFieldEditable(column));
				if (self.mode == 'ins' || self.mode == 'updins') {
					pr.push(self.dependencies.setFieldValue(column));
				}
				//return false;
			}
		});
		await Promise.all(pr);

		this.forms.every((form) => form.endUpdate());
		if (DEBUG)
			console.timeEnd('openFormDependencies');
	}

	addButtons(buttons, btnArr) {
		if (buttons) {
			$.each(btnArr, function (index, item) {
				if (item)
					buttons.push(item);
			});
		}
	}

	getButtonLink(column, data) {
		let pref = '',
			icon = '';
		if (column.pattern == 'url') {
			pref = '';
			icon = 'globe';
		}
		if (column.pattern == 'email') {
			pref = 'mailto:';
			icon = 'email';
		}
		if (column.pattern == 'phone') {
			pref = 'tel:';
			icon = 'tel';
		}
		if (pref == '' && icon == '')
			return null;

		const btn = {
			location: "after",
			name: "Link",
			elementAttr: {
				class: "myls-editor-btn"
			},
			options: {
				dataField: data,
				icon: icon,
				pref: pref,
				onClick: function (e) {
					if (e.component.option('dataField') != '') {
						if (column.pattern == 'url') {
							const pattern = /^((http|https|ftp):\/\/)/;
							let url = e.component.option('pref') + e.component.option('dataField');
							if (!pattern.test(url)) {
								url = "http://" + url;
							}
							window.open(url, '_blank');
						} else {
							window.location.href = e.component.option('pref') + e.component.option('dataField');
						}
					}
				}
			}
		};
		return btn;
	}

	setPatternButtons(column, e) {
		let buttons = ['clear'];
		const value = this.tableData[column.dataField] ? this.tableData[column.dataField].trim() : this.tableData[column.dataField];
		//e.component.option('value')
		if (column.pattern && value) {
			//проверить поле на соответствие паттерну
			let currPattern = '';
			switch (column.pattern) {
				case 'email':
					currPattern = app.patterns.mail_form;
					break;
				case 'phone':
					currPattern = app.patterns.phone_form;
					break;
				case 'url':
					currPattern = app.patterns.url_form;
					break;
			}
			if (currPattern) {
				const currRes = currPattern.test(value);
				if (currRes) {
					buttons.push(this.getButtonLink(column, value));
				}
			}
		}
		e.component.option('buttons', buttons);
	}

	initLookup(item, column, form) {
		const self = this;
		item.editorOptions.dataSource = this.initLookupDataSource(column, form, this.deps);
		item.editorOptions.showPopupTitle = false;
		if (item.grouped) {
			item.editorOptions.grouped = true;
			item.editorOptions.dataSource.group = "category";
		}

		setLookupItemTemplate();
		item.editorOptions.dropDownButtonTemplate = getDropDownButtonTemplate;
		item.editorOptions.fieldTemplate = getLookupFieldTemplate;
		item.editorOptions.closeOnOutsideClick = true;
		item.editorOptions.showClearButton = true;
		item.editorOptions.displayExpr = 'item';
		item.editorOptions.buttons = ['clear', self.getAddButtonOptions(column), this.getMoreButtonOptions(column), 'dropDown'];
		item.editorOptions.searchExpr = 'item';
		item.editorOptions.searchEnabled = true;
		item.editorOptions.valueExpr = 'id';
		item.editorOptions.keyExpr = 'id';

		if (column.canAdd) {
			item.editorOptions.acceptCustomValue = true;
			item.editorOptions.onKeyUp = getLookupOnInput;
			item.editorOptions.onCustomItemCreating = getOnCustomItemCreating;
		}

		item.editorOptions.onInitialized = function (e) {
			self.setButtonsVisible(e, column);
			self.initializeEditor(e, column);
		};
		item.editorOptions.onDisposing = function (e) {
			self.disposeEditor(column);
		};
		item.editorOptions.onValueChanged = function (e) {
			self.setButtonsVisible(e, column);
		};

		function getLookupFieldTemplate(selectedItem, container) {
			let template = $("<div class='d-flex'/>").append(selectedItem && selectedItem.hasOwnProperty('color') ? $(`<span class="myls-lookup-color  flex-grow-0" style="background-color:${selectedItem.color}"/>`) : '', $("<div class='myls-lookup-textbox flex-grow-1'/>"));
			let value = null;
			if (selectedItem) value = selectedItem.item;
			template.find(".myls-lookup-textbox").dxTextBox({value: value});
			container.append(template);
		}

		function setLookupItemTemplate() {
			if (column.template) {
				item.editorOptions.itemTemplate = function (data) {
					return self.columns.getFormattedCellValue(null, column, data);
				};
			} else item.editorOptions.itemTemplate = function (data) {
				if (data.hasOwnProperty('color') && data.color !== null && data.color !== undefined)
					return `<span class='myls-colored-value ${$.Color(data.color).contrastColor()}' style='background-color: ${data.color}'>${data.item}</span>`;
				else return data.item;
			};
		}

		function getLookupOnInput(e) {
			self.setButtonsVisible(e, column);
		}

		function getOnCustomItemCreating(e) {
			if (!e.customItem) {
				e.customItem = e.text;
			}
			if (e.text) {
				const isFind = self.findInDataSource(e.text, e.component.option('items'));
				if (isFind == -1)
					self.addNewLookupItem(e, column, e.text);
			}
		}

		function getDropDownButtonTemplate(data, element) {
			const $loadIndicator = $("<div>").dxLoadIndicator({visible: false}),
				$dropDownButton = $("<div>", {
					class: "dx-dropdowneditor-icon"
				});
			$(element).append($loadIndicator, $dropDownButton);
			column.loadIndicator = $loadIndicator.dxLoadIndicator('instance');
			column.dropDownButton = $dropDownButton;
		}
	}

	setButtonsVisible(e, column) {
		this.initMoreButton(e, column);
		this.initAddButton(e);
	}

	initMoreButton(e, column) {
		let customBtn = e.component.getButton("More");
		if (customBtn) {
			customBtn.option("visible", false);
			if (column.extFormId) {
				const currValue = e.component.option('value');
				if (currValue) {
					customBtn.option("visible", true);
				}
			}
		}
	}

	initAddButton(e) {
		let customBtn = e.component.getButton("Add");
		if (customBtn) {
			let currText = e.component.option("text");
			if (currText && typeof currText == 'string')
				currText = currText.trim();
			else
				currText = undefined;
			let isFind = -1;
			if (currText)
				isFind = this.findInDataSource(currText, e.component.option('items'));
			customBtn.option("visible", currText && (isFind == -1));
		}
	}

	initRadioGroup(item, column, form) {
		const self = this;
		item.editorOptions.dataSource = this.initLookupDataSource(column, form, this.deps);
		item.editorOptions.displayExpr = 'item';
		item.editorOptions.onInitialized = function (e) {
			self.initializeEditor(e, column);
		};
		item.editorOptions.onDisposing = function (e) {
			self.disposeEditor(column);
		};
	}

	initSelectBox(item, column, form) {
		const self = this;
		item.editorOptions.dataSource = this.initLookupDataSource(column, form, this.deps);
		if (item.grouped) {
			item.editorOptions.grouped = true;
			item.editorOptions.dataSource.group = "category";
		}
		item.editorOptions.displayExpr = 'item';
		item.editorOptions.onInitialized = function (e) {
			self.initializeEditor(e, column);
		};
		item.editorOptions.onDisposing = function (e) {
			self.disposeEditor(column);
		};
		if (column.template) {
			item.editorOptions.itemTemplate = function (data) {
				return self.columns.getFormattedCellValue(null, column, data);
			};
		}
	}

	async initHtml(idnf, column, form) {
		column.customEditor = true;
		try {
			if (column.editor) column.editor.destroy();
			column.editor = await ClassicEditor.create(document.querySelector('#' + idnf), this.getHtmlOptions(column));
			this.setCustomEditorsValue(column, this.tableData[column.dataField]);
		} catch (error) {
			console.log(error);
		}
	}

	getHtmlOptions(column) {
		return {
			toolbar: {
				items: [
					'undo',
					'redo',
					'|',
					'heading',
					'fontBackgroundColor',
					'fontColor',
					'fontSize',
					'fontFamily',
					'alignment',
					'|',
					'bold',
					'underline',
					'italic',
					'|',
					'link',
					'bulletedList',
					'numberedList',
					'todoList',
					'|',
					'indent',
					'outdent',
					'|',
					'imageUpload',
					'blockQuote',
					'insertTable',
					'mediaEmbed',
					'|',
					'horizontalLine',
					'specialCharacters',
					'strikethrough',
					'subscript',
					'superscript',
					'|',
					'removeFormat',
					'pageBreak'
				]
			},
			language: 'en',
			image: {
				toolbar: [
					'imageTextAlternative',
					'imageStyle:full',
					'imageStyle:side'
				]
			},
			table: {
				contentToolbar: [
					'tableColumn',
					'tableRow',
					'mergeTableCells',
					'tableCellProperties',
					'tableProperties'
				]
			},

			licenseKey: 'CJMDDP619.DYZ815RDE608',
			sidebar: {
				container: document.querySelector('.sidebar')
			},
			/*
			ckfinder: {
				uploadUrl: '/ckfinder/core/connector/php/connector.php?command=QuickUpload&type=Files&responseType=json',
				openerMethod: 'popup',
				options: {
					resourceType: 'Images'
				}
			},
			*/
			//initialData: this.tableData[column.dataField]
		};
	}

	getAddButtonOptions(e, column, currValue) {
		const self = this;
		return {
			location: "after",
			name: "Add",
			elementAttr: {
				class: "myls-editor-btn"
			},
			options: {
				//dataField: data,
				icon: "/img/insert.svg",
				visible: false,
				onClick: function (el) {
					self.addNewLookupItem(e, column, currValue);
					el.element.remove();
				}
			}
		};
	}

	getMoreButtonOptions(e, column, currValue) {
		const self = this;
		return {
			location: "after",
			name: "More",
			elementAttr: {
				class: "myls-editor-btn"
			},
			options: {
				icon: 'more',
				visible: false,
				onClick: async function (el) {
					await self.editInExternalForm(column, currValue, 'upd');
				}
			}
		};
	}

	async editInExternalForm(column, extId, mode, text) {
		let formId = column.extFormId;
		if (column.extFormId[0] == '=') {
			this.dependencies.init(column.form, this.tableData);
			formId = await this.dependencies.doCondition(column.extFormId);
		}
		let params = {};
		if (column.extFormField) {
			let formField = column.extFormField;
			if (column.extFormField[0] == '=') {
				formField = doCondition(column.extFormField);
			}
			params = this.getExtFormParams(formField, text);
		}

		const popup = await app.openPopup(formId, extId, 'form', mode, app.addHistory(column.dataField, extId, this.idn, this.tHistory, mode), params);

		extId = await popup.mylsObject.promise;
		await this.reloadColumn(column);
		if (mode === 'ins' && extId) {
			column.editor.option('value', extId);
		}
	}

	async reloadColumn(column) {
		const self = this;
		column.editor.getDataSource().store().clearRawDataCache();
		column.dataParams = null;
		await column.editor.getDataSource().load();
		column.editor.repaint();
		if (column.dependencies && column.dependencies.data)
			$.each(column.dependencies.data, function (index, field) {
				self.columns.columns[field].dataParams = null;
			});
		this.dependencies.init(column.form, this.tableData);
		await this.dependencies.process(column.dataField);
	}

	getExtFormParams(extFormField, searchText) {
		const self = this;
		const params = {};
		const re = /\s*,\s*/;
		const parts = extFormField.split(re);
		$.each(parts, function (index, item) {
			const re = /\s*=>\s*/;
			const fields = item.split(re);
			if (fields.length == 2) {
				params[fields[1]] = self.tableData[fields[0]];
			}
			if (fields.length == 1) {
				params[fields[0]] = searchText;
			}
		});
		return params;
	}

	async setDataToForm(saveAndAdd) {
		const self = this;
		$.each(this.forms, function (_, item) {
			//item.beginUpdate();
			//if (saveAndAdd) {
			item.option('formData', self.tableData);
			//}
			item.on("fieldDataChanged", e => {
				self.fieldChanged(e);
			});
		});
		this.setCustomEditorsValues();
		/*$.each(forms, function (_, item) {
			doAllDependencies(item);
		});*/
	}

	setCustomEditorsValues() {
		const self = this;
		$.each(this.columns.columns, async (_, item) => {
			if (item.editor) {
				switch (item.dataType) {
					case 'tagbox':
					case 'treeview':
					case 'buttongroup':
						const values = await self.loadTagBoxValues(item);
						self.setCustomEditorsValue(item, values);
						break;
					case 'html':
						self.setCustomEditorsValue(item, self.tableData[item.dataField]);
						break;
				}
			}
		});
	}

	clearObjectsValues() {
		$.each(this.columns.columns, function (index, item) {
			if (item.editor) {
				switch (item.dataType) {
					case 'tagbox':
					case 'treeview':
						item.editor.option('value', []);
						break;
					case 'buttongroup':
						item.editor.option('selectedItemKeys', []);
						break;
					case 'html':
						item.editor.setData(null);
						break;
				}
			}
		});
	}

	loadTagBoxValues(column) {
		const self = this;
		return new Promise(async (resolve, reject) => {
			let values = [];
			if (self.objectValues.hasOwnProperty(column.dataField)) {
				values = self.objectValues[column.dataField];
				resolve(values);
			} else {
				const options = await self.initLookupValues(column);
				$.each(options, function (index, item) {
					values.push(item.id);
				});
				column.oldValues = values.slice();
				resolve(values);
			}
		});
	}

	setCustomEditorsValue(item, values) {
		const self = this;
		if (item.editor)
			switch (item.dataType) {
				case 'tagbox':
				case 'treeview':
					item.editor.option("value", values);
					break;
				case 'buttongroup':
					item.editor.option("selectedItemKeys", values);
					break;
				case 'colorbox':
					item.editor.spectrum('option', 'color', values);
					item.editor.spectrum('set', values);
					break;
				case 'html'    :
					if (values)
						item.editor.setData(values);
					item.editor.model.document.on('change:data', (evt, data) => {
						self.tableData[item.dataField] = item.editor.getData();
					});
					break;
			}
		item.changed = false;
	}

	getCustomEditorsValues() {
		const self = this;
		$.each(this.columns.columns, function (index, item) {
			if (item.editor)
				switch (item.dataType) {
					case 'tagbox':
					case 'treeview':
						self.objectValues[item.dataField] = item.editor.option('value');
						break;
					case 'buttongroup':
						self.objectValues[item.dataField] = item.editor.option('selectedItemKeys');
						break;
					case 'colorbox':
						self.objectValues[item.dataField] = item.editor.spectrum('option', 'color');
						break;
					case 'html'    :
						self.objectValues[item.dataField] = item.editor.getData();
						break;
				}
		});
	}

	fieldChanged(e) {
		this.getCustomEditorsValues();
		this.removeFromDeps(e.dataField);
		const column = this.columns.columns[e.dataField];
		if (column.value != e.value || this.columns.isObject(e.dataField)) {
			this.execChangeProcedure(column, e.value);
			column.editMode = 'edit';
			this.dependencies.init(column.form, this.tableData);
			this.dependencies.process(e.dataField);
		}
		//this.disableButtons(false);
		this.columns.columns[e.dataField].value = e.value;
	}

	async execChangeProcedure(column, newValue) {
		if (column.changeFieldProc) {
			let proc = app.replaceAll(column.changeFieldProc, ':__new__', this.prepareValue(newValue, column.dataField, true));
			proc = app.replaceAll(proc, ':__old__', this.prepareValue(column.value, column.dataField, true));
			this.dependencies.init(null, this.tableData);
			const result = await this.dependencies.doCondition(proc);
			if (result != '')
				await this.processResult({success: {error_msg: result, error_type: 1}});
		}
	}

	removeFromDeps(field) {
		const self = this;
		$.each(this.deps, function (index, item) {
			if (index.indexOf(":" + field) != -1) {
				delete self.deps[index];
			}
		});
	}

	disableButtons(disable) {
		if (this.saveBtn)
			this.saveBtn.option('disabled', disable);
		if (this.saveAddBtn)
			this.saveAddBtn.option('disabled', disable);
		if (this.cancelBtn)
			this.cancelBtn.option('disabled', disable);
	}

	async showFormButtons() {
		const self = this;
		// Кнопка сохранения
		this.saveBtn = $("#" + this.idn + "_save-button").dxButton('instance');
		this.saveAddBtn = $("#" + this.idn + "_saveadd-button").dxButton('instance');
		this.cancelBtn = $("#" + this.idn + "_cancel-button").dxButton('instance');
		this.closeBtn = $("#" + this.idn + "_close-button").dxButton('instance');

		if (this.saveBtn !== undefined) {
			this.saveBtn.on('click', async (e) => {
				try {
					await self.saveBtnClick();
				} catch (e) {

				}
			});
		}
		if (this.saveAddBtn !== undefined && this.mode == 'ins') {
			this.saveAddBtn.on('click', async (e) => {
				try {
					await self.saveAddBtnClick();
				} catch (e) {

				}
			});
		}
		if (this.cancelBtn !== undefined) {
			this.cancelBtn.option('onClick', async () => {
				try {
					await self.cancelBtnClick();
				} catch (e) {

				}
			});
		}

		if (this.closeBtn !== undefined) {
			this.closeBtn.option('onClick', async (e) => {
				e.event.stopPropagation();
				try {
					await self.cancelBtnClick();
				} catch (e) {

				}
			});
		}
	}

	async cancelBtnClick() {
		if (this.hasUncommitedData()) {
			if (!await app.dialog.confirm(this.idn, app.translate.saveString('На форме есть <b class="mylsThemeRed">несохраненные данные</b>.<br>Вы уверены, что хотите выйти?'),
				app.translate.saveString('Подтверждение'), app.translate.saveString('Да'),
				app.translate.saveString('Нет'),
				'myls-msg-warning'))
				return;
		}
		const currentValues = this.createAllValues([]);
		try {
			await this.execCancelProc(currentValues);
			if (this.rawMode === 'updins') {
				await this.processDelete(this.ext_id);
			}
		} catch (error) {
			this.processResult(error);
		}
		this.destroy();
	}

	async saveAddBtnClick() {
		this.saveAndAdd = true;
		await this.saveBtnClick();
	}

	async saveBtnClick() {
		try {

			await this.save(this.ext_id);
			await this.refreshAndClose();
		} finally {
			this.disableButtons(false);
			this.saveAndAdd = false;
		}
	}

	async save(key) {
		this.updatedValues = this.tableData;
		return super.save(key);
	}

	saveData(updateArr) {
		const self = this;
		return new Promise(async (resolve, reject) => {
			if (Object.keys(updateArr).length != 0) {
				//debugger
				// Отправляем данные на сервер
				const update = self.getUpdatePromise(updateArr, self.ext_id);

				try {
					const data = await update;
					await self.processResult(data);
					if (self.saveAndAdd) self.mode = 'ins';
					else
						self.mode = 'upd';
					resolve();
				} catch (error) {
					await self.processResult(error);
					reject();
				} finally {
					self.disableButtons(false);
				}

			} else {
				self.disableButtons(false);
				resolve();
			}
		});
	}

	async refreshAndClose() {
		let refresh;
		const th = this.tHistory[this.tHistory.length - 1];
		if (th) {
			const object = $('#' + th.idn).data('mylsObject');
			if (object) {
				if (this.tableInfo.refreshAll || (th.refreashAll)) {
					refresh = object.refresh(true);
				} else {
					refresh = object.refreshRow(this.ext_id, this.initialMode);
				}
			}
		}

		if (this.popup && !this.saveAndAdd) {
			await refresh;
			//this.popup.popup.remove();
		}
		this.close(this.ext_id);
		if (this.saveAndAdd) {
			await this.reloadData('ins');
		} else {
			this.destroy();
		}
	}

	async reloadData(mode) {
		const ext_id = mode == 'ins' ? -1 : this.ext_id;

		const loadData = app.processData('form/tabledata', 'post', this.prepareTableData(ext_id, mode));
		let data = await loadData;
		this.saveAndAdd = mode == 'ins' ? true : false;
		this.clearObjectsValues();

		this.ext_id = data['ext_id'];
		this.updatedExtId[this.ext_id] = data['ext_id'];
		this.updatedExtField[this.ext_id] = data['ext_field'];

		this.tableData = data[0];
		this.afterLoad();
		this.setDataToForm(true);
		this.saveAndAdd = false;
		this.disableButtons(false);
	}

	validate() {
		const self = this;
		// Валидируем данные во всех формах
		let isValid = true;
		$.each(this.forms, function (index, value) {
			try {
				const validate = value.validate();
				if (!validate.isValid) {
					isValid = false;
					if (value.mylsTab !== null)
						$("#" + self.idn).dxTabPanel('instance').option("selectedIndex", value.mylsTab);
					return false;
				}
			} catch (e) {

			}
		});
		$.each(this.columns.columns, function (index, item) {
			if (self.customFormObjects.indexOf(item.dataType) !== -1) {
				if (!self.validateCustomEditor(item.editor, item))
					isValid = false;
			}
		});
		return isValid;
	}

	async saveObjects() {
		var result = [];
		$.each(this.arrObjects, function (index, item) {
			if (item.saveFunction) {
				result.push(item.saveFunction());
			}
		});
		return result;
	}

	createAllValues(updateArr) {
		let currentValues = super.createAllValues(updateArr);
		// Плюс добавляем все tagbox
		$.each(this.columns.columns, function (index, item) {
			if ((item.dataType == 'tagbox' || item.dataType == 'treeview')) {
				//debugger
				currentValues[index] = item.editor && item.editor.option('value').length ? item.editor.option('value').join() : null;
			}
			if (item.dataType == 'buttongroup') {
				//debugger
				currentValues[index] = item.editor && item.editor.option('selectedItemKeys').length ? item.editor.option('selectedItemKeys').join() : null;
			}
		});
		return currentValues;
	}

	additionalSave() {
		const self = this;
		return new Promise(async (resolve, reject) => {
			try {
				const uResult = self.updateTagBox();
				const oResult = self.saveObjects();
				// Сохраняем данные всех тэгбоксов и других кастомных столбцов
				await Promise.all(uResult.concat(oResult));
				resolve();
			} catch (error) {
				reject(error);
			}
		});
	}

	destroy() {
		super.destroy();
		this.popup.destroy();
		this.popup = null;
		$("#" + this.idn).data('mylsObject', null);
		app.destroyArray(this.customFormObjects);
		app.destroyArray(this.rawData);
		app.destroyArray(this.objectValues);
		app.destroyArray(this.forms);
		app.destroyArray(this.arrObjects);
		app.destroyArray(this.objectValues);
		app.destroyArray(this.tableData);
		app.destroyArray(this.saveBtn);
		app.destroyArray(this.saveAddBtn);
		app.destroyArray(this.cancelBtn);
		app.destroyArray(this.tData);
		app.destroyArray(this.firstData);
		this.close();
	}

	setFieldVisible(form, column, isVisible) {
		if (!column.form) return;
		let path = this.columns.getFieldPath(column);
		if (column.form.itemOption(path) && column.visible !== isVisible) {
			column.form.itemOption(path, "visible", isVisible);
		}
		column.visible = isVisible;
	}

	setFieldCaption(form, column, caption) {
		if (!column.form) return;
		let path = this.columns.getFieldPath(column);
		if (column.form.itemOption(path))
			column.form.itemOption(path, "label", caption);
	}

	setFieldValidation(form, column, rules) {
		if (!column.form) return;
		let path = this.columns.getFieldPath(column);
		if (!column.customEditor && column.form && column.form.itemOption(path) && (!column.validationRules || column.validationRules !== JSON.stringify(rules)))
			column.form.itemOption(path, "validationRules", rules);
		column.validationRules = JSON.stringify(rules);
	}

	setFieldValue(object, column, value) {
		if (!column.customEditor) {
			/*let editor = column.editor;
			if (!editor) {
				editor = object.getEditor(column.dataField);
				if (editor) column.editor = editor;
			}
			if (editor) {
				editor.option("value", value);
			}*/
			if (!object) object = column.form;
			object.updateData(column.dataField, value);
		} else {
			this.setCustomEditorsValue(column, value);
		}
		this.tableData[column.dataField] = value;
	}

	setFieldEditable(object, column, result) {
		if (!column.customEditor) {
			let editor = column.editor;
			if (!editor) {
				editor = object.getEditor(column.dataField);
				if (editor) column.editor = editor;
			}
			if (editor) {
				editor.option("readOnly", !result);
			}
		}
	}

	refreshRow() {
		// Для формы пустой
	}

	hasUncommitedData() {
		if (!app.isEqual(this.tableData, this.firstData))
			return true;
		else
			for (let object of this.arrObjects) {
				if (object.hasUncommitedData()) {
					this.tabPanel.option('selectedIndex', object.formTabIndex);
					return true;
				}
			}
		return false;
	}

}
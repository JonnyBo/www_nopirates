//initForm = profile(initForm);

function initForm(table, ext_id, view, mode, tHistory, params, template) {
	var formDeferred = $.Deferred();
	var idn = getIdn(table, ext_id, 'form', view);

	//получаем данные для формы
	var form = template;
	if (mode != 'setup' || !template)
		form = getTemplate(table);
	//получаем данные таблицы
	var tData = {'0': []};
	if (mode != 'setup')
		tData = getData('/form/tabledata', 'post', prepareTableData(table, ext_id, mode, null));
	//получаем столбцы таблицы
	var columns = getTableColumns(table);
	// Информация о таблице
	var tableInfo = getTableInfo(table);

	var popup = null;
	var customFormObjects = ['tagbox', 'treeview', 'image', 'colorbox', 'buttongroup'];

	columns = columns.columns;

	// Объект с изначальными данными, которые пришли с сервера при открытии формы
	var rawData = [];
	var initialMode = mode;
	// Список форм
	var forms = [];
	var arrObjects = [];
	var objectValues = {};
	var tableData = {'0': []};
	var allTableData;
	var deps = {};

	// Кнопка сохранения
	var saveBtn;
	var saveAddBtn;
	var cancelBtn;

	var saveAndAdd = false;

	var rawMode = mode;

	// Проставляем ext_id, если ключевое поле - company_id
	if (tableInfo.idField == 'company_id' && (ext_id === null || ext_id === undefined))
		ext_id = config.company_id;

	// Загружаем данные и модифицируем форму
	//createForm = profile(createForm);

	$.when(tData, setPopup()).done(function (tData) {
		tableData = tData[0];
		allTableData = tData;
		if (DEBUG) {
			createForm = profile(createForm);
			//setPopup = profile(setPopup);
		}
		rawData = afterLoad();


		setPopupTitle();
		//let ts = Date.now();
		createForm();
		//console.log(Date.now() - ts);
		var object = {
			columns: columns,
			tableInfo: tableInfo,
			type: 'form',
			tHistory: tHistory,
			idn: idn,
			saveFunction: save,
			ext_id: tData.ext_id
		};
		objects[idn] = object;

		//setDataToForm = profile(setDataToForm);
		loadData();

		//setDataToForm();
		setAllPatterButtons();
		showFormButtons();
		if (mode == 'updins') mode = 'upd';

	});

	//выводим форму
	//  $.when(tableData).done(function (tableData) {

	function loadData(saveAndAdd) {
		$.each(forms, function (_, item) {
			//item.beginUpdate();
			if (saveAndAdd) {
				item.option('formData', tableData);
			}
			item.on("fieldDataChanged", fieldChanged);
			//item.endUpdate();
		});
		//setCustomEditorsValues = profile(setCustomEditorsValues);
		setCustomEditorsValues();
		$.each(forms, function (_, item) {
			//item.beginUpdate();
			doAllDependencies(item);
			//item.on("fieldDataChanged", fieldChanged);
			//item.endUpdate();
		});
	}

	function createForm() {
		var d = $.Deferred();
		if (form[0].formtype == 'tabs') {
			// Подготавливаем табы и контейнеры
			var tabs = [];
			$.each(form[0].items, function (index, value) {
				tabs.push({
					'title': saveString(value.title),
					'html': '<div id="' + idn + '-tab_' + index + '" class="myls-form-container"></div>'
				});
			});

			// Формируем табы
			var tabPanel = $("#" + idn).dxTabPanel({
				items: tabs,
				selectedIndex: 0,
				repaintChangesOnly: true,
				showNavButtons: true,
				onTitleClick: function (e) {
					// Формируем содержимое таба только тогда, когда на него кликнули (исключая формы, их генерируем сразу)
					var itemIndex = e.component.option('selectedIndex');
					var tabId = idn + '-tab_' + itemIndex;
					if ($('#' + tabId).children().length === 0)
						processTab(form[0].items[itemIndex], tabId, form[0].items[itemIndex].tabcontent, itemIndex);
				}
			}).dxTabPanel('instance');
			// Заполняем только первый таб, остальые сделаются по нажатию
			//Заполняем табы
			$.each(form[0].items, function (index, value) {
				tabPanel.option('selectedIndex', index);
				var tabId = idn + '-tab_' + index;

				// Генерируем только формы и первый таб, все табы, заполненные объектами, генерируем только при нажатии на соответтвующий таб
				if (value.tabcontent == 'form' || index === 0)
					processTab(value, tabId, value.tabcontent, index);
			});
			tabPanel.option('selectedIndex', 0);

			//processTab(form[0].items[0], idn + '-tab_0', form[0].items[0].tabcontent, 0);
		} else {
			processTab(form[0], idn, 'form', null);
		}

		d.resolve();
		return d;
	}

	function processTab(form, tabId, tabcontent, tabIndex) {
		// console.log(form, tabId, tabcontent);
		if (tabcontent == 'object') {
			var column = getColumnByField(columns, form.items[0].dataField);
			var idx = getIdn(column.tableId, tableData[column.extField], form.items[0].objectType, 'popup');

			//ищем на странице объект с таким же idx и если есть - меняем idx
			if ($("#" + tabId).is("#" + idx)) {
				var i = 0;
				while (i < 10) {
					if (!$("#" + tabId).is("#" + idx + i)) {
						idx = idx + i;
						break;
					}
					i++;
				}
			}

			$("#" + tabId).append('<div id="' + idx + '" class="gridContainer"></div><div id="' + idx + '-context-menu" class="context-menu"></div><div id="' + idx + '-loadpanel"></div>');

			$.when(initObject(column.tableId, tableData[column.extField], 'popup', form.items[0].objectType, 'sel', addHistory(column.extTargetField ? column.extTargetField : column.extField, tableData[column.extField], idn, tHistory, initialMode), [], 'compact')).done(function (obj) {
				arrObjects.push(obj);
				//console.log(arrObjects);
			});
		}

		if (tabcontent == 'form') {

			// debugger
			$("#" + tabId).append('<div id="' + tabId + '-scroll"></div>');
			$("#" + tabId + '-scroll').append('<div id="' + tabId + '-scroll_content"></div>');
			//var saveBtn = $("#" + idn + "_save-button").dxButton('instance');
			var addForm = $("#" + tabId + '-scroll_content').dxForm({
				items: [],
				formData: tableData,
				readOnly: false,
				showColonAfterLabel: true,
				labelLocation: "top",
				colCount: 1,
				onDisposing: function (e) {

				},
			}).dxForm("instance");
			addForm.mylsInit = true;
			addForm.mylsTab = tabIndex;
			// Обрабатываем предварительно форматы и шаблоны
			//addForm.beginUpdate();
			if (form.items !== undefined) {
				processFormItemsFormats(form.items, "", addForm);
				processFormItemsTemplates(form.items, tabId, addForm);
			}
			addForm.option("items", form.items);
			//addForm.endUpdate();

			forms.push(addForm);

			var scrollViewWidget = $("#" + tabId + '-scroll').dxScrollView({
				scrollByContent: true,
				scrollByThumb: true,
				showScrollbar: "onScroll",
			}).dxScrollView("instance");
		}

	}

	function processFormItemsTemplates(form, tabId, formObj) {
		$.each(form, function (key, item) {
			// for (var key in form) {
			//var item = form[key];
			if (item.hasOwnProperty("label") && item.label.hasOwnProperty("text") && item.label.text == '')
				item.label.visible = false;

			if (item.hasOwnProperty("objectType")) {
				//item.name = item.dataField;
				var objectTypes = ['grid', 'tree', 'cards', 'documents', 'dashboard', 'scheduler', 'chart', 'pivot'];
				if (objectTypes.indexOf(item.objectType) != -1) {
					item.template = function (itemData, itemElement) {
						$.when(tData).done(function () {
							var column = getColumnByField(columns, itemData.dataField);
							if (column !== undefined) {
								var ext_id = /*formObj.option('formData')*/tableData[column.extField];
								var tableId = column.tableId;
								var idnObject = getIdn(tableId, ext_id, item.objectType, 'popup');

								itemElement.append('<div id="' + idnObject + '" class="gridContainer gridInForm"></div><div id="' + idnObject + '-context-menu" class="context-menu"></div><div id="' + idnObject + '-loadpanel"></div>');

								if (item.hasOwnProperty("height")) {
									$('#' + idnObject).css("height", item.height);
								}

								initObject(tableId, ext_id, "popup", item.objectType, 'sel', addHistory(column.extTargetField ? column.extTargetField : column.extField, ext_id, idn, tHistory, initialMode), [], 'compact');
							}
						});

					};
				}
				if (item.objectType == 'image') {
					item.template = function (itemData, itemElement) {
						//console.log('!!image template');
						var idn = tabId + '_' + item.dataField + '_image';
						var currentImg = '';
						if (itemData.editorOptions.value) {
							currentImg = '<img class="myls-form-image" src="files/' + itemData.editorOptions.value + '" /><div id="' + idn + '-buttonDeleteImg"></div>';
						}
						var column = getColumnByField(columns, itemData.dataField);
						column.objectType = "image";
						itemElement.append('<div id="' + idn + '"  class="myls-form-image-container" myls-field="' + item.dataField + '">' + currentImg + '<div id="' + tabId + '_' + item.dataField + '_fileuploader"></div><div id="selected-files"></div></div>');
						column.editor = $("#" + tabId + '_' + item.dataField + '_fileuploader').dxFileUploader({
							multiple: false,
							accept: "image/*",
							uploadMode: "instantly",
							uploadUrl: "/form/uploadimage?field=" + idn,
							name: idn,
							showFileList: false,
							onUploaded: function (e) {
								var filename = $.parseJSON(e.request.response);
								if (filename !== '') {
									removeImg(idn);
									currentImg = '<img class="myls-form-image" src="files/' + filename + '" /><div id="' + idn + '-buttonDeleteImg"></div>';
									//currentImg.attr('myls-field') = filename;
									$('#' + idn).prepend(currentImg);
									$('#' + idn + '-buttonDeleteImg').dxButton({
										icon: "clear",
										onClick: function () {
											tableData[$('#' + idn).attr('myls-field')] = null;
											removeImg(idn);
										}
									});
									tableData[$('#' + idn).attr('myls-field')] = filename;
								}
							},
						}).dxFileUploader("instance");
						if (itemData.editorOptions.value !== '') {
							$('#' + idn + '-buttonDeleteImg').dxButton({
								icon: "clear",
								onClick: function () {
									tableData[column.dataField] = null;
									removeImg(idn);
								}
							});
						}
					};
				}
				if (item.objectType == 'treeview') {
					item.template = function (itemData, itemElement) {
						var column = getColumnByField(columns, itemData.dataField);
						if (column !== undefined) {
							var idnf = tabId + '_' + itemData.dataField + '_treeview';
							itemElement.append('<div id="' + idnf + '" class="myls-treeView"></div>');

							initTreeView(idnf, column);
						}
					};
				}
				if (item.objectType == 'colorbox') {
					item.template = function (itemData, itemElement) {
						var column = getColumnByField(columns, itemData.dataField);
						if (column !== undefined) {
							column.customEditor = true;
							var idnf = tabId + '_' + itemData.dataField + '_colorbox';
							var value = (tableData[column.dataField] == null) ? '' : tableData[column.dataField];
							itemElement.append('<input id="' + idnf + '" class="myls-colorbox" type="text" value="' + value + '" />');
							var palette = [];
							for (var i = 20; i <= 90; i += 8) {
								var p = [];
								$.each(['hsl 5 99', 'hsl 21 98', 'hsl 36 98', 'hsl 47 97', 'hsl 60 99', 'hsl 73 67', 'hsl 95 56', 'hsl 197 49', 'hsl 224 99', 'hsl 251 71', 'hsl 286 99', 'hsl 334 81'], function (index, item) {
									p.push(item + ' ' + i);
								});
								palette.push(p);
							}
							column.editor = $('#' + idnf);
							$('#' + idnf).spectrum({
								showPalette: true,
								allowEmpty: true,
								//showInput: true,
								showSelectionPalette: true, // true by default
								//palette: ['hsl 5 99', '#FC600A', '#FB9902', '#FCCC1A', '#FEFE33', '#B2D732', '#66B032', '#347C98', '#0247FE', '#4424D6', '#8601AF', '#C21460'],
								maxSelectionSize: 22,
								//chooseText: saveString("Ок"),
								//cancelText: saveString("Отмена"),
								palette: palette,
								change: function (color) {
									column.changed = true;
									if (color)
										tableData[column.dataField] = color.toHexString();
									else
										tableData[column.dataField] = null;
									if (saveBtn)
										saveBtn.option('disabled', false);
								}
							});
						}
					};
				}
				if (item.objectType == 'tagbox') {
					item.template = function (itemData, itemElement) {
						var column = getColumnByField(columns, itemData.dataField);
						if (column !== undefined) {
							var ext_id = tableData[column.extField];
							var tableId = column.id;
							//var idnf = getIdn(tableId, ext_id, item.objectType, 'popup');
							var idnf = tabId + '_' + itemData.dataField + '_tagbox';
							itemElement.append('<div id="' + idnf + '" class="tagBox"></div>');
							initTagBox(idnf, column, item, formObj);
						}
					};
				}
				if (item.objectType == 'buttongroup') {
					item.template = function (itemData, itemElement) {
						var column = getColumnByField(columns, itemData.dataField);
						if (column !== undefined) {
							var ext_id = tableData[column.extField];
							var tableId = column.id;
							//var idnf = getIdn(tableId, ext_id, item.objectType, 'popup');
							var idnf = tabId + '_' + itemData.dataField + '_buttongroup';
							itemElement.append('<div id="' + idnf + '" class="buttonGroup"></div>');

							//initTagBox(idnf, column, item);
							initButtonGroup(idnf, column, item);
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
						initButton(itemElement, null, item);
					};
				}
			}
			if (item.hasOwnProperty("items"))
				processFormItemsTemplates(item.items, tabId, formObj);
		});
	}

	function removeImg(idn) {
		$('#' + idn + ' .myls-form-image').remove();
		$('#' + idn + '-buttonDeleteImg').remove();
	}

	function openFormDependencies(column, item) {
		if (!column) return;
		if (column.visibleCondition)
			$.when(doConditionPromise(column.visibleCondition, columns, tableData, tHistory, deps)).done(function (result) {
				item.visible = result;
				column.toClear = !result;
				doAfterOpenFormDependencies(column, item);
			});
		else {
			column.toClear = false;
			doAfterOpenFormDependencies(column, item);
		}

	}

	function doAfterOpenFormDependencies(column, item) {
		if (column.caption && !column.toClear && column.caption[0] == '=')
			doCaptionDependenciesField(column, column.dataField, item, null, null, columns, tableData, tHistory, deps);
		var allRules = {};
		if (!column.toClear) {
			item.validationRules = getValidationRules(column);
			if (item.validationRules.length) {
				doRequireDependencies(column, allRules, null, column.dataField, columns, tableData, tHistory, deps);
				doRestrictions(column, allRules, null, column.dataField, columns, tableData, tHistory, deps);
				$.each(allRules, function (index, citem) {
					item.validationRules = citem;
					column.validationRules = citem;
				});
			}
		}
	}

	function processFormItemsFormats(form, path, formObj) {
		var curPath = path;
		saveTranslateForm(form);
		$.each(form, function (key, it) {
			if (form[key].hasOwnProperty("items")) {
				//debugger
				if (form[key].itemType && form[key].itemType == 'group') {
					form[key].name = create_UUID();
					curPath = path + form[key].name + '.';
				}
			} else if (form[key].hasOwnProperty("editorType") || form[key].hasOwnProperty("objectType")) {
				var column = getColumnByField(columns, form[key].dataField);
				openFormDependencies(column, form[key]);
				if (column && path)
					column.path = path;
				if (form[key].hasOwnProperty("editorType")) {
					form[key].editorOptions.readOnly = !column.allowEditing;

					if (form[key].editorType == 'dxTextBox') {
						//console.log(column);
						if (column.pattern && tableData[column.dataField] != '' && tableData[column.dataField] != null) {
							if (!form[key].editorOptions.buttons)
								form[key].editorOptions.buttons = [];
							addButtons(form[key].editorOptions.buttons, ['clear', getButtonLink(column, tableData[column.dataField]), addMagicButton(column)]);
						}
						form[key].editorOptions.onInitialized = function (e) {
							initializeEditor(e, column, form[key]);
						};
						form[key].editorOptions.onDisposing = function (e) {
							disposeEditor(e, column, form[key]);
						};
						form[key].editorOptions.onValueChanged = function (e) {
							setPatternButtons(column, e);
						};
					}
					if (form[key].editorType == 'dxNumberBox') {

						form[key].editorOptions.onInitialized = function (e) {
							initializeEditor(e, column, form[key]);
							var buttons = [];
							addButtons(buttons, ['clear', addMagicButton(column)]);
							e.component.option('buttons', buttons);
						};
						form[key].editorOptions.onDisposing = function (e) {
							disposeEditor(e, column, form[key]);
						};
						if (column.format.precision !== undefined && column.format.precision != "0") {
							// if (form[key].editorOptions.format === undefined)
							form[key].editorOptions.format = '#,##0';
							form[key].editorOptions.format += '.' + '0'.repeat(column.format.precision);
						}
						if (column.format.precision === undefined || column.format.precision == "0") {
							form[key].editorOptions.format = '#,##0';
						}
						if (column.format.postCaption !== undefined) {
							form[key].editorOptions.format += column.format.postCaption;
						}
						/*form[key].editorOptions.onValueChanged = function (e) {

						}*/
					}

					if (form[key].editorType == 'dxRadioGroup') {
						//    var column = getColumnByField(columns, form[key].dataField);
						if (column !== undefined) {
							if (column.id !== undefined && column.id !== null) {
								initRadioGroup(form[key], column, formObj);
							}
						}
					}
					if (form[key].editorType == 'dxSelectBox') {
						//  var column = getColumnByField(columns, form[key].dataField);
						if (column !== undefined) {
							if (column.id !== undefined && column.id !== null) {
								initSelectBox(form[key], column, formObj);
							}
						}
					}
					if (form[key].editorType == 'dxLookup') {
						form[key].editorType = 'dxSelectBox';
						if (column !== undefined) {
							if (column.id !== undefined && column.id !== null) {
								initLookup(form[key], column, formObj);
							}
						}
					}
					if (form[key].editorType == 'dxTagBox') {
						//     var column = getColumnByField(columns, form[key].dataField);
						if (column !== undefined) {
							if (column.id !== undefined && column.id !== null) {
								//initTagBox(form[key], column);
								form[key].name = column.dataField;
							}
						}
					}
					if (form[key].editorType == 'dxDateBox') {
						form[key].editorOptions.onInitialized = function (e) {
							initializeEditor(e, column, form[key]);
						};
						form[key].editorOptions.onDisposing = function (e) {
							disposeEditor(e, column, form[key]);
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
				processFormItemsFormats(form[key].items, curPath, formObj);
			}
		});
	}

	function addNewLookupItem(e, column, searchText) {
		//var itemsLookup = e.component.option('items');
		//var searchText = e.component.option("text").trim();
		//var isFind = findInDataSource(searchText, itemsLookup);

		if (searchText != '' && column.canAdd) {
			var myDialog = initConfirmDialog(saveString('Добавить новое значение') + ' "' + searchText + '"?', saveString('Новое значение'), 'myls-msg-info', saveString('Да'), saveString('Нет'));
			myDialog.done(function () {
				//if (dialogResult == true) {
				var values = {'item': searchText};

				if (column.extFormId) {
					// Добавление через форму
					var formId = column.extFormId;
					if (column.extFormId[0] == '=')
						formId = doCondition(column.extFormId, columns, tableData, tHistory);
					var params = {};

					if (column.extFormField) {
						var formField = column.extFormField;
						if (column.extFormField[0] == '=') {
							formField = doCondition(column.extFormField, columns, tableData, tHistory);
						}
						// debugger
						params = getExtFormParams(formField, searchText);
						//params[formField] = searchText;
					}

					$.when(openPopup(formId, -1, 'form', 'ins', addHistory(column.dataField, -1, idn, tHistory, 'ins'), params)).done(function (id) {
						reloadPopup(column);
						column.editor.option("value", id);
					}).fail(function () {
					});
				} else {
					// Просто добавление
					if (column.insertConditions && column.insertConditions.length > 1) {
						$.each(column.insertConditions, function (_, item) {
							if (item !== 'item') {
								values[item] = getFieldValue(item, tableData, columns, tHistory);
							}
						});
					}
					$.ajax({
						type: "post",
						cache: false,
						url: "/form/insertlookup",
						data: ({'id': column.id, 'params': values}),
						success: function (data) {
							//console.log(column);
							var res = $.parseJSON(data);
							if (Object.keys(res).length !== 0) {
								reloadPopup(column);
								if (e.component.NAME == 'dxSelectBox') {
									e.component.option("value", res[Object.keys(res)[0]]);
								} else {
									var opt = e.component.option("value");
									opt.push(res[Object.keys(res)[0]]);
									e.component.option("value", opt);
								}
								e.component.close();
							}
						}
					});
				}

				e.component.close();
				//} else {
				//e.component.close();
				//}
			}).fail(function (error) {
				//initMoreButton(e, column);
				e.component.option("value", null);
				e.component.close();
			});
		}
		/*
	   } else {
		   //такое значение уже есть
		   e.component.option('value', itemsLookup[isFind].id);
		   e.component.close();
	   }
	   */

	}

	function initLookup(item, column, form) {
		item.editorOptions.dataSource = initLookupDataSource(column, tableData, columns, tHistory, form, deps);
		item.editorOptions.showPopupTitle = false;
		if (item.grouped) {
			item.editorOptions.grouped = true;
			item.editorOptions.dataSource.group = "category";
		}
		item.editorOptions.dropDownButtonTemplate = function (data, element) {
			var $loadIndicator = $("<div>").dxLoadIndicator({visible: false}),
				$dropDownButton = $("<div>", {
					class: "dx-dropdowneditor-icon"
				});
			$(element).append($loadIndicator, $dropDownButton);
			column.loadIndicator = $loadIndicator.dxLoadIndicator('instance');
			column.dropDownButton = $dropDownButton;
		};
		if (column.template) {
			item.editorOptions.itemTemplate = function (data) {
				return getFormattedCellValue(null, column, columns, data, idn);
			};
		}
		item.editorOptions.closeOnOutsideClick = true;
		item.editorOptions.showClearButton = true;
		item.editorOptions.displayExpr = 'item';
		item.editorOptions.buttons = ['clear', 'dropDown'];
		item.editorOptions.searchExpr = 'item';
		item.editorOptions.searchEnabled = true;
		item.editorOptions.valueExpr = 'id';
		item.editorOptions.keyExpr = 'id';
		if (column.canAdd) {
			item.editorOptions.acceptCustomValue = true;
		}
		if (column.canAdd) {
			item.editorOptions.onInput = function (e) {
				//e.component.open();
				var currText = e.component.option("text").trim();
				var isFind = findInDataSource(currText, e.component.option('items'));
				if (currText && (isFind == -1)) {
					//$("#" + idn + "_" + column.id + "_linkadd").removeClass('hidden').text(saveString('Добавить') + ' "' + currText + '"');
					e.component.option('buttons', ['clear', addButtonAdd(e, column, currText), 'dropDown']);
				} else {
					//$("#" + idn + "_" + column.id + "_linkadd").removeClass('hidden').addClass('hidden').text('');
					initMoreButton(e, column);
				}
			};
			item.editorOptions.onCustomItemCreating = function (e) {
				if (!e.customItem) {
					e.customItem = e.text;
				}
				if (e.text) {
					var isFind = findInDataSource(e.text, e.component.option('items'));
					if (isFind == -1)
						addNewLookupItem(e, column, e.text);
				}
			};
		}
		item.editorOptions.onClosed = function (e) {
			//e.element.find('.searchBox.add-button').remove();
		};
		item.editorOptions.onInitialized = function (e) {
			initMoreButton(e, column);
			initializeEditor(e, column, item);
		};
		item.editorOptions.onDisposing = function (e) {
			disposeEditor(e, column, item);
		};
		item.editorOptions.onValueChanged = function (e) {
			initMoreButton(e, column);
		};
	}

	function initMoreButton(e, column) {
		if (column.extFormId) {
			var currValue = e.component.option('value');
			if (currValue) {
				e.component.option('buttons', ['clear', addButtonMore(e, column, currValue), 'dropDown']);
			} else {
				e.component.option('buttons', ['clear', 'dropDown']);
			}
		} else e.component.option('buttons', ['clear', 'dropDown']);
	}

	function initRadioGroup(item, column, form) {
		item.editorOptions.dataSource = initLookupDataSource(column, tableData, columns, tHistory, form, deps);
		item.editorOptions.displayExpr = 'item';
		item.editorOptions.onInitialized = function (e) {
			initializeEditor(e, column, item);
		};
		item.editorOptions.onDisposing = function (e) {
			disposeEditor(e, column, item);
		};
	}

	function initSelectBox(item, column, form) {
		item.editorOptions.dataSource = initLookupDataSource(column, tableData, columns, tHistory, form, deps);
		if (item.grouped) {
			item.editorOptions.grouped = true;
			item.editorOptions.dataSource.group = "category";
		}
		item.editorOptions.displayExpr = 'item';
		item.editorOptions.onInitialized = function (e) {
			initializeEditor(e, column, item);
		};
		item.editorOptions.onDisposing = function (e) {
			disposeEditor(e, column, item);
		};
		if (column.template) {
			item.editorOptions.itemTemplate = function (data) {
				return getFormattedCellValue(null, column, columns, data, idn);
			};
		}
	}

	function initButtonGroup(item, column) {
		column.customEditor = true;
		column.editor = $("#" + item).dxButtonGroup({
			items: [],
			keyExpr: "id",
			stylingMode: "outlined",
			selectionMode: "multiple",
			selectedItemKeys: [],
			onSelectionChanged: function (e) {
				column.changed = true;
				validateCustomEditor(e, column);
			},
			onInitialized: function (e) {
				initializeEditor(e, column, item);
			},
			onDisposing: function (e) {
				disposeEditor(e, column, item);
			}
		}).dxButtonGroup('instance');

		$.when(loadLookupData(column, tableData, columns, tHistory)).done(function (items) {
			$.each(items, function (index, el) {
				el.text = el.item;
			});
			if (!column.toClear)
				column.editor.option("items", items);
		});
	}

	function loadTagBoxValues(column) {
		var deferred = $.Deferred();
		var values = [];
		if (objectValues.hasOwnProperty(column.dataField)) {
			values = objectValues[column.dataField];
			deferred.resolve(values);
		} else {
			var options = initLookupValues(column, tableData);
			$.when(options).done(function (options) {
				$.each(options, function (index, item) {
					values.push(item.id);
				});
				column.oldValues = values.slice();
				deferred.resolve(values);
			});
		}
		return deferred;
	}

	function initTagBox(item, column, formItem, form) {
		column.customEditor = true;
		column.editor = $("#" + item).dxTagBox({
			dataSource: initLookupDataSource(column, tableData, columns, tHistory, form, deps),
			value: [],
			displayExpr: 'item',
			valueExpr: 'id',
			acceptCustomValue: column.canAdd,
			searchEnabled: true,
			showSelectionControls: true,
			onOpened: function (e) {

				var toolbarItems = [];
				toolbarItems.push({
					location: "center",
					toolbar: "bottom",
					html: '<span class="myls-lookup-cancel">' + saveString("Закрыть") + '</span></div>',
					onClick: function (el) {
						e.component.option('text', '');
						e.component.close();
					}
				});
				if (column.canAdd) {
					toolbarItems.push(
						{
							location: "before",
							toolbar: "bottom",
							html: '<span class="myls-lookup-addnewvalue hidden" id="' + idn + '_' + column.id + '_linkadd"></span>',
							onClick: function (el) {
								//console.log(searchBox.option("value").trim());
								addNewLookupItem(e, column, e.component.option('text').toString().trim());
							}
						});
				}
				e.component._popup.option("toolbarItems", toolbarItems);

			},
			onKeyUp: function (e) {

				if (column.canAdd) {
					//console.log(e.component.option('value'));
					var currText = e.component.option('text').toString().trim();
					var isFind = findInDataSource(currText, e.component.option('items'));
					if (currText && (isFind == -1)) {
						$("#" + idn + "_" + column.id + "_linkadd").removeClass('hidden').text(saveString('Добавить "') + currText + saveString('"'));
					} else {
						$("#" + idn + "_" + column.id + "_linkadd").removeClass('hidden').addClass('hidden').text('');
					}
				}
			},
			onClosed: function (e) {
				var buttonAdd = e.element.find('.searchTagBox');
				buttonAdd.remove();
			},
			onValueChanged: function (e) {
				column.changed = true;
				validateCustomEditor(e, column);
			},
			onInitialized: function (e) {
				initializeEditor(e, column, item);
			},
			onDisposing: function (e) {
				disposeEditor(e, column, item);
			},
			/*
			itemTemplate: function (data) {
				if (column.template) {
					return getFormattedCellValue(null, column, columns, data, idn);
				}
			}

			 */
		}).dxTagBox('instance');

		if (column.template) {
			column.editor.option('itemTemplate', function (data) {
				return getFormattedCellValue(null, column, columns, data, idn);
			});
		}
		if (formItem.grouped) {
			column.editor.option('grouped', true);
			column.editor.getDataSource().group("category");
		}
	}

	function updateTagBox(columns, tableData) {
		var result = [];
		$.each(columns, function (index, item) {
			if ((item.dataType == 'tagbox' || item.dataType == 'treeview' || item.dataType == 'buttongroup') && item.changed) {
				var params = {};
				params.id = item.id;
				params.ext_id = tableData[item.extField];
				if (item.oldValues === undefined) item.oldValues = [];
				params.oldValues = JSON.stringify(item.oldValues);
				if (item.dataType == 'buttongroup')
					params.values = JSON.stringify(item.editor.option('selectedItemKeys'));
				else
					params.values = JSON.stringify(item.editor.option('value'));
				result.push(setData('/form/updatetagbox', 'post', params));
			}
		});
		return result;
	}

	function initTreeView(item, column, form) {

		$.when(initLookupDataSource(column, tableData, columns, tHistory, form, deps), initLookupValues(column, tableData)).done(function (data, options) {

			var v = [];
			$.each(options, function (index, item) {
				v.push(item.id);
			});
			column.oldValues = v;
			//console.log(v);

			var syncTreeViewSelection = function (treeView, value) {
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
					var value = e.component.option("value");
					var treeview = $('<div id="' + item + '_treeview"></div>').dxTreeView({
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
							initializeEditor(e, column, item);
						},
						onDisposing: function (e) {
							disposeEditor(e, column, item);
						},
						onSelectionChanged: function (et) {
							column.changed = true;
							var tags = [];
							//var items = e.component._options.items;
							var items = et.component.option('items');
							//console.log(items);
							$.each(items, function (index, item) {
								if (item.selected == true) {
									tags.push(getCheckParent(items, index));
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
							validateCustomEditor(e, column);
						}
					});

					return treeview;
				}
			}).dxDropDownBox('instance');
		});
	}

	function saveAddBtnClick(e) {
		saveAndAdd = true;
		saveBtnClick(e);
	}

	function saveBtnClick(e) {
		$.when(save()).done(function () {
			refreshAndClose();
			formDeferred.resolve(ext_id);
		}).always(function () {
			disableButtons(false);
			saveAndAdd = false;
		});
	}

	function cancelBtnClick() {
		if (rawMode === 'updins') {
			$.when(processDelete(table, ext_id, idn)).done(function () {
				disposeForm();
			});
		} else
			disposeForm();
	}

	function disposeForm() {
		objects[idn].saveFunction = null;
		disposeObject(table, ext_id, 'form', 'popup');
	}

	function save() {
		var deferred = $.Deferred();
		if (!validate()) {
			deferred.reject();
		} else {
			disableButtons(true);
			var updateArr = createUpdatedValues();
			var currentValues = createAllValues(updateArr);

			// Проверяем введенные данные
			var check = checkData(tableInfo, currentValues, idn);
			$.when(check).done(function () {
				// Если все ок, то продолжаем сохранение формы
				//debugger
				var idn_popup = idn + '-popup';
				//var idn_popup = idn;
				var popup = $('#' + idn_popup).dxPopup("instance");

				$.when(saveFormData(updateArr, table, ext_id, mode, tHistory, popup)).done(function () {
					var uResult = updateTagBox(columns, tableData);
					var oResult = saveObjects();
					// Сохраняем данные всех тэгбоксов и других кастомных столбцов
					$.when.apply($, uResult, oResult).done(function () {

						// А теперь запускаем закрывающую процедуру
						var close = execCloseProc(tableInfo, currentValues, idn);
						$.when(close).done(function () {
							deferred.resolve();
						}).fail(function (error) {
							showError(idn, error);
							deferred.reject();
						});

					}).fail(function (error) {
						showError(idn, error);
						deferred.reject();
					});
					//сохраняем все несохраненные данные в гридах, которые редактировались
					/*
					$.when.apply($, oResult).done(function () {

					}).fail(function (error) {
						showError(idn, error);
						deferred.reject();
					});
					*/
					//deferred.resolve();
				}).fail(function (error) {
					showError(idn, error);
					deferred.reject();
				});
			}).fail(function () {
				deferred.reject();
			});
		}
		return deferred.promise();
	}

	function saveFormData(updateArr, table, ext_id, saveMode, tHistory, popup) {
		var deferred = $.Deferred();
		if (Object.keys(updateArr).length != 0) {
			//debugger
			// Отправляем данные на сервер
			var params = {};
			params.table = table;
			params.ext_id = ext_id;
			params.data = JSON.stringify(updateArr);
			params.type = saveMode;

			var updParams = 'updParams';
			if (mode == 'ins')
				updParams = 'insConParams';

			var update;
			if (tableInfo.hasOwnProperty(updParams) && tableInfo[updParams].length) {
				params.params = JSON.stringify(updateArr);
				update = setData('frame/updateproc', 'post', params);
			} else {
				params.data = JSON.stringify(updateArr);
				update = setData('frame/update', 'post', params);
			}

			//var update = setData('/form/update', 'post', params);
			$.when(update).done(function (data) {
				//deferred.resolve();
				$.when(processResult(data, idn)).done(function () {
					deferred.resolve();
				}).fail(function () {
					deferred.reject();
				});
				if (saveAndAdd) mode = 'ins';
				else
					mode = 'upd';
			}).fail(function (error) {
				showError(idn, error);
				deferred.reject();
			}).always(function () {
				disableButtons(false);
			});
		} else {
			deferred.resolve();
			disableButtons(false);
			//refreshAndClose();
		}
		return deferred.promise();
	}

	function refreshAndClose() {
		var refresh;
		var th = tHistory[tHistory.length - 1];
		if (th) {
			if (tableInfo.refreshAll || (th.refreashAll)) {
				refresh = refreshObject(getCurrentObj($("#" + th.idn), getType(th.idn)), getType(th.idn), true);
			} else {
				refresh = refreshRow(th.tableId, th.extId, getCurrentObj($("#" + th.idn), getType(th.idn)), th.idn, initialMode);
			}
		}

		if (popup && !saveAndAdd) {
			$.when(refresh).always(function () {
				disposeForm();
				popup.dispose();
				$(popup._$element).remove();
			});
		}
		if (saveAndAdd) {
			var data = getData('/form/tabledata', 'post', prepareTableData(table, -1, 'ins', null));
			$.when(data).done(function (data) {
				saveAndAdd = true;
				/*$.each(forms, function(index, item) {
					item.on("fieldDataChanged", null);
					item.resetValues();
					item.on("fieldDataChanged", fieldChanged);
				});*/
				clearObjectsValues();
				allTableData = data;
				tableData = data[0];
				rawData = afterLoad();
				loadData(true);
				saveAndAdd = false;
				disableButtons(false);
			});
		}
	}

	function disableButtons(disable) {
		if (saveBtn)
			saveBtn.option('disabled', disable);
		if (saveAddBtn)
			saveAddBtn.option('disabled', disable);
		if (cancelBtn)
			cancelBtn.option('disabled', disable);
		//if (popup)
		//     popup.option('disabled', disable);
	}

	function validate() {
		// Валидируем данные во всех формах
		var isValid = true;
		$.each(forms, function (index, value) {
			try {
				var validate = value.validate();
				if (!validate.isValid) {
					isValid = false;
					if (value.mylsTab !== null)
						$("#" + idn).dxTabPanel('instance').option("selectedIndex", value.mylsTab);
					return false;
				}
			} catch (e) {

			}
		});
		$.each(columns, function (index, item) {
			if (customFormObjects.indexOf(item.dataType) !== -1) {
				var iv = validateCustomEditor(item.editor, item);
				if (!iv)
					isValid = false;
			}
		});
		return isValid;
	}

	function createUpdatedValues() {
		// Создаем массив измененных значений только
		var updateArr = Object();

		var updParams = 'updParams';
		if (mode == 'ins')
			updParams = 'insConParams';

		// Если у таблицы специальный апдейт через процедуру, то собираем для него значения
		if (tableInfo.hasOwnProperty(updParams) && tableInfo[updParams].length) {
			$.each(tableInfo[updParams], function (_, item) {
				updateArr[item] = tableData[item];
			});
			updateArr['lang'] = config.lang;
			/*values = updValues;
			values['lang'] = config.lang;
			$.each(selParams, function (index, item) {
				values[index.substring(1)] = item;
			});*/
		} else
			$.each(rawData, function (index, value) {
				var column = getColumnByField(columns, index);
				if (value != tableData[index] && column.useColumn) {
					updateArr[index] = tableData[index];
					if (column.dataType == 'boolean') updateArr[index] = tableData[index] ? 1 : 0;
				}
				// Если столбец был скрыт зависимостями, то обнуляем его данные

				if (column && column.hasOwnProperty('toClear') && column.toClear && value) {
					if (column.dataType == 'boolean')
						updateArr[index] = 0;
					else
						updateArr[index] = null;
				}
			});

		if (mode == 'ins') {
			updateArr[allTableData.ext_field] = allTableData.ext_id;
			ext_id = allTableData.ext_id;

			// Проходим по истории и добавляем, если необходимо, внешние ключи
			var reverseHistory = tHistory.slice(0, tHistory.length - 1);
			$.each(reverseHistory.reverse(), function (index, item) {
				if (item.extField !== undefined && ((allTableData[0].hasOwnProperty(item.extField) && !tableInfo.hasOwnProperty(updParams)) || tableInfo.hasOwnProperty(updParams)) && /* !== undefined && tableData[item.extField] === null && */item.extId !== undefined) {
					// tableData[item.extField] = item.extId;
					updateArr[item.extField] = item.extId;
				}
			});
		}

		convertFromDateTimeColumns(updateArr, columns);
		solveFloatProblem(updateArr, columns);

		if (tableData.hasOwnProperty('manual_updated')) {
			updateArr['manual_updated'] = 1;
		}
		if (tableData.hasOwnProperty('user_id')) {
			updateArr['user_id'] = config.user_id;
		}
		return updateArr;
	}

	function createAllValues(updateArr) {
		// Создаем массив текущих значений, объединяя все данные из rawData и updateArr
		var currentValues = {};
		$.each(rawData, function (index, value) {
			currentValues[index] = !updateArr.hasOwnProperty(index) ? value : updateArr[index];
			var column = columns[index];
			if (column && column.dataType == 'boolean') currentValues[index] = currentValues[index] ? 1 : 0;
		});
		$.each(updateArr, function (index, value) {
			if (!currentValues.hasOwnProperty(index))
				currentValues[index] = updateArr[index];
			var column = columns[index];
			if (column && column.dataType == 'boolean') currentValues[index] = currentValues[index] ? 1 : 0;
		});
		if (mode == 'ins') {
			// Проходим по истории и добавляем, если необходимо, внешние ключи
			var reverseHistory = tHistory.slice(0, tHistory.length - 1);
			$.each(reverseHistory.reverse(), function (index, item) {
				if (item.extField !== undefined && /* !== undefined && tableData[item.extField] === null && */item.extId !== undefined) {
					// tableData[item.extField] = item.extId;
					currentValues[item.extField] = item.extId;
				}
			});
		}
		convertFromDateTimeColumns(currentValues, columns);
		// Плюс добавляем все tagbox
		$.each(columns, function (index, item) {
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

	function afterLoad() {
		//debugger;
		// Переводим все поля типа time и datetime в формат yyyy-MM-ddTHH:mm:ssZ
		convertDateTimeColumns(tableData, columns);

		var rawData = {};
		//Object.assign({}, tableData);
		$.each(columns, function (index, item) {
			if (tableData.hasOwnProperty(index))
				rawData[index] = tableData[index];
		});

		if (mode == 'ins') {
			// Заменяем -1 в истории на текущее значение ext_id при загрузке данных
			if (tHistory.length && /*tHistory[tHistory.length - 1].extId == -1 && */allTableData.ext_field == tHistory[tHistory.length - 1].extField) {
				tHistory[tHistory.length - 1].extId = allTableData.ext_id;
			}

			// Проходим по истории и добавляем, если необходимо, внешние ключи
			var reverseHistory = tHistory.slice(0, tHistory.length - 1);
			$.each(reverseHistory.reverse(), function (index, item) {
				if (item.extField !== undefined && tableData.hasOwnProperty(item.extField) && /* !== undefined && tableData[item.extField] === null && */item.extId !== undefined) {
					tableData[item.extField] = item.extId;
				}
			});

			// Проставляем значения по-умолчанию
			$.each(columns, function (index, item) {
				if (item.defaultValue !== undefined && item.defaultValue != null && item.defaultValue[0] != '=') {
					if (item.defaultValue[0] == ':') {
						tableData[item.dataField] = getConfigParams(item.defaultValue);
					} else if (item.dataType == 'lookup')
						tableData[item.dataField] = parseInt(item.defaultValue, 10);
					else
						tableData[item.dataField] = item.defaultValue;
				}
			});

			// Проставляем значения, пришедшие в параметрах
			$.each(params, function (index, item) {
				if (tableData.hasOwnProperty(index)) {
					if (columns[index].dataType == 'lookup')
						tableData[index] = parseInt(item, 10);
					else
						tableData[index] = item;
				}
			});
		}

		// Записываем все значения в столбцы
		if (!saveAndAdd)
			$.each(columns, function (index, item) {
				if (tableData.hasOwnProperty(item.dataField)) {
					item.value = tableData[item.dataField];
				}
			});

		return rawData;
	}

	function getObjectsValues() {
		//objectValues = {};
		$.each(columns, function (index, item) {
			if ((item.dataType == 'tagbox' || item.dataType == 'treeview') && item.editor) {
				objectValues[item.dataField] = item.editor.option('value');
			}
			if (item.dataType == 'buttongroup' && item.editor) {
				objectValues[item.dataField] = item.editor.option('selectedItemKeys');
			}
		});
	}

	function clearObjectsValues() {
		$.each(columns, function (index, item) {
			if ((item.dataType == 'tagbox' || item.dataType == 'treeview') && item.editor) {
				item.editor.option('value', []);
			}
			if (item.dataType == 'buttongroup' && item.editor) {
				item.editor.option('selectedItemKeys', []);
			}
		});
		objectValues = {};
	}

	function setObjectsValues() {
		$.each(columns, function (index, item) {
			if ((item.dataType == 'tagbox' || item.dataType == 'treeview')) {
				item.editor.option('value', objectValues[item.dataField]);
			}
			if (item.dataType == 'buttongroup' && item.editor) {
				item.editor.option('selectedItemKeys', objectValues[item.dataField]);
			}
		});
	}

	function addButtonAdd(e, column, currValue) {
		var btn = {
			location: "after",
			name: "Add",
			elementAttr: {
				class: "myls-editor-btn"
			},
			options: {
				//dataField: data,
				icon: "/img/insert.svg",
				onClick: function (el) {
					addNewLookupItem(e, column, currValue);
					el.element.remove();
				}
			}
		};
		return btn;
	}

	function addButtonMore(e, column, currValue) {
		var btn = {
			location: "after",
			name: "More",
			elementAttr: {
				class: "myls-editor-btn"
			},
			options: {
				//dataField: data,
				icon: 'more',
				onClick: function (el) {
					//console.log(currValue);
					var formId = column.extFormId;
					if (column.extFormId[0] == '=')
						formId = doCondition(column.extFormId, columns, tableData, tHistory);
					var params = {};
					if (column.extFormField) {
						params = getExtFormParams(column.extFormField);
					}
					$.when(openPopup(formId, currValue, 'form', 'upd', addHistory(column.dataField, currValue, idn, tHistory, 'upd'))).done(function () {
						reloadPopup(column);
					}).fail(function () {
					});
				}
			}
		};
		return btn;
	}

	function reloadPopup(column) {
		var ds = column.editor.getDataSource();
		var store = ds.store();
		if (store)
			store.clearRawDataCache();
		column.dataParams = null;
		var reload = ds.load();

		$.when(reload).done(function () {
			column.editor.repaint();
			if (column.dependencies && column.dependencies.data)
				$.each(column.dependencies.data, function (index, field) {
					columns[field].dataParams = null;
				});
			doDependencies({component: column.form}, column.dataField, null, mode, columns, tableData, tHistory, deps);
		});
	}

	function getExtFormParams(extFormField, searchText) {
		var params = {};
		var re = /\s*,\s*/;
		var parts = extFormField.split(re);
		$.each(parts, function (index, item) {
			var re = /\s*=>\s*/;
			var fields = item.split(re);
			if (fields.length == 2) {
				params[fields[1]] = tableData[fields[0]];
			}
			if (fields.length == 1) {
				params[fields[0]] = searchText;
			}
		});
		return params;
	}

	function initializeEditor(e, column, item) {
		column.editor = e.component;
		//console.log(column.dataField, 'initialized');
		/*if (column.required && !column.editor.option('placeholder') && item.label.text) {
			column.editor.option('placeholder', item.label.text);
		}*/
	}

	function disposeEditor(e, column, item) {
		column.editor = null;
		//console.log(column.dataField, '------------');
		/*if (column.required && !column.editor.option('placeholder') && item.label.text) {
			column.editor.option('placeholder', item.label.text);
		}*/
	}

	function validateCustomEditor(e, column) {
		var isValid = true;
		if (!column || !e) return isValid;
		if (column.toClear) return true;
		if (column.required) {
			if (column.required[0] != '=' || (column.required[0] == '=' && !doCondition(column.required, columns, tableData, tHistory))) {
				var isEmpty = false;
				var component = (e.component) ? e.component : e;
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
						validationError: {message: saveString("Поле необходимо заполнить")},
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

	saveFileTranslate();

	/* }
 ).fail(function (error) {
	 showError(idn, error);
	 formDeferred.reject();
 });*/

	function setPopupTitle() {
		var idn_popup = idn + '-popup';
		//var idn_popup = idn;
		popup = $('#' + idn_popup).dxPopup("instance");
		if (popup) {
			// Заголовок формы
			if (tableInfo.titleField && tableData[tableInfo.titleField]) {
				var title = popup.option("title");
				title += ' ' + tableData[tableInfo.titleField];
				popup.option("title", title);
			}
			addBottomTab(popup);
		}
	}

	function setPopup() {
		var idn_popup = idn + '-popup';
		//var idn_popup = idn;
		popup = $('#' + idn_popup).dxPopup("instance");
		if (popup) {
			if (form[0].width) {
				popup.option("width", form[0].width);
			}
			if (form[0].height) {
				popup.option("height", form[0].height);
			}
			if (tableInfo.name) {
				var title = saveString(tableInfo.name);
				popup.option("title", title);
			}

			var infoBtn = $("#" + idn + "_info-button").dxButton({
				onClick: function (e) {
					window.open(e.component.linkOut);
				}
			}).dxButton('instance');
			if (!tableInfo.description) {
				infoBtn.option("visible", false);
			} else {
				infoBtn.linkOut = tableInfo.description;
				/*infoTooltip.option('contentTemplate', function (e) {
					var scrollIdn = idn + '_info-button_scroll';
					var template = '<div id="' + scrollIdn + '"><div id="' + scrollIdn + '-scroll_conent">' + tableInfo.description + '</div></div>';
					e.append(template);

					$('#' + scrollIdn).dxScrollView({
						scrollByContent: true,
						scrollByThumb: true,
						showScrollbar: "onScroll"
					});
				});*/
			}
		}

	}

	function setCustomEditorsValues() {
		$.each(columns, function (_, item) {
			if (item.editor) {
				if (item.dataType == 'tagbox' || item.dataType == 'buttongroup') {
					$.when(loadTagBoxValues(item)).done(function (values) {
						setCustomEditorsValue(item, values);
					});
				}
				/*if (item.objectType == 'image') {
					item.editor.option("value", [tableData[item.dataField]]);
				}*/
			}
		});
	}

	function showFormButtons() {
		// Кнопка сохранения
		saveBtn = $("#" + idn + "_save-button").dxButton('instance');
		saveAddBtn = $("#" + idn + "_saveadd-button").dxButton('instance');
		cancelBtn = $("#" + idn + "_cancel-button").dxButton('instance');

		if (saveBtn !== undefined) {
			saveBtn.on('click', saveBtnClick);
		}
		if (saveAddBtn !== undefined && mode == 'ins') {
			saveAddBtn.on('click', saveAddBtnClick);
		}
		if (cancelBtn !== undefined) {
			cancelBtn.on('click', cancelBtnClick);
		}
	}

	function fieldChanged(e) {
		getObjectsValues();
		removeFromDeps(e.dataField, deps);
		if (columns[e.dataField].value != e.value) {
			columns[e.dataField].editMode = 'edit';
			doDependencies(e, e.dataField, e.value, 'edit', columns, tableData, tHistory, deps);
		}
		disableButtons(false);
		columns[e.dataField].value = e.value;
	}

	function doAllDependencies(form) {
		$.each(columns, function (index, item) {
			item.form = form;
			item.editMode = (mode == 'ins' || mode == 'updins' ? 'ins' : 'open');
			if (item.dependencies) {
				/*if (item.dependencies.hasOwnProperty('data') && item.dependencies.data.length)
					doDataDependencies(item, {component: form}, tableData[index], columns, tableData, tHistory, deps);*/
				if (item.dependencies['caption'] && item.dependencies.caption.length)
					doCaptionDependencies(item, {component: form}, tableData[index], columns, tableData, tHistory, deps);
				if (item.editMode !== 'open' && item.dependencies.hasOwnProperty('value') && item.dependencies.value.length)
					//doValueDependenciesField(targetColumn, e, value, columns, tableData, tHistory, deps)
				doValueDependencies(item, {component: form}, tableData[index], columns, tableData, tHistory, deps);
			}
		});
	}

	function setAllPatterButtons() {
		$.each(columns, function (_, column) {
			if (column.pattern && column.editor && tableData[column.dataField])
				setPatternButtons(column, {component: column.editor});
		});
	}

	function setPatternButtons(column, e) {
		var buttons = ['clear'];
		var value = tableData[column.dataField];
		//e.component.option('value')
		if (column.pattern && value) {
			//проверить поле на соответствие паттерну
			var cuttPattern = '';
			switch (column.pattern) {
				case 'email':
					cuttPattern = patterns.mail_form;
					break;
				case 'phone':
					cuttPattern = patterns.phone_form;
					break;
				case 'url':
					cuttPattern = patterns.url_form;
					break;
			}
			if (cuttPattern) {
				var currRes = cuttPattern.test(value);
				if (currRes && cuttPattern != '') {
					buttons.push(getButtonLink(column, value));
				}
			}
		}
		addButtons(buttons, [addMagicButton(column)]);
		e.component.option('buttons', buttons);
	}

	function saveObjects() {
		var result = [];
		$.each(arrObjects, function (index, item) {
			if (item.saveFunction) {
				result.push(item.saveFunction());
			}
		});
		return result;
	}

	function initButton(item, column, form) {
		//debugger
		//column.customEditor = true;
		$(item).dxButton({
			stylingMode: "outlined",
			text: form.caption,
			type: "default",
			elementAttr: {
				class: "myls-form-button" + (form.cssClass ? " " + form.cssClass : '')
			},
			onClick: function () {
				if (form.openForm && form.openForm.tableId) {
					$.when(save()).done(function () {
						if (form.openForm.extId) {
							$.when(doConditionPromise(form.openForm.extId, columns, tableData, tHistory, deps)).done(function (extId) {
								if (extId)
									openPopup(form.openForm.tableId, extId, 'form', 'updins', addHistory(null, extId, idn, tHistory, 'upd'));
								else {
									showError(idn, saveString(form.openForm.errorMsg));
								}
								//initObject(form.openObject.tableId, extId, "popup", form.openObject.objectType, 'sel', tHistory, [], 'compact');
							});
						}
					});
				}
				if (form.openReport && form.openReport.reportId) {
					$.when(save()).done(function () {
						var params = {};
						if (form.openReport.params) {
							$.each(form.openReport.params, function (index, param) {
								params[index] = doCondition('=' + param, columns, tableData, tHistory);
							});
						}
						var data = {};
						data['id'] = form.openReport.reportId;
						data['params'] = params;
						//setData('/site/pdf', 'post', data);
						window.location.href = '/site/pdf?id='+form.openReport.reportId+'&params='+JSON.stringify(params);
						//window.open('/site/pdf?id=' + form.openReport.reportId + '&params=' + JSON.stringify(params));
					});
				}
			}
		});
	}

	return formDeferred;
}

function initFormEditor(table) {
	var formDeferred = $.Deferred();
	//append('<div id="' + grid + '" class="gridContainer"></div><div id="' + grid + '-context-menu" class="context-menu"></div><div id="' + grid + '-loadpanel"></div>');
	initForm(table, '', 'tab', 'setup', []);
	return formDeferred;
}

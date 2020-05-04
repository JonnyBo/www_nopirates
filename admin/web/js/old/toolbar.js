//инициализация тулбара
// items - набор элементов
// toolbar - данные об представлении для вывода соотв. элементов
function initToolbar(toolbar, items, options, table, ext_id, type, tHistory, columns, view = 'tab') {
//    var items = toolbar.toolbarOptions.items;
	//console.log(toolbar);

	// кнопка Добавить
	filterObjects[table] = [];
	//console.log(filterObjects);
	var isEdit = false;

	if (type == 'grid' || type == 'tree') {
		var obj = getCurrentObj(toolbar, type);
		isEdit = obj.option('editing').mode == 'batch';
		obj.option('editing').useIcons = true;
		//|| obj.option('editing').allowAdding || obj.option('editing').allowDeleting;
	}
	let currentFilter = [];
	let element = false;
	if (type == 'chart' || type == 'dashboard') {
		var arrTypes = {
			'bar': 'dxChart',
			'area': 'dxChart',
			'doughnut': 'dxPieChart',
			'map': 'dxVectorMap',
			'funnel': 'dxFunnel'
		};
		//let typeChart = 'bar';
		element = 'dxChart';

		if (appInfo.tables[table].view != '') {
			//typeChart = appInfo.tables[table].view;
			element = arrTypes[appInfo.tables[table].view];
		}
	}
	if (options.a == 1 && !toolbarButtonExists(items, "buttonAdd")) {
		/*if (type == 'grid') {
			obj.option('editing').allowAdding = true;
		}*/
		items.push({
			widget: "dxButton",
			name: 'buttonAdd',
			locateInMenu: 'auto',
			options: {
				icon: "/img/insert.svg",
				elementAttr: {
					toolbarrole: "always",
					buttonrole: "add",
				},
				onClick: function (e) {
					//openTabFromMenu('#form-' + table, 'Test Form', 'form', ext_id);
					// openPopup(table, ext_id, 'form');
					e.event.stopPropagation();
					editRecord(options, -1, obj, type, 'ins', addHistory(options.idField, -1, options.idn, tHistory, 'ins'), table, columns);
				}
			},
			location: "before"
		});
	}
	// кнопка Редактировать
	if (options.e == 1 && !toolbarButtonExists(items, "buttonEdit") && type !== 'scheduler') {
		/*if (type == 'grid') {
			obj.option('editing').allowUpdating = true;
		}*/
		items.push({
			widget: "dxButton",
			name: 'buttonEdit',
			locateInMenu: 'auto',
			options: getEditBtnOptions(isEdit, options, type, tHistory, table, columns),
			location: "before"
		});
	}
	// кнопка Удалить
	if (options.d == 1 && type !== 'scheduler') {
		/*if (type == 'grid') {
			obj.option('editing').allowDeleting = true;
		}*/
		items.push({
			widget: "dxButton",
			name: 'buttonDelete',
			locateInMenu: 'auto',
			options: getDeleteBtnOptions(isEdit, type),
			location: "before"
		});
	}
	items.push({
		widget: "dxButton",
		name: 'buttonRefresh',
		locateInMenu: 'auto',
		options: {
			elementAttr: {
				toolbarrole: "always",
				buttonrole: "refresh",
			},
			icon: "/img/refresh.svg",
			visible: !isEdit,
			onClick: function (e) {
				var obj = getCurrentObj(e, type, element);
				refreshObject(obj, type, true);
			}
		},
		location: "before"
	});
	if (options.a == 1 && options.import !== undefined) {
		items.push({
			widget: "dxButton",
			name: 'buttonImport',
			locateInMenu: 'auto',
			options: {
				elementAttr: {
					toolbarrole: "always",
					buttonrole: "import",
				},
				//icon: "/img/refresh.svg",
				text: "Import",
				visible: !isEdit,
				onClick: function (e) {
					//открываем попап с полем ввода файла
					if (type == 'grid') {
						var obj = getCurrentObj(e, type);
						var idn = obj._$element.attr('id');
						//console.log(options);
						$("#" + idn).append('<div id="' + idn + '_popupContainer"></div>');
						$("#" + idn + '_popupContainer').append('<div id="' + idn + '_fileUploader"></div>');//добавляем fileupload
						if (options.import !== undefined) {
							$("#" + idn + '_popupContainer').append('<div id="' + idn + '_list"></div>');
							$("#" + idn + "_list").dxDataGrid({
								dataSource: options.import,
							});
						}
						$("#" + idn + '_popupContainer').append('<div id="' + idn + '_error"></div>');//добавляем поле длля ошибок
						var filename = '';
						var fileUploader = $('#' + idn + '_fileUploader').dxFileUploader({
							multiple: false,
							allowedFileExtensions: [".csv", ".xls", ".xlsx"],
							uploadMode: "instantly",
							uploadUrl: "frame/uploadfile?field=" + idn + '_fileUploader',
							name: idn + '_fileUploader',
							minFileSize: 10,
							onUploaded: function (e) {
								//console.log(e.file);
								var res = $.parseJSON(e.request.response);
								if (res == 'error') {
									$('#' + idn + '_error').html('<p class="error_str">' + saveString('Ошибка! Файл не загружен!') + '</p>');
								} else {
									filename = res;
									$('#' + idn + '_error').text('');
								}
							},
						}).dxFileUploader("instance");

						var popup = $('#' + idn + '_popupContainer').dxPopup({
							title: "Popup Title",
							onHidden: function (e) {
								//popup.dxPopup("instance").remove();
							},
							toolbarItems: [{
								//text: "Title",
								location: "after"
							}, {
								widget: "dxButton",
								toolbar: "bottom",
								location: "after",
								options: {
									text: saveString("Ok"),
									//elementAttr: { id: idn + '_save-button'},
									onClick: function (e) {
										//импортируем
										//console.log(e);
										//var fileUpl = $('#'+idn+'_fileUploader').dxFileUploader("instance");
										//var files = fileUpl.option('value');
										console.log(filename, table);
										if (filename !== '') {
											$.ajax({
												type: "POST",
												cache: false,
												url: "frame/importfromfiles",
												data: {files: filename, table_id: table},
												success: function (data) {
													//console.log(data);
													var res = $.parseJSON(data);
													if (res.type == 'error') {
														$('#' + idn + '_error').html(res.data);
													}
													if (res.type == 'success') {
														$('#' + idn + '_error').html(res.data);
													}
													//обновляем таблицу
													refreshObject(obj, type, false);
													//popup.dxPopup("instance").hide();
												}
											});
										} else {
											//нет файлов
											$('#' + idn + '_error').text('Нет файлов для импорта');
										}
									}
								}
							},
								{
									widget: "dxButton",
									toolbar: "bottom",
									location: "after",
									options: {
										text: saveString("Отмена"),
										onClick: function (e) {
											popup.dxPopup("instance").hide();
										}
									}
								}
							],
						});
						popup.dxPopup("instance").show();
					}

				}
			},
			location: "before"
		});
	}
	//кнопка Фильтр
	items.push({
		widget: "dxButton",
		name: 'buttonSearch',
		locateInMenu: 'auto',
		options: {
			elementAttr: {
				toolbarrole: "always",
				buttonrole: "search",
			},
			icon: "filter",
			//visible: !isEdit,
			onClick: function (e) {
				initSearch(e, type, columns, table);
			}
		},
		location: "before"
	});

	//кнопка Админского сохранения
	//------------------------------------------------------------------ Временно прикрыл, чтобы никто не нажал
	/*if (type == 'grid' || type == 'tree') {
		items.push({
			widget: "dxButton",
			name: 'buttonAdmin',
			locateInMenu: 'auto',
			options: {
				elementAttr: {
					toolbarrole: "always",
					buttonrole: "admin",
				},
				icon: "preferences",
				//visible: !isEdit,
				onClick: function (e) {
					let obj = getCurrentObj(e, type);
					let state = obj.state();
					prepareStorage(state);
					$.ajax({
						url: "frame/tablesetting",
						method: 'post',
						data: {'table': table, 'state': JSON.stringify(state)},
						//dataType: dataType,
						success: function (data) {
							console.log('ok');
						},
						fail: function (error) {
							console.log(error);
						}
					});
					//sendStorageRequest("storage", "json", "POST", state, table);
				}
			},
			location: "before"
		});
	}-----------------------------------------------------------------------------------------------------------*/

	let filterColumns = getColumnsByColumnType('filter', columns, false);
	let isLoadSelectBoxData = [];
	if(filterColumns.length > 0) {
		$.each(filterColumns, function (i, item) {
			isLoadSelectBoxData[item.dataField] = false;
			items.push({
				widget: "dxSelectBox",
				name: 'tableFilter',
				locateInMenu: 'auto',
				options: {
					dataSource: [],
					//width: 150,
					displayExpr: item.dataField,
					valueExpr: item.dataField,
					searchEnabled: true,
					showSelectionControls: false,
					placeholder: item.caption,
					showClearButton: false,
					buttons: ["clear", "dropDown"],
					//readOnly: true,
					onInitialized: function(e) {
						if (isLoadSelectBoxData[item.dataField] === false) {
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
							let itemData = getData('frame/get-filter-string-data', 'post', {
								table: table,
								field: item.dataField,
								extId: ext_id,
								selParams: objDataSource.selParams
							});

							$.when(itemData).done(function (data) {
								//console.log(data);
								isLoadSelectBoxData[item.dataField] = true;
								removeNullFromArray(data);
								data = removeEmptyFromArray(data);

								obj.beginUpdate();
								e.component.option('dataSource', data);
								if (requiredField(item)) {
									$.when(obj.getDataSource().load()).done(function () {
										if (data.length > 0) {
											if (e.component.option('value') == null) {
												e.component.option('value', data[0][item.dataField]);
											}
											e.component.option('value', data[0][item.dataField]);
										}
										obj.endUpdate();
									});
								} else {
									e.component.option('showClearButton', true);
									obj.endUpdate();
								}
							});
						}
					},
					onValueChanged: function(e) {
						if (requiredField(item)) {
							let selItems = e.component.option('items');
							if (selItems.length > 0) {
								if (e.component.option('value') == null) {
									e.component.option('value', selItems[0][item.dataField]);
								}
							}
						}
						selectValueChanged(e, type, item.dataField);
					}
				},
				location: "center"
			});
		});
	}

	let curDate = new Date();
	let date30 = new Date();
	date30.setDate(date30.getDate() - 30);

	if (options.selParams && findInArray('table_date', options.selParams) !== -1) {
		items.push({
			widget: "dxDateBox",
			name: 'tableDate',
			locateInMenu: 'auto',
			options: {
				/*elementAttr: {
					toolbarrole: "always",
					//buttonrole: "refresh",
				},*/
				showClearButton: true,
				width: 150,
				value: findInArray('end_date', options.selParams) !== -1 ? date30 : curDate,
				onValueChanged: function (e) {
					dateValueChanged(':table_date', e, type);
				}
			},
			location: "center"
		});
	}

//&mdash;

	if (options.selParams && findInArray('end_date', options.selParams) !== -1 && findInArray('table_date', options.selParams) !== -1) {
		items.push({
			text: " − ",
			location: "center"
		});
	}

	if (options.selParams && findInArray('end_date', options.selParams) !== -1) {
		items.push({
			widget: "dxDateBox",
			name: 'tableDate',
			locateInMenu: 'auto',
			options: {
				/*elementAttr: {
					toolbarrole: "always",
					//buttonrole: "refresh",
				},*/
				width: 150,
				value: curDate,
				showClearButton: true,
				onValueChanged: function (e) {
					dateValueChanged(':end_date', e, type);
				}
			},
			location: "center"
		});
	}

	function requiredField(item) {
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

	function selectValueChanged(e, type, field) {
		let obj = getCurrentObj(e, type, element);
		let idn = obj._$element.attr('id');
		let tableData = objects[idn].dataSource;
		let filter = [];
		//console.log(e.component.option('value'));
		//$("#" + idn + " [role=toolbar]").find
		//let currentToolbar = $("#" + idn + " [role=toolbar]").dxToolbar("instance");
		//let currentItems = currentToolbar.option('items');

		if (e.component.option('value') !== null) {
			//var out = [];
			//out.push([[field, 'like', e.component.option('value') + '%,'], 'or', [field, 'like', ', %' + e.component.option('value')], 'or', [field, 'containing', ', ' + e.component.option('value') + ','], 'or', [field, '=', e.component.option('value')]]);
			currentFilter[field] = [[field, 'like', e.component.option('value') + '%,'], 'or', [field, 'like', ', %' + e.component.option('value')], 'or', [field, 'containing', ', ' + e.component.option('value') + ','], 'or', [field, '=', e.component.option('value')]];
		} else {
			//currentFilter.splice(field, 1);
			delete currentFilter[field];
		}
		//console.log(currentFilter);

			let out = [];
			for (var prop in currentFilter) {
				if (out.length > 0 && currentFilter[prop].length > 0) {
					out.push('and');
				}
				//console.log(prop);
				if (currentFilter[prop].length > 0)
					out.push(currentFilter[prop]);
			}
			filter.push(out);

		if(filter[0].length == 0) {
			filter = null;
		}
        tableData.mylsFilter = filter;
		//console.log(filter);
		$.when(refreshObject(obj, type, true)).done(function () {

		});
	}

	function dateValueChanged(dateParam, e, type) {
		let obj = getCurrentObj(e, type);
		if (obj && obj.getDataSource()) {
			let ds = obj.getDataSource();
			if (!ds.selParams)
				ds.selParams = {};
			if (e.value)
				ds.selParams[dateParam] = convertFromDateTime(e.value).slice(0, 10);
			else
				ds.selParams[dateParam] = null;
			refreshObject(obj, type, false);
		}
	}

	function editMode(toolbar, type, items) {

		function exitFromEditing() {
			obj.beginUpdate();
			obj.option('editing', {
				mode: 'row'
			});
			obj.option("focusedRowEnabled", true);
			isEdit = false;
			editMode(toolbar, type, items);
			showEditButtons(type, obj, options, 'row');
			obj.endUpdate();
		}

		if (type == 'grid') {
			var tb = getToolbar(toolbar.element[0]);
			var obj = getCurrentObj(toolbar, type);
			var isEdit = obj.option('editing').mode == 'batch';

			//var isEdit = obj.option('editing').allowUpdating || obj.option('editing').allowAdding || obj.option('editing').allowDeleting;
			//toolbar.beginUpedate();

			$.each(items, function (index, item) {
				if (item.name == 'saveButton' || item.name == 'revertButton') {
					item.location = 'before';
					item.sortIndex = 20;
					//var onclick = item.options.onClick;
					tb.option("items[" + index + "].options.visible", isEdit);
					if (isEdit && item.hasNewOnClick === undefined) {
						item.hasNewOnClick = true;
						if (item.name == 'saveButton') {
							item.options.onClick = function (e) {
								obj.canFinishEdit = true;
								obj.saveEditData().done(function () {
									if (obj.canFinishEdit) {
										exitFromEditing();
										//tb.option("items").splice(index, 1);
									}
								});
							};
						}
						if (item.name == 'revertButton') {
							item.options.onClick = function (e) {
								obj.cancelEditData();
								exitFromEditing();
								//tb.option("items").splice(index, 1);
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
					if (tb !== undefined) {
						tb.option("items[" + index + "].options.visible", !isEdit);
						tb.option("items[" + index + "].options.sortIndex", index);
					} else {
						item.visible = !isEdit;
						item.sortIndex = index;
					}

				}
			});
		}
	}

	function getToolbar(e) {
		return $("#" + e.id + " [role=toolbar]").dxToolbar('instance');
	}

	function toolbarButtonExists(items, name) {
		$.each(items, function (index, item) {
			if (item.name == name) return true;
		});
		return false;
	}

	/* if (type == 'cards') {
		 items.push({
			 widget: "dxTextBox",
			 placeholder: "Search...",
			 location: "after"
		 });
	 }*/

	editMode(toolbar, type, items);

	//периодическое обновление данных
	/*setInterval(function () {
		refreshObject(obj, type, true, false);
	}, 60000);*/


}

function getEditBtnOptions(isEdit, options, type, tHistory, table, columns, idn) {
	return {
		elementAttr: {
			toolbarrole: "focused",
			buttonrole: "edit",
		},
		icon: "/img/edit.svg",
		visible: !isEdit,
		onClick: function (e) {
			e.event.stopPropagation();
			var ext_id = getCurrentId(e, type);
			var obj = getCurrentObj(e, type);
			if (type == 'scheduler') {
				ext_id = objects[idn].selectedId;
				obj = objects[idn].object;
			}
			editRecord(options, ext_id, obj, type, 'upd', addHistory(options.idField, ext_id, options.idn, tHistory, 'upd'), table, columns);
		}
	};
}

function getDeleteBtnOptions(isEdit, type, idn) {
	return {
		elementAttr: {
			toolbarrole: "focused",
			buttonrole: "delete",
		},
		visible: !isEdit,
		icon: "/img/delete.svg",
		onClick: function (e) {
			//проверка отмеченных строк
			e.event.stopPropagation();
			var keys = [];
			var id = getCurrentId(e, type);
			var obj = getCurrentObj(e, type);
			var oldText = '';

			if (type == 'scheduler') {
				id = objects[idn].selectedId;
				obj = objects[idn].object;
			}

			if (type == 'grid' || type == 'tree') {
				keys = getSelectedRows(e, type);
			}

			// Кнопка по-умолчанию для диалога для любой ситуации
			var params = [
				{
					text: saveString("Удалить текущую"),
					type: 'danger',
					stylingMode: 'outlined',
					tabIndex: 1,
					result: 1
				}];

			//текущая не совпадает с выделенной или несколько выделенных
			// Добавляем кнопку выбора выделенных строк
			if ((keys.length == 1 && id != keys[0]) || keys.length > 1) {
				params.push({
					text: saveString("Удалить отмеченные"),
					type: 'danger',
					tabIndex: 2,
					stylingMode: 'outlined',
					result: 2
				});
			}

			// Добавляем кнопку отмены
			params.push({
				text: saveString("Отменить"),
				type: 'default',
				stylingMode: 'outlined',
				tabIndex: 0,
				result: 0
			});

			var myDialog = initCustomDialog(saveString('Удаление'), saveString("Вы действительно хотите удалить запись(и)?"), params);
			myDialog.show().done(function (dialogResult) {
				myDialog.hide();

				// Если удаляем текущую, то заменяем ей массив строк для удаления
				if (dialogResult === 1) {
					keys = [id];
				}

				// Если не отмена, то вызываем функцию удаления
				if (dialogResult !== 0) {
					deleteRowById(obj, keys, type);
				}

			});
		}
	};
}

function setEnabledToolbar(obj, type) {
	var curId = getCurrentId(obj, type);
	var focused = curId == 0 || curId === undefined ? false : true;
	var element = getElement(obj);
	$.each(element.find('.dx-datagrid-header-panel .dx-toolbar [toolbarrole=always]'), function (index, item) {
		$(item).dxButton("instance").option("disabled", false);
	});
	$.each(element.find('.dx-datagrid-header-panel .dx-toolbar [toolbarrole=focused]'), function (index, item) {
		$(item).dxButton("instance").option("disabled", !focused);
	});
}

function saveDataIfInsert(mode, tHistory) {
	var deferred = $.Deferred();
	if (mode == 'ins' && tHistory.length > 1 && tHistory[tHistory.length - 2].mode == 'ins') {

		var idn = tHistory[tHistory.length - 2].idn;
		if (objects.hasOwnProperty(idn) && objects[idn].type == 'form' && objects[idn].hasOwnProperty('saveFunction')) {
			var myDialog = initConfirmDialog(saveString('Для корректной работы необходимо сохранить данные формы.<br>Продолжить?'), saveString('Подтвержение'), 'myls-msg-info', saveString('Да'), saveString('Нет'));
			myDialog.done(function () {
				$.when(objects[idn].saveFunction()).done(function () {
					deferred.resolve();
					tHistory[tHistory.length - 2].mode = 'upd';
				}).fail(function () {
					deferred.reject();
				});
			}).fail(function (error) {
				deferred.reject();
			});
		} else
			deferred.resolve();
	} else
		deferred.resolve();
	return deferred;
}

function editRecord(tableInfo, id, obj, view, mode, tHistory, table, columns, params) {
	// Если мы начинаем добавлять что-то в форме во внешнем объекте (грид, шедулер и тд) при этом форма тоже в insert,
	// мы обязаны сначала сохранить данные формы
	$.when(saveDataIfInsert(mode, tHistory)).done(function () {
		if (tableInfo.formId !== undefined && tableInfo.formId !== null)
			openPopup(tableInfo.formId, id, 'form', mode, tHistory);
		else {
			if (view == 'grid') {
				//переходим в режим редактирования строки
				obj.beginUpdate();
				showEditButtons(view, obj, tableInfo, 'batch');
				if (obj.option("editing").mode != 'batch') {
					obj.option('editing', {
						mode: "batch",
						selectTextOnEditStart: true,
						startEditAction: "click",
					});
					obj.option("focusedRowEnabled", false);
				}
				if (mode == 'ins') {
					var edata = getData('/grid/tabledata', 'post', prepareTableData(table, -1, 'ins', null));
					$.when(edata).done(function (data) {
						// Проставляем значения по-умолчанию
						$.each(columns['columns'], function (index, item) {
							if (item.defaultValue !== undefined && item.defaultValue != null && item.defaultValue[0] != '=') {
								if (item.defaultValue[0] == ':') {
									data[0][item.dataField] = getConfigParams(item.defaultValue);
								} else if (item.dataType == 'lookup')
									data[0][item.dataField] = parseInt(item.defaultValue, 10);
								else
									data[0][item.dataField] = item.defaultValue;
							}
						});

						if (params) {
							$.each(params, function (index, item) {
								if (item && data[0].hasOwnProperty(index)) {
									data[0][index] = item;
								}
							});
						}

						var newData = {};

						$.each(data[0], function (index, item) {
							if (item !== null)
								newData[index] = item;
						});
						//debugger

						obj.on('initNewRow', function (e) {
							e.data = newData;
						});
						obj.addRow();
					});
				}
				obj.endUpdate();
			}
		}
	});
}

function showEditButtons(type, obj, options, mode) {
	if (type == 'grid') {
		obj.option('editing').allowUpdating = mode == 'batch' && options.e == 1;
		obj.option('editing').allowAdding = mode == 'batch' && options.a == 1;
		obj.option('editing').allowDeleting = mode == 'batch' && options.d == 1;
	}
}
var patterns = {
	'phone': /((\+([0-9](\ |\-)?){11,15})|(([0-9](\ |\-)?){5,15}))(\ ?\#[0-9]{2,4})?/i,
	'phone_form': /^((\+([0-9](\ |\-)?){11,15})|(([0-9](\ |\-)?){5,15}))(\ ?\#[0-9]{2,4})?$/i,
	//'phone':/[\+]?\d{1,}?[(]?\d{2,}[)]?[-\s\.]?\d{1,}?[-\s\.]?\d{1,}[-\s\.]?\d{0,9}/gi,
	//'phone_form':/^[\+]?\d{1,}?[(]?\d{2,}[)]?[-\s\.]?\d{1,}?[-\s\.]?\d{1,}[-\s\.]?\d{0,9}$/gi,
	'mail': /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/i,
	'mail_form': /^([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)$/i,
	'url': /(?:(?:https?|ftp):\/\/)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/\S*)?/i,
	'url_form': /^(?:(?:https?|ftp):\/\/)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/\S*)?$/i
};

function contentReady(idn, e, type) {
	//closeLoadPanel(idn);
	if (type != 'scheduler')
		lockedObject(e.component);
	setEnabledToolbar(e, type);
}

function processDblClick(e, tableInfo, id, tHistory, view, columns) {
	var obj = getCurrentObj(e, view);
	editRecord(tableInfo, id, obj, view, 'upd', addHistory(tableInfo.idField, id, e.element.attr("id"), tHistory, 'upd'), null, columns);
}

function dblClick(e, tableInfo, id, tHistory, view, columns) {
	var component = e.component,
		prevClickTime = component.lastClickTime;

	component.lastClickTime = new Date();
	if (prevClickTime && (component.lastClickTime - prevClickTime < 300)) {
		//Double click code
		processDblClick(e, tableInfo, id, tHistory, view, columns);
		/*
		var obj = getCurrentObj(e, view);
		editRecord(tableInfo, id, obj, view, 'upd', addHistory(tableInfo.idField, id, e.element.attr("id"), tHistory), null, columns);
		//console.log('double click', e.key);
		*/
	}
}

















function getCurrentObj(e, type, viewChart) {
	var obj = '';
	var currentObj = '';
	var element = getElement(e);

	if (element.hasClass('gridContainer')) {
		obj = element;
	} else {
		obj = element.parents(".gridContainer");
		//debugger
		if (obj.length > 1)
			obj = $(obj[0]);
	}
	if (type == 'grid' || type == 'documents') {
		currentObj = obj.dxDataGrid('instance');
	}
	if (type == 'tree') {
		currentObj = obj.dxTreeList('instance');
	}
	if (type == 'cards' || type == 'draglist') {
		currentObj = obj.dxList('instance');
	}
	if (type == 'scheduler') {
		currentObj = obj.dxScheduler('instance');
	}
	if (type == 'pivot') {
		var pId = obj.attr('id');
		currentObj = $('#' + pId + '-pivotContainer').dxPivotGrid('instance');
	}
	if (type == 'chart') {
		switch (viewChart) {
			case 'dxVectorMap':
				currentObj = obj.dxVectorMap('instance');
				break;
			case 'dxChart':
				currentObj = obj.dxChart('instance');
				break;
			case 'dxPieChart':
				currentObj = obj.dxPieChart('instance');
				break;
			case 'dxFunnel':
				currentObj = obj.dxFunnel('instance');
				break;
		}
		//currentObj = obj.dxVectorMap('instance');
	}
	return currentObj;
}

function getElement(e) {
	var element = '';
	if (e.hasOwnProperty("element"))
		element = e.element;
	else if (e.hasOwnProperty("NAME"))
		element = e.element();
	else
		element = e;
	return element;
}

function refreshObject(obj, type, changesOnly, useLoadPanel=true) {
	var deferred = new $.Deferred;
	if (obj) {
		var idn = obj.element().attr('id');
		switch (obj.NAME) {
			case 'dxList':
				if (type == 'draglist') {
					$.when(obj.option("dataDS").reload()).done(function () {
						obj.reload();
						setEnabledToolbar(obj, type);
						deferred.resolve();
					}).fail(function(error) {
						closeLoadPanel(idn);
						showError(idn, error);
						deferred.reject();
					});
				} else {
					obj.reload();
					setEnabledToolbar(obj, type);
					deferred.resolve();
				}

				break;
			case 'dxScheduler':
			case 'dxPivotGrid':
				obj.getDataSource().reload().done(function () {
					if (useLoadPanel) {
						closeLoadPanel(idn);
						lockedObject(obj);
					}
					setEnabledToolbar(obj, type);
					deferred.resolve();
				}).fail(function (error) {
					if (useLoadPanel) {
						closeLoadPanel(idn);
					}
					showError(idn, error);
					deferred.reject();
				});
				break;
			case 'dxChart':
			case 'dxPieChart':
			case 'dxFunnel':
				obj.getDataSource().reload().done(function () {
					if (useLoadPanel) {
						closeLoadPanel(idn);
						lockedObject(obj);
					}
					setEnabledToolbar(obj, type);
					deferred.resolve();
				}).fail(function (error) {
					if (useLoadPanel) {
						closeLoadPanel(idn);
					}
					showError(idn, error);
					deferred.reject();
				});
				break;

			case 'dxVectorMap':
				/*
				obj.getDataSource().reload().done(function () {
					if (useLoadPanel) {
						closeLoadPanel(idn);
						lockObject(obj);
					}
					setEnabledToolbar(obj, type);
					deferred.resolve();
				}).fail(function (error) {
					if (useLoadPanel) {
						closeLoadPanel(idn);
					}
					showError(idn, error);
					deferred.reject();
				});

				 */
				var idn = obj._$element.attr('id');
				objects[idn].showReport(objects[idn].rNum);

				/*
				openLoadPanel(idn);
				var table = getTableId(idn);
				var columns = getTableColumns(table);
				var structureList = getTemplate(table);
				var series = [];
				$.each(getColumnsByColumnType('serie', columns.columns), function (index, item) {
					series.push({valueField: item.dataField, name: item.caption});
				});
				var elements = obj.getLayers()[0].getElements();
				var argument = getColumnByColumnType('argument', columns.columns).dataField;
				var mapData = getMapValues(argument, series[0].valueField, objects[idn].dataSource.items());
				console.log(mapData);
				var maxValue = getMapMax(mapData);
				var groupField = getGroupFields(maxValue);
				$.each(elements, function (_, el) {
					var name = el.attribute('name');
					el.attribute(argument, undefined);
					for (key in mapData) {
						if (name == key) {
							el.attribute(argument, mapData[key]);
						}
					}
				});
				//obj.option()
				obj.option("layers.colorGroups", groupField);
				if (useLoadPanel) {
					closeLoadPanel(idn);
				}
				*/
				break;

			default :
				if (useLoadPanel) {
					openLoadPanel(idn);
				}
				$.when(obj.refresh(changesOnly)).done(function () {
					if (useLoadPanel) {
						closeLoadPanel(idn);
						lockedObject(obj);
					}
					setEnabledToolbar(obj, type);
					deferred.resolve();
				}).fail(function (error) {
					if (useLoadPanel) {
						closeLoadPanel(idn);
					}
					deferred.reject();
					//showError(idn, error);
				});
		}
	}
	return deferred;
}



function lockedObject(obj, lock) {
	if (lock === null || lock === undefined) lock = false;
	obj.option('disabled', lock);
	// lockedToolbar(obj, lock);
}

function deleteRowById(obj, keys, type) {
	var pb = initProgressBar(keys.length, obj, function () {
		refreshObject(obj, type, true);
	});
	for (var i = 0; i < keys.length; i++) {
		obj.getDataSource().store().remove(keys[i]).done(function (key) {
			stepProgressBar(pb);
		}).fail(function (error) {
			//console.log(error);
			removeProgressBar(pb.element().attr('id'));
			lockedObject(obj, false);
			showError(obj.element().attr('id'), error);
		});
	}
}

function getColumnByField(columns, dataField) {
	// Пока делаю как заглушку
	if (columns.hasOwnProperty(dataField))
		return columns[dataField];
	/*for (var key in columns) {
		if (columns[key].dataField == dataField) {
			return columns[key];
		}
	}*/
}







function convertUrlToParam(url) {
	var url = url.replace(/#/g, '');
	var arrurl = url.split(/\-|\_/);
	return {'table': arrurl[1], 'ext_id': arrurl[2], 'type': arrurl[0], 'view': arrurl[3]};
}

function getType(idn) {
	return idn.split("-")[0];
}

function getTableId(idn) {
	return idn.split(/\-|\_/)[1];
}

function getSelParams(tableInfo) {
	var selParams = {};

	let curDate = new Date();
	let date30 = new Date();
	date30.setDate(date30.getDate() - 30);

	if (tableInfo.selParams) {
		$.each(tableInfo.selParams, function (_, item) {
			if (item == 'table_date' || item == 'end_date') {
				if (item == 'table_date' && findInArray('end_date', tableInfo.selParams) !== -1) {
					selParams[':' + item] = convertFromDateTime(date30).slice(0, 10);
				} else
					selParams[':' + item] = convertFromDateTime(curDate).slice(0, 10);
			} else
				selParams[':' + item] = null;

		});
	}
	return selParams;
}















function getParams(arr, tableData, columns, tHistory) {
	var params = {};
	for (var key in arr) {
		params[arr[key]] = getFieldValue(arr[key], tableData, columns, tHistory);
		//tableData[arr[key]];
	}
	return params;
}

function lookupAfterLoad(column, tableData, columns, tHistory, form, deps) {
	if (column.dataType !== 'lookup' || !column.loadPromise) return;

	/*if (column.loadIndicator && column.dropDownButton) {
		//column.dropDownButton.hide();
		//column.loadIndicator.option("visible", true);
	}*/

	var data = form ? form.option('formData') : tableData;
	$.when(column.loadPromise).done(function () {
		if (column.loadIndicator && column.dropDownButton) {
			column.dropDownButton.show();
			column.loadIndicator.option("visible", false);
		}

		if (column.editor) {
			var store = column.editor.getDataSource().store();
			$.when(store.byKey(tableData[column.dataField])).fail(function () {
				tableData[column.dataField] = null;
				column.editor.option('value', null);
			});
		}

		if (column.hasOwnProperty('dependencies')) {
			removeFromDeps(column.dataField, deps);
			//doDataDependencies(column, null, null, columns, data, tHistory, deps);
			// doVisibleDependencies(column, {component:form}, null, columns, form.option('formData'), tHistory);
			if (column.editMode == 'edit' || column.editMode == 'ins') {
				doValueDependencies(column, {component: form}, null, columns, form.option('formData'), tHistory, deps);
			}
		}
	});
}

function initLookupDataSource(column, tableData, columns, tHistory, form, deps, selParams) {
	return {
		paginate: false,
		store: new DevExpress.data.CustomStore({
				key: "id",
				loadMode: "raw",
				//cacheRawData:false,
				load: function (loadOptions) {
					if (column.toCache && colCaches[column.id]) {
						return colCaches[column.id];
					}
					else {
						var data = form ? form.option('formData') : tableData;
						var result = loadLookupData(column, data, columns, tHistory, selParams);
						column.loadPromise = result;
						if (column.loadIndicator && column.dropDownButton) {
							column.dropDownButton.hide();
							column.loadIndicator.option("visible", true);
						}
						lookupAfterLoad(column, tableData, columns, tHistory, form, deps);
						if (column.toCache && !colCaches[column.id]) {
							$.when(result).done(function(ldata) {
								colCaches[column.id] = ldata;
							});
						}
						return result;
					}
				},
			}
		)
	};
}

function loadLookupData(column, tableData, columns, tHistory, selParams) {
	var params = {};
	if (column.hasOwnProperty('dataConditions') && tableData)
		params = getParams(column.dataConditions, tableData, columns, tHistory);
	params.lang = config.lang;

	var params = {'id': column.id, 'params': params, 'selParams': selParams};
	var jpParams = JSON.stringify(params);

	// Не загружаем данные у лукапа и тэгбокса, если параметры не изменились /* или это первая загрузка и есть комплексная зависимость от другого выпадающего списка*/
	if ((column.dataType == 'lookup' || column.dataType == 'tagbox') && ((column.dataParams && column.dataParams == jpParams)/* || (!column.dataParams && cols && cols.length > 0)*/)) {
		return column.editor.getDataSource().items();
	} else {
		column.dataParams = jpParams;
		return getData('/form/getlookup', 'post', params);
	}
}

function initLookupValues(column, tableData) {
	var params = {};
	var v = [];

	if (column.hasOwnProperty('dependencies') && column.dependencies.hasOwnProperty('data') && tableData)
		params = getParams(column.dependencies.data, tableData);

	if (column.hasOwnProperty('extField'))
		params['ext_id'] = tableData[column.extField];

	params.lang = config.lang;
	params.company_id = config.company_id;
	return getData('/form/getlookupvalues', 'get', {'id': column.id, 'params': JSON.stringify(params)});
}

function initBottomToollbar(idn, total, selected) {
	$('#' + idn + ' .myls-bottom-toolbar').remove();
	$('#' + idn).append('<div class="myls-bottom-toolbar"></div>');
	var bToolbar = $('#' + idn + ' .myls-bottom-toolbar').dxToolbar({
		items: [{
			location: 'before',
			locateInMenu: 'never',
			template: function () {
				return $("<div class='toolbar-label' id='" + idn + "_totalCount'>" + saveString("Всего записей:") + ' ' + total + "</div>");
			}
		},
			{
				location: 'before',
				locateInMenu: 'never',
				visible: false,
				cssClass: 'myls-total-selected',
				template: function () {
					return $("<div class='toolbar-label' id='" + idn + "_totalSelected'>" + saveString("Всего выделено:") + ' ' + selected + "</div>");
				}
			}
		],
		//renderAs: 'bottomToolbar',
		//height: 50

	}).dxToolbar("instance");
}

function findInDataSource(text, items) {
	var isFind = -1;
	var searchText = text.trim();
	$.each(items, function (index, item) {
		if (item.item && item.item.trim().toLowerCase() == searchText.toLowerCase()) {
			isFind = index;
			return false;
		}
	});
	return isFind;
}

function findInArray(text, items) {
	var isFind = -1;
	var searchText = text.trim();
	$.each(items, function (index, item) {
		if (item.trim().toLowerCase() == searchText.toLowerCase()) {
			isFind = index;
			return false;
		}
	});
	return isFind;
}


















function addButtons(buttons, btnArr) {
	if (buttons) {
		$.each(btnArr, function (index, item) {
			if (item)
				buttons.push(item);
		});
	}
}

function getButtonLink(column, data) {
	var pref = '',
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

	var btn = {
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
						var pattern = /^((http|https|ftp):\/\/)/;
						var url = e.component.option('pref') + e.component.option('dataField');
						if (!pattern.test(url)) {
							url = "http://" + url;
						}
						window.open(url, '_blank');
					} else {
						window.location.href = e.component.option('pref') + e.component.option('dataField');
					}
					//console.log(e.component.option('pref') + e.component.option('dataField'));
				}
			}
		}
	};
	return btn;
}

function addMagicButton(column) {
	/*if (column.defaultValue && column.defaultValue[0] == '=')
		return {
			name: "magic",
			disabled: true,
			location: "after",
			elementAttr: {
				class: "myls-editor-btn"
			},
			options: {
				icon: "preferences",
			}
		};
	else*/
	return '';
}


function findValueByField(items, field, value) {
	var isFound = false;
	$.each(items, function (index, item) {
		if (item.hasOwnProperty(field) && item[field] == value) {
			isFound = true;

		}
	});
	return findValue;
}

function getObjectContainer(idx) {
	return '<div id="' + idx + '" class="gridContainer"></div><div id="' + idx + '-context-menu" class="context-menu"></div><div id="' + idx + '-loadpanel"></div>';
}

function reverseDataField(dataField) {
	return dataField.split("").reverse().join("");
}

function arrayUnique(arr) {
	var result = arr.filter(function (elem) {
		return elem != null;
	});
	return result.filter((e, i, a) => a.indexOf(e) == i);
}

function createArrayFromObject(ar) {
	var result = [];
	$.each(ar, function (_, item) {
		result.push(item);
	});
	return result;
}





function profile(func) {
	var wrapper = function () {
		var start = +new Date();
		var result = func.apply(null, arguments);
		console.log(func.name, +new Date() - start, "ms");
		return result;
	};
	return wrapper;
}

function getMapValues(country, value, data) {
	var result = [];
	$.each(data, function (index, item) {
		if (item[country] !== null) {
			if (result[item[country]]) {
				result[item[country]] += item[value];
			} else {
				result[item[country]] = item[value];
			}
		}
	});
	return result;
}

function getMapMax(mapData) {
	var values = [];
	for (key in mapData) {
		values.push(mapData[key]);
	}
	var maxValue = Math.floor(Math.max.apply(null, values));
	var digit = parseInt(maxValue.toString()[0]);
	return (digit + 1) * Math.pow(10, String(maxValue).length - 1);
}

function getGroupFields(maxValue) {
	if (maxValue < 10)
		maxValue = 10;
	var groupField = [];
	for (var i = 0; i <= maxValue; i = i + maxValue / 10) {
		groupField.push(parseInt(i));
	}
	return groupField;
}

function isDate(date) {
	const regex = /^\d{4}-\d{2}-\d{2}$/;
	return regex.exec(date) !== null;
}



function updateUrl(url) {
	var currentUrlParts = window.location.href.split("#");
	if (url !== currentUrlParts[1]) {
		//window.location.href = currentUrlParts[0] + url;
		window.location.hash = url;
	}
}

function clearUrl() {
	window.location.hash = '';
	//window.location.href = String(window.location.href).replace( /#/, "" );
	history.pushState("", document.title, window.location.pathname);
}

function getMaxPopupsZIndex() {
	var array = [];
	$(".dx-popup .dx-popup-wrapper").each(function () {
		array.push($(this).css("z-index"));
	});
	return Math.max.apply(Math, array);
}

function activatePopup(idn) {
	var popupInstance = $("#" + idn).dxPopup("instance");

	var animation = popupInstance.option('animation');
	popupInstance.option('animation', null);
	popupInstance.hide();
	popupInstance.show();
	$("#" + idn + " .dx-popup-normal").css('opacity', '1');
	popupInstance.option('animation', animation);
}

function prepareStorage(data) {
	if ('allowedPageSizes' in data)
		delete data['allowedPageSizes'];
	if ('filterPanel' in data)
		delete data['filterPanel'];
	if ('filterValue' in data)
		delete data['filterValue'];
	if ('pageIndex' in data)
		delete data['pageIndex'];
	if ('pageSize' in data)
		delete data['pageSize'];
	if ('focusedRowKey' in data)
		delete data['focusedRowKey'];
	if ('searchText' in data)
		delete data['searchText'];
	if ('selectedRowKeys' in data)
		delete data['selectedRowKeys'];
}

function removeNullFromArray(obj) {
	Object.keys(obj).forEach(function(key) {
		if (obj[key] && typeof obj[key] === 'object')
			removeNullFromArray(obj[key]);
		else if (obj[key] == null)
			delete obj[key];
		//if (key.length === 0)
		//	obj.splice(key, 1);
	});
	/*
	for (const [id, object] of obj.entries()) {
		if (Object.keys(object).length === 0) {
			obj.splice(id, 1);
		//break;
		}
	}

	 */
}
function removeEmptyFromArray(arr) {
	var newArray = [];
	for (var i = 0; i < arr.length; i++) {
		if (!$.isEmptyObject(arr[i])) {
			newArray.push(arr[i]);
		}
	}
	return newArray;
}
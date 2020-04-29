//инициализация основных данных
function initData(table, ext_id, objectType) {
	//получаем столбцы таблицы
	/*var tableColumns = getData('/' + objectType + '/getcols', 'get', {'table': table, 'extId': ext_id});
	//добавляем названия столбцов в файл переводов для текущей локали
	saveTranslateColumns(tableColumns);*/
	//получаем данные таблицы
	//var tableData = getData('/' + objectType + '/tabledata', 'get', {'id': table, 'extId': ext_id});
	//получаем контекстное меню таблицы
	//var contextMenuData = getData('/menu/getcontextmenu', 'get', {'id': table});
	//добавляем названия в файл переводов для текущей локали
	//saveTranslateContextMenu(contextMenuData);
	//получаем данные для тулбара
	var tableInfo = getTableInfo(table);
	var tableColumns = getTableColumns(table);
	var contextMenuData = getContextMenu(table);
	//добавляем названия в файл переводов для текущей локали
	//saveTranslateTableInfo(tableInfo);
	return {
		'tableColumns': tableColumns,
		//'tableData': tableData,
		'contextMenuData': contextMenuData,
		'tableInfo': tableInfo
	};
}

function cloneObject(obj) {
	return obj ? JSON.parse(JSON.stringify(obj)) : undefined;
}

function getTableInfo(tableId) {
	if (!appInfo.tables) {
		$.when(getAllTablesInfo()).done(function () {
			return cloneObject(appInfo.tables[tableId]);
		});
	} else
		return cloneObject(appInfo.tables[tableId]);
}

function getContextMenu(tableId) {
	if (!appInfo.contextMenu) {
		$.when(getAllContextMenu()).done(function () {
			return cloneObject(appInfo.contextMenu[tableId]);
		});
	} else
		return cloneObject(appInfo.contextMenu[tableId]);
}

function getTableColumns(tableId) {
	if (!appInfo.columns) {
		$.when(getAllColumns()).done(function () {
			return cloneObject(appInfo.columns[tableId]);
		});
	} else
		return cloneObject(appInfo.columns[tableId]);
}

function getTemplate(tableId) {
	if (!appInfo.templates) {
		$.when(getAllTemplates()).done(function () {
			return cloneObject(appInfo.templates[tableId]);
		});
	} else
		return cloneObject(appInfo.templates[tableId]);
}

function getAllTablesInfo() {
	var deferred = $.Deferred();
	if (!Object.keys(appInfo.tables).length) {
		var tableInfo = getData('/frame/getalltablesinfo', 'get', {});
		$.when(tableInfo).done(function (data) {
			appInfo.tables = data;
			//добавляем названия в файл переводов для текущей локали
			saveTranslateTableInfo(data);
			deferred.resolve();
		});
	}
	return deferred;
}

function getAllTemplates() {
	var deferred = $.Deferred();
	if (!Object.keys(appInfo.templates).length) {
		var templates = getData('/frame/getalltemplates', 'get', {});
		$.when(templates).done(function (data) {
			appInfo.templates = data;
			//добавляем названия в файл переводов для текущей локали
			saveTranslateTableInfo(data);
			deferred.resolve();
		});
	}
	return deferred;
}

function getAllContextMenu() {
	var deferred = $.Deferred();
	if (!Object.keys(appInfo.contextMenu).length) {
		var menus = getData('/menu/getallcontextmenu', 'get', {});
		$.when(menus).done(function (data) {
			//добавляем названия в файл переводов для текущей локали
			saveTranslateContextMenu(data);
			appInfo.contextMenu = data;
			deferred.resolve();
		});

	}
	return deferred;
}

function getAllColumns() {
	var deferred = $.Deferred();
	if (!Object.keys(appInfo.columns).length) {
		var columns = getData('/frame/getallcols', 'get', {});
		$.when(columns).done(function (data) {
			appInfo.columns = data;
			//console.log(appInfo);
			//добавляем названия в файл переводов для текущей локали
			saveTranslateColumns(data);
			deferred.resolve();
		});

	}
	return deferred;
}

//вывод загрузки
function openLoadPanel(idn) {
	//$("#"+idn).append('<div id="' + idn + '-loadpanel"></div>');
	var loadPanel = $('#' + idn + '-loadpanel').dxLoadPanel({
		//shadingColor: "rgba(0,0,0,0.4)",
		position: {
			of: "#" + idn,
			at: "center center"
		},
		visible: false,
		showIndicator: true,
		showPane: false,
		//shading: true,
		message: saveString('Загрузка'),
		container: '#' + idn + '-loadpanel',
		closeOnOutsideClick: false,
		indicatorSrc: "/img/loader.svg"
	}).dxLoadPanel("instance");
	if (loadPanel)
		loadPanel.show();
}

function closeLoadPanel(idn) {
	var loadPanel = $('#' + idn + '-loadpanel').dxLoadPanel().dxLoadPanel("instance");
	if (loadPanel)
		loadPanel.hide();
}

function closeAllLoadPanel(idn) {
	var loadPanel = $('.dx-loadpanel').dxLoadPanel().dxLoadPanel("instance");
	if (loadPanel)
		loadPanel.hide();
}

function initObject(table, ext_id, view, type, mode, tHistory, params, viewMode) {
	//console.log(tHistory);
	var deferred = $.Deferred();

	return deferred;if (!ext_id)
		ext_id = undefined;
	switch (type) {
		case 'dashboard':
			initDashboard(table, ext_id, view, mode, tHistory);
			deferred.resolve();
			break;

		case 'form':
			$.when(initForm(table, ext_id, view, mode, tHistory, params)).done(function (id) {
				deferred.resolve(id);
			}).fail(function () {
				deferred.reject();
			});
			break;

		case 'grid':
			$.when(initTable(table, ext_id, view, mode, tHistory, viewMode)).done(function (object) {
				deferred.resolve(object);
			}).fail(function () {
				deferred.reject();
			});
			break;

		case 'tree':
			$.when(initTree(table, ext_id, view, mode, tHistory)).done(function (object) {
				deferred.resolve(object);
			}).fail(function () {
				deferred.reject();
			});
			break;

		case 'cards':
			$.when(initCards(table, ext_id, view, mode, tHistory)).done(function (object) {
				deferred.resolve(object);
			}).fail(function () {
				deferred.reject();
			});
			break;

		case 'scheduler':
			$.when(initScheduler(table, ext_id, view, mode, tHistory)).done(function (object) {
				deferred.resolve(object);
			}).fail(function () {
				deferred.reject();
			});
			break;

		case 'documents':
			$.when(initDocuments(table, ext_id, view, mode, tHistory)).done(function (object) {
				deferred.resolve(object);
			}).fail(function () {
				deferred.reject();
			});
			break;

		case 'chart':
			$.when(initChart(table, ext_id, view, mode, tHistory, viewMode)).done(function (object) {
				deferred.resolve(object);
			}).fail(function () {
				deferred.reject();
			});
			break;
		case 'pivot':
			$.when(initPivot(table, ext_id, view, mode, tHistory)).done(function (object) {
				deferred.resolve(object);
			}).fail(function () {
				deferred.reject();
			});
			break;
		case 'kanban':
			$.when(initKanban(table, ext_id, view, mode, tHistory)).done(function (object) {
				deferred.resolve(object);
			}).fail(function () {
				deferred.reject();
			});
			break;
		case 'draglist':
			$.when(initDragList(table, ext_id, view, mode, tHistory)).done(function (object) {
				deferred.resolve(object);
			}).fail(function () {
				deferred.reject();
			});
			break;
	}
	setIsCompact();
}

function disposeObject(table, ext_id, view, type, mode, tHistory, params, viewMode) {
	var deferred = $.Deferred();
	var idn = getIdn(table, ext_id, type, view);
	$("#" + idn).remove();
	objects[idn] = null;
	if (type == 'dashboard') {
		//$('#' + idn).dxForm('dispose');
		deferred.resolve();
	}
	if (type == 'form') {
		//$('#' + idn).dxForm('dispose');
		deferred.resolve();
	}
	if (type == 'grid') {
		//disposeTable(table, ext_id, view, type);
		deferred.resolve();
	}
	if (type == 'tree') {
		//disposeTree(table, ext_id, view, type);
		deferred.resolve();
	}
	if (type == 'cards') {
		//disposeCards(table, ext_id, view, type);
		deferred.resolve();
	}
	if (type == 'scheduler') {
		//disposeSheduler(table, ext_id, view, type);
		deferred.resolve();
	}
	if (type == 'documents') {
		//disposeDocuments(table, ext_id, type, view);
		deferred.resolve();
	}
	if (type == 'chart') {
		//disposeCharts(table, ext_id, type, view);
		deferred.resolve();
	}
	if (type == 'pivot') {
		//disposePivot(table, ext_id, type, view);
		deferred.resolve();
	}
	if (type == 'kanban') {
		//$('#' + idn).dxDataGrid('dispose');
		deferred.resolve();
	}
	//setIsCompact();
	return deferred;
}

function openPopup(table, ext_id, type, mode, tHistory, params) {
	var deferred = $.Deferred();
	var view = 'popup';
	var idn = getIdn(table, ext_id, type, view);
	//console.log(idn);
	// Добавляем в попап scrollview, чтобы контент внутри прокручивался
	var $popupContainer = $("<div />").attr('id', idn).addClass("myls-form-container");

	var $popup = $('<div id="' + idn + '-popup"></div>');
	//var $popup = $('<div id="' + idn + '"></div>');
	var width = 0;//$(window).width() * 0.75;
	var height = 0
	;//$(window).height() * 0.75;
	if (type !== 'form') {
		$popupContainer.addClass('gridContainer');
		width = $(window).width() * 0.75;
		height = $(window).height() * 0.75;
	}
	var buttons = [];
	if (type == 'form') {
		buttons = [{
			//text: "Title",
			location: "after"
		}, {
			widget: "dxButton",
			toolbar: "bottom",
			location: "before",
			options: {
				text: "?",
				type: "normal",
				stylingMode: "outlined",
				elementAttr: {
					id: idn + '_info-button',
					class: "myls-info-btn"
				},
				onClick: function (e) {
					$("#info-tooltip").dxTooltip("show", '#' + idn + '_info-button');
				}
			}
		}, {
			widget: "dxButton",
			toolbar: "bottom",
			location: "after",
			options: {
				text: saveString("OK"),
				type: "success",
				stylingMode: "outlined",
				elementAttr: {id: idn + '_save-button'},
			}
		}];

		if (mode == 'ins') {
			buttons.push({
				widget: "dxButton",
				toolbar: "bottom",
				location: "after",
				options: {
					text: saveString('Сохранить и добавить'),
					type: "success",
					stylingMode: "outlined",
					elementAttr: {id: idn + '_saveadd-button'},
				}
			});
		}
		buttons.push({
			widget: "dxButton",
			toolbar: "bottom",
			location: "after",
			options: {
				text: saveString('Отмена'),
				type: "default",
				stylingMode: "outlined",
				elementAttr: {id: idn + '_cancel-button'},
				onClick: function (e) {
					$popup.remove();
					deferred.reject();
				}
			}
		});
	}
	buttons.push({
		widget: "dxButton",
		toolbar: "top",
		location: "after",
		options: {
			icon: "collapse",
			type: "normal",
			stylingMode: "text",
			elementAttr: {
				id: idn + 'collapse-button',
				class: "myls-collapse-btn"
			},
			onClick: function (e) {
				e.event.stopPropagation();
				var currentPopup = $popup.dxPopup("instance");
				currentPopup.hide();
				if ($('#bottomPopupTabs').length == 0) {
					createBottomTabs(currentPopup);
				}
				addBottomTab(currentPopup);
			}
		}
	});

	buttons.push({
		widget: "dxButton",
		toolbar: "top",
		location: "after",
		options: {
			icon: "fullscreen",
			type: "normal",
			stylingMode: "text",
			elementAttr: {
				id: idn + '_fullscreen-button',
				class: "myls-fullscreen-btn"
			},
			onClick: function (e) {
				if ($popup.dxPopup("instance").option('fullScreen')) {
					$popup.dxPopup("instance").option('fullScreen', false);
					//$popup.dxPopup("instance").option('maxHeight', '90%');
				} else {
					$popup.dxPopup("instance").option('fullScreen', true);
					//$popup.dxPopup("instance").option('maxHeight', '100%');
				}
			}
		}
	});

	buttons.push({
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
				$popup.remove();
				deferred.reject();
			}
		}
	});

	var popupOptions = {
		width: width,
		height: height,
		contentTemplate: function () {
			return $popupContainer;
		},
		onHidden: function (e) {
			//$popup.remove();
		},
		onDisposing: function (e) {
			//убираем соотв. вкладку
			closeBottomTab(e);
			//стираем из config.popups
			if (popupContent.length > 0) {
				$.each(popupContent, function (index, value) {
					if (value.id == table) {
						//disposeObject(value.id, value.ext_id, 'tabs', value.type);
						popupContent.splice(index, 1);
						return false;
					}
				});
				config.popups = popupContent;
				setSettings();
				clearUrl();
			}
		},
		toolbarItems: buttons,
		showTitle: true,
		title: saveString("Information"),
		visible: false,
		dragEnabled: true,
		closeOnOutsideClick: false,
		resizeEnabled: true,
		maxSize: "90%",
		maxHeight: "100%",
		showCloseButton: false,
		shading: false,
	};
	var isItem = false;
	if ($('#bottomPopupTabs').length > 0) {
		var bottomPopupTabs = $('#bottomPopupTabs').dxTabs('instance');
		var tabItems = bottomPopupTabs.option('items');
		$.each(tabItems, function (index, i) {
			if (i.id == idn || i.id == idn+'-popup') {
				isItem = index;
				return false;
			}
		});
	}
	if (isItem === false) {
		//console.log($('#' + idn + '-popup').length);
		if ($('#' + idn + '-popup').length === 0) {
			$('.app-container').after($popup);
			var popup = $popup.addClass("myls-form").dxPopup(popupOptions).dxPopup("instance");
			if (type !== 'form') {
				var tableInfo = getTableInfo(table);
				if (tableInfo.name) {
					var title = saveString(tableInfo.name);
					popup.option("title", title);
				}
			}
			popup.show();
			activatePopup(idn + '-popup');
			createBottomTabs(popup);

			if (ext_id !== -1) {
				var inPopup = false;
				if (popupContent.length > 0) {
					$.each(popupContent, function (index, item) {
						if (item.id == table && item.ext_id == ext_id) {
							inPopup = true;
							return false;
						}
					});
				}
				if (!inPopup) {
					/*
					popupContent.push({
						'title': popup.option('title'),
						'html': '<div id="' + idn + '-popup"><div id="' + idn + '-popup" class="myls-form-container"></div></div>',
						'id': table,
						'type': type,
						'ext_id': ext_id,
						'tHistory': JSON.stringify(tHistory)
					});

					 */
					if (type !== 'form') {
						addBottomTab(popup);
					}
					popupContent.push({
						'title': popup.option('title'),
						'html': '<div id="' + idn + '"><div id="' + idn + '" class="myls-form-container gridContainer"></div></div>',
						'id': table,
						'type': type,
						'ext_id': ext_id,
						'tHistory': JSON.stringify(tHistory)
					});
					config.popups = popupContent;
					setSettings();
				}
			}
			updateUrl(createUrl(type, table, ext_id, view));

			$.when(initObject(table, ext_id, view, type, mode, tHistory, params)).done(function (data) {
				deferred.resolve(data);
			}).fail(function () {
				deferred.reject();
			});
		}
	} else {
		$("#" + idn + '-popup').dxPopup("instance").show();
		bottomPopupTabs.option('selectedIndex', isItem);
	}

	return deferred.promise();
}

function createBottomTabs(currentPopup) {
	if ($('#bottomPopupTabs').length == 0) {
		$('#content').prepend('<div id="bottomPopupTabs" ></div>');
		$('#bottomPopupTabs');
		$("#bottomPopupTabs").dxTabs({
			/*
			dataSource: [{
				id: currentPopup.element().attr('id'),
				text: currentPopup.option('title'),
			}],
			selectedIndex: 0,

			 */
			noDataText: '',
			itemTemplate: function (itemData, itemIndex, element) {
				element.text(itemData.text);
				element.append($("<i>").addClass('dx-icon dx-icon-close').attr('data-tab', itemData.id));
			},
			onItemClick: function (e) {
				var idnPopup = e.itemData.id;

				$("#" + idnPopup).dxPopup("instance").show();
				activatePopup(idnPopup);
				idnPopup = idnPopup.replace('-popup', '');
				updateUrl(idnPopup);
			}
		}).dxTabs("instance");
	}
}

function addBottomTab(currentPopup) {
	var bottomPopupTabs = $('#bottomPopupTabs').dxTabs('instance');
	var tabItems = bottomPopupTabs.option('items');
	var isItem = false;
	$.each(tabItems, function (index, i) {
		if (i.id == currentPopup.element().attr('id')) {
			isItem = index;
			return false;
		}
	});
	if (isItem !== false) {
		bottomPopupTabs.option('selectedIndex', isItem);
	} else {
		tabItems.push({
			id: currentPopup.element().attr('id'),
			text: currentPopup.option('title'),
		});
		bottomPopupTabs.option('items', tabItems);
		bottomPopupTabs.option('selectedIndex', tabItems.length - 1);
	}
}

function closeBottomTab(e) {
	if ($('#bottomPopupTabs').length > 0) {
		var bottomPopupTabs = $('#bottomPopupTabs').dxTabs('instance');
		var tabItems = bottomPopupTabs.option('items');
		var isItem = false;
		$.each(tabItems, function (index, i) {
			if (i.id == e.element.attr('id')) {
				isItem = index;
				return false;
			}
		});
		if (isItem !== false) {
			tabItems.splice(isItem, 1);
			if (tabItems.length > 0) {
				bottomPopupTabs.option('items', tabItems);
			} else {
				$('#bottomPopupTabs').remove();
			}
		}
	}
}

function create_UUID() {
	var dt = new Date().getTime();
	var uuid = 'gxxxxxxxx'.replace(/[xy]/g, function (c) {
		var r = (dt + Math.random() * 16) % 16 | 0;
		dt = Math.floor(dt / 16);
		return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
	});
	return uuid;
}

function sendStorageRequest(storageKey, dataType, method, data, table, usedColumns) {
	var deferred = new $.Deferred;
	//console.log(JSON.stringify(storageKey));
	var storageRequestSettings = {
		url: "/site/" + storageKey,
		/*
		headers: {
			"Accept" : "text/html",
			"Content-Type" : "text/html"
		},
		*/
		method: method,
		dataType: dataType,
		success: function (data) {
			if (method == 'GET') {
				if (data.columns) {
					var columns = [];
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
			deferred.resolve(data);
		},
		fail: function (error) {
			deferred.reject();
		}
	};
	storageRequestSettings.data = {'table': table};
	if (data) {
		storageRequestSettings.data = {'table': table, 'data': JSON.stringify(data)};
	}
	//console.log(data);
	$.ajax(storageRequestSettings);
	return deferred.promise();
}

function setIsCompact() {
	//if ($(document).width() < 1400 || $(document).height() < 770) {
	$(".gridContainer").removeClass("mylscompactScreen");
	$(".gridContainer").addClass("mylscompactScreen");
	//} else {
	//	$(".gridContainer").removeClass("mylscompactScreen");
	//}
}

function openOldTabs() {
	var deferred = $.Deferred();
	if (config.tabs !== null && config.tabs !== undefined) {
		if (config.tabs.length > 0) {
			//console.log(config.tabs);
			$.each(config.tabs, function (index, item) {
				var tHistory = JSON.parse(item.tHistory);
				if (getTableInfo(item.id)) {
					var url = createUrl(item.type, item.id, item.ext_id, 'tab');
					openTabs(url, getTableInfo(item.id).name, item.type, item.ext_id, tHistory, true);
				}
			});
			if (config.selTabs !== undefined) {
				//console.log(config.selTabs);
				$("#tabpanel-container").dxTabPanel('instance').option("selectedIndex", config.selTabs);
				var url = createUrl(config.tabs[config.selTabs].type, config.tabs[config.selTabs].id, config.tabs[config.selTabs].ext_id, 'tab');
				//var url = config.tabs[config.selTabs].type + '-' + config.tabs[config.selTabs].id + (config.tabs[config.selTabs].ext_id ? '-' + config.tabs[config.selTabs].ext_id : '');
				updateUrl(url);
			}
		}
	}
	deferred.resolve();
	return deferred;
}

function openOldPopups() {
	var deferred = $.Deferred();
	if (config.popups !== null && config.popups !== undefined) {
		if (config.popups.length > 0) {
			//console.log(config.popups);
			$.each(config.popups, function (index, item) {
				var tHistory = JSON.parse(item.tHistory);
				//openTabs(item.type + '-' + item.id, item.title, item.type, item.ext_id, tHistory, true);
				if (getTableInfo(item.id))
					openPopup(item.id, item.ext_id, item.type, 'upd', tHistory);
			});
			/*
			if (config.selTabs !== undefined) {
				//console.log(config.selTabs);
				$("#tabpanel-container").dxTabPanel('instance').option("selectedIndex", config.selTabs);
				var url = config.tabs[config.selTabs].type + '-' + config.tabs[config.selTabs].id + (config.tabs[config.selTabs].ext_id ? '-' + config.tabs[config.selTabs].ext_id : '');
				updateUrl(url);
			}
			 */
		}
	}
	deferred.resolve();
	return deferred;
}

function getNotifications() {
	$.ajax({
		url: 'site/notifications',
		type: 'post',
		cache: false,
		//data: ({'file': file}),
		success: function (result) {
			var data = null;
			if (result != '')
				data = $.parseJSON(result);
			if (data && data > 0) {
				$('.myls-notifications .myls-count-notifications').text(data);
			} else
				$('.myls-notifications .myls-count-notifications').text("");
		}
	});
}

function openTabToHash(url) {
	//console.log(window.location.hash);
	//var url = window.location.hash;
	var grid = url.replace(/#/g, '');
	var arrurl = grid.split(/\-|\_/);
	var type = arrurl[0];
	var table = arrurl[1];
	var ext_id = arrurl[2];
	var objView = arrurl[3];
	if (arrurl[2] == 'popup' || arrurl[2] == 'tab') {
		ext_id = '';
		objView = arrurl[2];
	} else {
		ext_id = arrurl[2];
	}
	if (arrurl[2] == '' && arrurl[3] == 1) {
		ext_id = -1;
		objView = arrurl[4];
	}
	//console.log(arrurl);
	var tableInfo = getTableInfo(table);
	if (tableInfo) {
		var title = tableInfo.name;
		//console.log(ext_id);
		if (ext_id !== -1) {
			if (objView == 'popup') {
				//console.log(table, ext_id, type);
				openPopup(table, ext_id, type, 'upd', []);

			} else {
				//console.log(type + '-' + table + (ext_id ? '-' + ext_id : ''), title, type, ext_id);
				url = createUrl(type, table, ext_id, objView);
				//console.log(url);
				openTabs(url, title, type, ext_id, []);

			}
		}
	}
}

function resizeCards(item) {
	var width = $(item).width();
	for (var i = 12; i > 0; i--) {
		if (width >= 250 * i) {
			$(item).find(".dx-list-item").css('max-width', width / i + 'px');
			break;
		}
	}
}

function createPdf(id) {
	var params = {':id': 120};
	$.ajax({
		url: 'site/pdf',
		type: 'post',
		cache: false,
		//dataType: "html",
		data: ({'id': id, 'params': params}),
		success: function (result) {
			console.log(result);
		}
	});
}

function createUrl(type, table, ext_id, view) {
	if (ext_id === undefined || ext_id === '')
		ext_id = '';
	else
		ext_id = '-' + ext_id;
	return type + '-' + table + ext_id + '_' + view;
}

function issetFilterObject(table, column) {
	//console.log(filterObjects);
	//console.log(column);
	var result = false;
	for (var i = 0; i < filterObjects[table].length; i++) {
		if (filterObjects[table][i].column.dataField == column.dataField) {
			result = true;
			break;
		}
	}
	return result;
}

// Глобальные настройки
DevExpress.config({
	//thousandsSeparator: ' ',
	editorStylingMode: 'underlined'
});

//console.log(lang);
var panelContent = [],
	popupContent = [],
	objects = [],
	config = {lang: 'en', company_id: 1},
	popup = null,
	cntToolTip = 0,
	userAgent = detect.parse(navigator.userAgent),
	allowSaveSetting = false,
	colCaches = [],
	filterObjects = [];
//console.log(userAgent);
var tooltip = $('#tooltip').dxTooltip({
	//target: "#"+target,
	showEvent: "click",
	hideEvent: "dxdblclick",
}).dxTooltip("instance");

var infoTooltip = $('#info-tooltip').dxTooltip({
	width: "500px",
	height: "300px"
}).dxTooltip("instance");

var appInfo = {
	tables: {},
	columns: {},
	contextMenu: {},
	templates: {}
};

$(function () {
	openLoadPanel("main");
	var siteTranslate = getData("/site/loadtranslate", "json");
	var settings = getSettings();
	var menu = getData('/menu/getmenu', 'get');
	var quickActions = getData('/menu/getquickactions', 'get');
	var tables = getAllTablesInfo();
	var columns = getAllColumns();
	var cmenu = getAllContextMenu();
	var currentHash = '';
	//debugger
	/*
		setInterval(function()
		{
			console.log(objects);
		},30000);
	*/
	if (localStorage.getItem('currentHash')) {
		currentHash = localStorage.getItem('currentHash');
		localStorage.setItem('currentHash', '');
	}

	//отслеживаем изменение URL
	if (window.location.hash !== '') {
		currentHash = window.location.hash;
	}
	$.when(settings, siteTranslate).done(function (_, currTranslate) {
		DevExpress.localization.loadMessages(currTranslate);
		if (currTranslate != '') {
			translate = currTranslate;
		}

		function getInfo() {
			var pr = $.Deferred();
			$.when(tables, columns, cmenu).done(function () {
				pr.resolve();
			});
			return pr;
		}

		$.when(getInfo()).done(function () {
			$.when(getAllTemplates(), menu, quickActions).done(function (_, mainMenu, quickActions) {
				initMenu(mainMenu);
				initQuickActions(quickActions);
				saveFileTranslate();
				//console.log(appInfo);
				openOldTabs();
				openOldPopups();
				if (config.client_id) {
					getNotifications();
					setInterval(function () {
						getNotifications();
					}, 60000);
				} else {
					$('.myls-notifications').css('display', 'none');
				}

				//сохранение настроек
				setInterval(function () {
					saveSettings();
				}, 5000);

				//отслеживаем изменение URL
				$.when(openOldTabs(), openOldPopups()).done(function (tabs, popups) {
					//console.log(currentHash);
					if (currentHash !== '') {
						openTabToHash(currentHash);
					}
					//createPdf();
					/*
					$(window).on('hashchange', function (e) {
						if (window.location.hash !== '') {
							// Do smth
							console.log(window.location.hash);
							openTabToHash();
						}
					});
					 */
				});
			});
		});

	});

	DevExpress.ui.dxLoadIndicator.defaultOptions({
		options: {
			indicatorSrc: '/img/loader.svg'
		}
	});

	var autoComplete = "off";
	if (userAgent.browser.family == "Chrome")
		autoComplete = "new";
	if (userAgent.browser.family == "Safari")
		autoComplete = "false";

	DevExpress.ui.dxTextBox.defaultOptions({
		options: {
			onContentReady: function (info) {
				$(info.element).find("input").attr("autocomplete", autoComplete);
			},
		}
	});

	DevExpress.ui.dxSelectBox.defaultOptions({
		options: {
			onContentReady: function (info) {
				$(info.element).find("input").attr("autocomplete", "false");
			},
		}
	});

	//подсказки

	$(document.body).on('click', '.myls-tooltip', function () {
		var target = $(this).attr('id');
		var url = $(this).attr('data-href');
		var type = $(this).attr('data-type');
		var info = $(this).text();
		//var target = '';
		if (url.indexOf("tel:") == -1 && url.indexOf("mailto:") == -1)
			target = 'target="_blank"';
		tooltip.option('contentTemplate', '<a href="' + url + '" ' + target + '><i class="dx-icon-' + type + '"></i> ' + info + '</a>');
		tooltip.show('#' + target);
	});
	//открывать объекты по ссылке
	$(document.body).on('click', '.myls-open-object', function (e) {
		e.stopPropagation();
		openObjectLink(e.target);
	});

	function openObjectLink(e) {
		var table = $(e).attr('data-table');
		var id = $(e).attr('data-id');
		var ext_id = $(e).attr('data-ext-id');
		var type = $(e).attr('data-type');
		var view = $(e).attr('data-view');
		var mode = $(e).attr('data-mode');
		var title = $(e).attr('data-title');
		var parentIdn = $(e).attr('data-idn');
		if (mode == '' || mode == undefined) {
			mode = 'upd';
		}
		//addHistory(tableInfo.idField, id, e.element.attr("id"), tHistory, 'upd')

		if (objects[parentIdn])
			if (view == 'popup') {
				//
				openPopup(table, ext_id, type, mode, addHistory(objects[parentIdn].tableInfo.idField, id, parentIdn, objects[parentIdn].tHistory, 'updAll'), []);
			} else {
				//initObject(table, id, view, type, mode, [], []);
				openTabs(type + '-' + table + (ext_id ? '-' + ext_id : ''), title, type, ext_id, addHistory(objects[parentIdn].tableInfo.idField, id, parentIdn, objects[parentIdn].tHistory, 'upd'));
			}
	}

	//клик по пункту главного меню
	$(document.body).on('click', '.panel-list .dx-item-content a', function () {
		/*
		var url = $(this).attr('href');
		var type = $(this).attr('data-type');
		var title = $(this).text();
		var view = $(this).attr('data-view');
		var tHistory = [];
		if (view == 'popup') {
			var grid = url.replace(/#/g, '');
			var arrurl = grid.split('-');
			var table = arrurl[1];
			openPopup(table, undefined, type, 'upd', tHistory);

		}
		if (view == 'tab') {
			openTabs(url, title, type, undefined, tHistory);
		}
		 */
		var url = $(this).attr('href');
		openTabToHash(url);
	});

	//клик по popup
	$(document.body).on('click', '.dx-popup .dx-popup-title', function () {
		var idnPopup = $(this).parents(".dx-popup").attr('id');
		activatePopup(idnPopup);
		var bottomPopupTabs = $('#bottomPopupTabs').dxTabs('instance');
		var tabItems = bottomPopupTabs.option('items');
		$.each(tabItems, function (index, i) {
			//console.log(i);
			if (i.id == idnPopup) {
				bottomPopupTabs.option('selectedIndex', index);
				idnPopup = idnPopup.replace('-popup', '');
				updateUrl(idnPopup);
			}
		});
	});

	$.Color.fn.contrastColor = function () {
		var r = this._rgba[0], g = this._rgba[1], b = this._rgba[2];
		return (((r * 299) + (g * 587) + (b * 144)) / 1000) >= 131.5 ? "myls-color-black" : "myls-color-white";
	};

	$(window).resize(function (e) {
		// Проставляем компактность для таблиц
		setIsCompact();
	});
	//клик по крестику закрывающему нижний таб
	$(document.body).on('click', '#bottomPopupTabs .dx-item .dx-item-content .dx-icon-close', function () {
		var closeTab = $(this).attr('data-tab');
		$('#' + closeTab).dxPopup('instance').dispose();
	});

	// Меняем ширины карточек в зависимости от размера контейнера, а не окна
	$.each($(".gridContainer.dx-list"), function (_, item) {
		resizeCards(item);
	});

	//websocket
	/*
	var connect = new WebSocket('ws://localhost:8786');
	//var connect = new WebSocket('ws:echo.websocket.org');
	//$.when(conn).done(function (connect) {

		connect.onopen = function() {
			console.log("Соединение установлено.");
		};

		connect.onmessage = function(event) {
			var response = JSON.parse(event.data);
			console.log("Получены данные " + response.message);
			$('.myls-count-notifications').text(response.message);
			// по идее должно срабатывать в обеих браузерах если получен ответ.
		};

		connect.onerror = function(error) {
			console.log("Ошибка " + error.message);
		};
		*/
	/*
			setInterval(function () {
				var command = JSON.stringify({'action' : 'notifications', 'name' : 'Jonny'});
				//var command = JSON.stringify({'action' : 'chat', 'message' : 'test'});
				console.log("Отправлены данные " + command);
				//connect.send( JSON.stringify({'action' : 'chat', 'message' : 'Тестовое сообщение'}) );
				connect.send( command );
				//connect.send(command);
			}, 30000);
	*/
	//});

	//conn.onmessage;

});

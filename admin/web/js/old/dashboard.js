function initDashboard(table, ext_id, view, mode, tHistory) {
	var dashboard = 'dashboard';

	var idn = getIdn(table, ext_id, dashboard, view);
	var allowSaveStorage = false;
	var startData = initData(table, ext_id, dashboard);
	var templData = getTemplate(table);
	var storeFrames = sendStorageRequest("storage", "json", "GET", false, table, []);

	$.when(startData.tableColumns, startData.contextMenuData, startData.tableInfo, templData, storeFrames)
		.done(function (columns, menu, tableInfo, tableTpl, oldFrames) {
			//oldFrames = [];
			columns = columns.columns;
			var objList = [];
			var objFrames = [];
			var tableTpl = JSON.parse(tableTpl);
			createlayout();
			var frame = $('#' + idn + ' .myls-dashboard-layout');
			fillConfig(tableTpl, frame);
			//console.log(objList);
			//console.log(tableTpl);

			$.each(objList, function (index, m) {
				//createFrame(m.dataField);
				if (m.tableId) {
					var addidn = getIdn(m.tableId, ext_id, appInfo.tables[m.tableId].tableType, dashboard);
					$('#' + idn + '_' + m.dataField).append('<div id="' + addidn + '" class="myls-dashboard-item-inner"></div>');
					initObject(m.tableId, ext_id, dashboard, appInfo.tables[m.tableId].tableType, mode, tHistory);
				} else if (m.dataType == 'card') {
					$.when(loadLookupData(m, null, columns, tHistory)).done(function (tableData) {
						var template = getFormattedCellValue('', m, columns, tableData[0], idn);
						var $tpl = $(template);
						if ($tpl.find('object').length) {
							var field = $tpl.find('object').attr('fieldname');
							var idnObj = getIdn(columns[field].tableId, '', appInfo.tables[columns[field].tableId].tableType, dashboard);
							$tpl.find('object').attr("id", idnObj);//    append('<div id="' + idnObj + '" class="gridContainer"></div>');
							template = $tpl.get(0);
							//console.log(template);
						}
						$("#" + idn + '_' + m.dataField).append(template);
						if ($tpl.find('object').length) {
							//console.log(idnObj);
							initObject(columns[field].tableId, '', dashboard, appInfo.tables[columns[field].tableId].tableType, 'upd', [], [], 'compact');
						}
					});
				}
			});

			function createlayout() {
				$('#' + idn).append('<div class="myls-dashboard-layout" data-table="' + table + '"></div>');
				$('#' + idn).dxScrollView({
					direction: "vertical",
					//showScrollbar: "always"
				});

			}

			function createFrame(html, title, isClosable, dataField) {
				var out = '<div class="myls-frame" data-id="' + dataField + '">';
				out += '<div class="myls-frame-header">';
				out += '<div class="myls-frame-title">' + title;
				if (isClosable) {
					out += '<i class="dx-icon dx-icon-close" data-tab="' + dataField + '"></i>';
				}
				out += '</div>';
				out += '</div>';
				out += '<div class="myls-frame-body">' + html + '</div>';
				out += '</div>';
				return out;
			}

			function addFrame(type, frame) {
				var $html = $('<div class="myls-dashboard-' + type + '"></div>');
				frame.append($html);
				return $html;
			}

			function fillConfig(conf, frame) {
				$.each(conf, function (_, item) {
					//console.log(item);
					if (item.type !== 'component') {
						var frame_new = addFrame(item.type, frame);
						if (item.style) {
							frame_new.attr('style', item.style);
						}
						if (item.class) {
							frame_new.addClass(item.class);
						}
						fillConfig(item.content, frame_new);
					}
					if (item.hasOwnProperty("type") && item.type == 'component') {
						var column = columns[item.componentName];
						if (item.hasOwnProperty("isClosable"))
							item.isClosable = item.isClosable == 'true' ? true : false;
						else
							item.isClosable = true;
						item.componentName = 'layout';
						item.title = saveString(item.title ? item.title : column.caption);
						item.componentState = {'html': column.tableId ? getObjectContainer(getIdn(column.tableId, ext_id, appInfo.tables[column.tableId].tableType, 'dashboard')) : '<div id="' + idn + '_' + column.dataField + '" class="h-100"></div>'};
						var htmlFrame = createFrame(item.componentState.html, item.title, item.isClosable, column.dataField);
						//frame.append(htmlFrame);
						var frameItem = $(htmlFrame).appendTo(frame);
						if (item.style) {
							frameItem.attr('style', item.style);
						}
						if (item.class) {
							frameItem.addClass(item.class);
						}
						objList.push(column);
						objFrames.push(column.dataField);
						if ($.inArray(column.dataField, oldFrames) !== -1) {
							var fff = frame.find('.myls-frame[data-id=' + column.dataField + ']');
							//console.log(idn);
							fff.hide(500, function () {
								if ($('#bottomFrameTabs').length > 0) {

								} else {
									createBottomFrameTabs(idn);
								}
								//добавляем вкладку для спрятанного фрейма
								addBottomFrameTab(fff);
								//формируем массив открытых фреймов и сохраняем его.
								saveCurrentFrames();
							});
						}
					}
				});
			}

			function createBottomFrameTabs(tabIdn) {
				if ($('#bottomFrameTabs_'+table).length == 0) {
					$('#' + tabIdn).prepend('<div id="bottomFrameTabs_'+table+'" class="bottom-dashbord-tabs"></div>');
					$("#bottomFrameTabs_"+table).dxTabs({
						noDataText: '',
						itemTemplate: function (itemData, itemIndex, element) {
							element.text(itemData.text);
							//element.append($("<i>").addClass('dx-icon dx-icon-close').attr('data-tab', itemData.id));
						},
						onItemClick: function (e) {
							$('.myls-dashboard-layout').find('.myls-frame[data-id=' + e.itemData.id + ']').show(0, function () {
								closeBottomFrameTab(e.itemData.id);
								// Вызываем событие, что окно изменило свой размер, чтобы перерисовались чарты, иначе никак
								$(window).trigger('resize');
								saveCurrentFrames();
							});
						}
					}).dxTabs("instance");
				}
			}

			function addBottomFrameTab(currentFrame) {
				//console.log(currentFrame.attr('data-id'));
				var bottomFrameTabs = $('#bottomFrameTabs_'+table).dxTabs('instance');
				var tabItems = bottomFrameTabs.option('items');
				var isItem = false;
				$.each(tabItems, function (index, i) {
					if (i.id == currentFrame.attr('data-id')) {
						isItem = index;
						return false;
					}
				});
				if (isItem !== false) {
					bottomFrameTabs.option('selectedIndex', isItem);
				} else {
					tabItems.push({
						id: currentFrame.attr('data-id'),
						text: currentFrame.find('.myls-frame-title').text(),
					});
					//console.log(tabItems);
					bottomFrameTabs.option('items', tabItems);
					//oldFrames = tabItems;
					//bottomFrameTabs.option('selectedIndex', tabItems.length - 1);
					saveCurrentFrames();
				}

			}

			function closeBottomFrameTab(id) {
				if ($('#bottomFrameTabs_'+table).length > 0) {
					var bottomFrameTabs = $('#bottomFrameTabs_'+table).dxTabs('instance');
					var tabItems = bottomFrameTabs.option('items');
					$.each(tabItems, function (index, i) {
						if (i.id == id) {
							tabItems.splice(index, 1);
							if (tabItems.length > 0) {
								bottomFrameTabs.option('items', tabItems);
								//oldFrames = tabItems;
							} else {
								$('#bottomFrameTabs_'+table).remove();
								//oldFrames = [];
							}
							return false;
						}
					});
					saveCurrentFrames();
				}
			}

			function saveCurrentFrames() {
				//var arrFrames = [];
				var tableId = $('.myls-dashboard-layout').attr('data-table');
				oldFrames = [];
				$(".myls-frame").each(function (index, item) {
					if ($(this).is(':hidden')) {
						var idnx = $(this).attr('data-id');
						if ($.inArray(idnx, oldFrames) === -1)
							oldFrames.push(idnx);
						//console.log( index + ": " + $( this ).text() );
					}
				});
				//console.log(arrFrames);
				//sendStorageRequest("storage", "json", "POST", arrFrames, tableId);
				allowSaveStorage = true;
			}

			function saveStorage() {
				var deferred = new $.Deferred;
				//console.log(allowSaveSetting);
				if (allowSaveStorage)  {
					//console.log(oldFrames);
					allowSaveStorage = false;
					var setting = sendStorageRequest("storage", "json", "POST", oldFrames, table);
					$.when(setting).done(function (sett) {
						deferred.resolve();
					}).fail(function () {
						deferred.reject();
					});
				} else {
					deferred.reject();
				}
				return deferred.promise();
			}
			//console.log(oldFrames);
			//добавляем информацию о фреймах в пользовательскую инфу
			if (oldFrames.length == 0) {
				oldFrames = [];
				allowSaveStorage = true;
				//sendStorageRequest("storage", "json", "POST", [], table);
			}


			//клик по крестику закрывающему фрейм
			$(document.body).on('click', '#tabpanel .myls-dashboard-layout .myls-frame .dx-icon-close', function () {
				var closeTab = $(this).attr('data-tab');
				var frame = $(this).closest('.myls-frame');
				var tabIdn = $(this).closest('.gridContainer').attr('id');
				//прячем фрейм
				frame.hide(500, function () {
					if ($('#bottomFrameTabs_'+table).length > 0) {

					} else {
						createBottomFrameTabs(tabIdn);
					}
					//добавляем вкладку для спрятанного фрейма
					addBottomFrameTab(frame);
					//формируем массив открытых фреймов и сохраняем его.
					saveCurrentFrames();
				});
			});

			//сохранение настроек
			setInterval(function () {
				saveStorage();
			}, 5000);

			//клик по крестику закрывающему нижний таб
			$(document.body).on('click', '#bottomFrameTabs .dx-item .dx-item-content .dx-icon-close', function () {
				var closeTab = $(this).attr('data-tab');
				//closeBottomFrameTab(closeTab);
			});


		});



}



$(function () {


});
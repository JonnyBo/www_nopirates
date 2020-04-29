function initDragList(table, ext_id, view, mode, tHistory) {
	var deferred = new $.Deferred;
	var idn = getIdn(table, ext_id, 'draglist', view);
	//получаем данные
	var startData = initData(table, ext_id, 'draglist');
	//var templData = getData('/cards/gettemplate', 'get', {'table': table, 'extId': ext_id});
	var templData = getTemplate(table);
	//var tableData = getData('/cards/tabledata', 'get', {'id': table, 'extId': ext_id});
	//стартуем окошко загрузки
	//openLoadPanel(idn);

	//выводим таблицу
	$.when(startData.tableColumns, startData.contextMenuData, startData.tableInfo, templData).done(function (columns, menu, tableInfo, tableTpl) {

		var dataColumn = getColumnByColumnType('data', columns.columns);
		var groupColumn = getColumnByColumnType('group', columns.columns);
		var selParams = getSelParams(tableInfo);
		var loadData = createDataSource(table, ext_id, idn, tHistory, columns.columns, tableInfo, selParams);

		tableInfo.idn = idn;
		columns = columns.columns;

		var dataDS = new DevExpress.data.DataSource(initLookupDataSource(dataColumn, null, columns, tHistory, null, null, selParams));

		$.when(dataDS.load()).done(function () {
			var searchExpr = getUsedFields(tableTpl, ['title', 'subtitle', 'text'], columns);

			var grid = $("#" + idn).dxList({
				dataSource: loadData,
				dataDS: dataDS,
				pullRefreshEnabled: false,
				selectionMode: "single",
				searchEnabled: true,
				indicateLoading: false,
				searchExpr: searchExpr,
				searchMode: 'contains',
				noDataText: saveString('Пока в этом разделе нет данных. Чтобы внести информацию, воспользуйтесь кнопкой "Добавить"'),
				onContentReady: function (e) {
					$("#" + idn + " .dx-list-item").addClass("col d-flex align-items-stretch");
					$("#" + idn + " .dx-list-item-content").addClass("d-block");
					$("#" + idn + " .dx-scrollview-content").addClass("card-view d-flex align-items-stretch flex-wrap");
					resizeCards($("#" + idn));
					contentReady(idn, e, 'cards');

					$('#' + idn + '_totalCount').text(saveString("Всего записей:") + ' ' + e.component.option('items').length);
				},
				onSelectionChanged: function (e) {
					setEnabledToolbar(e, 'draglist');
				},
				/*onItemClick: function (e) {
					dblClick(e, tableInfo, getCurrentId(e, 'draglist'), tHistory, 'draglist', columns);
				},*/
				itemTemplate: function (data) {
					var template = "";
					if (tableTpl && tableTpl.length != 0) {
						var item = [];
						item.template = '<div data-dir="v" class="card">' + tableTpl + '</div>';
						item.dataType = 'block';
						template = getFormattedCellValue('', item, columns, data, idn);
					}
					template = addList($(template), data);
					return template;
				},
				onItemContextMenu: function (e) {
					if (e.itemData !== undefined)
						openContextMenu(idn, e.itemData.id, e.itemData, tHistory);
				},
			});

			function addList(template, info) {
				var id = idn + '_list-container_' + info.id;

				var $list = $("<div id='" + id + "'/>").appendTo($(template));

				var listData = [];
				$.each(dataDS.items(), function (index, item) {
					if (item.group_id == info.id) {
						listData.push(item);
					}
				});

				createCards(listData, $list, info);

				//создаем карточки внутри столбца
				function createCards(data, $list, itemData) {
					var $scroll = $("<div>").appendTo($list);
					var $items = $("<div>").appendTo($scroll);
					data.forEach(function (item) {
						createCard(item, $items);
					});
					$scroll.addClass("scrollable-list").dxScrollView({
						direction: "vertical",
						showScrollbar: "always"
					});
					$items.addClass("sortable-cards").dxSortable({
						group: idn,
						moveItemOnDrop: true,
						data: itemData,
						onDragStart: function (e) {
							var id = $(e.itemElement).attr('data-id');
							if (!tableInfo.e || tableInfo.e !== 1) {
								e.cancel = true;
							} else
								$.each(dataDS.items(), function (index, item) {
									if (item.id == id) {
										e.itemData = item;
										return;
									}
								});
							//console.log(e);
						},
						onDragEnd: function (e) {
							if (e.fromComponent !== e.toComponent) {
								$.when(updateValues(e)).done(function () {
									var obj = getCurrentObj(grid, 'draglist');
									refreshObject(obj, 'draglist', true);
								}).fail(function () {
									var obj = getCurrentObj(grid, 'draglist');
									refreshObject(obj, 'draglist', true);
								});
							}
						}
					});
				}

				//создаем саму карточку
				function createCard(data, $items) {
					var $item = $("<div>").addClass("dx-card").addClass("dx-theme-text-color").addClass("dx-theme-background-color").appendTo($items);
					$item.attr("data-id", data.id);
					$item.itemData = data;
					$item.append(getFormattedCellValue('', dataColumn, columns, data, idn));
				}

				template = $(template).get(0);
				return template;
			}

			function updateValues(e) {
				var deferred = $.Deferred();
				if (!tableInfo.updParams || !tableInfo.updParams.length) {
					deferred.resolve();
					return deferred.promise();
				}

				var postParams = {'table': tableInfo.tableId};
				var params = {};
				$.each(tableInfo.updParams, function (index, item) {
					params[item] = null;
					switch (item) {
						case 'id':
							params[item] = e.itemData.ext_id;
							break;
						case 'from_group':
							params[item] = e.fromData[groupColumn.dataField];
							break;
						case 'to_group':
							params[item] = e.toData[groupColumn.dataField];
							break;
					}
				});
				$.each(loadData.selParams, function (index, item) {
					params[index.substring(1)] = item;
				});

				params.lang = config.lang;
				params.company_id = config.company_id;
				postParams.params = JSON.stringify(params);
				var updateData = getData('/frame/updateproc', 'post', postParams);
				$.when(updateData).done(function (msg) {
					if (msg.success && !msg.success.error_msg)
						deferred.resolve(e);
					else {
						if (!msg.error && msg.success.error_type == 1) {
							showWarning(idn, msg.success.error_msg);
							deferred.resolve(e);
						} else {
							showError(idn, msg.error ? msg.error : msg.success.error_msg);
							deferred.reject();
						}
					}
				}).fail(function (error) {
					showError(idn, error);
					deferred.reject();
				});
				return deferred.promise();
			}

			var object = {
				object: grid,
				columns: columns,
				tableInfo: tableInfo,
				menu: menu,
				type: 'draglist',
				tHistory: tHistory,
				idn: idn,
				dataSource: loadData,
				selParams: selParams,
				ext_id: ext_id
			};
			objects[idn] = object;

			$("#" + idn).prepend('<div class="dx-datagrid-header-panel"></div>');
			$("#" + idn + " .dx-datagrid-header-panel").append('<div role="toolbar"></div>');
			var items = [];
			initToolbar(undefined, items, tableInfo, table, ext_id, 'draglist', tHistory, columns);
			var toolbar = $("#" + idn + " [role=toolbar]").dxToolbar({
				items: items,
			}).dxToolbar("instance");

			initBottomToollbar(idn, 0, 0);

			$(document.body).on('click', '#' + idn + ' .dx-datagrid-filter-panel-left', function () {
				$('#' + idn + '_popupContainer').dxPopup("show");
			});

			initContextMenu(idn, menu, '#' + idn + ' .dx-scrollview-content');

			deferred.resolve(object);
		});
	}).fail(function (error) {
		showError(idn, error);
		deferred.reject();
	});
	return deferred;
}
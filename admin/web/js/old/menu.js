function initContextMenu(idn, menu, target) {

	$("#" + idn + "-context-menu").dxContextMenu({
		dataSource: menu,
		width: 200,
		target: target,
	});

}

function openContextMenu(idn, ext_id, data, tHistory) {
	$("#" + idn + "-context-menu").dxContextMenu({
		onItemClick: function (elem) {
			if (!elem.itemData.items) {
				//DevExpress.ui.notify("The \"" + e.itemData.text + "\" item was clicked", "success", 1500);
				var tblTitle = elem.itemData.title;
				if (elem.itemData.titleField !== '') {
					tblTitle = elem.itemData.title + ' ' + data[elem.itemData.titleField];
				}
				openTabs(elem.itemData.url + '-' + ext_id, tblTitle, elem.itemData.objectType, ext_id, addHistory(elem.itemData.extIdField, ext_id, idn, tHistory));
				updateUrl(elem.itemData.url + '-' + ext_id);
			}
		},
	});
}

function initQuickActions(actions) {
	// Выводим кнопки быстрого набора
	if (actions && actions.length) {
		$.each(actions, function (index, item) {
			$(".app-container").append("<div id='action-" + index + "'></div>");
			$("#action-" + index).dxSpeedDialAction({
				label: saveString(item.text),
				icon: item.icon,
				index: item.index,
				onClick: function () {
					openPopup(item.table_id, -1, 'form', 'ins', []);
				}
			}).dxSpeedDialAction("instance");
		});

	}
}

function initMenu(siteMenu) {
	//выводим меню и тулбар
	$.when(siteMenu).done(function (menu) {
		closeLoadPanel("main");
		saveTranslateMenu(menu);
		var drawer = $("#drawer").dxDrawer({
			opened: true,
			position: 'before',
			closeOnOutsideClick: false,
			template: function () {
				var $list = $("<div>").addClass("panel-list");

				return $list.dxList({
					dataSource: menu,
					grouped: true,
					collapsibleGroups: true,
					itemTemplate: function (data, _, element) {
						var url = createUrl(data.objectType, data.id, '', data.objectView);
						if (!appInfo.tables[data.id].iconName)
							element.append($("<a>")
								.text(data.text)
								.attr("href", '#' + url)
								.addClass("myls-no-image"));
						else {
							element.append($("<a>")
								.html('<img src="' + appInfo.tables[data.id].iconName + '" class="myls-menu-icon">' + data.text)
								.attr("href", '#' + url));
						}
					},
					hoverStateEnabled: false,
					focusStateEnabled: false,
					activeStateEnabled: false,
					width: '230px',
					onContentReady: function (e) {
						setTimeout(function () {
							var items = e.component.option("items");
							for (var i = 0; i < items.length; i++)
								e.component.collapseGroup(i);
						}, 0);
					}
				});
			}
		}).dxDrawer("instance");

		var langItems = [];
		$.each(languages, function (index, item) {
			langItems.push({
				lang: item.code,
				name: saveString(item.name),
				selected: config.lang == item.code ? true : false,
			});
		});

		var menuData = [{
			id: "2",
			html: '<div class="myls-notifications" style="position: relative; margin-right: 10px;"><i class="fa fa-bell-o"></i><span class="myls-count-notifications">0</span></div>',
			notification: true,
		}, {
			id: "3",
			//html: '<i id="logout" class="dx-icon-runner"></i>',
			icon: '/img/blank-avatar.svg',
			items: [{
				id: "help",
				name: saveString("Помощь"),
				linkOut: 'https://www.manula.com/manuals/myls/myls-school-knowledge-base/1/ru/topic/myls-school-how-to-work',
			}, {
				id: "lang",
				name: saveString("Язык"),
				items: langItems,
			}, {
				id: "3_2",
				name: saveString("Выход"),
				link: '/site/logout',
			}]
		}];

		var allDataSource = new DevExpress.data.DataSource({
			paginate: false,
			group: "category",
			store: new DevExpress.data.CustomStore({
					key: "id",
					loadMode: "raw",
					//cacheRawData:false,
					load: function (loadOptions) {
						var params = {'lang': config.lang};
						var result = getData('/form/getallsearchlookup', 'post', params);
						return result;
					},
				}
			)
		});

		function getAllIcons(item) {
			for (let idx in item) {
				if (item[idx].objectType != 'menuGroup' && appInfo.tables[item[idx].id].iconName && appInfo.tables[item[idx].id].showInToolbar) {
					toolbarItems.push({
						widget: "dxButton",
						//name: 'buttonAdmin',
						locateInMenu: 'auto',
						options: {
							elementAttr: {
								class: "myls-main-toolbar-icon"
							},
							icon: appInfo.tables[item[idx].id].iconName,
							hint: item[idx].text,
							//visible: !isEdit,
							onClick: function (e) {
								let url = "#" + createUrl(item[idx].objectType, item[idx].id, '', item[idx].objectView);
								openTabToHash(url);
							}
						},
						location: "center",
						//text:item[idx].text,
						//showText:'inMenu',
					});
				}
				if (item[idx].items) {
					getAllIcons(item[idx].items);
				}
			}
		}

		let toolbarItems = [
			{
				widget: "dxButton",
				location: "before",
				cssClass: "menu-button",
				options: {

					icon: "menu",
					onClick: function () {
						drawer.toggle();
					}
				}
			},
			{
				text: siteName,
				location: "before",
				cssClass: "mylsTitle",
				cssStyle: "mylsTitle",

			},
			{
				widget: "dxSelectBox",
				location: "after",
				options: {
					width: 240,
					displayExpr: 'item',
					grouped: true,
					dataSource: allDataSource,
					closeOnOutsideClick: true,
					showClearButton: true,
					buttons: ['clear', 'dropDown'],
					searchExpr: 'item',
					searchEnabled: true,
					placeholder: saveString("Искать в приложении"),
					valueExpr: 'id',
					keyExpr: 'id',
					acceptCustomValue: false,
					dropDownButtonTemplate: function () {
						return $("<span class='dx-icon-search myls-allsearch-icon'></span>");
					},
					onValueChanged: function (data) {
						$.when(allDataSource.store().byKey(data.value)).done(function (datas) {
							openPopup(datas.form_id, datas.ext_id, 'form', 'upd', []);
						}).fail(function () {

						});
					}
				}
			},
			{
				widget: "dxMenu",
				location: "after",
				cssClass: "user-menu",
				options: {
					dataSource: menuData,
					hideSubmenuOnMouseLeave: false,
					SubmenuDirection: 'LeftOrTop',
					displayExpr: "name",
					cssClass: "user-menu",
					onItemClick: function (data) {
						var item = data.itemData;
						if (item.link) {
							window.location.href = item.link;
						}
						if (item.linkOut) {
							window.open(item.linkOut);
						}
						if (item.lang) {
							changeLocale(item.lang);
						}
						if (item.notification) {
							//console.log(getTableInfo(config.notification));
							openTabs('#grid' + '-' + config.notification + '_tab', getTableInfo(config.notification).name, 'grid', undefined, []);
						}
					}
				}
			}
		];

		getAllIcons(menu);

		$("#toolbar").dxToolbar({
			items: toolbarItems
		});

		var list = $(".panel-list").dxList("instance");
		for (var i = 0; i < 5; i++) {
			list.collapseGroup(i);
		}
	});

}

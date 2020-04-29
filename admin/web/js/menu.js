class Menu {

	constructor() {
		this.object = {};
	}

	init() {
		//выводим меню
		this.createObject();
		app.drawer.option('template', () => this.object);
		this.object = this.object.dxList('instance');
	}

	createObject() {
		let siteMenu = app.appInfo.menu;
		let $list = $("<div>").addClass("panel-list");
		this.object = $list.dxList(this.getOptions(siteMenu));
	}

	getOptions(siteMenu) {
		let self = this;
		return {
			dataSource: siteMenu,
			grouped: true,
			collapsibleGroups: true,
			itemTemplate: function (data, _, element) {
				self.createItemMenu(data, element);
			},
			hoverStateEnabled: false,
			focusStateEnabled: false,
			activeStateEnabled: false,
			width: '230px',
			onContentReady: function (e) {
				self.allMenuCollaps(e)
			}
		}
	}

	createItemMenu(data, element) {
		let url = app.getIdn(data.objectType, data.id, '', data.objectView);
		if (!app.appInfo.tables[data.id].iconName)
			element.append($("<a>")
				.text(data.text)
				.attr("href", '#' + url)
				.addClass("myls-no-image"));
		else {
			element.append($("<a>")
				.html('<img src="' + app.appInfo.tables[data.id].iconName + '" class="myls-menu-icon">' + data.text)
				.attr("href", '#' + url));
		}
	}

	allMenuCollaps(e) {
		setTimeout(function () {
			let items = e.component.option("items");
			for (let i = 0; i < items.length; i++)
				e.component.collapseGroup(i);
		}, 1000);
	}

	destroy() {
		this.object = null;
	}

}




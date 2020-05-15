class TopTabs {

	constructor() {
		this.panelContent = [];
		this.object = {};
	}

	init() {
		this.createObject();
	}

	createTab(table, type, ext_id, tHistory = [], old = false, title = '') {
		let isNew = false;
		let idn = app.getIdn(type, table, ext_id, 'tab');
		let selTab = this.panelContent.findIndex((value, index) => {
			return (value.idn === idn);
		});
		if (selTab === -1) {
			this.panelContent.push({
				'title': title ? title : app.appInfo.tables[table].name,
				'html': app.getObjectContainer(idn),
				//'id': table,
				//'type': type,
				//'ext_id': ext_id,
				'idn': idn,
				'tHistory': JSON.stringify(tHistory)
			});
			this.object.option('items', this.panelContent);
			selTab = this.panelContent.length - 1;
			if (old) {
				selTab = app.config.selTabs;
			}
			isNew = true;
			app.config.tabs = this.panelContent;
			app.setSettings();
		}
		if (selTab !== -1) {
			this.object.option('selectedIndex', selTab);
		}
		return isNew;
	}

	createObject() {
		this.object = $("#tabpanel-container").dxTabPanel({
			repaintChangesOnly: true,
			showNavButtons: true,
			deferRendering: false,
			swipeEnabled: false,
			noDataText: '',
			itemTitleTemplate: function (itemData, itemIndex, element) {
				element.text(itemData.title);
				element.append($("<i>").addClass('dx-icon dx-icon-close').attr('data-tab', itemData.idn));
			},
			onSelectionChanged: function (e) {
				app.config.selTabs = e.component.option("selectedIndex");
				app.setSettings();
				if (e.addedItems.length > 0)
					app.updateUrl(e.addedItems[0].idn);
			},
		}).dxTabPanel("instance");
	}

	closeTab(idn) {
		const self = this;
		$.each(this.panelContent, function (index, value) {
			if (value.idn == idn) {
				//disposeObject(value.id, value.ext_id, 'tabs', value.type);
				self.panelContent.splice(index, 1);
				return false;
			}
		});
		this.object.option('items', this.panelContent);
		if ($("#" + idn).data('mylsObject'))
			$("#" + idn).data('mylsObject').destroy();
		//app.objects[idn].destroy();
		app.config.tabs = this.panelContent;
		if (this.panelContent.length == 0) {
			app.clearUrl();
			app.config.tabs = null;
		}
		app.setSettings();
	}

	destroy() {
		app.destroyArray(this.panelContent);
		this.object = null;
	}

}
class ContextMenu {
	constructor(object) {
		this.mylsObject = object;
	}

	destroy() {
		this.mylsObject = null;
	}

	init(menu, target) {
		$("#" + this.mylsObject.idn + "-context-menu").dxContextMenu({
			dataSource: menu,
			width: 200,
			target: target,
		});
	}

	show(ext_id, data) {
		const self = this;
		$("#" + this.mylsObject.idn + "-context-menu").dxContextMenu({
			onItemClick: function (elem) {
				if (!elem.itemData.items) {
					let tblTitle = elem.itemData.title;
					if (elem.itemData.titleField !== '') {
						tblTitle = elem.itemData.title + ' ' + data[elem.itemData.titleField];
					}
					const url = app.getIdn(elem.itemData.objectType, elem.itemData.targetObject, ext_id, elem.itemData.objectView);
					app.openTabFromUrl(url, app.addHistory(elem.itemData.extIdField, ext_id, self.mylsObject.idn, self.mylsObject.tHistory), tblTitle);
					//updateUrl(elem.itemData.url + '-' + ext_id);
				}
			},
		});
	}
}
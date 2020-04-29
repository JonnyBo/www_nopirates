class BottomTabs {

	constructor() {
		this.panelContent = [];
		this.object = {};
	}

	init() {
		this.createObject();
	}

	createObject() {
		const self = this;
		if ($('#bottomPopupTabs').length == 0) {
			$('#content').prepend('<div id="bottomPopupTabs" ></div>');
			this.object = $("#bottomPopupTabs").dxTabs({
				noDataText: '',
				itemTemplate: function (itemData, itemIndex, element) {
					element.text(itemData.text);
					element.append($("<i>").addClass('dx-icon dx-icon-close').attr('data-tab', itemData.idn));
				},
				onItemClick: function (e) {
					let idnPopup = e.itemData.idn;
					self.activateTabByIdn(idnPopup);
				}
			}).dxTabs("instance");
		}
	}

	activateTabByIdn(idn) {
		let index = this.findIndex(idn);
		if (index !== -1) {
			this.activateTab(index);
		}
		app.updateUrl(idn);
	}

	createTab(popup) {
		let index = this.findIndex(popup.idn);
		if (index !== -1) {
			this.activateTab(index);
		} else {

			this.panelContent.push({
				idn: popup.idn,
				text: popup.title,
				mylsObject: popup,
			});
			this.object.option('items', this.panelContent);
			this.object.option('selectedIndex', this.panelContent.length - 1);
			app.setSettings();
		}
	}

	activateTab(index) {
		this.object.option('selectedIndex', index);
		this.panelContent[index].mylsObject.activate();
		return this.panelContent[index].mylsObject;
	}

	changeTitle(popup) {
		let index = this.findIndex(popup.idn);
		if (index !== -1) {
			this.panelContent[index].text = popup.title;
			this.object.option('items', this.panelContent);
		}
	}

	closeTab(idn) {
		let index = this.findIndex(idn);
		if (index !== -1) {
			this.panelContent.splice(index, 1);
			if (this.panelContent.length > 0) {
				this.object.option('items', this.panelContent);
			} else {
				$('#bottomPopupTabs').remove();
			}
			$('#' + idn).remove();
			if ($("#" + idn).data('mylsObject'))
				$("#" + idn).data('mylsObject').destroy();
			app.setSettings();
		}
	}

	findIndex(idn) {
		return this.panelContent.findIndex((item) => {
			if (item.idn == idn) {
				return true;
			}
		});
	}

	destroy() {
		app.destroyArray(this.panelContent);
		this.object = null;
	}

}
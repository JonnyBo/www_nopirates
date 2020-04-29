class DragList extends MylsObject {

	constructor(table, ext_id, view, mode, tHistory, viewMode, params) {
		super(table, ext_id, view, mode, tHistory, viewMode, params);
		this.type = 'draglist';
	}

	async init() {
		const self = this;
		super.init();
		this.dataColumn = this.columns.getColumnsByColumnType('data', true);
		this.groupColumn = this.columns.getColumnsByColumnType('group', true);
		this.dataDS = new DevExpress.data.DataSource(this.initLookupDataSource(this.dataColumn, null, null));
		await this.dataDS.load();
		this.searchExpr = this.columns.getUsedFields(this.template, ['title', 'subtitle', 'text']);
		this.createObject();
		$("#" + this.idn).data('mylsObject', this);
		this.toolbar.init();
	}

	createObject() {
		this.object = $("#" + this.idn).dxList(this.getOptions()).dxList('instance');
	}

	getOptions() {
		const self = this;
		return {
			dataSource: this.dataSource,
			dataDS: this.dataDS,
			pullRefreshEnabled: false,
			selectionMode: "single",
			searchEnabled: true,
			indicateLoading: false,
			searchExpr: this.searchExpr,
			searchMode: 'contains',
			noDataText: app.translate.saveString('Пока в этом разделе нет данных. Чтобы внести информацию, воспользуйтесь кнопкой "Добавить"'),
			onContentReady: function (e) {
				self.draglistContentReady(e);
			},
			onSelectionChanged: function (e) {
				self.toolbar.setEnabledToolbar();
			},
			itemTemplate: function (data) {
				return self.getItemtemplate(self, data);
			},
			onItemContextMenu: function (e) {
				//if (e.itemData !== undefined)
				//openContextMenu(self.idn, e.itemData.id, e.itemData, self.tHistory);
			},
			onItemClick: function (e) {
				self.dblClick();
			},
		};
	}

	getItemtemplate(self, data) {
		let template = "";
		if (self.template && self.template.length != 0) {
			let item = [];
			item.template = '<div data-dir="v" class="card draglist">' + self.template + '</div>';
			item.dataType = 'block';
			template = this.columns.getFormattedCellValue('', item, data);
		}
		template = this.addList($(template), data);
		return template;
	}

	draglistContentReady(e) {
		$("#" + this.idn + " .dx-list-item").addClass("col d-flex align-items-stretch");
		$("#" + this.idn + " .dx-list-item-content").addClass("d-block");
		$("#" + this.idn + " .dx-scrollview-content").addClass("card-view d-flex align-items-stretch flex-wrap");
		this.resizeCards($("#" + this.idn));
		this.contentReady(e);
		$('#' + this.idn + '_totalCount').text(app.translate.saveString("Всего записей:") + ' ' + e.component.option('items').length);
	}

	resizeCards(item) {
		const width = $(item).width();
		for (let i = 12; i > 0; i--) {
			if (width >= 250 * i) {
				$(item).find(".dx-list-item").css('max-width', width / i + 'px');
				break;
			}
		}
	}

	addList(template, info) {
		const self = this;
		const id = this.idn + '_list-container_' + info.id;
		let $list = $("<div id='" + id + "' class='draglist-list'/>").appendTo($(template));
		let listData = [];
		$.each(this.dataDS.items(), function (index, item) {
			if (item.group_id == info.id) {
				listData.push(item);
			}
		});
		this.createCards(listData, $list, info);

		template = $(template).get(0);
		return template;
	}

	getSortableOptions(itemData) {
		const self = this;
		return {
			group: this.idn,
			moveItemOnDrop: true,
			data: itemData,
			allowReordering:false,
			onDragStart: function (e) {
				self.selectCard(e.itemElement, true);
				//console.log("start");
				if (!self.tableInfo.e || self.tableInfo.e !== 1) {
					e.cancel = true;
				} else {
					$("#" + self.idn + ' .sortable-cards').addClass('dragging');
				}
			},
			onDragEnd: async function (e) {
				//console.log("end");
				if (e.fromComponent !== e.toComponent) {
					await self.updateValues(e);
					await self.refresh();
				}
				$("#" + self.idn + ' .sortable-cards').removeClass('dragging');
			},
			dragTemplate: function (e) {
				//console.log("template");
				const $container = $("<div/>");
				$.each(self.getSelectedItems(), (_, item) => {
					self.createCard(item, $container);
				});
				return $container;
			}
		};
	}

	//создаем карточки внутри столбца
	createCards(data, $list, itemData) {
		const self = this;
		let $scroll = $("<div>").appendTo($list);
		let $items = $("<div>").appendTo($scroll);
		data.forEach(function (item) {
			self.createCard(item, $items);
		});
		$scroll.addClass("scrollable-list").dxScrollView({
			direction: "vertical",
			showScrollbar: "always"
		});
		// $scroll.find('.dx-scrollable-content').addClass('d-flex').addClass('no-transform');
		$items.addClass("sortable-cards").dxSortable(this.getSortableOptions(itemData));
	}

	//создаем саму карточку
	createCard(data, $items) {
		const self = this;
		let $item = $("<div>").addClass("dx-card").addClass("dx-theme-text-color").addClass("dx-theme-background-color").appendTo($items);
		$item.attr("data-id", data.id);
		$item.itemData = data;
		$item.on("dxclick", (e) => {
			self.selectCard(e.target);
		});
		$item.append(this.columns.getFormattedCellValue('', this.dataColumn, data));
	}

	selectCard(card, select) {
		const $card = $(card);
		const $parent = $card.closest('.dx-card');
		const id = $parent.attr('data-id');
		try {
			const itemIndex = this.findInDataSource(id, this.dataDS.items(), 'id');
			if (itemIndex !== -1) {
				const item = this.dataDS.items()[itemIndex];
				item.selected = !item.selected ? true : false;
				item['__from_group'] = item.group_id;
				$parent.toggleClass('card-selected');
				if (select) {
					item.selected = select;
					// Жестко проставляем класс, если пришел параметр select
					$parent.removeClass('card-selected');
					$parent.addClass('card-selected');
				}
				if (select === false) {
					$parent.removeClass('card-selected');
				}
			}
		} catch (error) {

		}
	}

	getSelectedItems() {
		return this.dataDS.items().filter((item) => item.selected);
	}

	async updateValues(e) {
		const self = this;
		if (!this.tableInfo.updParams || !this.tableInfo.updParams.length) {
			return Promise.resolve();
		}

		const items = self.getSelectedItems();
		this.progressBar.init(items.length);
		let postParams = {'table': this.tableInfo.tableId};
		for (let item of items) {
			try {
				let params = this.setUpdateParams(item, e.toData[self.groupColumn.dataField]);
				postParams.params = JSON.stringify(params);
				let result = await app.processData('/frame/updateproc', 'post', postParams);
				this.processResult(result);
				this.progressBar.step();
			} catch (error) {
				this.processResult(error);
				this.progressBar.step();
			}
		}
		this.progressBar.remove();
	}

	setUpdateParams(e, toGroup) {
		const self = this;
		let params = {};
		$.each(this.tableInfo.updParams, function (index, item) {
			params[item] = null;
			switch (item) {
				case 'id':
					params[item] = e.ext_id;
					break;
				case 'from_group':
					params[item] = e['__from_group'];
					break;
				case 'to_group':
					params[item] = toGroup;
					break;
			}
		});
		$.each(this.selParams, function (index, item) {
			params[index.substring(1)] = item;
		});
		app.addConfigParams(params);
		return params;
	}

	getCurrentId() {
		return this.object.option('selectedItemKeys')[0];
	}

	getSelectedRows() {
		return this.object.option('selectedItemKeys');
	}

	async refresh(changesOnly = true, useLoadPanel = true) {
		super.refresh(changesOnly, useLoadPanel);
		await this.object.option("dataDS").reload();
		this.object.reload();
		this.toolbar.setEnabledToolbar();
	}

	destroy() {
		super.destroy();
		$("#" + this.idn).data('mylsObject', null);
		this.dataDS = null;
		this.close();
	}
}
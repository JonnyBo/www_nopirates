class App extends AppCore {

	constructor() {
		super();
		this.appInfo = {};
		this.menu = new Menu();
		this.toolbar = new AppToolbar();
		this.topTabs = new TopTabs();
		this.bottomTabs = new BottomTabs();
		this.drawer = {};
		this.objects = {};
		this.cntToolTip = 0;
		this.colCaches = [];
		this.patterns = {
			'phone': /((\+([0-9](\ |\-)?){11,15})|(([0-9](\ |\-)?){5,15}))(\ ?\#[0-9]{2,4})?/i,
			'phone_form': /^((\+([0-9](\ |\-)?){11,15})|(([0-9](\ |\-)?){5,15}))(\ ?\#[0-9]{2,4})?$/i,
			//'phone':/[\+]?\d{1,}?[(]?\d{2,}[)]?[-\s\.]?\d{1,}?[-\s\.]?\d{1,}[-\s\.]?\d{0,9}/gi,
			//'phone_form':/^[\+]?\d{1,}?[(]?\d{2,}[)]?[-\s\.]?\d{1,}?[-\s\.]?\d{1,}[-\s\.]?\d{0,9}$/gi,
			'mail': /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/i,
			'mail_form': /^([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)$/i,
			'url': /(?:(?:https?|ftp):\/\/)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/\S*)?/i,
			'url_form': /^(?:(?:https?|ftp):\/\/)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/\S*)?$/i
		};
		this.currentHash = '';
		this.objectTypes = ['grid', 'tree', 'cards', 'documents', 'dashboard', 'scheduler', 'chart', 'pivot', 'draglist', 'twowaygrid', 'kanban'];
	}

	async init() {
		const self = this;
		await this.initData();
		this.createDrawer();
		this.menu.init();
		this.toolbar.init();
		this.topTabs.init();
		this.quickActions = await this.processData('menu/getquickactions', 'get');
		this.initQuickActions();
		this.initDialog();
		this.createTooltip();
		if (window.location.hash !== '') {
			this.currentHash = window.location.hash;
		}
		await this.openOldTabs();
		await this.openOldPopups();
		/*if (this.currentHash !== '') {
			this.openTabFromUrl(this.currentHash);
		}*/
		if (this.config.client_id) {
			this.getNotifications();
			setInterval(function () {
				self.getNotifications();
			}, 60000);
		} else {
			$('.myls-notifications').css('display', 'none');
		}
		//let card = new Cards(1864, undefined, 'tab');
		//card.init();
	}

	async initData() {
		let currentHash = '';
		if (localStorage.getItem('currentHash')) {
			currentHash = localStorage.getItem('currentHash');
			localStorage.setItem('currentHash', '');
		}
		//отслеживаем изменение URL
		if (window.location.hash !== '') {
			currentHash = window.location.hash;
		}

		await Promise.all([this.getSettings(), this.translate.getTranslate()]);
		this.openLoadPanel("main");
		await Promise.all([this.getAllTablesInfo(), this.getAllColumns(), this.getAllContextMenu()]);
		await Promise.all([this.getAllTemplates(), this.getQuickActions(), this.getMenu()]);
		this.closeLoadPanel('main');
		//this.menu.initMenu(this.appInfo.menu);

		/*
		Promise.all([this.translate.getTranslate(), this.getSettings()]).then(() => {
				this.openLoadPanel("main");
				Promise.all([this.getAllTablesInfo(), this.getAllColumns(), this.getAllContextMenu()]).then(() => {
					Promise.all([this.getAllTemplates(), this.getQuickActions(), this.getMenu()]).then(() => {
						this.closeLoadPanel('main');

						this.menu.initMenu(this.appInfo.menu);

		 */
		/*
		initMenu(menu);
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
		if (currentHash !== '') {
		openTabToHash(currentHash);
		}

		*/
		/*
					});
				});
		});
		*/
	}

	initDialog() {
		this.dialog = new Dialog();
	}

	initQuickActions() {
		// Выводим кнопки быстрого набора
		if (this.quickActions && this.quickActions.length) {
			$.each(this.quickActions, function (index, item) {
				$(".app-container").append("<div id='action-" + index + "'></div>");
				$("#action-" + index).dxSpeedDialAction({
					label: app.translate.saveString(item.text),
					icon: item.icon,
					index: item.index,
					onClick: function () {
						//openPopup(item.table_id, -1, 'form', 'ins', []);
					}
				}).dxSpeedDialAction("instance");
			});
		}
	}

	createDrawer() {
		this.drawer = $("#drawer").dxDrawer({
			opened: true,
			position: 'before',
			closeOnOutsideClick: false,
		}).dxDrawer("instance");
	}

	createTooltip() {
		this.tooltip = $('#tooltip').dxTooltip({
			showEvent: "click",
			hideEvent: "dxdblclick",
		}).dxTooltip("instance");
	}

	cloneObject(obj) {
		return obj ? JSON.parse(JSON.stringify(obj)) : undefined;
	}

	async getAllTablesInfo() {
		if (!this.appInfo.tables) {
			let tableInfo = await this.processData('frame/getalltablesinfo', 'get');
			this.appInfo.tables = tableInfo;
			//добавляем названия в файл переводов для текущей локали
			this.translate.saveTranslateTableInfo(tableInfo);
		}
	}

	async getAllTemplates() {
		if (!this.appInfo.templates) {
			let templates = await this.processData('frame/getalltemplates', 'get');
			this.appInfo.templates = templates;
			//добавляем названия в файл переводов для текущей локали
			this.translate.saveTranslateTableInfo(templates);
		}
	}

	async getAllContextMenu() {
		if (!this.appInfo.contextMenu) {
			let menus = await this.processData('menu/getallcontextmenu', 'get');
			//добавляем названия в файл переводов для текущей локали
			this.translate.saveTranslateContextMenu(menus);
			this.appInfo.contextMenu = menus;
		}
	}

	async getAllColumns() {
		if (!this.appInfo.columns) {
			let columns = await this.processData('frame/getallcols', 'get');
			this.appInfo.columns = columns;
			//добавляем названия в файл переводов для текущей локали
			this.translate.saveTranslateColumns(columns);
		}
	}

	async getQuickActions() {
		if (!this.appInfo.quickActions) {
			let quickActions = await this.processData('menu/getquickactions', 'get');
			//this.translate.saveTranslateContextMenu(quickActions);
			this.appInfo.quickActions = quickActions;
		}
	}

	async getMenu() {
		if (!this.appInfo.menu) {
			let menu = await this.processData('menu/getmenu', 'get');
			this.translate.saveTranslateMenu(menu);
			this.appInfo.menu = menu;
		}
	}

	openLoadPanel(idn) {
		const loadPanel = $('#' + idn + '-loadpanel').dxLoadPanel({
			position: {
				of: "#" + idn,
				at: "center center"
			},
			visible: false,
			showIndicator: true,
			showPane: false,
			//shading: true,
			message: this.translate.saveString('Загрузка'),
			container: '#' + idn + '-loadpanel',
			closeOnOutsideClick: false,
			indicatorSrc: "img/loader.svg"
		}).dxLoadPanel("instance");
		if (loadPanel)
			loadPanel.show();
	}

	closeLoadPanel(idn) {
		const loadPanel = $('#' + idn + '-loadpanel').dxLoadPanel().dxLoadPanel("instance");
		if (loadPanel)
			loadPanel.hide();
	}

	closeAllLoadPanel(idn) {
		const loadPanel = $('.dx-loadpanel').dxLoadPanel().dxLoadPanel("instance");
		if (loadPanel)
			loadPanel.hide();
	}

	getLanguages() {
		let self = this;
		let langItems = [];
		$.each(languages, function (index, item) {
			langItems.push({
				lang: item.code,
				name: self.translate.saveString(item.name),
				selected: self.config.lang == item.code ? true : false,
			});
		});
		return langItems;
	}

	getObject(table, ext_id, view, type, mode, tHistory, viewMode, params) {
		let object;
		if (!ext_id)
			ext_id = undefined;
		switch (type) {
			case 'dashboard':
				object = new Dashboard(table, ext_id, view, mode, tHistory, viewMode, params);
				break;

			case 'form':
				object = new Form(table, ext_id, view, mode, tHistory, viewMode, params);
				break;

			case 'grid':
				object = new Grid(table, ext_id, view, mode, tHistory, viewMode, params);
				break;

			case 'tree':
				object = new Tree(table, ext_id, view, mode, tHistory, viewMode, params);
				break;

			case 'cards':
				object = new Cards(table, ext_id, view, mode, tHistory, viewMode, params);
				break;

			case 'scheduler':
				object = new Scheduler(table, ext_id, view, mode, tHistory, viewMode, params);
				break;

			case 'documents':
				object = new Documents(table, ext_id, view, mode, tHistory, viewMode, params);
				break;

			case 'chart':
				object = new Charts(table, ext_id, view, mode, tHistory, viewMode, params);
				break;
			case 'pivot':
				object = new Pivot(table, ext_id, view, mode, tHistory, viewMode, params);
				break;
			case 'kanban':
				object = new Kanban(table, ext_id, view, mode, tHistory, viewMode, params);
				break;
			case 'draglist':
				object = new DragList(table, ext_id, view, mode, tHistory, viewMode, params);
				break;
			case 'twowaygrid':
				object = new TwoWayGrid(table, ext_id, view, mode, tHistory, viewMode, params);
				break;
			case 'htmleditor':
				object = new HtmlEditor(table, ext_id, view, mode, tHistory, viewMode, params);
				break;
			case 'layout':
				object = new Layout(table, ext_id, view, mode, tHistory, viewMode, params);
				break;
		}
		if (object === undefined) {
			console.log('Определение класса типа ' + type + ' отсутствует.');
		}
		return object;
	}

	async openPopup(table, id, type, mode, tHistory, params) {
		let popup = new Popup(table, id, 'form', mode, tHistory, params);
		let index = this.bottomTabs.findIndex(popup.idn);
		if (index === -1) {
			await popup.init();
		} else {
			popup = this.bottomTabs.activateTab(index);
		}
		return popup;
	}

	openTabFromUrl(url, tHistory = []) {
		const param = this.parseUrl(url);
		if (param.table == undefined) {
			app.dialog.showError(undefined, app.translate.saveString('Ошибка! Такого адреса - ' + url + ' - нет!'));
		}
		if (param.objView == 'popup') {
			//console.log(table, ext_id, type);
			this.openPopup(param.table, param.ext_id, param.type, 'upd', tHistory);
		} else {
			if (this.topTabs.createTab(param.table, param.type, param.ext_id)) {
				let object = this.getObject(param.table, param.ext_id, param.objView, param.type, 'sel', []);
				object.init();
			}
		}
	}

	updateUrl(url) {
		const currentUrlParts = window.location.href.split("#");
		if (url !== currentUrlParts[1]) {
			window.location.hash = url;
		}
	}

	clearUrl() {
		window.location.hash = '';
		history.pushState("", document.title, window.location.pathname);
	}

	getIdn(type, table, ext_id, view) {
		if (!type) {
			console.log('Не задан тип объекта');
			return false;
		}
		let idn = type + '-' + table;
		if (ext_id !== undefined && ext_id !== '' && ext_id !== null) {
			idn = idn + '-' + ext_id;
		}
		idn = idn + '_' + view;
		return idn;
	}

	replaceAll(str, find, replace) {
		const re = new RegExp(find, 'g');
		if (typeof str == 'string')
			return str.replace(re, replace);
		else
			return str;
	}

	isDate(date) {
		const regex = /^\d{4}-\d{2}-\d{2}$/;
		return regex.exec(date) !== null;
	}

	addHistory(extField, extId, idn, tHistory, mode) {
		let tHistoryClone = [];
		if (tHistory)
			tHistoryClone = tHistory.slice();
		if (extField) {
			let curValues = {};
			curValues.extId = extId;
			curValues.extField = extField;
			curValues.idn = idn;
			curValues.tableId = this.parseUrl(idn).table;
			if (mode == 'updAll') {
				curValues.refreashAll = true;
				mode = 'upd';
			}
			curValues.mode = mode;
			tHistoryClone.push(curValues);
		}
		return tHistoryClone;
	}

	arrayUnique(arr) {
		let result = arr.filter(function (elem) {
			return elem != null;
		});
		return result.filter((e, i, a) => a.indexOf(e) == i);
	}

	prepareStorage(data) {
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

	removeNullFromArray(obj) {
		const self = this;
		Object.keys(obj).forEach(function (key) {
			if (obj[key] && typeof obj[key] === 'object')
				self.removeNullFromArray(obj[key]);
			else if (obj[key] == null)
				delete obj[key];
		});
	}

	removeEmptyFromArray(arr) {
		let newArray = [];
		for (let i = 0; i < arr.length; i++) {
			if (!$.isEmptyObject(arr[i])) {
				newArray.push(arr[i]);
			}
		}
		return newArray;
	}

	convertFromDateTime(date) {
		if (!date) return null;
		const regex = /\d{4}-\d{2}-\d{2}((T|\ )\d{2}:\d{2}:\d{2})?/g;
		if (String(date).search(regex) == -1)
			date = DevExpress.localization.formatDate(new Date(date), 'yyyy-MM-ddTHH:mm:ssx');
		date = date.slice(0, 19).replace('T', ' ');
		return date;
	}

	getJsDate(date, setComma, column) {
		if (!date) return date;
		// Проверяем, если дата, то преобразовываем, если нет, то просто возвращаем
		const regex = /\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/g;
		if (String(date).search(regex) == 0)
			date = this.convertDateTime(date);
		if (setComma && column.dataType !== 'lookup') date = "\'" + date + "\'";
		return date;
	}

	convertDateTime(date) {
		if (!date) return date;
		date = date.indexOf(' ') == -1 ? date : (date.replace(/\s/, 'T') + this.getTimeZone(String(date).substr(0, 10)));
		return date;
	}

	getTimeZone(date) {
		const d = new Date(date);
		const z = d.getTimezoneOffset();
		const hours = Math.floor(Math.abs(z) / 60);
		const minutes = Math.abs(z) % 60;
		let zone = (hours < 10 ? '0' + hours : hours) + ':' + (minutes < 10 ? '0' + minutes : minutes);
		zone = (z < 0 ? '+' : '-') + zone;
		return zone;
	}

	findInArray(text, items) {
		let isFind = -1;
		const searchText = text.trim();
		$.each(items, function (index, item) {
			if (item.trim().toLowerCase() == searchText.toLowerCase()) {
				isFind = index;
				return false;
			}
		});
		return isFind;
	}

	getObjectContainer(idx) {
		return '<div id="' + idx + '" class="gridContainer"></div><div id="' + idx + '-context-menu" class="context-menu"></div><div id="' + idx + '-loadpanel"></div>';
	}

	async openOldTabs() {
		const self = this;
		if (this.config.tabs !== null && this.config.tabs !== undefined) {
			if (this.config.tabs.length > 0) {
				$.each(this.config.tabs, function (index, item) {
					let tHistory = JSON.parse(item.tHistory);
					const table = self.parseUrl(item.idn).table;
					if (self.appInfo.tables[table]) {
						//const url = self.getIdn(item.type, item.id, item.ext_id, 'tab');
						self.openTabFromUrl(item.idn, tHistory);
						//openTabs(url, getTableInfo(item.id).name, item.type, item.ext_id, tHistory, true);
					}
				});
				if (this.config.selTabs !== undefined) {
					$("#tabpanel-container").dxTabPanel('instance').option("selectedIndex", this.config.selTabs);
					//const url = self.getIdn(this.config.tabs[this.config.selTabs].type, this.config.tabs[this.config.selTabs].id, this.config.tabs[this.config.selTabs].ext_id, 'tab');
					this.updateUrl(this.config.tabs[this.config.selTabs].idn);
				}
			}
		}
		Promise.resolve();
		return Promise;
	}

	openOldPopups() {
		const self = this;
		if (this.config.popups !== null && this.config.popups !== undefined) {
			if (this.config.popups.length > 0) {
				$.each(this.config.popups, function (index, item) {
					let tHistory = JSON.parse(item.tHistory);
					const table = self.parseUrl(item.idn).table;
					if (self.appInfo.tables[table]) {
						//const url = self.getIdn(item.type, item.id, item.ext_id, 'popup');
						self.openTabFromUrl(item.idn, tHistory);
					}
				});
			}
		}
		Promise.resolve();
		return Promise;
	}

	getConfigParam(param) {
		switch (param) {
			case ':lang':
				return this.config.lang;
				break;
			case ':company_id':
				return this.config.company_id;
				break;
			case ':__user_client_id__':
			case ':user_client_id':
				return this.config.client_id;
				break;
			case ':user_id':
				return this.config.user_id;
				break;
			default:
				return null;
		}
	}

	addConfigParams(params) {
		params.lang = this.config.lang;
		params.company_id = this.config.company_id;
		params.__user_client_id__ = this.config.client_id;
		params.user_id = this.config.user_id;
	}

	getNotifications() {
		$.ajax({
			url: 'site/notifications',
			type: 'post',
			cache: false,
			//data: ({'file': file}),
			success: function (result) {
				let data = null;
				if (result != '')
					data = $.parseJSON(result);
				if (data && data > 0) {
					$('.myls-notifications .myls-count-notifications').text(data);
				} else
					$('.myls-notifications .myls-count-notifications').text("");
			}
		});
	}

	destroyArray(arr) {
		$.each(arr, function (index, item) {
			item = null;
		});
		arr = null;
	}

	isEqual(obj1, obj2) {
		return JSON.stringify(obj1)===JSON.stringify(obj2);
	}

}
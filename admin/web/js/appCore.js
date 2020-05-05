class AppCore {

	constructor() {
		this.config = {lang: 'en', company_id: 1};
		this.allowSaveSetting = false;
		this.translate = new MylsLocalization();
	}

	//получение данных
	processData(url, method, data) {
		/*
		if (url[0] === '/') {
			url = url.substr(1);
		}

		 */
		//url = location.origin + '/' + url;
		if (data === null || data === undefined) data = '';
		try {
			/*
			if (data !== '') {
				data = JSON.stringify(data);
			}
			 */
			return new Promise((resolve, reject) => {
				$.ajax({
					url: url,
					method: method,
					data: (data),
					success: function (result) {
						if (result) {
							result = $.parseJSON(result);
							if (result.error && result.error != '') {
								reject(result);
							} else {
								resolve(result);
							}
						} /*else {
                            reject({error:'Запрос не вернул никакого результата'});
                        }*/
					},
					error: function (object, type, error) {
						console.log(error);
						reject(error);
					}
				});
			});
		} catch (e) {
			return Promise.reject(e.message);
		}
	}

	async getSettings() {
		let setting = await this.processData('site/settings', 'POST', null);
		this.config = setting;
		this.config.lang = this.config.lang ? this.config.lang : "en";
		this.config.company_id = this.config.company_id ? this.config.company_id : 1;
		this.config.client_id = this.config.client_id ? this.config.client_id : null;
		DevExpress.localization.locale(this.config.lang);
	}

	setSettings() {
		this.allowSaveSetting = true;
	}

	saveSettings() {
		if (this.allowSaveSetting) {
			this.allowSaveSetting = false;
			if ('bottomTabs' in app) {
				this.config.popups = [];
				for (let item of app.bottomTabs.panelContent) {
					if (this.parseUrl(item.idn).ext_id !== -1) {
						this.config.popups.push({
                            idn: item.idn,
                            tHistory: JSON.stringify(item.mylsObject.tHistory),
                            id: item.mylsObject.table
                        });
					}
				}
			}
			this.processData('site/settings', 'POST', {'data': this.config});
		}
	}

	getUrlParameter(name) {
		name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
		var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
		var results = regex.exec(location.href);
		return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, '    '));
	}

	parseUrl(url) {
		const grid = url.replace(/#/g, '');
		const arrurl = grid.split(/\-|\_/);
		const type = arrurl[0];
		const table = arrurl[1];
		let ext_id = arrurl[2];
		let objView = arrurl[3];
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
		return {type, table, ext_id, objView};
	}

	create_UUID() {
		let dt = new Date().getTime();
		let uuid = 'gxxxxxxxx'.replace(/[xy]/g, function (c) {
			const r = (dt + Math.random() * 16) % 16 | 0;
			dt = Math.floor(dt / 16);
			return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
		});
		return uuid;
	}

	/*
	get_cookie(cookie_name) {
		var results = document.cookie.match('(^|;) ?' + cookie_name + '=([^;]*)(;|$)');
		if (results)
			return (unescape(results[2]));
		else
			return null;
	}

	getCookie(name) {
		var matches = document.cookie.match(new RegExp('(?:^|\s)' + name + '=(.*?)(?:;|$)'));
		return matches[1];
	}
*/

}
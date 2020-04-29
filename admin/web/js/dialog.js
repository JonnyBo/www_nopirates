class Dialog {

	constructor() {

	}

	async custom(text, title, params, addClass = 'myls-msg-info') {
		return new Promise((resolve, reject) => {
			const $popupContainer = $("<div />").addClass("popup " + addClass).appendTo($("#popup_error"));
			let buttons = [{location: "after"}];

			$.each(params, function (index, value) {
				buttons.push({
					widget: "dxButton",
					toolbar: "bottom",
					location: "center",
					options: {
						text: value.text,
						type: value.type,
						stylingMode: "outlined",
						tabIndex: value.tabIndex,
						onClick: function (e) {
							customPopup.hide();
							resolve(value.result === undefined ? true : value.result);
						}
					}
				});
			});
			const customPopup = $popupContainer.dxPopup(this.getOptions(title, text, buttons)).dxPopup("instance");
			customPopup.show();
		});
	}

	getOptions(title, message, items) {
		return {
			width: "auto",
			height: "auto",
			maxWidth: "50%",
			maxHeight: "50%",
			contentTemplate: function () {
				return $("<div />").append(
					$('<p>' + message.toString() + '</p>')
				);
			},
			toolbarItems: items,
			showTitle: true,
			title: title,
			visible: false,
			dragEnabled: true,
			closeOnOutsideClick: true,
			showCloseButton: false,
		};
	}

	showError(idn, error) {
		if (idn) {
			app.closeLoadPanel(idn);
		}
		return this.custom(error, app.translate.saveString('Ошибка'), [{
			text: app.translate.saveString('OK'),
			type: 'success'
		}], 'myls-msg-error');
	}

	showWarning(idn, message) {
		if (idn) {
			app.closeLoadPanel(idn);
		}
		return this.custom(message, app.translate.saveString('Предупреждение'), [{
			text: app.translate.saveString('OK'),
			type: 'success'
		}], 'myls-msg-warning');
	}

	showInfo(idn, message) {
		if (idn) {
			app.closeLoadPanel(idn);
		}
		return this.custom(message, app.translate.saveString('Информация'), [{
			text: app.translate.saveString('OK'),
			type: 'success'
		}], 'myls-msg-info');
	}

	confirm(idn, message, title= app.translate.saveString('Подтверждение'), textBtnYes = app.translate.saveString('Да'), textBtnNo = app.translate.saveString('Нет'), addClass = 'myls-msg-info') {
		if (idn) {
			app.closeLoadPanel(idn);
		}
		return this.custom(message, title, [{
			text: textBtnYes,
			type: 'success',
			tabIndex: 1,
			result: true
		}, {text: textBtnNo, type: 'default', tabIndex: 2, result: false}], addClass);
	}

	destroy() {

	}

}
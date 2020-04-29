function initCustomDialog(title, text, params) {
	var buttons = [];
	$.each(params, function (index, value) {
		buttons.push({
			text: value.text,
			type: value.type,
			stylingMode: value.stylingMode,
			tabIndex: value.tabIndex,
			onClick: function (e) {
				return value.result;
			}
		});
	});
	var Dialog = DevExpress.ui.dialog.custom({
		title: title,
		messageHtml: text,
		buttons: buttons,
		dragEnabled: true,
	});
	return Dialog;
}

function showError(idn, error) {
	if (idn) {
		closeLoadPanel(idn);
	}
	return initInfoDialog(error, saveString('Ошибка'), 'myls-msg-error', saveString('OK'));
}

function showWarning(idn, message) {
	if (idn) {
		closeLoadPanel(idn);
	}
	return initInfoDialog(message, saveString('Предупреждение'), 'myls-msg-warning', saveString('OK'));
}

function initConfirmDialog(message, title, addclass, textBtnYes, textBtnNo) {
	var deferred = $.Deferred();
	//closeLoadPanel(idn);
	var $popupContainer = $("<div />").addClass("popup " + addclass).appendTo($("#popup_error"));
	var items = [{location: "after"}];
	items.push({
		widget: "dxButton",
		toolbar: "bottom",
		location: "center",
		options: {
			text: saveString(textBtnYes),
			type: "success",
			stylingMode: "outlined",
			//elementAttr: {id: idn + '_save-button'},
			onClick: function (e) {
				customPopup.hide();
				deferred.resolve();
			}
		}
	});
	if (textBtnNo != '' && textBtnNo != null) {
		items.push({
			widget: "dxButton",
			toolbar: "bottom",
			location: "center",
			options: {
				text: saveString(textBtnNo),
				type: "cancel",
				stylingMode: "outlined",
				//elementAttr: {id: idn + '_save-button'},
				onClick: function (e) {
					customPopup.hide();
					deferred.reject();
				}
			}
		});
	}
	var customPopup = $popupContainer.dxPopup({
		width: "auto",
		height: "auto",
		maxWidth: "50%",
		maxHeight: "50%",
		contentTemplate: function () {
			return $("<div />").append(
				$('<p>' + message + '</p>')
			);
		},
		toolbarItems: items,
		showTitle: true,
		title: saveString(title),
		visible: false,
		dragEnabled: true,
		closeOnOutsideClick: true,
		showCloseButton:false,
	}).dxPopup("instance");
	customPopup.show();
	//activatePopup("popup_error");
	return deferred.promise();
}

function initInfoDialog(message, title, addclass, textBtn) {
	return initConfirmDialog(message, title, addclass, textBtn, null);
}
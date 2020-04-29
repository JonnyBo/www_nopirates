const app = new App();
const DEBUG = false;

$(async () => {
    await app.init();
});

DevExpress.ui.dxLoadIndicator.defaultOptions({
    options: {
        indicatorSrc: '/img/loader.svg'
    }
});



let autoComplete = "off";
const userAgent = detect.parse(navigator.userAgent);
if (userAgent.browser.family == "Chrome")
    autoComplete = "new";
if (userAgent.browser.family == "Safari")
    autoComplete = "false";

DevExpress.ui.dxTextBox.defaultOptions({
    options: {
        onContentReady: function (info) {
            $(info.element).find("input").attr("autocomplete", autoComplete);
        },
    }
});

DevExpress.ui.dxSelectBox.defaultOptions({
    options: {
        onContentReady: function (info) {
            $(info.element).find("input").attr("autocomplete", "false");
        },
    }
});

DevExpress.config({
//thousandsSeparator: ' ',
    editorStylingMode: 'underlined'
});

$.Color.fn.contrastColor = function () {
    var r = this._rgba[0], g = this._rgba[1], b = this._rgba[2];
    return (((r * 299) + (g * 587) + (b * 144)) / 1000) >= 131.5 ? "myls-color-black" : "myls-color-white";
};

//сохранение настроек
setInterval(function () {
    app.saveSettings();
}, 5000);
/*
window.onerror = function(message, url, lineNumber) {
    alert("Поймана ошибка, выпавшая в глобальную область!\n" +
        "Сообщение: " + message + "\n(" + url + ":" + lineNumber + ")");
};
*/
//клик по пункту главного меню
$(document.body).on('click', '.panel-list .dx-item-content a', function () {
    const url = $(this).attr('href');
    app.openTabFromUrl(url);
});

//клик по крестику закрывающему верхний таб
$(document.body).on('click', '#tabpanel .dx-item .dx-item-content .dx-icon-close', function () {
    const idn = $(this).attr('data-tab');
    app.topTabs.closeTab(idn);
});

//клик по крестику закрывающему нижний таб
$(document.body).on('click', '#bottomPopupTabs .dx-item .dx-item-content .dx-icon-close', function () {
    const idn = $(this).attr('data-tab');
    app.bottomTabs.closeTab(idn);
});

//клик по popup
$(document.body).on('click', '.dx-popup .dx-popup-title', function () {
    const idnPopup = $(this).parents(".dx-popup").attr('id');
    app.bottomTabs.activateTabByIdn(idnPopup);
});

//подсказки
$(document.body).on('click', '.myls-tooltip', function () {
    const id = $(this).attr('id');
    let target = '';
    let url = $(this).attr('data-href');
    const type = $(this).attr('data-type');
    const info = $(this).text();
    if (url.indexOf("tel:") == -1 && url.indexOf("mailto:") == -1) {
        target = 'target="_blank"';
    }
    app.tooltip.option('contentTemplate', '<a href="' + url + '" ' + target + '><i class="dx-icon-' + type + '"></i> ' + info + '</a>');
    app.tooltip.show('#' + id);
});

//открывать объекты по ссылке
$(document.body).on('click', '.myls-open-object', function (e) {
    e.stopPropagation();
    app.openTabFromUrl($(e.target).attr('data-url'));
    //console.log(e);
});
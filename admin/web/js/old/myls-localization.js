function saveString(str) {
    if (!str) return '';
    str = str.trim();
    if (str != '') {
        var hash = CryptoJS.MD5(str.toLowerCase());
        $.each(translate, function (index, item) {
            //console.log(item);
            if (!item.hasOwnProperty(hash)) {
                item[hash] = str;
            }
        });
        return translate[config.lang][hash];
    }
    return '';
}

function saveTranslateColumns(columns) {
    $.each(columns, function (_, col) {
        $.each(col.columns, function (index, item) {
            if (item.caption != '') {
                item.caption = saveString(item.caption);
            }
        });
        //saveFileTranslate();
    });
    DevExpress.localization.loadMessages(translate);
}

function saveTranslateTableInfo(table) {
    $.each(table, function (_, info) {
        if (info.name != '') {
            info.name = saveString(info.name);
        }
        //saveFileTranslate();
    });
    DevExpress.localization.loadMessages(translate);
}

function saveTranslateContextMenu(menus) {
    $.each(menus, function (_, menu) {
        $.each(menu, function (index, item) {
            if (item.text != '') {
                item.text = saveString(item.text);
            }
            if (item.title != '') {
                item.title = saveString(item.title);
            }
        });
        //saveFileTranslate();
    });
    DevExpress.localization.loadMessages(translate);
}

function saveTranslateMenu(menu) {
    $.each(menu, function (index, item) {
        item.key = saveString(item.key);
        if (item.items.length > 0) {
            $.each(item.items, function (i, el) {
                if (el.text != '') {
                    el.text = saveString(el.text);
                }
                if (el.title != '') {
                    el.title = saveString(el.title);
                }
            });
        }
    });
    DevExpress.localization.loadMessages(translate);
    //saveFileTranslate();
}

function saveTranslateForm(form) {
    //console.log(form);
    for (var key in form) {
        if (form[key].hasOwnProperty('label')) {
            if (form[key].label['text'] != '') {
                form[key].label['text'] = saveString(form[key].label['text']);
            }
        }
        if (form[key].hasOwnProperty('caption')) {
            if (form[key].caption != '') {
                form[key].caption = saveString(form[key].caption);
            }
        }
        if (form[key].hasOwnProperty('editorOptions') && form[key].editorOptions.hasOwnProperty('text')) {
            if (form[key].editorOptions.text != '') {
                form[key].editorOptions.text = saveString(form[key].editorOptions.text);
            }
        }
        if (form[key].hasOwnProperty('placeholder')) {
            if (form[key].caption != '') {
                form[key].caption = saveString(form[key].placeholder);
            }
        }
    }
    DevExpress.localization.loadMessages(translate);
}

function saveTranslateBlock(template) {
    $('[role=caption], [role=postcaption]', $(template)).each(function (i, el) {
        if ($(el).text() != '') {
            var str = saveString($(el).text());
            $(el).text(str);
        }
    });
    /*
    $('span, div', $(template)).each(function (i, el) {
        if ($(el).text() != '') {
            var str = saveString($(el).text());
            $(el).text(str);
        }
    });
    */
    DevExpress.localization.loadMessages(translate);
    //saveFileTranslate();
}

function saveFileTranslate() {
    if (mode == 'development') {
        $.ajax({
            type: "post",
            cache: false,
            url: "/site/savetranslate",
            data: ({data: translate}),
            success: function (data) {
                //translate = $.parseJSON(data);
            }
        });
    }
}

function get_cookie(cookie_name) {
    var results = document.cookie.match('(^|;) ?' + cookie_name + '=([^;]*)(;|$)');
    if (results)
        return (unescape(results[2]));
    else
        return null;
}

function getCookie(name) {
    var matches = document.cookie.match(new RegExp('(?:^|\s)' + name + '=(.*?)(?:;|$)'));
    return matches[1];
}

function changeLocale(data) {
    config.lang = data;
    //config.tabs = null;
    allowSaveSetting = true;
    //var siteTranslate = getData("/site/loadtranslate", "json");
    $.when(saveSettings()).done(function (sett) {
        window.location.href = '/';
    }).fail(function () {
        //deferred.reject();
    });
}

function changeLocaleLogin(data) {
    console.log(data);
    config.lang = data;
    allowSaveSetting = true;
    var siteTranslate = getData("/site/loadtranslate", "json");
    $.when(saveSettings(), siteTranslate).done(function (sett, currTranslate) {
        DevExpress.localization.loadMessages(currTranslate);
        if (currTranslate != '') {
            translate = currTranslate;
        }
        DevExpress.localization.locale(config.lang);
        var auth = $("#mylsAuthForm").dxForm('instance');
        auth.option('items', getLoginItems());
        auth.repaint();
        //document.location.reload();
    }).fail(function () {
        //deferred.reject();
    });
}

function changeLocaleRestore(data) {
    console.log(data);
    config.lang = data;
    allowSaveSetting = true;
    var siteTranslate = getData("/site/loadtranslate", "json");
    $.when(saveSettings(), siteTranslate).done(function (sett, currTranslate) {
        DevExpress.localization.loadMessages(currTranslate);
        if (currTranslate != '') {
            translate = currTranslate;
        }
        DevExpress.localization.locale(config.lang);
        var auth = $("#mylsRestoreForm").dxForm('instance');
        auth.option('items', getRestoreItems());
        auth.repaint();
        //document.location.reload();
    }).fail(function () {
        //deferred.reject();
    });
}

function changeLocaleRegistration(data) {
    console.log(data);
    config.lang = data;
    allowSaveSetting = true;
    var siteTranslate = getData("/site/loadtranslate", "json");
    $.when(saveSettings(), siteTranslate).done(function (sett, currTranslate) {
        DevExpress.localization.loadMessages(currTranslate);
        if (currTranslate != '') {
            translate = currTranslate;
        }
        DevExpress.localization.locale(config.lang);
        var auth = $("#mylsRegistrationForm").dxForm('instance');
        auth.option('items', getRegistrationItems());
        auth.repaint();
        //document.location.reload();
    }).fail(function () {
        //deferred.reject();
    });
}

/*
function getLocale() {
    //var locale = get_cookie("locale");
    //setSettings();
    var locale = config.lang;
    return locale != null ? locale : "en";
}
*/
function setLocale(locale) {
    config.lang = locale;
    saveSettings();
    //document.cookie = "locale="+locale+"; path=/; max-age=8640000";
}


var translate = {
    "en": {
        /*
        "myls-totalCount": "Total items: {0}",
        "myls-error": "Error",
        "myls-login": "Username",
        "myls-password": "Password",
        "myls-rememberme": "Remember me",
        "myls-login-button": "Login",
        "myls-yes": "Yes",
        "myls-no": "No",
        "myls-warning": "Warning",
        "myls-language": "Language",
        "myls-ru": "Русский",
        "myls-en": "English",
        "myls-es": "Español",
        "myls-out": "Out",
        "myls-saveadd":"Save & Add"
         */
    },
    "es": {
        /*
        "greeting": "Hola, {0} {1}!",
        "myls-language": "Language",
        "myls-ru": "Русский",
        "myls-en": "English",
        "myls-es": "Español",
        "myls-out": "Out",

         */
    },
    "ru":
        {
            /*
            "myls-totalCount": "\u0412\u0441\u0435\u0433\u043e\u0020\u0437\u0430\u043f\u0438\u0441\u0435\u0439\u003a {0}",
            "myls-error": "Ошибка",
            "myls-login": "Имя пользователя",
            "myls-password": "Пароль",
            "myls-rememberme": "Запомнить меня",
            "myls-login-button": "Войти",
            "myls-yes": "Да",
            "myls-no": "Нет",
            "myls-warning": "Предупреждение",
            "myls-language": "Язык",
            "myls-ru": "Русский",
            "myls-en": "English",
            "myls-es": "Español",
            "myls-out": "Выход",
            "myls-saveadd":"Сохранить и добавить"

             */
        }
};
DevExpress.localization.loadMessages(translate);
var mode = 'development';
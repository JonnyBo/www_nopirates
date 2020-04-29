//получение данных
async function getData(url, method, data) {
    if (data === null || data === undefined) data = '';
    try {
        let response = await fetch(url, {
            type: method,
            headers: {
                'Content-Type': 'application/json;charset=utf-8'
            },
            body: data
        });
        let result = await response.json();
        if (result.error && result.error != '') {
            console.log(result.error);
        } else {
            return result;
        }
    } catch (e) {
        console.log(e);
    }
    /*
    let promise = new Promise((resolve, reject) => {
        $.ajax({
            url: url,
            type: method,
            cache: false,
            data: (data),
            success: function (result) {
                if (result) {
                    var res = $.parseJSON(result);
                    if (res.error && res.error != '') {
                        deferred.reject(res.error);
                    } else {
                        deferred.resolve(result ? res : []);
                    }
                } else {
                    deferred.resolve([]);
                }

            },
            error: function (data) {
                deferred.reject();
            },
        });
    });
    var deferred = $.Deferred();
    $.ajax({
        url: url,
        type: method,
        cache: false,
        data: (data),
        success: function (result) {
            if (result) {
                var res = $.parseJSON(result);
                if (res.error && res.error != '') {
                    deferred.reject(res.error);
                } else {
                    deferred.resolve(result ? res : []);
                }
            } else {
                deferred.resolve([]);
            }

        },
        error: function (data) {
            deferred.reject();
        },
    });
    return deferred.promise();
    */
}

//сохранение данных
function setData(url, method, data) {
    if (data === null || data === undefined) data = '';
    var deferred = $.Deferred();
    $.ajax({
        url: url,
        type: method,
        cache: false,
        data: (data),
        success: function (result) {
            var res = $.parseJSON(result);
            if (res.error && res.error != '') {
                deferred.reject(res.error);
            } else {
                deferred.resolve(result ? res : '');
            }
        },
        error: function () {
            deferred.reject(saveString("Data from ") + url + saveString(" Loading Error"));
        },
    });
    return deferred.promise();
}

function getSettings() {
    var deferred = new $.Deferred;
    var setting = getData('/site/settings', 'post', null);
    $.when(setting).done(function (sett) {
        //debugger;
        config = sett;
        config.lang = config.lang ? config.lang : "en";
        config.company_id = config.company_id ? config.company_id : 1;
        config.client_id = config.client_id ? config.client_id : null;
        DevExpress.localization.locale(config.lang);
        //console.log(config);
        //$.cookie('lang', config.lang);
        //$.cookie('lang', config.lang, { expires: 30, path: '/', domain: '.dev.myls' });
        deferred.resolve();
    }).fail(function () {
        deferred.reject();
    });
    return deferred.promise();
}

function setSettings() {
    /*
    var deferred = new $.Deferred;
    var setting = setData('/site/settings', 'post', {'data': config});
    $.when(setting).done(function (sett) {
        deferred.resolve();
    }).fail(function () {
        deferred.reject();
    });
    return deferred.promise();
    */
    allowSaveSetting = true;
}

function saveSettings() {
    var deferred = new $.Deferred;
    //console.log(allowSaveSetting);
    if (allowSaveSetting)  {
        allowSaveSetting = false;
        var setting = setData('/site/settings', 'post', {'data': config});
        $.when(setting).done(function (sett) {
            deferred.resolve();
        }).fail(function () {
            deferred.reject();
        });
    } else {
        deferred.reject();
    }
    return deferred.promise();
}

function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.href);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, '    '));
}

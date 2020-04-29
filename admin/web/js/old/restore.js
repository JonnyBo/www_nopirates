$(function () {
    //DevExpress.localization.locale(navigator.language || navigator.browserLanguage);
    var siteTranslate = getData("/site/loadtranslate", "json");
    $.when(getSettings(), siteTranslate).done(function (sett, currTranslate) {
        //initMenu();
        DevExpress.localization.loadMessages(currTranslate);
        if (currTranslate != '') {
            translate = currTranslate;
        }

        var token = getUrlParameter('token');
        if (token) {
            $('#form-container').attr('action', '/site/restore?token='+token);
        }

        var userName = $.cookie('userName');
        userName = (userName != null) ? userName : '';
        var formData = {
            "email": userName,
            "password": "",
            "re=password": ""
        };
        var formRestoreWidget = $("#mylsRestoreForm").dxForm({
            formData: formData,
            readOnly: false,
            showColonAfterLabel: true,
            showValidationSummary: false,
            validationGroup: "customerData",
            labelLocation: "top",
            items: getRestoreItems(token)
        }).dxForm("instance");
        saveFileTranslate();
    });
});

function getRestoreItems(token) {
    var langItems = [{
        colSpan:2,
        dataField: "auth",
        label: {
            visible: false
        },
        editorOptions: {
            text: saveString("Авторизация"),
        },
        template: function(data) {
            return '<a href="/site/login" title="'+saveString("Войти")+'">'+saveString("Войти")+'</a>';
        }
    }];

    //var userLang = $.cookie('lang');

    langItems.push({
        cssClass: 'myls-login-language-block',
        //label:{ text:'Язык'},
        //itemType:'simpleItem',
        template: function (e) {
            var regLang = config.lang;
            //if (userLang)
                //loginLang = userLang;
            var result = '';
            $.each(languages, function (index, item) {
                var addclass = '';
                if (item.code == regLang)
                    addclass = ' selected';
                else
                    addclass = '';

                result += '<a class="myls-login-language ' + addclass + '" href="javascript:void(0)" onclick="changeLocaleRestore(\'' + item.code + '\')">' + item.code + '</a>';
            });
            return result;
        }
    });

    langItems = [
        {
            itemType: 'group',
            colCount: 3,
            items: langItems
        }
    ];

    var mailItems = [{
        dataField: "email",
        label: {
            text: saveString("Email"),
        },
        editorOptions: {
            stylingMode: "underlined"
        },
        validationRules: [{
            type: "required",
            message: "Email is required"
        },{
            type: "email",
            message: "Email is invalid"
        }, {
            type: "async",
            message: "Email is already registered",
            validationCallback: function(params) {
                return checkUserMail(params.value);
            }
        }]
    }];

    var passwItems = [{
        dataField: "password",
        label: {
            text: saveString("Пароль"),
        },
        editorOptions: {
            mode: "password",
            stylingMode: "underlined"
        },
        validationRules: [{
            type: "required",
            message: "Password is required"
        }]
    },{
        dataField: "re-password",
        label: {
            text: saveString("Повторите Пароль"),
        },
        editorOptions: {
            mode: "password",
            stylingMode: "underlined"
        },
        validationRules: [{
            type: "required",
            message: "Confirm Password is required"
        }, {
            type: "compare",
            message: "'Password' and 'Confirm Password' do not match",
            comparisonTarget: function() {
                return $("#mylsRestoreForm").dxForm('instance').option("formData").password;
            }
        }]
    }];

    var items = mailItems;
    if (token) {
        items = passwItems;
    }
    //console.log(items);

    var restoreItems = [{
        itemType: "group",
        //caption: "Credentials",
        items: items
    },
        {
            itemType: "group",
            //caption: "Credentials",
            items: langItems
        },
        {
            itemType: "button",
            horizontalAlignment: "center",
            buttonOptions: {
                text: saveString("Отправить"),
                type: "success",
                stylingMode: 'outlined',
                useSubmitBehavior: true
            }
        }];

    return restoreItems;
}

function checkUserMail(email) {
    var deferred = $.Deferred();
    $.ajax({
        type: "post",
        cache: false,
        url: "/site/checkuser",
        data: ({email: email}),
        success: function (data) {
            deferred.resolve(data);
        },
        error: function () {
            deferred.reject(saveString("Ошибка запроса"));
        },
    });
    return deferred.promise();
}
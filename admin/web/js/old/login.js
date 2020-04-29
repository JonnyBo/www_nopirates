$(function () {
    //отслеживаем изменение URL
    if (window.location.hash !== '') {
        localStorage.setItem('currentHash', window.location.hash);
    }
    //DevExpress.localization.locale(navigator.language || navigator.browserLanguage);
    var siteTranslate = getData("/site/loadtranslate", "json");
    $.when(getSettings(), siteTranslate).done(function (sett, currTranslate) {
        //initMenu();
        DevExpress.localization.loadMessages(currTranslate);
        if (currTranslate != '') {
            translate = currTranslate;
        }

        var userName = $.cookie('userName');
        userName = (userName != null) ? userName : '';
        var formData = {
            "username": userName,
            "password": "",
            "rememberMe": false
        };
        var formWidget = $("#mylsAuthForm").dxForm({
            formData: formData,
            readOnly: false,
            showColonAfterLabel: true,
            showValidationSummary: false,
            validationGroup: "customerData",
            labelLocation: "top",
            items: getLoginItems(),
            /*
            onContentReady: function (e) {
                getCurrentUser();
            }
             */
        }).dxForm("instance");
        saveFileTranslate();
    });
});

function getLoginItems() {
    var langItems = [{
        colSpan:2,
        dataField: "rememberMe",
        editorType: 'dxCheckBox',
        label: {
            visible: false
        },
        editorOptions: {
            text: saveString("Запомнить меня"),
            onValueChanged: function(data) {
                console.log(data.value);
            },
        },
    }];

    //var userLang = $.cookie('lang');

    langItems.push({
        cssClass: 'myls-login-language-block',
        //label:{ text:'Язык'},
        //itemType:'simpleItem',
        template: function (e) {
            var loginLang = config.lang;
            //if (userLang)
                //loginLang = userLang;
            var result = '';
            $.each(languages, function (index, item) {
                var addclass = '';
                if (item.code == loginLang)
                    addclass = ' selected';
                else
                    addclass = '';

                result += '<a class="myls-login-language ' + addclass + '" href="javascript:void(0)" onclick="changeLocaleLogin(\'' + item.code + '\')">' + item.code + '</a>';
            });
            return result;
        }
    });

    langItems.push({
        colSpan:2,
        dataField: "restore",
        label: {
            visible: false
        },
        /*
        editorOptions: {
            text: saveString("Забыли пароль?"),
        },

         */
        template: function(data) {
            return '<a href="/site/restore" title="'+saveString("Восстановить пароль")+'">'+saveString("Забыли пароль?")+'</a>';
        }
    });
/*
    langItems.push({
        colSpan:2,
        dataField: "registration",
        label: {
            visible: false
        },

        template: function(data) {
            return '<a href="/site/registration?token=MQ==" title="'+saveString("Зарегистрироваться")+'">'+saveString("Регистрация")+'</a>';
        }
    });
*/
    langItems = [
        {
            itemType: 'group',
            colCount: 3,
            items: langItems
        }
    ];

    var loginItems = [{
        itemType: "group",
        //caption: "Credentials",
        items: [{
            dataField: "username",
            label: {
                text: saveString("Имя пользователя"), //'Login'
            },
            editorOptions: {
                stylingMode: "underlined"
            },
            validationRules: [{
                type: "required",
                // message: "Login is required"
            }],
            //value: getCurrentUser()
        }, {
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
                //message: "Password is required"
            }]
        },
        ]
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
                text: saveString("Войти"),
                type: "success",
                stylingMode: 'outlined',
                useSubmitBehavior: true
            }
        }];

    return loginItems;
}

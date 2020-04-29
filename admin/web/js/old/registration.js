$(function () {
    //DevExpress.localization.locale(navigator.language || navigator.browserLanguage);
    var siteTranslate = getData("/site/loadtranslate", "json");
    var token = getUrlParameter('token');
    if (!token) {
        window.location.href = '/site/login';
    }
    $.when(getSettings(), siteTranslate, getUserData(token)).done(function (sett, currTranslate, userData) {
        console.log(userData);
        DevExpress.localization.loadMessages(currTranslate);
        if (currTranslate != '') {
            translate = currTranslate;
        }

        var formData = {
            "name": userData.name,
            "surname": userData.surname,
            "email": userData.email,
            "phone": "",
            "password": "",
            //"re-password": "",
            "company_id": userData.company_id,
        };

        $('#company_id').val(userData.company_id);

        var formWidgetReg = $("#mylsRegistrationForm").dxForm({
            formData: formData,
            readOnly: false,
            showColonAfterLabel: true,
            showValidationSummary: false,
            validationGroup: "customerData",
            labelLocation: "top",
            items: getRegistrationItems()
        }).dxForm("instance");
        saveFileTranslate();
    });
/*
    $("#form-container").on("submit", function(e) {
        DevExpress.ui.notify({
            message: "You have submitted the form",
            position: {
                my: "center top",
                at: "center top"
            }
        }, "success", 3000);

        e.preventDefault();
    });
*/
});

function getRegistrationItems() {
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
            return '<span>'+saveString("Уже зарегистрированы?")+'</span> <a href="/site/login" title="'+saveString("Войти")+'">'+saveString("Войти")+'</a>';
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

                result += '<a class="myls-login-language ' + addclass + '" href="javascript:void(0)" onclick="changeLocaleRegistration(\'' + item.code + '\')">' + item.code + '</a>';
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

    var registrationItems = [{
        itemType: "group",
        //caption: "Credentials",
        items: [{
            dataField: "name",
            label: {
                text: saveString("Имя"), //'Login'
            },
            editorOptions: {
                stylingMode: "underlined"
            },
            validationRules: [{
                type: "required",
                message: "Name is required"
            }]
        }, {
            dataField: "surname",
            label: {
                text: saveString("Фамилия"), //'Login'
            },
            editorOptions: {
                stylingMode: "underlined"
            },
            validationRules: [{
                type: "required",
                message: "Family is required"
            }]
        },{
            dataField: "email",
            label: {
                text: saveString("Email"), //'Login'
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
        },{
            dataField: "phone",
            //visible: false,
            label: {
                text: saveString("Телефон"), //'Login'
            },
            editorOptions: {
                stylingMode: "underlined"
            },
        },{
            dataField: "password",
            label: {
                text: saveString("Пароль"), //'Login'
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
            //dataField: "re-password",
            label: {
                text: saveString("Повторите Пароль"),
            },
            editorType: "dxTextBox",
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
                    return $("#mylsRegistrationForm").dxForm('instance').option("formData").password;
                }
            }]
        },/*{
            dataField: "company_id",
            //visible: false,
            label: {
                //text: saveString("Телефон"), //'Login'
            },
            editorOptions: {
                stylingMode: "underlined"
            },
        }*/
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
                text: saveString("Зарегистрироваться"),
                type: "success",
                stylingMode: 'outlined',
                useSubmitBehavior: true
            }
        }];

    return registrationItems;
}

function checkUserMail(email) {
    var deferred = $.Deferred();
    $.ajax({
            type: "post",
            cache: false,
            url: "/site/checkuser",
            data: ({email: email}),
            success: function (data) {
                if (data == 1) {
                    deferred.resolve(true);
                } else {
                    deferred.reject(false);
                }
            }
    });
    return deferred.promise();
}

function getUserData(token) {
    var deferred = $.Deferred();
    $.ajax({
        type: "post",
        cache: false,
        url: "/site/regurl-decode",
        data: ({token: token}),
        success: function (data) {
            deferred.resolve(JSON.parse(data));
        },
        error: function () {
            deferred.reject(false);
        },
    });
    return deferred.promise();
}
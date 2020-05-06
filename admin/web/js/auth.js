//const app = new AppCore();

class Auth {

    constructor (page) {
        this.page = page;
        this.userData = {};
        this.token = '';
        this.formIdn = '';
        switch (this.page) {
            case 'login':
                this.formIdn = 'mylsAuthForm';
                break;
            case 'registration':
                this.formIdn = 'mylsRegistrationForm';
                break;
            case 'restore':
                this.formIdn = 'mylsRestoreForm';
                this.token = app.getUrlParameter('token');
                if (this.token) {
                    $('#form-container').attr('action', 'restore?token=' + this.token);
                }
                break;
        }
    }

    getUserData(token) {
        this.userData = app.processData('site/regurl-decode', 'POST', {token: token});
    }

    checkUserMail(email) {
        return app.processData('site/checkuser', 'POST', {email: email});
    }

    createForm() {
        let userName = $.cookie('userName');
        userName = (userName != null) ? userName : '';
        this.formData = {};
        switch (this.page) {
            case 'login':
                this.formData = {
                    "username": userName,
                    "password": "",
                    "rememberMe": false
                };
                break;
            case 'registration':
                this.formData = {
                    "name": this.userData.name,
                    "surname": this.userData.surname,
                    "email": this.userData.email,
                    "phone": "",
                    "password": "",
                    //"re-password": "",
                    "company_id": this.userData.company_id,
                };
                $('#company_id').val(this.userData.company_id);
                break;
            case 'restore':
                this.formData = {
                    "email": userName,
                    "password": "",
                    "re=password": ""
                };
                break;
        }
        this.createObject();
    }

    createObject() {
        $("#" + this.formIdn).dxForm({
            formData: this.formData,
            readOnly: false,
            showColonAfterLabel: true,
            showValidationSummary: false,
            validationGroup: "customerData",
            labelLocation: "top",
            items: this.getFormItems(),
        }).dxForm("instance");
    }

    async initForm() {
        //отслеживаем изменение URL
        if (window.location.hash !== '') {
            localStorage.setItem('currentHash', window.location.hash);
        }
        let funcPromice = [app.translate.getTranslate(), app.getSettings()];
        if (this.page =='registration') {
            let token = app.getUrlParameter('token');
            if (!token) {
                window.location.href = '/site/login';
            }
            funcPromice.push(this.getUserData(token));
        }
        Promise.all(funcPromice).then(() => {
            this.createForm();
            //let translate = new MylsLocalization()
            app.translate.saveFileTranslate();
        });
    }

    getFormItems() {
        //const langItems = this.getLangItems(formIdn);
        this.formItems = [];
        let btnText = "Войти";
        if (this.page == 'login') {
            this.formItems.push({
                itemType: "group",
                items: [
                    this.getUserName(),
                    this.getPassword()
                ]
            });
        }
        if (this.page == 'registration') {
            this.formItems.push({
                itemType: "group",
                //caption: "Credentials",
                items: [
                    this.getName(),
                    this.getSurname(),
                    this.getEmail(),
                    this.getPhone(),
                    this.getPassword(),
                    this.getRePassword()
                ]
            });
            btnText = "Зарегистрироваться";
        }
        if (this.page == 'restore') {
            let mailItems = [
                this.getEmail()
            ];

            let passwItems = [
                this.getPassword(),
                this.getRePassword()
            ];

            let items = mailItems;
            if (this.token) {
                items = passwItems;
            }
            this.formItems.push({
                itemType: "group",
                items: items
            });
            btnText = "Отправить";
        }
        this.formItems.push({
            itemType: "group",
            items: this.getLangItems()
        });
        this.formItems.push({
            itemType: "button",
            horizontalAlignment: "center",
            buttonOptions: {
                text: app.translate.saveString(btnText),
                type: "success",
                stylingMode: 'outlined',
                useSubmitBehavior: true
            }
        });
        return this.formItems;
    }

    getUserName() {
        return {
            dataField: "username",
            label: {
                text: app.translate.saveString("Имя пользователя"), //'Login'
            },
            editorOptions: {
                stylingMode: "underlined"
            },
            validationRules: [{
                type: "required",
            }],
        }
    }

    getPassword() {
        return {
            dataField: "password",
            label: {
                text: app.translate.saveString("Пароль"),
            },
            editorOptions: {
                mode: "password",
                stylingMode: "underlined"
            },
            validationRules: [{
                type: "required",
            }]
        }
    }

    getName() {
        return {
            dataField: "name",
            label: {
                text: app.translate.saveString("Имя"), //'Login'
            },
            editorOptions: {
                stylingMode: "underlined"
            },
            validationRules: [{
                type: "required",
                message: "Name is required"
            }]
        }
    }

    getSurname() {
        return {
            dataField: "surname",
            label: {
                text: app.translate.saveString("Фамилия"), //'Login'
            },
            editorOptions: {
                stylingMode: "underlined"
            },
            validationRules: [{
                type: "required",
                message: "Family is required"
            }]
        }
    }

    getEmail() {
        const self = this;
        return {
            dataField: "email",
            label: {
                text: app.translate.saveString("Email"), //'Login'
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
                    return self.checkUserMail(params.value);
                }
            }]
        }
    }

    getPhone() {
        return {
            dataField: "phone",
            //visible: false,
            label: {
                text: app.translate.saveString("Телефон"), //'Login'
            },
            editorOptions: {
                stylingMode: "underlined"
            },
        }
    }

    getRePassword() {
        const self = this;
        return {
            //dataField: "re-password",
            label: {
                text: app.translate.saveString("Повторите Пароль"),
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
                    return $("#" + self.formIdn).dxForm('instance').option("formData").password;
                }
            }]
        }
    }


    getLangItems() {
        let langItems = [];
        if (this.page =='login') {
            langItems.push(this.getRememberMe());
        } else {
            langItems.push(this.getLinkAuth());
        }
        langItems.push(this.getLanguages());
        if (this.page =='login') {
            langItems.push(this.getLinkRestore());
        }
        return [
            {
                itemType: 'group',
                colCount: 3,
                items: langItems
            }
        ];
    }

    getRememberMe() {
        return {
            colSpan: 2,
            dataField: "rememberMe",
            editorType: 'dxCheckBox',
            label: {
                visible: false
            },
            editorOptions: {
                text: app.translate.saveString("Запомнить меня"),
                onValueChanged: function (data) {
                    console.log(data.value);
                },
            },
        }
    }

    getLinkAuth() {
        return {
            colSpan:2,
            dataField: "auth",
            label: {
                visible: false
            },
            editorOptions: {
                text: app.translate.saveString("Авторизация"),
            },
            template: function(data) {
                return '<a href="login" title="'+app.translate.saveString("Войти")+'">'+app.translate.saveString("Войти")+'</a>';
            }
        }
    }

    getLanguages() {
        return {
            cssClass: 'myls-login-language-block',
            template: function (e) {
                let loginLang = app.config.lang;
                let result = '';
                $.each(languages, function (index, item) {
                    let addclass = '';
                    if (item.code == loginLang)
                        addclass = ' selected';
                    else
                        addclass = '';

                    result += '<a class="myls-login-language ' + addclass + '" href="javascript:void(0)" onclick="app.translate.changeLocaleForm(\'' + item.code + '\')">' + item.code + '</a>';
                });
                return result;
            }
        }
    }

    getLinkRestore() {
        return {
            colSpan: 2,
            dataField: "restore",
            label: {
                visible: false
            },
            template: function (data) {
                return '<a href="restore" title="' + app.translate.saveString("Восстановить пароль") + '">' + app.translate.saveString("Забыли пароль?") + '</a>';
            }
        }
    }

    changeLocaleForm() {
        let authForm = $("#"+this.formIdn).dxForm('instance');
        authForm.option('items', this.getFormItems());
        authForm.repaint();
    }

}


const app = new AppCore();
let curUrl = document.location.pathname;
let page = curUrl.split('/').pop();
const auth = new Auth(page);
auth.initForm();

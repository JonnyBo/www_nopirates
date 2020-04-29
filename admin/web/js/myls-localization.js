class MylsLocalization {

    constructor(translate) {
        this.translate = translate;
        this.mode = 'development';
    }

    async getTranslate() {

        let translate = await app.processData("/site/loadtranslate", "post");
        DevExpress.localization.loadMessages(translate);
        if (translate != '') {
            this.translate = translate;
        }
    }

    saveString(str) {
        if (!str) return '';
        str = str.trim();
        if (str != '') {
            let hash = CryptoJS.MD5(str.toLowerCase());
            $.each(this.translate, (index, item) => {
                if (!item.hasOwnProperty(hash)) {
                    item[hash] = str;
                }
            });
            return this.translate[app.config.lang][hash];
        }
        return '';
    }

    saveTranslateColumns(columns) {
        let self = this;
        $.each(columns, (_, col) => {
            $.each(col.columns, (index, item) => {
                if (item.caption != '') {
                    item.caption = self.saveString(item.caption);
                }
            });
            //saveFileTranslate();
        });
        DevExpress.localization.loadMessages(this.translate);
    }

    saveTranslateTableInfo(table) {
        let self = this;
        $.each(table, function (_, info) {
            if (typeof info === 'object' && info.hasOwnProperty('name') && info.name != '') {
                info.name = self.saveString(info.name);
            }
            //saveFileTranslate();
        });
        DevExpress.localization.loadMessages(this.translate);
    }

    saveTranslateContextMenu(menus) {
        let self = this;
        $.each(menus, function (_, menu) {
            $.each(menu, function (index, item) {
                if (item.text != '') {
                    item.text = self.saveString(item.text);
                }
                if (item.title != '') {
                    item.title = self.saveString(item.title);
                }
            });
            //saveFileTranslate();
        });
        DevExpress.localization.loadMessages(this.translate);
    }

    saveTranslateMenu(menu) {
        let self = this;
        $.each(menu, function (index, item) {
            item.key = self.saveString(item.key);
            if (item.items.length > 0) {
                $.each(item.items, function (i, el) {
                    if (el.text != '') {
                        el.text = self.saveString(el.text);
                    }
                    if (el.title != '') {
                        el.title = self.saveString(el.title);
                    }
                });
            }
        });
        DevExpress.localization.loadMessages(this.translate);
        //saveFileTranslate();
    }

    saveTranslateForm(form) {
        //console.log(form);
        for (var key in form) {
            if (form[key].hasOwnProperty('label')) {
                if (form[key].label['text'] != '') {
                    form[key].label['text'] = this.saveString(form[key].label['text']);
                }
            }
            if (form[key].hasOwnProperty('caption')) {
                if (form[key].caption != '') {
                    form[key].caption = this.saveString(form[key].caption);
                }
            }
            if (form[key].hasOwnProperty('editorOptions') && form[key].editorOptions.hasOwnProperty('text')) {
                if (form[key].editorOptions.text != '') {
                    form[key].editorOptions.text = this.saveString(form[key].editorOptions.text);
                }
            }
            if (form[key].hasOwnProperty('placeholder')) {
                if (form[key].caption != '') {
                    form[key].caption = this.saveString(form[key].placeholder);
                }
            }
        }
        DevExpress.localization.loadMessages(this.translate);
    }

    saveTranslateBlock(template) {
        const self = this;
        $('[role=caption], [role=postcaption]', $(template)).each(function (i, el) {
            if ($(el).text() != '') {
                let str = self.saveString($(el).text());
                $(el).text(str);
            }
        });
        DevExpress.localization.loadMessages(this.translate);
    }

    saveFileTranslate() {
        if (this.mode == 'development') {
            app.processData("/site/savetranslate", 'post', {data: this.translate});
        }
    }

    async changeLocale(data) {
        app.config.lang = data;
        app.allowSaveSetting = true;
        await app.saveSettings();
        window.location.href = '/';
    }

    async changeLocaleForm(data) {
        app.config.lang = data;
        app.allowSaveSetting = true;
        await app.saveSettings();
        DevExpress.localization.locale(app.config.lang);
        auth.changeLocaleForm();
    }

/*
    async changeLocaleLogin(data) {
        app.config.lang = data;
        app.allowSaveSetting = true;
        await app.saveSettings();
        DevExpress.localization.locale(app.config.lang);
        let auth = $("#mylsAuthForm").dxForm('instance');
        auth.option('items', getLoginItems());
        auth.repaint();
    }

    changeLocaleRestore(data) {
        //console.log(data);
        app.config.lang = data;
        app.allowSaveSetting = true;
        var siteTranslate = app.processData("/site/loadtranslate", "json");
        $.when(app.saveSettings(), siteTranslate).done(function (sett, currTranslate) {
            DevExpress.localization.loadMessages(currTranslate);
            if (currTranslate != '') {
                this.translate = currTranslate;
            }
            DevExpress.localization.locale(app.config.lang);
            var auth = $("#mylsRestoreForm").dxForm('instance');
            auth.option('items', getRestoreItems());
            auth.repaint();
            //document.location.reload();
        }).fail(function () {
            //deferred.reject();
        });
    }

    changeLocaleRegistration(data) {
        //console.log(data);
        app.config.lang = data;
        app.allowSaveSetting = true;
        var siteTranslate = app.processData("/site/loadtranslate", "json");
        $.when(app.saveSettings(), siteTranslate).done(function (sett, currTranslate) {
            DevExpress.localization.loadMessages(currTranslate);
            if (currTranslate != '') {
                this.translate = currTranslate;
            }
            DevExpress.localization.locale(app.config.lang);
            var auth = $("#mylsRegistrationForm").dxForm('instance');
            auth.option('items', getRegistrationItems());
            auth.repaint();
            //document.location.reload();
        }).fail(function () {
            //deferred.reject();
        });
    }
*/
    setLocale(locale) {
        app.config.lang = locale;
        app.saveSettings();
        //document.cookie = "locale="+locale+"; path=/; max-age=8640000";
    }

    destroy() {
        app.destroyArray(this.translate);
    }

}

//var mode = 'development';
class AppToolbar {
    constructor() {
        this.object = {};
    }

    init() {
        this.allSearchLookupDataSource = this.getAllSearchLookupDataSource();
        this.toolbarItems = this.getMainToolbarItems();
        this.getAllIcons(app.appInfo.menu);
        this.createObject();
    }

    createObject() {
        this.object = $("#toolbar").dxToolbar({
            items: this.toolbarItems
        }).dxToolbar('instance');
    }

    getMainToolbarItems() {
        return [
            {
                widget: "dxButton",
                location: "before",
                cssClass: "menu-button",
                options: {

                    icon: "menu",
                    onClick: function () {
                        app.drawer.toggle();
                    }
                }
            },
            {
                text: siteName,
                location: "before",
                cssClass: "mylsTitle",
                cssStyle: "mylsTitle",

            },
            this.getAllSearchLookup(),
            this.getToolbarMenu()
        ];
    }

    getAllIcons(item) {
        for (let idx in item) {
            if (item[idx].objectType != 'menuGroup' && app.appInfo.tables[item[idx].id].iconName && app.appInfo.tables[item[idx].id].showInToolbar) {
                //let self = this;
                this.toolbarItems.push({
                    widget: "dxButton",
                    locateInMenu: 'auto',
                    options: {
                        elementAttr: {
                            class: "myls-main-toolbar-icon"
                        },
                        icon: app.appInfo.tables[item[idx].id].iconName,
                        hint: item[idx].text,
                        //visible: !isEdit,
                        onClick: function (e) {
                            let url = "#" + app.getIdn(item[idx].objectType, item[idx].id, '', item[idx].objectView);
                            app.openTabFromUrl(url);
                        }
                    },
                    location: "center",
                });
            }
            if (item[idx].items) {
                this.getAllIcons(item[idx].items);
            }
        }
    }

    getTopMenuItems() {
        return [{
            id: "2",
            html: '<div class="myls-notifications" style="position: relative; margin-right: 10px;"><i class="fa fa-bell-o"></i><span class="myls-count-notifications">0</span></div>',
            notification: true,
        }, {
            id: "3",
            //html: '<i id="logout" class="dx-icon-runner"></i>',
            icon: 'img/blank-avatar.svg',
            items: [{
                id: "help",
                name: app.translate.saveString("Помощь"),
                linkOut: 'https://www.manula.com/manuals/myls/myls-school-knowledge-base/1/ru/topic/myls-school-how-to-work',
            }, {
                id: "lang",
                name: app.translate.saveString("Язык"),
                items: app.getLanguages(),
            }, {
                id: "3_2",
                name: app.translate.saveString("Выход"),
                link: 'logout',
            }]
        }];
    }

    getAllSearchLookupDataSource() {
        return new DevExpress.data.DataSource({
            paginate: false,
            group: "category",
            store: new DevExpress.data.CustomStore({
                    key: "id",
                    loadMode: "raw",
                    cacheRawData:false,
                    load: async function (loadOptions) {
                        let params = {'lang': app.config.lang};
                        let result = await app.processData('form/getallsearchlookup', 'post', params);
                        return result;
                    },
                }
            )
        });
    }

    getAllSearchLookup() {
        const self = this;
        return {
            widget: "dxSelectBox",
            location: "after",
            options: {
                width: 240,
                displayExpr: 'item',
                grouped: true,
                dataSource: this.allSearchLookupDataSource,
                closeOnOutsideClick: true,
                showClearButton: true,
                buttons: ['clear', 'dropDown'],
                searchExpr: 'item',
                searchEnabled: true,
                placeholder: app.translate.saveString("Искать в приложении"),
                valueExpr: 'id',
                keyExpr: 'id',
                acceptCustomValue: false,
                dropDownButtonTemplate: function () {
                    return $("<span class='dx-icon-search myls-allsearch-icon'></span>");
                },
                onValueChanged: async function (data) {
                    let dd = await self.allSearchLookupDataSource.store().byKey(data.value);
                    await app.openPopup(dd.form_id, dd.ext_id, 'form', 'upd', []);
                }
            }
        };
    }

    getToolbarMenu() {
        return {
            widget: "dxMenu",
            location: "after",
            cssClass: "user-menu",
            options: {
                dataSource: this.getTopMenuItems(),
                hideSubmenuOnMouseLeave: false,
                SubmenuDirection: 'LeftOrTop',
                displayExpr: "name",
                cssClass: "user-menu",
                onItemClick: function (data) {
                    let item = data.itemData;
                    if (item.link) {
                        window.location.href = item.link;
                    }
                    if (item.linkOut) {
                        window.open(item.linkOut);
                    }
                    if (item.lang) {
                        app.translate.changeLocale(item.lang);
                    }
                    if (item.notification) {
                        app.openTabFromUrl(app.getIdn('grid', app.config.notification, undefined, 'tab'));
                    }
                }
            }
        }
    }

    destroy() {
        app.destroyArray(this.allSearchLookupDataSource);
        app.destroyArray(this.toolbarItems);
        this.object = null;
    }

}
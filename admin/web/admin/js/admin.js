//инициализация основных данных
function initData(table, ext_id, objectType) {
    //получаем столбцы таблицы
    /*var tableColumns = getData('/' + objectType + '/getcols', 'get', {'table': table, 'extId': ext_id});
    //добавляем названия столбцов в файл переводов для текущей локали
    saveTranslateColumns(tableColumns);*/
    //получаем данные таблицы
    //var tableData = getData('/' + objectType + '/tabledata', 'get', {'id': table, 'extId': ext_id});
    //получаем контекстное меню таблицы
    //var contextMenuData = getData('menu/getcontextmenu', 'get', {'id': table});
    //добавляем названия в файл переводов для текущей локали
    //saveTranslateContextMenu(contextMenuData);
    //получаем данные для тулбара
    var tableInfo = getTableInfo(table);
    var tableColumns = getTableColumns(table);
    var contextMenuData = getContextMenu(table);
    //добавляем названия в файл переводов для текущей локали
    //saveTranslateTableInfo(tableInfo);
    return {
        'tableColumns': tableColumns,
        //'tableData': tableData,
        'contextMenuData': contextMenuData,
        'tableInfo': tableInfo
    };
}

function cloneObject(obj) {
    return obj ? JSON.parse(JSON.stringify(obj)) : undefined;
}

function getTableInfo(tableId) {
    if (!appInfo.tables) {
        $.when(getAllTablesInfo()).done(function () {
            return cloneObject(appInfo.tables[tableId]);
        });
    } else
        return cloneObject(appInfo.tables[tableId]);
}

function getContextMenu(tableId) {
    if (!appInfo.contextMenu) {
        $.when(getAllContextMenu()).done(function () {
            return cloneObject(appInfo.contextMenu[tableId]);
        });
    } else
        return cloneObject(appInfo.contextMenu[tableId]);
}

function getTableColumns(tableId) {
    if (!appInfo.columns) {
        $.when(getAllColumns()).done(function () {
            return cloneObject(appInfo.columns[tableId]);
        });
    } else
        return cloneObject(appInfo.columns[tableId]);
}

function getTemplate(tableId) {
    if (!appInfo.templates) {
        $.when(getAllTemplates()).done(function () {
            return cloneObject(appInfo.templates[tableId]);
        });
    } else
        return cloneObject(appInfo.templates[tableId]);
}

function setTemplate(tableId, template) {
    if (!appInfo.templates) {
        $.when(getAllTemplates()).done(function () {
            appInfo.templates[tableId] = template;
        });
    } else
        appInfo.templates[tableId] = template;;
}

function getAllTablesInfo() {
    var deferred = $.Deferred();
    if (!Object.keys(appInfo.tables).length) {
        var tableInfo = getData('frame/getalltablesinfo', 'get', {});
        $.when(tableInfo).done(function (data) {
            appInfo.tables = data;
            //добавляем названия в файл переводов для текущей локали
            saveTranslateTableInfo(data);
            deferred.resolve();
        });
    }
    return deferred;
}

function getAllTemplates() {
    var deferred = $.Deferred();
    if (!Object.keys(appInfo.templates).length) {
        var templates = getData('frame/getalltemplates', 'get', {});
        $.when(templates).done(function (data) {
            appInfo.templates = data;
            //добавляем названия в файл переводов для текущей локали
            saveTranslateTableInfo(data);
            deferred.resolve();
        });
    }
    return deferred;
}

function getAllContextMenu() {
    var deferred = $.Deferred();
    if (!Object.keys(appInfo.contextMenu).length) {
        var menus = getData('menu/getallcontextmenu', 'get', {});
        $.when(menus).done(function (data) {
            //добавляем названия в файл переводов для текущей локали
            saveTranslateContextMenu(data);
            appInfo.contextMenu = data;
            deferred.resolve();
        });

    }
    return deferred;
}

function getAllColumns() {
    var deferred = $.Deferred();
    if (!Object.keys(appInfo.columns).length) {
        var columns = getData('frame/getallcols', 'get', {});
        $.when(columns).done(function (data) {
            appInfo.columns = data;
            //console.log(appInfo);
            //добавляем названия в файл переводов для текущей локали
            saveTranslateColumns(data);
            deferred.resolve();
        });

    }
    return deferred;
}

//вывод загрузки
function openLoadPanel(idn) {
    //$("#"+idn).append('<div id="' + idn + '-loadpanel"></div>');
    var loadPanel = $('#' + idn + '-loadpanel').dxLoadPanel({
        //shadingColor: "rgba(0,0,0,0.4)",
        position: {
            of: "#" + idn,
            at: "center center"
        },
        visible: false,
        showIndicator: true,
        showPane: false,
        //shading: true,
        message: saveString('Загрузка'),
        container: '#' + idn + '-loadpanel',
        closeOnOutsideClick: false,
        indicatorSrc: "/img/loader.svg"
    }).dxLoadPanel("instance");
    if (loadPanel)
        loadPanel.show();
}

function closeLoadPanel(idn) {
    var loadPanel = $('#' + idn + '-loadpanel').dxLoadPanel().dxLoadPanel("instance");
    if (loadPanel)
        loadPanel.hide();
}

function closeAllLoadPanel(idn) {
    var loadPanel = $('.dx-loadpanel').dxLoadPanel().dxLoadPanel("instance");
    if (loadPanel)
        loadPanel.hide();
}

function initObject(table, ext_id, view, type, mode, tHistory, params, viewMode) {
    //console.log(tHistory);
    var deferred = $.Deferred();
    if (!ext_id)
        ext_id = undefined;
    switch (type) {
        case 'dashboard':
            initDashboard(table, ext_id, view, mode, tHistory);
            deferred.resolve();
            break;

        case 'form':
            $.when(initForm(table, ext_id, view, mode, tHistory, params)).done(function (id) {
                deferred.resolve(id);
            }).fail(function () {
                deferred.reject();
            });
            break;

        case 'formEditor':
            $.when(initFormEditor(table)).done(function (id) {
                deferred.resolve(id);
            }).fail(function () {
                deferred.reject();
            });
            break;

        case 'grid':
            $.when(initTable(table, ext_id, view, mode, tHistory, viewMode)).done(function (object) {
                deferred.resolve(object);
            }).fail(function () {
                deferred.reject();
            });
            break;

        case 'tree':
            $.when(initTree(table, ext_id, view, mode, tHistory)).done(function (object) {
                deferred.resolve(object);
            }).fail(function () {
                deferred.reject();
            });
            break;

        case 'cards':
            $.when(initCards(table, ext_id, view, mode, tHistory)).done(function (object) {
                deferred.resolve(object);
            }).fail(function () {
                deferred.reject();
            });
            break;

        case 'scheduler':
            $.when(initScheduler(table, ext_id, view, mode, tHistory)).done(function (object) {
                deferred.resolve(object);
            }).fail(function () {
                deferred.reject();
            });
            break;

        case 'documents':
            $.when(initDocuments(table, ext_id, view, mode, tHistory)).done(function (object) {
                deferred.resolve(object);
            }).fail(function () {
                deferred.reject();
            });
            break;

        case 'chart':
            $.when(initChart(table, ext_id, view, mode, tHistory, viewMode)).done(function (object) {
                deferred.resolve(object);
            }).fail(function () {
                deferred.reject();
            });
            break;
        case 'pivot':
            $.when(initPivot(table, ext_id, view, mode, tHistory)).done(function (object) {
                deferred.resolve(object);
            }).fail(function () {
                deferred.reject();
            });
            break;
        case 'kanban':
            $.when(initKanban(table, ext_id, view, mode, tHistory)).done(function (object) {
                deferred.resolve(object);
            }).fail(function () {
                deferred.reject();
            });
            break;
        case 'draglist':
            $.when(initDragList(table, ext_id, view, mode, tHistory)).done(function (object) {
                deferred.resolve(object);
            }).fail(function () {
                deferred.reject();
            });
            break;
    }
    setIsCompact();
    return deferred;
}

function disposeObject(table, ext_id, view, type, mode, tHistory, params, viewMode) {
    var deferred = $.Deferred();
    var idn = getIdn(table, ext_id, type, view);
    $("#" + idn).remove();
    objects[idn] = null;
    if (type == 'dashboard') {
        //$('#' + idn).dxForm('dispose');
        deferred.resolve();
    }
    if (type == 'form') {
        //$('#' + idn).dxForm('dispose');
        deferred.resolve();
    }
    if (type == 'grid') {
        //disposeTable(table, ext_id, view, type);
        deferred.resolve();
    }
    if (type == 'tree') {
        //disposeTree(table, ext_id, view, type);
        deferred.resolve();
    }
    if (type == 'cards') {
        //disposeCards(table, ext_id, view, type);
        deferred.resolve();
    }
    if (type == 'scheduler') {
        //disposeSheduler(table, ext_id, view, type);
        deferred.resolve();
    }
    if (type == 'documents') {
        //disposeDocuments(table, ext_id, type, view);
        deferred.resolve();
    }
    if (type == 'chart') {
        //disposeCharts(table, ext_id, type, view);
        deferred.resolve();
    }
    if (type == 'pivot') {
        //disposePivot(table, ext_id, type, view);
        deferred.resolve();
    }
    if (type == 'kanban') {
        //$('#' + idn).dxDataGrid('dispose');
        deferred.resolve();
    }
    //setIsCompact();
    return deferred;
}

function openPopup(table, ext_id, type, mode, tHistory, params) {
    var deferred = $.Deferred();
    var view = 'popup';
    var idn = getIdn(table, ext_id, type, view);
    //console.log(idn);
    // Добавляем в попап scrollview, чтобы контент внутри прокручивался
    var $popupContainer = $("<div />").attr('id', idn).addClass("myls-form-container");

    var $popup = $('<div id="' + idn + '-popup"></div>');
    //var $popup = $('<div id="' + idn + '"></div>');
    var width = 0;//$(window).width() * 0.75;
    var height = 0
    ;//$(window).height() * 0.75;
    if (type !== 'form') {
        $popupContainer.addClass('gridContainer');
        width = $(window).width() * 0.75;
        height = $(window).height() * 0.75;
    }
    var buttons = [];
    if (type == 'form') {
        buttons = [{
            //text: "Title",
            location: "after"
        }, {
            widget: "dxButton",
            toolbar: "bottom",
            location: "before",
            options: {
                text: "?",
                type: "normal",
                stylingMode: "outlined",
                elementAttr: {
                    id: idn + '_info-button',
                    class: "myls-info-btn"
                },
                onClick: function (e) {
                    $("#info-tooltip").dxTooltip("show", '#' + idn + '_info-button');
                }
            }
        }, {
            widget: "dxButton",
            toolbar: "bottom",
            location: "after",
            options: {
                text: saveString("OK"),
                type: "success",
                stylingMode: "outlined",
                elementAttr: {id: idn + '_save-button'},
            }
        }];

        if (mode == 'ins') {
            buttons.push({
                widget: "dxButton",
                toolbar: "bottom",
                location: "after",
                options: {
                    text: saveString('Сохранить и добавить'),
                    type: "success",
                    stylingMode: "outlined",
                    elementAttr: {id: idn + '_saveadd-button'},
                }
            });
        }
        buttons.push({
            widget: "dxButton",
            toolbar: "bottom",
            location: "after",
            options: {
                text: saveString('Отмена'),
                type: "default",
                stylingMode: "outlined",
                elementAttr: {id: idn + '_cancel-button'},
                onClick: function (e) {
                    $popup.remove();
                    deferred.reject();
                }
            }
        });
    }
    buttons.push({
        widget: "dxButton",
        toolbar: "top",
        location: "after",
        options: {
            icon: "collapse",
            type: "normal",
            stylingMode: "text",
            elementAttr: {
                id: idn + 'collapse-button',
                class: "myls-collapse-btn"
            },
            onClick: function (e) {
                e.event.stopPropagation();
                var currentPopup = $popup.dxPopup("instance");
                currentPopup.hide();
                if ($('#bottomPopupTabs').length == 0) {
                    createBottomTabs(currentPopup);
                }
                addBottomTab(currentPopup);
            }
        }
    });

    buttons.push({
        widget: "dxButton",
        toolbar: "top",
        location: "after",
        options: {
            icon: "fullscreen",
            type: "normal",
            stylingMode: "text",
            elementAttr: {
                id: idn + '_fullscreen-button',
                class: "myls-fullscreen-btn"
            },
            onClick: function (e) {
                if ($popup.dxPopup("instance").option('fullScreen')) {
                    $popup.dxPopup("instance").option('fullScreen', false);
                    //$popup.dxPopup("instance").option('maxHeight', '90%');
                } else {
                    $popup.dxPopup("instance").option('fullScreen', true);
                    //$popup.dxPopup("instance").option('maxHeight', '100%');
                }
            }
        }
    });

    buttons.push({
        widget: "dxButton",
        toolbar: "top",
        location: "after",
        options: {
            icon: "close",
            type: "normal",
            stylingMode: "text",
            elementAttr: {
                id: idn + '_close-button',
                class: "myls-close-btn"
            },
            onClick: function (e) {
                $popup.remove();
                deferred.reject();
            }
        }
    });

    var popupOptions = {
        width: width,
        height: height,
        contentTemplate: function () {
            return $popupContainer;
        },
        onHidden: function (e) {
            //$popup.remove();
        },
        onDisposing: function (e) {
            //убираем соотв. вкладку
            closeBottomTab(e);
            //стираем из config.popups
            /*
            if (popupContent.length > 0) {
                $.each(popupContent, function (index, value) {
                    if (value.id == table) {
                        //disposeObject(value.id, value.ext_id, 'tabs', value.type);
                        popupContent.splice(index, 1);
                        return false;
                    }
                });
                config.popups = popupContent;
                setSettings();
                clearUrl();
            }
            */
        },
        toolbarItems: buttons,
        showTitle: true,
        title: saveString("Information"),
        visible: false,
        dragEnabled: true,
        closeOnOutsideClick: false,
        resizeEnabled: true,
        maxSize: "90%",
        maxHeight: "100%",
        showCloseButton: false,
        shading: false,
    };
    var isItem = false;
    if ($('#bottomPopupTabs').length > 0) {
        var bottomPopupTabs = $('#bottomPopupTabs').dxTabs('instance');
        var tabItems = bottomPopupTabs.option('items');
        $.each(tabItems, function (index, i) {
            if (i.id == idn) {
                isItem = index;
                return false;
            }
        });
    }
    if (isItem === false) {
        //console.log($('#' + idn + '-popup').length);
        if ($('#' + idn + '-popup').length === 0) {
            $('.app-container').after($popup);
            var popup = $popup.addClass("myls-form").dxPopup(popupOptions).dxPopup("instance");
            /*
            if (type !== 'form') {
                var tableInfo = getTableInfo(table);
                if (tableInfo.name) {
                    var title = saveString(tableInfo.name);
                    popup.option("title", title);
                }
            }

             */
            popup.show();
            activatePopup(idn + '-popup');
            createBottomTabs(popup);
            /*
            if (ext_id !== -1) {
                var inPopup = false;
                if (popupContent.length > 0) {
                    $.each(popupContent, function (index, item) {
                        if (item.id == table && item.ext_id == ext_id) {
                            inPopup = true;
                            return false;
                        }
                    });
                }
                if (!inPopup) {
                    if (type !== 'form') {
                        addBottomTab(popup);
                    }
                    popupContent.push({
                        'title': popup.option('title'),
                        'html': '<div id="' + idn + '"><div id="' + idn + '" class="myls-form-container gridContainer"></div></div>',
                        'id': table,
                        'type': type,
                        'ext_id': ext_id,
                        'tHistory': JSON.stringify(tHistory)
                    });
                    config.popups = popupContent;
                    setSettings();
                }
            }

             */
            //updateUrl(createUrl(type, table, ext_id, view));

            $.when(initObject(table, ext_id, view, type, mode, tHistory, params)).done(function (data) {
                deferred.resolve(data);
            }).fail(function () {
                deferred.reject();
            });
        }
    } else {
        $("#" + idn + '-popup').dxPopup("instance").show();
        bottomPopupTabs.option('selectedIndex', isItem);
    }

    return deferred.promise();
}

function createBottomTabs(currentPopup) {
    if ($('#bottomPopupTabs').length == 0) {
        $('#content').prepend('<div id="bottomPopupTabs" ></div>');
        $('#bottomPopupTabs');
        $("#bottomPopupTabs").dxTabs({
            /*
            dataSource: [{
                id: currentPopup.element().attr('id'),
                text: currentPopup.option('title'),
            }],
            selectedIndex: 0,

             */
            noDataText: '',
            itemTemplate: function (itemData, itemIndex, element) {
                element.text(itemData.text);
                element.append($("<i>").addClass('dx-icon dx-icon-close').attr('data-tab', itemData.id));
            },
            onItemClick: function (e) {
                var idnPopup = e.itemData.id;

                $("#" + idnPopup).dxPopup("instance").show();
                activatePopup(idnPopup);
                idnPopup = idnPopup.replace('-popup', '');
                updateUrl(idnPopup);
            }
        }).dxTabs("instance");
    }
}

function addBottomTab(currentPopup) {
    var bottomPopupTabs = $('#bottomPopupTabs').dxTabs('instance');
    var tabItems = bottomPopupTabs.option('items');
    var isItem = false;
    $.each(tabItems, function (index, i) {
        if (i.id == currentPopup.element().attr('id')) {
            isItem = index;
            return false;
        }
    });
    if (isItem !== false) {
        bottomPopupTabs.option('selectedIndex', isItem);
    } else {
        tabItems.push({
            id: currentPopup.element().attr('id'),
            text: currentPopup.option('title'),
        });
        bottomPopupTabs.option('items', tabItems);
        bottomPopupTabs.option('selectedIndex', tabItems.length - 1);
    }
}

function closeBottomTab(e) {
    if ($('#bottomPopupTabs').length > 0) {
        var bottomPopupTabs = $('#bottomPopupTabs').dxTabs('instance');
        var tabItems = bottomPopupTabs.option('items');
        var isItem = false;
        $.each(tabItems, function (index, i) {
            if (i.id == e.element.attr('id')) {
                isItem = index;
                return false;
            }
        });
        if (isItem !== false) {
            tabItems.splice(isItem, 1);
            if (tabItems.length > 0) {
                bottomPopupTabs.option('items', tabItems);
            } else {
                $('#bottomPopupTabs').remove();
            }
        }
    }
}

function create_UUID() {
    var dt = new Date().getTime();
    var uuid = 'gxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (dt + Math.random() * 16) % 16 | 0;
        dt = Math.floor(dt / 16);
        return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
    return uuid;
}

function setIsCompact() {
    if ($(document).width() < 1400 || $(document).height() < 770) {
        $(".gridContainer").removeClass("mylscompactScreen");
        $(".gridContainer").addClass("mylscompactScreen");
    } else {
        $(".gridContainer").removeClass("mylscompactScreen");
    }
}

function initMenu(formMenu) {
    //выводим меню и тулбар
    $.when(formMenu).done(function (menu) {
        //closeLoadPanel("main");
        //saveTranslateMenu(menu);

        var drawer = $("#drawer").dxDrawer({
            opened: true,
            position: 'before',
            closeOnOutsideClick: false,
            template: function () {
                var $list = $("<div>").addClass("panel-list");

                return $list.dxList({
                    dataSource: menu,
                    //grouped: true,
                    //collapsibleGroups: true,
                    //selectAllMode: 'allPages',
                    pageLoadMode: 'scrollBottom',
                    searchEnabled: true,
                    searchExpr: 'name',
                    itemTemplate: function (data, _, element) {
                        //console.log(data);
                        //var url = createUrl(data.objectType, data.id, '', data.objectView);
                        element.append($("<a>")
                            .text(data.name));
                            //.attr("href", '#form-' + data.id + '_popup'));
                    },
                    hoverStateEnabled: false,
                    focusStateEnabled: false,
                    activeStateEnabled: false,
                    width: '230px',
                    onContentReady: function (e) {
                        setTimeout(function () {
                            var items = e.component.option("items");
                            for (var i = 0; i < items.length; i++)
                                e.component.collapseGroup(i);
                        }, 50);
                    },
                    onItemClick: function (e) {
                        //console.log(e.itemData);
                        //openPopup(e.itemData.id, '', 'form', 'setup', []);
                        openTabs('#form-'+e.itemData.id+'_tab', e.itemData.name, 'formEditor', '', []);
                        var xml = getData('/form/getxml?table='+e.itemData.id, 'get');
                        $('#form-'+e.itemData.id+'_tab').wrapAll('<div id ="form-'+e.itemData.id+'_container" class="d-flex w-100 h-100 myls-form"><div class="myls-form-edit-container w-50"></div></div>');
                        $('#form-'+e.itemData.id+'_container').append('<div class="myls-xml-edit-container w-50 d-flex flex-column"><div class="myace-editor  h-100 w-100" id="form-'+e.itemData.id+'_myace-editor"></div></div>');
                        $('#form-'+e.itemData.id+'_tab').prepend('<div class="dx-popup-title dx-toolbar"><div class="dx-toolbar-label">'+e.itemData.name+'</div></div>');
                        /*
                        $("#boxContent").dxBox({
                            direction: "row",
                            width: "100%",
                            height: "100%"
                        });
                        */
                        $.when(xml).done(function (formXml) {
                            //устанавливаем размер форме
                            var form = getTemplate(e.itemData.id);
                            $('#form-'+e.itemData.id+'_tab').css('width', form[0].width).css('height', form[0].height);
                            console.log(form);
                            //добавляем тулбар с кнопками
                            var idn = 'form-'+e.itemData.id+'_container';
                            $("#" + idn + ' .myls-xml-edit-container').append('<div class="dx-datagrid-header-panel"></div>');
                            $("#" + idn + " .dx-datagrid-header-panel").append('<div role="toolbar"></div>');
                            var items = [];
                            items.push({
                                widget: "dxButton",
                                name: 'buttonAdmin',
                                locateInMenu: 'auto',
                                options: {
                                    elementAttr: {
                                        toolbarrole: "always",
                                        buttonrole: "admin",
                                    },
                                    //icon: "preferences",
                                    text: "Сохранить",
                                    stylingMode: "outlined",
                                    type: "success",
                                    width: 120,
                                    //visible: !isEdit,
                                    onClick: function (el) {
                                        //openLoadPanel(idn);
                                        var code = ace.edit('form-'+e.itemData.id+'_myace-editor').getValue();
                                        var result = setData('/form/setxml', 'post', {xml: JSON.stringify(code), table: e.itemData.id});
                                        $.when(result).done(function () {
                                            var template = getData('/form/getformtemplate', 'post', {xml: JSON.stringify(code)});
                                            $.when(template).done(function (tpl) {
                                                console.log(tpl);
                                                initForm(e.itemData.id, '', 'tab', 'setup', [], [], tpl);
                                                DevExpress.ui.notify('Сохранено!', 'success', 600);
                                                setTemplate(e.itemData.id, tpl);
                                            });
                                        });
                                    }
                                },
                                location: "after"
                            });
                            items.push({
                                widget: "dxButton",
                                name: 'buttonAdmin',
                                locateInMenu: 'auto',
                                options: {
                                    elementAttr: {
                                        toolbarrole: "always",
                                        buttonrole: "admin",
                                    },
                                    //icon: "preferences",
                                    text: "Тестить",
                                    stylingMode: "outlined",
                                    type: "default",
                                    width: 120,
                                    //visible: !isEdit,
                                    onClick: function (el) {
                                        openLoadPanel(idn);
                                        var code = ace.edit('form-'+e.itemData.id+'_myace-editor').getValue();
                                        var template = getData('/form/getformtemplate', 'post', {xml: JSON.stringify(code)});
                                        $.when(template).done(function (tpl) {
                                            initForm(e.itemData.id, '', 'tab', 'setup', [], [], tpl);
                                            DevExpress.ui.notify('Завершено!', 'success', 600);
                                            //alert('Завершено!');
                                        });
                                    }
                                },
                                location: "before"
                            });
                            //initToollbar(undefined, items, getTableInfo(e.itemData.id), e.itemData.id, '', 'form', [], getTableColumns(e.itemData.id).columns);
                            var toolbar = $("#" + idn + " [role=toolbar]").dxToolbar({
                                items: items,
                            }).dxToolbar("instance");
                            //выводим в редактор код
                            $('#form-'+e.itemData.id+'_myace-editor').text(formXml);
                            setAceTextarea('form-'+e.itemData.id+'_myace-editor');
                        });

                    }
                });
            }
        }).dxDrawer("instance");


        //$('#boxRight .myls-right').css('margin-top', '-200px');
        //setAceTextarea("myace-editor");

        var langItems = [];
        $.each(languages, function (index, item) {
            langItems.push({
                lang: item.code,
                name: saveString(item.name),
                selected: config.lang == item.code ? true : false,
            });
        });

        var menuData = [{
            id: "2",
            html: '<div class="myls-notifications" style="position: relative; margin-right: 10px;"><i class="fa fa-bell-o"></i><span class="myls-count-notifications">0</span></div>',
            notification: true,
        }, {
            id: "3",
            //html: '<i id="logout" class="dx-icon-runner"></i>',
            icon: '/img/blank-avatar.svg',
            items: [{
                id: "help",
                name: saveString("Помощь"),
                linkOut: 'https://www.manula.com/manuals/myls/myls-school-knowledge-base/1/ru/topic/myls-school-how-to-work',
            }, {
                id: "lang",
                name: saveString("Язык"),
                items: langItems,
            }, {
                id: "3_2",
                name: saveString("Выход"),
                link: '/site/logout',
            }]
        }];

        $("#toolbar").dxToolbar({
            items: [
                {
                    widget: "dxButton",
                    location: "before",
                    cssClass: "menu-button",
                    options: {

                        icon: "menu",
                        onClick: function () {
                            drawer.toggle();
                        }
                    }
                },
                {
                    text: siteName,
                    location: "before",
                    cssClass: "mylsTitle",
                    cssStyle: "mylsTitle",

                },
                {
                    widget: "dxMenu",
                    location: "after",
                    cssClass: "user-menu",
                    options: {
                        dataSource: menuData,
                        hideSubmenuOnMouseLeave: false,
                        SubmenuDirection: 'LeftOrTop',
                        displayExpr: "name",
                        cssClass: "user-menu",
                        onItemClick: function (data) {
                            var item = data.itemData;
                            if (item.link) {
                                window.location.href = item.link;
                            }
                            if (item.linkOut) {
                                window.open(item.linkOut);
                            }
                            if (item.lang) {
                                changeLocale(item.lang);
                            }
                            if (item.notification) {
                                //console.log(getTableInfo(config.notification));
                                //openTabs('#grid' + '-' + config.notification, getTableInfo(config.notification).name, 'grid', undefined, []);
                            }
                        }
                    }
                }
            ]
        });
    });
}

function openTabToHash(url) {
    console.log(url);
    //var url = window.location.hash;
    var grid = url.replace(/#/g, '');
    var arrurl = grid.split(/\-|\_/);
    var type = arrurl[0];
    var table = arrurl[1];
    var ext_id = arrurl[2];
    var objView = arrurl[3];
    if (arrurl[2] == 'popup' || arrurl[2] == 'tab') {
        ext_id = '';
        objView = arrurl[2];
    } else {
        ext_id = arrurl[2];
    }
    if (arrurl[2] == '' && arrurl[3] == 1) {
        ext_id = -1;
        objView = arrurl[4];
    }
    console.log(arrurl);
    var tableInfo = getTableInfo(table);
    console.log(tableInfo);
    if (tableInfo) {
        var title = tableInfo.name;
        //console.log(ext_id);
        if (ext_id !== -1) {
            if (objView == 'popup') {
                console.log(table, ext_id, type);
                openPopup(table, ext_id, type, 'upd', []);

            } else {
                //console.log(type + '-' + table + (ext_id ? '-' + ext_id : ''), title, type, ext_id);
                url = createUrl(type, table, ext_id, objView);
                //console.log(url);
                openTabs(url, title, type, ext_id, []);

            }
        }
    }
}

function createUrl(type, table, ext_id, view) {
    if (ext_id === undefined || ext_id === '')
        ext_id = '';
    else
        ext_id = '-' + ext_id;
    return type + '-' + table + ext_id + '_' + view;
}

function setAceTextarea(id) {
    var editor = ace.edit(id, {
        theme: "ace/theme/tomorrow",
        mode: "ace/mode/xml",
        autoScrollEditorIntoView: true,
        maxLines: 30,
        minLines: 2
    });
    //editor.setTheme("ace/theme/monokai");
    //editor.session.setMode("ace/mode/javascript");
}


// Глобальные настройки
DevExpress.config({
    //thousandsSeparator: ' ',
    editorStylingMode: 'underlined'
});

//console.log(lang);
var panelContent = [],
    popupContent = [],
    objects = [],
    config = {lang: 'en', company_id: 1},
    popup = null,
    cntToolTip = 0,
    userAgent = detect.parse(navigator.userAgent),
    allowSaveSetting = false,
    filterObjects = [];
//console.log(userAgent);
var tooltip = $('#tooltip').dxTooltip({
    //target: "#"+target,
    showEvent: "click",
    hideEvent: "dxdblclick",
}).dxTooltip("instance");

var infoTooltip = $('#info-tooltip').dxTooltip({
    width: "500px",
    height: "300px"
}).dxTooltip("instance");

var appInfo = {
    tables: {},
    columns: {},
    contextMenu: {},
    templates: {}
};

$(function () {
    //openLoadPanel("main");
    var siteTranslate = getData("/site/loadtranslate", "json");
    var settings = getSettings();

    //var menu = getData('menu/getmenu', 'get');

    var menu = getData('/admin/getallforms', 'get');

    var quickActions = getData('menu/getquickactions', 'get');
    var tables = getAllTablesInfo();
    var columns = getAllColumns();
    var cmenu = getAllContextMenu();
    //var currentHash = '';
    //debugger
    /*
        setInterval(function()
        {
            console.log(objects);
        },30000);
    */

    $.when(settings, siteTranslate, menu).done(function (_, currTranslate, formMenu) {

        DevExpress.localization.loadMessages(currTranslate);
        if (currTranslate != '') {
            translate = currTranslate;
        }





        function getInfo() {
            var pr = $.Deferred();
            $.when(tables, columns, cmenu).done(function () {
                pr.resolve();
            });
            return pr;
        }

        //initAdminForms(menu);

        $.when(getInfo()).done(function () {
            $.when(getAllTemplates(), menu, quickActions).done(function (_, mainMenu, quickActions) {
                //initMenu(mainMenu);
                //initQuickActions(quickActions);
                saveFileTranslate();
                initMenu(formMenu);
                //console.log(appInfo);
                //openOldTabs();
                //openOldPopups();
                /*
                if (config.client_id) {
                    getNotifications();
                    setInterval(function () {
                        getNotifications();
                    }, 60000);
                } else {
                    $('.myls-notifications').css('display', 'none');
                }

                //сохранение настроек
                setInterval(function () {
                    saveSettings();
                }, 30000);

                //отслеживаем изменение URL
                $.when(openOldTabs(), openOldPopups()).done(function (tabs, popups) {
                    //console.log(currentHash);
                    if (currentHash !== '') {
                        openTabToHash(currentHash);
                    }
                    //createPdf();

                });

                 */
            });
        });

    });

    DevExpress.ui.dxLoadIndicator.defaultOptions({
        options: {
            indicatorSrc: '/img/loader.svg'
        }
    });

    var autoComplete = "off";
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

    //подсказки

    $(document.body).on('click', '.myls-tooltip', function () {
        var target = $(this).attr('id');
        var url = $(this).attr('data-href');
        var type = $(this).attr('data-type');
        var info = $(this).text();
        var target = '';
        if (url.indexOf("tel:") == -1 && url.indexOf("mailto:") == -1)
            target = 'target="_blank"';
        tooltip.option('contentTemplate', '<a href="' + url + '" ' + target + '><i class="dx-icon-' + type + '"></i> ' + info + '</a>');
        tooltip.show('#' + target);
    });
    //открывать объекты по ссылке
    $(document.body).on('click', '.myls-open-object', function (e) {
        e.stopPropagation();
        openObjectLink(e.target);
    });

    function openObjectLink(e) {
        var table = $(e).attr('data-table');
        var id = $(e).attr('data-id');
        var ext_id = $(e).attr('data-ext-id');
        var type = $(e).attr('data-type');
        var view = $(e).attr('data-view');
        var mode = $(e).attr('data-mode');
        var title = $(e).attr('data-title');
        var parentIdn = $(e).attr('data-idn');
        if (mode == '' || mode == undefined) {
            mode = 'upd';
        }
        //addHistory(tableInfo.idField, id, e.element.attr("id"), tHistory, 'upd')

        if (objects[parentIdn])
            if (view == 'popup') {
                //
                openPopup(table, ext_id, type, mode, addHistory(objects[parentIdn].tableInfo.idField, id, parentIdn, objects[parentIdn].tHistory, 'updAll'), []);
            } else {
                //initObject(table, id, view, type, mode, [], []);
                openTabs(type + '-' + table + (ext_id ? '-' + ext_id : ''), title, type, ext_id, addHistory(objects[parentIdn].tableInfo.idField, id, parentIdn, objects[parentIdn].tHistory, 'upd'));
            }
    }

    //клик по пункту главного меню
    /*
    $(document.body).on('click', '.panel-list .dx-item-content a', function () {
        var url = $(this).attr('href');
        openTabToHash(url);
    });
    */
});
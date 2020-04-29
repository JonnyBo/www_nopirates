class Dashboard extends MylsObject {

    constructor(table, ext_id, view, mode, tHistory, viewMode, params) {
        super(table, ext_id, view, mode, tHistory, viewMode, params);
        this.type = 'dashboard';
        this.dataSources = {};
        this.objList = [];
        this.objFrames = [];
        this.allowSaveStorage = false;
        this.ext_id = '';
        this.dashboardObjects = [];
    }

    async init() {
        super.init();
        this.oldFrames = await this.sendStorageRequest("storage", "json", "GET", false, this.table, []);
        let tableTpl = JSON.parse(this.template);
        this.createlayout();
        this.frame = $('#' + this.idn + ' .myls-dashboard-layout');
        this.fillConfig(tableTpl, this.frame);
        const self = this;
        $.each(this.objList, function (index, m) {
            self.initItemDashboard(m);
        });
        $("#" + this.idn).data('mylsObject', this);
    }

    async initItemDashboard(m) {
        const self = this;
        let object;
        if (m.tableId) {
            const addidn = app.getIdn(app.appInfo.tables[m.tableId].tableType, m.tableId, this.ext_id, 'dashboard');
            $('#' + this.idn + '_' + m.dataField).append('<div id="' + addidn + '" class="myls-dashboard-item-inner"></div>');
            object = app.getObject(m.tableId, this.ext_id, 'dashboard', app.appInfo.tables[m.tableId].tableType, this.mode, this.tHistory);
            object.init();
        } else if (m.dataType == 'card') {
            let $tpl = await this.addCardContainer(m);
            if ($tpl.find('object').length) {
                const field = $tpl.find('object').attr('fieldname');
                //initObject(columns[field].tableId, '', dashboard, appInfo.tables[columns[field].tableId].tableType, 'upd', [], [], 'compact');
                object = app.getObject(self.columns.columns[field].tableId, '', 'dashboard', app.appInfo.tables[self.columns.columns[field].tableId].tableType, 'upd', [], 'compact');
                object.init();
            }
        }
        this.dashboardObjects.push(object);
    }

    async addCardContainer(m) {
        let tableData = await this.loadLookupData(m);
        let template = this.columns.getFormattedCellValue('', m, tableData[0]);
        let $tpl = $(template);
        if ($tpl.find('object').length) {
            const field = $tpl.find('object').attr('fieldname');
            const idnObj = app.getIdn(app.appInfo.tables[this.columns.columns[field].tableId].tableType, this.columns.columns[field].tableId, '', 'dashboard');
            $tpl.find('object').attr("id", idnObj);//    append('<div id="' + idnObj + '" class="gridContainer"></div>');
            template = $tpl.get(0);
        }
        const $cardContainer = $("#" + this.idn + '_' + m.dataField);
        $cardContainer.append(template);
        $cardContainer.addClass('myls-dashboard-card');
        return $tpl;
    }

    createlayout() {
        $('#' + this.idn).append('<div class="myls-dashboard-layout" data-table="' + this.table + '"></div>');
        $('#' + this.idn).dxScrollView({
            direction: "vertical",
        });

    }

    createFrame(html, title, isClosable, dataField) {
        let out = '<div class="myls-frame" data-id="' + dataField + '">';
        out += '<div class="myls-frame-header">';
        out += '<div class="myls-frame-title">' + title;
        if (isClosable) {
            out += '<i class="dx-icon dx-icon-close" data-tab="' + dataField + '"></i>';
        }
        out += '</div>';
        out += '</div>';
        out += '<div class="myls-frame-body">' + html + '</div>';
        out += '</div>';
        return out;
    }

    addFrame(type) {
        let $html = $('<div class="myls-dashboard-' + type + '"></div>');
        this.frame.append($html);
        return $html;
    }

    fillConfig(conf, frame) {
        const self = this;
        $.each(conf, function (_, item) {
            if (item.type !== 'component') {
                let frame_new = self.createNewFrame(item);
                self.fillConfig(item.content, frame_new);
            }
            if (item.hasOwnProperty("type") && item.type == 'component') {
                const column = self.getColumn(item, frame);
                if ($.inArray(column.dataField, self.oldFrames) !== -1) {
                    let fff = frame.find('.myls-frame[data-id=' + column.dataField + ']');
                    fff.hide(500, function () {
                        if ($('#bottomFrameTabs').length > 0) {

                        } else {
                            this.createBottomFrameTabs();
                        }
                        //добавляем вкладку для спрятанного фрейма
                        self.addBottomFrameTab(fff);
                        //формируем массив открытых фреймов и сохраняем его.
                        self.saveCurrentFrames();
                    });
                }
            }
        });
    }

    getColumn(item, frame) {
        const column = this.columns.columns[item.componentName];
        if (item.hasOwnProperty("isClosable"))
            item.isClosable = item.isClosable == 'true' ? true : false;
        else
            item.isClosable = true;
        item.componentName = 'layout';
        item.title = app.translate.saveString(item.title ? item.title : column.caption);
        item.componentState = {'html': column.tableId ? app.getObjectContainer(app.getIdn(app.appInfo.tables[column.tableId].tableType, column.tableId, this.ext_id, 'dashboard')) : '<div id="' + this.idn + '_' + column.dataField + '" class="h-100"></div>'};
        const htmlFrame = this.createFrame(item.componentState.html, item.title, item.isClosable, column.dataField);
        let frameItem = $(htmlFrame).appendTo(frame);
        if (item.style) {
            frameItem.attr('style', item.style);
        }
        if (item.class) {
            frameItem.addClass(item.class);
        }
        this.objList.push(column);
        this.objFrames.push(column.dataField);
        return column;
    }

    createNewFrame(item) {
        let frame_new = this.addFrame(item.type);
        if (item.style) {
            frame_new.attr('style', item.style);
        }
        if (item.class) {
            frame_new.addClass(item.class);
        }
        return frame_new;
    }

    createBottomFrameTabs() {
        const self = this;
        if ($('#bottomFrameTabs_' + table).length == 0) {
            $('#' + this.idn).prepend('<div id="bottomFrameTabs_' + this.table + '" class="bottom-dashbord-tabs"></div>');
            $("#bottomFrameTabs_" + this.table).dxTabs({
                noDataText: '',
                itemTemplate: function (itemData, itemIndex, element) {
                    element.text(itemData.text);
                },
                onItemClick: function (e) {
                    $('.myls-dashboard-layout').find('.myls-frame[data-id=' + e.itemData.id + ']').show(0, function () {
                        self.closeBottomFrameTab(e.itemData.id);
                        // Вызываем событие, что окно изменило свой размер, чтобы перерисовались чарты, иначе никак
                        $(window).trigger('resize');
                        self.saveCurrentFrames();
                    });
                }
            }).dxTabs("instance");
        }
    }

    addBottomFrameTab(currentFrame) {
        let bottomFrameTabs = $('#bottomFrameTabs_' + this.table).dxTabs('instance');
        let tabItems = bottomFrameTabs.option('items');
        let isItem = false;
        $.each(tabItems, function (index, i) {
            if (i.id == currentFrame.attr('data-id')) {
                isItem = index;
                return false;
            }
        });
        if (isItem !== false) {
            bottomFrameTabs.option('selectedIndex', isItem);
        } else {
            tabItems.push({
                id: currentFrame.attr('data-id'),
                text: currentFrame.find('.myls-frame-title').text(),
            });
            bottomFrameTabs.option('items', tabItems);
            this.saveCurrentFrames();
        }

    }

    closeBottomFrameTab(id) {
        if ($('#bottomFrameTabs_' + this.table).length > 0) {
            let bottomFrameTabs = $('#bottomFrameTabs_' + this.table).dxTabs('instance');
            let tabItems = bottomFrameTabs.option('items');
            $.each(tabItems, function (index, i) {
                if (i.id == id) {
                    tabItems.splice(index, 1);
                    if (tabItems.length > 0) {
                        bottomFrameTabs.option('items', tabItems);
                        //oldFrames = tabItems;
                    } else {
                        $('#bottomFrameTabs_' + table).remove();
                        //oldFrames = [];
                    }
                    return false;
                }
            });
            this.saveCurrentFrames();
        }
    }

    saveCurrentFrames() {
        const self = this;
        //const tableId = $('.myls-dashboard-layout').attr('data-table');
        this.oldFrames = [];
        $(".myls-frame").each(function (index, item) {
            if ($(this).is(':hidden')) {
                const idnx = $(this).attr('data-id');
                if ($.inArray(idnx, self.oldFrames) === -1)
                    self.oldFrames.push(idnx);
            }
        });
        this.allowSaveStorage = true;
    }
/*
    async saveStorage() {
        if (this.allowSaveStorage) {
            this.allowSaveStorage = false;
            await sendStorageRequest("storage", "json", "POST", this.oldFrames, this.table);
            Promise.resolve();
        }
        Promise.reject();
    }
*/
    destroy() {
        super.destroy();
        $("#" + this.idn).data('mylsObject', null);
        app.destroyArray(this.objList);
        app.destroyArray(this.objFrames);
        app.destroyArray(this.dataSources);
        app.destroyArray(this.oldFrames);
        app.destroyArray(this.dashboardObjects);
        this.frame = null;
        this.close();
    }

}
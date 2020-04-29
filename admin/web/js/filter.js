class Filter {

    constructor(object) {
        this.currentFilter = [];
        this.table = object.table;
        this.ext_id = object.ext_id;
        this.view = object.view;
        this.type = object.type;
        this.mode = object.mode;
        this.tHistory = object.tHistory;
        this.selParams = object.selParams;
        this.mylsObject = object;
        this.resultArray = [];
        this.filterObjects = [];
        this.filter = [];
    }

    init(e) {
        this.button = e;
        this.allTableData = [];
        this.cols = this.mylsObject.columns.getFilterColumns();
        this.dateArray = this.getDateArray();
        this.arrMonth = [app.translate.saveString('Январь'), app.translate.saveString('Февраль'), app.translate.saveString('Март'), app.translate.saveString('Апрель'), app.translate.saveString('Май'), app.translate.saveString('Июнь'), app.translate.saveString('Июль'), app.translate.saveString('Август'), app.translate.saveString('Сентябрь'), app.translate.saveString('Октябрь'), app.translate.saveString('Ноябрь'), app.translate.saveString('Декабрь')];
        this.arrQuarter = [app.translate.saveString('I квартал'), app.translate.saveString('II квартал'), app.translate.saveString('III квартал'), app.translate.saveString('IV квартал')];
        this.createPopupContainer();
        this.createScrollContainer();
        this.createFilter();
        this.openFilter();
    }

    async processFilter() {
        const self = this;

        $.each(this.filterObjects, function (index, elem) {
            const checkBox = $('#' + elem.widget.element().attr('id') + '_checkbox').dxCheckBox('instance');
            if (checkBox.option('value')) {
                if (elem.radio.option('value')) {
                    let term = '=';
                    if (elem.radio.option('value') == 1) {
                        // не пустое
                        self.processNoEmpty(elem);
                    }
                    if (elem.radio.option('value') == 2) {
                        //кроме
                        term = 'is distinct from';
                    }
                    if (elem.radio.option('value') == 3) {
                        //содержит
                        self.processContains(elem, self.filter);
                    }
                    if (elem.widget.NAME == 'dxTagBox') {
                        self.processTagBox(elem, term, self.filter);
                    }
                    if (elem.widget.NAME == 'dxRangeSelector') {
                        self.processRangeSelector(elem);
                    }
                    if (elem.widget.NAME == 'dxSelectBox') {
                        self.processSelectBox(elem);
                    }
                    if (elem.widget.NAME == 'dxSwitch') {
                        self.processSwitch(elem);
                    }
                } else {
                    //пустое
                    self.processEmpty(elem);
                }
            }
        });

        if (this.filter.length == 0) {
            this.filter = null;
        }
        if (this.filter == null) {
            this.button.element.removeClass('myls-filter-active');
        } else {
            this.button.element.addClass('myls-filter-active');
        }
        console.log(this.filter);
        if (this.filter !== null) {
            /*
            console.log(tableInfo);
            selParams.filter = filter;
            console.log(selParams);
            //var setDataToForm = createDataSource(tableId, ext_id, idn, [], columns.columns, tableInfo, selParams);
            var setDataToForm = tableData.load(selParams);
            console.log(setDataToForm);

             */
        }

        //console.log(tableData);
        this.mylsObject.dataSource.mylsFilter = this.filter;
        this.mylsObject.refresh();
        this.popup.hide();


    }

    processEmpty(elem) {
        let out = [];
        out.push([elem.column.dataField, 'is', null]);
        if (out.length > 0) {
            if (filter.length > 0) {
                filter.push('and');
            }
            filter.push(out);
        }
    }

    processSwitch(elem) {
        let out = [];
        out.push([elem.column.dataField, '=', elem.widget.option('value') ? 1 : 0]);
        if (out.length > 0) {
            if (this.filter.length > 0) {
                this.filter.push('and');
            }
            this.filter.push(out);
        }
    }

    processSelectBox(elem) {
        if (elem.widget.option('value') != null && elem.widget.option('value') != undefined) {
            if (Object.keys(elem.widget.option('value')).length > 0) {
                let out = [];
                sessionStorage.setItem(elem.column.dataField, elem.widget.option('value').id);
                if (elem.widget.option('value').start != undefined)
                    out.push([elem.column.dataField, '>=', DevExpress.localization.formatDate(elem.widget.option('value').start, 'yyyy-MM-dd')]);
                if (elem.widget.option('value').start != undefined && elem.widget.option('value').end != undefined)
                    out.push('and');
                if (elem.widget.option('value').end != undefined)
                    out.push([elem.column.dataField, '<=', DevExpress.localization.formatDate(elem.widget.option('value').end, 'yyyy-MM-dd')]);
                if (out.length > 0) {
                    if (this.filter.length > 0) {
                        this.filter.push('and');
                    }
                    this.filter.push(out);
                }
            }
        }
    }

    processRangeSelector(elem) {
        if (elem.widget.option('value').length > 0) {
            let out = [];
            out.push([elem.column.dataField, '>=', elem.widget.option('value')[0]]);
            out.push('and');
            out.push([elem.column.dataField, '<=', elem.widget.option('value')[1]]);
            if (out.length > 0) {
                if (this.filter.length > 0) {
                    this.filter.push('and');
                }
                this.filter.push(out);
            }
        }
    }

    processTagBox(elem, term) {
        if (elem.widget.option('value').length > 0) {
            let out = [];
            $.each(elem.widget.option('value'), function (index, arr) {
                if (out.length > 0) {
                    if (term == '=')
                        out.push('or');
                    else
                        out.push('and');
                }
                if (elem.column.dataType == 'tagbox')
                    out.push([[elem.column.dataField, 'like', arr + '%,'], 'or', [elem.column.dataField, 'like', ', %' + arr], 'or', [elem.column.dataField, 'containing', ', ' + arr + ','], 'or', [elem.column.dataField, '=', arr]]);
                else if (term == 'containing')
                    out.push([elem.column.dataField.toLowerCase(), term, arr]);
                else
                    out.push([elem.column.dataField, term, arr]);
            });
            if (out.length > 0) {
                if (this.filter.length > 0) {
                    this.filter.push('and');
                }
                this.filter.push(out);
            }
        }
    }

    processContains(elem) {
        if (elem.text.option('value')) {
            let out = [];
            out.push([elem.column.dataField.toLowerCase(), 'containing', elem.text.option('value')]);
            if (out.length > 0) {
                if (this.filter.length > 0) {
                    this.filter.push('and');
                }
                this.filter.push(out);
            }
        }
    }

    processNoEmpty(elem) {
        let out = [];
        out.push([elem.column.dataField, 'is not', null]);
        if (out.length > 0) {
            if (this.filter.length > 0) {
                this.filter.push('and');
            }
            this.filter.push(out);
        }
    }

    getPopupOptions() {
        const self = this;
        let toolbarItems = [{
            location: "after"
        }];
        toolbarItems.push(this.getButtonApply());
        toolbarItems.push(this.getButtonClear());
        toolbarItems.push(this.getButtonCancel());
        toolbarItems.push(this.getButtonClose());
        return {
            title: app.translate.saveString("Фильтр"),
            width: "700px",
            height: "75%",
            showCloseButton: false,
            toolbarItems: toolbarItems
        }
    }

    getButtonApply() {
        const self = this;
        return {
            widget: "dxButton",
            toolbar: "bottom",
            location: "center",
            options: {
                text: app.translate.saveString("Применить"),
                type: "success",
                stylingMode: "outlined",
                onClick: function (e2) {
                    self.processFilter();
                }
            }
        }
    }

    getButtonClear() {
        const self = this;
        return {
            widget: "dxButton",
            toolbar: "bottom",
            location: "center",
            options: {
                text: app.translate.saveString("Очистить"),
                type: "clear",
                stylingMode: "outlined",
                onClick: async function (e2) {
                    self.clearFilter();
                }
            }
        }
    }

    clearFilter() {
        $.each(this.filterObjects, function (index, elem) {
            if (elem.widget.NAME == 'dxRangeSelector') {
                elem.widget.option('value', []);
            } else if (elem.widget.NAME == 'dxSwitch') {
                elem.widget.option('value', false);
            } else {
                elem.widget.option('value', '');
            }
            sessionStorage.removeItem(elem.column.dataField);
        });
        this.mylsObject.dataSource.mylsFilter = null;
        this.button.element.removeClass('myls-filter-active');
        this.mylsObject.refresh();
        this.popup.hide();
    }

    getButtonCancel() {
        const self = this;
        return {
            widget: "dxButton",
            toolbar: "bottom",
            location: "center",
            options: {
                text: app.translate.saveString("Закрыть"),
                type: "cancel",
                stylingMode: "outlined",
                onClick: function (e2) {
                    self.popup.hide();
                }
            }
        }
    }

    getButtonClose() {
        const self = this;
        return {
            widget: "dxButton",
            toolbar: "top",
            location: "after",
            options: {
                icon: "close",
                type: "normal",
                stylingMode: "text",
                elementAttr: {
                    id: this.mylsObject.idn + '_close-button',
                    class: "myls-close-btn"
                },
                onClick: function (e) {
                    self.popup.hide();
                }
            }
        }
    }

    openFilter() {
        this.popup = $('#' + this.mylsObject.idn + '_popupContainer').dxPopup(this.getPopupOptions()).dxPopup("instance");
        this.popup.show();
    }

    createPopupContainer() {
        if ($('#' + this.mylsObject.idn + '_popupContainer').length === 0) {
            $("#" + this.mylsObject.idn).append('<div id="' + this.mylsObject.idn + '_popupContainer"><div id="' + this.mylsObject.idn + '_scrollView"><div class="myls-filters"></div></div></div>');
        }
    }

    createScrollContainer() {
        $('#' + this.mylsObject.idn + '_scrollView').dxScrollView({
            scrollByContent: true,
            scrollByThumb: true,
            showScrollbar: "onScroll",
        }).dxScrollView("instance");
    }

    createFilter() {
        const self = this;
        let idx;
        $.each(this.cols, function (index, item) {
            let itemData = [];
            if (item.dataType == 'string' || item.dataType == 'tagbox') {
                idx = self.createFilterElement(item, 'tagbox', false);
            }
            if (item.dataType == 'number') {
                idx = self.createFilterElement(item, 'range', true);
            }
            if (item.dataType == 'date') {
                idx = self.createFilterElement(item, 'date', true);
            }
            if (item.dataType == 'color') {
                idx = self.createFilterElement(item, 'tagbox', false, 'myls-filter-color');
            }
            if (item.dataType == 'boolean') {
                idx = self.createFilterElement(item, 'switch', false);
                if (!self.issetFilterObject(item)) {
                    self.filterObjects.push({
                        'column': item, 'widget': $("#" + idx).dxSwitch({
                        }).dxSwitch('instance'),
                        'radio': $('#' + idx + '_radio').dxRadioGroup('instance'),
                    });
                }
            }
        });
    }

    createFilterElement(item, type, addFields, addClass) {
        const idx = this.mylsObject.idn + '_' + item.dataField + '_' + type;
        if ($('#' + idx + '_label').length == 0) {
            const $filter = $('<div class="myls-filter d-flex"><div id="' + idx + '_checkbox" class="myls-left-col"></div><div class="myls-right-col"></div></div>');
            $('.myls-right-col', $filter).append('<div id="' + idx + '_label" class="myls-filter-label">' + app.translate.saveString(item.caption) + '</div><div id="' + idx + '_radio" class="myls-filter-radio"></div><div id="' + idx + '" class="myls-filter-field ' + addClass + '"></div>');
            if (addFields) {
                $('.myls-right-col', $filter).append('<div class="myls-filter-block d-flex"><div id="' + idx + '_start" class="myls-filter-field"></div><div id="' + idx + '_end" class="myls-filter-field"></div></div>');
            }
            $('#' + this.mylsObject.idn + '_popupContainer .myls-filters').append($filter);
            if (type == 'range') {
                $("#" + idx).css('height', '80px');
            }
            this.addfilterCheckbox(idx, item);
            this.addfilterRadio(idx, item);
        }
        return idx;
    }

    checkboxValueChanged(idx, item, data) {
        let radioGroup = $('#' + idx + '_radio').dxRadioGroup('instance');
        if (data.value) {
            radioGroup.option('visible', true);
            if (radioGroup.option('value') == null)
                radioGroup.option('value', 1);
            data.element.closest('.myls-filter').addClass('active');
            //грузим данные
            if (item.dataType == 'string' || item.dataType == 'tagbox') {
                this.getStringFilter(idx, item);
            }
            if (item.dataType == 'color') {
                this.getColorFilter(idx, item);
            }
            if (item.dataType == 'number') {
                this.getNumberFilter(idx, item);
            }
            if (item.dataType == 'date') {
                this.getDateFilter(idx, item);
            }
        } else {
            radioGroup.option('visible', false);
            data.element.closest('.myls-filter').removeClass('active');
        }
    }

    addfilterCheckbox(idx, item) {
        const self = this;
        $('#' + idx + '_checkbox').dxCheckBox({
            value: false,
            onValueChanged: function (data) {
                self.checkboxValueChanged(idx, item, data);
            }
        }).dxCheckBox('instance');
    }

    radioValueChanged(idx, data) {
        if (data.value) {
            data.element.closest('.myls-filter').addClass('active');
        } else {
            data.element.closest('.myls-filter').removeClass('active');
        }
        if (data.value == 3) {
            if ($('#' + idx + '_contain').length == 0) {
                //$('#' + idx).before('<div class="myls-filter-block d-flex"><div id="' + idx + '_contain" class="myls-filter-field"></div></div>');
                $('#' + idx).before('<div id="' + idx + '_contain" class="myls-filter-field"></div>');
                $('#' + idx + '_contain').dxTextBox({
                    placeholder: app.translate.saveString("ведите текст...")
                }).dxTextBox('instance');
            } else {
                $('#' + idx + '_contain').show();
            }
            $("#" + idx).hide();
        } else {
            $('#' + idx + '_contain').hide();
            $("#" + idx).show();
        }
    }

    addfilterRadio(idx, item) {
        const self = this;
        let radioItems = [{
            id: 0,
            text: app.translate.saveString('Пустое'),
        }, {
            id: 1,
            text: app.translate.saveString('Не пустое'),
        }];
        if (item.dataType == 'string') {
            radioItems.push({
                id: 2,
                text: app.translate.saveString('Кроме'),
            });
            radioItems.push({
                id: 3,
                text: app.translate.saveString('Содержит'),
            });
        }
        if (item.dataType == 'color') {
            radioItems.push({
                id: 2,
                text: app.translate.saveString('Кроме'),
            });
        }
        $('#' + idx + '_radio').dxRadioGroup({
            dataSource: radioItems,
            valueExpr: 'id',
            displayExpr: 'text',
            layout: "horizontal",
            visible: false,
            onValueChanged: function (data) {
                self.radioValueChanged(idx, data);
            }
        }).dxRadioGroup("instance");
    }

    async getFilterData(item) {
        if (!this.allTableData[item.dataField]) {
            let url = 'frame/get-filter-string-data';
            if (item.dataType == 'number') {
                url = 'frame/get-filter-number-data';
            }
            if (item.dataType == 'date') {
                url = 'frame/get-filter-string-data';
            }
            let itemData = await app.processData(url, 'post', {
                table: this.table,
                field: item.dataField,
                extId: this.ext_id,
                selParams: this.selParams
            });
            this.allTableData[item.dataField] = itemData;
        }
    }

    async getStringFilter(idx, item) {
        await this.getFilterData(item);
        const dataAll = this.allTableData[item.dataField];
        if (!this.issetFilterObject(item)) {
            this.filterObjects.push({
                'column': item, 'widget': $("#" + idx).dxTagBox({
                    dataSource: dataAll,
                    displayExpr: item.dataField,
                    valueExpr: item.dataField,
                    searchEnabled: true,
                    showSelectionControls: true,
                }).dxTagBox('instance'),
                'radio': $('#' + idx + '_radio').dxRadioGroup('instance'),
                'text': $('#' + idx + '_contain').dxTextBox('instance'),
            });
        }
    }

    async getColorFilter(idx, item) {
        await this.getFilterData(item);
        let dataAll = this.allTableData[item.dataField];
        app.removeNullFromArray(dataAll);
        dataAll = app.removeEmptyFromArray(dataAll);
        if (!this.issetFilterObject(item)) {
            this.filterObjects.push({
                'column': item, 'widget': $("#" + idx).dxTagBox(this.getTagBoxOptions(dataAll, item)).dxTagBox('instance'),
                'radio': $('#' + idx + '_radio').dxRadioGroup('instance'),
            });
        }
    }

    getTagBoxOptions(dataAll, item) {
        return {
            dataSource: dataAll,
            displayExpr: item.dataField,
            valueExpr: item.dataField,
            searchEnabled: false,
            showSelectionControls: true,
            itemTemplate: function (tagData) {
                if (tagData[item.dataField] != null) {
                    if (tagData[item.dataField].charAt(0) == '#')
                        return "<div style='width: 20px; height: 20px; background-color: " + tagData[item.dataField] + "'></div>";
                    else
                        return "<div style='width: 20px; height: 20px;'>" + tagData[item.dataField] + "</div>";
                }
            },
            tagTemplate: function (tagData) {
                if (tagData[item.dataField] != null) {
                    if (tagData[item.dataField].charAt(0) == '#')
                        return "<div style='width: 20px; height: 20px; background-color: " + tagData[item.dataField] + "'></div>";
                    else
                        return "<div style='height: 20px;'>" + tagData[item.dataField] + "</div>";
                }
            }
        };
    }

    async getNumberFilter(idx, item) {
        let startObj;
        let endObj;
        await this.getFilterData(item);
        let allData = this.allTableData[item.dataField][0];
        if (!this.issetFilterObject(item)) {
            this.filterObjects.push({
                'column': item, 'widget': $("#" + idx).dxRangeSelector(this.getRangeSelectorOptions(allData, idx)).dxRangeSelector('instance'),
                'radio': $('#' + idx + '_radio').dxRadioGroup('instance'),
            });
            startObj = this.createStartObject(allData, idx);
            endObj = this.createEndObject(allData, idx);
        } else {
            startObj = $("#" + idx + '_start').dxNumberBox("instance");
            endObj = $("#" + idx + '_end').dxNumberBox("instance");
        }
        if (item.format.precision !== undefined && item.format.precision != "0") {
            // if (form[key].editorOptions.format === undefined)
            var format = '#,##0';
            format += '.' + '0'.repeat(item.format.precision);
            startObj.option('format', format);
            endObj.option('format', format);

        }
        if (item.format.precision === undefined || item.format.precision == "0") {
            var format = '#,##0';
            startObj.option('format', format);
            endObj.option('format', format);
        }
    }

    createStartObject(allData, idx) {
        return $("#" + idx + '_start').dxNumberBox({
            value: parseFloat(allData.min),
            showSpinButtons: true,
            onValueChanged: function (data) {
                let sliderObj = $("#" + idx).dxRangeSelector('instance');
                sliderObj.option('value', [data.value, sliderObj.option('value')[1]]);
            }
        }).dxNumberBox("instance");
    }

    createEndObject(allData, idx) {
        return $("#" + idx + '_end').dxNumberBox({
            value: parseFloat(allData.max),
            showSpinButtons: true,
            onValueChanged: function (data) {
                let sliderObj = $("#" + idx).dxRangeSelector('instance');
                sliderObj.option('value', [sliderObj.option('value')[0], data.value]);
            }
        }).dxNumberBox("instance");
    }

    getRangeSelectorOptions(allData, idx) {
        return {
            scale: {
                startValue: parseFloat(allData.min),
                endValue: parseFloat(allData.max),
                minorTick: {
                    visible: false,
                },
            },
            size: {
                width: 617
            },
            onValueChanged: function (data) {
                let start = $("#" + idx + '_start').dxNumberBox('instance');
                let end = $("#" + idx + '_end').dxNumberBox('instance');
                start.option('value', data.value[0]);
                end.option('value', data.value[1]);
            }
        }
    }

        addMonthYear(addMonth, item) {
        const self = this;
        if (addMonth.length > 0) {
            addMonth = app.arrayUnique(addMonth.sort());
            let nn = this.resultArray[item.dataField].length;
            $.each(addMonth, function (ind, arr) {
                let newDate = new Date(arr);
                ++nn;
                self.resultArray[item.dataField].push({
                    'id': nn,
                    'name': self.arrMonth[newDate.getMonth()] + ' ' + newDate.getFullYear(),
                    'start': newDate,
                    'end': new Date(newDate.getFullYear(), newDate.getMonth() + 1, 0, 23, 59, 59)
                });
            });
        }
    }

    addQuarterYear(addQuarter, item) {
        const self = this;
        if (addQuarter.length > 0) {
            addQuarter = app.arrayUnique(addQuarter.sort());
            let nn = this.resultArray[item.dataField].length;
            $.each(addQuarter, function (ind, arr) {
                let newDate = new Date(arr);
                const quarter = Math.floor(newDate.getMonth() / 3);
                ++nn;
                self.resultArray[item.dataField].push({
                    'id': nn,
                    'name': self.arrQuarter[quarter] + ' ' + newDate.getFullYear(),
                    'start': newDate,
                    'end': new Date(newDate.getFullYear(), newDate.getMonth() + 3, 0, 23, 59, 59)
                });
            });
        }
    }

    addYears(addYear, item) {
        const self = this;
        if (addYear.length > 0) {
            addYear = app.arrayUnique(addYear.sort());
            let nn = this.resultArray[item.dataField].length;
            $.each(addYear, function (ind, arr) {
                let newDate = new Date(arr);
                ++nn;
                self.resultArray[item.dataField].push({
                    'id': nn,
                    'name': newDate.getFullYear(),
                    'start': newDate,
                    'end': new Date(newDate.getFullYear() + 1, 0, 0, 23, 59, 59)
                });
            });
        }
    }

    async getDateFilter(idx, item) {
        const self = this;
        await this.getFilterData(item);
        let dataAll = this.allTableData[item.dataField];
        this.resultArray[item.dataField] = this.dateArray.slice(0);
        //добавляем имеющиеся интервалы месяц+год
        let addMonth = [];
        let addQuarter = [];
        let addYear = [];
        $.each(dataAll, function (i, a) {
            if (a != null) {
                let date = new Date(a[item.dataField]);
                addMonth.push(new Date(date.getFullYear(), date.getMonth(), 1).getTime());
                const quarter = 3 * Math.floor(date.getMonth() / 3);
                addQuarter.push(new Date(date.getFullYear(), quarter, 1).getTime());
                addYear.push(new Date(date.getFullYear(), 1, 1).getTime());
            }

        });
        //добавляем имеющиеся интервалы месяц+год
        self.addMonthYear(addMonth, item);
        //добавляем имеющиеся интервалы квартал+год
        self.addQuarterYear(addQuarter, item);
        //добавляем имеющиеся интервалы год
        self.addYears(addYear, item);
        let currValue = sessionStorage.getItem(item.dataField);
        let lastValue = null;
        if (currValue != null) {
            lastValue = self.resultArray[item.dataField][currValue];
        }
        if (!this.issetFilterObject(item)) {
            this.filterObjects.push({
                'column': item, 'widget': $("#" + idx).dxSelectBox(this.getSelectBoxOptions(lastValue, idx, item)).dxSelectBox('instance'),
                'radio': $('#' + idx + '_radio').dxRadioGroup('instance'),
            });
            this.createStartDataBox(idx, item);
            this.createEndDataBox(idx, item);
        }
    }

    createStartDataBox(idx, item) {
        const self = this;
        $("#" + idx + '_start').dxDateBox({
            displayFormat: "shortdate",
            type: "date",
            readOnly: true,
            showClearButton: true,
            buttons: ["clear", "dropDown"],
            onValueChanged: function (data) {
                $.each(self.resultArray[item.dataField], function (index, arr) {
                    if (arr.id == 0) {
                        arr.start = data.value;
                        return false;
                    }
                });
            }
        }).dxDateBox('instance');
    }

    createEndDataBox(idx,item) {
        const self = this;
        $("#" + idx + '_end').dxDateBox({
            displayFormat: "shortdate",
            type: "date",
            readOnly: true,
            showClearButton: true,
            buttons: ["clear", "dropDown"],
            onValueChanged: function (data) {
                $.each(self.resultArray[item.dataField], function (index, arr) {
                    if (arr.id == 0) {
                        arr.end = data.value;
                        return false;
                    }
                });
            }
        }).dxDateBox('instance');
    }

    getSelectBoxOptions(lastValue, idx, item) {
        return {
            //items: dateArray,
            dataSource: this.resultArray[item.dataField],
            displayExpr: "name",
            keyExpr: "id",
            value: lastValue,
            onValueChanged: function (data) {
                if (data.value != null) {
                    let startObj = $("#" + idx + '_start').dxDateBox('instance');
                    let endObj = $("#" + idx + '_end').dxDateBox('instance');
                    startObj.option('value', data.value.start);
                    endObj.option('value', data.value.end);
                    if (data.value.id == 0) {
                        startObj.option('readOnly', false);
                        endObj.option('readOnly', false);
                    } else {
                        startObj.option('readOnly', true);
                        endObj.option('readOnly', true);
                    }
                }
            },
        }
    }

    issetFilterObject(column) {
        let result = false;
        for (let i = 0; i < this.filterObjects.length; i++) {
            if (this.filterObjects[i].column.dataField == column.dataField) {
                result = true;
                break;
            }
        }
        return result;
    }

    getCurrentWeek() {
        let fdWeek = new Date();
        let cdWeek = new Date();
        let dia = fdWeek.getDay();
        if (dia == 0)
            dia = 7;
        let prevWeekEnd = new Date();
        prevWeekEnd.setTime(fdWeek.setUTCHours(-((dia) * 24)));
        let prevWeekStart = new Date();
        prevWeekStart.setTime(fdWeek.setUTCHours(-((dia + 6) * 24)));
        let currWeekStart = new Date();
        currWeekStart.setTime(cdWeek.setUTCHours(-((dia - 1) * 24)));
        let currWeekEnd = new Date();
        currWeekEnd.setTime(cdWeek.setUTCHours((8 - dia) * 24));
        const out = {
            prevWeekEnd: prevWeekEnd,
            prevWeekStart: prevWeekStart,
            currWeekStart: currWeekStart,
            currWeekEnd: currWeekEnd
        };
        return out;
    }

    getCurrentMonth() {
        let fdMonth = new Date();
        const year = fdMonth.getFullYear();
        const month = fdMonth.getMonth();
        const startCurrMonth = new Date(year, month, 1);
        const endCurrMonth = new Date(year, month + 1, 0, 23, 59, 59);
        const startPrevMonth = new Date(year, month - 1, 1);
        const endPrevMonth = new Date(year, month, 0, 23, 59, 59);
        const out = {
            startCurrMonth: startCurrMonth,
            endCurrMonth: endCurrMonth,
            startPrevMonth: startPrevMonth,
            endPrevMonth: endPrevMonth
        };
        return out;
    }

    getCurrentYear() {
        let fdYear = new Date();
        const year = fdYear.getFullYear();
        const startCurrYear = new Date(year, 0, 1);
        const endCurrYear = new Date(year + 1, 0, 0, 23, 59, 59);
        const startPrevYear = new Date(year - 1, 0, 1);
        const endPrevYear = new Date(year, 0, 0, 23, 59, 59);
        const out = {
            startCurrYear: startCurrYear,
            endCurrYear: endCurrYear,
            startPrevYear: startPrevYear,
            endPrevYear: endPrevYear
        };
        return out;
    }

    getCurrentQuarter() {
        let fdQuarter = new Date();
        const year = fdQuarter.getFullYear();
        const month = fdQuarter.getMonth();
        const quarter = 3 * Math.floor(month / 3);
        const startCurrQuarter = new Date(year, quarter, 1);
        const endCurrQuarter = new Date(year, quarter + 3, 0, 23, 59, 59);
        const startPrevQuarter = new Date(year, quarter - 3, 1);
        const endPrevQuarter = new Date(year, quarter, 0, 23, 59, 59);
        const out = {
            startCurrQuarter: startCurrQuarter,
            endCurrQuarter: endCurrQuarter,
            startPrevQuarter: startPrevQuarter,
            endPrevQuarter: endPrevQuarter
        };
        return out;
    }

    getDateArray() {
        const now = new Date();
        const month = this.getCurrentMonth();
        const week = this.getCurrentWeek();
        const year = this.getCurrentYear();
        const quarter = this.getCurrentQuarter();
        return [{
            'id': 0,
            'name': app.translate.saveString("Выбрать период"),
            'start': now,
            'end': now
        }, {
            'id': 1,
            'name': app.translate.saveString("Сегодня"),
            'start': new Date(now.getFullYear(), now.getMonth(), now.getDate()),
            'end': new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
        }, {
            'id': 2,
            'name': app.translate.saveString("Вчера"),
            'start': new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1),
            'end': new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59)
        }, {
            'id': 3,
            'name': app.translate.saveString("Эта неделя"),
            'start': week.currWeekStart,
            'end': week.currWeekEnd
        }, {
            'id': 4,
            'name': app.translate.saveString("Прошлая неделя"),
            'start': week.prevWeekStart,
            'end': week.prevWeekEnd
        }, {
            'id': 5,
            'name': app.translate.saveString("Этот месяц"),
            'start': month.startCurrMonth,
            'end': month.endCurrMonth
        }, {
            'id': 6,
            'name': app.translate.saveString("Прошлый месяц"),
            'start': month.startPrevMonth,
            'end': month.endPrevMonth
        }, {
            'id': 7,
            'name': app.translate.saveString("Этот квартал"),
            'start': quarter.startCurrQuarter,
            'end': quarter.endCurrQuarter
        }, {
            'id': 8,
            'name': app.translate.saveString("Прошлый квартал"),
            'start': quarter.startPrevQuarter,
            'end': quarter.endPrevQuarter
        }, {
            'id': 9,
            'name': app.translate.saveString("Этот год"),
            'start': year.startCurrYear,
            'end': year.endCurrYear
        }, {
            'id': 10,
            'name': app.translate.saveString("Прошлый год"),
            'start': year.startPrevYear,
            'end': year.endPrevYear
        }];
    }

    destroy() {
        app.destroyArray(this.mylsObject);
        app.destroyArray(this.resultArray);
        app.destroyArray(this.filterObjects);
        app.destroyArray(this.allTableData);
        app.destroyArray(this.cols);
        app.destroyArray(this.dateArray);
        this.popup = null;
    }

}
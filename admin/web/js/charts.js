class Charts extends MylsObject {

    constructor(table, ext_id, view, mode, tHistory, viewMode, params) {
        super(table, ext_id, view, mode, tHistory, viewMode, params);
        this.type = 'chart';
        this.pivotSel = [];
        this.dataSources = {};
        this.datas = {};
        this.arrTypes = {
            'bar': 'dxChart',
            'area': 'dxChart',
            'doughnut': 'dxPieChart',
            'map': 'dxVectorMap',
            'funnel': 'dxFunnel'
        };
        this.chartType = 'bar';
        this.element = 'dxChart';
        this.rNum = 0;
    }

    async init() {
        super.init();
        if (this.tableInfo.view !== '') {
            //тип диаграммы
            this.chartType = this.tableInfo.view;
            this.element = this.arrTypes[this.tableInfo.view];
        }
        this.setSeries();
        this.argument = this.columns.getColumnsByColumnType('argument', true).dataField;


        this.createObject();
        $("#" + this.idn).data('mylsObject', this);
        this.showToolbar();
        if (this.template && this.template.report.length > 0) {
            this.showReport();
        }
    }

    setSeries() {
        const self = this;
        this.series = [];
        $.each(this.columns.getColumnsByColumnType('serie', false), function (index, item) {
            self.series.push({valueField: item.dataField, name: item.caption, summaryType: item.summaryType});
        });
    }

    async createObject() {
        switch (this.element) {
            case 'dxVectorMap':
                this.object = await this.showVectorMap();
                break;
            case 'dxChart':
                this.object = this.showChart();
                break;
            case 'dxPieChart':
                this.object = this.showPieChart();
                break;
            case 'dxFunnel':
                this.object = this.showFunnel();
                break;
        }
    }

    fillDataSources() {
        const self = this;
        if (self.template.report.length > 0) {
            $.each(self.template.report, function (index, item) {
                self.pivotSel.push({
                    'id': index,
                    'name': item.hasOwnProperty("@attributes") ? item['@attributes'].caption : item['attributes'].caption,
                });
                let tableId = item.hasOwnProperty("@attributes") ? item['@attributes'].tableId : item['attributes'].tableId;
                if (!tableId) {
                    tableId = self.table;
                }
                if (!self.dataSources.hasOwnProperty(tableId)) {
                    self.dataSources[tableId] = self.createDataSource(tableId);
                }
            });
        }
    }

    createDataSource(tableId) {
        const self = this;
        return new DevExpress.data.DataSource({
            fields: self.columns.columns,
            store: new DevExpress.data.CustomStore({
                key: "id",
                loadMode: "raw",
                load: async function (loadOptions) {
                    if (self.datas.hasOwnProperty(tableId))
                        return self.datas[tableId];
                    else {
                        const result = await app.processData('/frame/tabledata', 'post', self.prepareTableData());
                        self.datas[tableId] = self.processData(result);
                        return self.datas[tableId];
                    }

                },
            })
        });
    }

    processData(data) {
        const self = this;
        data = this.removeNull(data);
        //сортируем массив по заданному полю
        data.sort((prev, next) => {
            if ( prev.map_country < next.map_country ) return -1;
            if ( prev.map_country < next.map_country ) return 1;
        });

        let out = [];
        let old = '';
        let k = 0;
        for (let key in data) {
            if (old != data[key][this.argument]) {
                if (key > 0)
                    k++;
                out[k] = {};
                out[k][this.argument] = data[key][this.argument];
                for (let i of this.series) {
                    if (i.summaryType == 'count') {
                        if (data[key][i.valueField] !== undefined)
                            out[k][i.valueField] = 1;
                        else
                            out[k][i.valueField] = 0;
                    } else {
                        out[k][i.valueField] = data[key][i.valueField];
                    }
                }
                old = data[key][this.argument];
            } else {
                for (let i of this.series) {
                    //сумма
                    if (i.summaryType == 'sum')
                        out[k][i.valueField] = out[k][i.valueField] + data[key][i.valueField];
                    //максимум
                    if (i.summaryType == 'max') {
                        if (data[key][i.valueField] > out[k][i.valueField]) {
                            out[k][i.valueField] = data[key][i.valueField];
                        }
                    }
                    //минимум
                    if (i.summaryType == 'min') {
                        if (data[key][i.valueField] < out[k][i.valueField]) {
                            out[k][i.valueField] = data[key][i.valueField];
                        }
                    }
                    //количество
                    if (i.summaryType == 'count') {
                        if (data[key][i.valueField] !== undefined) {
                            out[k][i.valueField]++;
                        }
                    }
                }
            }
        }
        return out;
    }

    removeNull(data) {
        //удаляем значения равные null
        for (let i = data.length - 1; i >= 0; --i) {
            if (data[i][this.argument] == null) {
                data.splice(i,1);
            }
        }
        return data;
    }

    showToolbar() {
        if (this.viewMode != 'compact') {
            this.toolbar.init();
            if (this.pivotSel.length > 0) {
                const self = this;
                let items = this.toolbar.object.option('items');
                items.push({
                    widget: "dxSelectBox",
                    name: 'selectRow',
                    locateInMenu: 'auto',
                    options: {
                        elementAttr: {
                            toolbarrole: "always",
                        },
                        dataSource: this.pivotSel,
                        displayExpr: "name",
                        valueExpr: "id",
                        value: 0,
                        width: 250,
                        onValueChanged: function (e) {
                            self.rNum = e.value;
                            self.showReport();
                        }
                    },
                    location: "center"
                });
                this.toolbar.object.option('items', items);
            }
        }
    }

    getChartOptions() {
        return {
            palette: "soft",
            dataSource: this.dataSource,
            commonSeriesSettings: {
                argumentField: this.argument,
                type: this.chartType
            },
            series: this.series,
            margin: {
                bottom: 20
            },
            legend: {
                verticalAlignment: "top",
                horizontalAlignment: "center"
            },
            "export": {
                enabled: false
            },
            "valueAxis": {
                autoBreaksEnabled: false,
            },
            tooltip: {
                enabled: true,
                customizeTooltip: function (pointInfo) {
                    return {html: "<div class='chart-tooltip'><div class='chart-value'>" + pointInfo.valueText + "</div><div class='chart-serie'>" + pointInfo.argumentText + "</div></div>"};
                }
            },
            onDisposing: function (e) {
            }
        };
    }

    getFunnelOptions() {
        return {
            palette: "soft",
            dataSource: this.dataSource,
            argumentField: this.argument,
            valueField: "item",
            margin: {
                bottom: 20
            },
            tooltip: {
                enabled: true,
                format: "fixedPoint"
            },
            item: {
                border: {
                    visible: true
                }
            },
            label: {
                visible: true,
                position: "outside",
                backgroundColor: "none",
                customizeText: function (e) {
                    return "<span class='mylsThemeLargeFont mylsMainFont'>" +
                        e.percentText +
                        "</span><br/>" +
                        e.item.argument;
                }
            },
            sortData: false,
            "export": {
                enabled: false
            },
            onDisposing: function (e) {
            }
        };
    }

    getCompactChartOptions() {
        return {
            palette: "pastel",
            dataSource: this.dataSource,
            commonSeriesSettings: {
                ignoreEmptyPoints: true,
                argumentField: this.argument,
                type: this.chartType,
                valueField: 'item',
            },
            commonAxisSettings: {
                visible: false,
                tick: {
                    visible: false,
                },
                label: {
                    visible: false,
                },
            },
            seriesTemplate: {
                nameField: this.argument,
            },
            legend: {
                visible: false,
            },
            "export": {
                enabled: false
            },
            "valueAxis": {
                autoBreaksEnabled: false,
            },
            tooltip: {
                enabled: true,
                customizeTooltip: function (pointInfo) {
                    return {html: "<div class='chart-tooltip'><div class='chart-value'>" + pointInfo.valueText + "</div><div class='chart-serie'>" + pointInfo.argumentText + "</div></div>"};
                }
            },
            onDisposing: function (e) {
            }
        };
    }

    getPieChartOptions() {
        const topN = this.columns.getColumnsByColumnType('topn', true).dataField;
        let options = {};
        if (this.viewMode == 'compact')
            options = this.getCompactChartOptions();
        else
            options = this.getChartOptions();

        if (topN) {
            options.commonSeriesSettings.smallValuesGrouping = {
                mode: "topN",
                topCount: 10
            };
        }
        options.legend = {visible: false};
        options.resolveLabelOverlapping = 'shift';
        options.commonSeriesSettings.label = {
            visible: true,
            connector: {
                visible: true,
                width: 0.5
            },
            position: "columns",
            customizeText: function (arg) {
                return arg.argument + " (" + arg.percentText + ")";
            }
        };
        return options;
    }

    showChart() {
        let chart = '';
        const $charContainer = $("#" + this.idn);
        if (this.viewMode == 'compact')
            chart = $charContainer.dxChart(this.getCompactChartOptions()).dxChart("instance");
        else {
            const $charContainer = $('<div class="myls-chart-container h-100"></div>').appendTo("#" + this.idn);
            chart = $charContainer.dxChart(this.getChartOptions()).dxChart("instance");
        }
        return chart;
    }

    showPieChart() {
        let $charContainer = $("#" + this.idn);
        if (this.viewMode != 'compact')
            $charContainer = $('<div class="myls-chart-container h-100"></div>').appendTo("#" + this.idn);

        const chart = $charContainer.dxPieChart(this.getPieChartOptions()).dxPieChart("instance");
        return chart;
    }

    showFunnel() {
        let $charContainer = $("#" + this.idn);
        if (this.viewMode != 'compact')
            $charContainer = $('<div class="myls-chart-container h-100"></div>').appendTo("#" + this.idn);

        const chart = $charContainer.dxFunnel(this.getFunnelOptions()).dxFunnel("instance");
        return chart;
    }

    getMapValues(country, value, data) {
        let result = [];
        $.each(data, function (index, item) {
            if (item[country] !== null) {
                if (result[item[country]]) {
                    result[item[country]] += item[value];
                } else {
                    result[item[country]] = item[value];
                }
            }
        });
        return result;
    }

    getMapMax(mapData) {
        let values = [];
        for (let key in mapData) {
            values.push(mapData[key]);
        }
        let maxValue = Math.floor(Math.max.apply(null, values));
        let digit = parseInt(maxValue.toString()[0]);
        return (digit + 1) * Math.pow(10, String(maxValue).length - 1);
    }

    getGroupFields(maxValue) {
        if (maxValue < 10)
            maxValue = 10;
        let groupField = [];
        for (let i = 0; i <= maxValue; i = i + maxValue / 10) {
            groupField.push(parseInt(i));
        }
        return groupField;
    }

    async showVectorMap() {
        const self = this;
        this.fillDataSources();
        const $charContainer = $('<div class="myls-chart-container h-100"></div>').appendTo("#" + this.idn);
        const chart = $charContainer.dxVectorMap(this.getVectorMapOptions()).dxVectorMap("instance");
        this.dataSource = this.dataSources[this.table];

        return chart;
    }

    getVectorMapOptions() {
        const self = this;
        let mapData = this.getMapValues(this.argument, this.series[0].valueField, this.dataSources[this.table].items());
        let maxValue = this.getMapMax(mapData);
        let groupField = this.getGroupFields(maxValue);
        return {
            bounds: [-180, 85, 180, -60],
            layers: {
                name: "areas",
                dataSource: DevExpress.viz.map.sources.world,
                palette: "Violet",
                colorGroups: groupField,
                colorGroupingField: this.argument,
                customize: function (elements) {
                    self.customize(elements, mapData);
                }
            },
            legends: [{
                source: {layer: "areas", grouping: "color"},
                customizeText: function (arg) {
                    return DevExpress.localization.formatNumber(arg.start, "#,##0") + " - " + DevExpress.localization.formatNumber(arg.end, "#,##0");
                }
            }],
            tooltip: {
                enabled: true,
                customizeTooltip: function (arg) {
                    if (arg.attribute(self.argument)) {
                        return {text: arg.attribute("name") + ": " + DevExpress.localization.formatNumber(arg.attribute(self.argument), "#,##0")};
                    }
                }
            }
        };
    }

    customize(elements, mapData) {
        const self = this;
        $.each(elements, function (_, element) {
            const name = element.attribute('name');
            for (let key in mapData) {
                if (name == key) {
                    element.attribute(self.argument, mapData[key]);
                }
            }
        });
    }

    async showReport() {
        const list = this.template.report[this.rNum];
        let tableId = list.hasOwnProperty("@attributes") ? list['@attributes'].tableId : list['attributes'].tableId;
        if (!tableId) {
            tableId = this.table;
        }
        await this.dataSources[tableId].load();
        await this.refresh(true, true, this.dataSources[tableId]);
        this.dataSource = this.dataSources[tableId];
        this.changed();
    }

    updateMap(dataSource) {
        let series = [];
        $.each(this.columns.getColumnsByColumnType('serie', false), function (index, item) {
            series.push({valueField: item.dataField, name: item.caption});
        });
        let currentSerie = series[this.rNum];
        let elements = this.object.getLayers()[0].getElements();
        let argument = this.columns.getColumnsByColumnType('argument', true).dataField;
        let mapData = this.getMapValues(argument, currentSerie.valueField, dataSource.items());
        let maxValue = this.getMapMax(mapData);
        let groupField = this.getGroupFields(maxValue);
        $.each(elements, function (_, element) {
            const name = element.attribute('name');
            element.attribute(argument, undefined);
            for (let key in mapData) {
                if (name == key) {
                    element.attribute(argument, mapData[key]);
                }
            }
    });
        this.object.option("layers.colorGroups", groupField);
    }

    async refresh(changesOnly = true, useLoadPanel = true, dataSource) {
        super.refresh(changesOnly, useLoadPanel);
        if (this.element == 'dxVectorMap') {
            this.updateMap(dataSource);
        } else if (this.element == 'dxFunnel') {
            this.object.getDataSource().reload();
        } else {
            this.object.refresh();
        }
    }

    destroy() {
        super.destroy();
        $("#" + this.idn).data('mylsObject', null);
        app.destroyArray(this.dataSources);
        app.destroyArray(this.pivotSel);
        app.destroyArray(this.datas);
        app.destroyArray(this.arrTypes);
        app.destroyArray(this.series);
        this.close();
    }

}
class Pivot extends MylsObject {

    constructor(table, ext_id, view, mode, tHistory, viewMode, params) {
        super(table, ext_id, view, mode, tHistory, viewMode, params);
        this.type = 'pivot';
        this.dataSources = {};
        this.pivotSel = [];
        this.datas = {};
    }

    async init() {
        super.init();
        this.fillDataSources();
        this.showToolbar();
        //var pivotGridChart = getChart();
        this.options = this.getOptions();
        this.getOptions();
        this.showReport(0);
        $("#" + this.idn).data('mylsObject', this);
    }

    getOptions() {
        return {
            allowSortingBySummary: true,
            allowFiltering: true,
            showBorders: true,
            showColumnGrandTotals: true,
            showRowGrandTotals: true,
            showRowTotals: false,
            showColumnTotals: false,
            fieldChooser: {
                enabled: true,
                height: 400
            },
            /*
            onDisposing: function (e) {
                //console.log(e.element.attr('id'));
                objects[idn] = null;
                objects[idn + '-pivotContainer'] = null;
            }
             */
        };
    }

    fillDataSources() {
        if (!$.isArray(this.template.report)) {
            let arrStr = [];
            arrStr[0] = this.template.report;
            this.template.report = arrStr;
        }
        //console.log(structureList.report);
        if (this.template.report.length > 0) {
            const self = this;
            $.each(this.template.report, function (index, item) {
                self.pivotSel.push({
                    'id': index,
                    'name': item.hasOwnProperty("@attributes") ? item['@attributes'].caption : item['attributes'].caption,
                });
                let tableId = item.hasOwnProperty("@attributes") ? item['@attributes'].tableId : item['attributes'].tableId;
                if (!tableId) {
                    tableId = self.table;
                }
                if (!self.dataSources.hasOwnProperty(tableId)) {
                    self.dataSources[tableId] = self.getDataSource(tableId);
                }
            });
        }
    }

    getDataSource(tableId) {
        const self = this;
        return {
            fields: self.tableColumns.columns,
            store: new DevExpress.data.CustomStore({
                key: "id",
                loadMode: "raw",
                load: async function (loadOptions) {
                    if (self.datas.hasOwnProperty(tableId))
                        return self.datas[tableId];
                    else
                    {
                        let result = await app.processData('frame/tabledata', 'post', self.prepareTableData());
                        self.datas[tableId] = result;
                        return result;
                    }


                },
            })
        };
    }

    createChart() {
        if ($("#" + this.idn + '-chartContainer').length == 0) {
            $("#" + this.idn).append('<div id="' + this.idn + '-chartContainer" class="chart-container"></div>');
            $("#" + this.idn + '-chartContainer').append("<div id='" + this.idn + "_chart' class='myls-pivot-chart'>");
        }
    }

    getChartOptions() {
        return {
            commonSeriesSettings: {
                type: "bar"
            },
            tooltip: {
                enabled: true,
                customizeTooltip: function (pointInfo) {
                    return {html: "<div class='chart-tooltip'><div class='chart-value'>" + pointInfo.valueText + "</div><div class='chart-serie'>" + pointInfo.seriesName + "</div></div>"};
                }
            },
            size: {
                height: $("#" + this.idn + '-chartContainer').innerHeight()
            },
            adaptiveLayout: {
                width: 500
            },
            onDisposing: function (e) {
                //console.log(e.element.attr('id'));
                //console.log(idn, chartIdn);
                //objects[chartIdn] = null;
            }
        }
    }

    getChart() {
        this.createChart();
        this.objectChart = $("#" + this.idn + "_chart").dxChart(this.getChartOptions()).dxChart("instance");
        return this.objectChart;
    }

    showToolbar() {
        this.toolbar.init();
        if (this.template.report.length > 1) {
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
                        self.showReport(e.value);
                    }
                },
                location: "center"
            });
            this.toolbar.object.option('items', items);
        }
    }

    removePivotGrid() {
        if ($("#" + this.idn + '-pivotContainer').length) {
            $("#" + this.idn + '-pivotContainer').dxPivotGrid("instance").dispose();
            $("#" + this.idn + '-pivotContainer').remove();
        }
    }

    createPivotGrid(chartType) {
        let pivotGrid = false;
        $("#" + this.idn + "_chart").dxChart('dispose');
        $("#" + this.idn + '-chartContainer').remove();
        if (chartType !== undefined) {
            let pivotGridChart = this.getChart();
            pivotGrid = this.createReport();
            pivotGridChart.option('commonSeriesSettings.type', chartType);
            pivotGrid.bindChart(pivotGridChart, {
                dataFieldsDisplayMode: "splitPanes",
                alternateDataFields: false
            });
        } else {
            pivotGrid = this.createReport();
        }
        this.object = pivotGrid;
    }

    showReport(rNum) {
        const list = $.isArray(this.template.report) ? this.template.report[rNum] : this.template.report;
        let tableId = list.hasOwnProperty("@attributes") ? list['@attributes'].tableId : list['attributes'].tableId;
        if (!tableId) {
            tableId = this.table;
        }
        const chartType = list.hasOwnProperty("@attributes") ? list['@attributes'].chart : list['attributes'].chart;
        this.options.dataSource = this.dataSources[tableId];
        this.dataSource = this.dataSources[tableId];
        this.dataSource.store.load();
        this.setAreas(list);
        this.removePivotGrid();
        this.createPivotGrid(chartType);
    }

    createReport() {
        $("#" + this.idn).append('<div id="' + this.idn + '-pivotContainer" class="pivot-container"></div>');
        return $("#" + this.idn + '-pivotContainer').dxPivotGrid(this.options).dxPivotGrid("instance");
    }

    setAreas(list) {
        const self = this;
        if (this.options.dataSource.fields) {
            $.each(this.options.dataSource.fields, function (_, item) {
                item['area'] = undefined;
            });
        }
        if ($.isArray(list.row.field))
            $.each(list.row.field, function (_, item) {
                self.options.dataSource.fields[item.toLowerCase()]['area'] = 'row';
            });
        else
            this.options.dataSource.fields[list.row.field.toLowerCase()]['area'] = 'row';

        if ($.isArray(list.column.field))
            $.each(list.column.field, function (_, item) {
                self.options.dataSource.fields[item.toLowerCase()]['area'] = 'column';
            });
        else
            this.options.dataSource.fields[list.column.field.toLowerCase()]['area'] = 'column';

        if ($.isArray(list.data.field))
            $.each(list.data.field, function (_, item) {
                self.options.dataSource.fields[item.toLowerCase()]['area'] = 'data';
            });
        else
            this.options.dataSource.fields[list.data.field.toLowerCase()]['area'] = 'data';

    }

    async refresh(changesOnly = true, useLoadPanel = true) {
        super.refresh(changesOnly, useLoadPanel);
        await this.object.getDataSource().reload();
        this.toolbar.setEnabledToolbar();
    }

    destroy() {
        super.destroy();
        $("#" + this.idn).data('mylsObject', null);
        app.destroyArray(this.dataSources);
        app.destroyArray(this.pivotSel);
        app.destroyArray(this.datas);
        app.destroyArray(this.options);
        this.objectChart = null;
        this.close();
    }

}
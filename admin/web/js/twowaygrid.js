class TwoWayGrid extends MylsObject {

    constructor(table, ext_id, view, mode, tHistory, viewMode, params) {
        super(table, ext_id, view, mode, tHistory, viewMode, params);
        this.type = 'twowaygrid';
        this.dataColumn = {};
        this.columnColumn = {};
        this.rowsColumn = [];
        this.searchColumns = [];
        this.newDataSource = [];
        this.out = [];
    }

    async init() {
        super.init();
        this.dataSource.load();
        this.setColumnsData();
        this.setNewDataSource();
        this.createObject();
        $("#" + this.idn).data('mylsObject', this);
    }

    createObject() {
        this.object = $("#" + this.idn).dxDataGrid(this.getOptions()).dxDataGrid('instance');
    }

    getOptions() {
        const self = this;
        return {
            dataSource: this.out,
            onCellPrepared: function(e) {
                self.cellPreppared(e);
            },
            onCellClick: function(e) {
                self.cellClick(e);
            },
            editing: {
                mode: "batch",
                allowUpdating: true,
                selectTextOnEditStart: true,
                startEditAction: "click"
            },
            showBorders: true,
            paging: {
                pageSize: 20
            },
            pager: {
                showPageSizeSelector: true,
                allowedPageSizes: [5, 10, 20],
                showInfo: true
            },
            columns: this.rowsColumn
        }
    }

    cellClick(e) {
        const self = this;
        $.each(this.dataSource.item(), function (index, item) {
            if (item.client_id == e.data.client_id && item[self.columnColumn.dataField] == e.column.caption) {
                console.log(item);
            }
        });
    }

    cellPreppared(e) {
        if (e.rowType == 'data' && e.column.columnType == 'columnData' && e.value === undefined) {
            e.cellElement.html('');
        }
    }

    setColumnsData() {
        const self = this;
        $.each(this.columns.columns, function(index, item) {
            if (item.columnType == 'data') {
                self.dataColumn = item;
            }
            if (item.columnType == 'column') {
                self.columnColumn = item;
            }
            if (item.columnType == 'row') {
                self.rowsColumn.push(item);
                self.searchColumns.push(item.dataField);
            }
        });
    }

    setNewDataSource() {
        const self = this;
        if (!$.isEmptyObject(this.columnColumn)) {
            this.setRowColumns();
            if (this.rowsColumn.length > 0) {
                this.getNewDataSource();
                this.sortNewDataSource();
                let oldObj = {};
                for(let dd in this.newDataSource) {
                    let isEqual = true;
                    $.each(this.searchColumns, function (i, item) {
                        if (oldObj[item] != self.newDataSource[dd][item]) {
                            oldObj = self.newDataSource[dd];
                            isEqual = false;
                            return false;
                        }
                    });
                    if (isEqual) {
                        Object.assign(self.out[self.out.length-1], self.newDataSource[dd]);
                    } else {
                        self.out.push(self.newDataSource[dd]);
                    }
                }
            }
        }
    }

    sortNewDataSource() {
        const self = this;
        this.newDataSource.sort((prev, next) => {
            for (let col in self.rowsColumn) {
                let field = self.rowsColumn[col].dataField;
                if (prev[field] < next[field]) {
                    return 1;
                }
                if (prev[field] > next[field]) {
                    return -1;
                }
            }
            return 0;
        });
    }

    getNewDataSource() {
        const self = this;
        $.each(this.dataSource.items(), function (index, item) {
            let row = {};
            $.each(self.rowsColumn, function (i, it) {
                if (item[it.dataField]) {
                    row[it.dataField] = item[it.dataField];
                }
                if (it.columnType == 'columnData') {
                    if (item[self.columnColumn.dataField] == it.caption)
                        row[it.dataField] = item[self.dataColumn.dataField];
                }
            });
            self.newDataSource.push(row);
        });
    }

    setRowColumns() {
        const self = this;
        let datas = [];
        $.each(this.dataSource.items(), function (index, item) {
            if (item[self.columnColumn.dataField] !== null) {
                datas.push(item[self.columnColumn.dataField]);
            }
        });
        datas = datas.filter(function (item, pos) {
            return datas.indexOf(item) == pos;
        });
        $.each(datas, function (index, item) {
            self.rowsColumn.push({
                dataField: self.columnColumn.dataField + index,
                caption: item,
                width: 100,
                visible: true,
                columnType: 'columnData',
                fixed: false,
                allowEditing: true,
                useColumn: 1,
                dataType: self.dataColumn.dataType,
                //format: "dd.MM.y",
            });
        });
    }

    destroy() {
        super.destroy();
        $("#" + this.idn).data('mylsObject', null);
        app.destroyArray(this.dataColumn);
        app.destroyArray(this.columnColumn);
        app.destroyArray(this.rowsColumn);
        app.destroyArray(this.searchColumns);
        app.destroyArray(this.newDataSource);
        app.destroyArray(this.out);
        this.close();
    }

}
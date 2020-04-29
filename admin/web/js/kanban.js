class Kanban extends MylsObject {

    constructor(table, ext_id, view, mode, tHistory, viewMode, params) {
        super(table, ext_id, view, mode, tHistory, viewMode, params);
        this.type = 'kanban';
        this.groups = [];
        this.container = $('#' + this.idn);
    }

    async init() {
        super.init();
        this.container.addClass('myls-kanban');
        this.group_col = this.columns.getColumnsByColumnType('group', true);
        this.cell_col = this.columns.getColumnsByColumnType('data', true);
        this.tableData = await app.processData('/kanban/tabledata', 'post', this.prepareTableData());
        const self = this;
        $.each(this.tableData, function (index, item) {
            self.groups.push(item[self.group_col.dataField]);
        });
        this.groups = app.arrayUnique(groups);
        this.createKanban();
        this.createObject();
    }

    createObject() {
        this.object = {
            object: this.container,
            columns: this.columns.columns,
            tableInfo: this.tableInfo,
            menu: this.menu,
            type: 'kanban',
            tHistory: this.tHistory,
            idn: this.idn,
        };
        $("#" + this.idn).data('mylsObject', this);
    }

    //создаем сам объект
    createKanban() {
        const self = this;
        self.groups.forEach(function(group) {
            self.createCols(group);
        });
        this.container.addClass("scrollable-board").dxScrollView({
            direction: "horizontal",
            showScrollbar: "always"
        });
        this.container.addClass("sortable-lists").dxSortable({
            filter: ".list",
            itemOrientation: "horizontal",
            handle: ".list-title",
            moveItemOnDrop: true
        });
    }
    //создаем столбцы
    createCols(group) {
        const self = this;
        const $list = $("<div>").addClass("list").appendTo(this.container);
        //выводим заголовок столбца
        $("<div>").addClass("list-title").addClass("dx-theme-text-color").text(group).appendTo($list);
        let Data = this.tableData.filter(function(task) {
            return task[self.group_col.dataField] === group
        });
        this.createCards(Data, $list);
    }
    //создаем карточки внутри столбца
    createCards(data, $list) {
        const self = this;
        let $scroll = $("<div>").appendTo($list);
        let $items = $("<div>").appendTo($scroll);
        data.forEach(function(task) {
            self.createCard(task, $items);
        });
        $scroll.addClass("scrollable-list").dxScrollView({
            direction: "vertical",
            showScrollbar: "always"
        });
        $items.addClass("sortable-cards").dxSortable({
            group: this.idn,
            moveItemOnDrop: true
        });
    }
    //создаем саму карточку
    createCard(task, $items) {
        let $item = $("<div>").addClass("card").addClass("dx-card").addClass("dx-theme-text-color").addClass("dx-theme-background-color").appendTo($items);
        let cell =  task[this.cell_col.dataField];
        $("<div>").addClass("card-priority").addClass("priority-" + this.cell_col.dataField).appendTo($item);
        $("<div>").addClass("card-subject").text(this.cell_col.caption).appendTo($item);
        $("<div>").addClass("card-assignee").text(cell).appendTo($item);
    }

    destroy() {
        super.destroy();
        $("#" + this.idn).data('mylsObject', null);
        this.container = null;
        app.destroyArray(this.groups);
        this.close();
    }

}
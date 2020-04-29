function initKanban(table, ext_id, view, mode, tHistory) {
    var deferred = new $.Deferred;
    var idn = getIdn(table, ext_id, 'kanban', view);
    //получаем данные
    var startData = initData(table, ext_id, 'kanban');
    var data = getData('/kanban/tabledata', 'post', prepareTableData(table, ext_id, null, null));
    //var structureList = getTemplate(table);
    //стартуем окошко загрузки
    openLoadPanel(idn);
    //выводим таблицу
    $.when(startData.tableColumns, startData.contextMenuData, startData.tableInfo, data).done(function (columns, menu, tableInfo, tableData) {

        var groups = [];
        var $container = $('#' + idn);
        $container.addClass('myls-kanban');
        var group_col = getColumnByColumnType('group', columns.columns);
        var cell_col = getColumnByColumnType('data', columns.columns);
        $.each(tableData, function (index, item) {
            groups.push(item[group_col.dataField]);
        });
        groups = arrayUnique(groups);

        createKanban(groups, $container);
        //создаем сам объект
        function  createKanban(groups, $container) {
            groups.forEach(function(group) {
                createCols(group, $container);
            });
            $container.addClass("scrollable-board").dxScrollView({
                direction: "horizontal",
                showScrollbar: "always"
            });
            $container.addClass("sortable-lists").dxSortable({
                filter: ".list",
                itemOrientation: "horizontal",
                handle: ".list-title",
                moveItemOnDrop: true
            });
        }
        //создаем столбцы
        function createCols(group, $container) {
            var $list = $("<div>").addClass("list").appendTo($container);
            //выводим заголовок столбца
            $("<div>").addClass("list-title").addClass("dx-theme-text-color").text(group).appendTo($list);
            var Data = tableData.filter(function(task) {
                return task[group_col.dataField] === group
            });
            createCards(Data, $list);
        }
        //создаем карточки внутри столбца
        function createCards(data, $list) {
            var $scroll = $("<div>").appendTo($list);
            var $items = $("<div>").appendTo($scroll);
            data.forEach(function(task) {
                createCard(task, $items);
            });
            $scroll.addClass("scrollable-list").dxScrollView({
                direction: "vertical",
                showScrollbar: "always"
            });
            $items.addClass("sortable-cards").dxSortable({
                group: idn,
                moveItemOnDrop: true
            });
        }
        //создаем саму карточку
        function createCard(task, $items) {
            var $item = $("<div>").addClass("card").addClass("dx-card").addClass("dx-theme-text-color").addClass("dx-theme-background-color").appendTo($items);
            var cell =  task[cell_col.dataField];
            $("<div>").addClass("card-priority").addClass("priority-" + cell_col.dataField).appendTo($item);
            $("<div>").addClass("card-subject").text(cell_col.caption).appendTo($item);
            $("<div>").addClass("card-assignee").text(cell).appendTo($item);
        }

        var object = {
            object: $container,
            columns: columns.columns,
            tableInfo: tableInfo,
            menu: menu,
            type: 'kanban',
            tHistory: tHistory,
            idn: idn,
        };

        objects[idn] = object;

        closeLoadPanel(idn);
        deferred.resolve(object);

    }).fail(function (error) {
        showError(idn, error);
        deferred.reject();
    });
    return deferred;
}
function initTree(table, ext_id, view, mode, tHistory) {
    var deferred = new $.Deferred;
    var idn = getIdn(table, ext_id, 'tree', view);
    //получаем данные
    var startData = initData(table, ext_id, 'tree');
    //стартуем окошко загрузки
    openLoadPanel(idn);
    //выводим таблицу
    $.when(startData.tableColumns, startData.contextMenuData, startData.tableInfo).done(function (columns, menu, tableInfo) {

        processCellTemplates(columns['columns'], idn);

        tableInfo.idn = idn;
        var selParams = getSelParams(tableInfo);
        var loadData = createDataSource(table, ext_id, idn, tHistory, columns.columns, tableInfo, selParams);
        var curState = JSON.stringify({});

        var usedColumns = getUsedColumns(columns['columns']);
        usedColumns.__lastColumn__ = {
            width: "auto",
            cssClass: 'last-column', // this class in the CSS block
            // removes paddings and borders of the last column
            visibleIndex: 100000,
            cellTemplate: function (container) {
                // this empty template removes the
                // spaces from data cells
            }
        };

        var grid = $("#" + idn).dxTreeList({
            dataSource: loadData,
            keyExpr: "id",
            parentIdExpr: "parent_id",
            columns: columns['columns'],
            editing: {
                refreshMode: "reshape",
            },
            scrolling: {
                mode: "virtual",
                rowRenderingMode: "virtual"
            },
            focusedRowEnabled: true,
            focusedRowIndex: 0,
            headerFilter: {
                visible: true,
                allowSearch: true
            },
            selection: {
                mode: "multiple",
                showCheckBoxesMode: "always",
            },
            export: {
                enabled: true,
                fileName: "Employees",
                allowExportSelectedData: false
            },
            searchPanel: {visible: true},
            wordWrapEnabled: true,
            showColumnLines: true,
            showRowLines: false,
            rowAlternationEnabled: true,
            filterRow: {visible: true},
            columnResizingMode: 'widget',
            allowColumnResizing: true,
            columnAutoWidth: false,
            /*filterPanel: {visible: true},*/
            loadPanel: {
                enabled: false
            },
            disabled: true,
            /*onInitialized: function (e) {
                saveFileTranslate();
            },*/
            onContentReady: function (e) {
                contentReady(idn, e, 'tree');
                var dataSource = e.component.getDataSource();
                if (dataSource != undefined) {
                    $('#' + idn + '_totalCount').text(saveString("Всего записей:") + ' ' + dataSource._totalCount);
                }
            },
            onFocusedRowChanged: function (e) {
            },
            onContextMenuPreparing: function (e) {
                if (e.row !== undefined)
                    openContextMenu(idn, e.row.key, e.row.data, tHistory);
            },
            onRowClick: function (e) {
                //processDblClick(e, tableInfo, e.key, tHistory, 'tree', columns);
            },
            onRowDblClick: function (e) {
                processDblClick(e, tableInfo, e.key, tHistory, 'tree', columns);
            },
            onToolbarPreparing: function (e) {
                initToolbar(e, e.toolbarOptions.items, tableInfo, table, ext_id, 'tree', tHistory, columns);
            },
            onSelectionChanged: function (e) {
                var countSelected = e.component.getSelectedRowKeys().length;
                if (countSelected > 0) {
                    $('#' + idn + '_totalSelected').closest('.myls-total-selected').removeClass('dx-state-invisible');
                    $('#' + idn + '_totalSelected').text(saveString("Всего выделено:") + ' ' + countSelected);
                } else {
                    $('#' + idn + '_totalSelected').closest('.myls-total-selected').addClass('dx-state-invisible');
                    $('#' + idn + '_totalSelected').text(saveString("Всего выделено:") + ' ' + 0);
                }
                //$('#' + idn + '_totalSelected').text(saveString("Всего выделено:") + ' ' + e.component.getSelectedRowKeys().length);
            },
            stateStoring: {
                enabled: true,
                type: "custom",
                savingTimeout: 500,
                customLoad: function () {
                    return sendStorageRequest("storage", "json", "GET", false, table, usedColumns);
                },
                customSave: function (state) {
                    prepareStorage(state);
                    var cState = JSON.stringify(state);
                    if (curState != cState) {
                        sendStorageRequest("storage", "json", "POST", state, table);
                        curState = cState;
                    }
                }
            },
            onDisposing: function (e) {
                //console.log(e.element.attr('id'));
                loadData.dispose();
                //objects[idn].saveFunction = null;
                columns = null;
                tableInfo = null;
                tHistory = null;
                menu = null;
                //objects[idn].object = null;
                objects[idn] = null;
                filterObjects[table] = null;
                startData = null;
                selParams = null;
                loadData = null;
                idn = null;
            },
            //showBorders: true
        }).dxTreeList("instance");
        initContextMenu(idn, menu, '#' + idn + ' .dx-treelist-content');

        var object = {
            object:grid,
            columns:columns.columns,
            tableInfo:tableInfo,
            menu:menu,
            type:'tree',
            tHistory: tHistory,
            idn:idn,
            dataSource: loadData
        };
        objects[idn] = object;

        initBottomToollbar(idn, 0, 0);

        deferred.resolve(object);
    }).fail(function (error) {
        showError(idn, error);
        deferred.reject();
    });
    return deferred;
}

//функция для определения выбранного родителя в дереве
function getCheckParent(items, id) {
    var currParent = items[id].parent_id;
    var parentIndex = false;
    if ((currParent == undefined) || (currParent == null)) {
        return items[id];
    } else {
        $.each(items, function (index, item) {
            if (item.id == currParent) {
                parentIndex = index;
                //return false;
            }
        });
    }
    if (parentIndex !== false) {
        if (items[parentIndex].selected == true) {
            if (/*items[parentIndex].parentId &&*/ items[parentIndex].parent_id !== null) {
                return getCheckParent(items, parentIndex);
            } else {
                return items[parentIndex];
            }
        } else {
            return items[id];
        }
    }
}

function disposeTree(table, ext_id, type, view) {
    var idn = getIdn(table, ext_id, type, view);
    $('#' + idn).dxTreeList('dispose');
}
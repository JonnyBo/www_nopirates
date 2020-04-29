function initCards(table, ext_id, view, mode, tHistory) {
    var deferred = new $.Deferred;
    var idn = getIdn(table, ext_id, 'cards', view);
    //получаем данные
    var startData = initData(table, ext_id, 'cards');
    //var templData = getData('/cards/gettemplate', 'get', {'table': table, 'extId': ext_id});
    var templData = getTemplate(table);
    //var tableData = getData('/cards/tabledata', 'get', {'id': table, 'extId': ext_id});
    //стартуем окошко загрузки
    //openLoadPanel(idn);
    //выводим таблицу
    $.when(startData.tableColumns, startData.contextMenuData, startData.tableInfo, templData).done(function (columns, menu, tableInfo, tableTpl) {
        var selParams = getSelParams(tableInfo);
        var loadData = createDataSource(table, ext_id, idn, tHistory, columns.columns, tableInfo, selParams);

        tableInfo.idn = idn;
        columns = columns.columns;

        var searchExpr = getUsedFields(tableTpl, ['title', 'subtitle', 'text'], columns);

        var grid = $("#" + idn).dxList({
            dataSource: loadData,
            //showSelectionControls: true,
            pullRefreshEnabled: false,
            selectionMode: "single",
            searchEnabled: true,
            searchExpr: searchExpr,
            searchMode: 'contains',
            noDataText:saveString('Пока в этом разделе нет данных. Чтобы внести информацию, воспользуйтесь кнопкой "Добавить"'),
            //disabled: true,
            /*onInitialized: function (e) {
                saveFileTranslate();
            },*/
            onContentReady: function (e) {
                //col-md-4 col-xl-2 col-sm-6

                $("#" + idn + " .dx-list-item").addClass("col d-flex align-items-stretch");
                $("#" + idn + " .dx-list-item-content").addClass("d-block");
                $("#" + idn + " .dx-scrollview-content").addClass("card-view d-flex align-items-stretch flex-wrap");
                resizeCards($("#" + idn));
                contentReady(idn, e, 'cards');

                $('#' + idn + '_totalCount').text(saveString("Всего записей:") + ' ' + e.component.option('items').length);
            },
            onSelectionChanged: function (e) {
                //console.log(e);
                setEnabledToolbar(e, 'cards');
                var countSelected = e.component.option('selectedItemKeys').length;
                if (countSelected > 0) {
                    $('#' + idn + '_totalSelected').closest('.myls-total-selected').removeClass('dx-state-invisible');
                    $('#' + idn + '_totalSelected').text(saveString("Всего выделено:") + ' ' + countSelected);
                } else {
                    $('#' + idn + '_totalSelected').closest('.myls-total-selected').addClass('dx-state-invisible');
                    $('#' + idn + '_totalSelected').text(saveString("Всего выделено:") + ' ' + 0);
                }
                //$('#' + idn + '_totalSelected').text(saveString("Всего выделено:") + ' ' + e.component.option('selectedItemKeys').length);
            },
            onItemClick: function (e) {
                dblClick(e, tableInfo, getCurrentId(e, 'cards'), tHistory, 'cards', columns);
            },
            itemTemplate: function (data) {
                if (tableTpl && tableTpl.length != 0) {
                    var item = [];
                    item.template = '<div data-dir="v" class="card">' + tableTpl + '</div>';
                    item.dataType = 'block';
                    var  template = getFormattedCellValue('', item, columns, data, idn);
                    template = addMultiView(template, data);
                    return template;
                } else {
                    var result = $("<div>").addClass("card");
                    var item = getItemValueByColumnType("image", columns, data, idn);
                    if (item != "" && item != null)
                        $(item).addClass("card-img-top").appendTo(result);
                    var card = $('<div>').addClass("card-body").appendTo(result);

                    item = getItemValueByColumnType("title", columns, data, idn);
                    if (item != "" && item != null)
                        $('<h4>').addClass("card-title").html(item).appendTo(card);
                    item = getItemValueByColumnType("subtitle", columns, data, idn);
                    if (item != "" && item != null)
                        $('<h5>').addClass("card-subtitle").html(item).appendTo(card);
                    // if (data.title != "")
                    item = getItemValueByColumnType("text", columns, data, idn);
                    if (item != "" && item != null)
                        $('<p>').addClass("card-text").html(item).appendTo(card);
                    return result;
                }
            },
            onItemContextMenu: function (e) {
                if (e.itemData !== undefined)
                    openContextMenu(idn, e.itemData.id, e.itemData, tHistory);
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
                templData = null;
                selParams = null;
                loadData = null;
                idn = null;
            },
        });


        initBottomToollbar(idn, 0, 0);

        var object = {
            object:grid,
            columns:columns,
            tableInfo:tableInfo,
            menu:menu,
            type:'cards',
            tHistory: tHistory,
            idn:idn,
            dataSource: loadData
        };
        objects[idn] = object;

        $("#" + idn).prepend('<div class="dx-datagrid-header-panel"></div>');
        $("#" + idn + " .dx-datagrid-header-panel").append('<div role="toolbar"></div>');
        var items = [];
        initToolbar(undefined, items, tableInfo, table, ext_id, 'cards', tHistory, columns);
        var toolbar = $("#" + idn + " [role=toolbar]").dxToolbar({
            items: items,
        }).dxToolbar("instance");

        deferred.resolve(object);
        $(document.body).on('click', '#' + idn + ' .dx-datagrid-filter-panel-left', function () {
            $('#' + idn + '_popupContainer').dxPopup("show");
        });

        initContextMenu(idn, menu, '#' + idn + ' .dx-scrollview-content');

        function addMultiView(template, info) {
            //debugger
            //ищем блоки для multi view
            var $tplm = $('<div data-dir="m"></div>');
            var $template = $(template);
            var $block = $('[data-dir="m"]', $template);

            if ($block != undefined) {
                var items = [];
                $.each($block.children('div'), function (index, el) {
                    items.push({"html": el.innerHTML});
                });
                //подключаем multi view
                var id = idn + '_multiview-container_' + info.id;
                $block.attr("id", id);
                $block.empty();
                //$tplm.append('<div id="' + id + '"></div>');
                var multiView = $('#' + id, $template).dxMultiView({
                    height: "auto",
                    //dataSource: item,
                    deferRendering: false,
                    selectedIndex: 0,
                    loop: false,
                    animationEnabled: true,
                    swipeEnabled: true,
                    items: items,
                    onSelectionChanged:function (e) {
                        $('#' + id + ' .myls-mv-button').removeClass('active');
                        $('#' + id + ' .myls-mv-button:nth-child(' + (e.component.option('selectedIndex') + 1) + ')').addClass('active');
                    },
                }).dxMultiView("instance");

                if (items.length > 1) {
                    $block.append('<div class="myls-mv-buttons d-flex justify-content-center"></div>');
                    $.each(items, function (index, item) {
                        $('.myls-mv-buttons', $block).append('<i id="' + id + '_' + index + '" class="myls-mv-button"/>');
                        $(document.body).on('click', '#' + id + '_' + index, function (e) {
                            $('#' + id + ' .myls-mv-button').removeClass('active');
                            $('#' + id + '_' + index).addClass('active');
                            multiView.option('selectedIndex', index);
                        });
                    });
                    $('.myls-mv-button:first-child', $block).addClass('active');
                }
                //$('[data-dir="m"]', $template).html($tplm.html());
                template = $template.get(0);
            }
            return template;
        }


    }).fail(function (error) {
        showError(idn, error);
        deferred.reject();
    });
    return deferred;
}

function disposeCards(table, ext_id, view, type) {
    var idn = getIdn(table, ext_id, type, view);
    $('#' + idn).dxList('dispose');
    $("#" + idn + " [role=toolbar]").dxToolbar('dispose');
}


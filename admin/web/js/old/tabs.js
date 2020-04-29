function openTabs(url, title, type, ext_id, tHistory, old) {
    var grid = url.replace(/#/g, '');
    var arrurl = grid.split(/\-|\_/);
    var table = arrurl[1];
    var selTab = 0;
    var thisTab = false;
    var view = 'tab';
    //console.log(panelContent, ext_id);
    $.each(panelContent, function (index, value) {
        if (value.id === table && value.ext_id === ext_id && value.type === type) {
            thisTab = true;
            selTab = index;
            return false;
        }
    });
    if (thisTab !== true) {
        panelContent.push({
            'title': title,
            'html': '<div id="' + grid + '" class="gridContainer"></div><div id="' + grid + '-context-menu" class="context-menu"></div><div id="' + grid + '-loadpanel"></div>',
            'id': table,
            'type': type,
            'ext_id': ext_id,
            'tHistory': JSON.stringify(tHistory)
        });
        selTab = panelContent.length - 1;
        if (old) {
            selTab = config.selTabs;
        }
    }
    //console.log(panelContent);
    var tabPanel = $("#tabpanel-container").dxTabPanel({
        items: panelContent,
        selectedIndex: selTab,
        repaintChangesOnly: true,
        showNavButtons: true,
        deferRendering:false,
        swipeEnabled:false,
        itemTitleTemplate: function (itemData, itemIndex, element) {
            element.text(itemData.title);
            element.append($("<i>").addClass('dx-icon dx-icon-close').attr('data-tab', itemData.id));
        },
        onSelectionChanged: function (e) {
            config.selTabs = e.component.option("selectedIndex");
            setSettings();
            var currentObj = panelContent[config.selTabs];
            //var url = currentObj.type + '-' + currentObj.id + (currentObj.ext_id ? '-' + currentObj.ext_id : '');
            var url = createUrl(currentObj.type, currentObj.id, currentObj.ext_id, 'tab');
            updateUrl(url);
        },
        onContentReady: function (e) {
            //loadPanel.show();
        }
    }).dxTabPanel("instance");
    if (thisTab !== true) {
        initObject(table, ext_id, view, type, 'sel', tHistory);
        config.tabs = panelContent;
        setSettings();
        //saveSettings();
    }
    //пишем panelContent в пользовательскую инфу
    //config.selTabs = $("#tabpanel-container").dxTabPanel("instance").option("selectedIndex");

}

$(function () {

    //клик по крестику закрывающему таб
    $(document.body).on('click', '#tabpanel .dx-item .dx-item-content .dx-icon-close', function () {
        var closeTab = $(this).attr('data-tab');
        var list = panelContent;
        $.each(list, function (index, value) {
            if (value.id == closeTab) {
                disposeObject(value.id, value.ext_id, 'tabs', value.type);
                list.splice(index, 1);
                return false;
            }
        });


            if (list.length > 0) {
                //console.log(list);
                var tabPanel =  $("#tabpanel-container").dxTabPanel('instance');
                tabPanel.option('items', list);
                //tabPanel.repaint();
                panelContent = list;
                config.tabs = panelContent;

            } else {
                $('#tabpanel').html('<div id="tabpanel-container" class="tabpanel-container"></div>');
                objects = [];
                config.tabs = null;
                //setSettings();
                clearUrl();
            }
        setSettings();
        //saveSettings();
    });

});
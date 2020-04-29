function initDocuments(table, ext_id, view, mode, tHistory) {
    var deferred = new $.Deferred;
    var idn = getIdn(table, ext_id, 'documents', view);
    var grididn = getIdn(table, ext_id, 'grid', view);

    $('#' + idn).prepend('<div id="' + idn + '_file-uploader"></div>');
    $('#' + idn).append('<div id="' + grididn + '" class="gridContainer"></div><div id="' + grididn + '-context-menu" class="context-menu"></div><div id="' + grididn + '-loadpanel"></div>');
    //стартуем окошко загрузки
    openLoadPanel(idn);

    //выводим таблицу
    $.when(initTable(table, ext_id, view, mode, tHistory)).done(function (grid) {
        var params = [];
        var fileUploader = $("#" + idn + "_file-uploader").dxFileUploader({
            multiple: true,
            // accept: "",
            uploadMode: "instantly",
            uploadUrl: "/documents/fileupload?table=" + table + "&params=" + params,
            name: "documentFiles",
            showFileList: false,
            onProgress: function (e) {
                pb.option('value', pb.option('value') + e.component.option('progress'));
            },
            onUploadStarted: function (e) {
                pb.option('visible', true);
            },
            onUploaded: function (e) {
                pb.option('visible', false);
                var filename = $.parseJSON(e.request.response);
                if (filename !== '') {
                    var params = {};
                    params[getColumnByColumnType('file', grid.columns).dataField] = e.file.name;
                    params[getColumnByColumnType('fileurl', grid.columns).dataField] = filename;
                    editRecord(grid.tableInfo, -1, grid.object, grid.type, 'ins', tHistory, table, grid.columns, params);
                    //alert('файл сохранен ' + filename);
                }
            },
        }).dxFileUploader("instance");
        var pbId = idn + '_progressbar';
        $("#" + idn + "_file-uploader").after('<div id="' + pbId + '"/>');
        $("#" + pbId).css('z-index', '100');
        var pb = $('#' + pbId).dxProgressBar({
            min: 0,
            max: 100,
            value: 0,
            visible: false,
            showStatus: false,
            width: "400px",
            maxWidth: "50%",
            elementAttr: {
                class: "dx-loadpanel-content myls-center-screen",
            },
        }).dxProgressBar("instance");
        closeLoadPanel(idn);
        objects[idn] = grid;
        deferred.resolve(objects[idn] );
    }).fail(function (error) {
        closeLoadPanel(idn);
        showError(idn, error);
        deferred.reject();
    });
    return deferred.promise();
}

function disposeDocuments(table, ext_id, type, view) {
    var idn = getIdn(table, ext_id, 'documents', view);
    var grididn = getIdn(table, ext_id, 'grid', view);
    $('#' + grididn).dxDataGrid('dispose');
    $("#" + idn + "_file-uploader").dxFileUploader('dispose');
    filterObjects[table] = null;
}
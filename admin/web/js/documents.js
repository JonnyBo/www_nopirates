class Documents extends MylsObject {

    constructor(table, ext_id, view, mode, tHistory, viewMode, params) {
        super(table, ext_id, view, mode, tHistory, viewMode, params);
        this.type = 'documents';
    }

    async init() {
        super.init();
        this.gridIdn = app.getIdn('grid', this.table, this.ext_id, this.view);
        this.createObject();
        $("#" + this.idn).data('mylsObject', this);
    }

    createObject() {
        $('#' + this.idn).prepend('<div id="' + this.idn + '_file-uploader"></div>');
        $('#' + this.idn).append('<div id="' + this.gridIdn + '" class="gridContainer"></div><div id="' + this.gridIdn + '-context-menu" class="context-menu"></div><div id="' + this.gridIdn + '-loadpanel"></div>');
        this.object = app.getObject(this.table, this.ext_id, this.view, 'grid', this.mode, this.tHistory, this.viewMode, this.params);
        this.object.init();
        const pbId = this.idn + '_progressbar';
        $("#" + this.idn + "_file-uploader").after('<div id="' + pbId + '"/>');
        $("#" + pbId).css('z-index', '100');
        this.createProgressBar(pbId);
        $("#" + this.idn + "_file-uploader").dxFileUploader(this.getOptions()).dxFileUploader('instance');
    }

    createProgressBar(pbId) {
        this.progressBar = $('#' + pbId).dxProgressBar({
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
    }

    getOptions() {
        const self = this;
        let params = [];
        return {
            multiple: true,
            // accept: "",
            uploadMode: "instantly",
            uploadUrl: "/documents/fileupload?table=" + this.table + "&params=" + params,
            name: "documentFiles",
            showFileList: false,
            onProgress: function (e) {
                self.progressBar.option('value', self.progressBar.option('value') + e.component.option('progress'));
            },
            onUploadStarted: function (e) {
                self.progressBar.option('visible', true);
            },
            onUploaded: function (e) {
                self.upload(e);
            },
        }
    }

    async upload(e) {
        this.progressBar.option('visible', false);
        const filename = $.parseJSON(e.request.response);
        if (filename !== '') {
            let params = {};
            params[this.object.columns.getColumnsByColumnType('file', true).dataField] = e.file.name;
            params[this.object.columns.getColumnsByColumnType('fileurl', true).dataField] = filename;
            await this.object.editRecord(-1, this.object.tHistory, 'ins', params);
            //alert('файл сохранен ' + filename);
        }
    }

    destroy() {
        super.destroy();
        $("#" + this.idn).data('mylsObject', null);
        this.progressBar = null;
        this.object = null;
        this.close();
    }

    hasUncommitedData() {
        return this.object.hasUncommitedData();
    }

}
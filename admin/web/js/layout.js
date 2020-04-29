class Layout extends MylsObject {

    constructor(table, ext_id, view, mode, tHistory, viewMode, params) {
        super(table, ext_id, view, mode, tHistory, viewMode, params);
        this.type = 'layout';
    }

    async init() {
        super.init();
        this.template = JSON.parse(this.getTemplate());
        await this.createObject();

    }

    async createObject() {
        const self = this;
        let savedState = await this.sendStorageRequest("storage", "json", "GET", false, this.table, []);
        if (savedState !== null && savedState !== 2) {
            savedState = JSON.parse(savedState);
            this.object = new GoldenLayout(this.getOptions(savedState.content), $('#' + this.idn));
            this.fillConfig(savedState.content, this.object);
        } else {
            this.object = new GoldenLayout(this.getOptions(this.template), $('#' + this.idn));
            this.fillConfig(this.template, this.object);
        }
        this.object.on('stackCreated', function (stack) {
            if (isNaN(stack.config.width) || stack.config.width == 'NaN')
                delete stack.config.width;
        });
        this.object.init();
        resizeSensor.create($('#' + this.idn)[0], () => this.object.updateSize($('#' + this.idn).width(), $('#' + this.idn).height()));
        this.createFramesObjects();
        this.object.on('stateChanged', function () {
            let state = JSON.stringify(self.object.toConfig());
            self.saveCurrentFrames(state);
        });
    }

    getOptions(template) {
        return {
            content: template
        };
    }

    fillConfig(conf) {
        const self = this;
        $.each(conf, function (_, item) {
            if (item && item.type !== 'component') {
                self.fillConfig(item.content);
            }
            if (item && item.hasOwnProperty("type") && item.type == 'component') {
                const column = self.getColumn(item);
                column.idn = app.getIdn(app.appInfo.tables[column.tableId].tableType, column.tableId, self.ext_id, 'layout');
                item.componentState = {label: column.dataField};
                self.object.registerComponent(column.dataField, function (container, state) {
                    container.getElement().html(column.tableId ? app.getObjectContainer(column.idn) : '<div id="' + self.idn + '_' + column.dataField + '" class="h-100"></div>');
                });
            }
        });
    }

    createFramesObjects() {
        const self = this;
        $.each(this.columns.columns, function (i, column) {
            if (column.idn) {
                let object = app.getObject(column.tableId, self.ext_id, 'layout', app.appInfo.tables[column.tableId].tableType, self.mode, self.tHistory);
                object.init();
            }
        });
    }

    getColumn(item) {
        const column = this.columns.columns[item.componentName];
        if (item.hasOwnProperty("isClosable"))
            item.isClosable = item.isClosable == 'true' ? true : false;
        else
            item.isClosable = true;
        item.title = app.translate.saveString(item.title ? item.title : column.caption);
        return column;
    }

    async saveCurrentFrames(state) {
        state = app.replaceAll(state, ',"width":null', '');
        await this.sendStorageRequest("storage", "json", "POST", state, this.table);
        Promise.resolve();
    }

}
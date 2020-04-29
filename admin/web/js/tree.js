class Tree extends Grid {

    constructor(table, ext_id, view, mode, tHistory, viewMode, params) {
        super(table, ext_id, view, mode, tHistory, viewMode, params);
        this.type = 'tree';
    }

    createObject() {
        this.object = $("#" + this.idn).dxTreeList(this.getOptions()).dxTreeList('instance');
    }

    getOptions() {
        let options = super.getOptions();
        options.keyExpr = "id";
        options.parentIdExpr = "parent_id";
        return options;
    }

    async refresh(changesOnly = true, useLoadPanel = true) {
        this.object.refresh();
    }

}
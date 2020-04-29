class HtmlEditor extends MylsObject {

    constructor(table, ext_id, view, mode, tHistory, viewMode, params) {
        super(table, ext_id, view, mode, tHistory, viewMode, params);
        this.type = 'htmleditor';
    }

    async init() {
        super.init();
        this.editorIdn = app.getIdn('htmleditor', this.table, this.ext_id, this.view);
        this.createObject();
        //$("#" + this.idn).data('mylsObject', this);
    }

    createObject() {
        $('#' + this.idn).append('<div id="' + this.editorIdn + '-toolbar"></div><div id="' + this.editorIdn + '-editor" class="gridContainer"></div>');
        this.object = DecoupledEditor
            .create( document.querySelector( '#' + this.editorIdn + '-editor' ) )
            .then( editor => {
                const toolbarContainer = document.querySelector( '#' + this.editorIdn + '-toolbar' );

                toolbarContainer.appendChild( editor.ui.view.toolbar.element );
            } )
            .catch( error => {
                console.error( error );
            } );
    }

}
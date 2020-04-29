class ProgressBar {

    constructor(object) {
        this.mylsObject = object;
    }

    init(max) {
        //const idn = $(this.mylsObject.getElement(element)).attr("id");
        this.pbId = this.mylsObject.idn + '_progressbar';
        $('#' + this.mylsObject.idn).after('<div id="' + this.pbId + '"/>');
        let inProgress = true;
        this.mylsObject.lockObject(true);
        const self = this;
        this.object = $('#' + this.pbId).dxProgressBar({
            min: 0,
            max: max,
            value: 0,
            visible: true,
            showStatus: false,
            width: "400px",
            maxWidth: "50%",
            elementAttr: {
                class: "dx-loadpanel-content myls-center-screen",
            },
            onComplete: function (e) {
                self.mylsObject.lockObject();
                //this.visible = false;
                self.mylsObject.refresh();
                self.remove();
            },

        }).dxProgressBar("instance");
        //return progressBarStatus;
    }

    step() {
        this.object.option('value', this.object.option('value') + 1);
    }

    remove() {
        this.object.dispose();
        $('#' + this.pbId).remove();
    }

    destroy() {
        this.mylsObject = null;
        this.object = null;
    }

}
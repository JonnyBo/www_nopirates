function initProgressBar(max, element, complete) {
    var idn = $(getElement(element)).attr("id");
    var pbId = idn + '_progressbar';
    $('#' + idn).after('<div id="' + pbId + '"/>');
    var inProgress = true;
    lockedObject(element, true);
    var progressBarStatus = $('#' + pbId).dxProgressBar({
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
            lockedObject(element);
            this.visible = false;
            complete();
            removeProgressBar(pbId);
        },

    }).dxProgressBar("instance");
    return progressBarStatus;
}

function stepProgressBar(progressBar) {
    progressBar.option('value', progressBar.option('value') + 1);
}

function removeProgressBar(pbId) {
    $('#' + pbId).dxProgressBar("dispose");
    $('#' + pbId).remove();
}
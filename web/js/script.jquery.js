$(".successMessage").delay(2000).fadeOut(3000);
$(document.body).on("submit", "#testForm", function (e) {
    e.preventDefault();
    var $form = $(this);
    $("#loader").show();
    $("#errorCt").hide();
    $("#resultCt").hide();
    alert('1111111111111111');
    $.ajax({
        //url: "'.CHtml::normalizeUrl(array('test','id'=>$id)).'" + "?ajax=1",
        url: "/project/test?ajax=1&id=200",
        dataType: "json",
        type: $form.attr("method"),
        data: $form.serialize(),
        success: function (data, textStatus, jqXHR) {
            $("#loader").hide();
            if (data.success) {
                $("#resultCt").find("pre").text(data.result);
                $("#resultCt").show();
            }
            else {
                var msg;

                if (data.msg.length)
                    msg = data.msg;
                else {
                    msg = data.errors.join("<br>");
                }
                $("#errorCt").find("pre").text(msg);
                $("#errorCt").show();
            }
        },
        error: function (jqXHR, textStatus, errorThrown) {
            $("#loader").hide();
            var msg = textStatus + ": " + jqXHR.statusText + " " + (jqXHR.responseText ? "(" + jqXHR.responseText + ")" : "");
            $("#errorCt").find("pre").text(msg);
            $("#errorCt").show();

        },
        complete: function (jqXHR, textStatus) {
            $form.attr("id", "projectForm");
            $("#trigger_dropCache").prop("checked", false);
        }
    });
});
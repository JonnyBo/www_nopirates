function initAce(textareaId) {
    var $textarea = $("#"+textareaId),
        editorId = textareaId+"_ace";

    if ($textarea.length) {
        $textarea.hide();
        $textarea.parent().append('<div id="'+editorId+'">'+$textarea.val()+'</div>');

        var editor = ace.edit(editorId);
        editor.setTheme("ace/theme/tomorrow");
        editor.getSession().setMode({path:"ace/mode/php", inline:true});
        //editor.getSession().setMode({path:"ace/mode/html", inline:true});
        $($textarea.closest("form")).submit(function(e){
            $textarea.val(editor.getValue());
        });
    }
}
/*
function testSocial(id) {
    var url = '/web/socials/test';
    $.ajax({
        url: url,
        async: true,
        type: "POST",
        data: {'id':id},
        success: function (data) {
            var res = $.parseJSON(data);
            if (data === false) {
                $('#errorCt').show();
            } else if (data) {
                $('#resultCt').append('<pre>'+data+'</pre>');
                $('#resultCt').show();
            }
        }
    });
}
*/

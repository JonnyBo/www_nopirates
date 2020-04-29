<?php

/* @var $this yii\web\View */
/* @var $name string */
/* @var $message string */
/* @var $exception Exception */

use yii\helpers\Html;

$this->title = $name;
?>
<div id="tabpanel" class="tabpanel">

    <div id="tabpanel-container" class="tabpanel-container">
        <div id="myError"></div>
    </div>

</div>

<div id="popup_error"></div>

<script>
    $(function () {
        var popupError = initConfirmDialog('<?= nl2br(Html::encode($message)) ?>', '<?= $this->title ?>', 'myls-msg-error', 'OK', null);
        $.when(popupError).done(function () {
            window.location.href = '/';
        }).fail(function () {
            window.location.href = '/';
        });
    });
</script>


<?php

/* @var $this yii\web\View */
/* @var $form yii\bootstrap\ActiveForm */
/* @var $model app\models\LoginForm */

use yii\helpers\Html;
use yii\bootstrap\ActiveForm;

$this->title = 'Registration';
$this->params['breadcrumbs'][] = $this->title;
?>
<img src="img/cover.png" class="myls-login-cover" alt="">
<div class="myls-login-form">

    <div class="mylsLoginTitle">
        <div class="mylsIcon d-flex justify-content-center align-items-center" style="background-color: <?=Yii::$app->params['logoColor'];?>">
            <span><?=Yii::$app->params['logoCode'];?></span>
        </div>
        <div class="mylsTitle"  style="color: <?=Yii::$app->params['logoColor'];?>"><?=Yii::$app->params['projectName'];?></div>
    </div>
    <form action="" id="form-container" method="post">
        <input type="hidden" name="company_id"  id="company_id" value="">
        <div id="mylsRegistrationForm"></div>
    </form>
</div>

<script>
    $(function() {
        var message = false;
        if (message) {
            DevExpress.ui.notify({
                message: message,
                position: {
                    my: "center top",
                    at: "center top"
                }
            }, 'error', 3000);
        }
    });
</script>

<?php

/* @var $this yii\web\View */
/* @var $form yii\bootstrap\ActiveForm */
/* @var $model app\models\LoginForm */

use yii\helpers\Html;
use yii\bootstrap\ActiveForm;

$this->title = 'Restore';
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
    <form action="restore" id="form-container" method="post">
        <div id="mylsRestoreForm"></div>
    </form>
</div>


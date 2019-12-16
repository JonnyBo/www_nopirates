<?php
use yii\helpers\Url;
use yii\helpers\Html;
use yii\widgets\ActiveForm;
use app\models\ProjectForm;

//echo Url::base();
$this->title = $id == null ? "Добавление проекта" : "Редактирование проекта";
$this->title = "Редактирование проекта";
//Yii::$app->clientScript->registerScriptFile('/ace/src-min/ace.js', CClientScript::POS_END);
$this->registerJsFile('/ace/src-min/ace.js', ['position' => \yii\web\View::POS_END]);
$this->registerJsFile('/js/script.js', ['position' => \yii\web\View::POS_END]);
//$this->registerJsFile('/js/script.jquery.js', ['position' => \yii\web\View::POS_END]);
$script = <<< JS
    initAce("projectform-code");
JS;
$script1 = '
$(".successMessage").delay(2000).fadeOut(3000);
$(document.body).on("submit", "#testForm", function (e) {
    e.preventDefault();
    var $form = $(this);
    $("#loader").show();
    $("#errorCt").hide();
    $("#resultCt").hide();
    $.ajax({
        url: "/project/test?ajax=1&id='.$id.'",
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
';

$css= <<< CSS

    .successMessage {
        border: 2px solid #0c0;
        padding: 7px 7px 12px 7px;
        margin: 0 0 20px 0;
        background: #efE;
        font-size: 0.9em;
    }
    .successMessage p {
        margin: 0;
        padding: 5px;
    }
    .ace_editor {
        height: 300px;
        margin: 5px 0;
        border: 1px solid #ddf;
    }

CSS;
$this->registerCss($css, ["type" => "text/css"], "myStyles" );
$this->registerJs($script, yii\web\View::POS_READY);
$this->registerJs($script1, yii\web\View::POS_READY);
?>
<h1><?=$this->title?></h1>

<div class="form">

    <?php $form = ActiveForm::begin(['options' => ['class' => 'edit-form', 'id'=>'projectForm']]); ?>

<? /*$form=$this->beginWidget('CActiveForm',array(
    'id'=>'projectForm'
));*/ ?>

<?php //echo $form->errorSummary($model); ?>
<div class="errorSummary" style="<?if(!Yii::$app->session->hasFlash('error')):?>display:none<?endif;?>">
    <p><?=Yii::$app->session->getFlash('error')?></p>
</div>
    
<?if(Yii::$app->session->hasFlash('updated')):?>
<div class="successMessage">
    <p>Проект &laquo;<?=Yii::$app->session->getFlash('updated')->name?>&raquo; успешно обновлен.</p>
</div>     
<?endif;?>
    
<div class="row">
    <?php /*echo $form->labelEx($model,'project_name'); ?>
    <?php echo $form->textField($model,'project_name',array(
        'style'=>'width:100%'
    )); ?>
    <?php echo $form->error($model,'project_name');*/ ?>
    <?= $form->field($model, 'name')->textInput(['maxlength' => 255], ['class' => 'input-modal']) ?>
</div>
    
<div class="row">
    <?php /*echo $form->labelEx($model,'start_url'); ?>
    <?php echo $form->textField($model,'start_url',array(
        'style'=>'width:100%'
    )); ?>
    <?php echo $form->error($model,'start_url');*/ ?>
    <?= $form->field($model, 'url')->textInput(['maxlength' => 255], ['class' => 'input-modal']) ?>
</div>
    
<div class="row">
    <?php /*echo $form->labelEx($model,'code'); ?>
    <?php echo $form->textArea($model,'code',array(
        'rows'=>15, 
        'style'=>'width:100%;'
    )); ?>
    <?php echo $form->error($model,'code');*/ ?>
    <?= $form->field($model, 'code')->textarea(['rows' => 15, 'style' => 'width: 100%']) ?>
</div>
<div class="row buttons clearfix">
    <?php echo Html::submitButton('Тестировать код',array(
        'onclick'=>"this.form.id='testForm';",
        'style'=>'float:right; margin-left: 15px;'
    )); ?>
     <?php echo Html::label('Очистить кеш','trigger_dropCache',array(
        'style'=>'display:inline; float: right; margin-left: 5px;'
    )); ?>
    <?php echo Html::checkBox('dropCache', false, array(
        'id'=>'trigger_dropCache',
        'style'=>'float:right;'
    )) ?>
</div>
    
<div id="loader" style="padding:15px; text-align: center; border:1px solid blue; display:none;">
    Идет обработка теста...
</div>

<fieldset id="errorCt" style="border:1px solid red;<?if(!Yii::$app->session->hasFlash('error')):?>display:none<?endif;?>">
    <legend style="padding: 0 5px;">Ошибка:</legend>
    <pre><?=Yii::$app->session->getFlash('error')?></pre>
</fieldset>

<fieldset id="resultCt" style="border:1px solid black;<?if(!Yii::$app->session->hasFlash('result')):?>display:none<?endif;?>">
    <legend style="padding: 0 5px;">Результат:</legend>
    <pre><?=Yii::$app->session->getFlash('result')?></pre>
</fieldset>    
    
    
<div class="row">
    <?= $form->field($model, 'commited')
        ->checkbox([
            'label' => 'Готов',
            'labelOptions' => [
                'style' => 'display:inline;'
            ],
        ]);
    ?>
</div>
<div class="row">
    <?= $form->field($model, 'run')
        ->checkbox([
            'label' => 'Поставить в очередь на запуск',
            'value' => 1,
            'labelOptions' => [
                'style' => 'display:inline;'
            ],
        ]);
    ?>
    <?/* Html::checkbox('run', false, ['label' => 'Поставить в очередь на запуск', 'value' => 1, 'class' => 'prev-order'])*/ ?>
    <?/* $form->field($model, 'checkbox')
        ->checkbox([
            //'label' => 'Поставить в очередь на запуск',
            'labelOptions' => [
                'style' => 'display:inline;'
            ],
            'disabled' => true
        ]);
*/
    ?>
</div>
<div class="row buttons">
    <?php echo Html::submitButton('Сохранить'); ?>
</div>    
    
<?php ActiveForm::end(); ?>
</div>


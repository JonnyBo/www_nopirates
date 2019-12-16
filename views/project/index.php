<?php

use yii\helpers\Html;
use yii\grid\GridView;
use app\models\ProjectForm;

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

CSS;
$this->registerCss($css, ["type" => "text/css"], "myStyles" );
$this->registerJsFile('/js/script.jquery.js', ['position' => \yii\web\View::POS_READY]);
?>
    <h3>Список проектов</h3>

    <?if(Yii::$app->session->hasFlash('created')):?>
        <div class="successMessage">
            <p>Проект &laquo; <?=Yii::$app->session->getFlash('created')->project_name; ?>&raquo; создан.</p>
        </div>
    <?endif;?>
            <?if(Yii::$app->session->hasFlash('deleted')):?>
                <div class="successMessage">
                    <p>Проект &laquo;
                        <?=Yii::$app->session->getFlash('deleted')->project_name?>&raquo; удален.</p>
                </div>
            <?endif;?>
                    <div class="errorSummary" style="<?if(!Yii::$app->session->hasFlash('error')):?>display:none<?endif;?>">
                        <p>
                            <?=Yii::$app->session->getFlash('error')?>
                        </p>
                    </div>

                    <div>
                        <?= Html::a('Добавить проект', ['project/create'], ['class' => 'project-link']) ?>
                    </div>
                    <?
$columns = array(
    ['class' => 'yii\grid\SerialColumn'],
    array(
        'label'=>$model->getAttributeLabel('project_name'),
        'attribute'=>'name',
    ),
    array(
        'label'=>$model->getAttributeLabel('start_url'),
        'attribute'=>'start_url',
    ),

    array(
        'label'=>$model->getAttributeLabel('commited'),
        'attribute'=>'commited',
        'format'=>'raw',
        'value'=> function($data) {
            return $data["commited"] ? "Да" : "Нет";
        },
        'headerOptions'=>['text-align' => 'center'],
    ),
    array(
        'label'=>$model->getAttributeLabel('run'),
        'attribute'=>'run',
        'format'=>'raw',
        'value'=> function($data) {
            return ProjectForm::getStatus($data["run"]);
        },
        'headerOptions'=>['text-align' => 'center'],
    ),
    array(
        'label'=>'Начало работы',
        'attribute'=>'start_update',
    ),
    array(
        'label'=>'Окончание работы',
        'attribute'=>'last_update',
    ),
    array(
        'label'=>'Осталось',
        'attribute'=>'time_to_finish',
    ),
    /*
    array(
        'class'=>'yii\grid\ActionColumn',
        'template'=>'{update} {delete}',
        'deleteButtonUrl'=>'CHtml::normalizeUrl(array("delete","id"=>$data["PROJECT_ID"]))',
        'buttons' => [
            'update' => function ($url,$model) {
                return Html::a(
                    '<span class="glyphicon glyphicon-screenshot"></span>',
                    $url);
            },
            'delete' => function ($url,$model) {
                return Html::a(
                    '<span class="glyphicon glyphicon-screenshot"></span>',
                    $url);
            },
            'link' => function ($url,$model,$key) {
                return Html::a('Действие', $url);
            },
        ],
    ),
    */
    [
        'class' => 'yii\grid\ActionColumn',
        'header'=>'Действия',
        'headerOptions' => ['width' => '80'],
        'urlCreator'=>function($action, $model, $key, $index){
            return [$action,'id'=>$model['site_id']];
        },
        'template' => '{update} {delete}',
    ],
);

/*
$this->widget('zii.widgets.grid.CGridView', array(
    'dataProvider'=>$dataProvider,
    'template'=>'{items}',
    'columns'=>$columns
));
*/


echo GridView::widget([
    'dataProvider' => $dataProvider, 
    //'template'=>'{items}', 
    'columns' => $columns,
]); 

?>
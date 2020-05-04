<?php

/* @var $this \yii\web\View */
/* @var $content string */

use app\widgets\Alert;
use yii\helpers\Html;
use yii\bootstrap\Nav;
use yii\bootstrap\NavBar;
use yii\widgets\Breadcrumbs;
use app\assets\AppAsset;
use app\assets\MainHeadAsset;
use app\assets\MainEndAsset;

AppAsset::register($this);
MainHeadAsset::register($this);
MainEndAsset::register($this);
?>
<?php $this->beginPage() ?>
<!DOCTYPE html>
<html lang="<?= Yii::$app->language ?>">
<head>
    <meta charset="<?= Yii::$app->charset ?>">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="format-detection" content="telephone=no"/>
    <link href="https://fonts.googleapis.com/css?family=Roboto:400,500,700&display=swap&subset=cyrillic-ext" rel="stylesheet">

    <link rel="apple-touch-icon" sizes="180x180" href="img/favicons/apple-touch-icon.png">
    <link rel="icon" type="image/png" sizes="32x32" href="img/favicons/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="img/favicons/favicon-16x16.png">
    <link rel="manifest" href="img/favicons/site.webmanifest">
    <link rel="mask-icon" href="img/favicons/safari-pinned-tab.svg" color="#5bbad5">
    <link rel="shortcut icon" href="img/favicons/favicon.ico">
    <meta name="msapplication-TileColor" content="#da532c">
    <meta name="msapplication-config" content="img/favicons/browserconfig.xml">
    <meta name="theme-color" content="#ffffff">

    <?php $this->registerCsrfMetaTags() ?>
    <title><?=Yii::$app->params['projectName'];?></title>

    <script>
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
                navigator.serviceWorker.register('sw.js').then(
                    function(registration) {
                        // Registration was successful
                        console.log('ServiceWorker registration successful with scope: ', registration.scope); },
                    function(err) {
                        // registration failed :(
                        console.log('ServiceWorker registration failed: ', err);
                    });
            });
        }
    </script>

    <?php $this->head() ?>
</head>
<body>
<?php $this->beginBody() ?>
<?php
function addHashToFile($file) {
    return YII_ENV_DEV ? $file : $file.'?'.hash_file('md5', $file);
}
/*
$this->registerJsFile('/devExtreme/Lib/js/jquery.min.js', ['position' => \yii\web\View::POS_HEAD]);
$this->registerJsFile('/js/jquery.cookie.js', ['position' => \yii\web\View::POS_HEAD]);
$this->registerJsFile('/js/md5.js', ['position' => \yii\web\View::POS_HEAD]);
$this->registerJsFile('/js/detect.js', ['position' => \yii\web\View::POS_HEAD]);
$this->registerJsFile(addHashToFile('/devExtreme/Lib/js/jszip.min.js'), ['position' => \yii\web\View::POS_HEAD]);
$this->registerJsFile(addHashToFile('/devExtreme/Lib/js/dx.all.js'), ['position' => \yii\web\View::POS_HEAD]);
$this->registerJsFile(addHashToFile('/devExtreme/Lib/js/vectormap-data/world.js'), ['position' => \yii\web\View::POS_HEAD]);
$this->registerJsFile(addHashToFile('/devExtreme/Lib/js/localization/dx.messages.ru.js'), ['position' => \yii\web\View::POS_HEAD]);
$this->registerJsFile(addHashToFile('/js/jquery.color-2.1.2.js'), ['position' => \yii\web\View::POS_HEAD]);
$this->registerJsFile(addHashToFile('/js/spectrum.js'), ['position' => \yii\web\View::POS_HEAD]);
*/
?>
<div class="app-container">
    <div id="toolbar"></div>
    <div id="drawer">
        <div id="content" class="dx-theme-background-color d-flex flex-column">
            <?= $content ?>
        </div>
    </div>
</div>
<div id="tooltip"></div>
<div id="main-loadpanel"></div>
<script>
    var siteName = "<?=Yii::$app->params['projectName'];?>";
    var siteColor = "<?=Yii::$app->params['logoColor'];?>";
    var languages = <?=json_encode(Yii::$app->params['languages']);?>
</script>
<?php $this->endBody() ?>



</body>
</html>
<?php $this->endPage() ?>

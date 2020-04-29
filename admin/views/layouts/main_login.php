<?php

/* @var $this \yii\web\View */

/* @var $content string */

use app\widgets\Alert;
use yii\helpers\Html;
use yii\bootstrap\Nav;
use yii\bootstrap\NavBar;
use yii\widgets\Breadcrumbs;
use app\assets\AppAsset;
use app\assets\AuthHeadAsset;
use app\assets\AuthEndAsset;

AppAsset::register($this);
AuthHeadAsset::register($this);
AuthEndAsset::register($this);
?>
<?php $this->beginPage() ?>
<!DOCTYPE html>
<html lang="<?= Yii::$app->language ?>">
<head>
    <meta charset="<?= Yii::$app->charset ?>">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="apple-touch-icon" sizes="180x180" href="/img/favicons/apple-touch-icon.png">
    <link rel="icon" type="image/png" sizes="32x32" href="/img/favicons/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="/img/favicons/favicon-16x16.png">
    <link rel="manifest" href="/img/favicons/site.webmanifest">
    <link rel="mask-icon" href="/img/favicons/safari-pinned-tab.svg" color="#5bbad5">
    <link rel="shortcut icon" href="/img/favicons/favicon.ico">
    <meta name="msapplication-TileColor" content="#da532c">
    <meta name="msapplication-config" content="/img/favicons/browserconfig.xml">
    <meta name="theme-color" content="#ffffff">
    <?php $this->registerCsrfMetaTags() ?>
    <title><?= Html::encode($this->title) ?></title>

    <script>
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(
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
<body class="myls-login">
<?php $this->beginBody() ?>

<?= $content ?>

<script>
    let siteName = "<?=Yii::$app->params['projectName'];?>";
    let siteColor = "<?=Yii::$app->params['logoColor'];?>";
    let languages = <?=json_encode(Yii::$app->params['languages']);?>
</script>

<script>
    $(function() {
        <?php if( Yii::$app->session->hasFlash('success') ): ?>
        DevExpress.ui.notify({
            message: '<?php echo Yii::$app->session->getFlash('success'); ?>',
            position: {
                my: "center top",
                at: "center top"
            }
        }, 'success', 3000);
        <?php endif;?>
        <?php if( Yii::$app->session->hasFlash('error') ): ?>
        DevExpress.ui.notify({
            message: '<?php echo Yii::$app->session->getFlash('error'); ?>',
            position: {
                my: "center top",
                at: "center top"
            }
        }, 'error', 3000);
        <?php endif;?>
    });
</script>

<?php $this->endBody() ?>
</body>
</html>
<?php $this->endPage() ?>

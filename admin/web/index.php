<?php

error_reporting(E_ERROR);

//$is_dev = strpos($_SERVER['HTTP_HOST'], 'dev.') !== false;
//if ($is_dev){
    defined('YII_DEBUG') or define('YII_DEBUG', true);
    defined('YII_ENV') or define('YII_ENV', 'dev');
//}

require __DIR__ . '/../../../yii2-basic/vendor/autoload.php';//меняем для админки
require __DIR__ . '/../../../yii2-basic/vendor/yiisoft/yii2/Yii.php';//меняем для админки

$config = require __DIR__ . '/../config/web.php';

$domen = current(explode('.', $_SERVER['HTTP_HOST'], 2));
//echo $domen;

if ($_SERVER['HTTP_HOST'] == 'myls.education' or $_SERVER['HTTP_HOST'] == 'www.myls.education') {
    $config = require __DIR__ . '/../config/web.php';
} elseif (strpos($_SERVER['HTTP_HOST'], $domen . '.') !== false) {
    $config = array_replace_recursive($config, require __DIR__ . '/../config/web_' . $domen . '.php');
} /*elseif (strpos($_SERVER['HTTP_HOST'], 'test.') !== false) {
    //$config = require __DIR__ . '/../config/web_test.php';
    $config = array_replace_recursive($config, require __DIR__ . '/../config/web_test.php');
} elseif (strpos($_SERVER['HTTP_HOST'], 'testrus.') !== false) {
    //$config = require __DIR__ . '/../config/web_testrus.php';
    $config = array_replace_recursive($config, require __DIR__ . '/../config/web_testrus.php');
} elseif (strpos($_SERVER['HTTP_HOST'], 'freeda.') !== false) {
    //$config = require __DIR__ . '/../config/web_freeda.php';
    $config = array_replace_recursive($config, require __DIR__ . '/../config/web_freeda.php');
} elseif ($is_dev) {
    $config = array_replace_recursive($config, require __DIR__ . '/../config/web_dev.php');
} elseif (strpos($_SERVER['HTTP_HOST'], 'business.') !== false) {
    $config = array_replace_recursive($config, require __DIR__ . '/../config/web_business.php');
} elseif (strpos($_SERVER['HTTP_HOST'], 'budget.') !== false) {
    //$config = require __DIR__ . '/../config/web_budget.php';
    $config = array_replace_recursive($config, require __DIR__ . '/../config/web_budget.php');
} elseif (strpos($_SERVER['HTTP_HOST'], 'events.') !== false) {
    //$config = require __DIR__ . '/../config/web_events.php';
    $config = array_replace_recursive($config, require __DIR__ . '/../config/web_events.php');
} elseif (strpos($_SERVER['HTTP_HOST'], 'local.') !== false) {
    //$config = require __DIR__ . '/../config/web_local.php';
    $config = array_replace_recursive($config, require __DIR__ . '/../config/web_local.php');
} elseif (strpos($_SERVER['HTTP_HOST'], 'fd.') !== false) {
    //$config = require __DIR__ . '/../config/web_local.php';
    $config = array_replace_recursive($config, require __DIR__ . '/../config/web_fd.php');
} elseif (strpos($_SERVER['HTTP_HOST'], 'nopirates.') !== false) {
    //$config = require __DIR__ . '/../config/web_local.php';
    $config = array_replace_recursive($config, require __DIR__ . '/../config/web_nopirates.php');
}
*/


(new yii\web\Application($config))->run();

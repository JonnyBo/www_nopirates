<?php

$params = require __DIR__ . '/params.php';
$db = require __DIR__ . '/db.php';

//Yii::setAlias('vendor', dirname(dirname(dirname(__DIR__))) . '/yii2-basic');

$config = [
    'id' => 'basic-console',
    'basePath' => dirname(__DIR__),
    'vendorPath' => dirname(dirname(__DIR__)) . '/yii2-basic/vendor',
    'bootstrap' => ['log'],
    'controllerNamespace' => 'app\commands',
    'aliases' => [
        '@bower' => dirname(dirname(__DIR__)) . '/yii2-basic/vendor/bower-asset',
        '@npm' => dirname(dirname(__DIR__)) . '/yii2-basic/vendor/npm-asset',
    ],
    'components' => [
        'cache' => [
            'class' => 'yii\caching\FileCache',
        ],
        'log' => [
            //'traceLevel' => YII_DEBUG ? 3 : 0,
            'targets' => [
                [
                    'class' => 'yii\log\FileTarget',
                    'levels' => ['error', 'warning'],
                    //'logVars' => ['_GET', '_POST'],
                    'except' => ['yii\db\*', 'yii\web\*', 'yii\base\*'],
                ],
                [
                    'class' => 'yii\log\FileTarget', //в файл
                    'categories' => ['dev_log'], //категория логов
                    'logFile' => '@runtime/logs/dev.log', //куда сохранять
                    'logVars' => [] //не добавлять в лог глобальные переменные ($_SERVER, $_SESSION...)
                ],
            ],
        ],
        'siteLoader' =>[
            'class'=>'app\components\SiteLoader'
        ],
        'saver' =>[
            'class'=>'app\components\Saver'
        ],
        'db' => $db,
    ],
    'params' => $params,
    /*
    'controllerMap' => [
        'fixture' => [ // Fixture generation command line.
            'class' => 'yii\faker\FixtureController',
        ],
    ],
    */
];

if (YII_ENV_DEV) {
    // configuration adjustments for 'dev' environment
    $config['bootstrap'][] = 'gii';
    $config['modules']['gii'] = [
        'class' => 'yii\gii\Module',
    ];
}

return $config;

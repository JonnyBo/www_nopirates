<?php

$params = require __DIR__ . '/params.php';

return [
    'id' => 'basic',
    'basePath' => dirname(__DIR__),
    'vendorPath' => dirname(dirname(__DIR__)) . '/yii2-basic/vendor',
    'bootstrap' => ['log'],
    'aliases' => [
        '@bower' => dirname(dirname(__DIR__)) . '/yii2-basic/vendor/bower-asset',
        '@npm' => dirname(dirname(__DIR__)) . '/yii2-basic/vendor/npm-asset',
    ],

    'components' => [
        'sitefunctions' => [
            'class' => 'app\components\SiteFunctions'
        ],
        'xmlparser' => [
            'class' => 'app\components\XmlParser',
        ],
        'session' => [
            'class' => 'yii\web\CacheSession',
        ],
        'request' => [
            // !!! insert a secret key in the following (if it is empty) - this is required by cookie validation
            'cookieValidationKey' => 'SYvKEBTZ2K0fyaJnghquU7eB4DPcLqUl',
            'enableCsrfValidation' => false,
            'enableCookieValidation' => false,
        ],
        'cache' => [
            'class' => 'yii\caching\FileCache',
            'cachePath' => dirname(__DIR__) . '/runtime/cache/test'
        ],
        'user' => [
            'identityClass' => 'app\models\User',
            'enableAutoLogin' => true,
        ],
        'errorHandler' => [
            'errorAction' => 'site/error',
        ],
        'mailer' => [
            'class' => 'yii\swiftmailer\Mailer',
            // send all mails to a file by default. You have to set
            // 'useFileTransport' to false and configure a transport
            // for the mailer to send real emails.
            'useFileTransport' => true,
        ],
        'xmlReader' => [
            'class' => 'Sabre\Xml\Reader',
        ],
        'xmlWriter' => [
            'class' => 'Sabre\Xml\Writer',
        ],
        'log' => [
            'traceLevel' => YII_DEBUG ? 3 : 0,
            'targets' => [
                [
                    'class' => 'yii\log\FileTarget',
                    'levels' => ['error', 'warning'],
                ],
            ],
        ],
        'assetManager' => [
            'bundles' => [
                'yii\web\JqueryAsset' => [
                    'js' => []
                ],
                /*
                'yii\bootstrap\BootstrapPluginAsset' => [
                    'js'=>[]
                ],
                'yii\bootstrap\BootstrapAsset' => [
                    'css' => [],
                ],
                */
            ],
        ],
        'db' => [
            'class' => 'edgardmessias\db\firebird\Connection',
            'dsn' => 'firebird:dbname=138.201.19.133/53051:c:\dbs\MYLS_EVENTS_TABLER.FDB;charset=utf8',
            'username' => 'admin',
            'password' => 'ybvlf14njh',
            'charset' => 'utf8',
            'attributes' => [PDO::ATTR_PERSISTENT => true]
        ],
        'datadb' => [
            'class' => 'edgardmessias\db\firebird\Connection',
            'dsn' => 'firebird:dbname=138.201.19.133/53051:c:\dbs\MYLS_EVENTS.FDB;charset=utf8',
            'username' => 'admin',
            'password' => 'ybvlf14njh',
            'charset' => 'utf8',
            'attributes' => [PDO::ATTR_PERSISTENT => true]
        ],
        'urlManager' => [
            'enablePrettyUrl' => true,
            'showScriptName' => false,
            'rules' => [
            ],
        ],
    ],
    'params' => $params,
];


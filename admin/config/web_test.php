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
        'request' => [
            // !!! insert a secret key in the following (if it is empty) - this is required by cookie validation
            'cookieValidationKey' => 'SYvKEBTZ2K0fyaJnghquU7eB4DPcLqUl',
            'enableCsrfValidation' => false,
            'enableCookieValidation' => false,
        ],
        'session' => [
            'class' => 'yii\web\CacheSession',
        ],
        /*'cache' => [
            'class' => 'yii\caching\FileCache',
            'cachePath' => dirname(__DIR__) . '/runtime/cache/dev'
        ],*/
        'cache' => [
            'class' => 'yii\caching\ApcCache',
            'keyPrefix' => 'test', // уникальный префикс ключей кэша
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
            'useFileTransport' => true,
        ],
        'xmlReader' => [
            'class' => 'Sabre\Xml\Reader',
        ],
        'xmlWriter' => [
            'class' => 'Sabre\Xml\Writer',
        ],
        /*'log' => [
            'traceLevel' => YII_DEBUG ? 3 : 0,
            'targets' => [
                [
                    'class' => 'yii\log\FileTarget',
                    'levels' => ['error'],
                ],
            ],
        ],*/
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
        'urlManager' => [
            'enablePrettyUrl' => true,
            'showScriptName' => false,
            'rules' => [
            ],
        ],
        'db' => [
            'class' => 'edgardmessias\db\firebird\Connection',
            'dsn' => 'firebird:dbname=138.201.19.133/53051:c:\dbs\SCHOOL_TABLER_test.FDB;charset=utf8',
            //'dsn' => 'firebird:dbname=138.201.19.133/53051:c:\dbs\MYLS_SCHOOL_TABLER_dev.FDB;charset=utf8',
            'username' => 'admin',
            'password' => 'ybvlf14njh',
            'charset' => 'utf8',
            'attributes' => [PDO::ATTR_PERSISTENT => true]
        ],
        'datadb' => [
            'class' => 'edgardmessias\db\firebird\Connection',
            'dsn' => 'firebird:dbname=138.201.19.133/53051:c:\dbs\MYLS_SCHOOL_test.FDB;charset=utf8',
            //'dsn' => 'firebird:dbname=138.201.19.133/53051:c:\dbs\MYLS_SCHOOL_dev.FDB;charset=utf8',
            'username' => 'admin',
            'password' => 'ybvlf14njh',
            'charset' => 'utf8',
            'attributes' => [PDO::ATTR_PERSISTENT => true]
        ],
    ],
    'params' => $params,
];


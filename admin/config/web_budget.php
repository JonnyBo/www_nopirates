<?php

$params = [
    'adminEmail' => 'admin@example.com',
    'projectName' => 'Myls.budget',
    'logoCode' => 'Bu',
    'logoColor' => '#AD77E0',
    'languages' => [
        ['name' => 'English', 'code' => 'en', 'icon' => '', 'default' => true],
        ['name' => 'Русский', 'code' => 'ru', 'icon' => '', 'default' => false],
        // ['name' => 'Español', 'code' => 'es', 'icon' => '', 'default' => false],
    ]
];

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
        'session' => [
            'class' => 'yii\web\CacheSession',
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
        'cache' => [
            'class' => 'yii\caching\FileCache',
            'cachePath' => dirname(__DIR__) . '/runtime/cache/dev'
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
            'dsn' => 'firebird:dbname=138.201.19.133/53051:c:\dbs\MYLS_BUDGET_TABLER.FDB;charset=utf8',
            'username' => 'admin',
            'password' => 'ybvlf14njh',
            'charset' => 'utf8',
            'attributes' => [PDO::ATTR_PERSISTENT => true]
        ],
        'datadb' => [
            'class' => 'edgardmessias\db\firebird\Connection',
            'dsn' => 'firebird:dbname=138.201.19.133/53051:c:\dbs\MYLS_BUDGET.FDB;charset=utf8',
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


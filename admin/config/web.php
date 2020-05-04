<?php

$params = require __DIR__ . '/params.php';
$db = require __DIR__ . '/db.php';
$datadb = require __DIR__ . '/datadb.php';
$config = [
    'id' => 'basic',
    'basePath' => dirname(__DIR__),
    //'baseUrl' => '/admin',
    'vendorPath' => dirname(dirname(dirname(__DIR__))) . '/yii2-basic/vendor',
    'bootstrap' => ['log'],
    //'bootstrap' => ['AssetsMinify'],
    'aliases' => [
        '@bower' => dirname(dirname(dirname(__DIR__))) . '/yii2-basic/vendor/bower-asset',
        '@npm' => dirname(dirname(dirname(__DIR__))) . '/yii2-basic/vendor/npm-asset',
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
            //'baseUrl' => '/admin/',
            'cookieValidationKey' => 'SYvKEBTZ2K0fyaJnghquU7eB4DPcLqUl',
            'enableCsrfValidation' => false,
            'enableCookieValidation' => false,
        ],
        'session' => [
            'class' => 'yii\web\CacheSession',
        ],
        'cache' => [
            'class' => 'yii\caching\ApcCache',
            //'keyPrefix' => $_COOKIE['PHPSESSID'], // уникальный префикс ключей кэша
        ],
        'user' => [
            'identityClass' => 'app\models\User',
            'enableAutoLogin' => true,
        ],
        'errorHandler' => [
            'errorAction' => 'site/error',
            'maxSourceLines' => 2,
        ],
        'mailer' => [
            'class' => 'yii\swiftmailer\Mailer',
            // send all mails to a file by default. You have to set
            // 'useFileTransport' to false and configure a transport
            // for the mailer to send real emails.
            'useFileTransport' => false,
            'messageConfig' => [
                'from' => ['registration@myls.education' => 'Myls.Registration'],
            ],
            'transport' => [
                'class' => 'Swift_SmtpTransport',
                'host' => 'myls.education',
                'username' => 'registration@myls.education',
                'password' => 'DPneqsg3uvuQgzE6',
                'port' => '587',
                'encryption' => 'tls',
            ],
        ],
        'xmlReader' => [
            'class' => 'Sabre\Xml\Reader',
        ],
        'xmlWriter' => [
            'class' => 'Sabre\Xml\Writer',
        ],
        'html2pdf' => [
            'class' => 'yii2tech\html2pdf\Manager',
            'viewPath' => '@app/pdf',
            'converter' => [
                'class' => 'yii2tech\html2pdf\converters\Wkhtmltopdf',
                'defaultOptions' => [
                    'pageSize' => 'A4'
                ],
            ]
        ],
        'log' => [
            'traceLevel' => YII_DEBUG ? 3 : 0,
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
        'AssetsMinify' => [
            'class' => '\soladiem\autoMinify\AssetsMinify',
            'enabled' => false,
            'htmlCompress' => false,
            'cssFileBottom' => false,
            'jsFileCompress' => true,
            'jsFileCompile' => true,
            'jsMinifyHtml' => false,
            'pathCompileCssFile' => 'css/minify',
            'pathCompileJsFile' => 'js/minify',
        ],
        'assetManager' => [
            'linkAssets' => true,
            'appendTimestamp' => true,
            'bundles' => [
                'yii\web\JqueryAsset' => [
                    'js' => []
                ],
            ],
        ],
        'userdb' => [
            'class' => 'yii\db\Connection',
            'dsn' => 'mysql:host=localhost;dbname=myls',
            'username' => 'root',
            'password' => '',
            'charset' => 'utf8',
            ],
        'db' => $db,
        'datadb' => $datadb,
        'urlManager' => [
            'enablePrettyUrl' => true,
            'showScriptName' => false,
            'baseUrl' => '/admin',
            'rules' => [

            ],
        ],
    ],

    'params' => $params,
];


if (YII_ENV_DEV) {
    // configuration adjustments for 'dev' environment
    $config['bootstrap'][] = 'debug';
    $config['modules']['debug'] = [
        'class' => 'yii\debug\Module',
        // uncomment the following to add your IP if you are not connecting from localhost.
       // 'allowedIPs' => ['109.60.197.89', '91.77.205.26', '::1', '37.223.205.92'],
    ];

    $config['bootstrap'][] = 'gii';
    $config['modules']['gii'] = [
        'class' => 'yii\gii\Module',
        // uncomment the following to add your IP if you are not connecting from localhost.
       // 'allowedIPs' => ['109.60.197.89', '91.77.205.26', '::1'],
    ];
}

return $config;

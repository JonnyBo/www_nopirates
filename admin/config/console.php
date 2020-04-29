<?php

$params = require __DIR__ . '/params.php';
$db = require __DIR__ . '/db.php';

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
        'mailer' => [
            'class' => 'yii\swiftmailer\Mailer',
            // send all mails to a file by default. You have to set
            // 'useFileTransport' to false and configure a transport
            // for the mailer to send real emails.
            'useFileTransport' => false,
            'messageConfig' => [
                'from' => ['registration@myls.education' => 'myls'],
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
        'mailer_notifications' => [
             'class' => 'yii\swiftmailer\Mailer',
             // send all mails to a file by default. You have to set
             // 'useFileTransport' to false and configure a transport
             // for the mailer to send real emails.
             'useFileTransport' => false,
             'messageConfig' => [
                 'from' => ['notifications@myls.education' => 'Myls.Notifications'],
             ],
             'transport' => [
                 'class' => 'Swift_SmtpTransport',
                 'host' => 'myls.education',
                 'username' => 'notifications@myls.education',
                 'password' => 'qnZDvYL0E4GQiLkI',
                 'port' => '587',
                 'encryption' => 'tls',
             ],
         ],
        'log' => [
            'targets' => [
                [
                    'class' => 'yii\log\FileTarget',
                    'levels' => ['error', 'warning'],
                ],
            ],
        ],
        'db' => $db,
        'datadb' => $datadb,
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

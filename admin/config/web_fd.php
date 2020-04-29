<?php

$params = require __DIR__ . '/params.php';

return [
    'components' => [
        'db' => [
            'class' => 'edgardmessias\db\firebird\Connection',
            //'dsn' => 'firebird:dbname=138.201.19.133/53051:c:\dbs\myls_fd_TABLER.FDB;charset=utf8',
            'dsn' => 'firebird:dbname=d:\dbs\film_distribution.FDB;charset=utf8',
            'username' => 'SYSDBA',
            'password' => 'masterkey',
            //'username' => 'admin',
            //'password' => 'ybvlf14njh',
            'charset' => 'utf8',
            'attributes' => [PDO::ATTR_PERSISTENT => true]
        ],
        'datadb' => [
            'class' => 'edgardmessias\db\firebird\Connection',
            //'dsn' => 'firebird:dbname=138.201.19.133/53051:c:\dbs\film_distribution.FDB;charset=utf8',
            'dsn' => 'firebird:dbname=d:\dbs\MYLS_fd_TABLER_dev.FDB;charset=utf8',
            'username' => 'SYSDBA',
            'password' => 'masterkey',
            //'username' => 'admin',
            //'password' => 'ybvlf14njh',
            'charset' => 'utf8',
            'attributes' => [PDO::ATTR_PERSISTENT => true]
        ],
    ],
    'params' => $params,
];


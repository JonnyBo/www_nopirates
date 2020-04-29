<?php
$dsn = 'firebird:dbname=138.201.19.133/53051:c:\dbs\MYLS_EVENTS.FDB;charset=utf8';
$username = 'admin';
$password = 'ybvlf14njh';
$host = '138.201.19.133/53051:c:\dbs\MYLS_EVENTS.FDB';
$opt = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];


function event_handler($event_name, $link)
{
    print_r($event_name);
}

$dbh = ibase_connect($host, $username, $password, 'utf8');
print_r($dbh);

ibase_set_event_handler($dbh, "event_handler", "NEW_ORDER", "DB_SHUTDOWN");

/*
$query = "select p_scheduler_id,
p_program_name,
p_start_date,
p_end_date,
p_platform_name,
p_list_persons
from get_site_event_program(3)";
$p_sql = ibase_prepare($dbh, $query);
$result = ibase_execute($p_sql);
//$result = ibase_query($dbh, $stmt);
$row = ibase_fetch_assoc($result);
print_r($row);
*/
?>
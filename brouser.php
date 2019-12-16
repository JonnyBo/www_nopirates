<?php

/**
 * @author admin
 * @copyright 2019
 */
require_once dirname(__FILE__).'/classes/Snoopy.class.php';

//include ("./Snoopy.class.php");
$snoopy = new Snoopy;
$snoopy->agent = "Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1)";
$snoopy->referer = "http://inclouds.ru/";
/*
$snoopy->cookies["SessionID"] = '238472834723489';
$snoopy->cookies["favoriteColor"] = "blue";
$snoopy->rawheaders["Pragma"] = "no-cache";
$submit_url = "http://php.ru/forum/login.php";
$submit_vars["username"] = "user"; //Ћогин
$submit_vars["password"] = "123123"; //ѕароль
$submit_vars["autologin"] = "off";
$submit_vars["redirect"] = "";
$submit_vars["login"] = "¬ход";
$snoopy->submit($submit_url,$submit_vars);
*/

$links = $snoopy->fetchlinks("http://inclouds.ru/");




print_r($links);



?>
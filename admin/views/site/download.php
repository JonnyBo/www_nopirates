<?php
// заставляем браузер показать окно сохранения файла
if (!$error) {
    // заставляем браузер показать окно сохранения файла
    header('Content-Description: File Transfer');
    header('Content-Type: application/octet-stream');
    header('Content-Disposition: attachment; filename=' . $filename);
    header('Content-Transfer-Encoding: binary');
    header('Expires: 0');
    header('Cache-Control: must-revalidate');
    header('Pragma: public');
    header('Content-Length: ' . filesize($filelink));
    // читаем файл и отправляем его пользователю
    readfile($filelink);
    exit;
} else {
    header('Content-Type: text/html; charset=utf-8');
    echo $error;
}
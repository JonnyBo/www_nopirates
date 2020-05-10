<?php
$search_string_charset = 'utf-8';
$site_charset = 'utf-8';
$url = 'https://exfilms.net/';
$cookie_file_name = 'exfilms.net' . 'txt';
$result_block = '.shortstory';
$link_block = 'a.btl+a';
$title_block = 'a.btl+a';
$is_title_in_attr = false;
$title_attr = 'title';
$data = [];
foreach ($searches as $object_id => $search) {
    foreach ($search as $search_string) {
        // Строка для примера поиска
        //$search_string = 'Заклятье';
        $search_string = str_replace('"', '', $search_string);


        $params = array(
            'do' => 'search',
            'subaction' => 'search',
            // Если строка поиска должна быть в кодировке UTF-8
            'story' => $search_string_charset == 'utf-8' ? $search_string : iconv('utf-8', 'windows-1251', $search_string),
            'titleonly' => 3
        );

        $post_data = http_build_query($params);
        // Отображение передаваемых параметров для отладки
        //echo $post_data."\n";
        $headers = array('Referer: ' . $url, 'Origin: ' . $url, 'application/x-www-form-urlencoded');

        // Тут надо регуляркой вырезать только чистый урл, чтобы не подставлять руками
        $result = $loader->sendCurl($url, $headers, $cookie_file_name, $post_data);

        // Если сам сайт необходимо переконвертить из windows-1251
        if ($site_charset != 'utf-8')
            $result = iconv('windows-1251', 'utf-8', $result);

        // Блок для отладки
        //echo $result;
        //return;

        phpQuery::newDocument($result);


        foreach (pq($result_block) as $rrr) {
            $link = pq($rrr)->find($link_block)->attr('href');

            if ($is_title_in_attr)
                $title = pq($rrr)->find($title_block)->attr($title_attr);
            else
                $title = pq($rrr)->find($title_block)->text();

            if ($link)
                $data[$link] = array('title' => trim($title), 'link' => $link, 'object_id' => $object_id);
        }

    }
}
$this->saveResults($data);
// Для отладки
//print_r($data);

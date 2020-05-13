<?php
$search_string_charset = 'utf-8';
$site_charset = 'utf-8';
$url = $loader->codeBaseURL;
$is_get = false;
$cookie_file_name = parse_url($url, PHP_URL_HOST) . 'txt';
$data = [];

foreach ($searches as $object_id => $search) {
    foreach ($search as $search_string) {
        $search_string = str_replace('"', '', $search_string);
        // Сохраняем оригинальную строку поиска на случай, если будет преобразование кодировок
        $original_search_string = strtolower(trim($search_string));

        // Если строка поиска не в кодировке UTF-8, то преобразовываем ее
        $search_string = ($search_string_charset == 'utf-8' ? $search_string : iconv('utf-8', $search_string_charset, $search_string));

        $cur_url = $url;

        // Параметры для POST или GET запросов
        if (!$is_get) {
            $params = array(
                'do' => 'search',
                'subaction' => 'search',
                'story' => $search_string,
                'titleonly' => 3
            );
            $post_data = http_build_query($params);
        } else {
            $post_data = null;
            $cur_url = $url . '?do=search&subaction=search&titleonly=3&story=' . urlencode($search_string);
        }

        // Заголовки
        $headers = array('Referer: ' . $url, 'Origin: ' . $url, 'Content-Type: application/x-www-form-urlencoded');

        // Получение страницы данных
        $result = $loader->sendCurl($cur_url, $headers, $cookie_file_name, $post_data);

        if ($result) {
            // Если страница не в кодировке UTF-8, то преобразовываем ее
            if ($site_charset != 'utf-8')
                $result = iconv($site_charset, 'utf-8', $result);

            phpQuery::newDocument($result);

            // Проходим по всем ссылкам на странице в рамках #dle-content
            foreach (pq('#dle-content a') as $link) {
                // Получаем title либо из текста ссылки, либо из атрибута title
                $title = trim((trim(pq($link)->text()) ? pq($link)->text() : pq($link)->attr('title')));
                // Преобразовываем объектт link в ссылку
                $link = pq($link)->attr('href');

                // Если ссылка не содержит имени сайта, то добавляем его
                if ($link[0] == '/')
                    $link = $loader->codeBaseURL . substr($link, 1);

                // Если в title содержится наша поисковая строка, то сохраняем эту ссылку
                if (mb_stripos($title, $original_search_string) !== false) {
                    $data[$link] = array('title' => trim($title), 'link' => $link, 'object_id' => $object_id);
                }
            }
        }

    }
}
//$this->saveResults($data);
// Для отладки
print_r($data);

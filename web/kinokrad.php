<?php

/**
 * @author JonnyBo
 * @copyright 2019
 */
function sendCurl($url, $headers, $cookie, $post_data) {
    $curl = curl_init();
    //$headers = array('Referer: https://kinokrad.co/index.php','Origin: https://kinokrad.co','Content-Type: application/x-www-form-urlencoded');
    curl_setopt($curl, CURLOPT_URL, $url);
    curl_setopt($curl, CURLOPT_HEADER, false);
    curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, false);
    curl_setopt($curl, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.8.1.13) Gecko/20080311 Firefox/2.0.0.13');
    curl_setopt($curl, CURLOPT_RETURNTRANSFER,1);
    curl_setopt($curl ,CURLOPT_HTTPHEADER,$headers);
    if ($post_data) {
        curl_setopt($curl, CURLOPT_POST, true);
        curl_setopt($curl, CURLOPT_POSTFIELDS, $post_data);
    }
    curl_setopt($curl, CURLOPT_FOLLOWLOCATION, 1);
    curl_setopt($curl, CURLOPT_CONNECTTIMEOUT, 30);
    curl_setopt($curl, CURLOPT_COOKIEJAR, dirname(__FILE__).'/' . $cookie);
    curl_setopt($curl, CURLOPT_COOKIEFILE, dirname(__FILE__).'/' . $cookie);
    $out = curl_exec($curl);
    $info = curl_getinfo($curl);
    curl_close($curl);
    return $out;
}
if (!empty($objects)) {
    $data = $ddd = array();
    foreach($objects as $object) {
        $tituls = [$object->title];
        if ($object->year_prod)
            $tituls[] = $object->title . ' ' . $object->year_prod;
        if ($object->director)
            $tituls[] = $object->title . ' ' . $object->director;
        foreach($tituls as $tt) { 
            $url = 'https://kinokrad.co/index.php?do=search';
            //$url = 'https://kinokrad.co/';
            $search = 'рожденный после смерти';
            $params = array(
                'do'            => 'search',
                'subaction'     => 'search',
                'search_start'  => 0,
                'full_search'   => 0,
                'result_from'   => 1,
                'story'         => $tt
            );
            $post_data = http_build_query($params);
            //echo $post_data;
            //$curl = curl_init();
            $headers = array('Referer: https://kinokrad.co/index.php','Origin: https://kinokrad.co','Content-Type: application/x-www-form-urlencoded');
            /*
            curl_setopt($curl, CURLOPT_URL, $url);
            curl_setopt($curl, CURLOPT_HEADER, false);
            curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, false);
            curl_setopt($curl, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.8.1.13) Gecko/20080311 Firefox/2.0.0.13');
            curl_setopt($curl, CURLOPT_RETURNTRANSFER,1);
            curl_setopt($curl ,CURLOPT_HTTPHEADER,$headers);
            curl_setopt($curl, CURLOPT_POST, true);
            curl_setopt($curl, CURLOPT_POSTFIELDS, $post_data);
            curl_setopt($curl, CURLOPT_FOLLOWLOCATION, 1);
            curl_setopt($curl, CURLOPT_CONNECTTIMEOUT, 30);
            curl_setopt($curl, CURLOPT_COOKIEJAR, dirname(__FILE__).'/kinokrad.co.txt');
            curl_setopt($curl, CURLOPT_COOKIEFILE, dirname(__FILE__).'/kinokrad.co.txt');
            $out = curl_exec($curl);
            $info = curl_getinfo($curl);
            curl_close($curl);
            */
            //$result = iconv('windows-1251','utf-8',$out);
            $result = sendCurl($url, $headers, 'kinokrad.co.txt', $post_data);
            $rrr = array();
            
            //echo $result;
            
            phpQuery::newDocument($result);
            
            foreach(pq('.searchitem') as $rrr) {
                //$title = pq($rrr)->find('h3')->text();
                $link = pq($rrr)->find('h3 a')->attr('href');
                //preg_match('#\((.*?)\)#', $title, $match);
                $ddd[] = $link;
            }
            $ddd = array_unique($ddd);
            if (!empty($ddd)) {
                foreach($ddd as $dd) {
                    $result1 = sendCurl($dd, $headers, 'kinokrad.co.txt', false);
                    phpQuery::newDocument($result1);
                    $film = pq('#dle-content');
                    $title = $film->find('h1')->text();
                    if ($film->find('.janrfall li span')->text() == 'Год') {
                        $year = $film->find('.janrfall li')->text();
                    }
                    if ($film->find('.janrfall li span')->text() == 'Режиссёр') {
                        $director = $film->find('.janrfall li')->text();
                    }
                    if ($film->find('.janrfall li span')->text() == 'Продолжительность') {
                        $direct = $film->find('.janrfall li')->text();
                    }
                    $data = array('title' => $title, 'year' => $year, 'director' => $director, 'direct' => $direct);
                }
            }
        }
    }   
print_r($data);
}
?>
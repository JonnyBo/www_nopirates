<?php
//require_once dirname(__FILE__).'/classes/Odnoklassniki.php';
require_once dirname(__FILE__).'/vendor/autoload.php';

//use alxmsl\Odnoklassniki\OAuth2\Client;
use alxmsl\Odnoklassniki\OAuth2\Response\Token;
//use alxmsl\Odnoklassniki\OAuth2\Response\Token;
use alxmsl\Odnoklassniki\API\Client;



$client_id = '1278744576';
$application_key = 'CBAJBJDNEBABABABA';
$client_secret = '206FB71778FCD301315E42A6';
$redirect_url = 'http://nopirates/ok.php';

$access_token = 'tkn1srGyamH3QsSioqekYRih6Z8lNndafLmPTnK82t9Nq6wJ5C6NreYRiglD1ptvou9r6';
$secret_session_key = '34374c9feb904ebc4d2feadf63921cbd';

$search = 'велотачки';

$secret_key = MD5($access_token.$client_secret);

$sig = MD5('application_key='.$application_key.'format=jsonmethod=search.tagContentsquery='.$search.$secret_key);

$url = 'https://api.ok.ru/fb.do?application_key='.$application_key.'&format=json&method=search.tagContents&query='.urlencode($search).'&sig='.$sig.'&access_token='.$access_token;

$Token = new Token();
$Token->setAccessToken($access_token)->setRefreshToken($secret_session_key)->setTokenType(Token::TYPE_SESSION);

$Client = new Client();
$Client->setApplicationKey($application_key)->setToken($Token)->setClientId($client_id)->setClientSecret($client_secret)->setRedirectUri($redirect_url);
$params = [
    'query' => $search,
    'count' => 100,
    'context' => 'VIDEO',
    'types' => 'VIDEO',
    'fields' => 'video.*',
    'filter' => '{"typesss": ["USER_VIDEO", "GROUP_VIDEO"]}',
];

$Result = $Client->call('search.quick', $params);
if (!empty($Result->entities->videos)) {
        //array_push($out, array_values($result['response']['items']));
        foreach ($Result->entities->videos as $rr) {
            $out[] = $rr;
        }
        $pages = ceil((int)$Result->totalCount/100);
        $anchor = $Result->anchor;
        //echo $pages;
        for ($i = 0; $i < $pages; $i++) {
            sleep(1);
            $params['anchor'] = $anchor;
            $Result1 = $Client->call('search.quick', $params);
            if ($Result1->anchor != $anchor) {
                $anchor = $Result1->anchor;
            }
            if (!empty($Result1->entities->videos)) {
                //array_push($out, array_values($res['response']['items']));
                foreach ($Result1->entities->videos as $rr1) {
                    $out[] = $rr1;
                }
            }
        }
}
if (!empty($out)) {
    for ($j = 0; $j < count($out); $j++) {
        if (mb_stripos($out[$j]->title, $search) !== false) {
            //if (preg_match("/\b$search\b/i", $out[$j]['title'])) {
                //echo $out[$j]->title.' - '.$j.' - ' . (int)($out[$j]['duration'] / 60) .'мин. <br />';
                //unset($out[$j]);
        } else {
            unset($out[$j]);
        }
    }
}
	echo 'Результат: '.$search.'<br />';
	echo '<pre>';
	print_r($out);
	echo '</pre>';



?>
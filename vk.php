<?php
/*
require_once dirname(__FILE__).'/SocialAuth/autoload.php';
// конфигурация настроек адаптера
$vkAdapterConfig = array(
    'client_id'     => '6983714',
    'client_secret' => '24qKeZpx3jcg70A5VCQh',
    'redirect_uri'  => 'http://nopirates/vk.php'
);

// создание адаптера и передача настроек
$vkAdapter = new SocialAuther\Adapter\Vk($vkAdapterConfig);

// передача адаптера в SocialAuther
$auther = new SocialAuther\SocialAuther($vkAdapter);

// аутентификация и вывод данных пользователя или вывод ссылки для аутентификации
if (!isset($_GET['code'])) {
	echo '<p><a href="' . $auther->getAuthUrl() . '">Аутентификация через ВКонтакте</a></p>';
} else {
	if ($auther->authenticate()) {
		if (!is_null($auther->getSocialId()))
			echo "Социальный ID пользователя: " . $auther->getSocialId() . '<br />';
		
		if (!is_null($auther->getName()))
			echo "Имя пользователя: " . $auther->getName() . '<br />';
		
		if (!is_null($auther->getEmail()))
			echo "Email пользователя: " . $auther->getEmail() . '<br />';
		
		if (!is_null($auther->getSocialPage()))
			echo "Ссылка на профиль пользователя: " . $auther->getSocialPage() . '<br />';

		if (!is_null($auther->getSex()))
			echo "Пол пользователя: " . $auther->getSex() . '<br />';

		if (!is_null($auther->getBirthday()))
			echo "День Рождения: " . $auther->getBirthday() . '<br />';

		// аватар пользователя 
		if (!is_null($auther->getAvatar()))
			echo '<img src="' . $auther->getAvatar() . '" />'; echo "<br />";
	}
}
*/
/*
require_once dirname(__FILE__).'/classes/VkPhpSdk.php';
require_once dirname(__FILE__).'/classes/Oauth2Proxy.php';
// Init OAuth 2.0 proxy
$oauth2Proxy = new Oauth2Proxy(
    '6983714', // client id
    '24qKeZpx3jcg70A5VCQh', // client secret
    'https://oauth.vk.com/access_token', // access token url
    'https://oauth.vk.com/authorize', // dialog uri
    'code', // response type
    'http://nopirates/vk.php', // redirect url
	'offline,notify,friends,photos,audio,video,wall' // scope
);
// Try to authorize client
if($oauth2Proxy->authorize() === true)
{
	// Init vk.com SDK
	$vkPhpSdk = new VkPhpSdk();
	$vkPhpSdk->setAccessToken($oauth2Proxy->getAccessToken());
	$vkPhpSdk->setUserId($oauth2Proxy->getUserId());
	// API call - get profile

    $offset = 0;
    $out = [];
    $search = 'велотачки';//'ван гоги';
    $params = [
        'filters' => 'long',
        'extended' => 0,
        'count' => 200,
        'offset' => 0,
        'v' => 5.95,
        'q' => $search,
       // 'longer' => 4200 //5280
    ];
    $result = $vkPhpSdk->api('video.search', $params);

    if (!empty($result['response']['items'])) {
        //array_push($out, array_values($result['response']['items']));
        foreach ($result['response']['items'] as $rr) {
            $out[] = $rr;
        }
        $pages = ceil($result['response']['count']/200);
        for ($i = 1; $i < $pages; $i++) {
            sleep(1);
            $params['offset'] = 200*$i;
            $res = $vkPhpSdk->api('video.search', $params);
            if (!empty($res['response']['items'])) {
                //array_push($out, array_values($res['response']['items']));
                foreach ($res['response']['items'] as $rr) {
                    $out[] = $rr;
                }
            }
        }
    }
    if (!empty($out)) {
        for ($j = 0; $j < count($out); $j++) {
            //if (strstr($out[$j]['title'], $search) !== false) {
            $r = stripos($out[$j]['title'], $search);
            if (mb_stripos($out[$j]['title'], $search) !== false) {
            //if (preg_match("/\b$search\b/i", $out[$j]['title'])) {
                echo $out[$j]['title'].' - '.$j.' - ' . (int)($out[$j]['duration'] / 60) .'мин. <br />';
                //unset($out[$j]);
            } else {
               // unset($out[$j]);
            }
        }
    }
	echo 'Результат: '.$params['q'].'<br />';
	echo '<pre>';
	print_r($out);
	echo '</pre>';

}
else
	echo 'Error occurred';
*/

$search = 'Рожденный после смерти';//'ван гоги';
    $params = [
        'filters' => 'long',
        'extended' => 0,
        'count' => 200,
        'offset' => 0,
        //'v' => 5.95,
        'q' => $search,
       // 'longer' => 4200 //5280
    ];
/*    
require_once dirname(__FILE__).'/vendor/autoload.php';

use \VK\Client\VKApiClient;
use \VK\OAuth\VKOAuth;
use \VK\OAuth\VKOAuthDisplay;
use \VK\OAuth\Scopes\VKOAuthUserScope;
use \VK\OAuth\VKOAuthResponseType;
*/

session_start();

//$oauth = new VKOAuth('5.103');
$client_id = 6983714;
$redirect_uri = 'http://nopirates/vk.php'; 
$display = VKOAuthDisplay::POPUP;
$scope = array(VKOAuthUserScope::WALL, VKOAuthUserScope::GROUPS, VKOAuthUserScope::VIDEO);
$state = '24qKeZpx3jcg70A5VCQh';
$code = 'CODE';

//$browser_url = $oauth->getAuthorizeUrl(VKOAuthResponseType::CODE, $client_id, $redirect_uri, $display, $scope, $state);

//$response = $oauth->getAccessToken($client_id, $state, $redirect_uri, $code);
//print_r($response);
//$access_token = $response['access_token'];
/*
$access_token = '29295190688c535ebeb45c68b1e29b5fa8b57940b969cef7608f371f54a1e394292fd68d669c121d757b2';

$vk = new VK\Client\VKApiClient();
$videos = $vk->video()->search($access_token, $params);
print_r($videos);
*/



//$client_id = '1234567';
//$redirect_uri = 'http://localhost';
$display = 'page';
$scope = 'wall,groups,video';
$response_type = 'code';
$auth_uri = "https://oauth.vk.com/authorize?client_id={$client_id}&display={$display}&
redirect_uri={$redirect_uri}&scope={$scope}&response_type={$response_type}&v=5.52";
header('Location: ' . $auth_uri);
if(isset($_GET['code'])){
    $code = $_GET['code'];
    $acces_uri = "https://oauth.vk.com/access_token";
    $fields = array(
        'client_id' => $client_id,
        'client_secret' => $state,
        'redirect_uri' => $redirect_uri,
        'code' => $code
    );
    $acces_uri .= "?client_id={$fields['client_id']}&";
    $acces_uri .= "client_secret={$fields['client_secret']}&";
    $acces_uri .= "redirect_uri={$fields['redirect_uri']}&";
    $acces_uri .= "code={$fields['code']}";
    $res = file_get_contents($acces_uri);
    $response_string = json_decode($res,true);
    $_SESSION['token'] = $response_string['access_token'];
}
print_r($_SESSION);

?>
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
require_once dirname(dirname(__FILE__)).'/vendor/autoload.php';

use \VK\Client\VKApiClient;
use \VK\OAuth\VKOAuth;
use \VK\OAuth\VKOAuthDisplay;
use \VK\OAuth\Scopes\VKOAuthUserScope;
use \VK\OAuth\VKOAuthResponseType;

$oauth = new VKOAuth('5.101');
$client_id = '6983714';
$redirect_uri = 'http://nopirates/vk.php'; 
$display = VKOAuthDisplay::POPUP;
//$scope = array(VKOAuthUserScope::WALL, VKOAuthUserScope::VIDEO, VKOAuthUserScope::OFFLINE, VKOAuthUserScope::NOTIFY, VKOAuthUserScope::FRIENDS, VKOAuthUserScope::PHOTOS, VKOAuthUserScope::AUDIO);
$scope = array(VKOAuthUserScope::VIDEO);
$state = '24qKeZpx3jcg70A5VCQh';
$code = 'CODE';
//'offline,notify,friends,photos,audio,video,wall'
/*
if (!isset($_GET['code'])) {
    if ($browser_url = $oauth->getAuthorizeUrl(VKOAuthResponseType::CODE, $client_id, $redirect_uri, $display, $scope, $state))
        header('Location:'.$browser_url);
	
} else {
    $code = $_GET['code'];
    try {
        $response = $oauth->getAccessToken($client_id, $state, $redirect_uri, $code);
    } catch (VKClientException $e) {
        die($e->getMessage());
    } catch (VKOAuthException $e) {
        die($e->getMessage());
    }
    $access_token = $response['access_token'];
    echo $access_token;
}
*/
$access_token = 'b650621ee7202556f5b354e1268487fdde6ecaca00b896d67fbbc0f059a9d9c8eb730ae11137af493668f';
//$browser_url = $oauth->getAuthorizeUrl(VKOAuthResponseType::CODE, $client_id, $redirect_uri, $display, $scope, $state);

//$response = $oauth->getAccessToken($client_id, $state, $redirect_uri, $code);
//$access_token = $response['access_token'];

//$access_token = '3399f74e3399f74e3399f74efd33f3676c333993399f74e6f434a7d2423cb1fcd058ff8';

$vk = new \VK\Client\VKApiClient();
$videos = $vk->video()->search($access_token, $params);
print_r($videos);


?>
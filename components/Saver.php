<?php
namespace app\components;

use app\controllers\SocialsController;
use app\models\Objects;
use Yii;
use yii\base\Component;

use \VK\OAuth\VKOAuth;
use \VK\OAuth\VKOAuthDisplay;
use \VK\OAuth\Scopes\VKOAuthUserScope;
use \VK\OAuth\VKOAuthResponseType;


//require_once dirname(__DIR__).'/vendor/autoload.php';
use alxmsl\Odnoklassniki\OAuth2\Response\Token;
use alxmsl\Odnoklassniki\API\Client;

/**
 * Description of AfishaSaver
 *
 * @author Vladislav Holovko <vlad.holovko@gmail.com>
 */
class Saver extends Component {
    
    public $db;
    public $connectionId = 'db';
    public $projectId;
	public $canPutToday = true;
    public $startToday;
    public $endToday;
	public $i = 0;
    
    public function init() {
        parent::init();
        if (null === Yii::$app->db) {
            throw new CException("Can't load database component");
        }
		$this->i = 0;
    }
    
    
    /* Получаем преобразованную дату в формат ГГГГ-ММ-ДД */

    public function getDate($sdate) {
        return (string) date('Y-m-d', strtotime($sdate));
    }

    private function getObject($objects, $object_id) {
        foreach($objects as $obj) {
            if ($obj->object_id == $object_id) {
                return $obj;
                break;
            }
        }
    }

    public function getProjectData($code, $test = false, $social = false, $element = false) {
        set_time_limit(0);
        require_once dirname(__DIR__).'/classes/VkPhpSdk.php';
        require_once dirname(__DIR__).'/classes/Oauth2Proxy.php';
        $code = preg_replace("/^\<\?(php)?\s*\n/",'',$code);
        $loader = Yii::$app->siteLoader;
        $objects = Objects::find()->where('current_date between coalesce(start_date, current_date) and coalesce(end_date, current_date)')->all();
        $searches = $loader->getSearchStrings($objects);

        if ($social) {
            //$session = Yii::$app->session;
            $vk = $element;
            //$access_token = $session['token'];
            if ($social == 'ok') {
                $Client = $element;
            }
        }

        if (!empty($searches)) {
            $data = [];
            if (!$social)
                include Yii::$app->basePath . '/extensions/phpQuery/phpQuery.php';
            ob_start();
            //Yii::$app->session->close();
            $ret = eval($code);
            //Yii::$app->session->open();
            $result = ob_get_clean();
            //ob_get_clean();
            if (false === $ret) {
                if ($test)
                    Yii::$app->session->setFlash('error', 'Ошибка синтаксиса');
                throw new \Exception('Ошибка синтаксиса');
            } else {
                //сохраняем данные
                //Yii::info($data, 'dev_log');
                if (!empty($data)) {
                    if ($social ) {
                        $out = [];
                        foreach ($data as $res) {
                            if ($social == 'ok') {
                                $out[] = ['object_id' => $res->object_id, 'link' => $res->permalink, 'title' => $res->title];

                                //$this->saveResult($res->object_id, $res->permalink, $res->title);
                            } else {
                                $url = $this->clearVKLink($res['player']);
                                $out[] = ['object_id' => $res['object_id'], 'link' => $url, 'title' => $res['title']];
                            }
                        }
                        //Yii::info($out, 'dev_log');
                        $data = $out;
                    }
                    $this->saveResults($data);
                }
                if ($test)
                    Yii::$app->session->setFlash('result', $result);
            }
        }
    }

    /**
     * @return string
     */
    public function saveResults($data) {
        $db = Yii::$app->db;
        foreach ($data as $datum) {
            if ($datum['object_id'] && $datum['link']) {
                $params = [':object_id' => $datum['object_id'], ':url' => $datum['link'], ':title' => $datum['title']];
                //print_r($params);
                $db->createCommand('execute procedure PUT_URL(:object_id, :url, :title)', $params)->execute();
            }
        }
    }

    public function sentEmail($email, $info, $tpl = false, $files = [])
    {
        if (!$tpl)
            $tpl = 'first-html';

        $result = Yii::$app->mailer->compose([
            'html' => $tpl,
            //'text' => $tpl
        ], $info);

        if (!empty($files)) {
            //$finfo = finfo_open(FILEINFO_MIME_TYPE);
            foreach ($files as $file) {
                //$path_info = pathinfo($file);
                $filePath = Yii::$app->basePath . '/admin/web/files/';
                if (file_exists($filePath . $file['link'])) {
                    $content_file = file_get_contents($filePath . $file['link']);
                    //$type =  $finfo->buffer($content_file);
                    $result->attachContent($content_file, [
                        'fileName' => $file['document_name'],
                        //'contentType' => $type
                    ]);
                }
            }

        }
        $result->setFrom(['legal@antipirates.ru']);
        $result->setTo($email);
        $result->setBcc(['legal@antipirates.ru']);
        $result->setSubject('Сообщение от правообладателя');
        $result->send();

        if (!$result) {
            //Yii::$app->session->setFlash('error','Sending error.');
            return false;
            //throw new \RuntimeException('Sending error.');
        } else {
            //Yii::$app->session->setFlash('result', $result);
            return true;
        }
    }

    public function clearVKLink($link) {
        //$link = str_replace("&amp;", "&", $link);
        list($url_part, $qs_part) = array_pad(explode("?", $link), 2, "");
        parse_str($qs_part, $qs_vars);
        unset($qs_vars['__ref']);
        unset($qs_vars['api_hash']);
        if (count($qs_vars) > 0) {
            $url = $url_part."?".http_build_query($qs_vars); // Собираем URL обратно
            //$url = str_replace("&", "&amp;", $url);
        } else {
            $url = $url_part;
        }
        return $url;
    }
}

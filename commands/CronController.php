<?php
/**
 * @link http://www.yiiframework.com/
 * @copyright Copyright (c) 2008 Yii Software LLC
 * @license http://www.yiiframework.com/license/
 */

namespace app\commands;

use app\controllers\FunctionController;
use app\controllers\SocialsController;
use app\models\Objects;
use app\models\ProjectForm;
use app\models\ProjectAdmin;
use app\models\SocialsForm;
use yii\console\Controller;
use yii\console\ExitCode;
use Yii;
use yii\di\ServiceLocator;
use yii\caching\FileCache;

use \VK\Client\VKApiClient;
use \VK\OAuth\VKOAuth;
use \VK\OAuth\VKOAuthDisplay;
use \VK\OAuth\Scopes\VKOAuthUserScope;
use \VK\OAuth\VKOAuthResponseType;


//require_once dirname(__DIR__).'/vendor/autoload.php';
use alxmsl\Odnoklassniki\OAuth2\Response\Token;
use alxmsl\Odnoklassniki\API\Client;

/**
 * This command echoes the first argument that you have entered.
 *
 * This command is provided as an example for you to learn how to create console commands.
 *
 * @author Qiang Xue <qiang.xue@gmail.com>
 * @since 2.0
 */
class CronController extends Controller
{

    public function actionIndex()
    {
        set_time_limit(0);
        $db = Yii::$app->db;
        $sql = 'select site_id, code, url from GET_NEXT_SITE(:cnt)';
        $params = [':cnt' => 3];
        $project = $db->createCommand($sql, $params)->queryOne();
        if ($project) {
            $loader = Yii::$app->siteLoader;
            $saver = Yii::$app->saver;
            $loader->codeBaseURL = $project['url'];
            if ($project['site_id'])
                $loader->cacheFilePrefix = $project['site_id'] . '_';
            $cacheDir = Yii::$app->basePath.'/'.$loader->cacheDir;
            $loader->options = array(
                CURLOPT_FOLLOWLOCATION => 1,
                CURLOPT_COOKIEJAR => $cacheDir.'/cookie'.$project['site_id'].'.txt',
                CURLOPT_COOKIEFILE => $cacheDir.'/cookie'.$project['site_id'].'.txt',
            );

            if (false !== $data = $loader->getSiteContent($project['url'], false)) {
                //выполняем поиск по сайту
                $start_date = date('Y-m-d H:i:s');
                $error = null;
                try {
                    if ($project['code']) {
                        $saver->getProjectData($project['code'], false);
                    }
                } catch (\Exception $exc) {
                    $error = $exc->getMessage();
                }
                //после загрузки
                $sql = 'execute procedure finish_site_load(:site_id, :start_date, :end_date, :error);';
                $params = [':site_id' => $project['site_id'], ':start_date' => $start_date, ':end_date' => date('Y-m-d H:i:s'), ':error' => $error];
                $db->createCommand($sql, $params)->execute();
            }
        }
    }

    public function actionSocial() {
        set_time_limit(0);
        $db = Yii::$app->db;
        $socials = SocialsForm::findAll([1919, 1920]);
        foreach ($socials as $social) {
            $element = false;
            $error = null;
            $start_date = date('Y-m-d H:i:s');
            if ($social->social_type == 'vk') {
                $element = SocialsController::vkAuthorisation($social);
            }
            if ($social->social_type == 'ok') {
                $element = SocialsController::okAuthorisation($social);
            }
            if ($element) {
                $loader = Yii::$app->siteLoader;
                $saver = Yii::$app->saver;
                try {
                    if ($social->code) {
                        $saver->getProjectData($social->code, false, $social->social_type, $element);
                    }
                } catch (\Exception $exc) {
                    $error = $exc->getMessage();
                }
            }
            //после загрузки
            $sql = 'execute procedure finish_site_load(:site_id, :start_date, :end_date, :error);';
            $params = [':site_id' => $social['site_id'], ':start_date' => $start_date, ':end_date' => date('Y-m-d H:i:s'), ':error' => $error];
            $db->createCommand($sql, $params)->execute();
        }
    }

    public function actionStart() {
        $sql = 'execute procedure start_queue';
        Yii::$app->db->createCommand($sql)->execute();
    }

}

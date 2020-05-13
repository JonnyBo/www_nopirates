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
                //$element = SocialsController::okAuthorisation($social);
            }
            //Yii::info($element, 'dev_log');
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

    public function actionSend() {
        set_time_limit(0);
        $db = Yii::$app->db;
        //$email = 'evgen-borisov@yandex.ru';
        //$email = ['alexeyparallel@gmail.com', /*'evgen-borisov@yandex.ru', 'evgeny.e.borisov@gmail.com', 'legal@antipirates.ru'*/];
        try {
            $sql = 'select object_id from get_objects_by_status(:status_id)';
            $params = [':status_id' => 4];
            $objects = $db->createCommand($sql, $params)->queryAll();
            if (!empty($objects)) {
                $saver = Yii::$app->saver;
                foreach ($objects as $obj) {
                    $sql = 'select mail_text, title, original_title from get_object_first_mail_text(:object_id)';
                    $params = [':object_id' => $obj['object_id']];
                    $text_mail = '';
                    if ($mail = $db->createCommand($sql, $params)->queryOne()) {
                        //print_r($mail);
                        $text_mail = str_replace('{title}', $mail['title'], $mail['mail_text']);
                        $text_mail = str_replace('{original_title}', $mail['original_title'], $text_mail);
                        $sql = 'select doc_name, doc_link from get_documents_by_object(:object_id)';
                        $documents = $db->createCommand($sql, $params)->queryAll();
                        $files = [];
                        if (!empty($documents)) {
                            foreach ($documents as $doc) {
                                $files[] = $doc;
                            }
                        }
                        $email = [];
                        $sql = 'select site_id, email from get_sites_email(:object_id, :status_id)';
                        $params[':status_id'] = 4;
                        $sites = $db->createCommand($sql, $params)->queryAll();
                        if (!empty($sites)) {
                            foreach ($sites as $site) {
                                $email = [];
                                if ($site['email']) {
                                    $arrMail = explode(',', $site['email']);
                                    if ($arrMail) {
                                        foreach ($arrMail as $fmail) {
                                            $email[] = trim($fmail);
                                        }
                                        //$email = [$site['email']];
                                        $sql = 'select url from get_links_by_object_and_status(:object_id, :status_id, :site_id)';
                                        $params[':site_id'] = $site['site_id'];
                                        $links = $db->createCommand($sql, $params)->queryAll();
                                        $text_links = '';
                                        if (!empty($links)) {
                                            foreach ($links as $link) {
                                                $text_links .= '<br /><a href="' . $link['url'] . '">' . $link['url'] . '</a> ';
                                            }
                                        }
                                        $info = ['message' => $text_mail, 'links' => $text_links];
                                        if (count($files) > 0) {
                                            if ($saver->sentEmail($email, $info, $tpl = false, $files)) {
                                                sleep(1);
                                                printf("отправлено письмо: %s, объект - %s, сайт - %s, документов - %s, ссылок - %s \t\n", implode(', ', $email), $mail['title'], $site['site_id'], count($files), count($links));
                                                $sql = 'execute procedure set_objects_first_email(:object_id, :site_id, :status_id)';
                                                $db->createCommand($sql, $params)->execute();
                                            } else {
                                                //printf('<p>ОШИБКА! не отправлено письмо: объект - %s, сайт - %s</p>', $obj['object_id'], $site['site_id']);
                                            }

                                        }
                                    }
                                }
                            }
                        }

                    }
                }
            }
        } catch (\Exception $e) {
            echo $e->getMessage();
        }
    }

}

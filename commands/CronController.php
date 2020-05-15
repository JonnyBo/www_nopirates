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
        $time = time();
        $db = Yii::$app->db;
        $next_sql = 'select site_id, code, url from GET_NEXT_SITE(:cnt)';
        $next_params = [':cnt' => 6];
        $transaction = $db->beginTransaction();
        $project = $db->createCommand($next_sql, $next_params)->queryOne();
        $transaction->commit();
        $has_error = false;
        while ($project['site_id']) {
            $loader = Yii::$app->siteLoader;
            $saver = Yii::$app->saver;
            $loader->codeBaseURL = $project['url'];
            if ($project['site_id'])
                $loader->cacheFilePrefix = $project['site_id'] . '_';
            $cacheDir = Yii::$app->basePath . '/' . $loader->cacheDir;
            $loader->options = array(
                CURLOPT_FOLLOWLOCATION => 1,
                CURLOPT_COOKIEJAR => $cacheDir . '/cookie' . $project['site_id'] . '.txt',
                CURLOPT_COOKIEFILE => $cacheDir . '/cookie' . $project['site_id'] . '.txt',
            );

            $start_date = date('Y-m-d H:i:s');
            if (false !== $data = $loader->getSiteContent($project['url'], false)) {
                //выполняем поиск по сайту
                $error = null;
                try {
                    if ($project['code']) {
                        $saver->getProjectData($project['code'], $project['site_id'], false);
                    }
                } catch (\Exception $exc) {
                    $error = $exc->getMessage();
                    $has_error = true;
                }
                $params = [':site_id' => $project['site_id'], ':start_date' => $start_date, ':end_date' => date('Y-m-d H:i:s'), ':error' => $error];
            } else {
                $params = [':site_id' => $project['site_id'], ':start_date' => $start_date, ':end_date' => date('Y-m-d H:i:s'), ':error' => 'Ошибка загрузки страницы'];
                $has_error = true;
            }

            //после загрузки
            $params[':cron_id'] = $time;
            $sql = 'execute procedure finish_site_load(:site_id, :start_date, :end_date, :error, :cron_id);';
            $db->createCommand($sql, $params)->execute();

            $project = null;
            // Зацикливаем загрузку до тех пор, пока вся очередь не закончится.
            // Необходимо, чтобы не тратилось зря время на ожидание и работало несколько процессов
            if (!$has_error) {
                $transaction = $db->beginTransaction();
                $project = $db->createCommand($next_sql, $next_params)->queryOne();
                $transaction->commit();
            }
        }
    }

    public function actionSocial()
    {
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
                        $saver->getProjectData($social->code, $social->site_id, false, $social->social_type, $element);
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

    public function actionStart()
    {
        $sql = 'execute procedure start_queue';
        Yii::$app->db->createCommand($sql)->execute();
    }

    public function actionSend()
    {
        set_time_limit(0);
        $db = Yii::$app->db;
        //$email = 'evgen-borisov@yandex.ru';
        //$email = ['alexeyparallel@gmail.com', /*'evgen-borisov@yandex.ru', 'evgeny.e.borisov@gmail.com', 'legal@antipirates.ru'*/];
        try {
            $sql = 'select site_id, email from get_sites_email(:status_id)';
            $params = [':status_id' => 4];
            $sites = $db->createCommand($sql, $params)->queryAll();
            if (!empty($sites)) {
                $saver = Yii::$app->saver;
                foreach ($sites as $site) {
                    $text_mail = '';
                    $sql = 'select object_id, mail_text, title, original_title, links from get_objects_by_status(:status_id, :site_id)';
                    $params[':site_id'] = $site['site_id'];
                    $objects = $db->createCommand($sql, $params)->queryAll();
                    if (!empty($objects)) {
                        $titles = '';
                        foreach ($objects as $obj) {
                            $titles .= '«<strong>' . $obj['title'] . '</strong>»' . ' (<i>оригинальное название «' . $obj['original_title'] . '»</i>)<br/>' . $obj['links'] . '<br/><br/>';
                        }
                        $text_mail = str_replace('{title}', $titles, $obj['mail_text']);
                        $email = [];
                        if ($site['email']) {
                            $arrMail = explode(',', $site['email']);
                            if ($arrMail) {
                                foreach ($arrMail as $fmail) {
                                    $email[] = trim($fmail);
                                }
                            }
                            $sql = 'select distinct document_name, link from get_documents_by_site(:status_id, :site_id)';
                            $documents = $db->createCommand($sql, $params)->queryAll();
                            $files = [];
                            if (!empty($documents)) {
                                foreach ($documents as $doc) {
                                    $files[] = $doc;
                                }
                            }
                            $info = ['message' => $text_mail];
                            if (count($files) > 0) {
                                //printf("отправлено письмо: %s, сайт - %s, документов - %s \t\n", implode(', ', $email), $site['site_id'], count($files));

                                if ($saver->sentEmail($email, $info, $tpl = false, $files)) {
                                    sleep(1);
                                    //printf("отправлено письмо: %s, объект - %s, сайт - %s, документов - %s \t\n", implode(', ', $email), $obj['title'], $site['site_id'], count($files));
                                    $sql = 'execute procedure set_objects_first_email(:site_id, :status_id)';
                                    $db->createCommand($sql, $params)->execute();
                                } else {
                                    //printf('<p>ОШИБКА! не отправлено письмо: объект - %s, сайт - %s</p>', $obj['object_id'], $site['site_id']);
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

<?php
/**
 * @link http://www.yiiframework.com/
 * @copyright Copyright (c) 2008 Yii Software LLC
 * @license http://www.yiiframework.com/license/
 */

namespace app\commands;

use app\controllers\FunctionController;
use app\models\Objects;
use app\models\ProjectForm;
use app\models\User;
use yii\console\Controller;
use yii\console\ExitCode;
use Yii;
use yii\di\ServiceLocator;
use yii\caching\FileCache;

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
        $sql = 'select site_id, code from GET_NEXT_SITE(:cnt)';
        $params = [':cnt' => 3];
        $project = $db->createCommand($sql, $params)->queryOne();
        if ($project) {
            //выполняем поиск по сайту
            try {
                if ($project->code) {
                    //echo $data;
                    //exit();
                    $form->code = preg_replace("/^\<\?(php)?\s*\n/",'',$form->code);
                    $objects = Objects::find()->where('current_date between coalesce(start_date, current_date) and coalesce(end_date, current_date)')->all();
                    //echo Yii::$app->basePath.'/extensions/phpQuery/phpQuery.php';
                    $searchs = $loader->getSearchStrings($objects);
                    if (!empty($searchs)) {
                        $data = [];
                        include Yii::$app->basePath . '/extensions/phpQuery/phpQuery.php';
                        ob_start();
                        Yii::$app->session->close();
                        $ret = eval($form->code);
                        Yii::$app->session->open();
                        $result = ob_get_clean();
                        if (false === $ret) {
                            Yii::$app->session->setFlash('error', 'Ошибка синтаксиса');
                        } else {
                            //сохраняем данные
                            if (!empty($data)) {
                                foreach ($data as $res) {
                                    $this->saveResult($res['object_id'], $res['url']);
                                }
                            }
                            Yii::$app->session->setFlash('result', $result);
                        }
                    }
                }
            } catch (ErrorException $exc) {
                Yii::$app->session->setFlash('error',$exc->getTraceAsString());
            }
            //после загрузки
            $sql = 'execute procedure finish_site_load(:site_id)';
            $params = [':site_id' => $project['site_id']];
            $db->createCommand($sql, $params)->execute();
        }
    }

    public function actionStart() {
        $sql = 'execute procedure start_queue';
        Yii::$app->db->createCommand($sql)->execute();
    }

}

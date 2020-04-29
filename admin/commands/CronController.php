<?php
/**
 * @link http://www.yiiframework.com/
 * @copyright Copyright (c) 2008 Yii Software LLC
 * @license http://www.yiiframework.com/license/
 */

namespace app\commands;

use app\controllers\FunctionController;
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

    use FunctionController;

    public $site;

    public $procedure;

    public function options($actionID)
    {
        return ['site', 'procedure'];
    }

    public function optionAliases()
    {
        return ['s' => 'site', 'p' => 'procedure'];
    }

    public function actionIndex()
    {
        if ($this->site) {
            $dev_config = require __DIR__ . '/../config/web_' . $this->site . '.php';
            Yii::$app->set('db', $dev_config['components']['db']);
            Yii::$app->set('datadb', $dev_config['components']['datadb']);
        }
        $sql = 'execute procedure ' . $this->procedure;
        $result = Yii::$app->datadb->createCommand($sql)->execute();
        $this->sendNotificationEmails();
    }

    public function actionMail()
    {
        if ($this->site) {
            $dev_config = require __DIR__ . '/../config/web_' . $this->site . '.php';
            Yii::$app->set('db', $dev_config['components']['db']);
            Yii::$app->set('datadb', $dev_config['components']['datadb']);
        }
        //$sql = 'select current_date from rdb$database';
        //$result = Yii::$app->db->createCommand($sql)->queryOne();
        //print_r(Yii::$app->db);
        $text = 'example text';
        $user = User::findIdentity(23);
        //print_r($user);
        $user->sendNotification($text);
    }

    private function sendNotificationEmails()
    {
        $transaction = Yii::$app->datadb->beginTransaction();
        $result = Yii::$app->datadb->createCommand('select email, text, name from get_email_notifications')->queryAll();
        $transaction->commit();

        if ($result && count($result)) {
            foreach ($result as $notification) {
                $message = $notification['text'] . '<br>';
                $name = $notification['name'];
                $email = $notification['email'];
                $sent = Yii::$app->mailer_notifications
                    ->compose(
                        ['html' => 'user-notification-html'],
                        ['message' => $message,
                            'name' => $name])
                    ->setTo($email)
                    //->setFrom(Yii::$app->params['adminEmail'])
                    ->setSubject('Новые уведомления')
                    ->send();

                if (!$sent) {
                    throw new \RuntimeException('Sending error.');
                }
            }
        }
    }

    public function actionClearpdf() {
        $dir = Yii::getAlias('@runtime') . '/html2pdf';
        $fileSystemIterator = new \FilesystemIterator($dir);
        $now = time();
        foreach ($fileSystemIterator as $file) {
            if ($now - $file->getCTime() >= 60 * 60 * 24 * 1) // 1 day
                unlink($dir . '/' . $file->getFilename());
        }
    }
}

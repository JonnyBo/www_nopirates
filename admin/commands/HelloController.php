<?php
/**
 * @link http://www.yiiframework.com/
 * @copyright Copyright (c) 2008 Yii Software LLC
 * @license http://www.yiiframework.com/license/
 */

namespace app\commands;

use yii\console\Controller;
use yii\console\ExitCode;

/**
 * This command echoes the first argument that you have entered.
 *
 * This command is provided as an example for you to learn how to create console commands.
 *
 * @author Qiang Xue <qiang.xue@gmail.com>
 * @since 2.0
 */
class HelloController extends Controller
{

    public $message;

    public $text;

    public function options($actionID)
    {
        return ['message', 'text'];
    }

    public function optionAliases()
    {
        return ['m' => 'message', 't' => 'text'];
    }

    public function actionIndex()
    {
        echo $this->message . $this->text . "\n";
    }
}

<?php
/**
 * @link http://www.yiiframework.com/
 * @copyright Copyright (c) 2008 Yii Software LLC
 * @license http://www.yiiframework.com/license/
 */

namespace app\assets;

use yii\web\AssetBundle;

/**
 * Main application asset bundle.
 *
 * @author Qiang Xue <qiang.xue@gmail.com>
 * @since 2.0
 */
class AppAsset extends AssetBundle
{
    public $basePath = '@webroot';
    public $baseUrl = '@web';
    public $css = [
        'devExtreme/Lib/css/dx.common.css',
        'devExtreme/Lib/css/dx.softblue.css',
        'font-awesome/css/font-awesome.min.css',
    ];
    public $js = [
        'devExtreme/Lib/js/jquery.min.js',
        'js/jquery.cookie.js',
        'js/md5.js',
        'devExtreme/Lib/js/jszip.min.js',
    ];
    public $depends = [
        //'yii\web\YiiAsset',
        'yii\bootstrap4\BootstrapAsset',
    ];
    public $jsOptions = [
        'position' => \yii\web\View::POS_HEAD
    ];
}

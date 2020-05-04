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
class MainHeadAsset extends AssetBundle
{
    public $basePath = '@webroot';
    public $baseUrl = '@web';
    public $css = [
        'golden-layout/goldenlayout-base.css',
        'golden-layout/goldenlayout-light-theme.css',
        'css/spectrum.css',
    ];
    public $js = [
        'js/detect.js',
        'ckeditor5/ckeditor.js',
        'golden-layout/goldenlayout.min.js',
        'devExtreme/Lib/js/dx.all.js',
        'devExtreme/Lib/js/localization/dx.messages.ru.js',
        'devExtreme/Lib/js/vectormap-data/world.js',
        'js/jquery.color-2.1.2.js',
        'js/spectrum.js',
        'resize-sensor/resizeSensor.min.js',
    ];
    public $jsOptions = [
        'position' => \yii\web\View::POS_HEAD
    ];
}

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
class MainEndAsset extends AssetBundle
{
    public $basePath = '@webroot';
    public $baseUrl = '@web';
    public $css = [
        'css/blockColumn.css',
        'css/site.css',
    ];
    public $js = [
        'js/myls-localization.js',
        'js/appCore.js',
        'js/app.js',
        'js/menu.js',
        'js/apptoolbar.js',
        'js/toptabs.js',
        'js/columns.js',
        'js/mylsobject.js',
        'js/mylseditableobject.js',
        'js/toolbar.js',
        'js/dialog.js',
        'js/progressbar.js',
        'js/filter.js',
        'js/cards.js',
        'js/grid.js',
        'js/tree.js',
        'js/documents.js',
        'js/charts.js',
        'js/draglist.js',
        'js/scheduler.js',
        'js/pivot.js',
        'js/kanban.js',
        'js/dashboard.js',
        'js/form.js',
        'js/popup.js',
        'js/bottomtabs.js',
        'js/twowaygrid.js',
        'js/dependencies.js',
        'js/htmleditor.js',
        'js/contextmenu.js',
        'js/layout.js',
        'js/site.js',
    ];
    public $jsOptions = [
        'position' => \yii\web\View::POS_END
    ];
}

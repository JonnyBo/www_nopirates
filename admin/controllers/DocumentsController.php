<?php
/**
 * Created by PhpStorm.
 * User: Администратор
 * Date: 31.03.2019
 * Time: 20:36
 */

namespace app\controllers;


use app\models\FileUploadForm;
use yii\web\UploadedFile;
use yii;

class DocumentsController extends FrameController
{

    public function actionFileupload($table, $params) {
        if (!$table)
            return false;
        if (!empty($params)) {
            $param = json_decode($params, true);
        }
        $model = new FileUploadForm();
        if (Yii::$app->request->isPost) {

            $model->files = UploadedFile::getInstanceByName('documentFiles');
            $baseFilename = $model->files->basename . '.' . $model->files->extension;
            if ($filename = $model->uploadHere()) {
                // your code here
                return json_encode($filename);
            }
        }
        return json_encode('error');
    }

}
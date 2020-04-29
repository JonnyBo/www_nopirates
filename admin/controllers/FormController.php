<?php
/**
 * Created by PhpStorm.
 * User: Администратор
 * Date: 29.03.2019
 * Time: 10:30
 */

namespace app\controllers;

use app\models\FileUploadForm;
use yii\web\UploadedFile;
use yii;

class FormController extends FrameController
{
    public function actionGettemplate($table)
    {
        //$cache = Yii::$app->cache;
        $key = 'gettemplate-'.$table;
        $result = $this->getCache($key);
        if ($result === false) {
            $colCount = 1;
            $tpl = [];
            $this->getTableInfo($table);
            if (isset($this->tableInfo['form_xml']))
                $tpl = $this->parser->parseForm($this->tableInfo['form_xml'], $colCount);
            else
                throw new HttpException(500, 'Не указано описание формы ' . $table);
            $result = $tpl;
            //$cache->set($key, $result);
            $this->saveCache($key, $result);
        }
        return json_encode($result);
    }

    public function actionGetformtemplate()
    {
        $xml = Yii::$app->request->post('xml', null);
        $xml = json_decode($xml, true);
        if ($xml) {
            //Yii::info($this->parser->parseForm($xml, 1), 'dev_log');
            return json_encode($this->parser->parseForm($xml, 1));
        } else
            return false;
    }

    public function actionGetxml($table)
    {
        $this->getTableInfo($table);
        if (isset($this->tableInfo['form_xml']))
            return json_encode($this->tableInfo['form_xml']);
        else
            throw new HttpException(500, 'Не указано описание формы ' . $table);
    }

    public function actionSetxml()
    {
        $xml = Yii::$app->request->post('xml', null);
        $table = Yii::$app->request->post('table', null);
        $xml = json_decode($xml, true);
        $sql = 'update tables set form_xml = :xml where table_id = :table_id';
        $params = [':table_id' => $table, ':xml' => $xml];
        //$req = $this->function->getCorrectSql($sql, $this->function->getParamFromSql($sql), $params);
        $result = $this->executeSQL($sql, $params, $this->db);
        Yii::info($sql, 'dev_log');
        Yii::info($params, 'dev_log');
        return json_encode($result);
    }

    public function actionUploadimage($field)
    {
       $model = new FileUploadForm();
       if (Yii::$app->request->isPost) {
           $model->files = UploadedFile::getInstanceByName($field);
            if ($filename = $model->uploadHere()) {
                // your code here
                return json_encode($filename);
            }
        }
        return json_encode('error');
    }

    public function actionUpdatetagbox() {

        $id = Yii::$app->request->post('id');
        $ext_id = Yii::$app->request->post('ext_id');
        $oldValues = Yii::$app->request->post('oldValues');
        $values = Yii::$app->request->post('values');

        $oldValues = json_decode($oldValues, true);
        $params = []; //json_decode($params, true);
        $values = json_decode($values, true);

        $delete = array_diff($oldValues, $values);
        $add = array_diff($values, $oldValues);

        $params[':ext_id'] = $ext_id;
        if (count($delete) !== 0) {
            $sql = $this->getLookupSQL($id, 4);
            foreach($delete as $key) {
                $params[':id'] = $key;
                $this->executeSQL($sql, $params);
            }
        }

        if (count($add) !== 0) {
            $sql = $this->getLookupSQL($id, 3);
            foreach($add as $key) {
                $params[':id'] = $key;
                $this->executeSQL($sql, $params);
            }
        }

        return json_encode(array(
            'success' => true
        ));
    }
}
<?php

namespace app\controllers;


use Yii;
use yii\filters\AccessControl;
use yii\web\Controller;
use yii\web\Response;
use yii\filters\VerbFilter;
use app\models\ProjectForm;
use yii\data\ArrayDataProvider;
use yii\helpers\Html;
use yii\base\ErrorException;
use yii\web\HttpException;
use yii\helpers\Json;
use app\models\Objects;
use yii\httpclient\Client;





class ProjectController extends \yii\web\Controller
{
    
    public function behaviors()
    {
        return [
            'access' => [
                'class' => AccessControl::className(),
                'only' => ['index', 'list', 'create', 'update', 'test'],
                'rules' => [
                    [
                        'allow' => true,
                        'actions' => ['index', 'list', 'create', 'update', 'test'],
                        'roles' => ['@'],
                    ],
                ],
            ],
        ];
    }


    public function actionIndex() {
        //$sql = "select * from GET_PROJECT_LIST";

        $sql = "select * from sites where social_type is null";
        $projects = Yii::$app->db->createCommand($sql)->queryAll();
        //print_r($projects);
         $dataProvider = new ArrayDataProvider([
            'allModels' => $projects,
             'sort' => [
                 'attributes' => ['id'],
             ],
             'pagination' => [
                 'pageSize' => 200
             ],
        ]);
        /*
        $dataProvider = new ArrayDataProvider([
            'allModels' => $projects,
            'sort' => 'PROJECT_ID',
            ],
            'pagination'=>false,
        );
        */
        $model = new ProjectForm;
        //print_r($model);
        return $this->render('index', ['model'=>$model, 'dataProvider'=>$dataProvider]);
    }


    public function actionCreate() {
        $model = new ProjectForm;
        if (isset($_POST['ProjectForm'])) {
            if ($model->load(Yii::$app->request->post()) && $model->validate()) {
                try {
                    $model->code = preg_replace("/^\<\?(php)?\s*\n/",'',$model->code);
                    $model->save();
                    Yii::$app->session->setFlash('created', $model);
                    $this->redirect(array('index'));
                }
                catch(ErrorException $ex) {
                    //Yii::$app->db->rollback();
                    Yii::$app->session->setFlash('error',$ex->getMessage());
                }
            }
        }
        
        return $this->render('update',array(
            'model'=>$model,
            'id'=>null
        ));
    }

    public function actionUpdate($id) {
        $model = ProjectForm::findOne(['site_id' => $id]);
        if (empty($model)) {
            throw new HttpException(404,'Проект не найден');
        }
        //$model->attributes['code'] = Html::encode($model->attributes['code']);
        if (isset($_POST['ProjectForm'])) {
            if ($model->load(Yii::$app->request->post()) && $model->validate()) {
                try {
                    //$model->code = preg_replace("/^\<\?(php)?\s*\n/",'',$model->code);
                    $model->save();
                    Yii::$app->session->setFlash('updated', $model);
                    //$this->refresh();
                }
                catch(ErrorException $ex) {
                    //Yii::$app->db->rollback();
                    Yii::$app->session->setFlash('error',$ex->getMessage());
                }
            }
        }
        
        if (2 == $model->run)
            Yii::$app->session->setFlash('error','Проект исполняется!');
        
        return $this->render('update',array(
            'model'=>$model,
            'id'=>$id
        ));
    }

    public function actionDelete($id) {
        $model = ProjectForm::findOne(['site_id' => $id]);
        if (empty($model)) {
            throw new HttpException(404,'Проект не найден');
        }
        $sql = "delete from sites p where p.site_id=:project_id";
        $params = [':project_id' => $id];
        try {
            Yii::$app->db->createCommand($sql, $params)->execute();
            //Yii::$app->db->commit();
            Yii::$app->session->setFlash('deleted',$model);
            $this->redirect(array('index'));
        } catch(ErrorException $ex) {
            //Yii::$app->db->rollback();
            Yii::$app->session->setFlash('error',$ex->getMessage());
            throw new HttpException(400,$ex->getMessage());
        }
    }

    public function actionTest($id = null)  {

        $form = ProjectForm::findOne(['site_id' => $id]);
        if (isset($_POST['ProjectForm'])) {
            //$form->attributes = $_POST['ProjectForm'];
            $dropCache = Yii::$app->request->post('dropCache');
            if ($form->load(Yii::$app->request->post()) && $form->validate()) {
                $loader = Yii::$app->siteLoader;
                $saver = Yii::$app->saver;
                if ($id)
                    $loader->cacheFilePrefix = $id.'_';
                $cacheDir = Yii::$app->basePath.'/'.$loader->cacheDir;
                $loader->options = array(
                    CURLOPT_FOLLOWLOCATION => 1,
                    CURLOPT_COOKIEJAR => $cacheDir.'/cookie'.$id.'.txt',
                    CURLOPT_COOKIEFILE => $cacheDir.'/cookie'.$id.'.txt',
                );
                
                if (false !== $data = $loader->getSiteContent($form->url, false, $dropCache)) {
  
                    try {
                        if ($form->code) {
                            $loader->codeBaseURL = $form->url;
                            $saver->getProjectData($form->code, $form->site_id, true);

                        }
                    }
                    catch (\Exception $exc) {
                        Yii::$app->session->setFlash('error',$exc->getMessage());
                    }
                }
                else {
                    $form->addError('url', "Ошибка получения данных.\nЗаголовки ответа:\n".print_r($loader->getHeaders(),true));
                }

            }
            if (Yii::$app->request->isAjax) {
                $success = Yii::$app->session->hasFlash('result');
                $ret = array(
                    'success'=>$success
                );
                if ($success) {
                    $ret = array_merge($ret,array(
                        'result'=>Yii::$app->session->getFlash('result')
                    ));
                }
                else {
                    $ret = array_merge($ret,array(
                        'errors'=>  array_values($form->getErrors()),
                        'msg'=>Yii::$app->session->hasFlash('error') ? Yii::$app->session->getFlash('error') : ''
                    ));
                }
                echo JSON::encode($ret);
                exit();
            }
        }
    }

    private function saveResults($data) {
        foreach ($data as $datum) {
            $this->saveResult($datum['object_id'], $datum['link'], $datum['title']);
        }
    }

    private function saveResult($object_id, $url, $title) {
        $db = Yii::$app->db;
        $params = [':object_id' => $object_id, ':url' => $url, ':title' => trim($title)];
        $db->createCommand('execute procedure PUT_URL(:object_id, :url, :title)', $params)->execute();
    }
}

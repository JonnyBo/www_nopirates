<?php

namespace app\controllers;

use app\models\Objects;
use Yii;
use yii\filters\AccessControl;
use yii\web\Controller;
use yii\web\Response;
use yii\filters\VerbFilter;
use app\models\SocialsForm;
use yii\data\ArrayDataProvider;
use yii\helpers\Html;
use yii\base\ErrorException;
use yii\web\HttpException;
use yii\helpers\Json;
use yii\components\Saver;
use \VK\Client\VKApiClient;
use \VK\OAuth\VKOAuth;
use \VK\OAuth\VKOAuthDisplay;
use \VK\OAuth\Scopes\VKOAuthUserScope;
use \VK\OAuth\VKOAuthResponseType;


//require_once dirname(__DIR__).'/vendor/autoload.php';
use alxmsl\Odnoklassniki\OAuth2\Response\Token;
use alxmsl\Odnoklassniki\API\Client;






class SocialsController extends \yii\web\Controller
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
        $sql = "select * from sites where social_type is not null";
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
        $model = new SocialsForm;
        //print_r($model);
        return $this->render('index', ['model'=>$model, 'dataProvider'=>$dataProvider]);
    }


    public function actionCreate() {
        $model = new SocialsForm;
        if (isset($_POST['SocialsForm'])) {
            if ($model->load(Yii::$app->request->post()) && $model->validate()) {
                try {
                    //$model->code = preg_replace("/^\<\?(php)?\s*\n/",'',$model->code);
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
        $model = SocialsForm::findOne(['site_id' => $id]);
        if (empty($model)) {
            throw new HttpException(404,'Проект не найден');
        }
        //$model->attributes['code'] = Html::encode($model->attributes['code']);
        if (isset($_POST['SocialsForm'])) {
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
        $model = SocialsForm::findOne(['site_id' => $id]);
        if (empty($model)) {
            throw new HttpException(404,'Проект не найден');
        }
        $sql = "delete from socials where id=:id";
        $params = [':id' => $id];
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
        //require_once dirname(__DIR__).'/classes/VkPhpSdk.php';
        //require_once dirname(__DIR__).'/classes/Oauth2Proxy.php';
        $form = SocialsForm::findOne(['site_id' => $id]);
        if ($form->load(Yii::$app->request->post()) && $form->validate()) {
            //авторизация
            if ($form->social_type == 'vk') {
                //сеть ВКонтакте
                $element = $this->vkAuthorisation($form);
            }
            if ($form->social_type == 'ok') {
                $element = $this->okAuthorisation($form);
            }

            if ($element) {
                $loader = Yii::$app->siteLoader;
                $saver = Yii::$app->saver;
                try {
                    if ($form->code) {
                        $saver->getProjectData($form->code, $form->site_id, true, $form->social_type, $element);
                    }
                } catch (\Exception $exc) {
                    Yii::$app->session->setFlash('error', $exc->getMessage());
                }
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

    public function vkAuthorisation($form) {
        try {
            require_once dirname(__DIR__) . '/classes/VkPhpSdk.php';
            require_once dirname(__DIR__) . '/classes/Oauth2Proxy.php';
            /*
            $session = Yii::$app->session;
            $oauth = new VKOAuth('5.101');
            $client_id = $form->client_id;
            $redirect_uri = $form->redirect_uri;
            $display = VKOAuthDisplay::POPUP;
            $scope = array(VKOAuthUserScope::VIDEO);
            $state = $form->client_secret;
            $code = 'CODE';

            if (isset($session['token']) && $session['token']) {
                $vk = new \VK\Client\VKApiClient();
                $access_token = $session['token'];
            } else {
                if ($_GET['code']) {
                    $code = $_GET['code'];
                    $response = $oauth->getAccessToken($form->client_id, $form->client_secret, $form->redirect_uri, $code);
                    $session['token'] = $response['access_token'];
                } else {
                    $browser_url = $oauth->getAuthorizeUrl(VKOAuthResponseType::CODE, $client_id, $redirect_uri, $display, $scope, $state);
                    header('Location:' . $browser_url);
                }
            }
            if (isset($session['token']) && $session['token']) {
                $vk = new \VK\Client\VKApiClient();
            } else {
                Yii::$app->session->setFlash('error', 'Ошибка авторизации');
                exit();
            }
            */
            $vk = new VKApiClient();
            if ($form->access_token) {
                $loader = Yii::$app->siteLoader;
                $loader->vkToken = $form->access_token;
            }
            return $vk;
        } catch(ErrorException $ex) {
            Yii::$app->session->setFlash('error', $ex->getMessage());
            throw new ErrorException($ex->getMessage());
        }
    }

    public function okAuthorisation($form) {
        try {
            $Token = new Token();
            $Token->setAccessToken($form->access_token)->setTokenType(Token::TYPE_SESSION);

            $Client = new Client();
            $Client->setApplicationKey($form->application_key)->setToken($Token)->setClientId($form->client_id)->setClientSecret($form->client_secret)->setRedirectUri($form->redirect_uri);
            return $Client;
        } catch(\Exception $ex) {
            Yii::$app->session->setFlash('error',$ex->getMessage());
            throw new Exception($ex->getMessage());
        }
    }
/*
    private function saveResults($data) {
        foreach ($data as $datum) {
            $this->saveResult($datum['object_id'], $datum['link'], $datum['title']);
        }
    }

    private function saveResult($object_id, $url, $title) {
        if ($object_id && $url) {
            $db = Yii::$app->db;
            $params = [':object_id' => $object_id, ':url' => $url, ':title' => $title];
            //print_r($params);
            $db->createCommand('execute procedure PUT_URL(:object_id, :url, :title)', $params)->execute();
        }
    }
*/

}

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
use \VK\Client\VKApiClient;
use \VK\OAuth\VKOAuth;
use \VK\OAuth\VKOAuthDisplay;
use \VK\OAuth\Scopes\VKOAuthUserScope;
use \VK\OAuth\VKOAuthResponseType;


require_once dirname(__DIR__).'/vendor/autoload.php';
use alxmsl\Odnoklassniki\OAuth2\Response\Token;
use alxmsl\Odnoklassniki\API\Client;






class SocialsController extends \yii\web\Controller
{
    
    public function behaviors()
    {
        return [
            'access' => [
                'class' => AccessControl::className(),
                'only' => ['index', 'list'],
                'rules' => [
                    [
                        'allow' => true,
                        'actions' => ['index', 'list'],
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
        require_once dirname(__DIR__).'/classes/VkPhpSdk.php';
        require_once dirname(__DIR__).'/classes/Oauth2Proxy.php';
        $form = SocialsForm::findOne(['site_id' => $id]);
        if ($form->load(Yii::$app->request->post()) && $form->validate()) {
            //авторизация
            if ($form->social_type == 'vk') {
                //сеть ВКонтакте
/*
                $oauth2Proxy = new \Oauth2Proxy(
                    $form->client_id, // client id
                    $form->client_secret, // client secret
                    'https://oauth.vk.com/access_token', // access token url
                    'https://oauth.vk.com/authorize', // dialog uri
                    'code', // response type
                    $form->redirect_uri, // redirect url
                    $form->allow // scope
                );

                //print_r($oauth2Proxy);

                if($oauth2Proxy->authorize() === true) {
                    print_r($form);
                    exit();
                    // Init vk.com SDK
                    $vkPhpSdk = new \VkPhpSdk();
                    $vkPhpSdk->setAccessToken($oauth2Proxy->getAccessToken());
                    $vkPhpSdk->setUserId($oauth2Proxy->getUserId());
                    //return $vkPhpSdk;
                    // API call - get profile
                    //$result = $vkPhpSdk->api('video.search', $params);
                } else {
                    //return false;
                    Yii::$app->session->setFlash('error','Ошибка авторизации');
                }
*/

                $oauth = new VKOAuth('5.101');
                $client_id = $form->client_id;
                $redirect_uri = $form->redirect_uri;
                $display = VKOAuthDisplay::POPUP;
                $scope = array(VKOAuthUserScope::VIDEO);
                $state = $form->client_secret;
                $code = 'CODE';
                $access_token = false;
                $_GET['code'] = 'a4101b2251abc6085d';
                if ($_GET['code']) {
                    $code = $_GET['code'];
                    $response = $oauth->getAccessToken($form->client_id, $form->client_secret, $form->redirect_uri, $code);
                    $access_token = $response['access_token'];
                } else {
                    $browser_url = $oauth->getAuthorizeUrl(VKOAuthResponseType::CODE, $client_id, $redirect_uri, $display, $scope, $state);

                    //header('Location:'.$browser_url);
                }
                //$access_token = $form->access_token;

                if ($access_token) {
                    $vk = new VKApiClient();
                } else {
                    Yii::$app->session->setFlash('error', 'Ошибка авторизации');
                    exit();
                }

            }
            if ($form->social_type == 'ok') {
                $Token = new Token();
                $Token->setAccessToken($form->access_token)->setTokenType(Token::TYPE_SESSION);

                $Client = new Client();
                $Client->setApplicationKey($form->application_key)->setToken($Token)->setClientId($form->client_id)->setClientSecret($form->client_secret)->setRedirectUri($form->redirect_uri);
            }
            try {
                if ($form->code) {
                    $form->code = preg_replace("/^\<\?(php)?\s*\n/",'',$form->code);
                    $objects = Objects::find()->where('current_date between coalesce(start_date, current_date) and coalesce(end_date, current_date)')->all();
                    //print_r($objects);
                    //exit();
                    ob_start();
                    Yii::$app->session->close();
                    $ret = eval($form->code);
                    Yii::$app->session->open();
                    $result = ob_get_clean();
                    //$result = json_decode($result);
                    if (false === $ret) {
                        Yii::$app->session->setFlash('error','Ошибка синтаксиса');
                    } else {
                        if (!empty($out)) {
                            foreach ($out as $res) {
                                if ($form->social_type == 'ok')
                                    $this->saveResult($res->object_id, $res->permalink);
                                else
                                    $this->saveResult($res['object_id'], $res['player']);
                            }
                        }
                        Yii::$app->session->setFlash('result', $result);
                    }
                }
            } catch (ErrorException $exc) {
                Yii::$app->session->setFlash('error',$exc->getTraceAsString());
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

    private function saveResult($object_id, $url) {
        $db = Yii::$app->db;
        $params = [':object_id' => $object_id, ':url' => $url];
        $db->createCommand('execute procedure PUT_URL(:object_id, :url)', $params)->execute();
    }
}

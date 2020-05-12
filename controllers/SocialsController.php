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
        //require_once dirname(__DIR__).'/classes/VkPhpSdk.php';
        //require_once dirname(__DIR__).'/classes/Oauth2Proxy.php';
        $form = SocialsForm::findOne(['site_id' => $id]);
        if ($form->load(Yii::$app->request->post()) && $form->validate()) {
            //авторизация
            if ($form->social_type == 'vk') {
                //сеть ВКонтакте
                /*
                $session = Yii::$app->session;
                $oauth = new VKOAuth('5.101');
                $client_id = $form->client_id;
                $redirect_uri = $form->redirect_uri;
                //$redirect_uri = 'http://nopirates/vk.php';
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
                //$access_token = $form->access_token;
                //echo $access_token;
                //$access_token = 'b650621ee7202556f5b354e1268487fdde6ecaca00b896d67fbbc0f059a9d9c8eb730ae11137af493668f';
                if (isset($session['token']) && $session['token']) {
                    $vk = new \VK\Client\VKApiClient();
                } else {
                    Yii::$app->session->setFlash('error', 'Ошибка авторизации');
                    exit();
                }
                */
                $element = $this->vkAuthorisation($form);
            }
            if ($form->social_type == 'ok') {
                /*
                try {
                    $Token = new Token();
                    $Token->setAccessToken($form->access_token)->setTokenType(Token::TYPE_SESSION);

                    $Client = new Client();
                    $Client->setApplicationKey($form->application_key)->setToken($Token)->setClientId($form->client_id)->setClientSecret($form->client_secret)->setRedirectUri($form->redirect_uri);
                } catch(ErrorException $ex) {
                    //Yii::$app->db->rollback();
                    Yii::$app->session->setFlash('error',$ex->getMessage());
                    throw new HttpException(400,$ex->getMessage());
                }
                */
                $element = $this->okAuthorisation($form);
            }

            if ($element) {
                $loader = Yii::$app->siteLoader;
                $saver = Yii::$app->saver;
                try {
                    if ($form->code) {
                        $saver->getProjectData($form->code, true, $form->social_type, $element);

                        /*
                        $form->code = preg_replace("/^\<\?(php)?\s*\n/", '', $form->code);
                        $objects = Objects::find()->where('current_date between coalesce(start_date, current_date) and coalesce(end_date, current_date)')->all();
                        $searches = $loader->getSearchStrings($objects);
                        if (!empty($searches)) {
                            $data = [];
                            ob_start();
                            Yii::$app->session->close();
                            $ret = eval($form->code);
                            Yii::$app->session->open();
                            $result = ob_get_clean();
                            //$result = json_decode($result);
                            if (false === $ret) {
                                Yii::$app->session->setFlash('error', 'Ошибка синтаксиса');
                            } else {
                                if (!empty($data)) {
                                    $out = [];
                                    foreach ($data as $res) {
                                        if ($form->social_type == 'ok') {
                                            $out[] = [$res->object_id, $res->permalink, $res->title];
                                            //$this->saveResult($res->object_id, $res->permalink, $res->title);
                                        } else {
                                            $url = $this->clearVKLink($res['player']);
                                            $out[] = [$res['object_id'], $url, $res['title']];
                                            //$this->saveResult($res['object_id'], $url, $res['title']);
                                        }
                                    }
                                    $saver->saveResults($out);
                                }
                                Yii::$app->session->setFlash('result', $result);
                            }
                        }
                        */
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

    public function actionSend() {
        set_time_limit(0);
        $db = Yii::$app->db;
        //$email = 'evgen-borisov@yandex.ru';
        //$email = ['alexeyparallel@gmail.com', /*'evgen-borisov@yandex.ru', 'evgeny.e.borisov@gmail.com', 'legal@antipirates.ru'*/];
        try {
            $sql = 'select object_id from get_objects_by_status(:status_id)';
            $params = [':status_id' => 4];
            $objects = $db->createCommand($sql, $params)->queryAll();
            if (!empty($objects)) {
                $saver = Yii::$app->saver;
                foreach ($objects as $obj) {
                    $sql = 'select mail_text, title, original_title from get_object_first_mail_text(:object_id)';
                    $params = [':object_id' => $obj['object_id']];
                    $text_mail = '';
                    if ($mail = $db->createCommand($sql, $params)->queryOne()) {
                        //print_r($mail);
                        $text_mail = str_replace('{title}', $mail['title'], $mail['mail_text']);
                        $text_mail = str_replace('{original_title}', $mail['original_title'], $text_mail);
                        $sql = 'select doc_name, doc_link from get_documents_by_object(:object_id)';
                        $documents = $db->createCommand($sql, $params)->queryAll();
                        $files = [];
                        if (!empty($documents)) {
                            foreach ($documents as $doc) {
                                $files[] = $doc;
                            }
                        }
                        $email = [];
                        $sql = 'select site_id, email from get_sites_email(:object_id, :status_id)';
                        $params[':status_id'] = 4;
                        $sites = $db->createCommand($sql, $params)->queryAll();
                        if (!empty($sites)) {
                            foreach ($sites as $site) {
                                if ($site['email']) {
                                    $arrMail = explode(',', $site['email']);
                                    if ($arrMail) {
                                        foreach ($arrMail as $fmail) {
                                            $email[] = trim($fmail);
                                        }
                                        //$email = [$site['email']];
                                        $sql = 'select url from get_links_by_object_and_status(:object_id, :status_id, :site_id)';
                                        $params[':site_id'] = $site['site_id'];
                                        $links = $db->createCommand($sql, $params)->queryAll();
                                        $text_links = '';
                                        if (!empty($links)) {
                                            foreach ($links as $link) {
                                                $text_links .= '<br /><a href="' . $link['url'] . '">' . $link['url'] . '</a> ';
                                            }
                                        }
                                        $info = ['message' => $text_mail, 'links' => $text_links];
                                        if ($saver->sentEmail($email, $info, $tpl = false, $files)) {
                                            sleep(5);
                                            printf('<p>отправлено письмо: объект - %s, сайт - %s, документов - %s</p>', $mail['title'], $site['site_id'], count($files));
                                            $sql = 'execute procedure set_objects_first_email(:object_id, :site_id, :status_id)';
                                            $db->createCommand($sql, $params)->execute();
                                        } else {
                                            printf('<p>ОШИБКА! не отправлено письмо: объект - %s, сайт - %s</p>', $obj['object_id'], $site['site_id']);
                                        }
                                    }
                                }
                            }
                        }

                    }
                }
            }
        } catch (\Exception $e) {
            echo $e->getMessage();
        }
        /*
        print_r($objects);
        $saver = Yii::$app->saver;
        $files = [
            'http://oasis-light.ru/files/klassicheskiy.pdf',
            //'http://myls.education/files/034cb5f61282145049fcae456e3c4e6b_Diploma Margarita Korolchenko B1.pdf',
            //'http://dev.myls/files/2a9b84343a72f2bf22bacea208b52691_CKSource_Certificate_CJMDDP619.DYZ815RDE608.pdf'
        ];
        $email = 'evgen-borisov@yandex.ru; alexeyparallel@gmail.com';
        $info = [
            'name' => 'Евгений',
            'message' => 'Тестовое сообщение.'
        ];
        //$saver->sentEmail($email, $info, $tpl = false, $files);
        */
    }

    public function getData($code) {

    }



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


}

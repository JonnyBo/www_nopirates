<?php

namespace app\controllers;

use app\models\User;
use Yii;
use yii\filters\AccessControl;
use yii\web\Controller;
use yii\web\Response;
use yii\filters\VerbFilter;
use yii\web\HttpException;
use yii\base\ErrorException;
use app\models\LoginForm;
use app\models\SignupForm;
use yii\helpers\Url;


class SiteController extends Controller
{

    use FunctionController;

    public $layout;

    private $outputFilename;

    public function init()
    {
        $domain = current(explode('.', Yii::$app->getRequest()->serverName, 2));
        //$domain = 'nopirates';
        if ($domain !== 'myls') {
            $this->getFirstData(true);
            $this->layout = 'main';
        }

    }

    /**
     * {@inheritdoc}
     */
    public function behaviors()
    {

        return [

            'access' => [
                'class' => AccessControl::className(),
                'only' => ['logout'],
                'rules' => [
                    [
                        'actions' => ['logout'],
                        'allow' => true,
                        'roles' => ['@'],
                    ],
                ],
            ],


            'verbs' => [
                'class' => VerbFilter::className(),
                'actions' => [
                    'logout' => ['get', 'post'],
                ],
            ],
        ];

    }

    /**
     * {@inheritdoc}
     */
    public function actions()
    {
        return [
            'error' => [
                'class' => 'yii\web\ErrorAction',
                'view' => '@app/views/site/error.php',
            ],
            'captcha' => [
                'class' => 'yii\captcha\CaptchaAction',
                'fixedVerifyCode' => YII_ENV_TEST ? 'testme' : null,
            ],
        ];
    }

    /**
     * Displays homepage.
     *
     * @return string
     */
    public function actionIndex()
    {
        //print_r($_SESSION);
        //$domen = 'nopirates';
        $domen = current(explode('.', Yii::$app->getRequest()->serverName, 2));
        if ($domen == 'myls') {
            $this->layout = 'main_preview';
            return $this->render('preview');
        } else {
            $this->layout = 'main';
            if (!Yii::$app->user->isGuest) {
                //$session = Yii::$app->session;
                //$cookies = Yii::$app->request->cookies;
                //$userId = false;
                //print_r($_SESSION);
                //if ($session['userId']) {
                //  $userId = $session['userId'];
                //}
                /*//$this->checkCache();
                $session->close();
                //print_r($session);
                $session->destroy();

                $session->open();*/

                $this->clearCache();

                //if ($userId) {
                //  $session['userId'] = $userId;
                //}
                //print_r($session);
                //$session->open();


                //if ($cookies->has('userId')) {
                //  $session['userId'] = $cookies->getValue('userId', 0);
                //}
                //if (!$session['userId']) {
                //return $this->redirect('site/login');
                //}

                return $this->render('index');
            } else {
                return $this->redirect('site/login');
            }
        }
    }

    /**
     * Login action.
     *
     * @return Response|string
     */
    public function actionLogin()
    {
        if (!Yii::$app->user->isGuest) {
            return $this->goHome();
        }
        $this->layout = 'main_login';
        $error = 0;

        $model = new LoginForm();

        if ($model->load(Yii::$app->request->post(), '')) {
            $model->rememberMe = 0;
            if ($_POST['rememberMe'] == 'true') {
                $model->rememberMe = 1;
            }
            try {
                if ($model->login()) {
                    Yii::$app->response->cookies->add(new \yii\web\Cookie([
                        'name' => 'userName',
                        'value' => $model->username,
                        'domain' => $_SERVER['HTTP_HOST'],
                        'httpOnly' => false,
                        'expire' => time() + 86400 * 30, // время активности Cookie в секундах (по умолчанию «0»)
                    ]));
                    return $this->goHome();
                } else {
                    Yii::$app->session->setFlash('error', 'Неправильный логин или пароль.');
                }

            } catch (\Exception $e) {
                Yii::$app->session->setFlash('error', $e->getMessage());
                //return $this->goHome();
            }

        } else {
            //Yii::$app->session->setFlash('error', 'Не переданы параметры');
        }
        return $this->render('login', [
            'model' => $model,
            'error' => $error,
        ]);
    }

    /**
     * Logout action.
     *
     * @return Response
     */
    public function actionLogout()
    {

        $session = Yii::$app->session;
        //unset($session['userId']);
        Yii::$app->user->logout();
        Yii::$app->response->cookies->remove(new \yii\web\Cookie([
            'name' => 'userId',
            'domain' => $_SERVER['HTTP_HOST'],
        ]));
        return $this->redirect('/site/login');
    }

    public function actionRegistration()
    {
        $this->layout = 'main_login';
        $error = [];
        $token = Yii::$app->request->get('token', false);
        if (!$token) {
            Yii::$app->getSession()->setFlash('error', 'Не передан токен');
            return $this->redirect('/site/login');
        }
        $model = new SignupForm();
        if ($model->load(Yii::$app->request->post(), '')) {
            //$model->company_id = $company_id;
            if ($user = $model->signup()) {
                $model->sentEmailConfirm($user);

                Yii::$app->getSession()->setFlash('success', 'Вы успешно зарегистрированы.<br />Вам выслано письмо для подтвержденя регистрации.');
                //Yii::$app->getSession()->setFlash('error', false);
                //Yii::$app->getSession()->setFlash('username', $user->user_login);
                Yii::$app->response->cookies->add(new \yii\web\Cookie([
                    'name' => 'userName',
                    'value' => $user->user_login,
                    'domain' => $_SERVER['HTTP_HOST'],
                    'httpOnly' => false,
                    'expire' => time() + 86400 * 30, // время активности Cookie в секундах (по умолчанию «0»)
                ]));
                return $this->redirect('/site/login');
            } else {
                Yii::$app->getSession()->setFlash('error', 'Не зарегистрирован пользователь');
            }
        }
        return $this->render('registration', [
            'model' => $model,
            //'company_id' => $company_id,
        ]);
    }

    public function actionSignupConfirm($token)
    {
        $signupService = new SignupForm();
        try {
            $user = $signupService->confirmation($token);
            Yii::$app->session->setFlash('success', 'You have successfully confirmed your registration.');
            Yii::$app->response->cookies->add(new \yii\web\Cookie([
                'name' => 'userName',
                'value' => $user->user_login,
                'domain' => $_SERVER['HTTP_HOST'],
                'httpOnly' => false,
                'expire' => time() + 86400 * 30, // время активности Cookie в секундах (по умолчанию «0»)
            ]));
            //Yii::$app->getSession()->setFlash('username', $user->user_login);
        } catch (\Exception $e) {
            Yii::$app->errorHandler->logException($e);
            Yii::$app->session->setFlash('error', $e->getMessage());
        }

        return $this->redirect('/site/login');
    }

    public function actionRestore()
    {
        $this->layout = 'main_login';
        $changePassw = false;
        $token = Yii::$app->request->get('token', false);
        if ($token)
            $changePassw = true;
        $email = Yii::$app->request->post('email', false);
        $psw = Yii::$app->request->post('password', false);
        //$company_id = Yii::$app->request->get('company_id', false);
        if ($email) {
            $user = User::findOne(['user_login' => $email]);
            if (!$user) {
                Yii::$app->session->setFlash('error', 'Пользователь с таким Email не найден!');
                return $this->redirect('/site/restore');
            }
            if ($user->status !== User::STATUS_ACTIVE) {
                Yii::$app->session->setFlash('error', 'Пользователь не активен! Проверьте Вашу почту и активируйте учетную запись.');
                return $this->redirect('/site/restore');
            }
            //отправляем ссылку на сброс пароляgeneratePasswordResetToken()
            $user->generatePasswordResetToken();
            if (!$user->save()) {
                Yii::$app->session->setFlash('error', 'Не удалось получить ссылку на сброс пароля.');
                return $this->redirect('/site/restore');
            }
            $sent = Yii::$app->mailer
                ->compose(
                    ['html' => 'user-reset-password-html'],
                    ['user' => $user])
                ->setTo($user->user_login)
                //->setFrom(Yii::$app->params['adminEmail'])
                ->setSubject('Reset of password')
                ->send();

            if (!$sent) {
                Yii::$app->session->setFlash('error', 'Не удалось отправить ссылку на сброс пароля.');
                return $this->redirect('/site/restore');
            }
            Yii::$app->session->setFlash('success', 'На ваш Email отправлена ссылка на сброс пароля.');
            return $this->redirect('/site/login');
        }
        if ($token) {
            $user = User::findOne(['password_reset_token' => $token]);
            if (!$user) {
                Yii::$app->session->setFlash('error', 'Не правильный токен');
                return $this->redirect('/site/restore');
            }
            if ($psw) {
                $user->removePasswordResetToken();
                $user->setPassword($psw);
                if (!$user->save()) {
                    Yii::$app->session->setFlash('error', 'Не удалось сохранить новый пароль.');
                    return $this->redirect('/site/restore');
                }
                Yii::$app->getSession()->setFlash('success', 'Пароль успешно изменен');
                //Yii::$app->getSession()->setFlash('username', $user->user_login);
                Yii::$app->response->cookies->add(new \yii\web\Cookie([
                    'name' => 'userName',
                    'value' => $user->user_login,
                    'domain' => $_SERVER['HTTP_HOST'],
                    'httpOnly' => false,
                    'expire' => time() + 86400 * 30, // время активности Cookie в секундах (по умолчанию «0»)
                ]));
                return $this->redirect('/site/login');
            }
        }

        return $this->render('restore', [

        ]);
    }

    public function actionCheckuser()
    {
        $email = Yii::$app->request->post('email', false);
        //$email = Yii::$app->request->get('email', false);
        $user = User::findByEmail($email);
        if ($user) {
            return 0;
        }

        return 1;
    }

    public function actionRegurl($name, $surname, $email, $company_id)
    {

        $str = $name . '|' . $surname . '|' . $email . '|' . $company_id;
        $out = urlencode(Yii::$app->getSecurity()->encryptByKey($str, Yii::$app->components['request']['cookieValidationKey']));
        $url = Url::to(['site/registration', 'token' => $out], true);
        $sent = Yii::$app->mailer
            ->compose(
                ['html' => 'user-signup-link-html'],
                ['link' => $url])
            ->setTo($email)
            //->setFrom(Yii::$app->params['adminEmail'])
            ->setSubject('Приглашение на регистрацию')
            ->send();
        if (!$sent) {
            throw new \RuntimeException('Sending error.');
        }
        //return urlencode(Yii::$app->getSecurity()->encryptByKey($str, Yii::$app->components['request']['cookieValidationKey']));
        //return Yii::$app->getSession()->getFlash('username', null);
    }

    public function actionRegurlDecode()
    {
        $str = Yii::$app->request->post('token', false);
        if (!$str)
            return false;
        $arr = explode('|', Yii::$app->getSecurity()->decryptByKey(urldecode($str), Yii::$app->components['request']['cookieValidationKey']));
        return json_encode(['name' => $arr[0], 'surname' => $arr[1], 'email' => $arr[2], 'company_id' => $arr[3]]);
    }

    public function actionLoadtranslate()
    {
        $filename = dirname(__DIR__) . '/web/localization/' . $_SERVER['HTTP_HOST'] . '_translate.json';
        $result = '';
        if (file_exists($filename)) {
            if ($res = file_get_contents($filename))
                $result = $res;
        }
        if (!$result) {
            $result = '{"en":{}, "ru":{}}';
        }
        return $result;
    }

    public function actionSavetranslate()
    {
        $string = Yii::$app->request->post('data');
        if (!empty($string)) {
            $filename = dirname(__DIR__) . '/web/localization/' . $_SERVER['HTTP_HOST'] . '_translate.json';
            if (file_exists($filename)) {
                file_put_contents($filename, json_encode($string));
            } else {
                $create_file = fopen($filename, "w");
                fwrite($create_file, json_encode($string));
                fclose($create_file);
            }
            //echo 'ok';
        }
    }

    private function createUserDataDir()
    {
        $result = false;
        if ($this->userID != null && $this->userID) {
            if (!file_exists(Yii::$app->basePath . '/userData')) {
                mkdir(Yii::$app->basePath . '/userData', 0777);
            }
            $dirname = Yii::$app->basePath . '/userData/' . Yii::$app->getRequest()->serverName . '/' . $this->userID;
            if (!file_exists('userData/' . Yii::$app->getRequest()->serverName)) {
                mkdir(Yii::$app->basePath . '/userData/' . Yii::$app->getRequest()->serverName, 0777);
            }
            if (!file_exists($dirname)) {
                mkdir($dirname, 0777);
            }
            $result = $dirname;
        }
        //Yii::info($result, 'dev_log');
        return $result;
    }

    private function saveUserFile($filename, $data)
    {
        $handle = fopen($filename, 'w+');
        fwrite($handle, $data);
        fclose($handle);
    }

    public function actionStorage($table = false)
    {
        if (!$table)
            $table = Yii::$app->request->post('table', false);
        if (!$table)
            return false;
        $result = false;
        if ($dirname = $this->createUserDataDir()) {
            $filename = $dirname . '/table' . $table . '.txt';
            if ($data = Yii::$app->request->post('data', false)) {
                $this->saveUserFile($filename, $data);
                $result = 1;
            } else {
                if (file_exists($filename))
                    $result = file_get_contents($filename);
                if (!$result)
                   $result = 2;
            }
        }
        return $result;
    }

    public function actionSettings()
    {
        $result = false;
        $default_lang = '';
        $languages = Yii::$app->params['languages'];
        if (!empty($languages)) {
            foreach ($languages as $lang) {
                if ($lang['default']) {
                    $result = json_encode(['lang' => $lang['code']]);
                    $default_lang = $lang['code'];
                    break;
                }
            }
            unset($lang);
        }
        $session = Yii::$app->session;
        if (Yii::$app->user->id) {
            if ($dirname = $this->createUserDataDir()) {
                $filename = $dirname . '/settings.txt';
                if ($data = Yii::$app->request->post('data', false)) {
                    $this->saveUserFile($filename, json_encode($data));
                    $result = true;
                } else {
                    if (file_exists($filename)) {
                        $result = file_get_contents($filename);
                        if (empty($result)) {
                            //$result = json_encode(['lang' => 'en']);
                            $this->saveUserFile($filename, $result);
                        } else {
                            //пишем язык в куку
                            $config = json_decode($result);
                            Yii::$app->response->cookies->add(new \yii\web\Cookie([
                                'name' => 'lang',
                                'value' => $config->lang,
                                'domain' => $_SERVER['HTTP_HOST'],
                                //'httpOnly' => false,
                                'expire' => time() + 60 * 60 * 24 * 365, // время активности Cookie в секундах (по умолчанию «0»)
                            ]));
                        }
                    } else {
                        //$result = json_encode(['lang' => 'en']);
                        $this->saveUserFile($filename, $result);
                    }
                }
            }
            $res = json_decode($result);
            $user = User::findIdentity(Yii::$app->user->id);
            $res->company_id = $user->company_id;
            $res->client_id = $user->client_id;
            $res->user_id = Yii::$app->user->id;
            $res->notification = $this->getNotificationTableId();
            $result = json_encode($res);
        } else {
            $cookies = Yii::$app->request->cookies;
            if ($data = Yii::$app->request->post('data', false)) {
                //setcookie('lang',$data['lang'],time()+60*60*24*365, '/');
                Yii::$app->response->cookies->add(new \yii\web\Cookie([
                    'name' => 'lang',
                    'value' => $data['lang'],
                    'domain' => $_SERVER['HTTP_HOST'],
                    //'httpOnly' => false,
                    'expire' => time() + 60 * 60 * 24 * 365, // время активности Cookie в секундах (по умолчанию «0»)
                ]));
                $result = json_encode(['lang' => $data['lang']]);
            } else {
                if (($cookie = $cookies->get('lang')) !== null) {
                    $lang = $cookie->value;
                    $result = json_encode(['lang' => $lang]);
                } else {
                    $result = json_encode(['lang' => $default_lang]);
                }

            }
        }
        return $result;
    }

    public function actionDownload($file)
    {
        //$this->layout = 'download';
        //$file = Yii::$app->request->post('file', false);
        $error = $filelink = $filename = false;
        if ($file) {
            $filelink = Yii::getAlias('@webroot') . '/files/' . $file;
            if (file_exists($filelink)) {

                //$filelink = Yii::$app->request->BaseUrl . '/files/' . $file;
                $filename = substr(strstr($file, '_'), 1);
                return Yii::$app->response->SendFile($filelink, $filename);
                /*
                if (Yii::$app->response->SendFile($filelink, $filename))
                    //return json_encode(['success' => 'OK']);
                else {
                    $error = 'Файл не загружен!';
                    return json_encode(['error' => $error]);
                }
                */
            } else {
                throw new HttpException(404, 'Файл не найден!');
                //$error = 'Файл не найден!';
                //return json_encode(['error' => $error]);
            }
        } else {
            throw new HttpException(500, 'Не передано имя файла!');
            //$error = 'Не передано имя файла!';
            //return json_encode(['error' => $error]);
        }
        /*
        return $this->render('download', [
            'filelink' => $filelink,
            'filename' => $filename,
            'error' => $error,
        ]);
        */
    }

    public function actionNotifications()
    {
        $user = User::findIdentity(Yii::$app->user->id);
        $result = $this->selectOne("select cnt from GET_NOTIFICATIONS_COUNT(:client_id)", [":client_id" => $user->client_id], $this->ddb);
        //$this->sendNotificationEmails();
        return $result["success"]['cnt'];
    }

    private function getNotificationTableId()
    {
        $result = $this->selectOne("select setting_value from settings s where s.setting_name = 'notification_table_id'", [], $this->ddb);
        return $result['success']['setting_value'];//2025;
    }

    public function actionPdf($id, $params)
    {
        //$id = Yii::$app->request->post('id', false);
        $params = json_decode($params, true);
        $user = User::findIdentity(Yii::$app->user->id);
        $params = array_merge([':user_id' => $this->userID, /*':ext_id' => $extId,*/ ':lang' => $this->appLang, ':company_id' => $user->company_id, ':__user_client_id__' => $user->client_id], $params);
        //echo $this->getCodePdf();

        $result = $this->selectOne("select filename, headerfile, footerfile from reports r where r.report_id = :id", [':id' => $id], $this->db);

        $header = $result['success']['headerfile'];
        $footer = $result['success']['footerfile'];
        $filename = $result['success']['filename'];
        $attr = [];

        if ($header) {
            $attr['headerHtmlContent'] = $this->getCodePdf($header, $params);
        }
        if ($footer) {
            $attr['footerHtmlContent'] = $this->getCodePdf($footer, $params);
        }
        $this->outputFilename = 'report.pdf';
        $tmpFileName = uniqid($this->userID, true) . '.pdf';
        $filelink = Yii::getAlias('@runtime') . '/html2pdf/' . $tmpFileName;
        Yii::$app->html2pdf
            //->convertFile(Yii::getAlias('@webroot/reports/proforma.html'))
            ->convert($this->getCodePdf($filename, $params), $attr)
            ->saveAs($filelink);
        //->saveAs('php://output');
        //return $this->redirect('/reports/proforma.pdf');
        if (file_exists($filelink)) {
            if (ob_get_level()) {
                ob_end_clean();
            }
            header("Content-Type: application/pdf; charset=UTF-8");
            header("Content-Length: ".filesize($filelink));
            header("Content-Disposition: attachment; filename=\"{$this->outputFilename}\"");
            header("Content-Transfer-Encoding: binary");
            header("Cache-Control: must-revalidate");
            header("Pragma: no-cache");
            header("Expires: 0");
            readfile($filelink);
        }

        //return Yii::$app->response->SendFile($filelink, $this->outputFilename);

    }

    private function getCodePdf($file, $params)
    {
        //ob_end_flush();
        //$params[':id'] = 120;
        $html = file_get_contents(Yii::getAlias('@webroot/reports/' . $file));
        $html = preg_replace("/^\<\?(php)?\s*\n/", '', $html);
        ob_start();
        //Yii::$app->session->close();
        $ret = eval($html);
        //Yii::$app->session->open();
        $result = ob_get_clean();
        return $result;
    }

}

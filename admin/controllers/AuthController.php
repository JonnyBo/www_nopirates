<?php

namespace app\controllers;

use Yii;
use app\models\LoginForm;
use app\models\SignupForm;
use app\models\User;
use yii\base\ErrorException;
use yii\filters\AccessControl;
use yii\filters\VerbFilter;

class AuthController extends \yii\web\Controller
{

    use FunctionController;

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
        return $this->redirect('login');
    }

    public function actionRegistration()
    {
        $this->layout = 'main_login';
        $error = [];
        $token = Yii::$app->request->get('token', false);
        if (!$token) {
            Yii::$app->getSession()->setFlash('error', 'Не передан токен');
            return $this->redirect('login');
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
                return $this->redirect('login');
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

        return $this->redirect('login');
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
                return $this->redirect('restore');
            }
            if ($user->status !== User::STATUS_ACTIVE) {
                Yii::$app->session->setFlash('error', 'Пользователь не активен! Проверьте Вашу почту и активируйте учетную запись.');
                return $this->redirect('restore');
            }
            //отправляем ссылку на сброс пароляgeneratePasswordResetToken()
            $user->generatePasswordResetToken();
            if (!$user->save()) {
                Yii::$app->session->setFlash('error', 'Не удалось получить ссылку на сброс пароля.');
                return $this->redirect('restore');
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
                return $this->redirect('restore');
            }
            Yii::$app->session->setFlash('success', 'На ваш Email отправлена ссылка на сброс пароля.');
            return $this->redirect('login');
        }
        if ($token) {
            $user = User::findOne(['password_reset_token' => $token]);
            if (!$user) {
                Yii::$app->session->setFlash('error', 'Не правильный токен');
                return $this->redirect('restore');
            }
            if ($psw) {
                $user->removePasswordResetToken();
                $user->setPassword($psw);
                if (!$user->save()) {
                    Yii::$app->session->setFlash('error', 'Не удалось сохранить новый пароль.');
                    return $this->redirect('restore');
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
                return $this->redirect('login');
            }
        }

        return $this->render('restore', [

        ]);
    }

}

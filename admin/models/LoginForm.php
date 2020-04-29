<?php

namespace app\models;

use Yii;
use yii\base\Model;

/**
 * LoginForm is the model behind the login form.
 *
 * @property User|null $user This property is read-only.
 *
 */
class LoginForm extends Model
{
    public $username;
    public $password;
    public $rememberMe = true;

    private $_user = false;


    /**
     * @return array the validation rules.
     */
    public function rules()
    {
        return [
            // username and password are both required
            [['username', 'password'], 'required'],
            [['username'], 'email'],
            // rememberMe must be a boolean value
            //['rememberMe', 'boolean'],
            // password is validated by validatePassword()
            ['password', 'validatePassword'],
        ];
    }


    public static function getDb(){
        return \Yii::$app->datadb;
    }

    /**
     * Validates the password.
     * This method serves as the inline validation for password.
     *
     * @param string $attribute the attribute currently being validated
     * @param array $params the additional name-value pairs given in the rule
     */
    public function validatePassword($attribute, $params)
    {
        if (!$this->hasErrors()) {
            try {
                if ($user = $this->getUser()) {
                    if (!$user || !$user->validatePassword($this->password)) {
                        $this->addError($attribute, 'Incorrect username or password.');
                    }
                } else {
                    Yii::$app->session->setFlash('error', 'Нет таблицы');
                }
            } catch (\DomainException $e) {
                Yii::$app->session->setFlash('error', $e->getMessage());
                //return $this->goHome();
            }
        }
    }

    /**
     * Logs in a user using the provided username and password.
     * @return bool whether the user is logged in successfully
     */
    public function login()
    {
        try {
            if ($this->validate()) {
                $user = $this->getUser();
                if ($user->status === User::STATUS_ACTIVE) {
                    /*
                    if ($this->rememberMe) {
                        Yii::$app->response->cookies->add(new \yii\web\Cookie([
                            'name' => 'userId',
                            'value' => $user->id,
                            'domain' => $_SERVER['HTTP_HOST'],
                            'httpOnly' => false,
                            'expire' => time() + 86400*30, // время активности Cookie в секундах (по умолчанию «0»)
                        ]));
                    }
                    */
                    return Yii::$app->user->login($user, $this->rememberMe ? 3600 * 24 * 30 : 0);
                }
                if ($user->status === User::STATUS_WAIT) {
                    Yii::$app->session->setFlash('error', 'To complete the registration, confirm your email. Check your email.');
                    //throw new \DomainException('To complete the registration, confirm your email. Check your email.');
                }
            }
        } catch (\DomainException $e) {
            Yii::$app->session->setFlash('error', $e->getMessage());
            //return $this->goHome();
        }
        return false;
    }

    /**
     * Finds user by [[username]]
     *
     * @return User|null
     */
    public function getUser()
    {
        try {
            if ($this->_user === false) {
                $this->_user = User::findByUsername($this->username);
                //print_r($this->_user);
                /*
                if ($this->_user->attributes) {
                    $this->_user->id = $this->_user->attributes['user_id'];
                    $this->_user->username = $this->_user->attributes['login'];
                    $this->_user->password = $this->_user->attributes['psw'];
                    $this->_user->accessToken = '12345';
                    $this->_user->authKey = '6789';
                }
                */
            }
            return $this->_user;
        } catch (\Exception $e) {
            Yii::$app->session->setFlash('error', $e->getMessage());
            //return $this->goHome();
        }
    }
}

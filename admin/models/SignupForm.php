<?php

namespace app\models;

use Yii;
use yii\base\Model;
use yii\db\Connection;

/**
 * Signup form
 */
class SignupForm extends Model
{

    public $name;
    public $surname;
    public $phone;
    public $email;
    public $password;
    public $company_id;

    /**
     * @inheritdoc
     */
    public function rules()
    {
        return [
            ['name', 'trim'],
            ['name', 'required'],
            ['name', 'string', 'min' => 2, 'max' => 255],
            ['surname', 'trim'],
            ['surname', 'required'],
            ['surname', 'string', 'min' => 2, 'max' => 255],
            ['email', 'trim'],
            ['email', 'required'],
            ['email', 'email'],
            ['email', 'string', 'max' => 255],
            //['email', 'unique', 'targetClass' => '\app\models\User', 'message' => 'This email address has already been taken.'],
            ['password', 'required'],
            ['password', 'string', 'min' => 3],
            //['re-password', 'required'],
            //['re-password', 'string', 'min' => 3],
            ['company_id', 'required'],
            //['status', 'integer'],
            ['phone', 'string', 'min' => 5, 'max' => 255],
        ];
    }

    public static function getDb(){
        return \Yii::$app->datadb;
    }

    /**
     * Signs user up.
     *
     * @return User|null the saved model or null if saving fails
     */
    public function signup()
    {

        if (!$this->validate()) {
            return null;
        }
        if (User::findByEmail($this->email)) {
            return null;
        }
        $user = new User();
        $user->name = $this->name;
        $user->surname = $this->surname;
        $user->phone = $this->phone;
        $user->user_login = $this->email;
        $user->company_id = $this->company_id;
        $user->setPassword($this->password);
        $user->generateAuthKey();
        $user->email_confirm_token = Yii::$app->security->generateRandomString();
        $user->status = User::STATUS_WAIT;
        return $user->save() ? $user : null;
    }

    public function sentEmailConfirm(User $user)
    {
        $email = $user->user_login;
        $sent = Yii::$app->mailer
            ->compose(
                ['html' => 'user-signup-comfirm-html'],
                ['user' => $user])
            ->setTo($email)
            //->setFrom(Yii::$app->params['adminEmail'])
            ->setSubject('Confirmation of registration')
            ->send();

        if (!$sent) {
            throw new \RuntimeException('Sending error.');
        }
    }

    public function confirmation($token)
    {
        if (empty($token)) {
            //throw new \DomainException('Empty confirm token.');
            Yii::$app->session->setFlash('error', 'Empty confirm token.');
            return Yii::$app->response->redirect('/site/login');
        }

        $user = User::findOne(['email_confirm_token' => $token]);

        if (!$user) {
            //throw new \DomainException('User is not found.');
            //echo '111111111111111111111';
            Yii::$app->session->setFlash('error', 'User is not found.');
            return Yii::$app->response->redirect(['/site/login']);
        }
        //exit();
        $user->email_confirm_token = null;
        $user->status = User::STATUS_ACTIVE;
        /*
               if (!$user->save()) {
                   throw new \RuntimeException('Saving error.');
               }

               if (!Yii::$app->getUser()->login($user)){
                   throw new \RuntimeException('Error authentication.');
               }
       */
        return $user->save() ? $user : null;
    }

}
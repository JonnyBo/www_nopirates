<?php

namespace app\models;

use Yii;
use yii\base\Model;
use yii\base\NotSupportedException;
use yii\behaviors\TimestampBehavior;
use yii\db\ActiveRecord;
use yii\web\IdentityInterface;
use yii\db\Connection;

/**
 * User model
 *
 * @property integer $id
 * @property string $name
 * @property string $surname
 * @property string $password_hash
 * @property string $password_reset_token
 * @property string $user_login
 * @property string $phone
 * @property integer $company_id
 * @property integer $client_id
 * @property string $auth_key
 * @property string $password write-only password
 */
class User extends ActiveRecord implements IdentityInterface
{
    const STATUS_DELETED = 0;
    const STATUS_ACTIVE = 10;
    const STATUS_WAIT = 5;

    /**
     * @inheritdoc
     */
    public static function tableName()
    {
        return 'tbl_users';
    }

    public static function getDb(){
        return \Yii::$app->datadb;
    }

    /**
     * @inheritdoc
     */
    public function behaviors()
    {
        return [
            TimestampBehavior::className(),
        ];
    }

    /**
     * @inheritdoc
     */
    public function rules()
    {
        return [
            //['status', 'default', 'value' => self::STATUS_ACTIVE],
            //['status', 'in', 'range' => [self::STATUS_ACTIVE, self::STATUS_DELETED]],
            ['status', 'in', 'range' => [self::STATUS_DELETED, self::STATUS_WAIT, self::STATUS_ACTIVE]],
        ];
    }

    /**
     * @inheritdoc
     */
    public static function findIdentity($id)
    {
        return static::findOne(['id' => $id]);
    }

    /**
     * @inheritdoc
     */
    public static function findIdentityByAccessToken($token, $type = null)
    {
        throw new NotSupportedException('"findIdentityByAccessToken" is not implemented.');
    }

    /**
     * Finds user by username
     *
     * @param string $username
     * @return static|null
     */
    public static function findByUsername($username)
    {
        try{
            //if (\Yii::$app->db->getTableSchema('{{%table_name}}', true) !== null) {
                // работа с таблицей
                if ($user = static::findOne(['user_login' => $username])) {
                    return $user;
                }
            /*} else {
                Yii::$app->session->setFlash('error', 'Нет таблицы');
                return false;
            }*/
        } catch (\Exception $e) {
            Yii::$app->session->setFlash('error', $e->getMessage());
            //return $this->goHome();
        }
        //return static::findOne(['user_login' => $username]);
    }

    public static function findByEmail($email)
    {
        return static::findOne(['user_login' => $email]);
    }

    /**
     * @inheritdoc
     */
    public function getId()
    {
        return $this->getPrimaryKey();
    }

    /**
     * @inheritdoc
     */
    public function getAuthKey()
    {
        return $this->auth_key;
    }

    /**
     * @inheritdoc
     */
    public function validateAuthKey($authKey)
    {
        return $this->getAuthKey() === $authKey;
    }

    /**
     * Validates password
     *
     * @param string $password password to validate
     * @return bool if password provided is valid for current user
     */
    public function validatePassword($password)
    {
        return Yii::$app->security->validatePassword($password, $this->password_hash);
    }

    /**
     * Generates password hash from password and sets it to the model
     *
     * @param string $password
     */
    public function setPassword($password)
    {
        $this->password_hash = Yii::$app->security->generatePasswordHash($password);
    }

    /**
     * Generates "remember me" authentication key
     */
    public function generateAuthKey()
    {
        $this->auth_key = Yii::$app->security->generateRandomString();
    }

    //ВОССТАНОВЛЕНИЕ ПАРОЛЯ

    public static function findByPasswordResetToken($token)
    {

        if (!static::isPasswordResetTokenValid($token)) {
            return null;
        }

        return static::findOne([
            'password_reset_token' => $token,
            'status' => self::STATUS_ACTIVE,
        ]);
    }

    public static function isPasswordResetTokenValid($token)
    {

        if (empty($token)) {
            return false;
        }

        $timestamp = (int) substr($token, strrpos($token, '_') + 1);
        $expire = Yii::$app->params['user.passwordResetTokenExpire'];
        return $timestamp + $expire >= time();
    }

    public function generatePasswordResetToken()
    {
        $this->password_reset_token = Yii::$app->security->generateRandomString() . '_' . time();
    }

    public function removePasswordResetToken()
    {
        $this->password_reset_token = null;
    }

    public function sendNotification($text)
    {
        $email = $this->user_login;
        $sent = Yii::$app->mailer
            ->compose(
                ['html' => 'user-notification-html'],
                ['message' => $text])
            ->setTo($email)
            //->setFrom(Yii::$app->params['adminEmail'])
            ->setSubject('New notification')
            ->send();
        if (!$sent) {
            throw new \RuntimeException('Sending error.');
        }
    }

}
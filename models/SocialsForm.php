<?php
namespace app\models;

use Yii;
//use yii\base\Model;
use yii\db\ActiveRecord;
/**

 */
class SocialsForm extends ActiveRecord {
/*
    public $project_name;
    public $project_id;
    public $start_url;
    public $code;
    public $commited;
    public $run;
*/
    public static function tableName()
    {
        return 'sites';
    }
    
    /**
     * Declares the validation rules.
     */
    public function rules() {
        return [
            // name, email, subject and body are required
            [['client_id', 'name', 'client_secret', 'redirect_uri'], 'required'],
            [['client_id', 'name', 'client_secret', 'redirect_uri', 'application_key', 'access_token', 'social_type', 'allow'], 'string'],
            [['commited'], 'boolean'],
            [['run'], 'integer'],
            [['code'], 'safe'],
        ];
    }

    /**
     * Declares customized attribute labels.
     * If not declared here, an attribute would have a label that is
     * the same as its name with the first letter in upper case.
     */
    public function attributeLabels() {
        return [
            'name'=>'Название проекта',
            'client_id'=>'Идентификатор приложения',
            'client_secret'=>'Секретный ключ приложения',
            'application_key'=>'Публичный ключ приложения',
            'redirect_uri'=>'Адрес для редиректа',
            'access_token' => 'Токен',
            //'secret_session_key' => 'Секретный ключ сессии',
            'social' => 'Соц. сеть',
            'commited'=>'Готов',
            'run'=>'Статус',
            'code'=>'PHP-код - обработчик содержимого страницы ($data)'
        ];
    }
    /*
    public static function statuses() {
        return array(
            'Не запущен',
            'В очереди на запуск',
            'Исполняется',
            'Завершился аварийно'
        );
    }
    */
    public function findById($id) {
        $sql = "select * from socials where id=:id";
        $param = [':id' => $id];
        return Yii::$app->db->createCommand($sql, $param)->queryOne();
    }
/*
    public static function getStatus($idx) {
        $statuses = self::statuses();
        return isset($statuses[$idx]) ? $statuses[$idx] : '';
    }
*/
}
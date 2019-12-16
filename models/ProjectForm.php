<?php
namespace app\models;

use Yii;
//use yii\base\Model;
use yii\db\ActiveRecord;
/**

 */
class ProjectForm extends ActiveRecord {
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
            [['url', 'name'], 'required'],
            [['url', 'name'], 'string'],
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
            'url'=>'URL стартовой страницы проекта',
            'code'=>'PHP-код - обработчик содержимого страницы ($data)',
            'commited'=>'Готов',
            'run'=>'Статус'
        ];
    }
    
    public static function statuses() {
        return array(
            'Не запущен',
            'В очереди на запуск',
            'Исполняется',
            'Завершился аварийно'
        );
    }

    public function findById($id) {
        $sql = "select p.site_id,p.name,p.code,p.url,p.commited,p.run from sites p where p.site_id=:project_id";
        $param = [':project_id' => $id];
        return Yii::$app->db->createCommand($sql, $param)->queryOne();
    }

    public static function getStatus($idx) {
        $statuses = self::statuses();
        return isset($statuses[$idx]) ? $statuses[$idx] : '';
    }
}
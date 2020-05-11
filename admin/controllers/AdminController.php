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

class AdminController extends Controller
{

    use FunctionController;

    public $layout;

    public $formSQLs = array();

    public function init()
    {
        $domain = current(explode('.', Yii::$app->getRequest()->serverName, 2));
        if ($domain !== 'myls') {
            $this->getStartData();
            $this->layout = 'constructor';
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
                'only' => ['index'],
                'rules' => [
                    [
                        'actions' => ['index'],
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

    public function actionIndex()
    {

        if (!Yii::$app->user->isGuest) {
            $this->layout = 'constructor';

            return $this->render('index');
        } else {
            return $this->redirect('site/login');
        }
        //return $this->render('index');
    }

    private function getStartData() {
        $sql = "select s.selectsql from tables t inner join selects s on s.sql_id = t.sql_id where t.name = 'FORMS'";
        $this->formSQLs = Yii::$app->db->createCommand($sql, [])->queryOne();
    }

    public function actionGetallforms() {
        $result = [];
        if ($this->formSQLs['selectsql']) {
            $result = Yii::$app->db->createCommand($this->formSQLs['selectsql'], [])->queryAll();
        }
        return json_encode($result);
    }

}

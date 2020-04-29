<?php
/**
 * Created by PhpStorm.
 * User: Администратор
 * Date: 21.03.2019
 * Time: 18:23
 */

namespace app\controllers;

use app\models\User;
use Yii;
use Yii\web\Session;
use yii\base\Exception;
use \yii\web\HttpException;


trait FunctionController
{
    protected $db;
    protected $ddb;
    protected $userID;
    protected $mainSQLs = array();
    protected $function;
    protected $parser;
    protected $appLang;
    protected $company_id;

    protected function getFirstData($isStart = false)
    {
        $session = Yii::$app->session;
        $cookies = Yii::$app->request->cookies;
        $this->userID = Yii::$app->user->id;
        //$this->userID = 226;

        $dirname = Yii::$app->basePath . '/userData/' . Yii::$app->getRequest()->serverName . '/' . $this->userID;
        $filename = $dirname . '/settings.txt';
        $lang = 'en';
        if (file_exists($filename)) {
            $result = json_decode(file_get_contents($filename));
            if ($result->lang) {
                $lang = $result->lang;
            }
        }
        $this->appLang = $lang;
        $this->company_id = 1;

        $this->db = Yii::$app->db;
        $this->ddb = Yii::$app->datadb;

        $this->function = Yii::$app->sitefunctions;
        $this->parser = Yii::$app->xmlparser;

        /*if (!isset($session['mainSQL']) || $isStart) {
            $this->getMainSQLs();
            $session['mainSQL'] = $this->mainSQLs;
        } else {
            $this->mainSQLs = $session['mainSQL'];
        }*/
    }

    protected function getMainSQLs()
    {
        $key = 'mainSQL';
        $firstData = $this->getCache($key);
        if ($firstData === false) {
            $firstSql = "select s.sql_id, s.selectsql, s.insertsql, s.updatesql, s.deletesql, s.refreshsql, s.tag, s.ext_field, s.selectwhere, s.name, s.insert_connect_sql
                        from tables t
                        inner join selects s on (t.sql_id = s.sql_id)
                        where t.name = 'TEMPLATE_WEB!'";

            $firstData = $this->db->createCommand($firstSql)->queryAll();
            $this->saveCache($key, $firstData);
        }
        $this->mainSQLs['tableSQL'] = $firstData[0]['updatesql'];
        $this->mainSQLs['columnsSQL'] = $firstData[0]['deletesql'];
        $this->mainSQLs['menuSQL'] = $firstData[0]['refreshsql'];
        $this->mainSQLs['reportsSQL'] = $firstData[0]['selectsql'];
        $this->mainSQLs['mainMenuSQL'] = $firstData[0]['insertsql'];
        $this->mainSQLs['mainSubMenuSQL'] = 'select tg.table_id,
                                           tg.name,
                                           tg.caption,
                                           tg.table_type,
                                           tg.main_menu_view_type
                                    from tables tg
                                      left outer join user_rights ur on (tg.tag = ur.tag)
                                      inner join user_per_rights upr on (ur.user_right_id = upr.user_right_id
                                            and upr.user_id = :user_id
                                            and upr.v = 1)
                                    where tg.parent_id = :parent_id
                                          and tg.show_in_menu = 1
                                    order by tg.pos';
    }

    protected function getQuickActionsSQL()
    {
        $key = 'quickActionsSQL';
        $quickActions = $this->getCache($key);
        if ($quickActions === false) {
            $quickActionsSQL = "select s.sql_id, s.selectsql
                        from tables t
                        inner join selects s on (t.sql_id = s.sql_id)
                        where t.name = 'QUICK_ACTIONS'";

            $quickActions = $this->db->createCommand($quickActionsSQL)->queryAll();
            $this->saveCache($key, $quickActions);
        }
        $this->mainSQLs['quickactions'] = $quickActions[0]['selectsql'];
    }

    protected function getCache($key)
    {
        $value = Yii::$app->session->get($key);
        if (!isset($value)) {
            $value = false;
        }
        return $value;
    }

    protected function saveCache($key, $result)
    {
        Yii::$app->session->set($key, $result);
    }

    protected function clearCache()
    {
        unset($_SESSION['mainSQL']);
        unset($_SESSION['lookupsql']);
        unset($_SESSION['tablecolumns']);
        unset($_SESSION['tableinfo']);
        unset($_SESSION['gettemplate']);
        unset($_SESSION['mainmenu']);
        unset($_SESSION['contextmenu']);
    }

    protected
    function selectOne($sql, $params, $db)
    {
        $result = [];
        $req = $this->function->getCorrectSql($sql, $this->function->getParamFromSql($sql), $params);
        $transaction = $db->beginTransaction();
        $this->setTransacionUser($db);
        try {
            $result = $db->createCommand($req['sql'], $req['params'])->queryOne();
            $transaction->commit();
            return array(
                'success' => $result,
                //'data' => $result,
            );
        } catch (\Exception $ex) {
            $transaction->rollback();
            return array(
                'error' => $this->getErrorStr($ex->getMessage())
            );
        }
    }

    protected
    function selectAll($sql, $params, $db)
    {
        $result = [];
        $req = $this->function->getCorrectSql($sql, $this->function->getParamFromSql($sql), $params);
        $transaction = $db->beginTransaction();
        $this->setTransacionUser($db);
        try {
            $result = $db->createCommand($req['sql'], $req['params'])->queryAll();
            $transaction->commit();

            return array(
                'success' => $result,
            );
        } catch (\Exception $ex) {
            $transaction->rollback();
            return array(
                'error' => $this->getErrorStr($ex->getMessage())
            );

        }
    }

    protected function setTransacionUser($db) {
        $sql = 'select rdb$set_context(\'USER_TRANSACTION\', \'user_id\', :user_id)
                  from rdb$database';
        //$user = User::findIdentity(Yii::$app->user->id);
        $params = [':user_id' => $this->userID];
        $db->createCommand($sql, $params)->queryAll();
    }

    protected
    function executeSQL($sql, $params, $db = null)
    {
        if (!$db)
            $db = $this->ddb;
        $req = $this->function->getCorrectSql($sql, $this->function->getParamFromSql($sql), $params);
        $transaction = $db->beginTransaction();
        $this->setTransacionUser($db);
        try {
            $db->createCommand($req['sql'], $req['params'])->execute();
            $transaction->commit();

            return json_encode(array(
                'success' => true,
            ));
        } catch (\Exception $ex) {
            $transaction->rollback();
            return json_encode(array(
                'success' => false,
                'error' => $this->getErrorStr($ex->getMessage())
            ));
        }
    }

    protected function getTableTypeUrl($tableType)
    {
        $url = '';
        switch ($tableType) {
            case 1:
                $url = 'form';
                break;
            case 2:
                $url = 'pivot';
                break;
            case 3:
                $url = 'tree';
                break;
            case 4:
                $url = 'gant';
                break;
            case 5:
                $url = 'cards';
                break;
            case 6:
                $url = 'scheduler';
                break;
            case 7:
                $url = 'dashboard';
                break;
            case 8:
                $url = 'documents';
                break;
            case 9:
                $url = 'chart';
                break;
            case 10:
                $url = 'kanban';
                break;
            case 11:
                $url = 'draglist';
                break;
            case 13:
                $url = 'layout';
                break;
            default:
                $url = 'grid';
        }
        return $url;
    }

    protected
    function getErrorStr($str)
    {
        /*$arrMessage = explode(':', $str);
        if (!empty($arrMessage)) {
            return $arrMessage[0] . ':' . $arrMessage[1] . ':' . $arrMessage[2];
        }*/
        return $str;
    }

    protected function getSetting($setting)
    {
        $sql = 'select setting_value
                from settings s
                where s.setting_name = :setting_name
                  and (s.company_id = :company_id or s.company_id is null)   ';
        $user = User::findIdentity(Yii::$app->user->id);
        return $this->selectOne($sql, [':setting_name' => $setting, ':company_id' => $user->company_id], $this->ddb);
    }
}
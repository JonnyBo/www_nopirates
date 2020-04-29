<?php

namespace app\controllers;

use Yii;
use yii\web\Controller;
use yii\base\Exception;
use \yii\web\HttpException;


class MenuController extends Controller
{
    use FunctionController;

    public function init()
    {
        /*
         $session = Yii::$app->session;
         $cookies = Yii::$app->request->cookies;
         if ($cookies->has('userId')) {
             $session['userId'] = $cookies->getValue('userId', 0);
         }
        */
        $domen = current(explode('.', Yii::$app->getRequest()->serverName, 2));
        //if (!$session['userId'] && strpos(Yii::$app->request->url, 'login') === false && $domen != 'myls') {
        if (Yii::$app->user->isGuest && strpos(Yii::$app->request->url, 'login') === false && $domen != 'myls') {
            return $this->redirect('/site/login');
        }
        $this->getFirstData();
        $this->getMainSQLs();
        $this->getQuickActionsSQL();
    }

    protected function getQuickActions()
    {
        $key = 'quickactions';
        $result = $this->getCache($key);
        if ($result === false) {
            $quickActionsSQL = $this->mainSQLs['quickactions'];

            $this->db = Yii::$app->db;

            $params = [':user_id' => $this->userID];
            $resSQL = $this->selectAll($quickActionsSQL, $params, $this->db);
            if (isset($resSQL['success'])) {
                $menuData = $resSQL['success'];
            } else {
                throw new HttpException(500, $resSQL['error']);
            }
            $actions = [];

            foreach ($menuData as $idx => $row) {
                $item = [
                    //'_data'=>$row,
                    'id' => $row['action_id'],
                    'table_id' => $row['table_id'],
                    'index' => $row['pos'],
                    'icon' => $row['icon'],
                    'text' => $row['menu_text'],
                ];
                $actions[] = $item;
            }
            $result = $actions;
            //$cache->set($key, $result);
            $this->saveCache($key, $result);
        }
        return $result;
    }

    public function actionIndex()
    {
        return $this->render('index');
    }

    protected function getMainMenu()
    {

        //$cache = Yii::$app->cache;
        $key = 'mainmenu';
        $result = $this->getCache($key);
        if ($result === false) {
            $menuSql = $this->mainSQLs['mainMenuSQL'];
            $submenuSql = $this->mainSQLs['mainSubMenuSQL'];
            $this->db = Yii::$app->db;

            $params = [':user_id' => $this->userID];
            $resSQL = $this->selectAll($menuSql, $params, $this->db);
            if (isset($resSQL['success'])) {
                $menuData = $resSQL['success'];
            } else {
                throw new HttpException(500, $resSQL['error']);
            }
            //$req = $this->function->getCorrectSql($menuSql, $this->function->getParamFromSql($menuSql), $params);
            //$menuData = $this->db->createCommand($req['sql'], $req['params'])->queryAll();
            $menu = [];
            foreach ($menuData as $idx => $row) {
                $item = [
                    //'_data'=>$row,
                    'id' => $row['group_id'],
                    'key' => $row['name'],
                    'url' => '#',
                    'img' => $row['img'],
                    'objectType' => 'menuGroup',
                ];
                $params = [':user_id' => $this->userID, ':parent_id' => $row['group_id']];

                $ressSQL = $this->selectAll($submenuSql, $params, $this->db);
                if (isset($ressSQL['success'])) {
                    $submenuData = $ressSQL['success'];
                } else {
                    throw new HttpException(500, $ressSQL['error']);
                }

                //$req = $this->function->getCorrectSql($submenuSql, $this->function->getParamFromSql($submenuSql), $params);

                //$submenuData = $this->db->createCommand($req['sql'], $req['params'])->queryAll();
                if (!empty($submenuData)) {
                    foreach ($submenuData as $r) {
                        $url = $this->getTableTypeUrl($r['table_type']);

                        $name = $r['name'];
                        if ($r['caption'])
                            $name = $r['caption'];
                        $itm = array(
                            //'_data'=>$r,
                            //'url' => '#' . $url . '-' . $r['table_id'],
                            'id' => $r['table_id'],
                            'text' => $name,
                            'title' => $name,
                            'titleField' => '',
                            'objectType' => $url,
                            //'objectView' => ($url == 'form') ? 'popup'  : 'tab',
                            'objectView' => ($r['main_menu_view_type'] == 2) ? 'popup'  : 'tab',
                        );
                        $item['items'][] = $itm;
                    }
                    $menu[] = $item;
                }
                /* else {
                     // Убираем пустое меню
                     unset($menuData[$idx]);
                 }*/

            }
            $result = $menu;
            //$cache->set($key, $result);
            $this->saveCache($key, $result);
        }
        //print_r($menu);
        return $result;
    }

    public function actionGetmenu()
    {
        $menu = $this->getMainMenu();
        // $menu = array();
        return json_encode($menu);
    }

    public function actionGetquickactions()
    {
        $menu = $this->getQuickActions();
        // $menu = array();
        return json_encode($menu);
    }

    protected function getContextMenu($id)
    {
        //$cache = Yii::$app->cache;
        $key = 'contextmenu-' . $id;
        $result = $this->getCache($key);
        if ($result === false) {
            try {
                $menu = array();
                $submenuSql = $this->mainSQLs['menuSQL'];
                $params = [':user_id' => $this->userID, ':table_id' => $id, ':tt_id' => 0];
                //$req = $this->function->getCorrectSql($submenuSql, $this->function->getParamFromSql($submenuSql), $params);
                //$menuData = $this->db->createCommand($req['sql'], $req['params'])->queryAll();
                $resSQL = $this->selectAll($submenuSql, $params, $this->db);
                if (isset($resSQL['success'])) {
                    $menuData = $resSQL['success'];
                } else {
                    throw new HttpException(500, $resSQL['error']);
                }
                foreach ($menuData as $idx => $row) {
                    if (empty($row['v']))
                        continue;
                    $url = $this->getTableTypeUrl($row['table_type']);
                    $item = array(
                        '_data' => $row,
                        'text' => $row['name'],
                        'objectType' => $url,
                        'url' => '#' . $url . '-' . $row['target_table_id'],
                        'extIdField' => strtolower($row['param']),
                        'title' => $row['name'],
                        'titleField' => strtolower($row['title']),
                        'isInner' => strtolower($row['is_inner']),
                    );
                    if ($row['is_submenu']) {
                        $params[':table_id'] = $row['target_table_id'];
                        //$req = $this->function->getCorrectSql($submenuSql, $this->function->getParamFromSql($submenuSql), $params);
                        //$submenuData = $this->db->createCommand($req['sql'], $req['params'])->queryAll();
                        $ressSQL = $this->selectAll($submenuSql, $params, $this->db);
                        if (isset($ressSQL['success'])) {
                            $submenuData = $ressSQL['success'];
                        } else {
                            throw new HttpException(500, $ressSQL['error']);
                        }
                        foreach ($submenuData as $r) {
                            $itm = array(
                                '_data' => $r,
                                'text' => $r['name'],
                            );
                            $item['items'][] = $itm;
                        }
                    }
                    $menu[] = $item;
                }
            } catch (Exception $ex) {
                $menu = $ex->getMessage();
            }
            $result = $menu;
            //$cache->set($key, $result);
            $this->saveCache($key, $result);
        }
        return $result;
    }

    protected function getAllContextMenu()
    {
        //$cache = Yii::$app->cache;
        $key = 'contextmenu';
        $result = $this->getCache($key);
        if ($result === false) {
            try {
                $menu = array();
                $submenuSql = $this->mainSQLs['menuSQL'];
                $params = [':user_id' => $this->userID];
                //$req = $this->function->getCorrectSql($submenuSql, $this->function->getParamFromSql($submenuSql), $params);
                //$menuData = $this->db->createCommand($req['sql'], $req['params'])->queryAll();
                $resSQL = $this->selectAll($submenuSql, $params, $this->db);
                if (isset($resSQL['success'])) {
                    $menuData = $resSQL['success'];
                } else {
                    throw new HttpException(500, $resSQL['error']);
                }
                foreach ($menuData as $idx => $row) {
                    if (empty($row['v']))
                        continue;
                    $url = $this->getTableTypeUrl($row['table_type']);
                    $item = array(
                        '_data' => $row,
                        'text' => $row['name'],
                        'objectType' => $url,
                        'targetObject' => $row['target_table_id'],
                        'objectView' => ($row['main_menu_view_type'] == 2) ? 'popup'  : 'tab',
                        'url' => '#' . $url . '-' . $row['target_table_id'],
                        'extIdField' => strtolower($row['param']),
                        'title' => $row['name'],
                        'titleField' => strtolower($row['title']),
                        'isInner' => strtolower($row['is_inner']),
                    );
                    if ($row['is_submenu']) {
                        $params[':table_id'] = $row['target_table_id'];
                        //$req = $this->function->getCorrectSql($submenuSql, $this->function->getParamFromSql($submenuSql), $params);
                        //$submenuData = $this->db->createCommand($req['sql'], $req['params'])->queryAll();
                        $ressSQL = $this->selectAll($submenuSql, $params, $this->db);
                        if (isset($ressSQL['success'])) {
                            $submenuData = $ressSQL['success'];
                        } else {
                            throw new HttpException(500, $ressSQL['error']);
                        }
                        foreach ($submenuData as $r) {
                            $itm = array(
                                '_data' => $r,
                                'text' => $r['name'],
                            );
                            $item['items'][] = $itm;
                        }
                    }
                    $menu[$row['table_id']][] = $item;
                }
            } catch (Exception $ex) {
                $menu = $ex->getMessage();
            }
            $result = $menu;
            //$cache->set($key, $result);
            $this->saveCache($key, $result);
        }
        return $result;
    }

    public function actionGetcontextmenu($id)
    {
        $menu = $this->getContextMenu($id);
        return json_encode($menu);
    }

    public function actionGetallcontextmenu()
    {
        $menu = $this->getAllContextMenu();
        return json_encode($menu);
    }

}

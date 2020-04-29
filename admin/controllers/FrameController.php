<?php
/**
 * Created by PhpStorm.
 * User: Администратор
 * Date: 20.03.2019
 * Time: 18:18
 */

namespace app\controllers;

use app\models\User;
use Yii;
use yii\web\Controller;
use app\models\FileUploadForm;
use yii\web\UploadedFile;
use yii\base\Exception;
use \yii\web\HttpException;


class FrameController extends Controller
{

    use FunctionController;

    protected $tableInfo;

    public function init()
    {
        $session = Yii::$app->session;
        $cookies = Yii::$app->request->cookies;
        /*
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
    }

    protected function getTableColumns($id, $tableType)
    {
        return $this->getAllTablesColumns()[$id];
    }

    protected function getAllTablesColumns()
    {
        //$cache = Yii::$app->cache;
        $key = 'tablecolumns';
        $result = $this->getCache($key);
        if ($result === false) {
            $colByAlias = [];
            $sum = [];
            if (empty($this->mainSQLs['columnsSQL']))
                throw new HttpException(500, 'Ошибка первого запроса: Нет запроса на получение информации о столбцах');


            $params = [':user_id' => $this->userID];
            $resSQL = $this->selectAll($this->mainSQLs['columnsSQL'], $params, $this->db);
            if (isset($resSQL['success'])) {
                $columns = $resSQL['success'];
            } else {
                throw new HttpException(500, $resSQL['error']);
            }
            $tCols = [];
            for ($i = 0; $i < count($columns); $i++) {
                $field = mb_strtolower($columns[$i]['field'], 'UTF-8');
                $tableId = $columns[$i]['table_id'];
                $colByAlias[$tableId][$field]['dataField'] = $columns[$i]['field'] = $field;
                $colByAlias[$tableId][$field]['caption'] = $columns[$i]['title'];
                $colByAlias[$tableId][$field]['width'] = $columns[$i]['width'];
                $colByAlias[$tableId][$field]['visible'] = ($columns[$i]['is_visible'] == 1 && $columns[$i]['v'] == 1);
                //$colByAlias[$tableId][$field]['columnType'] = $columns[$i]['column_type'];
                $colByAlias[$tableId][$field]['columnType'] = $this->parseColumnTypes($columns[$i]['column_type']);

                if ($columns[$i]['default_value'])
                    $colByAlias[$tableId][$field]['defaultValue'] = $columns[$i]['default_value'];

                $colByAlias[$tableId][$field]['fixed'] = $columns[$i]['is_fixed'] ? true : false;

                $colByAlias[$tableId][$field]['allowEditing'] = ($columns[$i]['is_edited'] == 1 && $columns[$i]['e'] == 1) && $field != 'id';

                if ($columns[$i]['is_use_to_view'])
                    $colByAlias[$tableId][$field]['useColumn'] = $columns[$i]['is_use_to_view'];
                else
                    $colByAlias[$tableId][$field]['useColumn'] = 0;


                if ($columns[$i]['have_to_fill'])
                    $colByAlias[$tableId][$field]['required'] = $columns[$i]['have_to_fill'] = strtolower($columns[$i]['have_to_fill']);

                if ($columns[$i]['visible_condition'])
                    $colByAlias[$tableId][$field]['visibleCondition'] = $columns[$i]['visible_condition'] = strtolower($columns[$i]['visible_condition']);

                if ($columns[$i]['edit_condition'])
                    $colByAlias[$tableId][$field]['editCondition'] = $columns[$i]['edit_condition'] = strtolower($columns[$i]['edit_condition']);

                if ($columns[$i]['have_to_fill'] && $colByAlias[$tableId][$field]['visibleCondition'] == $colByAlias[$tableId][$field]['required'])
                    $colByAlias[$tableId][$field]['required'] = "1";

                if ($columns[$i]['column_pattern'])
                    $colByAlias[$tableId][$field]['pattern'] = $columns[$i]['column_pattern'];

                if ($columns[$i]['column_restrictions'])
                    $colByAlias[$tableId][$field]['restrictions'] = $columns[$i]['column_restrictions'] = $columns[$i]['column_restrictions'];

                if ($columns[$i]['sort_field'])
                    $colByAlias[$tableId][$field]['sortField'] = $columns[$i]['sort_field'];

                if ($columns[$i]['external_form_id'])
                    $colByAlias[$tableId][$field]['extFormId'] = $columns[$i]['external_form_id'];
                if ($columns[$i]['external_form_field'])
                    $colByAlias[$tableId][$field]['extFormField'] = $columns[$i]['external_form_field'];

                if ($columns[$i]['to_cache'])
                    $colByAlias[$tableId][$field]['toCache'] = true;

                if ($columns[$i]['change_field_proc'])
                    $colByAlias[$tableId][$field]['changeFieldProc'] = $columns[$i]['change_field_proc'] = strtolower($columns[$i]['change_field_proc']);

                //if ($columns[$i]['column_format']) {
                $this->getColumnFormat($columns[$i], $colByAlias[$tableId][$field]);
                //if ($tableType == 'grid')
                $this->getGridColumnFormat($columns[$i], $colByAlias[$tableId][$field]);

                if (in_array($colByAlias[$tableId][$field]['dataType'], ['grid', 'tree', 'cards', 'scheduler', 'documents', 'chart', 'pivot', 'kanban', 'draglist'])) {
                    $colByAlias[$tableId][$field]['tableId'] = $columns[$i]['ext_field'];
                    $colByAlias[$tableId][$field]['extField'] = strtolower($columns[$i]['default_value']);
                    $colByAlias[$tableId][$field]['extTargetField'] = strtolower($columns[$i]['field_in_grid']);
                }

                if (in_array($colByAlias[$tableId][$field]['dataType'], ['url', 'file'])) {
                    $colByAlias[$tableId][$field]['extField'] = strtolower($columns[$i]['ext_field']);
                }

                if (in_array($colByAlias[$tableId][$field]['dataType'], ['lookup', 'tagbox', 'treeview', 'buttongroup', 'list', 'card'])) {
                    if ($columns[$i]['xml'])
                        $this->getColumnTemplate($columns[$i]['xml'], $colByAlias[$tableId][$field]);


                    $colByAlias[$tableId][$field]['id'] = $columns[$i]['sql_id'];
                    $colByAlias[$tableId][$field]['extField'] = strtolower($columns[$i]['ext_field']);

                    if ($this->getLookupSQL($columns[$i]['sql_id'], 2) == false) {
                        $colByAlias[$tableId][$field]['canAdd'] = false;
                    } else {
                        $colByAlias[$tableId][$field]['canAdd'] = true;
                    }
                }
                $tCols[$columns[$i]['table_id']][] = $columns[$i];

                if ($columns[$i]['footer_function'] !== null && $columns[$i]['is_use_to_view'] && $columns[$i]['is_visible']) {
                    $sum[$tableId][] = ['column' => $colByAlias[$tableId][$field]['dataField'],
                        'summaryType' => trim($columns[$i]['footer_function']),
                        'valueFormat' => $colByAlias[$tableId][$field]['format']];
                    $colByAlias[$tableId][$field]['summaryType'] = trim($columns[$i]['footer_function']);
                }
            }

            foreach ($colByAlias as $idx => $item) {
                $this->getColumnsDependencies($tCols[$idx], $colByAlias[$idx]);
                $this->afterGetTableColumns($colByAlias[$idx]);


                $result[$idx] = array('columns' => $colByAlias[$idx], 'summaries' => $sum[$idx]);
            }


            $this->saveCache($key, $result);
        }

        return $result;
    }

    protected function parseColumnTypes($column_type)
    {
        $res = [];
        $pattern = '/\[(.+?)\]/';
        $arrType = explode(';', $column_type);
        if (count($arrType) > 1) {
            foreach ($arrType as $type) {
                if (preg_match($pattern, $type, $matches)) {
                    $arrParam = explode(',', $matches[1]);
                    $type = preg_replace($pattern, "", $type);
                    $res[] = [$type => $arrParam];
                } else {
                    $res[] = $type;
                }
            }
            return $res;
        }
        return $column_type;
    }

    protected function afterGetTableColumns(&$columns)
    {
        //if ($tableType == 'grid') {
        $this->afterGridGetTableColumns($columns);
        //}
        //if ($tableType == 'pivot') {
        $this->afterPivotGetTableColumns($columns);
        //}
    }

    protected function afterGridGetTableColumns(&$columns)
    {
        foreach ($columns as $index => $column) {
            if (isset($column['template'])) {
                // Скрываем все столбцы, которые попадают в сводный столбец
                $columnsV = [];

                if (preg_match_all('/\$\S+\$/', $column['template'], $columnsV)) {
                    foreach ($columnsV[0] as $item) {
                        $key = $this->getColumnByField($columns, str_replace('$', '', $item));
                        if ($key) {
                            $columns[$key]['visible'] = false;
                            $columns[$index]['usedColumns'][] = str_replace('$', '', $item);
                        }
                    }
                }
            }
        }
    }

    protected function afterPivotGetTableColumns(&$columns)
    {
        foreach ($columns as $index => $column) {
            if ($column['columnType']) {
                $columns[$index]['area'] = $column['columnType'];
            }
        }
    }

    protected function getGridColumnFormat($column, &$colByAlias)
    {
        switch ($column['column_format']) {
            case 'block':
                $xml = $this->getColumnTemplate($column['xml'], $colByAlias);
                $colByAlias['dataType'] = 'block';
                break;
        }
    }

    protected function getColumnTemplate($xml, &$colByAlias)
    {
        $xml = preg_replace('#(<footer>(.*?)<\/footer>)#is', '', $xml);
        $colByAlias['template'] = $this->parser->parseColumn($xml);
        //$colByAlias['template'] = $this->parser->getXmlTemplate($xml);
    }


    /* Ищем и проставляем зависимые столбцы в столбец, от которого зависит */
    protected function getColumnsDependencies($columns, &$colByAlias)
    {
        foreach ($columns as $idx => $column) {
            if ($column['sql_id']) {
                $sql = $this->getLookupSQL($column['sql_id']);
                $params = $this->function->getParamFromSQL($sql, true);
                if (count($params) != 0) {
                    $this->setColumnDependencies($column['field'], $params, $colByAlias, 'data');
                    $col = &$colByAlias[$column['field']];
                    $col['dataConditions'] = $params;
                }

                $sql = $this->getLookupSQL($column['sql_id'], 2);
                $params = $this->function->getParamFromSQL($sql, true);
                unset($params['item']);
                if (count($params) != 0) {
                    $this->setColumnDependencies($column['field'], $params, $colByAlias, 'insert');
                    $col = &$colByAlias[$column['field']];
                    $col['insertConditions'] = $params;
                }

                if ($colByAlias[$column['field']]['dataType'] == 'lookup') {
                    $sql = $this->getLookupSQL($column['sql_id'], 3);
                    $params = $this->function->getParamFromSQL($sql, true);
                    unset($params['item']);
                    if (count($params) != 0) {
                        $this->setColumnDependencies($column['field'], $params, $colByAlias, 'update');
                        $col = &$colByAlias[$column['field']];
                        $col['updateConditions'] = $params;
                    }
                }
            }

            if ($column['visible_condition']) {
                $params = $this->function->getParamFromSQL($column['visible_condition'], true);
                if (count($params) != 0) {
                    $this->setColumnDependencies($column['field'], $params, $colByAlias, 'visible');
                }
            }

            if ($column['edit_condition']) {
                $params = $this->function->getParamFromSQL($column['edit_condition'], true);
                if (count($params) != 0) {
                    $this->setColumnDependencies($column['field'], $params, $colByAlias, 'edit');
                }
            }

            if ($column['title'] && $column['title'][0] == '=') {
                $params = $this->function->getParamFromSQL($column['title'], true);
                if (count($params) != 0) {
                    $this->setColumnDependencies($column['field'], $params, $colByAlias, 'caption');
                }
            }


            if ($column['have_to_fill'] || $column['column_restrictions']) {
                $params = $this->function->getParamFromSQL($column['have_to_fill'] . ' ' . $column['column_restrictions'], true);
                if (count($params) != 0) {
                    $this->setColumnDependencies($column['field'], $params, $colByAlias, 'restrictions');
                }
            }

            if ($column['default_value']) {
                $params = $this->function->getParamFromSQL($column['default_value'], true);
                if (count($params) != 0) {
                    $this->setColumnDependencies($column['field'], $params, $colByAlias, 'value');
                }
            }

            /*if ($column['have_to_fill']) {
                $params = $this->function->getParamFromSQL($column['have_to_fill'], true);
                if (count($params) != 0) {
                    $this->setColumnDependencies($column['field'], $params, $colByAlias, 'required');
                }
            }

            if ($column['column_restrictions']) {
                $params = $this->function->getParamFromSQL($column['column_restrictions'], true);
                if (count($params) != 0) {
                    $this->setColumnDependencies($column['field'], $params, $colByAlias, 'restrictions');
                }
            }*/
        }
    }


    protected
    function setColumnDependencies($dataField, $params, &$colByAlias, $idx)
    {
        foreach ($params as $param) {
            $complexParam = $param;
            $param = explode('.', $param)[0];

            if (isset($colByAlias[$param])) {
                $column = &$colByAlias[$param];
                if ($column && !in_array($dataField, $column['dependencies'][$idx])) {
                    if (!isset($column['dependencies'])) $column['dependencies'] = [];
                    if (!isset($column['dependencies'][$idx])) $column['dependencies'][$idx] = [];
                    if ($param != $dataField || ($idx == 'restrictions'/* && count($params) == 1*/) || ($idx == 'caption') || ($idx == 'update'))
                        $column['dependencies'][$idx][] = $dataField;
                }
            }
        }
    }

    /**
     * Возвращает массив имен параметров, если таковые присутствуют в запросе
     * @param string $sql
     * @return array array of parameters names
     */
    protected
    function extractParams($sql)
    {
        $params = array();
        $regexp = '/\:([a-zA-Z]\w+)/si';
        if (preg_match_all($regexp, $sql, $m)) {
            foreach ($m[0] as $idx => $val) {
                $column = $m[1][$idx];
                if (!in_array($column, $params))
                    $params[] = strtolower($column);
            }
        }
        return $params;
    }

    protected
    function getColumnByField($columns, $field)
    {
        foreach ($columns as $key => $column) {
            if ($column['dataField'] == $field) return $key;
        }
        return false;
    }

    protected
    function getIdFieldAndTableName($table)
    {
        $sql = $this->getInsertSql($table);
        if ($sql != '') {
            $words = preg_split('/[\s\n]+/', $sql);
            return ['idField' => $words[4], 'tableName' => $words[2]];
        }

        $sql = $this->getUpdateSql($table);
        if ($sql != '') {
            $words = preg_split('/[\s\n]+/', $sql);
            return ['idField' => $words[3], 'tableName' => $words[1]];
        }

        $sql = $this->getDeleteSql($table);
        if ($sql != '') {
            $words = preg_split('/[\s\n]+/', $sql);
            return ['idField' => $words[4], 'tableName' => $words[2]];
        }
        return null;
    }

    protected
    function getColumnFormat($column, &$colByAlias)
    {
        switch ($column['column_format']) {
            case 'colorbox':
                $colByAlias['dataType'] = 'colorbox';
                break;
            case 'b':
                $colByAlias['dataType'] = 'boolean';
                break;

            case 'd':
                $colByAlias['dataType'] = 'date';
                $colByAlias['format'] = 'dd.MM.y';
                break;

            case 'time':
                $colByAlias['dataType'] = 'time';
                //  $colByAlias['format'] = 'HH:mm';
                break;
            case 'datetime':
            case 'dt':
                $colByAlias['dataType'] = 'datetime';
                break;
            case '':
                $colByAlias['dataType'] = 'string';
                break;
            case 'img':
                $colByAlias['dataType'] = 'image';
                break;
            case 'file':
                $colByAlias['dataType'] = 'file';
                break;
            case 'g':
                $colByAlias['dataType'] = 'grid';
                break;
            case 'be':
                $colByAlias['dataType'] = 'tagbox';
                break;
            case 'treeview':
                $colByAlias['dataType'] = 'treeview';
                break;
            case 'color':
                $colByAlias['dataType'] = 'color';
                break;
            case 'url':
                $colByAlias['dataType'] = 'url';
                break;
            case 'chart':
                $colByAlias['dataType'] = 'chart';
                break;
            case 'kanban':
                $colByAlias['dataType'] = 'kanban';
                break;
            case 'bg':
                $colByAlias['dataType'] = 'buttongroup';
                break;
            case 'list':
                $colByAlias['dataType'] = 'list';
                break;
            case 'draglist':
                $colByAlias['dataType'] = 'draglist';
                break;
            case 'card':
                $colByAlias['dataType'] = 'card';
                break;
            case 'html':
                $colByAlias['dataType'] = 'html';
                break;
            case 'layout':
                $colByAlias['dataType'] = 'layout';
                break;
            default:
                // Разбираем число
                if ($column['column_format'] && $column['column_format'][0] == 'n') {
                    // Разделяем на 2 части по @, чтобы отделить часть формата
                    $parts = explode('@', $column['column_format']);
                    if ($parts[0] && preg_match('/n(,?)(\.?)(\d*)(\'(\w*)?\'){0,1}/i', $parts[0], $m)) {
                        if ($column['sql_id']) {
                            $colByAlias['dataType'] = 'lookup';
                        } else {
                            $colByAlias['format']['type'] = 'fixedPoint';
                            $colByAlias['dataType'] = 'number';
                            if (empty($m[2])) {
                                $colByAlias['format']['precision'] = '0';
                            } else {
                                if ($m[3])
                                    $colByAlias['format']['precision'] = $m[3];
                            }
                        }
                    }
                    if ($parts[1]) {
                        $colByAlias['format']['postCaption'] = $parts[1];//substr($parts[1], 1, strlen($parts[1]) - 2);
                    }
                } else
                    // Иначе строка
                    $colByAlias['dataType'] = 'string';
        }
    }

    protected
    function getTableInfo($id)
    {
        $result = $this->getAllTablesInfo();
        $this->tableInfo = $result[$id];
    }

    public function actionGetalltablesinfo()
    {
        $result = $this->getAllTablesInfo();
        $res = [];
        foreach ($result as $idx => $item) {
            $this->tableInfo = $item;
            $res[$idx] = $this->convertTableToApp();
        }
        return json_encode($res);
    }

    protected function getAllTablesInfo()
    {

        $key = 'tableinfo';
        //Yii::$app->cache->flush($key);
        $result = $this->getCache($key);
        if ($result === false) {
            if (empty($this->mainSQLs['tableSQL']))
                throw new HttpException(500, 'Ошибка первого запроса: Нет запроса на получение информации от таблице');
            $params = [':user_id' => $this->userID];
            $result = $this->selectAll($this->mainSQLs['tableSQL'], $params, $this->db);
            $res = [];
            if ($result['success']) {
                $result = $result['success'];

                foreach ($result as $idx => $item) {
                    $res[$item['table_id']] = $item;
                    $res[$item['table_id']]['table_type'] = $this->getTableTypeUrl($item['table_type']);
                    if (isset($item['import_procedure']) && trim($item['import_procedure']) != '') {
                        $res[$item['table_id']]['import'] = [];
                        $res[$item['table_id']]['importProcedureParameters'] = $this->getImportProcedureParameters($item['import_procedure']);
                    }
                }
            }
            $this->saveCache($key, $res);
            $result = $res;
        }
        return $result;
    }

    public
    function actionTableinfo($table)
    {
        $this->getTableInfo($table);
        return json_encode($this->convertTableToApp());
    }

    protected function convertTableToApp()
    {
        $ti = [];
        $ti['name'] = $this->tableInfo['name'];
        $ti['a'] = $this->tableInfo['a'];
        $ti['v'] = $this->tableInfo['v'];
        $ti['e'] = $this->tableInfo['e'];
        $ti['d'] = $this->tableInfo['d'];
        $ti['formId'] = $this->tableInfo['form_id'];
        $ti['tableId'] = $this->tableInfo['table_id'];
        $ti['titleField'] = strtolower($this->tableInfo['title_field']);
        $ti['importProc'] = strtolower($this->tableInfo['import_procedure']);
        $ti['view'] = strtolower($this->tableInfo['view_type']);
        if (isset($this->tableInfo['importProcedureParameters'])) {
            $ti['import'] = $this->tableInfo['importProcedureParameters'];
        }
        if (isset($this->tableInfo['icon_name'])) {
            $ti['iconName'] = $this->tableInfo['icon_name'];
        }
        if (isset($this->tableInfo['show_in_toolbar'])) {
            $ti['showInToolbar'] = $this->tableInfo['show_in_toolbar'];
        } else
            $ti['showInToolbar'] = 0;
        if (isset($this->tableInfo['description']))
            $ti['description'] = $this->tableInfo['description'];

        if (isset($this->tableInfo['check_procedure'])) {
            $ti['checkProc'] = $this->function->getParamFromSql($this->tableInfo['check_procedure'], true);
        }

        if (isset($this->tableInfo['close_procedure'])) {
            $ti['closeProc'] = $this->function->getParamFromSql($this->tableInfo['close_procedure'], true);
        }

        if (isset($this->tableInfo['cancel_procedure'])) {
            $ti['cancelProc'] = $this->function->getParamFromSql($this->tableInfo['cancel_procedure'], true);
        }

        if (isset($this->tableInfo['refresh_afterupdate'])) {
            $ti['refreshAll'] = $this->tableInfo['refresh_afterupdate'] ? true : false;
        }

        // Обрабатываем запросы на изменение в поисках параметров
        if (isset($this->tableInfo['selectsql'])) {
            $ti['selParams'] = $this->function->getParamFromSql($this->tableInfo['selectsql'] . ' ' . $this->tableInfo['selectwhere'], true);
            $ti['selParams'] = array_diff($ti['selParams'], ['company_id', 'user_id', 'ext_id', 'lang', '__user_client_id__']);
            $ti['selParams'] = array_values($ti['selParams']);
        }
        if (isset($this->tableInfo['insertsql']))
            $ti['insParams'] = $this->function->getParamFromSql($this->tableInfo['insertsql'], true);
        if (isset($this->tableInfo['updatesql']))
            $ti['updParams'] = $this->function->getParamFromSql($this->tableInfo['updatesql'], true);
        if (isset($this->tableInfo['deletesql']))
            $ti['delParams'] = $this->function->getParamFromSql($this->tableInfo['deletesql'], true);
        if (isset($this->tableInfo['insert_connect_sql']))
            $ti['insConParams'] = $this->function->getParamFromSql($this->tableInfo['insert_connect_sql'], true);


        $tableOrigin = $this->getIdFieldAndTableName($this->tableInfo['table_id']);
        if (isset($tableOrigin)) {
            $ti['idField'] = $tableOrigin['idField'];
            $ti['tableName'] = $tableOrigin['tableName'];
        }

        if (isset($this->tableInfo['table_type']))
            $ti['tableType'] = $this->tableInfo['table_type'];
        return $ti;
    }

    public
    function actionGetcols($table)
    {
        $this->getTableInfo($table);
        $tableType = $this->tableInfo['table_type'];
        $columns = $this->getTableColumns($table, $tableType);
        $columns = json_encode($columns, JSON_UNESCAPED_UNICODE);
        return $columns;
    }

    public
    function actionGetallcols()
    {
        $columns = $this->getAllTablesColumns();

        return json_encode($columns);
    }

    protected
    function addSelectWhere(&$sql, $tableId)
    {
        $this->getTableInfo($tableId);
        if ($this->tableInfo['selectwhere']) {
            $where = '';
            $whereIdx = false;// strrpos($sql, 'where');
            $groupIdx = strrpos($sql, 'group by');
            if ($whereIdx !== false || $groupIdx !== false) {
                if ($whereIdx !== false && $groupIdx !== false && $groupIdx < $whereIdx)
                    $groupIdx = false;
                if ($whereIdx !== false && $groupIdx !== false) {
                    $start = $whereIdx + strlen('where');
                    $where = substr($sql, $start, $groupIdx - $start);
                } elseif ($whereIdx !== false)
                    $where = substr($sql, $whereIdx + strlen('where'));
            }
            if ($whereIdx !== false && $groupIdx !== false) {
                $where = ' (' . $where . ') and (' . $this->tableInfo['selectwhere'] . ') ';
                $sql1 = substr($sql, 0, $whereIdx);
                $sql2 = substr($sql, $groupIdx);
                $sql = $sql1 . ' where ' . $where . $sql2;
            } elseif ($whereIdx !== false) {
                $where = ' (' . $where . ') and (' . $this->tableInfo['selectwhere'] . ') ';
                $sql1 = substr($sql, 0, $whereIdx);
                $sql = $sql1 . ' where ' . $where;
            } elseif ($groupIdx !== false) {
                $where = ($where ? ' (' . $where . ') and ' : '') . ' (' . $this->tableInfo['selectwhere'] . ') ';
                $sql1 = substr($sql, 0, $groupIdx);
                $sql2 = substr($sql, $groupIdx);
                $sql = $sql1 . ' where ' . $where . $sql2;
            } else {
                $where = ($where ? ' (' . $where . ') and ' : '') . ' (' . $this->tableInfo['selectwhere'] . ') ';
                $sql .= ' where ' . $where;
            }
        }
    }

    protected
    function applyMagic(&$sql, $filter = false)
    {
        // Magic!
        if ($filter)
            $sql = "select * from ($sql) where " . $filter;
        else
            $sql = "select * from ($sql)";
    }

    protected
    function getSelectSql($id)
    {
        $this->getTableInfo($id);
        $select = $this->tableInfo['selectsql'];
        // Additional where
        $this->addSelectWhere($select, $id);
        //  Применяем волшебство, устраняющее все проблемы с именами столбцов!
        $this->applyMagic($select);
        return $select;
    }

    protected
    function getUpdateSql($id)
    {
        $this->getTableInfo($id);
        $updatesql = $this->tableInfo['updatesql'];
        if (false !== strpos($updatesql, '?'))
            $updatesql = str_replace('?', ':ext_id', $updatesql);
        return $updatesql;
    }

    protected
    function getDeleteSql($id)
    {
        $this->getTableInfo($id);
        $deletesql = $this->tableInfo['deletesql'];
        if (false !== strpos($deletesql, '?'))
            $deletesql = str_replace('?', ':ext_id', $deletesql);
        return $deletesql;
    }

    protected
    function getInsertSql($id)
    {
        $this->getTableInfo($id);
        $insertsql = $this->tableInfo['insertsql'];
        return $insertsql;
    }

    protected
    function getInsertConnectSql($id)
    {
        $this->getTableInfo($id);
        $insertsql = $this->tableInfo['insert_connect_sql'];
        return $insertsql;
    }

    protected
    function getRefreshSql($id)
    {
        $this->getTableInfo($id);
        $refreshsql = $this->tableInfo['refreshsql'];
        if (false !== strpos($refreshsql, '?'))
            $refreshsql = str_replace('?', ':ext_id', $refreshsql);
        return $refreshsql;
    }

    protected function getFilterSql($filter)
    {
        $result = '';
        if (!empty($filter)) {
            foreach ($filter as $index => $ff) {
                if (is_array($ff)) {
                    $result .= '(';
                    $result .= $this->getFilterSql($ff);
                    $result .= ')';
                } else {
                    // if ($ff == end($filter))
                    if ($index == 2)
                        if ($ff === null)
                            $result .= ' null ';
                        else
                            $result .= ' \'' . $ff . '\' ';
                    else
                        $result .= ' ' . $ff . ' ';
                }
            }
        }
        return $result;
    }

    public
    function actionTabledata(/*$id, $extId = null, $mode = null*/)
    {
        //Yii::info($_REQUEST, 'dev_log');
        $id = Yii::$app->request->post('table', false);
        $extId = Yii::$app->request->post('extId', null);
        $mode = Yii::$app->request->post('mode', null);
        $selParams = Yii::$app->request->post('selParams', false);
        $selParams = json_decode($selParams, true);
        $filter = Yii::$app->request->post('filter', false);
        if ($filter) {
            $filter = json_decode($filter, true);
            //Yii::info($filter, 'dev_log');
            $filter = $this->getFilterSql($filter);
            //Yii::info($filter, 'dev_log');
        }
        $transaction = $this->ddb->beginTransaction();
        try {
            // Добавление данных

            if ($mode == 'ins') {
                $tableOrigin = $this->getIdFieldAndTableName($id);
                $insertDefaultSql = "insert into {$tableOrigin['tableName']} default values returning {$tableOrigin['idField']}";
                $valuesList = $this->ddb->createCommand($insertDefaultSql, [])->queryOne();
                $extId = $valuesList[$tableOrigin['idField']];
            }

            $selectSQL = $this->getSelectSql($id);
            $refreshSQL = '';
            if ($mode == 'ins') {
                $refreshSQL = $this->getRefreshSql($id) . trim();
                if ($refreshSQL != '') {
                    $selectSQL = str_replace('?', ':ext_id', $refreshSQL);
                }
            }
            $user = User::findIdentity(Yii::$app->user->id);
            $params = [':user_id' => $this->userID, ':ext_id' => $extId, ':lang' => $this->appLang, ':company_id' => $user->company_id, ':__user_client_id__' => $user->client_id];
            if ($selParams) {
                $params = array_merge($params, $selParams);
            }

            $req = $this->function->getCorrectSql($selectSQL, $this->function->getParamFromSql($selectSQL), $params);

            if ($filter) {
                //$this->applyMagic($req['sql'], $filter);
                $req['sql'] .= ' where ' . $filter;
                //Yii::info($req['sql'], 'dev_log');
            }

            //Yii::info($req['sql'], 'dev_log');
            $dataList = $this->ddb->createCommand($req['sql'], $req['params'])->queryAll();
            if ($mode == 'ins')
                $transaction->rollback();
            else
                $transaction->commit();


            if ($mode == 'ins') {
                $dataList['ext_id'] = $extId;
                if (isset($tableOrigin))
                    $dataList['ext_field'] = strtolower($tableOrigin['idField']);
            }

            $this->solveFormatProblems($dataList, $id);

            return json_encode($dataList);

        } catch (ErrorException $ex) {
            $transaction->rollback();
            echo json_encode(array(
                'success' => false,
                'error' => $ex->getMessage()
            ));
        }
    }

    protected function solveFormatProblems(&$dataList, $id)
    {
        $this->getTableInfo($id);
        $tableType = $this->tableInfo['table_type'];
        $columns = $this->getTableColumns($id, $tableType)['columns'];
        foreach ($columns as $dataField => $column) {
            // Разрешаем проблему с числами с плавающей точкой
            if (isset($column['format']['type']) &&
                $column['dataType'] == 'number' &&
                $column['format']['precision'] > 0) {
                foreach ($dataList as $upkey => $data) {
                    if (isset($data[$dataField])) {
                        $dataList[$upkey][$dataField] = floatval($dataList[$upkey][$dataField]);
                    }
                }
            }
            // Разрешаем проблему с булевыми значениями
            if ($column['dataType'] == 'boolean') {
                foreach ($dataList as $upkey => $data) {
                    if (isset($data[$dataField])) {
                        $dataList[$upkey][$dataField] = $dataList[$upkey][$dataField] == 0 ? false : true;
                    }
                }
            }
        }
        return $dataList;
    }

    public
    function actionTablerow($id, $extId = null)
    {
        try {
            $selectSQL = $this->getRefreshSql($id);
            $params = [':user_id' => $this->userID, ':ext_id' => $extId, ':lang' => $this->appLang, ':company_id' => 1];

            $resSQL = $this->selectAll($selectSQL, $params, $this->ddb);
            if (isset($resSQL['success'])) {
                $dataList = $resSQL['success'];
            } else {
                throw new HttpException(500, $resSQL['error']);
            }

            $dataList = $this->solveFormatProblems($dataList, $id);

            return json_encode($dataList);

        } catch (ErrorException $ex) {
            echo json_encode(array(
                'success' => false,
                'error' => $ex->getMessage()
            ));
        }
    }

    public
    function actionDelete($table, $extId, $lang)
    {
        // получаем запрос
        $sql = trim($this->getDeleteSql($table));
        $this->getTableInfo($table);
        if ($sql != '') {
            $params = [':ext_id' => $extId, ':lang' => $lang];
            if (strpos($sql, 'select') === false)
                return $this->executeSQL($sql, $params);
            else {
                $resSQL = $this->selectOne($sql, $params, $this->ddb);
                if (isset($resSQL['success'])) {
                    $result = $resSQL;
                } else {
                    return json_encode(array(
                        'success' => false,
                        'error' => $resSQL['error']
                    ));
                    //throw new HttpException(500, $resSQL['error']);
                }
                return json_encode($result);
            }
        } else {
            return json_encode(array(
                'success' => false,
                'error' => 'Ошибка! Отсутствует SQL-запрос на удаление записи.'
            ));
        }
    }

    /*
     * Функция получения данных лукапа
     * */
    public
    function actionGetlookup(/*$id, $params*/)
    {
        $id = Yii::$app->request->post('id');
        $params = Yii::$app->request->post('params', null);
        //$params = json_decode($params, true);

        $selParams = Yii::$app->request->post('selParams', array());
        //$selParams = json_decode($selParams, true);


        $sql = $this->getLookupSQL($id);
        //$params = json_decode($params, true);
        $user = User::findIdentity(Yii::$app->user->id);

        $addParams = [':user_id' => $this->userID, ':lang' => $this->appLang, ':company_id' => $user->company_id, ':__user_client_id__' => $user->client_id];
        $params = $this->function->convertArrayToParams($params);
        $params = array_merge($params, $addParams, $selParams);

        if ($params) {
            $resSQL = $this->selectAll($sql, $params, $this->ddb);
        } else {
            $resSQL = $this->selectAll($sql, array(), $this->ddb);
        }

        //$resSQL = $this->selectAll($sql, $params, $this->ddb);
        if (isset($resSQL['success'])) {
            $result = $resSQL['success'];
        } else {
            throw new HttpException(500, $resSQL['error']);
        }
        /*
        try {
            // return print_r($sql);
            if ($params) {
                $req = $this->function->getCorrectSql($sql, $this->function->getParamFromSql($sql), $this->function->convertArrayToParams($params));
                $result = $this->ddb->createCommand($req['sql'], $req['params'])->queryAll();
            } else
                $result = $this->ddb->createCommand($sql, [])->queryAll();
        } catch (Exception $ex) {
            echo json_encode(array(
                'success' => false,
                'error' => $ex->getMessage()
            ));
        }
        */
        return json_encode($result);
    }

    /*
     * Функция получения значения лукапа
     * */
    public
    function actionGetlookupvalues($id, $params)
    {
        $sql = $this->getLookupSQL($id, 5);
        if ($params === "{}") $params = null;
        $params = json_decode($params, true);
        $params['company_id'] = 1;

        if ($params) {
            $resSQL = $this->selectAll($sql, $this->function->convertArrayToParams($params), $this->ddb);
        } else {
            $resSQL = $this->selectAll($sql, array(), $this->ddb);
        }

        //$resSQL = $this->selectAll($sql, $params, $this->ddb);
        if (isset($resSQL['success'])) {
            $result = $resSQL['success'];
        } else {
            throw new HttpException(500, $resSQL['error']);
        }

        //echo $params;
        /*
        try {
            // return print_r($sql);
            if ($params) {
                $req = $this->function->getCorrectSql($sql, $this->function->getParamFromSql($sql), $this->function->convertArrayToParams($params));
                $result = $this->ddb->createCommand($req['sql'], $req['params'])->queryAll();
            } else
                $result = $this->ddb->createCommand($sql, [])->queryAll();
        } catch (Exception $ex) {
            echo json_encode(array(
                'success' => false,
                'error' => $ex->getMessage()
            ));
        }
        */
        return json_encode($result);
    }

    /*
     * Функция добавления данных в лукап
     * */
    public
    function actionInsertlookup()
    {
        $id = Yii::$app->request->post('id', false);
        $params = Yii::$app->request->post('params', false);

        if ($id && $params) {
            $sql = $this->getLookupSQL($id, 2);
            if ($sql == '') {
                return null;
            }
            $sql = str_replace('?', ':item', $sql);
            $params['company_id'] = 1;
            //$params = ['item' => $value];

            if ($params) {
                $resSQL = $this->selectOne($sql, $this->function->convertArrayToParams($params), $this->ddb);
            } else {
                $resSQL = $this->selectOne($sql, array(), $this->ddb);
            }

            //$resSQL = $this->selectOne($sql, $params, $this->ddb);
            if (isset($resSQL['success'])) {
                $result = $resSQL['success'];
            } else {
                throw new HttpException(500, $resSQL['error']);
            }
        }
        return json_encode($result);
    }

    public
    function actionUpdatelookup()
    {
        $id = Yii::$app->request->post('id', false);
        $params = Yii::$app->request->post('params', false);
        $params = json_decode($params, true);
        if ($id && $params) {
            $sql = $this->getLookupSQL($id, 3);
            if ($sql == '') {
                return null;
            }
            $sql = str_replace('?', ':item', $sql);
            $params['company_id'] = 1;
            //$params = ['item' => $value];

            if ($params) {
                $result = $this->executeSQL($sql, $this->function->convertArrayToParams($params));
            } else {
                $result = $this->executeSQL($sql, array());
            }
        } else $result = [];
        return json_encode($result);
    }

    function getLookupSQL($id, $ttype = 1)
    {
        //$cache = Yii::$app->cache;
        $sqls = $this->getAllLookupSQL();
        return $sqls[$id][$ttype];
    }

    protected
    function getAllLookupSQL()
    {
        //$cache = Yii::$app->cache;
        $key = 'lookupsql';
        $result = $this->getCache($key);
        if ($result === false) {
            $sql = 'select text, sql_id, ttype from sel_text';

            $resSQL = $this->selectAll($sql, [], $this->db);
            if (isset($resSQL['success'])) {
                $result = [];
                foreach ($resSQL['success'] as $item) {
                    $result[$item['sql_id']][$item['ttype']] = $item['text'];
                }
            } else {
                throw new HttpException(500, $resSQL['error']);
            }
            $this->saveCache($key, $result);
        }
        return $result;
    }

    public
    function actionUpdate()
    {
        $table = Yii::$app->request->post('table');
        $ext_id = Yii::$app->request->post('ext_id');
        $data = Yii::$app->request->post('data');
        $type = Yii::$app->request->post('type');
        $data = json_decode($data, true);

        if (count($data) == 0) {
            return json_encode(array(
                'success' => true
            ));
        }

        $params = [];
        foreach ($data as $key => $value) {
            if ($value === '') $value = null;
            $params[':' . $key] = trim($value);
        }

        if ($type == 'upd') {
            $updateSQL = strtolower($this->getUpdateSql($table));
            if (trim($updateSQL) == '') {
                return json_encode(array(
                    'success' => false,
                    'error' => 'Ошибка! Отсутствует SQL-запрос на обновление записи.'
                ));
            }
            $this->getTableInfo($table);
            if (count($this->tableInfo->updParams))
                return $this->executeSQL($updateSQL, $params);
            else {
                $sql = '';
                foreach ($data as $key => $value) {
                    if ($sql != '') $sql .= ", \n";
                    $sql .= $key . ' = :' . $key;
                }
                $sql = 'set ' . $sql . "\n where";

                $pos = strpos($updateSQL, 'where');

                $params[':ext_id'] = $ext_id;

                if ($pos !== false) {
                    //$this->getTableInfo($table);
                    //if (!count($this->tabeInfo->updParams))
                    $updateSQL = str_replace('where', $sql, $updateSQL);
                    return $this->executeSQL($updateSQL, $params);
                }
            }
        }

        if ($type == 'ins') {
            $insertSQL = strtolower($this->getInsertSql($table));
            if (trim($insertSQL) == '') {
                return json_encode(array(
                    'success' => false,
                    'error' => 'Ошибка! Отсутствует SQL-запрос на добавление записи.'
                ));
            }
            $tableOrigin = $this->getIdFieldAndTableName($table);
            if ($tableOrigin['idField'] != 'id') {
                unset($data['id']);
            }
            $data[$tableOrigin['idField']] = $ext_id;
            $params[':' . $tableOrigin['idField']] = $ext_id;

            $values = '';
            $fields = '';
            foreach ($data as $key => $value) {

                if ($values != '')
                    $values .= ", ";
                $values .= ':' . $key;

                if ($fields != '')
                    $fields .= ", ";
                $fields .= $key;
            }
            $sql = "($fields)\nvalues ($values)\n returning";

            $pos = strpos($insertSQL, 'returning');

            if ($pos !== false) {
                $insertSQL = str_replace('returning', $sql, $insertSQL);
                return $this->executeSQL($insertSQL, $params);
            }
        }
    }

    protected
    function getImportProcedureParameters($pname)
    {
        $sql = 'select cast(RDB$PARAMETER_NAME as varchar(50)) parameter_name, RDB$DESCRIPTION description, 1 as required
            from rdb$procedure_parameters a
            where upper(a.rdb$procedure_name) = upper(:pname)
              and rdb$parameter_type = 0
            order by rdb$parameter_number ';

        $params = [':pname' => $pname];
        $resSQL = $this->selectAll($sql, $params, $this->ddb);
        if (isset($resSQL['success'])) {
            $result = $resSQL['success'];
        } else {
            throw new HttpException(500, $resSQL['error']);
        }


        //$req = $this->function->getCorrectSql($sql, $this->function->getParamFromSql($sql), $params);

        //$result = $this->ddb->createCommand($req['sql'], $req['params'])->queryAll();
        return $result;
    }

    public
    function actionUploadfile($field)
    {

        $model = new FileUploadForm();
        //if (Yii::$app->request->isPost) {
        $model->files = UploadedFile::getInstanceByName($field);
        //$model->files = $_FILES['file']['name'];
        if ($filename = $model->uploadHere()) {
            // your code here
            return json_encode($filename);
        }
        //}
        return json_encode('error');

    }

    protected
    function saveRow($data, $proc)
    {
        $params = [];
        $fields = '';
        $proc = strtolower($proc);
        //print_r($data);
        foreach ($data as $key => $val) {
            $key = strtolower($key);
            $params[':' . $key] = $val;
            if ($fields != '')
                $fields .= ", ";
            $fields .= ":" . $key;
        }
        $sql = "select error_string from $proc($fields)";
        //$req = $this->function->getCorrectSql($sql, $this->function->getParamFromSql($sql), $params);
        //$result = $this->db->createCommand($req['sql'], $req['params'])->queryOne();
        return $this->selectOne($sql, $params, $this->ddb);
    }

    protected
    function setRow($arrkey, $data)
    {
        $res = [];
        foreach ($arrkey as $key => $val) {
            $res[$val] = $data[$key];
        }
        return $res;
    }

    protected
    function checkRow($columns, $data)
    {
        $res = [];
        foreach ($data as $key => $val) {
            foreach ($columns as $col) {
                if ($col['required'] == 1 && $key == trim(strtolower($col['parameter_name']))) {
                    if (!trim($val) || trim($val) == '') {
                        $res[] = 'Не заполнен обязательный столбец ' . $key;
                    }
                }
            }
        }
        return $res;
    }

    protected
    function checkCol($arrkey, $columns)
    {
        foreach ($columns as $col) {
            if (in_array(trim(strtolower($col['parameter_name'])), $arrkey)) {
                if (($key = array_search(trim(strtolower($col['parameter_name'])), $arrkey)) !== false) {
                    unset($arrkey[$key]);
                }
            }
        }
        return array_values($arrkey);;
    }

    protected
    function checkReqCol($arrkey, $columns)
    {
        $res = [];
        foreach ($columns as $col) {
            if ($col['required'] == 1) {
                $is_col = false;
                foreach ($arrkey as $key) {
                    if (trim(strtolower($col['parameter_name'])) == $key) {
                        //есть такой столбец
                        $is_col = true;
                        break;
                    }
                }
                if (!$is_col) {
                    $res[] = $key;
                }
            }
        }
        return $res;
    }

    public
    function actionImportfromfiles()
    {
        $extensions = array('csv', 'xlsx', 'xls');
        $errors = [];
        //if (Yii::$app->request->isGet) {
        if (Yii::$app->request->isPost) {
            $files[] = Yii::$app->request->post('files');
            $table_id = Yii::$app->request->post('table_id');
            //$files[] = Yii::$app->request->get('files');
            //$table_id = Yii::$app->request->get('table_id');
            //echo $files;
            if (!empty($files)) {
                $this->getTableInfo($table_id);
                if ($this->tableInfo['a'] !== 1) {
                    $errors[] = 'Нет разрешения на импорт данных';
                }
                if (empty($this->tableInfo['importProcedureParameters'])) {
                    $errors[] = 'Нет описаний столбцов для импорта';
                }
                if (empty($this->tableInfo['import_procedure'])) {
                    $errors[] = 'Нет процедуры импорта для этой таблицы';
                }
                //print_r($this->tableInfo);
                if (empty($errors)) {
                    require_once(dirname(__DIR__) . '/components/spreadsheet-reader/SpreadsheetReader.php');
                    require_once(dirname(__DIR__) . '/components/spreadsheet-reader/php-excel-reader/excel_reader2.php');
                    foreach ($files as $file) {
                        //проверяем расширение файла
                        $ext = pathinfo($file, PATHINFO_EXTENSION);
                        if (!in_array($ext, $extensions)) {
                            $errors[] = 'Неправильное расширение файла - ' . $file;
                            //выводим ошибки
                            return json_encode(['type' => 'error', 'data' => $errors]);
                        }

                        //начинаем импорт
                        $Reader = new \SpreadsheetReader('files/' . $file);
                        $Sheets = $Reader->Sheets();
                        if (!empty($Sheets)) {
                            foreach ($Sheets as $Index => $Name) {
                                $Reader->ChangeSheet($Index);
                                $arrkey = array();
                                foreach ($Reader as $rows) {
                                    if (!empty($rows)) {
                                        //print_r($rows);
                                        foreach ($rows as $key => $val) {
                                            $arrkey[$key] = strtolower($val);
                                        }
                                    }
                                    break;
                                }
                                if (!empty($arrkey)) {
                                    //проверяем соответствие столбцов
                                    $checkCol = $this->checkCol($arrkey, $this->tableInfo['importProcedureParameters']);
                                    if (!empty($checkCol)) {
                                        $errors[] = '<p class="error_str">Неправильные названия столбцов - ' . join(', ', $checkCol) . '</p>';
                                        return json_encode(['type' => 'error', 'data' => $errors]);
                                    }
                                    $checkReqCol = $this->checkReqCol($arrkey, $this->tableInfo['importProcedureParameters']);
                                    if (!empty($checkReqCol)) {
                                        $errors[] = '<p class="error_str">Отсутствуют обязательные столбцы - ' . join(', ', $checkReqCol) . '</p>';
                                        return json_encode(['type' => 'error', 'data' => $errors]);
                                    }
                                    $result = [];
                                    foreach ($Reader as $key => $row) {
                                        if ($key > 0) {
                                            $resRow = $this->setRow($arrkey, $row);
                                            $checkRow = $this->checkRow($this->tableInfo['importProcedureParameters'], $resRow);
                                            if (!empty($checkRow)) {
                                                $result[] = '<p class="error_str">' . join(', ', $checkRow) . ' в строке ' . $key . '</p>';
                                            } else {
                                                //пишем строку
                                                $res = $this->saveRow($resRow, $this->tableInfo['import_procedure']);
                                                if ($res['success']) {
                                                    //запрос выполнен
                                                    if ($res['success']['error_string']) {
                                                        //есть ошибки при импорте строки
                                                        $result[] = '<p class="error_str">Ошибка сохранения строки ' . $key . '</p>';
                                                        $result[] = '<p class="error_str">' . $res['success']['error_string'] . ' в строке ' . $key . '</p>';
                                                    } else {
                                                        $result[] = '<p class="success_str">Сохранена строка ' . $key . '</p>';
                                                    }
                                                }
                                                if ($res['error']) {
                                                    //ошибка запроса к базе
                                                    //echo $res['error'];
                                                    $result[] = '<p class="error_str">' . $res['error'] . ' в строке ' . $key . '</p>';
                                                }
                                            }
                                            //print_r($resRow);
                                        }
                                    }
                                    return json_encode(['type' => 'success', 'data' => $result]);
                                } else {
                                    //нет массива с названиями столбцов
                                    $errors[] = 'Неправильная структура файа - ' . $file;
                                    return json_encode(['type' => 'error', 'data' => $errors]);
                                }
                            }
                        } else {
                            $errors[] = 'Ошибка разбора файла' . $file;
                            return json_encode(['type' => 'error', 'data' => $errors]);
                        }
                    }
                } else {
                    //выводим ошибки
                    return json_encode(['type' => 'error', 'data' => $errors]);
                }
            } else {
                $errors[] = 'Нет файлов для импорта';
                return json_encode(['type' => 'error', 'data' => $errors]);
            }
        } else {
            $errors[] = 'Нет параметров для импорта';
            return json_encode(['type' => 'error', 'data' => $errors]);
        }
    }

    public function actionCheckdata()
    {
        $table = Yii::$app->request->post('table');
        $params = Yii::$app->request->post('params');
        $params = json_decode($params, true);
        $params = $this->function->convertArrayToParams($params);
        $this->getTableInfo($table);
        $sql = 'select error_msg, error_type from ' . $this->tableInfo['check_procedure'];
        $msg = $this->selectAll($sql, $params, $this->ddb);
        return json_encode($msg);
    }

    public function actionChangefieldprocedure()
    {
        $proc = Yii::$app->request->post('proc');
        $sql = 'select error_msg, error_type from ' . $proc;
        $result = $this->selectOne($sql, [], $this->ddb);
        return json_encode($result);
    }

    public function actionUpdateproc()
    {
        $table = Yii::$app->request->post('table');
        $type = Yii::$app->request->post('type', 'upd');
        $params = Yii::$app->request->post('params');
        $params = json_decode($params, true);
        $params = $this->function->convertArrayToParams($params);
        $this->getTableInfo($table);
        $commonParams = [':user_id' => $this->userID, ':lang' => $this->appLang, ':company_id' => 1];
        $params = array_merge($params, $commonParams);


        if ($type == 'ins')
            $updateSQL = strtolower($this->getInsertConnectSql($table));
        else
            $updateSQL = strtolower($this->getUpdateSql($table));

        if (trim($updateSQL) == '') {
            return json_encode(array(
                'success' => false,
                'error' => 'Ошибка! Отсутствует SQL-запрос на обновление записи.'
            ));
        }
        if (strpos($updateSQL, 'select') !== -1)
            $msg = json_encode($this->selectOne($updateSQL, $params, $this->ddb));
        else
            $msg = $this->executeSQL($updateSQL, $params, $this->ddb);
        return $msg;
    }

    public function actionCloseproc()
    {
        return $this->execProc('close_procedure');
    }

    public function actionCancelproc()
    {
        return $this->execProc('cancel_procedure');
    }


    protected function execProc($procType)
    {
        $table = Yii::$app->request->post('table');
        $params = Yii::$app->request->post('params');
        $params = json_decode($params, true);
        $params = $this->function->convertArrayToParams($params);
        $this->getTableInfo($table);
        $sql = 'execute procedure ' . $this->tableInfo[$procType];
        $msg = $this->executeSQL($sql, $params, $this->ddb);
        return json_encode($msg);
    }

    /*
         * Функция получения данных из процедуры
         * */
    public function actionGetdbdata()
    {
        $proc = Yii::$app->request->post('proc');
        $getError = Yii::$app->request->post('geterror');
        if (!$getError) {
            $sql = 'select result from ' . $proc;
        } else {
            $sql = 'select error_msg, error_type from ' . $proc;
        }
        $result = $this->selectOne($sql, [], $this->ddb);
        return json_encode($result);
    }

    public function actionGetalltemplates()
    {
        //$cache = Yii::$app->cache;
        $key = 'gettemplate';
        $result = $this->getCache($key);
        $result = false;
        if ($result === false) {
            $tables = $this->getAllTablesInfo();
            foreach ($tables as $idx => $table) {
                if (in_array($table['table_type'], ['form']) && $table['form_xml']) {
                    $colCount = 1;
                    $result[$idx] = $this->parser->parseForm($table['form_xml'], $colCount);
                }
                if (in_array($table['table_type'], ['pivot', 'chart']) && $table['form_xml']) {
                    $result[$idx] = $this->parser->parsePivot($table['form_xml']);
                }
                if (in_array($table['table_type'], ['cards', 'draglist']) && $table['form_xml']) {
                    $result[$idx] = $this->parser->parseColumn($table['form_xml']);
                    //$result[$idx] = $this->parser->getXmlTemplate($table['form_xml']);
                }
                if (in_array($table['table_type'], ['dashboard', 'layout']) && $table['form_xml']) {
                    $result[$idx] = $this->parser->parseDashboard($table['form_xml']);
                }
            }
            $this->saveCache($key, $result);
        }
        return json_encode($result);
    }

    private function getSqlForFilterData($table, $field, $extId, $selParams)
    {
        if ($table && $field) {
            $selectSQL = $this->getSelectSql($table);
            $user = User::findIdentity(Yii::$app->user->id);
            $params = [':user_id' => $this->userID, ':ext_id' => $extId, ':lang' => $this->appLang, ':company_id' => $user->company_id, ':__user_client_id__' => $user->client_id];
            if ($selParams) {
                $params = array_merge($params, $selParams);
            }
            $req = $this->function->getCorrectSql($selectSQL, $this->function->getParamFromSql($selectSQL), $params);
            return $req;
        }
        return false;
    }

    public function actionGetFilterStringData()
    {
        $table = Yii::$app->request->post('table');
        $field = Yii::$app->request->post('field');
        $extId = Yii::$app->request->post('extId', null);
        $selParams = Yii::$app->request->post('selParams', false);
        //$selParams = json_decode($selParams, true);
        if ($req = $this->getSqlForFilterData($table, $field, $extId, $selParams)) {
            $sql = 'select DISTINCT ' . $field . ' from (' . $req['sql'] . ')';
            $dataList = $this->ddb->createCommand($sql, $req['params'])->queryAll();
            //Yii::info($sql, 'dev_log');
            return json_encode($dataList);
        } else {
            $errors[] = 'Не переданы параметры для запроса';
            return json_encode(['type' => 'error', 'data' => $errors]);
        }
        //return json_encode($result);
    }

    public function actionGetFilterNumberData()
    {
        $table = Yii::$app->request->post('table');
        $field = Yii::$app->request->post('field');
        $extId = Yii::$app->request->post('extId', null);
        $selParams = Yii::$app->request->post('selParams', false);
        // $selParams = json_decode($selParams, true);
        if ($req = $this->getSqlForFilterData($table, $field, $extId, $selParams)) {
            $sql = 'select MIN(' . $field . '), MAX(' . $field . ') from (' . $req['sql'] . ')';
            $dataList = $this->ddb->createCommand($sql, $req['params'])->queryAll();
            //Yii::info($sql, 'dev_log');
            return json_encode($dataList);
        } else {
            $errors[] = 'Не переданы параметры для запроса';
            return json_encode(['type' => 'error', 'data' => $errors]);
        }
    }

    public function actionGetFilterTagboxData()
    {
        $table = Yii::$app->request->post('table');
        $field = Yii::$app->request->post('field');
        $extId = Yii::$app->request->post('extId', null);
        $selParams = Yii::$app->request->post('selParams', false);
        //$selParams = json_decode($selParams, true);
        if ($req = $this->getSqlForFilterData($table, $field, $extId, $selParams)) {
            $sql = 'select MIN(' . $field . '), MAX(' . $field . ') from (' . $req['sql'] . ')';
            $dataList = $this->ddb->createCommand($sql, $req['params'])->queryAll();
            //Yii::info($sql, 'dev_log');
            return json_encode($dataList);
        } else {
            $errors[] = 'Не переданы параметры для запроса';
            return json_encode(['type' => 'error', 'data' => $errors]);
        }
    }

    public function actionGetallsearchlookup()
    {
        $params = Yii::$app->request->post('params', []);
        $user = User::findIdentity(Yii::$app->user->id);
        $addParams = [':user_id' => $this->userID, ':lang' => $this->appLang, ':company_id' => $user->company_id, ':__user_client_id__' => $user->client_id];
        $params = $this->function->convertArrayToParams($params);
        $params = array_merge($params, $addParams);

        $sql = "select id,
                       ext_id,
                       item,
                       category_id,
                       category,
                       form_id
                from search_list(:company_id, :lang) ";

        if ($params) {
            $resSQL = $this->selectAll($sql, $params, $this->ddb);
        } else {
            $resSQL = $this->selectAll($sql, array(), $this->ddb);
        }

        if (isset($resSQL['success'])) {
            $result = $resSQL['success'];
        } else {
            throw new HttpException(500, $resSQL['error']);
        }

        return json_encode($result);
    }

    public function actionTablesetting()
    {
        $result = [];
        $table = Yii::$app->request->post('table', false);
        $state = Yii::$app->request->post('state', false);
        if ($table && $state) {
            $state = json_decode($state, true);
            $sql = 'update columns c
                    set c.pos = :pos,
                        c.width = :width,
                        c.is_visible = :is_visible
                    where c.table_id = :table_id
                      and lower(c.field) = :field   ';

            foreach ($state['columns'] as $column) {
                $params = [];
                $params[':table_id'] = $table;
                $params[':pos'] = $column['visibleIndex'];
                $params[':width'] = $column['width'];
                $params[':is_visible'] = $column['visible'] ? 1 : 0;
                $params[':field'] = $column['dataField'];
                if ($params && $column['dataField']) {
                    $result = $this->executeSQL($sql, $params, $this->db);
                }
            }

        }
        return json_encode($result);
    }

    protected function getDb($id)
    {
        return ($id < 0) ? $this->db : $this->ddb;
    }
}
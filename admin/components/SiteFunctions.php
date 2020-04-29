<?php

namespace app\components;

use Yii;
use yii\base\Component;

/**
 * Description of SiteLoader
 */
class SiteFunctions extends Component
{

    public function getParamFromSql($sql, $justNames = false)
    {
        /*$arr = explode(':', $sql);
        $res = [];
        if (!empty($arr)) {
            unset($arr[0]);

            foreach ($arr as $a) {
                $newstr = preg_replace('%[^:A-Za-zА-Яа-я0-9_-]%', ' ', $a, 1) . ' ';
                $param = ($justNames) ? '' : ':' . strstr($newstr, ' ', true);
                if (!$justNames || ($justNames && !in_array($param, $res)))
                    $res[] = $param;
            }
        }
        return $res;*/
        $params = array();

        //$regexp = "/\:[a-zA-Z][a-zA-Z0-9_]*/si";
        //$regexp = '/\:([a-zA-Z]\w*)/si';
        $regexp = '/\:([a-zA-Z_]\w*(\.[a-zA-Z]\w*)?)/si';
        if (preg_match_all($regexp, $sql, $m)) {
            foreach ($m[1] as $idx => $val) {
                $column = (($justNames) ? '' : ':') . $m[1][$idx];
                if (!$justNames || ($justNames && !in_array($column, $params)))
                    $params[] = strtolower($column);
            }
        }
        return $params;
    }

    public function getCorrectSql($sql, $param, $values)
    {
        $params = [];
        for ($i = 0; $i < count($param); $i++) {
            $sql = preg_replace("/$param[$i]/", ':param' . $i, $sql, 1);
            $params[':param' . $i] = $values[$param[$i]];
        }
        return ['sql' => $sql, 'params' => $params];
    }

    public function convertArrayToParams($arr)
    {
        $params = [];
        foreach ($arr as $key => $value) {
            if ($key[0] !== ':')
                $params[':' . $key] = $value;
        }
        return $params;
    }

}

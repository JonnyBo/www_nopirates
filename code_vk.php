<?php

/**
 * @author JonnyBo
 * @copyright 2019
 */


if (!empty($objects)) {
    foreach($objects as $object) {
        $tituls = [$object->title];
        if ($object->year_prod)
            $tituls[] = $object->title . ' ' . $object->year_prod;
        if ($object->director)
            $tituls[] = $object->title . ' ' . $object->director;
        foreach($tituls as $tt) {        
            $params = [
                'filters' => 'long',
                'extended' => 0,
                'count' => 200,
                'offset' => 0,
                'v' => 5.95,
                'q' => $tt,
                // 'longer' => 4200 //5280
            ];
            if ($object->duration) {
                $params['longer'] = ($object->duration - 10) * 60;
                $params['shorter'] = ($object->duration + 10) * 60;
            }
            print_r($params);
            $res = $vkPhpSdk->api('video.search', $params);
            if (!empty($res['response']['items'])) {
                    //array_push($out, array_values($result['response']['items']));
                    foreach ($res['response']['items'] as $rr) {
                        $rr['object_id'] = $object->object_id;
                        $out[$rr['id']] = $rr;
                    }
                    $pages = ceil($res['response']['count']/200);
                    for ($i = 1; $i < $pages; $i++) {
                        sleep(1);
                        $params['offset'] = 200*$i;
                        $res1 = $vkPhpSdk->api('video.search', $params);
                        if (!empty($res1['response']['items'])) {
                            //array_push($out, array_values($res['response']['items']));
                            foreach ($res1['response']['items'] as $rr) {
                                $rr['object_id'] = $object->object_id;
                                $out[$rr['id']] = $rr;
                            }
                        }
                    }
            }
            //print_r($res);
            
            if (!empty($out)) {
                    for ($j = 0; $j < count($out); $j++) {
                        $r = stripos($out[$j]['title'], $params['q']);
                        if (mb_stripos($out[$j]['title'], $params['q']) !== false) {
                            //echo $out[$j]['title'].' - '.$j.' - ' . (int)($out[$j]['duration'] / 60) .'мин. ';
                        } else {
                            unset($out[$j]);
                        }
                    }
            }
            
            
        }
    }
    echo 'Результат: '.$object->title.'';
    print_r($out);
}

?>
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
        if ($object->duration) {
            $min = ($object->duration - 10) * 60 * 1000;
            $max = ($object->duration + 10) * 60 * 1000; 
        }       
        foreach($tituls as $tt) { 
            $params = [
                'query' => $tt,
                'count' => 100,
                'context' => 'VIDEO',
                'types' => 'VIDEO',
                'fields' => 'video.*',
                'filter' => '{"typesss": ["USER_VIDEO", "GROUP_VIDEO"]}',
            ];
            
            $res = $Client->call('search.quick', $params);
            //print_r($res);
            if (!empty($res->entities->videos)) {
                    foreach ($res->entities->videos as $rr) {
                        if ($object->duration && $rr->duration < $max && $rr->duration > $min) {
                            $rr->object_id = $object->object_id;
                            $out[$rr->id] = $rr;
                        }
                    }
                    $pages = ceil($res->totalCount/100);
                    for ($i = 1; $i < $pages; $i++) {
                        sleep(1);
                        $params['offset'] = 100*$i;
                        $res1 = $Client->call('search.quick', $params);
                        if (!empty($res1->entities->videos)) {
                            foreach ($res1->entities->videos as $rr) {
                                if ($object->duration && $rr->duration < $max && $rr->duration > $min) {
                                    $rr->object_id = $object->object_id;
                                    $out[$rr->id] = $rr;
                                }
                            }
                        }
                    }
            }
        }
    }
    print_r($out);
}


//exit();

?>
<?php

class AdProduct extends SiteEntity {

    protected $table = '#__adprods';
    protected $idField = 'id';

    public function __construct($mId) {
        parent::__construct($mId);
        $this->FieldArray = Array('ta.id', 'ta.parent_id', 'ta.name_#', 'ta.descr_#', 'ta.content_#', 'ta.propsa',
            "(SELECT GROUP_CONCAT(CONCAT('<p class=\"',tc.classname,'\">',tc.name_#,'</p>') ORDER BY tc.pos SEPARATOR '') FROM #__itemprops tc WHERE tc.parent_id='propsc' AND ta.propsa & tc.itemvalue = tc.itemvalue) as propsraw", 'ta.qnt', 'ta.extview');
    }

    protected function OnLoad($success) {
        parent::OnLoad($success);
        if ($success) {
            $this->setProp('name', mb_str_replace('&', '&amp;', $this->getProp('name')));
        }
    }

    protected function getSelectQuery() {
        $this->ID = intval($this->ID);
        $where = 'ta.visible=1 AND ta.id=' . $this->ID;
        if (empty($this->ID)) {
            throw new EPageError(EPageError::PAGE_NOT_FOUND);
        }
        $qry = new QueryBuilder();
        $qry->Select($this->FieldArray, $this->table . ' ta')
                ->Where($where);
        return $qry->GetQuery();
    }

    public function Collection($AsArray = false) {
        $cls = get_class($this);
        if ($AsArray)
            $cls = '';
        $fields = $this->CollectionFieldArray == null ? $this->FieldArray : $this->CollectionFieldArray;
        $collection = new DataCollectionAdapter($cls, $this->table, $this->idField, $fields, $this->Props);
        $qry = new QueryBuilder();
        $filters = $collection->getFilters();
       
        if (empty($filters)) {
            $filters = ' ta.visible=1 ';
        } else {
            $filters = $filters . ' AND ta.visible=1 ';
        }
        $sql = $qry->Select($fields, $this->table . ' ta')
                        ->Where($filters)->GetQuery();
        $collection->SetQuery($sql);
        $collection->ordering = 'ta.pos';
        return $collection;
    }

    public function getRoomDetailsFor($date, $currentUserID, $showAll = false) {

        $dict = Dictionary::BulkLoad(array('ROOM', 'BOOK', 'ROOMNOTAV', 'BOOKING'));
        $dte = ParseDate($date);
        if ($dte === null) {
            $dte = time();
        }
        $monthNum = intval(date('m', $dte));
        $monthname = Monthname($monthNum, HttpContext::current()->culture()->Language());
        $cols = intval(date('t', $dte));
        $roomCount = intval($this->getProp('qnt'));
        $totalCols = $cols + 2;

        // booking fetch
        $FromDate = '01.' . date("m.Y", $dte);
        $ToDate = '01.' . date("m.Y", strtotime("+1 month", $dte));
        $DB = DatabaseProvider::provide();
        $DB->Query("SELECT id, parent_id, user_id, item_id, adprod_id, date_created, date_from, date_to, persons, qnt, price, c_name, c_phone, c_email, 
                                    DATEDIFF(date_to,date_from) AS days,day(greatest(date_from,STR_TO_DATE('" . $FromDate . "','%d.%m.%Y'))) as from_day,day(least(date_to,STR_TO_DATE('" . $ToDate . "','%d.%m.%Y')-interval 1 day)) as to_day,
                                    DAY(LEAST(date_to,STR_TO_DATE('" . $ToDate . "','%d.%m.%Y')-INTERVAL 1 DAY)) - DAY(GREATEST(date_from,STR_TO_DATE('" . $FromDate . "','%d.%m.%Y')))  AS actual_days
                                    FROM #__bookings
                                    WHERE status=1 AND item_id = " . intval($this->getProp('parent_id')) . " AND adprod_id=" . intval($this->ID) . "
                                    AND date_to >= STR_TO_DATE('" . $FromDate . "','%d.%m.%Y') AND date_from <= STR_TO_DATE('" . $ToDate . "','%d.%m.%Y')
                                    ORDER BY date_created ASC");
        $bookings = array();
        while ($row = $DB->ReadRow()) {
            $row['id'] = intval($row['id']);
            $row['parent_id'] = intval($row['parent_id']);
            $row['user_id'] = intval($row['user_id']);
            $row['item_id'] = intval($row['item_id']);
            $row['adprod_id'] = intval($row['adprod_id']);
            $row['persons'] = intval($row['persons']);
            $row['qnt'] = intval($row['qnt']);
            $row['days'] = intval($row['days']);
            $row['from_day'] = intval($row['from_day']);
            $row['to_day'] = intval($row['to_day']);
            $row['actual_days'] = intval($row['actual_days']);
            $row['price'] = floatval($row['price']);
            $bookings[] = $row;
         } 

        $tpl = '<table cellspacing="0" id="cal-view">
                                    <tbody>
                                    <tr>
                                        <td class="date_box" colspan="' . $totalCols . '"><span class="mount"><i class="prev btn-change-month" data-val="-1"></i>' . $monthname . ',' . intval(date('Y', $dte)) . '<i class="next btn-change-month" data-val="1"></i></span></td>
                                    </tr>
                                    <tr>
                                        <td class="c-room-name">' . $dict['ROOM'] . '</td>';

        $daysClone = array();
        for ($i = 1; $i <= $cols; $i++) {
            $tpl .= '<td>' . sprintf("%02d", $i) . '</td>';
            $daysClone['day_' . sprintf("%02d", $i)] = false;
        }
        $tpl .= '<td class="c-button-wrap"></td>
                            </tr>';

        $rooms = array();
        for ($r = 0; $r < $roomCount; $r++) {
            $rooms[] = array(
                'name' => 'N' . ($r + 1),
                'days' => $daysClone
            );
        }

        foreach ($bookings as $book) {
            $bookQnt = intval($book['qnt']);
            for ($p = 1; $p <= $bookQnt; $p++) {
                $isFound = false;
                $idx = 0;
                while ($isFound === false && $idx < $roomCount) {
                    /* 10 - 20 or
                       9 - 22 or */
                    $keyName = 'day_' . sprintf("%02d", $book['from_day']);
                    if (array_key_exists($keyName, $rooms[$idx]['days']) && $rooms[$idx]['days'][$keyName] === false) {
                        // write book
                        $isEnough = true;
                        $daysTemp = $rooms[$idx]['days'];
                        for ($q = $book['from_day']; $q <= $book['to_day']; $q++) {
                            $tmpkey = 'day_' . sprintf("%02d", $q);
                            if ($daysTemp[$tmpkey] !== false) {
                                $isEnough = false;
                                break;
                            }
                            unset($daysTemp[$tmpkey]);
                        }
                        if ($isEnough === true) {
                            $rooms[$idx]['days'] = $daysTemp;
                            $rooms[$idx]['days'][$keyName] = array(
                                'days' => $book['actual_days'] + 1,
                                'details' => $book
                            );
                            $isFound = true;
                        }
                    }
                    $idx++;
                }
            }
        }

        for ($r = 0; $r < $roomCount; $r++) {
            $tpl .= '<tr class="room-row" id="row_' . $r . '">
                        <td class="room-detail">' . $rooms[$r]['name'] . '</td>';
            $days = $rooms[$r]['days'];
            ksort($days);
            foreach ($days as $day) {
                if ($day !== false) {
                    $classname = 'busy oder';
                    $text = $dict['ROOMNOTAV'];
                    if ($showAll === true || $currentUserID === $day['details']['user_id']) {
                        $text = $day['details']['c_name'] . ', ' . $dict['BOOKING'] . ' N' . $day['details']['id'];
                        if ($currentUserID === $day['details']['user_id']) {
                            $text = $text.'<a href="#" class="btn-del-book" data-id="'.$day['details']['id'].'">X</a>';
                        }
                        $classname = 'busy';
                    }
                    $tpl .= '<td title="'.$day['details']['date_from']." - ".$day['details']['date_to'].'" style="border:none;" class="' . $classname . '" ' . ($day['days'] > 1 ? 'colspan="' . ($day['days'] -1 ) . '"' : '') . '>' . $text . '</td>';
                    if($day['days'] != 1) {
                      $tpl .= '<td class="busy"></td>';
                    }
                } else {
                    $tpl .= '<td></td>';
                }
            }
            $tpl .= '<td class="room-detail"><a href="#" class="btn btn-booknow" data-id="' . intval($this->ID) . '">' . $dict['BOOK'] . '</a></td>';
            $tpl .= '</tr>';
        }

        return $tpl . '</tbody></table>';
    }

    /*
      public function getBookingsFor($date) {
      $dte = ParseDate($date);
      if ($dte===null) {
      $dte = mktime();
      }
      $FromDate = '01.'.date("m.Y", $dte);
      $ToDate = '01.'.date("m.Y", strtotime("+1 month", $dte));

      $DB = DatabaseProvider::provide();
      $DB->Query("SELECT id, parent_id, user_id, item_id, adprod_id, date_created, date_from, date_to, persons, qnt, price, c_name, c_phone, c_email,
      DATEDIFF(date_to,date_from) AS days,day(greatest(date_from,STR_TO_DATE('".$FromDate."','%d.%m.%Y'))) as from_day,day(least(date_to,STR_TO_DATE('".$ToDate."','%d.%m.%Y')-interval 1 day)) as to_day,
      DAY(LEAST(date_to,STR_TO_DATE('".$ToDate."','%d.%m.%Y')-INTERVAL 1 DAY)) - DAY(GREATEST(date_from,STR_TO_DATE('".$FromDate."','%d.%m.%Y'))) + 1 AS actual_days
      FROM #__bookings
      WHERE item_id = ".intval($this->getProp('parent_id'))." AND adprod_id=".intval($this->ID)."
      AND date_to > STR_TO_DATE('".$FromDate."','%d.%m.%Y') AND date_from < STR_TO_DATE('".$ToDate."','%d.%m.%Y')
      ORDER BY date_created DESC");
      $bookings = array();
      while ($row = $DB->ReadRow()) {
      $row['id'] = intval($row['id']);
      $row['parent_id'] = intval($row['parent_id']);
      $row['user_id'] = intval($row['user_id']);
      $row['item_id'] = intval($row['item_id']);
      $row['adprod_id'] = intval($row['adprod_id']);
      $row['persons'] = intval($row['persons']);
      $row['qnt'] = intval($row['qnt']);
      $row['price'] = floatval($row['price']);
      $row['days'] = intval($row['days']);
      $row['from_day'] = intval($row['from_day']);
      $row['to_day'] = intval($row['to_day']);
      $row['actual_days'] = intval($row['actual_days']);
      $bookings[] = $row;
      }
      return $bookings;
      }
     */
    /*
      public function createBooking($orderInfo,$clientInfo) {
      $DB = DatabaseProvider::provide();
      $DB->Query("INSERT INTO #__bookings SET
      parent_id = "._VARINT($orderInfo['addinfo']['parent_id']).",
      user_id = "._VARINT($clientInfo['id']).",
      item_id = "._VARINT($orderInfo['addinfo']['item_id']).",
      adprod_id = "._VARINT($orderInfo['addinfo']['adprod_id']).",
      date_from =STR_TO_DATE(".$DB->EscapeValue($orderInfo['addinfo']['checkin']).",'%d.%m.%Y'),
      date_to = STR_TO_DATE(".$DB->EscapeValue($orderInfo['addinfo']['checkout']).",'%d.%m.%Y'),
      persons = "._VARINT($orderInfo['addinfo']['persons']).",
      qnt = "._VARINT($orderInfo['addinfo']['qnt']).",
      price = ". floatval($orderInfo['addinfo']['price']).",
      c_name=".$DB->EscapeValue($orderInfo['addinfo']['c_name']).",
      c_email=".$DB->EscapeValue($orderInfo['addinfo']['c_email']).",
      c_phone=".$DB->EscapeValue($orderInfo['addinfo']['c_phone']));
      $parent_id =  _VARINT($DB->LastID());
      $ec = new Encryptor();
      $mhash = $ec->newMD5();
      $hash = $ec->Encrypt($mhash, $parent_id);

      $DB->Query("UPDATE #__bookings SET thumbprint=".$DB->EscapeValue($hash)." WHERE id=".$parent_id);

      if ($this->propExists('email')) {

      }
      return $parent_id;

      }

     */

    public static function LoadAvailibleRooms($parentID, $memberID, $checkIn, $checkOut, $persons, $childs, $ages=null, $mob = false) {

        $mpr = 0;
        if (HttpContext::current()->Identified()) {
            $minfo = HttpContext::current()->Identity()->getInfo();
            if($minfo['mtype'] == 'MANAGER') $mpr = floatval($minfo['perc']);
        }


        if(!empty($minfo) AND $minfo['mtype'] == 'MANAGER') {
          if(!empty($memberID)) {
            $identityService = new UserIdentityService();
            $userInfo = $identityService->getUserInfo($memberID);
            if(!empty($userInfo)) {
              $memberPerc = $userInfo['perc'];
              $memberPerc = floatval($memberPerc);
            } else $memberPerc = 0;
          } else $memberPerc = 0;
        } else $memberPerc = 0;
        
        $ppr = Product::getPerc($parentID);
        $mpr = floatval($ppr) + $memberPerc + $mpr;

        $rates = HttpContext::current()->culture()->getAltCurrencies();

        $bookQnt = '0';
        if (!empty($checkIn) && !empty($checkOut)) {
            $bookQnt = "(SELECT IFNULL(SUM(tb.qnt),0) FROM #__bookings tb WHERE tb.status = 1 AND tb.adprod_id=ta.id AND tb.date_to > STR_TO_DATE('" . $checkIn . "','%d.%m.%Y') AND tb.date_from < STR_TO_DATE('" . $checkOut . "','%d.%m.%Y'))";
        }
        
        if(!empty($_GET['checkin']) AND !empty($_GET['checkout'])) {
            $o_checkin = DateTime::createFromFormat('d.m.Y', $_GET['checkin']);
            $o_checkout = DateTime::createFromFormat('d.m.Y', $_GET['checkout']);

            $dayDiff = date_diff($o_checkin,$o_checkout);
            $days = $dayDiff->format('%a');
            if($days == 0) $days = 1;
        } else {
            $days = 1;
        }

        $dict_extrabeds = Dictionary::Load('ITEMEXTRABED');
        $curFields = '';
        foreach ($rates as $value) {
            $curFields .= "CONCAT('" . $value['short'] . " ',FORMAT((IFNULL(tf.nprice,tf.oprice) - IFNULL(tf.nprice,tf.oprice) * " . $mpr . " / 100)/" . floatval($value['rate'])  . " * " . $days . "," . intval($value['decimals']) . ")) as price_" . $value['index'] . ",";
            $curFields .= "CONCAT('" . $value['short'] . " ',FORMAT((tf.oprice - tf.oprice * " . $mpr . " / 100)/" . floatval($value['rate'])  . " * " . $days . "," . intval($value['decimals']) . ")) as oprice_" . $value['index'] . ",";
            $curFields .= "CONCAT('" . $value['short'] . " ',FORMAT((tf.nprice - tf.nprice * " . $mpr . " / 100)/" . floatval($value['rate'])  . " * " . $days . "," . intval($value['decimals']) . ")) as nprice_" . $value['index'] . ",";
        }

        $qry = "SELECT tam.id,tf.id as offer_id,tam.parent_id,tam.name,tam.descr,tam.content,tam.propsa," . max(intval($persons), 2) . " as persons,tam.extview,
                    (SELECT GROUP_CONCAT(CONCAT('<p class=\"',tc.classname,'\">',tc.name_#,'</p>') ORDER BY tc.pos SEPARATOR '') FROM #__itemprops tc WHERE tc.parent_id='propsc' AND tam.propsa & tc.itemvalue = tc.itemvalue) as propsraw,
                    tf.people,tf.childs,tf.age_a,tf.age_b,tf.date_from,tf.date_to, tf.propsb, (tf.oprice - tf.oprice * " . $mpr . " / 100) as oprice, IFNULL((tf.nprice - tf.nprice * " . $mpr . " / 100),'') as nprice, (IFNULL(tf.nprice,tf.oprice) - IFNULL(tf.nprice,tf.oprice) * " . $mpr . " / 100) as price, tam.qnt,tam.mnacqnt," . $curFields . "
                    (SELECT GROUP_CONCAT(CONCAT('<li>',tc1.name_#,'</li>') ORDER BY tc1.name SEPARATOR '') FROM #__itemprops tc1 WHERE tc1.parent_id='propsb' AND tf.propsb & tc1.itemvalue = tc1.itemvalue) as propbsraw
                    FROM (
                        SELECT ta.id,ta.parent_id,ta.name_# as name,ta.descr_# as descr,ta.content_# as content,ta.propsa, ta.qnt,ta.qnt - " . $bookQnt . " AS mnacqnt,ta.pos,ta.extview
                        FROM #__adprods ta
                        WHERE ta.parent_id = " . intval($parentID) . " AND ta.visible = 1
                        ) tam 
                        INNER JOIN #__offers tf ON tf.parent_id = tam.id ";

        $where = "1=1"; //"tam.mnacqnt>0";

        if (!empty($_GET['checkin']) && !empty($_GET['checkout'])) {
            //$where .= " AND (tf.date_from IS NULL OR tf.date_from <= STR_TO_DATE('" . $_GET['checkin'] . "','%d.%m.%Y'))
                            //AND (tf.date_to IS NULL OR tf.date_to >= STR_TO_DATE('" . $_GET['checkout'] . "','%d.%m.%Y')) ";
              $where .= " AND (tf.date_to >= STR_TO_DATE('" . $_GET['checkin'] . "','%d.%m.%Y')) AND (tf.date_from <= STR_TO_DATE('" . $_GET['checkin'] . "','%d.%m.%Y'))";
        } else {
            //$where .= " AND (tf.date_to IS NULL OR tf.date_to>=DATE(NOW())) AND (tf.date_from IS NULL OR tf.date_from<=DATE(NOW()))";
            $where .= " AND (tf.date_to>=DATE(NOW())) AND (tf.date_from<=DATE(NOW()))";
        }

        if ($persons > 0) {
            $where .= " AND (tf.people + LEAST((tf.propsb & 32),1)) >=" . intval($persons);
        }
        if ($childs > 0) {
            //$where .= " AND tf.childs>=" . intval($childs);
        }

        $qry = $qry . ' AND ' . $where . ' ORDER BY tam.pos,tf.people + tf.childs';

        $isUser = '';   
        $allowBook = 'true';
        if (HttpContext::current()->Identified()) {
            $isUser = 'true';
            $allowBook = HttpContext::current()->Identity()->mtype === Member::MEMBERTYPES_MEMBER?'':'true';
        }    

        $DB = DatabaseProvider::provide();
        $DB->Query($qry);

        $prs = intval($persons);
        $chl= intval($childs);
        
        $ags = $ages;

        while ($row = $DB->ReadRow()) {
            $persons = $prs;
            $childs = $chl;
            $row['people'] = intval($row['people']);
            $row['childs'] = intval($row['childs']);

            if(($persons + $childs) > ($row['people'] + $row['childs'])) {
              if((($persons + $childs) - ($row['people'] + $row['childs'])) == 1) {
                if($row['propsb'] < 32) continue;
              } else if((($persons + $childs) - ($row['people'] + $row['childs'])) > 1) {
                continue;
              } 
            }
          
            if ($childs > 0) {
              $ages = explode(',', $ags);
              if(!empty($ages)) {
                foreach ($ages as $k => $v) {
                  if($v <= $row['age_a']) {
                    //unset($ages[$k]);
                    //$childs--;
                  }
                }
              }
              foreach ($ages as $childAge) {
               if($row['age_b'] > 0) {
                  $max_age = $row['age_b'];
               } else {
                  $max_age = 5;
               }
               
                 if($childAge > $max_age) {
                    $persons++;
                    $childs--;
                  } 
              }
            }

            $ages = (string)$ages;

            $prop_val = 0;
            if($row['propsb'] >= 32) $prop_val = 1;
            $prop_val = intval($prop_val);
            
            if($persons > ($row['people'] + $prop_val)) {
              continue;
            }
            
            if ($mob === false) {
                if (intval($row['people']) < 6) {
                    $row['poepleraw'] = str_repeat('<i class="people"></i>', intval($row['people']));
                } else {
                    $row['poepleraw'] = '<i class="people"></i>&nbsp;' . intval($row['people']);
                }

            
                if((!empty($persons) AND (($persons-1 == $row['people']))) OR (($persons + $childs) == ($row['people'] + $row['childs'] + $prop_val))) {
                 //if((!empty($persons) AND (($persons-1 == $row['people']))) ) {
                    if(strpos($row['propbsraw'],"մահճակալ") OR strpos($row['propbsraw'],"кровати") OR strpos($row['propbsraw'],"possibility")) {
                          //$row['poepleraw'] .= "&nbsp; + <i title='".$dict_extrabeds."' class='people'></i><a class='item_peoperaw' title='".$dict_extrabeds."'>i</a>";
                          $row['poepleraw'] .= "&nbsp; + <i title='".$dict_extrabeds."' class='people'></i><a class='item_peoperaw'><img title='".$dict_extrabeds."' src='page_files/images/i.png' class='poepleraw-img' /></a>";
                          $row['bed'] = 1;
                          $row['childscount'] = 'emtpy';
                    }
                  }// else {
                      if (intval($row['childs']) > 0) {
                          $row['poepleraw'] = $row['poepleraw'] . '&nbsp;<span> + </span>&nbsp;' . str_repeat('<i class="people child"></i>', intval($row['childs']));
                      }
                  //}
            } else {
                unset($row['propbsraw']);
                unset($row['propsraw']);
            }

            if(!empty($persons) AND (!empty($childs) AND $childs > 0)) { 
              $get_peoples = $childs + $persons;
              $row_peoples = $row['childs'] + $row['people'];
              if($row_peoples > $get_peoples) {
                if($row['people'] > $persons) {
                  if($row['childs'] >= $childs) {
                   if($childs + $persons <= $row['people'])  $totals_count = 'ok';
                   else {
                      $p = $row_peoples - $get_peoples;
                      if($childs == 3) {
                        if($p == 1) $child_calc = $childs-1;
                        else if ($p == 2) $child_calc = $childs-2;
                      } else if($childs == 2) {
                        if($p == 2) $child_calc = $childs-1; 
                        else $child_calc = $childs-1;
                      }
                    }
                  } else { 
                     $p = $row_peoples - $get_peoples;
                     if($childs == 3) { 
                      if($p == 1) {
                        if($persons == 2) $child_calc = $childs-2;
                        else $child_calc = $childs-1;
                      } 
                      else if ($p == 2) $child_calc = $childs-2; 
                      else if ($p == 0) $child_calc = $childs-1;
                      else $child_calc = $childs-2; 
                    } else if($childs == 1) {
                      $child_calc = 1; 
                    }
                  }
                  $p = $row_peoples - $get_peoples;
                } else {
                    $p = $row_peoples - $get_peoples;
                    if($childs == 3) {
                      if($p == 1) $child_calc = $childs-1;
                      else if ($p == 2) $child_calc = $childs-2; 
                    } else if($childs == 2) {
                      if($row['people'] > $persons) $child_calc = $childs-1;
                      else if($row['people'] == $persons) $child_calc = $childs;
                    } else if($childs == 1) {
                      if($p < 0 || $p == '') {
                        $child_calc = $childs;
                      } else if($p == 2) { 
                        $child_calc = 3;
                      } else if($p == 1) {
                        $child_calc = 1;
                      } else {
                        $child_calc = 2;
                      }
                    }
                } 
              } else if($row_peoples <= $get_peoples) {
                    $p = $row_peoples - $get_peoples;
                    if($childs == 3) {
                      if($p == 1) $child_calc = $childs-1;
                      else if ($p == 2) {
                        //$child_calc = $childs-2; 
                      } else if ($p == 0) {
                        //$child_calc = $childs-1; 
                        if($row['childs'] == 1) $child_calc = $childs-2;
                        else if($row['childs'] == 2) $child_calc = $childs-1; 
                        else if($row['childs'] == 3) $child_calc = $childs-1; 
                      } else $child_calc = $childs; 
                    } else if($childs == 2) {
                      if($row['people'] > $persons) {
                      if($p == 0) $child_calc = $childs-2;
                        //else $child_calc = $childs-1;
                        $child_calc = $childs-1;
                      } else if($row['people'] == $persons)  $child_calc = 2;
                        else $child_calc = $childs--;
                    } else if($childs == 1) $child_calc = $childs;
                }
                if($get_peoples == $row['people']) $child_calc = 0;
            }
            $ages= (string)$ages;
            $row['child_calc'] = $child_calc;
            
            if (intval($row['mnacqnt']) <= 0) {
                $row['sold'] = 'true';
            }

            //if (is_array($structure) && array_key_exists('parts', $structure))
            if (is_array($ret) && array_key_exists($row['id'], $ret)) {
                $row['isuser'] = $isUser;
                $row['allowbook'] = $allowBook;
                $ret[$row['id']]['offers'][] = $row;
            } else {
                $row['isuser'] = $isUser;
                $row['allowbook'] = $allowBook;
                $ret[$row['id']] = $row;
                $ret[$row['id']]['offers'] = array();
                $ret[$row['id']]['offers'][] = $row;
                $ids[] = $row['id'];
            }
        }

        if (count($ids) > 0) {
            $DB->Query("SELECT id,parent_id, filename, thumbname, isdefault,img_width, img_height, tmb_width, tmb_height,CONCAT('<a href=\"',filename,'\" data-thumb=\"',thumbname,'\">&nbsp;</a>') as txt FROM #__files WHERE parent_id IN (" . implode(',', $ids) . ") AND type='adprods' ORDER BY isdefault DESC");
            while ($row1 = $DB->ReadRow()) {
                if ($mob) {
                    unset($row1['txt']);
                    $ret[$row1['parent_id']]['files'][] = $row1;
                } else {
                    if (array_isset($ret[$row1['parent_id']]['files'])) {
                        $ret[$row1['parent_id']]['files'][] = $row1['txt'];
                    } else {
                        $ret[$row1['parent_id']]['files'] = array();
                        $ret[$row1['parent_id']]['files'][] = $row1['txt'];
                        $ret[$row1['parent_id']]['image'] = $row1['filename'];
                        $ret[$row1['parent_id']]['thumb'] = $row1['thumbname'];
                    }
                }
            }
        }
        
        
  if(!empty($ret)) {
        foreach ($ret as $key => $value) {
            if (array_isset($ret[$key]['files']) && $mob == false) {
                $ret[$key]['filesraw'] = implode(' ', $ret[$key]['files']);
            }
            $ret[$key]['offercount'] = count($ret[$key]['offers']);
        }
        }
        
        if ($mob==true) {
            $ret = array_values($ret);
        }

        return $ret;
    }

    public static function LoadOfferItem($offerID) {

      $bookQnt = '0';

      $qry = "SELECT tf.id,tam.id as room_id,tam.parent_id,tam.name,tam.descr,tam.content,tam.propsa,
                    (SELECT GROUP_CONCAT(CONCAT('<p class=\"',tc.classname,'\">',tc.name_#,'</p>') ORDER BY tc.pos SEPARATOR '') FROM #__itemprops tc WHERE tc.parent_id='propsc' AND tam.propsa & tc.itemvalue = tc.itemvalue) as propsraw,
                    tf.propsb,(SELECT GROUP_CONCAT(CONCAT('<li>',tc1.name_#,'</li>') ORDER BY tc1.name SEPARATOR '') FROM #__itemprops tc1 WHERE tc1.parent_id='propsb' AND tf.propsb & tc1.itemvalue = tc1.itemvalue) as propbsraw,
                    tam.qnt,tam.mnacqnt,tf.people,tf.childs,LEAST((tf.propsb & 32),1) AS extrabedcnt, tf.extrabed, tf.age_a, tf.price_a, tf.price_a2, tf.age_b, tf.price_b, 
                    IFNULL(tf.nprice,tf.oprice) as price
                    FROM (
                        SELECT ta.id,ta.parent_id,tf1.id as offer_id,ta.name_# as name,ta.descr_# as descr,ta.content_# as content,ta.propsa, ta.qnt,ta.qnt - " . $bookQnt . " AS mnacqnt,ta.pos
                        FROM #__adprods ta
                        INNER JOIN #__offers tf1 ON tf1.parent_id = ta.id
                        WHERE tf1.id = " . intval($offerID) . " AND ta.visible = 1
                        ) tam 
                        INNER JOIN #__offers tf ON tf.id = tam.offer_id";

                    $DB = DatabaseProvider::provide();
                    $row = $DB->Fetch($qry);

                    return $row['parent_id'];
    }

    public static function LoadOffer($offerID, $memberID, $checkIn, $checkOut, $quantity, $extrabed, $childs, $ages) {



        //$rates = HttpContext::current()->culture()->getCurrencies();

        /*if(!empty($memberID)) {
          $identityService = new UserIdentityService();
          $userInfo = $identityService->getUserInfo($memberID);
          if(!empty($userInfo)) {
            $memberPerc = $userInfo['perc'];
            $memberPerc = floatval($memberPerc);
          } else $memberPerc = 0;
        } else $memberPerc = 0;*/



        $bookQnt = '0';
        $daysCount = 0; 

        $mpr = 0;
        if (HttpContext::current()->Identified()) {
            $minfo = HttpContext::current()->Identity()->getInfo();
            if($minfo['mtype'] == 'MANAGER') $mpr = floatval($minfo['perc']);
        }

        if(!empty($minfo) AND $minfo['mtype'] == 'MANAGER') {
          if(!empty($memberID)) {
            $identityService = new UserIdentityService();
            $userInfo = $identityService->getUserInfo($memberID);
            if(!empty($userInfo)) {
              $memberPerc = $userInfo['perc'];
              $memberPerc = floatval($memberPerc);
            } else $memberPerc = 0;
          } else $memberPerc = 0;
        } else $memberPerc = 0;

        $ppr = Product::getPercFromOffer($offerID);
        $mpr = floatval($ppr) + $memberPerc + $mpr;

        if (!empty($checkIn) && !empty($checkOut)) {
            if($minfo['mtype'] == 'MEMBER') {
              $bookQnt = "(SELECT IFNULL(SUM(tb.qnt),0) FROM #__bookings tb WHERE tb.status=1 AND tb.adprod_id=ta.id AND tb.date_to >= STR_TO_DATE('" . $checkIn . "','%d.%m.%Y') AND tb.date_from <= STR_TO_DATE('" . $checkOut . "','%d.%m.%Y'))";
            } else {
              $bookQnt = "(SELECT IFNULL(SUM(tb.qnt),0) FROM #__bookings tb WHERE tb.status=1 AND tb.adprod_id=ta.id AND tb.date_to > STR_TO_DATE('" . $checkIn . "','%d.%m.%Y') AND tb.date_from < STR_TO_DATE('" . $checkOut . "','%d.%m.%Y'))";
            }
            $startDate = ParseDate($checkIn);
            $endDate = ParseDate($checkOut);
            $diff = $endDate - $startDate;
            $daysCount = ceil($diff / 86400);
        }



        /*
          $curFields = '';
          foreach ($rates as $key=>$value) {
          $curFields.='ROUND(IFNULL(tf.nprice,tf.oprice)/'.floatval($value['rate']).','.intval($value['decimals']).') as price_'.$key.',';
          }
         */

        /*
         * (IFNULL(tf.nprice,tf.oprice) - IFNULL(tf.nprice,tf.oprice) * ".$mpr." / 100) as price, 
         * (tf.oprice - tf.oprice * ".$mpr." / 100) as oprice,
          IFNULL((tf.nprice - tf.nprice * ".$mpr." / 100),'') as nprice,
         * ((IFNULL(tf.nprice,tf.oprice) - IFNULL(tf.nprice,tf.oprice) * ".$mpr." / 100) * ".($daysCount * $quantity).") as totals
         */


        $qry = "SELECT tf.id,tam.id as room_id,tam.parent_id,tf.date_from,tf.date_to,tam.name,tam.descr,tam.content,tam.propsa,
                    (SELECT GROUP_CONCAT(CONCAT('<p class=\"',tc.classname,'\">',tc.name_#,'</p>') ORDER BY tc.pos SEPARATOR '') FROM #__itemprops tc WHERE tc.parent_id='propsc' AND tam.propsa & tc.itemvalue = tc.itemvalue) as propsraw,
                    tf.propsb,(SELECT GROUP_CONCAT(CONCAT('<li>',tc1.name_#,'</li>') ORDER BY tc1.name SEPARATOR '') FROM #__itemprops tc1 WHERE tc1.parent_id='propsb' AND tf.propsb & tc1.itemvalue = tc1.itemvalue) as propbsraw,
                    tam.qnt,tam.mnacqnt,tf.people,tf.childs,LEAST((tf.propsb & 32),1) AS extrabedcnt, tf.status_id,tf.extrabed, tf.age_a, tf.price_a, tf.price_a2, tf.age_b, tf.price_b, 
                    IFNULL(tf.nprice,tf.oprice) as price
                    FROM (
                        SELECT ta.id,ta.parent_id,tf1.id as offer_id,ta.name_# as name,ta.descr_# as descr,ta.content_# as content,ta.propsa, ta.qnt,ta.qnt - " . $bookQnt . " AS mnacqnt,ta.pos
                        FROM #__adprods ta
                        INNER JOIN #__offers tf1 ON tf1.parent_id = ta.id
                        WHERE tf1.id = " . intval($offerID) . " AND ta.visible = 1
                        ) tam 
                        INNER JOIN #__offers tf ON tf.id = tam.offer_id";

        $where = "tam.mnacqnt>0";


        /* -------------------- Data Offer -------------------- */

       /*if (!empty($checkIn) && !empty($checkOut)) {
            $where .= " AND (tf.date_from IS NULL OR tf.date_from <= STR_TO_DATE('" . $checkIn . "','%d.%m.%Y')) 
                            AND (tf.date_to IS NULL OR tf.date_to >= STR_TO_DATE('" . $checkOut . "','%d.%m.%Y')) ";
        }*/

        $qry = $qry . ' AND ' . $where;

        $DB = DatabaseProvider::provide();
        $row = $DB->Fetch($qry);

        if (intval($row['id']) <= 0) {
            return null;
        }

        $files = $DB->Fill("SELECT id,parent_id, filename, thumbname, isdefault,img_width, img_height, tmb_width, tmb_height,CONCAT('<a href=\"',filename,'\" data-thumb=\"',thumbname,'\">&nbsp;</a>') as txt FROM #__files WHERE parent_id = " . intval($offerID) . " AND type='adprods' ORDER BY isdefault DESC");

        $cuurentrate = floatval(HttpContext::current()->culture()->CurrencyRate());
        $currentDecimals = intval(HttpContext::current()->culture()->CurrencyDecimals());

        $age_a = intval($row['age_a']);
        $age_b = intval($row['age_b']);

        $childs_a = 0;
        $childs_b = 0;
        if ($childs > 0) {
            $childAges = explode(',', $ages);
            foreach ($childAges as $childAge) {
                $childAge = min(intval($childAge), $age_b);
                if ($childAge <= $age_a) {
                    $childs_a++;
                } else if ($childAge <= $age_b) {
                    $childs_b++;
                }
            }
        }

        $price_a = floatval($row['price_a']);
        $price_a2 = floatval($row['price_a2']);
        $price_b = floatval($row['price_b']);


        $totals_room = floatval($row['price']) * $daysCount * $quantity;
        $totals_extrabed = floatval($row['extrabed']) * $extrabed * $daysCount;
        $total_childs = (($childs_a > 0 ? $price_a + ($childs_a - 1) * $price_a2 : 0) + $childs_b * $price_b) * $daysCount;

        $totals = ($totals_room + $totals_extrabed + $total_childs);
        $totals = $totals - $totals * $mpr / 100;
        $row['totals'] = $totals;


        $row['price'] = $row['totals'];
        $AmountCurrency = round($totals / $cuurentrate, $currentDecimals);

        $row['totalstext'] = sprintf(HttpContext::current()->culture()->CurrencyFormat(), number_format($AmountCurrency, HttpContext::current()->culture()->CurrencyDecimals()));

        $row['maxchilds'] = min($quantity * $row['childs'], 20);
        $row['maxextrabed'] = $quantity * $row['extrabedcnt'];

        if (array_isset($files)) {
            $row['files'] = $files;
            $row['image'] = $files[0]['filename'];
            $row['thumb'] = $files[0]['thumbname'];
        }


 
        return $row;
    }

     public static function LoadOfferAjax($offerID, $memberID, $checkIn, $checkOut, $quantity, $extrabed, $childs, $ages, $page=null) {
      $DB = DatabaseProvider::provide();

      $fperson = $quantity;


      $offer = $DB->Fetch("SELECT id, parent_id, item_id, date_from, date_to, propsb, people, childs, status_id FROM #__offers WHERE id=".$offerID);

      if(!empty($quantity)) {
        $where .= " AND (people >= '".$quantity."' OR people = '".($quantity - 1)."')";
      } 
      
      if(!empty($childs)) {
        $where .= " AND childs >= '".$childs."'";
      }

      //$DB->Query("SELECT id, date_from,  date_to, propsb, people, childs, age_a, age_b FROM #__offers WHERE parent_id=". $offer['parent_id'] ." AND propsb=" . $offer['propsb'] . " AND people=". $offer['people'] ." AND childs=". $offer['childs'] ." AND status_id=". $offer['status_id'] ." AND visible='1' ORDER BY date_to ASC");
      $DB->Query("SELECT id, date_from,  date_to, propsb, people, childs, age_a, age_b FROM #__offers WHERE parent_id=". $offer['parent_id'] ." AND propsb=" . $offer['propsb'] . " AND people=". $offer['people'] ." AND childs=". $offer['childs'] ." AND status_id=". $offer['status_id'] ." AND visible='1' ORDER BY date_to ASC");
     
      $room = $DB->ReadAll();

      $mpr = 0;
      $ppr = Product::getPercFromOffer($offerID);

      $item_hotels = $DB->Fetch("SELECT managers_perc FROM #__members WHERE tag2=".$offer['item_id']);
      if(!empty($item_hotels['managers_perc'])) {
        $item_hotels['managers_perc'] = unserialize($item_hotels['managers_perc']);
        if(HttpContext::current()->Identified()) {
          $minfo = HttpContext::current()->Identity()->getInfo(); 
          if(!empty($minfo)) {
            $mpr = $minfo['perc'];
            foreach ($item_hotels['managers_perc'] as $values) {
              if($values['id'] == $minfo['id']) {
                $mpr = floatval($values['value']);
              }
            }
          }
        }
      } else {
        if(HttpContext::current()->Identified()) {
          $minfo = HttpContext::current()->Identity()->getInfo();
          if(!empty($minfo)) $mpr = $minfo['perc'];
        }
      }

      if(!empty($minfo) AND $minfo['mtype'] == 'MANAGER') {
        if(!empty($memberID)) {
          $identityService = new UserIdentityService();
          $userInfo = $identityService->getUserInfo($memberID);
          if(!empty($userInfo)) {
            $memberPerc = $userInfo['perc'];
            $memberPerc = floatval($memberPerc);
          } else $memberPerc = 0;
        } else $memberPerc = 0;
      } else $memberPerc = 0;

      if($minfo['mtype'] == 'MANAGER') {
      if(!empty($hotel_ids)) {
        if(in_array($minfo['id'], $hotel_ids)) {
          $memberPerc = 0;
        }
        }
      }
      
      $mpr = floatval($ppr) + $memberPerc + $mpr;
      
      $x = 0;
      $dates = [];
      $insert_dates = array();
      $room_count = [];
      $result_checkout = date("d.m.Y", strtotime($checkOut));
      $result_checkout_form = date("d.m.Y", strtotime($checkOut));

      for($i = 0; $i < count($room); $i++) {

        $order_checkin = date("Y.m.d", strtotime($checkIn));
        $order_checkout = date("Y.m.d", strtotime($checkOut));

        $date_from = $room[$i]['date_from'];
        $date_to = $room[$i]['date_to'];

        $room[$i]['date_from'] = date("Y.m.d", strtotime($room[$i]['date_from']));
        $room[$i]['date_to'] = date("Y.m.d", strtotime($room[$i]['date_to']));

        $result_from = ($order_checkin >= $room[$i]['date_from']);
        $result_to = ($order_checkout <= $room[$i]['date_to']);
        $result_from_val = ($order_checkin >= $room[$i]['date_from']);
        $result_to_val = ($order_checkout >= $room[$i]['date_to']);
        $result_user = ($order_checkout >= $room[$i]['date_from']);

        $count_rooms = [];
        $checkins = date("d.m.Y", strtotime($checkIn));
        $checkouts = date("d.m.Y", strtotime($checkOut));
        $result_from_chekc = (strtotime($checkins)>strtotime($checkouts));
 
        if($result_from == 'true' AND $result_to != 'true') {
            $checkin = date("d.m.Y", strtotime($date_from));
            $checkout = date("d.m.Y", strtotime($checkOut));
            $result_1 = (strtotime($checkin)<strtotime($checkout));
           
            $order_checkin = date("d.m.Y", strtotime($checkIn));
            $order_checkout = date("d.m.Y", strtotime($date_to));

            $result_check = (strtotime($result_checkout)<strtotime($date_from));
           
            $result=(strtotime($order_checkin)>strtotime($order_checkout));
            if($result === true) {
             continue;
            }
            if($offer['people'] !== $room[$i]['people'] OR $offer['propsb'] !== $room[$i]['propsb'] OR $offer['childs'] !== $room[$i]['childs']) {
                throw new EPageError(EPageError::CUSTOM_ERROR,'ERR_ITEMBUSY');
                break;
            }

           $room_count[] = '1';

           if($result_check == 'true') {
             $date1=date_create($result_checkout);
             $date2=date_create($date_from);
             $diff=date_diff($date1,$date2);
             $days = $diff->format("%a");
             if($days > 1) {
                continue;
             }
           }
           $x++;
           $count_rooms[] = $days;
           array_push($insert_dates, array($room[$i]['id'],  $order_checkin, $order_checkout));
        } else if($result_from != 'true' AND $result_to == 'true') {
           $checkins = date("d.m.Y", strtotime($checkIn));
           $checkouts = date("d.m.Y", strtotime($checkOut));
           $order_checkout_1 = date("d.m.Y", strtotime($date_to));

           $order_checkin = date("d.m.Y", strtotime($date_from));
           $order_checkout = date("d.m.Y", strtotime($checkOut));

           $result_check = (strtotime($result_checkout)<strtotime($date_from));

           $result=(strtotime($order_checkin)>strtotime($order_checkout));
           if($result === true) {
                continue;
           }
           if($offer['people'] !== $room[$i]['people'] OR $offer['propsb'] !== $room[$i]['propsb'] OR $offer['childs'] !== $room[$i]['childs']) {
                throw new EPageError(EPageError::CUSTOM_ERROR,'ERR_ITEMBUSY');
                break;
           }

           $room_count[] = '1';

           if($result_check == 'true') {
             $date1=date_create($result_checkout);
             $date2=date_create($date_from);
             $diff=date_diff($date1,$date2);
             $days = $diff->format("%a");
             if($days > 1) {
              continue;
              }
           }
           array_push($insert_dates, array($room[$i]['id'],  $order_checkin, $order_checkout));
           $count_rooms[] = $days;
        } else {
           $order_checkin = date("d.m.Y", strtotime($checkIn));
           $order_checkout = date("d.m.Y", strtotime($checkOut));
           $order_date_from = date("d.m.Y", strtotime($date_from));
           $order_date_to = date("d.m.Y", strtotime($date_to));

           $result_1 = (strtotime($order_checkin)<strtotime($order_date_from));
           $result_2 = (strtotime($order_checkout)>strtotime($order_date_to));

           if($result_1 === true) {
            $order_checkin = $order_date_from;
           }
           if($result_2 === true) {
            $order_checkout = $order_date_to;
           }
           array_push($insert_dates, array($room[$i]['id'],  $order_checkin, $order_checkout));
           $room_count[] = '1';
           $count_rooms[] = "1";
        }

        if(empty($count_rooms)) {
          throw new EPageError(EPageError::CUSTOM_ERROR,'ERR_ITEMBUSY');
          break;
        }
        if($result_from == 'true' AND $result_to == 'true') {
            break;
        }
        $result_checkout = $order_checkout;
      }
      //if($page != 'page_room') {
      $big_data = [];
      foreach ($insert_dates as $value) {
        $big_data[] = $value[2];
      }

      /*  function mysort($a, $b) {
          return strtotime($b) - strtotime($a);
      }
      usort($big_data, 'mysort');*/
      usort($big_data, function ($a, $b) {
          return strtotime($b) - strtotime($a);
      });

      $resultDate = (strtotime($result_checkout_form)>strtotime($big_data[0]));
      if($resultDate == 'true') {
        if($page == 'page_room') {
          return "empty"; 
        }
        throw new EPageError(EPageError::CUSTOM_ERROR,'ERR_ITEMBUSY');
      }

        if(count($room_count) != count($insert_dates)) {
          if($page == 'page_room') {
            return "empty";
          }
          throw new EPageError(EPageError::CUSTOM_ERROR,'ERR_ITEMBUSY');
        }
      //}

        $bookQnt = '0';

        /*$mpr = 0;
        if (HttpContext::current()->Identified()) {
            $minfo = HttpContext::current()->Identity()->getInfo();
            if($minfo['mtype'] == 'MANAGER') $mpr = floatval($minfo['perc']);
        }

        if(!empty($minfo) AND $minfo['mtype'] == 'MANAGER') {
          if(!empty($memberID)) {
            $identityService = new UserIdentityService();
            $userInfo = $identityService->getUserInfo($memberID);
            if(!empty($userInfo)) {
              $memberPerc = $userInfo['perc'];
              $memberPerc = floatval($memberPerc);
            } else $memberPerc = 0;
          } else $memberPerc = 0;
        } else $memberPerc = 0;

        $ppr = Product::getPercFromOffer($offerID);
        $mpr = floatval($ppr) + $memberPerc + $mpr;*/

        $all_totals = [];
        $num = 0;
        $daysCount = 0;

        foreach($insert_dates as $dates) {
          if (!empty($dates[1]) && !empty($dates[2])) {
              $bookQnt = "(SELECT IFNULL(SUM(tb.qnt),0) FROM #__bookings tb WHERE tb.status=1 AND tb.adprod_id=ta.id AND tb.date_to > STR_TO_DATE('" . $dates[1] . "','%d.%m.%Y') AND tb.date_from < STR_TO_DATE('" . $dates[2] . "','%d.%m.%Y'))";
              $startDate = ParseDate($dates[1]);
              $endDate = ParseDate($dates[2]);
              $diff = $endDate - $startDate;
              $daysCount = ceil($diff / 86400);

              if(count($insert_dates) >= 2 AND $daysCount != 0 AND $num > 0) {
                $daysCount++;
              }
              if(count($insert_dates) >= 2 AND $daysCount == 0 AND $num > 0) {
                $daysCount++;
              }
          }

          $qry = "SELECT tf.id,tam.id as room_id,tam.parent_id,tf.date_from,tf.date_to,tam.name,tam.descr,tam.content,tam.propsa,
                      (SELECT GROUP_CONCAT(CONCAT('<p class=\"',tc.classname,'\">',tc.name_#,'</p>') ORDER BY tc.pos SEPARATOR '') FROM #__itemprops tc WHERE tc.parent_id='propsc' AND tam.propsa & tc.itemvalue = tc.itemvalue) as propsraw,
                      tf.propsb,(SELECT GROUP_CONCAT(CONCAT('<li>',tc1.name_#,'</li>') ORDER BY tc1.name SEPARATOR '') FROM #__itemprops tc1 WHERE tc1.parent_id='propsb' AND tf.propsb & tc1.itemvalue = tc1.itemvalue) as propbsraw,
                      tam.qnt,tam.mnacqnt,tf.people,tf.childs,LEAST((tf.propsb & 32),1) AS extrabedcnt, tf.status_id,tf.extrabed, tf.age_a, tf.price_a, tf.price_a2, tf.age_b, tf.price_b, 
                      IFNULL(tf.nprice,tf.oprice) as price
                      FROM (
                          SELECT ta.id,ta.parent_id,tf1.id as offer_id,ta.name_# as name,ta.descr_# as descr,ta.content_# as content,ta.propsa, ta.qnt,ta.qnt - " . $bookQnt . " AS mnacqnt,ta.pos
                          FROM #__adprods ta
                          INNER JOIN #__offers tf1 ON tf1.parent_id = ta.id
                          WHERE tf1.id = " . intval($dates[0]) . " AND ta.visible = 1
                          ) tam 
                          INNER JOIN #__offers tf ON tf.id = tam.offer_id";

          //$where = "tam.mnacqnt>0";

          //$qry = $qry . ' AND ' . $where;
          $qry = $qry ;

          $DB = DatabaseProvider::provide();
          $row = $DB->Fetch($qry);

          if (intval($row['id']) <= 0) {
              return null;
          }

          $files = $DB->Fill("SELECT id,parent_id, filename, thumbname, isdefault,img_width, img_height, tmb_width, tmb_height,CONCAT('<a href=\"',filename,'\" data-thumb=\"',thumbname,'\">&nbsp;</a>') as txt FROM #__files WHERE parent_id = " . intval($dates[0]) . " AND type='adprods' ORDER BY isdefault DESC");

          $cuurentrate = floatval(HttpContext::current()->culture()->CurrencyRate());
          $currentDecimals = intval(HttpContext::current()->culture()->CurrencyDecimals());

          $age_a = intval($row['age_a']);
          $age_b = intval($row['age_b']);

          $childs_a = 0;
          $childs_b = 0;
          if ($childs > 0) {
              if($room[$i]['childs'] == 0) {
              $fperson = $fperson + $childs;
            } else {
              $childAges = explode(',', $ages);
              sort($childAges);
              foreach ($childAges as $childAge) {
                  if($childAge < $age_a) {
                      $childs_a++;
                  } else if ($childAge <= $age_b) {
                      $childs_b++;
                  } else if ($childAge > $age_b) {
                      $fperson++;
                      $childs--;
                  }
              }
            }
          }

          

          $ages = explode(",",$ages);
          sort($ages);

          if(!empty($fperson) AND (!empty($childs) AND $childs > 0)) {
            $get_peoples = $childs + $fperson;
            $row_peoples = $row['childs'] + $row['people'];             
            if($row_peoples > $get_peoples) { 
              if($row['people'] > $fperson) {
                if($row['childs'] >= $childs) {
                  if($childs + $fperson <= $row['people']) {
                    $totals_count = 'ok';
                  } else {
                    $p = $row_peoples - $get_peoples;

                    if($childs == 3) {
                      if($p == 1) array_pop($ages);
                      else if ($p == 2) array_splice($ages, 1, 2);

                    } else if($childs == 2) {
                         if($p == 2) array_pop($ages);
                         else array_pop($ages);
                         //$childs_b--;
                      }
                    }
                  } else {
                    $p = $row_peoples - $get_peoples;
                    if($childs == 3) {
                      if($p == 1) {
                       if($fperson == 2) array_splice($ages, 1, 4);
                       else array_pop($ages);
                       //$childs_b = $childs_b - 2;
                      }
                      else if ($p == 2) array_splice($ages, 1, 2);
                    } else if($childs == 2) {
                        if($p == 2) array_pop($ages);
                        else array_pop($ages);
                      }
                      if($get_peoples == $row['people']) $ages = [];
                  }
                }  else { 
                   $p = $row_peoples - $get_peoples;
                    if($childs == 3) {
                      if($p == 1)array_pop($ages);
                      else if ($p == 2) array_splice($ages, 1, 2);
                      
                    } else if($childs == 2) { 
                     if($p == 1) array_splice($ages, 1, 4);
                     else {
                        if($row['people'] > $persons) array_pop($ages);
                      }
                    } else if($childs == 1) {

                    }
                   }
                  } else if($row_peoples == $get_peoples) {
                   if($row['people'] > $fperson) {
                      $p = $row['people'] - $fperson;
                      //$childs_b = $childs_b - $p;
                    }
                  }
                  else {
                    $p = $row_peoples - $get_peoples;
                    if($childs == 3) {
                      if($p == 1) array_pop($ages);
                      else if ($p == 2) array_splice($ages, 1, 2);
                      else if($p == 0) {
                       if($row['people'] > $fperson) {
                        if($row['childs'] == 1) array_splice($ages, 1, 4);
                        else if($row['childs'] == 2) {
                           if($row['people'] >= 4) array_splice($ages, 1, 1);
                           else array_splice($ages, 1, 2);
                        }
                       }
                      }
                    } else if($childs == 2) {
                      //if($p < 0) $ages = Product::childAges($ages, $age_a);
                      if($fperson < $row['people']) array_pop($ages);
                      else if($fperson == $row['people']) {
                        array_splice($ages, 1, 4);
                      }
                     }
                  }

                  $ages = implode(",",$ages);
              }
              $ages = (string)$ages;

          $price_a = floatval($row['price_a']);
          $price_a2 = floatval($row['price_a2']);
          $price_b = floatval($row['price_b']);
          
          $daysCount = intval($daysCount);
          $extrabed = intval($extrabed);




          if(!empty($page) AND $page != 'order') {
           if($page == 'page_room') $totals_room = floatval($row['price']) * $daysCount;
          } else {
            $totals_room = floatval($row['price']) * $daysCount * $quantity;
            $totals_extrabed = floatval($row['extrabed']) * $extrabed * $daysCount;
          }
          
          if($room[$i]['propsb'] >= 32) {
            $prop_val = 1;
          } else $prop_val = 0;

          if(!empty($fperson) AND ( ($fperson-1 == $offer['people'])) AND $page != 'order') {
              $totals_extrabed = floatval($row['extrabed']) + $extrabed * $daysCount;
          } else if(($fperson + $childs) == ($row['people'] + $row['childs'] + $prop_val) AND $page != 'order') {

           $childs_a = 0;
           $childs_b = 0;
           $childs_c = 0;
           if ($childs > 0) {
              $childAges = explode(',', $ages);
              foreach ($childAges as $childAge) {
                  $childAge = min(intval($childAge), $age_b);
                  if ($childAge > $age_b) {
                    $childs_c++;
                  }
              }
          }

          if($childs_c == 0) {
            //return 'empty';
          }
            $totals_extrabed = floatval($row['extrabed']) + $extrabed * $daysCount;
          
          } else {
            //$totals_count = 'ok';
          }


          if($fperson > $room[$i]['people']) { 
            if($room[$i]['propsb'] >= 32) {
              if($room[$i]['people'] + 1 < $fperson) return 'empty';
            }
          }

            //$totals_extrabed = floatval($row['extrabed']) * $extrabed * $daysCount;
          //$total_childs = (($childs_a > 0 ? $price_a + ($childs_a - 1) * $price_a2 : 0) + $childs_b * $price_b) * $daysCount;


          if(($totals_count != 'ok' OR $page == 'order') AND $childs > 0) {
            $total_childs = (($childs_a > 0 ? $price_a + ($childs_a - 1) * $price_a2 : 0) + $childs_b * $price_b) * $daysCount;
          }

          $totals = ($totals_room + $totals_extrabed + $total_childs);
          $totals = $totals - $totals * $mpr / 100;
          $row['totals'] = $totals;

          $all_totals[] = $row['totals'];

          $row['price'] = $row['totals'];
          $AmountCurrency = round($totals / $cuurentrate, $currentDecimals);

          $row['totalstext'] = sprintf(HttpContext::current()->culture()->CurrencyFormat(), number_format($AmountCurrency, HttpContext::current()->culture()->CurrencyDecimals()));

          $row['maxchilds'] = min($quantity * $row['childs'], 20);
          $row['maxextrabed'] = $quantity * $row['extrabedcnt'];

          if (array_isset($files)) {
              $row['files'] = $files;
              $row['image'] = $files[0]['filename'];
              $row['thumb'] = $files[0]['thumbname'];
          }
          $num++;
      }

      foreach ($all_totals as $key => $value) {
        $summ = $summ + $value;
      }

      $cuurentrate = floatval(HttpContext::current()->culture()->CurrencyRate());
      $currentDecimals = intval(HttpContext::current()->culture()->CurrencyDecimals());
      $AmountCurrency = round($summ / $cuurentrate, $currentDecimals);

      $amount = $AmountCurrency;

      $AmountCurrency = sprintf(HttpContext::current()->culture()->CurrencyFormat(), number_format($AmountCurrency, HttpContext::current()->culture()->CurrencyDecimals()));
        
      return array($amount, $AmountCurrency);
    }

  public static function LoadOfferSearch($offerID, $memberID, $checkIn, $checkOut, $quantity, $extrabed, $childs, $ages, $page=null) {
      $fperson = $quantity;
      $chl = $childs;
      $qtn = $quantity;
      $ags = $ages;

      $DB = DatabaseProvider::provide();
     
      $qry = "SELECT id, item_id, date_from, date_to, propsb, people, childs,oprice,nprice FROM #__offers WHERE item_id='". $offerID."'";
      /*if(!empty($quantity)) {
        $where .= " AND (people >= '".$quantity."' OR people = '".($quantity - 1)."')";
        //$where .= " AND people >= '".$quantity."'";
      } 

      if(!empty($childs)) {
        $where .= " AND childs >= '".$childs."'";
      }*/
     
      if(!empty($quantity) AND empty($childs)) {
        $where .= " AND (people >= '".$quantity."' OR people = '".($quantity - 1)."')";
      }

      if(!empty($quantity) AND !empty($childs)) {
        //$where .= " AND people >= '".$quantity."'";
      }

      if(!empty($childs)) {
        //$where .= " AND childs >= '".$childs."'";
      }
      
      $where .= " AND (date_to >= STR_TO_DATE('" . $checkIn . "','%d.%m.%Y')) AND (date_from <= STR_TO_DATE('" . $checkIn . "','%d.%m.%Y')) ";
      
      $where .= " ORDER BY COALESCE(nprice, 'zz') ASC, oprice ASC";
      
      $qry = $qry . $where;
      $DB->Query($qry);
      $offer_min = $DB->ReadAll();


      $array_prices = [];
      for($y = 0; $y < count($offer_min); $y++) {
      $prop_val_search = 0;
      if($offer_min[$y]['propsb'] < 32 AND $fperson > $offer_min[$y]['people'] AND empty($childs)) {
        continue;
      } else $prop_val_search = 1;
      
    $fperson = intval($fperson);
    $childs = intval($childs);
    $offer_min[$y]['people'] = intval($offer_min[$y]['people']);
    $offer_min[$y]['childs'] = intval($offer_min[$y]['childs']);

    //print_r($offer_min[$y]['people'] . " - " . $offer_min[$y]['childs'] . " - " . $prop_val_search ."-----" . $fperson ." - " . $childs);
     
    if(($offer_min[$y]['people'] + $offer_min[$y]['childs'] + $prop_val_search ) < ($fperson + $childs)) {
      continue;
    }

    
     
      $DB = DatabaseProvider::provide();
      $offer = $DB->Fetch("SELECT id, parent_id, item_id, date_from, date_to, propsb, people, childs, status_id FROM #__offers WHERE id=".$offer_min[$y]['id']);

      $DB->Query("SELECT id, date_from, date_to, propsb, people, childs FROM #__offers WHERE parent_id=". $offer['parent_id'] ." AND propsb=" . $offer['propsb'] . " AND people=". $offer['people'] ." AND childs=". $offer['childs'] ." AND status_id=". $offer['status_id'] ." AND visible='1' ORDER BY date_to ASC");
      $room = $DB->ReadAll();



      $x = 0;
      $dates = [];
      $insert_dates = array();
      $room_count = [];
      $result_checkout = date("d.m.Y", strtotime($checkOut));
      $result_checkout_form = date("d.m.Y", strtotime($checkOut));

      for($i = 0; $i < count($room); $i++) {
        $fperson = $qtn;
        $childs = $chl;
        $ages = $ags;
        $fperson = intval($fperson);
        $childs = intval($childs);
        $order_checkin = date("Y.m.d", strtotime($checkIn));
        $order_checkout = date("Y.m.d", strtotime($checkOut));

        $date_from = $room[$i]['date_from'];
        $date_to = $room[$i]['date_to'];

        $room[$i]['date_from'] = date("Y.m.d", strtotime($room[$i]['date_from']));
        $room[$i]['date_to'] = date("Y.m.d", strtotime($room[$i]['date_to']));

        $result_from = ($order_checkin >= $room[$i]['date_from']);
        $result_to = ($order_checkout <= $room[$i]['date_to']);
        $result_from_val = ($order_checkin >= $room[$i]['date_from']);
        $result_to_val = ($order_checkout >= $room[$i]['date_to']);
        $result_user = ($order_checkout >= $room[$i]['date_from']);

        $count_rooms = [];
        $checkins = date("d.m.Y", strtotime($checkIn));
        $checkouts = date("d.m.Y", strtotime($checkOut));
        $result_from_chekc = (strtotime($checkins)>strtotime($checkouts));
 
        if($result_from == 'true' AND $result_to != 'true') {
            $checkin = date("d.m.Y", strtotime($date_from));
            $checkout = date("d.m.Y", strtotime($checkOut));
            $result_1 = (strtotime($checkin)<strtotime($checkout));
           
            $order_checkin = date("d.m.Y", strtotime($checkIn));
            $order_checkout = date("d.m.Y", strtotime($date_to));

            $result_check = (strtotime($result_checkout)<strtotime($date_from));
           
            $result=(strtotime($order_checkin)>strtotime($order_checkout));
            if($result === true) {
             continue;
            }

           $room_count[] = '1';

           if($result_check == 'true') {
             $date1=date_create($result_checkout);
             $date2=date_create($date_from);
             $diff=date_diff($date1,$date2);
             $days = $diff->format("%a");
             if($days > 1) {
                continue;
             }
           }

           $x++;
           $count_rooms[] = $days;
           array_push($insert_dates, array($room[$i]['id'],  $order_checkin, $order_checkout));
        } else if($result_from != 'true' AND $result_to == 'true') {
           $checkins = date("d.m.Y", strtotime($checkIn));
           $checkouts = date("d.m.Y", strtotime($checkOut));
           $order_checkout_1 = date("d.m.Y", strtotime($date_to));

           $order_checkin = date("d.m.Y", strtotime($date_from));
           $order_checkout = date("d.m.Y", strtotime($checkOut));

           $result_check = (strtotime($result_checkout)<strtotime($date_from));

           $result=(strtotime($order_checkin)>strtotime($order_checkout));
           if($result === true) {
                continue;
           }
           $room_count[] = '1';
           if($result_check == 'true') {
             $date1=date_create($result_checkout);
             $date2=date_create($date_from);
             $diff=date_diff($date1,$date2);
             $days = $diff->format("%a");
             if($days > 1) {
              continue;
              }
           }
           array_push($insert_dates, array($room[$i]['id'],  $order_checkin, $order_checkout));
           $count_rooms[] = $days;
        } else {
           $order_checkin = date("d.m.Y", strtotime($checkIn));
           $order_checkout = date("d.m.Y", strtotime($checkOut));
           $order_date_from = date("d.m.Y", strtotime($date_from));
           $order_date_to = date("d.m.Y", strtotime($date_to));

           $result_1 = (strtotime($order_checkin)<strtotime($order_date_from));
           $result_2 = (strtotime($order_checkout)>strtotime($order_date_to));

           if($result_1 === true) {
            $order_checkin = $order_date_from;
           }
           if($result_2 === true) {
            $order_checkout = $order_date_to;
           }
           array_push($insert_dates, array($room[$i]['id'],  $order_checkin, $order_checkout));
           $room_count[] = '1';
           $count_rooms[] = "1";
        }

        if(empty($count_rooms)) {
          throw new EPageError(EPageError::CUSTOM_ERROR,'ERR_ITEMBUSY');
          break;
        }
        if($result_from == 'true' AND $result_to == 'true') {
            break;
        }
        $result_checkout = $order_checkout;
      }

      //if($page != 'page_room') {
      $big_data = [];
      foreach ($insert_dates as $value) {
        $big_data[] = $value[2];
      }

      usort($big_data, function ($a, $b) {
          return strtotime($b) - strtotime($a);
      });

      $resultDate = (strtotime($result_checkout_form)>strtotime($big_data[0]));
      if($resultDate == 'true') {
        if($page == 'page_room') {
          //return "empty";
          continue;
        }
        //throw new EPageError(EPageError::CUSTOM_ERROR,'ERR_ITEMBUSY');
      }

      if(count($room_count) != count($insert_dates)) {
        if($page == 'page_room') {
          //return "empty";
          continue;
        }
        //throw new EPageError(EPageError::CUSTOM_ERROR,'ERR_ITEMBUSY');
      }
      //}



       $bookQnt = '0';

      $mpr = 0;
      $ppr = Product::getPercFromOffer($offerID);

      $item_hotels = $DB->Fetch("SELECT managers_perc FROM #__members WHERE tag2=".$offer['item_id']);
      if(!empty($item_hotels['managers_perc'])) {
        $item_hotels['managers_perc'] = unserialize($item_hotels['managers_perc']);
        if(HttpContext::current()->Identified()) {
          $minfo = HttpContext::current()->Identity()->getInfo(); 
          if(!empty($minfo)) {
            $mpr = $minfo['perc'];
            foreach ($item_hotels['managers_perc'] as $values) {
              if($values['id'] == $minfo['id']) {
                $mpr = floatval($values['value']);
              }
            }
          }
        }
      } else {
        if(HttpContext::current()->Identified()) {
          $minfo = HttpContext::current()->Identity()->getInfo();
          if(!empty($minfo)) $mpr = $minfo['perc'];
        }
      }
      

      $userPerc = $DB->Scalar("SELECT member_id FROM #__items WHERE id=".$offerID);

        if(!empty($minfo) AND $minfo['mtype'] == 'MANAGER') {
          if(!empty($userPerc)) {
            $identityService = new UserIdentityService();
            $userInfo = $identityService->getUserInfo($userPerc);
            if(!empty($userInfo)) {
              $memberPerc = $userInfo['perc'];
              $memberPerc = floatval($memberPerc);
            } else $memberPerc = 0;
          } else $memberPerc = 0;
        } else $memberPerc = 0;

      if($minfo['mtype'] == 'MANAGER') {
      if(empty($hotel_ids)) $hotel_ids = [];
        if(in_array($minfo['id'], $hotel_ids)) {
          $memberPerc = 0;
        }
      }

        $mpr = floatval($ppr) + $memberPerc + $mpr;
        //print_r($room);  die;
        $all_totals = [];
        $num = 0;
        $daysCount = 0;

        foreach($insert_dates as $dates) {
          if (!empty($dates[1]) && !empty($dates[2])) {
              $bookQnt = "(SELECT IFNULL(SUM(tb.qnt),0) FROM #__bookings tb WHERE tb.status=1 AND tb.adprod_id=ta.id AND tb.date_to > STR_TO_DATE('" . $dates[1] . "','%d.%m.%Y') AND tb.date_from < STR_TO_DATE('" . $dates[2] . "','%d.%m.%Y'))";
              $startDate = ParseDate($dates[1]);
              $endDate = ParseDate($dates[2]);
              $diff = $endDate - $startDate;
              $daysCount = ceil($diff / 86400);

              if(count($insert_dates) >= 2 AND $daysCount != 0 AND $num > 0) {
                $daysCount++;
              }
              if(count($insert_dates) >= 2 AND $daysCount == 0 AND $num > 0) {
                $daysCount++;
              }
          }

          $qry = "SELECT tf.id,tam.id as room_id,tam.parent_id,tam.propsa,
                      tam.qnt,tam.mnacqnt,tf.people,tf.childs,LEAST((tf.propsb & 32),1) AS extrabedcnt, tf.status_id,tf.extrabed, tf.age_a, tf.price_a, tf.price_a2, tf.age_b, tf.price_b, 
                      IFNULL(tf.nprice,tf.oprice) as price
                      FROM (
                          SELECT ta.id,ta.parent_id,tf1.id as offer_id,ta.name_# as name,ta.descr_# as descr,ta.content_# as content,ta.propsa, ta.qnt,ta.qnt - " . $bookQnt . " AS mnacqnt,ta.pos
                          FROM #__adprods ta
                          INNER JOIN #__offers tf1 ON tf1.parent_id = ta.id
                          WHERE tf1.id = " . intval($dates[0]) . " AND ta.visible = 1
                          ) tam 
                          INNER JOIN #__offers tf ON tf.id = tam.offer_id";

          //$where = "tam.mnacqnt>0";

          //$qry = $qry . ' AND ' . $where;

          $DB = DatabaseProvider::provide();
          $row = $DB->Fetch($qry);

          

          if (intval($row['id']) <= 0) {
              continue;
          }


          $cuurentrate = floatval(HttpContext::current()->culture()->CurrencyRate());
          $currentDecimals = intval(HttpContext::current()->culture()->CurrencyDecimals());

          $age_a = intval($row['age_a']);
          $age_b = intval($row['age_b']);

          $childs_a = 0;
          $childs_b = 0;
          if ($childs > 0) {
              if($room[$i]['childs'] == 0) {
              $fperson = $fperson + $childs;
              $childs = 0;
            } else {
              $childAges = explode(',', $ages);
              sort($childAges);
              foreach ($childAges as $childAge) {
                  if($childAge < $age_a) {
                      $childs_a++;
                  } else if ($childAge <= $age_b) {
                      $childs_b++;
                  } else if ($childAge > $age_b) {
                      $fperson++;
                      $childs--;
                  }
              }
            }
          }

          //$ages = Product::childAges($ages, $age_a);

          

          $ages = explode(",",$ages);
          sort($ages);

          if(!empty($fperson) AND (!empty($childs) AND $childs > 0)) {
            //$ages = Product::childAges($ages,$age_a);
            $get_peoples = $childs + $fperson;
            $row_peoples = $row['childs'] + $row['people'];             
            if($row_peoples > $get_peoples) { 
              if($row['people'] > $fperson) {
                if($row['childs'] >= $childs) {
                  if($childs + $fperson <= $row['people']) {
                    $totals_count = 'ok';
                  } else {
                    $p = $row_peoples - $get_peoples;

                    if($childs == 3) {
                      if($p == 1) array_pop($ages);
                      else if ($p == 2) array_splice($ages, 1, 2);

                    } else if($childs == 2) {
                         if($p == 2) array_pop($ages);
                         else array_pop($ages);
                      }
                    }
                  } else {
                    $p = $row_peoples - $get_peoples;
                    if($childs == 3) {
                      if($p == 1) {
                       if($fperson == 2) array_splice($ages, 1, 4);
                       else array_pop($ages);
                      }
                      else if ($p == 2) array_splice($ages, 1, 2);
                    } else if($childs == 2) {
                        if($p == 2) array_pop($ages);
                        else array_pop($ages);
                      }
                      if($get_peoples == $row['people']) $ages = [];
                  }
                }  else { 
                   $p = $row_peoples - $get_peoples;
                    if($childs == 3) {
                      if($p == 1)array_pop($ages);
                      else if ($p == 2) array_splice($ages, 1, 2);
                    } else if($childs == 2) { 
                     if($p == 1) array_splice($ages, 1, 4);
                     else {
                        if($row['people'] > $persons) array_pop($ages);
                      }
                    } else if($childs == 1) {

                    }
                   }
                  } else if($row_peoples == $get_peoples) {
                   // die;
                  }
                  else {
                    $p = $row_peoples - $get_peoples;
                    if($childs == 3) {
                      if($p == 1) array_pop($ages);
                      else if ($p == 2) array_splice($ages, 1, 2);
                      else if($p == 0) {
                       if($row['people'] > $fperson) {
                        if($row['childs'] == 1) array_splice($ages, 1, 4);
                        else if($row['childs'] == 2) {
                           if($row['people'] >= 4) array_splice($ages, 1, 1);
                           else array_splice($ages, 1, 2);
                        }
                       }
                      }
                    } else if($childs == 2) {
                      //if($p < 0) $ages = Product::childAges($ages, $age_a);
                      if($fperson < $row['people']) array_pop($ages);
                      else if($fperson == $row['people']) {
                        array_splice($ages, 1, 4);
                      }
                     }
                  }

                  $ages = implode(",",$ages);
              }
              $ages = (string)$ages;

//print_r($childs); die;
/**/
          //print_r($ages); die;

          $price_a = floatval($row['price_a']);
          $price_a2 = floatval($row['price_a2']);
          $price_b = floatval($row['price_b']);
          
          $daysCount = intval($daysCount);
          $extrabed = intval($extrabed);
          $totals_extrabed = 0;



          if(!empty($page) AND $page != 'order') {
           if($page == 'page_room') $totals_room = floatval($row['price']) * $daysCount;
          } else {
            $totals_room = floatval($row['price']) * $daysCount * $quantity;
            $totals_extrabed = floatval($row['extrabed']) * $extrabed * $daysCount;
          }

          //print_r($fperson); die;

          //print_r($fperson ." - ". $childs . " ---- " .$row['people'] . " - " . $row['childs']); die;
          if($room[$i]['propsb'] >= 32) {
            $prop_val = 1;
          } else $prop_val = 0;

          if(!empty($fperson) AND ( ($fperson-1 == $offer['people'])) AND $page != 'order') {
              $totals_extrabed = floatval($row['extrabed']) + $extrabed * $daysCount;
          } else if(($fperson + $childs) == ($row['people'] + $row['childs'] + $prop_val) AND $page != 'order') {
            //print_r("( ".$fperson . " - " . $childs ." ) ---- " . " ( " . $row['people'] . " - " . $row['childs'] . " - " . $prop_val ." )"); die;

           
           $childs_c = 0;
           if ($childs > 0) {
              $childAges = explode(',', $ages);
              foreach ($childAges as $childAge) {
                  $childAge = min(intval($childAge), $age_b);
                  /*if ($childAge <= $age_a) {
                      $childs_a++;
                  } else if ($childAge <= $age_b) {
                      $childs_b++;
                  } else {
                    $childs_c++;
                  }*/
                  if ($childAge > $age_b) {
                    $childs_c++;
                  }
              }
          }

          //print_r($childs_c); die;

          if($childs_c == 0) {
            continue;
          }

          //if($row['people'] - $fperson == 1) $childs_b--;
          //if($row['people'] - $fperson == 1) continue;
          //print_r($childs); die;
          //if($childs_c != 0) {
            $totals_extrabed = floatval($row['extrabed']) + $extrabed * $daysCount;
          //}
             //$totals_count = 'ok';
          } else {
            //$totals_count = 'ok';
          }



          //print_r($fperson . " - " . $room[$i]['people'] . " - " . $childs); die;


          //print_r($totals_extrabed); die;

          //$totals_extrabed = floatval($row['extrabed']) * $extrabed * $daysCount;
          //$total_childs = (($childs_a > 0 ? $price_a + ($childs_a - 1) * $price_a2 : 0) + $childs_b * $price_b) * $daysCount;




          /*$childs_a = 0;
          $childs_b = 0;
          if ($childs > 0) {
                
              $childAges = explode(',', $ages);
              foreach ($childAges as $childAge) {
                  $childAge = min(intval($childAge), $age_b);
                  if ($childAge <= $age_a) {
                      $childs_a++;
                  } else if ($childAge <= $age_b) {
                      $childs_b++;
                  }
              }
          }*/

          $price_a = floatval($row['price_a']);
          $price_a2 = floatval($row['price_a2']);
          $price_b = floatval($row['price_b']);
          
          $daysCount = intval($daysCount);
          $extrabed = intval($extrabed);
          $quantity = 1;  
  
          $totals_room = floatval($row['price']) * $daysCount;

         // print_r($fperson . " - " . $childs . " - " . $row['people'] . " - " . $row['childs'] . " - " . $prop_val_search); die;

          if(($row['people'] + $prop_val_search) < $fperson) continue;

          if($fperson > $room[$i]['people']) {
            if($room[$i]['propsb'] >= 32) {
              if($room[$i]['people'] + 1 < $fperson) {
                continue;
              }
            }
          }
          
          //if(($fperson + $childs) > ($row['people'] + $row['childs'])) {
            $countFp = $fperson + $childs;
            $countRw = $row['people'] + $row['childs'];
            if($countRw < $countFp) continue;
            //$getFp = $countFp - $countRw;
            //if($getFp == 1) {
            //  if($room[$i]['propsb'] < 32) continue;
           // } else continue;
         // }
         
          if(!empty($fperson) AND (($fperson-1 == $offer['people']))) {
            $totals_extrabed = floatval($row['extrabed']) + $extrabed * $daysCount;
          } else if(($fperson + $childs) == ($row['people'] + $row['childs'] + $prop_val) AND $page != 'order') {
            
             $childs_a = 0;
             $childs_b = 0;
             if ($childs > 0) {
                $childAges = explode(',', $ages);
                foreach ($childAges as $childAge) {
                    $childAge = min(intval($childAge), $age_b);
                    if ($childAge <= $age_a) {
                        $childs_a++;
                    } else if ($childAge <= $age_b) {
                        $childs_b++;
                    }
                }
            }
            //$totals_extrabed = floatval($row['extrabed']) + $extrabed * $daysCount;
          }

          if($totals_count != 'ok') {
            $total_childs = (($childs_a > 0 ? $price_a + ($childs_a - 1) * $price_a2 : 0) + $childs_b * $price_b) * $daysCount;
          }

          
          
          //$totals_extrabed = floatval($row['extrabed']) * $extrabed * $daysCount;
          //$total_childs = (($childs_a > 0 ? $price_a + ($childs_a - 1) * $price_a2 : 0) + $childs_b * $price_b) * $daysCount;

          
          if($fperson >= $row['people']) {
            $totals = ($totals_room + $totals_extrabed + $total_childs);
          } else {
            $totals = ($totals_room + $totals_extrabed + $total_childs);
          }

          //$totals = ($totals_room + $totals_extrabed + $total_childs);
          $totals = $totals - $totals * $mpr / 100;
          $row['totals'] = $totals;

          $all_totals[] = $row['totals'];

          $row['price'] = $row['totals'];
          $AmountCurrency = round($totals / $cuurentrate, $currentDecimals);

          $row['totalstext'] = sprintf(HttpContext::current()->culture()->CurrencyFormat(), number_format($AmountCurrency, HttpContext::current()->culture()->CurrencyDecimals()));

          $row['maxchilds'] = min($quantity * $row['childs'], 20);
          $row['maxextrabed'] = $quantity * $row['extrabedcnt'];
          $num++;


      }
        
      $summ = 0;
      foreach ($all_totals as $key => $value) {
        $summ = $summ + $value;
        if(empty($summ)) continue;
      }

      $cuurentrate = floatval(HttpContext::current()->culture()->CurrencyRate());
      $currentDecimals = intval(HttpContext::current()->culture()->CurrencyDecimals());
      $AmountCurrency = round($summ / $cuurentrate, $currentDecimals);

      $amount = $AmountCurrency;

      $AmountCurrency = sprintf(HttpContext::current()->culture()->CurrencyFormat(), number_format($AmountCurrency, HttpContext::current()->culture()->CurrencyDecimals()));

      if($amount <= 0) continue;
       
      //return array($amount, $AmountCurrency);
      $array_prices[] = [$amount, $AmountCurrency];
    }
    if(!empty($array_prices)) {
       foreach ($array_prices as $array) {
          $min_price[] = $array[0];
       }
       array_multisort($min_price,SORT_ASC,$array_prices);
       
    }
    return array_unique($array_prices);
   } 
	
   public static function HotelDistance($post_lat, $post_long, $item_lat, $item_long, $distance) {
      $earth_radius = 6371;
      $dLat = deg2rad( $item_lat - $post_lat );  
      $dLon = deg2rad( $item_long - $post_long );  

      $a = sin($dLat/2) * sin($dLat/2) + cos(deg2rad($post_lat)) * cos(deg2rad($item_lat)) * sin($dLon/2) * sin($dLon/2);  
      $c = 2 * asin(sqrt($a));  
      $d = $earth_radius * $c;  
      return $d;  
   }
   
   public static function isFavorite($item_id, $user_id) {
      $DB = DatabaseProvider::provide();
      $rw = $DB->Scalar("SELECT item_id FROM #__favs WHERE item_id='".$item_id."' AND user_id='".$user_id."'");
      if(!empty($rw)) return 1;
      return 0;
    }

}

?>
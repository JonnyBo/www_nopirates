<?php

/**
 * Description of AfishaSaver
 *
 * @author Vladislav Holovko <vlad.holovko@gmail.com>
 */
class AfishaSaver extends CApplicationComponent{
    
    public $db;
    public $connectionId = 'db';
    public $projectId;
	public $canPutToday = true;
    public $startToday;
    public $endToday;
	public $i = 0;
    
    public function init() {
        parent::init();
        if (null === $this->db = Yii::app()->getComponent($this->connectionId)) {
            throw new CException("Can't load database component");
        }
		$this->i = 0;
    }
    
    
    /* Получаем преобразованную дату в формат ГГГГ-ММ-ДД */

    public function getDate($sdate) {
        return (string) date('Y-m-d', strtotime($sdate));
    }

    /* Смотрим, можем ли мы выкладывать данные за сегодня */

    public function canPut($sdate) {
        if ($this->getDate($sdate) != date('Y-m-d') || ($this->getDate($sdate) == date('Y-m-d') && time() >= strtotime($this->startToday) && time() <= strtotime($this->endToday)))
            return true;
        else
            return false;
    }

    /**
     * Get an ID of the existing cinema or add a new one and get an Id
     * @param string $cinema
     */
    public function getFilmId($movie) {
		$this->i++;
        $sql = "select film_id from put_film(:film)";
        $id =  $this->db->createCommand($sql)->queryScalar(array(
            ':film'=>$movie
        ));
        $this->db->commit();
        return $id;
    }
    public function getTvFilmId($movie, $kid, $is_serie, $serie_num, $film_year, $country, $original_title, $director) {
		$this->i++;
        $sql = "select film_id from put_tv_film(:film, :kid, :is_serie, :serie_num, :film_year, :country, :original_title, :director)";
        $id =  $this->db->createCommand($sql)->queryScalar(array(
            ':film'=>$movie,
            ':kid' => $kid, 
            ':is_serie' => $is_serie, 
            ':serie_num' => $serie_num, 
            ':film_year' => $film_year, 
            ':country' => $country, 
            ':original_title' => $original_title, 
            ':director' => $director
        ));
        $this->db->commit();
        return $id;
    }
    public function getKinopoiskFilms($context = '') {
        $sql = "select distinct
                    k.ext_id as cinema_id
                from kinopoisk_cinemas k
                   inner join cinemas c on (k.cinema_id = c.kinopoisk_cinema_id)
                ";
        $data =  Yii::app()->db->createCommand($sql)->queryColumn();
        return $data;
    }
    
    public function getCinemaId($cinema,$city, $url = null) {
		$this->i++;
        if (null === $this->projectId) 
            throw new CException("projectId is an obligatory parameter.");
        $sql = "select cinema_id from put_cinema(:project_id, :cinema, :city, :url)";
        $id = $this->db->createCommand($sql)->queryScalar(array(
            ':project_id'=>$this->projectId,
            ':cinema'=>$cinema,
            ':city'=>$city,
            ':url'=>$url
        ));
        $this->db->commit();
        return $id;
    }
     public function getTvChannelId($cinema) {
		$this->i++;
        $sql = "select channel_id from put_tv_channel(:cinema)";
        $id = $this->db->createCommand($sql)->queryScalar(array(
            ':cinema'=>$cinema
        ));
        $this->db->commit();
        return $id;
    }
    
    public function getKinopoiskCinemaId($cinema,$city,$extid, $url) {
        $sql = "select cinema_id from put_kinopoisk_cinema(:cinema, :city, :ext_id, :url)";
        $id = $this->db->createCommand($sql)->queryScalar(array(
            ':cinema'=>$cinema,
            ':city'=>$city,
            ':ext_id'=>$extid,
            ':url'=>$url
        ));
        $this->db->commit();
        return $id;
    }
    
    public function putAll($filmId,$cinemaId,$audition,$sdate,$stime,$sformat, $url='') {
		$this->i++;
        try {
            $sql = "execute procedure put_all(:project_id, :film_id, :cinema_id, :audition, :sdate, :stime, :sformat, :url)";
            $this->db->createCommand($sql)->execute(array(
                ':project_id'=>$this->projectId,
                ':film_id'=>$filmId,
                ':cinema_id'=>$cinemaId,
                ':audition'=>$audition,
                ':sdate'=>$sdate,
                ':stime'=>$stime,
                ':sformat'=>$sformat,
                ':url' => $url
            ));
            $this->db->commit();
        } catch (Exception $e) {
            echo 'Выброшено исключение: ',  $e->getMessage(), "\n";
        }
        
        
		if ($this->i >= 100) {
			$this->db->setActive(false);
			$this->db->setActive(true);
			$this->i = 0;
		}
    }
    
    public function clearData() {
      $sql = "select p.today_start, p.today_end
                from projects p
                where p.project_id = $this->projectId";
        $row = $this->db->createCommand($sql)->queryRow();
        /*$row = $this->db->get_record();*/
        $this->startToday = $row['TODAY_START'];
        $this->endToday = $row['TODAY_END'];
        if ($this->canPut(date('Y-m-d')))
            $this->canPutToday = true;
        else
            $this->canPutToday = false;
        
    $sql = "update screens_total s
            set url = null
            where s.screen_date = current_date - 1   and s.project_id = $this->projectId"; 
    $this->db->createCommand($sql)->execute();   
    }
    
    public function getTvMaxDate() {
        $this->i++;
        //$sql = "select coalesce(max(sdate), cast('2006-12-31' as date)) from tv_screens";
         $sql = 'select current_date from rdb$database';
        $date = $this->db->createCommand($sql)->queryScalar(array(
        ));
        $this->db->commit();
        return $date;
    }
    
    public function isTvFilmExists($url) {
        $this->i++;
        $sql = "select film_id from IS_TV_FILM_EXISTS(:url)";
        $film_id = $this->db->createCommand($sql)->queryScalar(array(
            ':url'=>$url
        ));
        $this->db->commit();
        return $film_id;
    }
    
    public function putTvScreens($film_id, $channel_id, $sdate, $stime) {
        $this->i++;
        $sql = "insert into tv_screens(film_id, channel_id, sdate, stime) values (:film_id, :channel_id, :sdate, :stime)";
        $this->db->createCommand($sql)->execute(array(
            ':film_id'=>$film_id,
            ':channel_id'=>$channel_id,
            ':sdate'=>$sdate,
            ':stime'=>$stime
        ));
        $this->db->commit();
        if ($this->i++ >= 100) {
			$this->db->setActive(false);
			$this->db->setActive(true);
			$this->i = 0;
		}
    }
    
    public function clearChannelData($channel_id, $sdate) {
        $this->i++;
        $sql = "delete from tv_screens t where t.channel_id = :channel_id and t.sdate = :sdate;";
        $this->db->createCommand($sql)->execute(array(
            ':channel_id'=>$channel_id,
            ':sdate'=>$sdate
        ));
        $this->db->commit();
        if ($this->i++ >= 100) {
			$this->db->setActive(false);
			$this->db->setActive(true);
			$this->i = 0;
		}
    }
    
    public function getFormat($str) {
        /*$sql = "select format from get_format(:string)";
        $format = $this->db->createCommand($sql)->queryScalar(array(
            ':string'=>$str,
        ));
        $this->db->commit();*/
        return $str;
    }
    
    public function clearKinopoiskData($cinemaId,$date) {
        $sql = "execute procedure CLEAR_KINOPOISK_DATA(:cinemaId, :date)";
        $this->db->createCommand($sql)->execute(array(
            ':cinemaId'=>$cinemaId,
            ':date'=>$date
        ));
        //$this->db->commit();
    }
    
     public function putKinopoiskData($filmId,$cinemaId,$sdate,$stime) {
        $sql = "execute procedure put_kinopoisk_data(:cinema_id, :film_id, :sdate, :stime)";
        $this->db->createCommand($sql)->execute(array(
            ':film_id'=>$filmId,
            ':cinema_id'=>$cinemaId,
            ':sdate'=>$sdate,
            ':stime'=>$stime
        ));
       // $this->db->commit();
    }
    public function putData($filmId, $cinemaId, $sdate) {       
        $sql = "execute procedure put_data(:project_id, :film_id, :cinema_id, :sdate)";
        $this->db->createCommand($sql)->execute(array(
            ':project_id'=>$this->projectId,
            ':film_id'=>$filmId,
            ':cinema_id'=>$cinemaId,
            ':sdate'=>$sdate
        ));
        $this->db->commit(); 
    }
    public function canPutCinemaData($cinemaId) {
        $sql = "select canput from canputcinemadata(:project_id, :cinema_id)";
        $canPutCinemaData = $this->db->createCommand($sql)->queryScalar(array(
            ':project_id'=>$this->projectId,
            ':cinema_id'=>$cinemaId,
        ));
        $this->db->commit();
        return $canPutCinemaData;
    }
}

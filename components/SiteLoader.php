<?php
namespace app\components;

use app\models\Objects;
use Yii;
use yii\base\Component;
use linslin\yii2\curl;
/**
 * Description of SiteLoader
 *
 * @author Vladislav Holovko <vlad.holovko@gmail.com>
 */
class SiteLoader extends Component
{
    
    public $waitBeforeRequest = false;
    public $forceWait = false;
    
    public $waitRandFork;
    
    public $baseUrl = '';
    public $codeBaseURL = '';
    public $vkToken = '';
    
    public $startBaseUrl = '';
    
    public $useCache = true;
    public $forceCache = false;


    public $curlDebug = false;
    
    /**
     * Relative cache directory 
     * @var string
     */
    public $cacheDir;
    
    public $cacheFilePrefix = '';
    
    public $curlExtensionId = 'curl';
    
    /**
     * Curl component instance
     * @var object
     */
    private $_curl;
    
    public function init() {
        parent::init();
        if (!is_array($this->waitRandFork) || count($this->waitRandFork) < 2) {
            $this->waitRandFork = array(500000,3000000); // 0.5 - 3sec
        }
        if (!is_string($this->cacheDir) || !strlen($this->cacheDir)) {
            $this->cacheDir = dirname(__DIR__) . '/runtime/'.basename(get_class($this)).'Cache';
        }
        /*
        if (! $this->_curl = Yii::$app->getComponent($this->curlExtensionId)) {
            Yii::log('No curl extension. "file_get_contents" is used instead.');
        }
        */
        if (! $this->_curl = new curl\Curl()) {
            Yii::log('No curl extension. "file_get_contents" is used instead.');
        }
    }


    public function defineBaseUrl($url) {
        if (!preg_match('#^(https?://)([^/]+)(/)?#', $url, $m)) 
            return false;
        
        if (empty($this->startBaseUrl))
            $this->startBaseUrl = $m[1].$m[2];
        
        $this->baseUrl = $m[1].$m[2];
    }
    
    public function buildCacheFile($url) {
        $relativeUrl = str_replace($this->baseUrl, '', $url);
        $url = $this->baseUrl.$relativeUrl;
        $cacheFile = preg_replace(array('#^https?://#','#/#','/&/','/=/','/\?/'), array('','SLASH','AND','EQ','QUESTION'), $url);
        if ($this->cacheFilePrefix)
            $cacheFile = $this->cacheFilePrefix.$cacheFile;
        
        return $cacheFile;
    }

    /**
     * Get content of the URL or cached copy
     * @param string $url
     * @return string
     */
    public function getSiteContent($url,$wait = null,$dropCache = null) {
        if (null === $wait || $this->forceWait) {
            $wait = $this->waitBeforeRequest;
        }
        if (null === $dropCache || $this->forceCache) {
            $dropCache = !$this->useCache;
        }
        $data = "";
        $cacheDir = $this->cacheDir;
        if (!is_dir($cacheDir)) {
            mkdir($cacheDir,0777);
        }
        $this->defineBaseUrl($url);
        $cacheFile = $cacheDir.'/'.$this->buildCacheFile($url);
        if ($dropCache && is_file($cacheFile)) {
            if (false === unlink($cacheFile)) {
                Yii::log("Can't clear cache: $cacheFile");
            }
        }
        $cacheExists = is_file($cacheFile);
        $src = $cacheExists ? $cacheFile : $url;
        if (!$cacheExists && $wait) {
            usleep(rand($this->waitRandFork[0], $this->waitRandFork[1]));
        }
        if ($cacheExists) {
            if(false === $data = file_get_contents($cacheFile)) {
                Yii::log("Can't get data from cacheFile: $src");
                return false;
            }
        }
        else {
            if(false === $data = $this->get($url)) {
                //Yii::log("Can't get data from url: $src");
                return false;
            }
        }
        if (!$cacheExists) {
            //make file cache
            if ($fh = fopen($cacheFile,'w')) {
                fwrite($fh,$data);
                fclose($fh);
            }
            else {
                Yii::log("Error opening file for writing: $cacheFile");
                return false;
            }
        }
        return $data;
    }
    
    
    public function clearCache($forceAll = false) {
        $cacheDir = Yii::app()->basePath.'/'.$this->cacheDir;
        $filePrefix = $forceAll ? '' : $this->cacheFilePrefix;
        $files = glob($cacheDir.'/'.$filePrefix.'*'); // get all file names
        foreach($files as $cacheFile) {
            if(is_file($cacheFile)) {
                if(false === unlink($cacheFile)) {
                    Yii::log("Can't clear cache after work: $cacheFile. Loop is stopped.");
                    break;
                } 
            }
        }
    }
    
    public function postSite($url,$postData = array(),$wait = null) {
        if ($wait === null) {
            $wait = $this->waitBeforeRequest;
        }
        $data = "";
        $this->defineBaseUrl($url);
        if ($wait) {
            usleep(rand($this->waitRandFork[0], $this->waitRandFork[1]));
        }
        return $this->post($url, $postData);
    }
    
    /*public function buildUrl($url) {
        if (empty($this->baseUrl)) {
            if(false === $this->defineBaseUrl($url)) {
                Yii::log("The baseUrl is not set. Also the source url is not absolute: $url");
                return false;
            }
        }
        $relativeUrl = str_replace($this->baseUrl, '', $url);
        $url = $this->baseUrl.$relativeUrl;
        return $url;
    }*/
    
    public function setOptions($options) {
        if ($this->_curl) {
            $this->_curl->setOptions($options);
        }
        return $this;
    }
    
    public function setOption($name,$value) {
        if ($this->_curl) {
            $this->_curl->setOption($name,$value);
        }
        return $this;
    }
    
    public function emptyCookies() {
        $options = $this->_curl->getOptions();
        if ($options[CURLOPT_COOKIEFILE] && is_file($options[CURLOPT_COOKIEFILE])) {
            unlink($options[CURLOPT_COOKIEFILE]);
        }
        return $this;
    }
    
    public function withCookie($name,$value) {
        $this->setOption(CURLOPT_COOKIE, "$name=$value;");
        return $this;
    }

    public function get($url, $params = array()) {
        if (!$this->_curl) {
            return file_get_contents($url);
        }
        //$value = $this->_curl->get($url, $params, $this->curlDebug);
        $value = $this->_curl->setGetParams($params)->get($url);
        //$options = $this->_curl->getOptions();
        //$status = $this->getStatus();
        /*
        if (false === $options[CURLOPT_FOLLOWLOCATION] && in_array($status,array(301,302))) {
            $value = '';
        }
        */
        if (($this->_curl->responseCode == 301) || ($this->_curl->responseCode == 302)) {
            $value = '';
        }
        return $value;
    }
    
    public function post($url,$data, $params = array()) {
        if (!$this->_curl) {
            Yii::log("No curl, can't POST $url");
            return false;
        }
        //$value = $this->_curl->post($url,$data, $params, $this->curlDebug);
        $value = $this->_curl->setPostParams($params)->post($url);
        /*
        $options = $this->_curl->getOptions();
        //$status = $this->getStatus();
        if (false === $options[CURLOPT_FOLLOWLOCATION] && in_array($status,array(301,302))) {
            $value = '';
        }
        */
        if (($this->_curl->responseCode == 301) || ($this->_curl->responseCode == 302)) {
            $value = '';
        }
        return $value;
    }
    
    public function put($url,$data, $params = array()) {
        if (!$this->_curl) {
            Yii::log("No curl, can't PUT $url");
            return false;
        }
        return $this->_curl->put($url,$data, $params, $this->curlDebug);
    }
    
    public function delete($url,$params = array()) {
        if (!$this->_curl) {
            Yii::log("No curl, can't DELETE $url");
            return false;
        }
        return $this->_curl->delete($url,$params, $this->curlDebug);
    }
    
    public function getHeaders() {
        if (!$this->_curl) {
            Yii::log("No curl. Can't get headers");
            return false;
        }
        //return $this->_curl->getHeaders();
    }
    
    public function addHeader($headers = array()) {
        if (!$this->_curl) {
            Yii::log("No curl. Can't add headers");
            return false;
        }
        return $this->_curl->addHeader($headers);
    }
    
    public function withAuthBasic($username, $password)
    {
        $this->addHeader(array(
            'Authorization' => 'Basic '. base64_encode($username . ':' . $password)
        ));
        return $this;
    }
    
    public function getError() {
        if (!$this->_curl) {
            Yii::log("No curl. Can't get error");
            return false;
        }
        return $this->_curl->getError();
    }
    
    public function getInfo() {
        if (!$this->_curl) {
            Yii::log("No curl. Can't get info");
            return false;
        }
        return $this->_curl->getInfo();
    }
    
    public function getStatus() {
        if (!$this->_curl) {
            Yii::log("No curl. Can't get status");
            return false;
        }
        return $this->_curl->getStatus();
    }

    public function sendCurl($url, $headers = false, $cookie = false, $post_data = false) {
        $curl = curl_init();
        //$headers = array('Referer: https://kinokrad.co/index.php','Origin: https://kinokrad.co','Content-Type: application/x-www-form-urlencoded');
        curl_setopt($curl, CURLOPT_URL, $url);
        curl_setopt($curl, CURLOPT_HEADER, false);
        curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, false);
        curl_setopt($curl, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.8.1.13) Gecko/20080311 Firefox/2.0.0.13');
        curl_setopt($curl, CURLOPT_RETURNTRANSFER,1);
        if ($headers) {
            curl_setopt($curl ,CURLOPT_HTTPHEADER,$headers);
        }
        if ($post_data) {
            curl_setopt($curl, CURLOPT_POST, true);
            curl_setopt($curl, CURLOPT_POSTFIELDS, $post_data);
        }
        curl_setopt($curl, CURLOPT_FOLLOWLOCATION, 1);
        curl_setopt($curl, CURLOPT_CONNECTTIMEOUT, 30);
        if ($cookie) {
            curl_setopt($curl, CURLOPT_COOKIEJAR, Yii::$app->basePath . '/web/cookies/' . $cookie);
            curl_setopt($curl, CURLOPT_COOKIEFILE, Yii::$app->basePath . '/web/cookies/' . $cookie);
        }
        $out = curl_exec($curl);
        $info = curl_getinfo($curl);
        curl_close($curl);
        return $out;
    }


    public function getSearchStrings($objects, $onlyYear = false) {
        $tituls = [];
        if (!empty($objects)) {
            foreach ($objects as $object) {
                //if ($object->original_title)
                //    $tituls[$object->object_id][] = '"' . $object->original_title . '"';

                if (!$onlyYear) {
                    $tituls[$object->object_id][] = '"' . $object->title . '"';
                }
                if ($object->year_prod)
                    $tituls[$object->object_id][] = '"' . $object->title . ' ' . $object->year_prod . '"';
            }
        }
        return $tituls;
    }
    
}

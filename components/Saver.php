<?php

/**
 * Description of AfishaSaver
 *
 * @author Vladislav Holovko <vlad.holovko@gmail.com>
 */
class Saver extends CApplicationComponent{
    
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

    public function sentEmail($email, $info, $tpl = false, $files = [])
    {
        if (!$tpl)
            $tpl = 'first-html';

        $result = Yii::$app->mailer->compose([
            'html' => $tpl,
        ], $info);

        if (!empty($files)) {
            $finfo = new finfo(FILEINFO_MIME_TYPE);
            foreach ($files as $file) {
                $path_info = pathinfo($file);
                $content_file = file_get_contents($file);
                $type =  $finfo->buffer($content_file);
                $result->attachContent($content_file, [
                    'fileName' => $path_info['basename'],
                    'contentType' => $type]);
            }

        }

        $result->setTo([$email]);
        $result->setSubject('Сообщение от правообладателя');
        $result->send();

        if (!$result) {
            throw new \RuntimeException('Sending error.');
        }
    }
}

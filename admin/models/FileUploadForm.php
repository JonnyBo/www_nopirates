<?php
/**
 * Created by PhpStorm.
 * User: Администратор
 * Date: 26.04.2019
 * Time: 12:25
 */

namespace app\models;


use yii\base\Model;
use yii\web\UploadedFile;

class FileUploadForm extends Model
{

    public $files;

    public function rules()
    {
        return [
            //[['files'], 'file', 'skipOnEmpty' => false, 'extensions' => ['png', 'jpg', 'gif', 'jpeg', 'svg', 'xls', 'xlsx', 'csv',]],
            [['files'], 'file'],
            //[['exel'], 'file', 'skipOnEmpty' => false, 'extensions' => ['xls', 'xlsx', 'csv']],
        ];
    }

    public function uploadHere()
    {
        //echo $this->files->extension;
        if ($this->validate()) {
            $filename = md5(time().$this->files->baseName) . '_' . $this->files->baseName . '.' . $this->files->extension;
            //foreach ($this->files as $file) {
            $this->files->saveAs( 'files/' . $filename);
            //}
            return $filename;
        } else {
            return false;
        }
    }

    public function uploadFile() {

    }
}
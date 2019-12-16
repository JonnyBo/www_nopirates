<?php

namespace app\models;

use Yii;

/**
 * This is the model class for table "objects".
 *
 * @property int $object_id
 * @property string $title
 * @property string $original_title
 * @property int $year_prod
 * @property string $director
 * @property int $company_id
 * @property string $start_date
 * @property string $end_date
 * @property string $pu
 * @property int $duration
 */
class Objects extends \yii\db\ActiveRecord
{
    /**
     * {@inheritdoc}
     */
    public static function tableName()
    {
        return 'objects';
    }

    /**
     * {@inheritdoc}
     */
    public function rules()
    {
        return [
            [['year_prod', 'company_id', 'duration'], 'integer'],
            [['start_date', 'end_date'], 'string'],
            [['title', 'original_title', 'director'], 'string', 'max' => 255],
            [['pu'], 'string', 'max' => 1024],
        ];
    }

    /**
     * {@inheritdoc}
     */
    public function attributeLabels()
    {
        return [
            'object_id' => 'Object ID',
            'title' => 'Title',
            'original_title' => 'Original Title',
            'year_prod' => 'Year Prod',
            'director' => 'Director',
            'company_id' => 'Company ID',
            'start_date' => 'Start Date',
            'end_date' => 'End Date',
            'pu' => 'Pu',
            'duration' => 'Duration',
        ];
    }
}

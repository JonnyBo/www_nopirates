<?php
use yii\helpers\Html;

/* @var $user \common\entities\User */

?>

Привет, <?=$name?>!<br>
<br>
<?= $message ?><br>
<br>
Есть вопросы? Пишите в нашу службу поддержки: <?= Html::mailto('support@myls.education', 'support@myls.education', ['style' => ['color' => '#74ACC8']]) ?><br>
<br>
С уважением, команда Myls.school

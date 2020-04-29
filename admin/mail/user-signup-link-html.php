<?php
use yii\helpers\Html;

/* @var $user \common\entities\User */

?>

Привет!<br><br>Для регистрации на платформе Myls.school кликните <?= Html::a('сюда', $link, ['style' => ['color' => '#74ACC8']]) ?> и следуйте указаниям системы.<br><br>Есть вопросы по регистрации? Пишите в нашу службу поддержки: <?= Html::mailto('support@myls.education', 'support@myls.education', ['style' => ['color' => '#74ACC8']]) ?><br><br>С уважением, команда Myls.school

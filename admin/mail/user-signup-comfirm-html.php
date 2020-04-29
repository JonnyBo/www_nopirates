<?php
use yii\helpers\Html;

/* @var $user \common\entities\User */

$confirmLink = Yii::$app->urlManager->createAbsoluteUrl(['site/signup-confirm', 'token' => $user->email_confirm_token]);
?>


    Привет, <?= Html::encode($user->name) ?> <?= Html::encode($user->surname) ?>!<br><br>
    Добро пожаловать на платформу Myls.school!<br><br>
    Чтобы приступить к работе на платформе, кликните <?= Html::a('сюда', $confirmLink, ['style' => ['color' => '#74ACC8']]) ?>.<br><br>
    Перед началом работы советуем ознакомиться с <?= Html::a('основными принципами работы на платформе', 'https://www.manula.com/manuals/myls/myls-school-knowledge-base/1/ru/topic/myls-school-how-to-work', ['style' => ['color' => '#74ACC8']]) ?>, а также с <?= Html::a('кратким руководством пользователя', 'https://www.manula.com/manuals/myls/myls-school-knowledge-base/1/ru/topic/myls-school-quick-start-guide', ['style' => ['color' => '#74ACC8']]) ?>.<br><br>
    Остались вопросы по работе платформы? Мы будем рады ответить на них!<br><br>
    Пишите в нашу службу поддержки: <?= Html::mailto('support@myls.education', 'support@myls.education', ['style' => ['color' => '#74ACC8']]) ?><br><br>
    С уважением, команда Myls.school


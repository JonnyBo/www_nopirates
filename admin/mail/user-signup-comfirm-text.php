<?php

/* @var $user \common\entities\User */

$confirmLink = Yii::$app->urlManager->createAbsoluteUrl(['site/signup-confirm', 'token' => $user->email_confirm_token]);
?>
Hello <?= $user->name ?> <?= $user->surname ?>,

Follow the link below to confirm your email:

<?= $confirmLink ?>

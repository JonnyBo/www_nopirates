<?php

/* @var $user \common\entities\User */

$confirmLink = Yii::$app->urlManager->createAbsoluteUrl(['site/restore', 'token' => $user->password_reset_token]);
?>
Hello <?= $user->name ?> <?= $user->surname ?>,

Follow the link below to reset your password:

<?= $confirmLink ?>

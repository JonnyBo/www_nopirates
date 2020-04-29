<?php
echo '<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title> Title </title>
    <link href="'.Yii::$app->request->hostInfo.'/reports/css/bootstrap.min.css" rel="stylesheet">
    <link href="'.Yii::$app->request->hostInfo.'/reports/fonts/stylesheet.css" rel="stylesheet">
</head>
<style>
    .logo {
        margin-left: -36px;
    }
    
    header {
        font-size: 16px;
        margin-bottom: 50px;
    }
    
    body {
        font-size: 16px;
        width: 100%;
        font-family: "Shentox";
        padding-left: 48px;
        padding-right: 24px;
    }
    
    p {
        line-height: 1.3;
    }
    
    strong {
        font-weight: 600;
    }
</style>

<body>
    <header>
        <table style="width: 100%;">
            <tbody>
                <tr>
                    <td style="width: 50%;"><img src="' . Yii::$app->request->hostInfo . '/reports/img/logo.svg" alt="" class="logo" width="300px" height="149px"></td>
                    <td style="text-align: right; width: 50%;">
                        <p>Domicilio fiscal
                            <br />FreeDa Language Space S.L.
                            <br />NIF B-66068156</p>
                        <p>C/Cabanes 40 bajos
                            <br />08004 Barcelona
                            <br />Barcelona &ndash; Espa&ntilde;a</p>
                    </td>
                </tr>
            </tbody>
        </table>
    </header>
</body>

</html>';

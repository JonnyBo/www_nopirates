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
    footer p {
        font-size: 13px;
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
    <footer>
        <p style="text-align: right;">&nbsp;</p>
        <table style="width: 100%; margin-bottom: 50px;">
            <tbody>
                <tr>
                    <td style="width: 50%;">+34 722 817 533
                        <br />+34 931 729 897</td>
                    <td style="width: 50%; text-align: right;">info@freedaspace.com
                        <br />www.freedaspace.com</td>
                </tr>
            </tbody>
        </table>
        <p style="text-align: center; font-size: 12px; font-weight: 600">FREEDA LANGUAGE SPACE, S.L.&nbsp;&nbsp;&nbsp;&nbsp;N.I.F. B66068156&nbsp;&nbsp;&nbsp;&nbsp;Inscrita R.M. de Barcelona TOMO 43866, FOLIO 91, HOJA B440477, INSCRIPCI&Oacute;N 1
            <br />Domicilio: C/ Cabanes, 40, bajos (08004 - Barcelona) email: info@freedaspace.com</p>
    </footer>
</body>

</html>';


<?php
echo '<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title> Title </title>
    <link href="' . Yii::$app->request->hostInfo . '/reports/css/bootstrap.min.css" rel="stylesheet">
    <link href="' . Yii::$app->request->hostInfo . '/reports/fonts/stylesheet.css" rel="stylesheet">
</head>
<style>

    main {
        padding-top: 50px;
    }
    
    .line {
        width: 100%;
        height: 1px;
        border-bottom: 1px solid black;
    }
    
    .cyan {
        color: #17bdc6;
    }
        
    body {
        font-size: 16px;
        width: 100%;
        font-family: "Shentox";
        padding-left: 48px;
        padding-right: 24px;
    }
    
    h1 {
        font-size: 40px;
    }
    
    h2 {
        font-size: 20px;
    }
    
    p {
        line-height: 1.3;
    }
    
    .main-info {
        font-size: 16px;
        line-height: 1.2;
    }
    
    .sb {
        font-weight: 600;
    }
    
    .table-header {
        width: 100%;
    }
    
    strong {
        font-weight: 600;
    }
    
    .prices td:not(:first-child) {
        font-weight: 600;
    }
    
    td {
        vertical-align: top;
        line-height: 1.3
    }
    
    .prices td {
        padding: 16px 0 12px;
    }
    
    .prices td:first-child {
        padding: 16px 0 12px 16px;
    }
    
    .prices tr {
        border-bottom: 1px solid #888;
    }
    
    .prices tbody tr:last-child {
        border-bottom: 2px solid #333;
    }
    
    .prices thead tr {
        border-bottom: none;
    }
    
    .prices {
        margin-bottom: 16px;
    }
    
    .total {
        margin-bottom: 24px;
    }
    
    hr {
        border-color: #888;
    }
    
    footer p {
        font-size: 13px;
    }
    
    .hatching {
        background: linear-gradient(-45deg, rgba(0, 0, 0, 0) 49.9%, #17bdc6 49.9%, #17bdc6 60%, rgba(0, 0, 0, 0) 60%), linear-gradient(-45deg, #17bdc6 10%, rgba(0, 0, 0, 0) 10%);
        background-size: 0.5em 0.5em
    }
    
    th span {
        background-color: white;
        padding: 2px 6px;
    }
    
    th {
        padding: 4px;
    }
    
    th:first-child {
        padding-left: 16px;
    }
    
    .tableHeaderContainer {
        width: 100%;
        position: relative;
    }
    
    .tableHeaderContainer img {
        position: absolute;
        top: 0;
    }
    .prices thead {
        background: url(' . Yii::$app->request->hostInfo . '/reports/img/Asset%204.png);
    }
    .logo {
        margin-left: -36px;
    }
    
    header {
        font-size: 16px;
        margin-bottom: 50px;
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
    </header>';
$resSQL = $this->selectAll("select a.account_num,
                                           lpad(extract(day from a.billing_date), 2, '0') || '/' || lpad(extract(month from a.billing_date), 2, '0') || '/' || lpad(extract(year from a.billing_date), 4, '0') as billing_date,
                                           get_surname_client(c.client_id, c.company_id) as client_name,
                                           c.document,
                                           coalesce(get_surname_client(cl.client_id, cl.company_id), get_surname_client(c.client_id, c.company_id)) as payer_name,
                                           cl.address,
                                           cl.postal_code,
                                           translate(s.country_name, 'en') as country,
                                           t.territory as city,
                                           iif(cl.sys_type_person_id = 1, cl.inn, cl.document) as inn,
                                           amount_services_account(a.account_id) sum_account,
                                           a.payer_id,
                                           cl.sys_type_person_id
                                    from accounts a
                                       inner join clients c on c.client_id = a.client_id
                                       left outer join clients cl on (cl.client_id = a.payer_id)
                                       left outer join sys_countries s on s.sys_country_id = cl.sys_country_id
                                       left outer join territories t on t.t_id = cl.city_id
                                    
                                    where a.account_id = :id   ", $params, $this->ddb);
if (isset($resSQL['success'])) {
    $data = $resSQL['success'][0];
} else {
    throw new HttpException(500, $resSQL['error']);
}

$this->outputFilename = 'Proforma ' . $data['account_num'] . '.pdf';

echo '<main>
        <h1>Proforma&nbsp;<span class="cyan">' . $data['account_num'] . '</span></h1>
        <!--<h2>Proforma&nbsp;<span  class="cyan">2019/0001</span></h2>-->
        <hr />
        <table style="width: 100%;" class="main-info">
            <tbody>
                <tr>
                    <td style="width: 50%; vertical-align: top;padding-left:16px;">Fecha
                        <br /><strong>' . $data['billing_date'] . '</strong></td>
                    <td style="width: 50%; vertical-align: top;">';
if ($data['payer_id'] && $data['sys_type_person_id'] == 2) {
    echo 'Facturar a: <strong>' . $data['payer_name'] . '</strong>
                        <br /><strong>' . $data['address'] . '</strong>
                        <br /><strong>' . $data['postal_index'] . ' ' . $data['city'] . ' ' . $data['country'] . '</strong>
                        <br />CIF/NIF: <strong>' . $data['inn'] . '</strong>
                        <br />';
}
if ($data['payer_id'] && $data['sys_type_person_id'] == 1) {
    echo 'Facturar a: <strong>' . $data['payer_name'] . '</strong>
                        <br />Psaporte/NIE: <strong>' . $data['inn'] . '</strong>
                        <br />';
}
echo '                        <br />Cliente: <strong>' . $data['client_name'] . '</strong>
                        <br />Pasaporte/NIE: <strong>' . $data['document'] . '</strong></td>
                </tr>
            </tbody>
        </table>
        <hr />
        <table style="width: 100%;" class="main-info">
            <tbody>
                <tr>
                    <td style="width: 50%; vertical-align: top;padding-left:16px;">Instrucciones
                        <br /><strong>Forma de pago: Transferencia Bancaria</strong>
                        <br /><strong>Cuenta para hacer el ingreso (Santander)</strong></td>
                    <td style="width: 50%; vertical-align: top;">
                        <br /><strong>IBAN: ES05 0049 0771 1921 1079 3909</strong>
                        <br /><strong>SWIFT: BSCHESMM</strong></td>
                </tr>
            </tbody>
        </table>
        <p>&nbsp;</p>
        <table style="width: 100%;" class="prices">
            <thead>
                <tr>
                    <th style="width: 65%;"><span>Descripción</span></th>
                    <th style="width: 5%; text-align: center;"><span>Ud.</span></th>
                    <th style="width: 12%; text-align: right;"><span>Precio Ud.</span></th>
                    <th style="width: 6%; text-align: center;"><span>Dto.</span></th>
                    <th style="width: 12%; text-align: right;"><span>Importe</span></th>
                </tr>
            </thead>
            <tbody>';
$dataSQL = $this->selectAll("select s.unit_price,
       s.quantity,
       cast(iif(s.sys_rate_type_id = 2, s.rate_discount, s.amount_discount) as int) amount_discount,
       iif(s.sys_rate_type_id = 2, '%', '&euro;') discount_symbol,
       s.amount_with_tax,
       s.comment,
       coalesce(get_price_templated_text(p.template_for_account, d.discipline, l.level_name, p.price_name), p.price_name) as price_name,
       lpad(extract(day from s.start_date), 2, '0') || '/' || lpad(extract(month from s.start_date), 2, '0') || '/' || lpad(extract(year from s.start_date), 4, '0') as start_date,
       lpad(extract(day from s.end_date), 2, '0') || '/' || lpad(extract(month from s.end_date), 2, '0') || '/' || lpad(extract(year from s.end_date), 4, '0') as end_date,
       p.sys_price_category_id
from services s
   left outer join disciplinies d on (d.discipline_id = s.discipline_id)
   left outer join levels l on (l.level_id = s.level_id)
   left outer join prices p on (p.price_id = s.price_id)
where s.account_id = :id      ", $params, $this->ddb);

if (isset($dataSQL['success'])) {
    $prices = $dataSQL['success'];
} else {
    throw new HttpException(500, $dataSQL['error']);
}
foreach ($prices as $price) {
    echo '<tr>
                    <td style="width: 65%;">' . $price['price_name'];
    if ($price['sys_price_category_id'] !== 3)
        echo '<br />' . $price['start_date'] . ' - ' . $price['end_date'];
    if ($price['comment'])
        echo '   <br />' . $price['comment'];

    $discount = $price['amount_discount'] != 0 ? $price['amount_discount'] . $price['discount_symbol'] : '';

    echo '</td>
                    <td style="width: 5%; text-align: center;">' . $price['quantity'] . '</td>
                    <td style="width: 12%; text-align: right;">' . number_format($price['unit_price'], 2, ',', '.') . '&euro;</td>
                    <td style="width: 6%; text-align: center;">' . $discount . '</td>
                    <td style="width: 12%; text-align: right;">' . number_format($price['amount_with_tax'], 2, ',', '.') . '&euro;</td>
                </tr>';
}

echo '  </tbody>
        </table>
        <table style="width: 100%;" class="total">
            <tbody>
                <tr>
                    <td style="width: 82%; text-align: right;">Subtotal</td>
                    <td style="width: 18%; text-align: right;"><strong>' . number_format($data['sum_account'] , 2, ',', '.'). '&euro;</strong></td>
                </tr>
                <tr>
                    <td style="width: 82%; text-align: right;">Impuesto de venta</td>
                    <td style="width: 18%;">&nbsp;</td>
                </tr>
                <tr>
                    <td style="width: 82%; text-align: right;">Env&iacute;o y administraci&oacute;n</td>
                    <td style="width: 18%;">&nbsp;</td>
                </tr>
                <tr>
                    <td style="width: 82%; text-align: right;"><strong>Total a pagar</strong></td>
                    <td style="width: 18%; text-align: right;"><strong>' . number_format($data['sum_account'], 2, ',', '.') . '&euro;</strong></td>
                </tr>
            </tbody>
        </table>
        <p style="text-align: right;">(El servicio prestado se encuentra exento de IVA en virtud del art.20 de la Ley 37/1992)</p>
        <p style="text-align: left;margin-top: 100px;font-size: 20px;" class="cyan">Gracias por confiar en nosotros</p>
    </main>
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

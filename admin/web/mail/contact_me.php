<?php
require_once __DIR__ . '/phpmailer/class.phpmailer.php';
require_once __DIR__ . '/recaptchalib.php';
// Check for empty fields
if(empty($_POST['name']) || empty($_POST['email']) || empty($_POST['message']) || !filter_var($_POST['email'],FILTER_VALIDATE_EMAIL)) {
	echo "No arguments Provided!";
	return false;
   }

//проверка капчи
$secret = "6LfXDrcUAAAAAFnDdB5iQntFJvPjrLZaKFWUT1qV";
$resp = null;
$error = null;
$reCaptcha = new ReCaptcha($secret);
// Was there a reCAPTCHA response?
if ($_POST["g-recaptcha-response"]) {
    $resp = $reCaptcha->verifyResponse($_SERVER["REMOTE_ADDR"], $_POST["g-recaptcha-response"]);
}

if($resp != null && $resp->success) {

} else {
    echo "Ошибка reCAPTCHA";
    return false;
}

$name = strip_tags(htmlspecialchars($_POST['name']));
$email_address = strip_tags(htmlspecialchars($_POST['email']));
$message = strip_tags(htmlspecialchars($_POST['message']));
	
// Create the email and send the message
/*$to = 'pr@medexpo.pro'; // Add your email address inbetween the '' replacing yourname@yourdomain.com - This is where the form will send a message to.
$email_subject = "Website Contact Form:  $name";
$email_body = "Вы получили сообщение с сайта medexpo.\n\n"."Детали сообшения:\n\nName: $name\n\nEmail: $email_address\n\nPhone: $phone\n\nMessage:\n$message";

$EOL = "\r\n"; // ограничитель строк, некоторые почтовые сервера требуют \n - подобрать опытным путём
$boundary     = "--".md5(uniqid(time()));  // любая строка, которой не будет ниже в потоке данных.  
$headers    = "MIME-Version: 1.0;$EOL";   
$headers   .= "Content-Type: multipart/mixed; boundary=\"$boundary\"$EOL";  
$headers   .= "From: no-replay@medexpo.pro"; 
	
$multipart  = "--$boundary$EOL";   
$multipart .= "Content-Type: text/html; charset=utf-8$EOL";   
$multipart .= "Content-Transfer-Encoding: base64$EOL";   
$multipart .= $EOL; // раздел между заголовками и телом html-части 
$multipart .= chunk_split(base64_encode($email_body));   
$multipart .= "$EOL--$boundary--$EOL";   
	
if (!mail($to,$email_subject,$multipart,$headers))
	return false;			
else
	return true;*/

$mailer = new PHPMailer();

$mailer->From = ($email_address) ? $email_address : '';
$mailer->FromName = $name;
$mailer->CharSet = 'utf-8';
$mailer->AddAddress('info@mylseducation');
$mailer->Subject = 'Сообщение с сайта MYLS.education';
$mailer->IsHTML(true);
$mailer->Body = "Имя: <strong>".$name."</strong><br />E-mail: <strong>".$email_address."</strong><br /><br />Сообщение: <br />".$message;
$mailer->Send();
?>

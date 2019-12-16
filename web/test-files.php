<?php
if (  ! $_FILES  )
{
    echo '
		  <h2>Форма для загрузки файлов</h2>
		  <form action="" method="post" enctype="multipart/form-data">
		  <input type="file" name="filename"><br>
		  <input type="submit" value="Загрузить"><br>
		  </form>
	';
}
else
{
	move_uploaded_file($_FILES["filename"]["tmp_name"],__DIR__  .  DIRECTORY_SEPARATOR  .  $_FILES["filename"]["name"]);
}
?>
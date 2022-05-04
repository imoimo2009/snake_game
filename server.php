<?php

define("SAVE_FILE","./hiscore.txt");

if(isset($_POST["save_hiscore"])) {
    $hiscore = $_POST["save_hiscore"];
    file_put_contents(SAVE_FILE,$hiscore);
    echo "OK";
}elseif(isset($_GET["load_hiscore"])) {
    if(file_exists(SAVE_FILE)){
        $hiscore = file_get_contents(SAVE_FILE);
        echo $hiscore;
    }else{
        echo "NG";
    }
}else{
    var_dump($_POST);
}
?>

<?php

define("SAVE_FILE","./hiscore.txt");
define("ACCESS_LOG","./access.log");

$result = "NG";

if(isset($_POST["save_hiscore"])) {
    $score = $_POST["save_hiscore"];
    $hiscore = file_get_contents(SAVE_FILE);
    if($score > $hiscore){
        if(file_put_contents(SAVE_FILE,$score,LOCK_EX)){
            $result = "OK";
        }
    }
}elseif(isset($_GET["load_hiscore"])) {
    
    if(file_exists(SAVE_FILE)){
        $hiscore = file_get_contents(SAVE_FILE);
        $result = $hiscore;
    }
}
echo $result;
?>

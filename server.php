<?php

define("SAVE_FILE","./hiscore.txt");
define("ACCESS_LOG","./access.log");

$result = "NG";

WriteAccessLog("GameStart");
if(isset($_POST["save_hiscore"])) {
    $score = $_POST["save_hiscore"];
    $hiscore = file_get_contents(SAVE_FILE);
    if($score > $hiscore){
        if(file_put_contents(SAVE_FILE,$score,LOCK_EX)){
            $result = "OK";
            WriteAccessLog("DataSaved");
        }
    }else{
        WriteAccessLog("AlreadyUpdated");
    }
}elseif(isset($_GET["load_hiscore"])) {
    if(file_exists(SAVE_FILE)){
        $hiscore = file_get_contents(SAVE_FILE);
        $result = $hiscore;
        WriteAccessLog("DataLoaded");
    }
}
echo $result;

function WriteAccessLog($str){
    $time = date("Y/m/d H:i"); //アクセス時刻
    $ip = getenv("REMOTE_ADDR"); //IPアドレス
    $host = getenv("REMOTE_HOST"); //ホスト名
    $referer = getenv("HTTP_REFERER"); //リファラ
    if($referer == "") {
      $referer = "referer is nothing.";
    }
    $log = $time .",". $ip . ",". $host. ",". $referer. ",". $str;
    $fp = fopen(ACCESS_LOG, "a");
    fputs($fp, $log."\n");
    fclose($fp);
}
?>

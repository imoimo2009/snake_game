// 定数定義

const DEBUG_MODE        = false

// キャンバスオブジェクトとコンテキストを取得し保持
const Cv = document.getElementById('canvas');
const Tx = Cv.getContext('2d');

const CHAR_SIZE	        = 16;
const GAMEAREA_TOP		= CHAR_SIZE;
const GAMEAREA_WIDTH	= Cv.clientWidth;
const GAMEAREA_HEIGHT	= (Cv.clientHeight - CHAR_SIZE);
const FIELD_WIDTH		= (GAMEAREA_WIDTH / CHAR_SIZE);
const FIELD_HEIGHT		= (GAMEAREA_HEIGHT / CHAR_SIZE);
const FIELD_ARRAY		= (FIELD_WIDTH * FIELD_HEIGHT);

const SNAKE_LENGTH		= 5;
const SNAKE_SPEED		= 2;
const FOOD_START		= 255;
const FOOD_APPEND		= 30;

const TITLE_STR			= "- SNAKE GAME -";
const START_STR			= "<< MOVE KEY TO START! >>";
const RESTART_STR		= "<< PUSH SPACE TO RESTART! >>";
const GOVER_STR			= "< GAME OVER >";
const HISCORE_STR       = "<< YOU GOT A HISCORE !! >>"

const HELP_UP_STR       = "[W][↑]"
const HELP_LEFT_STR     = "[A][←]"
const HELP_DOWN_STR     = "[S][↓]"
const HELP_RIGHT_STR    = "[D][→]"

const HELP_MYCHR_STR    = "MYCHAR"
const HELP_FOOD_STR     = "FOOD"

const eCharCode = {
    CHR_BLANK       : {color : "#000000"},
    CHR_FOOD        : {color : "#00FFFF"},
    CHR_BODY        : {color : "#000000"},
    CHR_WALL        : {color : "#00FF00"}
};

const eVectorCode = {
    VECTOR_FREE     : {id : 0,x :  0,y :  0,rev : 0},
    VECTOR_UP       : {id : 1,x :  0,y : -1,rev : 2},
    VECTOR_DOWN     : {id : 2,x :  0,y :  1,rev : 1},
    VECTOR_RIGHT    : {id : 3,x :  1,y :  0,rev : 4},
    VECTOR_LEFT     : {id : 4,x : -1,y :  0,rev : 3}
};

const eGameMode = { 
    MODE_GAME       : 0,
    MODE_GOVER      : 1
};

// クラス定義

class SnakeBody{
    constructor(){
        this.x = Math.trunc(FIELD_WIDTH / 2) * CHAR_SIZE;
        this.y = Math.trunc(FIELD_HEIGHT / 2) * CHAR_SIZE;
        this.v = eVectorCode.VECTOR_FREE;
    }
}

class GlovalVars{
    constructor(){
        this.counter = 0
        this.vector = eVectorCode.VECTOR_FREE;
        this.key = "";
        this.stage = [];
        this.snake = [];
        this.score = 0;
        this.hiscore = 0;
        this.mode = eGameMode.MODE_GAME;
        this.food = FOOD_START;
        this.started = false;
        this.debug = DEBUG_MODE;
    }
}

// グローバル変数定義
var Gv = new GlovalVars();

// デバッグ関連 #####################################################################

// デバッグウィンドウの表示切替
function Switch_DebugMode(){
    if(Gv.debug){
        disp = "inline-block";
    }else{
        disp = "none";
    }
    document.getElementById("div_debug_outer").style.display = disp;
}

// デバッグウィンドウに文字列を表示する
function Debug_Println(str){
    if(Gv.debug){
        const d = document.getElementById("div_debug");
        d.innerHTML += str + "<br>" + ">";
    }
}

// デバッグウィンドウを消去する
function Debug_Cls(){
    if(Gv.debug){
        document.getElementById("div_debug").innerHTML = ">";
    }
}

// WebAPI関連 ####################################################################

// サーバにハイスコアを送信する
function SaveHiscore(){
    if(Gv.score < Gv.hiscore) return;
    var xhr = new XMLHttpRequest();
    xhr.open("POST","./server.php");
    xhr.setRequestHeader('content-type', 'application/x-www-form-urlencoded;charset=UTF-8');
    request = "save_hiscore=" + Gv.hiscore.toString();
    xhr.send(request);
    if(Gv.debug){
        xhr.onreadystatechange = function(){
            if ((xhr.readyState == 4) && (xhr.status == 200)) {
                alert(xhr.responseText);
            }
        };
    }
}

// サーバからハイスコアを受信する
function LoadHiscore(){
    var xhr = new XMLHttpRequest();
	xhr.open("GET","./server.php?load_hiscore",true); 
	xhr.responseType = "text";
    xhr.onreadystatechange = function(){
        if ((xhr.readyState == 4) && (xhr.status == 200)) {
            if(isFinite(xhr.responseText)){
                Gv.hiscore = Number(xhr.responseText);
            }
            if(Gv.debug){
                alert(xhr.responseText);
            }
        }
    };
    xhr.send(null);
}

// 描画API関連 ####################################################################

// 塗りつぶした矩形を描画する
function FillRect(x,y,w,h,c){
    Tx.fillStyle = c;
    Tx.fillRect(x,y,w,h);
}

// 半透明色で塗りつぶした矩形を描画する
function FillRectAlpha(x,y,w,h,c,p){
    Tx.globalAlpha = p;
    Tx.fillStyle = c;
    Tx.fillRect(x,y,w,h);
    Tx.globalAlpha = 1;
}

// 描画領域全体を塗りつぶす
function FillScreen(c){
    FillRect(0,0,Cv.clientWidth,Cv.clientHeight,c)
}

// 角度をラジアンに変換する
function Deg2Rad(d){
    return (d * (Math.PI / 180))
}

// 塗りつぶした円弧を描画する
function FillArc(x,y,d,r1,r2,c){
    Tx.beginPath()
    Tx.arc(x,y,d,Deg2Rad(r1),Deg2Rad(r2),false);
    Tx.fillStyle = c;
    Tx.fill();
    Tx.closePath()
}

// 文字列を描画する
function DrawString(str,x,y,s,c){
    Tx.fillStyle = c;
    Tx.font = s + "px monospace";
    Tx.textAlign = "left"
    Tx.fillText(str,x,y);
}

// センタリングされた文字列を描画する
function DrawStringCenter(str,x,y,s,c,w){
    Tx.fillStyle = c;
    Tx.font = s + "px monospace";
    Tx.textAlign = "center"
    Tx.fillText(str,x,y,w);
}

// 各種関数定義 #####################################################################

// 指定範囲のランダム値を取得する
function Get_Random(min,max){
    return Math.trunc(Math.random() * (max - min) + min); 
}

// X座標、Y座標からステージ配列のインデックス値を返す
function Get_Index(x,y){
    return (y * FIELD_WIDTH + x);
}

// ステージ配列のインデックス値からX座標を返す
function Get_X(a){
    return (a % FIELD_WIDTH);
}

// ステージ配列のインデックス値からY座標を返す
function Get_Y(a){
    return Math.trunc(a / FIELD_WIDTH);
}

// グラフィック座標からステージの座標を取得する
function Get_Coord(a){
    return Math.trunc(a / CHAR_SIZE);
}

// 指定グラフィック座標のステージ配列値を取得する
function Get_StageVars(x,y){
    return Gv.stage[Get_Index(Get_Coord(x),Get_Coord(y))];
}

// 指定グラフィック座標のステージ配列値を設定する
function Set_StageVars(x,y,v){
    Gv.stage[Get_Index(Get_Coord(x),Get_Coord(y))] = v;
}

// 各種初期化処理 ####################################################################

// ヘビ配列の初期化
function Init_Snake(){
    Gv.snake = new Array(SNAKE_LENGTH);
    for(i = 0 ; i < Gv.snake.length ; i++){
        Gv.snake[i] = new SnakeBody;
    }
}

// ゲームオーバー処理開始
function Init_GameOver(){
    Debug_Println(GOVER_STR);
    Gv.mode = eGameMode.MODE_GOVER;
}

// ステージ配列を初期化
function Init_Stage(level){
    Gv.stage = new Array(FIELD_ARRAY);
    for(i = 0;i < Gv.stage.length;i++){
        s = Gv.stage
        const x = Get_X(i);
        const y = Get_Y(i);
        if(x == 0 || y == 0 || x == FIELD_WIDTH - 1 || y == FIELD_HEIGHT - 1){
            s[i] = eCharCode.CHR_WALL;
        }else{
            s[i] = eCharCode.CHR_BLANK;
        }
    }
    Put_Food();
}

// ゲーム更新処理 ####################################################################

// エサを置く
function Put_Food(){
    stg = [];
    Gv.stage.forEach((v,i) => {
        if(v == eCharCode.CHR_BLANK){
            stg.push(i);
        }
    });
    Gv.stage[stg[Get_Random(0,stg.length)]] = eCharCode.CHR_FOOD;
}

// エサを食べる
function Get_Food(){
    l = Gv.snake.length;
    Gv.snake.push(new SnakeBody);
    Gv.snake[l].x = Gv.snake[l - 1].x;
    Gv.snake[l].y = Gv.snake[l - 1].y;
    Put_Food();
    Gv.food += FOOD_APPEND;
    Gv.score += Math.trunc(Gv.food /10);
    if(Gv.score > Gv.hiscore){
        Gv.hiscore = Gv.score;
    }
}

// 当たり判定処理
function Check_Collision(x,y){
    const v = Get_StageVars(x,y);
    if(Gv.started){
        if(v == eCharCode.CHR_BODY || v == eCharCode.CHR_WALL){
            Init_GameOver();
        }else if(v == eCharCode.CHR_FOOD){
            Get_Food();
        }
    }
}

// ヘビ移動
function Move_Snake(){
    Debug_Cls();
    Debug_Println("x=" + Gv.snake[0].x);
    Debug_Println("y=" + Gv.snake[0].y);
    const l = Gv.snake.length - 1
    for(i = l;i >= 0;i--){
        const x = Gv.snake[i].x
        const y = Gv.snake[i].y
        if(x % CHAR_SIZE == 0 && y % CHAR_SIZE == 0){
            if(i < l){
                Gv.snake[i + 1].v = Gv.snake[i].v;
                if(i == 0){
                    if(Gv.snake[i].v != eVectorCode.VECTOR_FREE){
                        Gv.started = true;
                        Gv.food--;
                        if(Gv.food <= 0){
                            Init_GameOver();
                        }
                    }
                    if(Gv.vector.id != Gv.snake[i].v.rev){
                        Gv.snake[i].v = Gv.vector;
                    }
                    const vx = Gv.snake[i].v.x * CHAR_SIZE;
                    const vy = Gv.snake[i].v.y * CHAR_SIZE;
                    Check_Collision(x + vx,y + vy);
                }else{
                    Set_StageVars(x,y,eCharCode.CHR_BODY);
                }
            }else{
                Set_StageVars(x,y,eCharCode.CHR_BLANK);
            }
        }
    }
    for(s of Gv.snake){
        s.x += s.v.x * SNAKE_SPEED;
        s.y += s.v.y * SNAKE_SPEED;
    }
}

// 描画処理 #######################################################################

// ステージ描画
function Draw_Stage(){
    Gv.stage.forEach(function(v,i){
        const x = Get_X(i) * CHAR_SIZE;
        const y = Get_Y(i) * CHAR_SIZE;
        FillRect(x,y,CHAR_SIZE,CHAR_SIZE,v.color);
    });
}

// ヘビ描画
function Draw_Snake(){
    for(i = Gv.snake.length - 1;i >= 0;i--){
        const x = Gv.snake[i].x + CHAR_SIZE / 2;
        const y = Gv.snake[i].y + CHAR_SIZE / 2;
        var c = "#FFFFFF";
        if(i > 0){
            c = "#FFFF00";
        }
        if(Gv.food < FOOD_APPEND){
            if(Gv.counter % 4 == 0){
                c = "#FF0000";
            }
        }
        FillArc(x,y,CHAR_SIZE / 2,0,360,c);
    }
}

// タイトル画面描画
function Draw_Title(){
    var idx;
    for(i = 0;i < Gv.stage.length ; i++){
        if(Gv.stage[i] == eCharCode.CHR_FOOD){
            idx = i;
            break;
        }
    }
    var fx = Get_X(idx) * CHAR_SIZE + 8;
    var fy = Get_Y(idx) * CHAR_SIZE - 10;
    if(fx < 40)fx = 40;
    if(fx > GAMEAREA_WIDTH - 40)fx = GAMEAREA_WIDTH - 40;
    if(fy < 32)fy += 40;
    DrawStringCenter(HELP_FOOD_STR,fx,fy,12,"#0FF",50);
    const x = GAMEAREA_WIDTH / 2 + 10
    const y = GAMEAREA_HEIGHT / 2 + 6
    DrawStringCenter(HELP_MYCHR_STR,x     ,y - 50,16,"#FF0",50);
    DrawStringCenter(HELP_UP_STR   ,x     ,y - 30,12,"#DDD",50);
    DrawStringCenter(HELP_LEFT_STR ,x - 50,y    ,12,"#DDD",50);
    DrawStringCenter(HELP_DOWN_STR ,x     ,y + 30,12,"#DDD",50);
    DrawStringCenter(HELP_RIGHT_STR,x + 50,y    ,12,"#DDD",50);
    DrawStringCenter(TITLE_STR,322,102,32,"#888",640);
    DrawStringCenter(TITLE_STR,320,100,32,"#FFF",640);
    DrawStringCenter(START_STR,320,400,16,"#FFF",640);
}

// ゲームオーバー画面描画
function Draw_GameOver(){
    FillRectAlpha(0,0,640,480,"#000",0.5);
    DrawStringCenter(GOVER_STR,320,240,16,"#FFF",640);
    DrawStringCenter(RESTART_STR,320,300,16,"#FFF",640);
    if(Gv.score > 0 && Gv.score == Gv.hiscore){
        DrawStringCenter(HISCORE_STR,320,400,16,"#FF0",640);
    }
}

// ユーザーインターフェース描画
function Draw_UI(){
    DrawString("LENGTH: " + Gv.snake.length,2,477,14,"#FFFFFF");
    DrawString("FOOD: " + Gv.food,100,477,14,"#00FFFF");
    DrawString("SCORE: " + Gv.score,300,477,14,"#FFFF88");
    DrawString("HISCORE: " + Gv.hiscore,500,477,14,"#FF88FF");
    switch(Gv.mode){
        case eGameMode.MODE_GAME:
            if(Gv.started == false){
                Draw_Title();
            }
            break;
        case eGameMode.MODE_GOVER:
            Draw_GameOver();
            break;
    }
}

// ゲームフレームワーク #################################################################

// イベントリスナ登録
document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);
document.getElementById("btn_up").onclick = btnUpClickHandler;
document.getElementById("btn_left").onclick =  btnLeftClickHandler;
document.getElementById("btn_down").onclick =  btnDownClickHandler;
document.getElementById("btn_right").onclick =  btnRightClickHandler;
document.getElementById("btn_space").onclick =  btnSpaceClickHandler;

// イベント処理

// キーが押されたとき
function keyDownHandler(e) {
    Gv.key = e.key
    switch(e.key){
        case "d":
        case "Right":
        case "ArrowRight":
            Gv.vector = eVectorCode.VECTOR_RIGHT;
            break;
        case "a":
        case "Left":
        case "ArrowLeft":
            Gv.vector = eVectorCode.VECTOR_LEFT;
            break;
        case "w":
        case "Up":
        case "ArrowUp":
            Gv.vector = eVectorCode.VECTOR_UP;
            break;
        case "s":
        case "Down":
        case "ArrowDown":
            Gv.vector = eVectorCode.VECTOR_DOWN;
            break;
    }
}

// キーが離されたとき
function keyUpHandler(e) {

}

// 上ボタンが押されたとき
function btnUpClickHandler(e) {
    Gv.vector = eVectorCode.VECTOR_UP;
}

// 左ボタンが押されたとき
function btnLeftClickHandler(e) {
    Gv.vector = eVectorCode.VECTOR_LEFT;
}

// 下ボタンが押されたとき
function btnDownClickHandler(e) {
    Gv.vector = eVectorCode.VECTOR_DOWN;
}

// 右ボタンが押されたとき
function btnRightClickHandler(e) {
    Gv.vector = eVectorCode.VECTOR_RIGHT;
}

// スペースボタンが押されたとき
function btnSpaceClickHandler(e) {
    Gv.key = " ";
}

// 初期化処理
function InitGame(){
    document.activeElement.blur();
    Gv.mode = eGameMode.MODE_GAME;
    Gv.vector = eVectorCode.VECTOR_FREE;
    Gv.started = false;
    Gv.food = FOOD_START;
    Gv.score = 0;
    Init_Stage();
    Init_Snake();
}

// 初期描画処理
function InitDraw(){
    FillScreen("#000000")
    Draw_Stage();
}

// 更新処理
function UpdateGame(){
    switch(Gv.mode){
        case eGameMode.MODE_GAME:
            Move_Snake();
            break;
        case eGameMode.MODE_GOVER:
            if(Gv.key == " "){
                Gv.key = "";
                SaveHiscore();
                InitGame();
            }
            break;
    }
}

// 描画処理
function DrawGame(){
    FillScreen("#000000")
    Draw_Stage();
    Draw_Snake();
    Draw_UI();
}

// 終了処理
function QuitGame(){
}

// メインループ
function main(){
    Gv.counter++;
    UpdateGame();
    DrawGame();
}

// エントリポイント ###################################################################

// 初期化処理
Switch_DebugMode();
LoadHiscore();
InitGame();
InitDraw();
// メインループ(10ミリ秒ごとに呼び出す)
setInterval(main,10);
// 終了処理
QuitGame();


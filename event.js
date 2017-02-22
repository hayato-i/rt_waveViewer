// Global Panner Nodeパラメータ
var sPosX = 0;
var sPosY = 0;
var sPosZ = -10;
var INNER_ANGLE = 120;
var OUTER_ANGLE = 120;
var OUTER_GAIN = 0;
var DIRECTION;


// AudioContext-------------------------------------------------------------------------------
var context = new AudioContext();
var destination = context.destination;

// 音源位置（同心円状の角度）
var SRC_POSITION = 270;

// Global Visual パラメータ
var SOURCE_RARIDUS = (0.0, 0.0, -1.0);

// canvas とクォータニオンをグローバルに扱う
var mainc;
var q = new qtnIV();
var qt = q.identity(q.create());
var MOUSE_DOWN = false;


// マウスムーブイベントに登録する処理
function mouseMove(e){
    if(MOUSE_DOWN){
        var cw = mainc.width;
        var ch = mainc.height;
        var wh = 1 / Math.sqrt(cw * cw + ch * ch);
        var x = e.clientX - mainc.offsetLeft - cw * 0.5;
        var y = e.clientY - mainc.offsetTop - ch * 0.5;
        var sq = Math.sqrt(x * x + y * y);
        var r = sq * 2.0 * Math.PI * wh;
        if(sq != 1){
            sq = 1 / sq;
            x *= sq;
            y *= sq;
        }
        q.rotate(r, [y, x, 0.0], qt);
    }
}
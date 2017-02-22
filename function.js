

// AudioContext-------------------------------------------------------------------------------
var context = new AudioContext();
var destination = context.destination;
var analyser = context.createAnalyser();

// 音源位置（同心円状の角度）
var SRC_POSITION = 90;
var SOURCE_RARIDUS = (0.0, 0.0, -1.0);

// Global Panner Nodeパラメータ
var sPosX = 0;
var sPosY = 0;
var sPosZ = -10;
var INNER_ANGLE = 0;
var OUTER_ANGLE = 120;
var OUTER_GAIN = 0;
var DIRECTION;


// canvas とクォータニオンをグローバルに扱う
var mainc;
var q = new qtnIV();
var qt = q.identity(q.create());
var MOUSE_DOWN = true;


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



/*---------------------------------------------------------  
	Circle関数
	num:分割数
	r:半径
---------------------------------------------------------*/
function circle(num, r){
    var pos = new Array();
    var id = new Array();
    var col = new Array();
    var x, y, z;
    var t = 360 / num;
    var rad = t * Math.PI / 180;
    for(var i = 0; i < num; i++){
        var j = rad * i;
        x = r*Math.cos(j);
        y = r*Math.sin(j);
        z = 0.0;
        pos.push(x, y, z);
		col.push(1.0, 1.0, 1.0, 1.0);
    }
    pos.push(0.0, 0.0, 0.0);
	col.push(1.0, 1.0, 1.0, 1.0);

    for(i=0; i<num; i++){
        id.push(i);
    }
	id.push(0);

    return {p:pos, idx:id, c:col};
}

function sphere(num, col, row, r){
	var pos = new Array();
    var id = new Array();
    var col = new Array();
    var x, y, z;
    var t = 360 / num;
    var rad = t * Math.PI / 180;
    for(var i = 0; i < num; i++){
        var k = rad * i;
        x = Math.cos(k);
        y = Math.sin(k);
        z = 0.0;
        pos.push(x, y, z);
    }
    pos.push(0.0, 0.0, 0.0);

    for(i=0; i<num-1; i++){
        id.push(num, i, i+1);
    }
    id.push(num, num-1, 0);

    return {p:pos, idx:id, c:col};
}

/*---------------------------------------------------------  
	Cone関数
	degree:innerAngle
	r:距離
---------------------------------------------------------*/
function soundCone(degree, r){
	var pos = new Array();
    var id = new Array();
    var col = new Array();
    var x, y, z;
    var rad = degree/2 * Math.PI / 180;

	// 単位円における(0.0, 1.0, 0.0)を基本位置とする
	// 発音点
	pos.push(0.0, r, 0.0);
	// 開きのx
	var t = Math.tan(rad);
    // X+
	pos.push(t, 0.0, 0.0);
    // X-
	pos.push(-t, 0.0, 0.0);
	// color
	col.push(1.0, 1.0, 1.0, 1.0);
	col.push(1.0, 1.0, 1.0, 1.0);
	col.push(1.0, 1.0, 1.0, 1.0);
    id.push(1, 0, 2);
    
    return {p:pos, idx:id, c:col};
}

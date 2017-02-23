
// AudioContext-------------------------------------------------------------------------------
var context = new AudioContext();
var destination = context.destination;
var analyser = context.createAnalyser();
// globalアクセスのため
var panner = context.createPanner();

// 音源位置（同心円状の角度）default 90(=C)
var SRC_POSITION = 90;

// Global Panner Nodeパラメータ
var sPosX = 0;
var sPosY = 0;
var sPosZ = -1;
var INNER_ANGLE = 0;
var OUTER_ANGLE = 45;
var OUTER_GAIN = 0;
var DISTANCE = 1;
var REF_DISTANCE = 1;
var MAX_DISTANCE = 10;
var ROLL_OFF_FACTOR = 1;

// canvas とクォータニオンをグローバルに扱う
var mainc;
var q = new qtnIV();
var qt = q.identity(q.create());
var MOUSE_DOWN = true;

function forceDirection(pan){
    // 現在のviewerで示している座標系はxyだが、これはxz
    var rad = SRC_POSITION * Math.PI / 180;
    var x = Math.cos(rad) * DISTANCE;
    var y = 0.0;
    var z = (-1) * Math.sin(rad) * DISTANCE;
    var dx = -1 * x;
    var dy = 0.0;
    var dz = -1 * z;
    pan.setPosition(x, y, z);
    pan.setOrientation(dx, dy, dz);
    console.log(x,y,z,dx,dy,dz);
}

// マウスムーブイベントに登録する処理
function mouseMove(e){
    if(MOUSE_DOWN){
        var cw = mainc.width;
        var ch = mainc.height;
        var wh = 1 / Math.sqrt(cw * cw + ch * ch);
        // 原点中央
        var x = e.clientX - mainc.offsetLeft - cw * 0.5;
        var y = 0;//e.clientY - mainc.offsetTop - ch * 0.5;
        var sq = Math.sqrt(x * x + y * y);
        var r = sq * 2.0 * Math.PI * wh;
        if(sq != 1){
            sq = 1 / sq;
            x *= sq;
            y *= sq;
        }
        q.rotate(r, [0.0, 0.0, 1.0], qt);
    }
}


function xAxis(){
    var pos = new Array();
    var id = new Array();
    var col = new Array();
    pos = [
        2.0, 0.0, 0.0,
        -2.0, 0.0, 0.0 
    ];
    id = [
        0,1
    ];
    col = [
        1.0, 0.0, 0.0, 1.0,
        1.0, 0.0, 0.0, 1.0
    ];

    return {p:pos, idx:id, c:col};
}

function yAxis(){
    var pos = new Array();
    var id = new Array();
    var col = new Array();
    pos = [
        0.0, 2.0, 0.0,
        0.0, -2.0, 0.0 
    ];
    id = [
        0,1
    ];
    col = [
        0.0, 1.0, 0.0, 1.0,
        0.0, 1.0, 0.0, 1.0
    ];

    return {p:pos, idx:id, c:col};
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
        console.log("x: ",x,"y: ",y);
        z = 0.0;
        pos.push(x, y, z);
		col.push(0.0, 0.7, 1.0, 1.0);
    }
    pos.push(0.0, 0.0, 0.0);
	col.push(0.0, 0.7, 1.0, 1.0);

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

// Globalアクセス
// AudioContext-------------------------------------------------------------------------------
var audioCont = new AudioContext();
var destination = audioCont.destination;
var analyser = audioCont.createAnalyser();
var panner = audioCont.createPanner();
var listener = audioCont.listener;

// カメラ位置
var camPos = [0.0, 0.0, 3.0];

// 音源位置（同心円状の角度）default 90(=C)
var SRC_POSITION = 90;
// Panner Nodeパラメータ
var sPosX = 0;
var sPosY = 0;
var sPosZ = -1; 

// OUTER_ANGLE>INNER_ANGLE
var INNER_ANGLE = 0;
var OUTER_ANGLE = 45;
var OUTER_GAIN = 0;
var DISTANCE = 1;
var REF_DISTANCE = 1;
var MAX_DISTANCE = 30;
var ROLL_OFF_FACTOR = 1;
var PANNING_MODEL = 'HRTF';
var DISTANCE_MODEL = 'linear';

// Listner position
var LX = 0.0;
var LY = 0.0;
var LZ = 0.0;

// main canvas 
var gl, vs, fs;
var mainc, hidc;
var hidContext;
//var ext = gl.getExtension('OES_element_index_uint');

// hidden canvas
const FFTSIZE = 32;
const SMOOTHING = 0.9;

// analyser 設定
analyser.smoothingTimeConstant = SMOOTHING;
analyser.fftSize = FFTSIZE;
analyser.minDecibels = -140;
analyser.maxDecibels = -10;
var afbc = analyser.frequencyBinCount;
var freqs = new Uint8Array(afbc);
var flags = false;

function updatePanner(pan){
    // 現在のviewerで示している座標系はxyだが、これはxz
    var rad = SRC_POSITION * Math.PI / 180;
    pan.coneInnerAngle = INNER_ANGLE;
    pan.coneOuterAngle = OUTER_ANGLE;
    panner.panningModel = PANNING_MODEL;
    panner.distanceModel = DISTANCE_MODEL;
    var x = Math.cos(rad) * DISTANCE;
    var y = 0.0;
    var z = (-1) * Math.sin(rad) * DISTANCE;
    var dx = -1 * x / DISTANCE;
    var dy = 0.0;
    var dz = -1 * z / DISTANCE;
    pan.setPosition(x, y, z);
    pan.setOrientation(dx, dy, dz);
    //console.log(x,y,z,dx,dy,dz);
}


// X軸線
function xAxis(dist){
    var pos = new Array();
    var id = new Array();
    var col = new Array();
    pos = [
        dist, 0.0, 0.0,
        -dist, 0.0, 0.0 
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


// Y軸線
function yAxis(dist){
    var pos = new Array();
    var id = new Array();
    var col = new Array();
    pos = [
        0.0, dist, 0.0,
        0.0, -dist, 0.0 
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

// Z軸線
function zAxis(dist){
    var pos = new Array();
    var id = new Array();
    var col = new Array();
    pos = [
        0.0, 0.0, dist,
        0.0, 0.0, -dist 
    ];
    id = [
        0,1
    ];
    col = [
        0.0, 0.0, 1.0, 1.0,
        0.0, 0.0, 1.0, 1.0
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
	col.push(0.0, 0.7, 1.0, 0.7);

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
	degree:coneOuterAngle
	r:距離
---------------------------------------------------------*/
function soundCone(degree, r){
	var pos = new Array();
    var id = new Array();
    var col = new Array();
    var x, y, z;
	// 扇の開き
    var rad = degree * Math.PI / 180;
    // SRC_POSITIONの初期値は90度
    var posRad = SRC_POSITION % 360 * Math.PI / 180;
    x = Math.cos(posRad); // ≒ 0
    y = Math.sin(posRad); // ≒ 1
	
    // 単位円における(0.0, 1.0, 0.0)を基本位置とする
	// 発音点(距離倍)
	pos.push(x*r, y*r, 0.0);

    // 発音点からみた単位円上のX+
    // (0.0, 1.0, 0.0)からみて-y方向にdegree分開く
    // = +xから-degree方向
    var posRad2 = rad/2;
    var t1x = (x - Math.cos(posRad + posRad2))* r;
    var t1y = (y - Math.sin(posRad + posRad2))* r;
    pos.push(t1x, t1y, 0.0);
    console.log(t1x,t1y);
    
    // 発音点からみた単位円上のX-
    // (0.0, 1.0, 0.0)からみて-y方向にdegree分開く
    // = -xから+degree方向
    var posRad3 = -rad/2;
	var t2x = (x - Math.cos(posRad + posRad3))* r;
    var t2y = (y - Math.sin(posRad + posRad3))* r;
	pos.push(t2x, t2y, 0.0);
    console.log(t2x,t2y);

	// color
	col.push(1.0, 1.0, 1.0, 1.0);
	col.push(1.0, 1.0, 1.0, 1.0);
	col.push(1.0, 1.0, 1.0, 1.0);
    // 描画順
    id.push(1, 0, 2);
    
    return {p:pos, idx:id, c:col};
}

// 音源到達距離、分割数が必要
function freqToCircle(degree, r, num){
    // 周波数領域で色分けしたサークル上の図形を表示する
    // 音源位置が0Hz, 最高距離が2kHz(サンプリング周波数/2)とする 
    // smoothingによって見た目が変わりそうなのでそこを見つつ適宜
    // 位置:距離を周波数分割数で割る。
    // 　　 基本的な考え方は円柱を色で分けていた杉本さんのプログラムと同じはず
    // 色  :freqで表現している色をそのまま活用
    
    var pos = new Array();
    var id = new Array();
    var col = new Array();
    var hueFunc = new Array();
    var r,g,b,a;
    var rad = degree * Math.PI / 180;
    var jrad = 360/num;
    // SRC_POSITIONの初期値は90度
    var posRad = SRC_POSITION % 360 * Math.PI / 180;
    var x = Math.cos(posRad); // ≒ 0
    var y = Math.sin(posRad); // ≒ 1
    var z ;

    // 周波数:分割数
    var hz;
    var length;
    var height;
    // HSV
    var hue;
    var sat = 100/100;
    var val = 60/100;
    var i, j, jx, jz;

    // Length/i = 周波数対位置
    // 位置といろい情報
    for(i = 0; i < afbc; i++){
        // color
        hue = i/afbc * 360;
        
        // hzは距離の分割数に相当する。
        hz = y * r - (y * r / afbc * i);
        
        // 色変換
        hueFunc = hsva(hue, sat, val, freqs[i]/256);
        r = hueFunc[0];
        g = hueFunc[1];
        b = hueFunc[2];
        a = hueFunc[3];
            
        for(j = 0; j < num; j++){
            // 音源からの距離（原点から伸びていくイメージ）
            // 円を描くイメージではあるが、弧の伸び方は違う
            var jx =  Math.cos(Math.PI / 180 * jrad * j) * hz;
            var jz = -Math.sin(Math.PI / 180 * jrad * j) * hz;
            
            // x, z はその位置における開きの位置にある
            pos.push(jx, hz, jz);
            col.push(r, g, b, a);
        }
    }

    // index（筒描画のインデックスは一度やったはずだが？）
    for(i = 0; i < 4-1; i++){
        for(j = 0; j < num-1; j++){
            var k = i*num+j;
            id.push(k,k+1,k+num+1);
            id.push(k,k+num+1,k+num);
        }
        // if num = 4,j = 2
        var l = i+1;
        id.push(l*num-1, i*num, l*num);
        id.push(l*num-1, l*num, l*num+num-1);
    }

    return {p:pos, idx:id, c:col};
}

// - 各種ユーティリティ関数 ---------------------------------------------------
/**
 * シェーダを生成する関数
 * @param {string} source シェーダのソースとなるテキスト
 * @param {number} type シェーダのタイプを表す定数 gl.VERTEX_SHADER or gl.FRAGMENT_SHADER
 * @return {object} 生成に成功した場合はシェーダオブジェクト、失敗した場合は null
 */
function create_shader(source, type){
    // シェーダを格納する変数
    var shader;
    
    // シェーダの生成
    shader = gl.createShader(type);
    
    // 生成されたシェーダにソースを割り当てる
    gl.shaderSource(shader, source);
    
    // シェーダをコンパイルする
    gl.compileShader(shader);
    
    // シェーダが正しくコンパイルされたかチェック
    if(gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
        
        // 成功していたらシェーダを返して終了
        return shader;
    }else{
        
        // 失敗していたらエラーログをアラートする
        alert(gl.getShaderInfoLog(shader));
        
        // null を返して終了
        return null;
    }
}

/**
 * プログラムオブジェクトを生成しシェーダをリンクする関数
 * @param {object} vs 頂点シェーダとして生成したシェーダオブジェクト
 * @param {object} fs フラグメントシェーダとして生成したシェーダオブジェクト
 * @return {object} 生成に成功した場合はプログラムオブジェクト、失敗した場合は null
 */
function create_program(vs, fs){
	// プログラムオブジェクトの生成
	var program = gl.createProgram();
	
	// プログラムオブジェクトにシェーダを割り当てる
	gl.attachShader(program, vs);
	gl.attachShader(program, fs);
	
	// シェーダをリンク
	gl.linkProgram(program);
	
	// シェーダのリンクが正しく行なわれたかチェック
	if(gl.getProgramParameter(program, gl.LINK_STATUS)){
	
		// 成功していたらプログラムオブジェクトを有効にする
		gl.useProgram(program);
		
		// プログラムオブジェクトを返して終了
		return program;
	}else{
		
		// 失敗していたらエラーログをアラートする
		alert(gl.getProgramInfoLog(program));
		
		// null を返して終了
		return null;
	}
}

/**
 * VBOを生成する関数(STATIC_DRAW)
 * @param {Array.<number>} data 頂点属性を格納した一次元配列
 * @return {object} 頂点バッファオブジェクト
 */
function create_vbo(data){
	// バッファオブジェクトの生成
	var vbo = gl.createBuffer();
	
	// バッファをバインドする
	gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
	
	// バッファにデータをセット
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
	
	// バッファのバインドを無効化
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	
	// 生成した VBO を返して終了
	return vbo;
}

/**
 * VBOを生成する関数(DYNAMIC_DRAW)
 * @param {Array.<number>} data 頂点属性を格納した一次元配列
 * @return {object} 頂点バッファオブジェクト
 */
function create_Dvbo(data){
	// バッファオブジェクトの生成
	var vbo = gl.createBuffer();
	
	// バッファをバインドする
	gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
	
	// バッファにデータをセット
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.DYNAMIC_DRAW);
	
	// バッファのバインドを無効化
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	
	// 生成した VBO を返して終了
	return vbo;
}

/**
 * IBOを生成する関数
 * @param {Array.<number>} data 頂点インデックスを格納した一次元配列
 * @return {object} インデックスバッファオブジェクト
 */
function create_ibo(data){
	// バッファオブジェクトの生成
	var ibo = gl.createBuffer();
	
	// バッファをバインドする
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
	
	// バッファにデータをセット
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(data), gl.STATIC_DRAW);
	
	// バッファのバインドを無効化
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
	
	// 生成したIBOを返して終了
	return ibo;
}

/**
 * VBOをバインドし登録する関数
 * @param {object} vbo 頂点バッファオブジェクト
 * @param {Array.<number>} attribute location を格納した配列
 * @param {Array.<number>} アトリビュートのストライドを格納した配列
 */
function set_attribute(vbo, attL, attS){
	// 引数として受け取った配列を処理する
	for(var i in vbo){
		// バッファをバインドする
		gl.bindBuffer(gl.ARRAY_BUFFER, vbo[i]);
		
		// attributeLocationを有効にする
		gl.enableVertexAttribArray(attL[i]);
		
		// attributeLocationを通知し登録する
		gl.vertexAttribPointer(attL[i], attS[i], gl.FLOAT, false, 0, 0);
	}
}


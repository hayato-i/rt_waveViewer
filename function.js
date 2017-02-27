// Globalアクセス
// AudioContext-------------------------------------------------------------------------------
var audioCont = new AudioContext();
var destination = audioCont.destination;
var analyser = audioCont.createAnalyser();
var panner = audioCont.createPanner();

// カメラ位置
var camDistance = 3.0;
var camPos = [0.0, 0.0, camDistance];

// 音源位置（同心円状の角度）default 90(=C)
var SRC_POSITION = 90;
var SRC_VAR = 10;
// Panner Nodeパラメータ
var sPosX = 0;
var sPosY = 0;
var sPosZ = -1;
var INNER_ANGLE = 0;
var OUTER_ANGLE = 45;
var OUTER_GAIN = 0;
var DISTANCE = 1;
var REF_DISTANCE = 1;
var MAX_DISTANCE = 50;
var ROLL_OFF_FACTOR = 1;

// main canvas 
var gl, vs, fs;
var mainc, hidc;
var hidContext;

// hidden canvas
const FFTSIZE = 256;
const SMOOTHING = 0.9;

// analyser 設定
analyser.smoothingTimeConstant = SMOOTHING;
analyser.fftSize = FFTSIZE;
analyser.minDecibels = -140;
analyser.maxDecibels = -10;

// quatanion
var q = new qtnIV();
var qt = q.identity(q.create());
var MOUSE_DOWN = true;

function updatePanner(pan){
    // 現在のviewerで示している座標系はxyだが、これはxz
    var rad = SRC_POSITION * Math.PI / 180;
    pan.coneOuterAngle = OUTER_ANGLE;
    var x = Math.cos(rad) * DISTANCE;
    var y = 0.0;
    var z = (-1) * Math.sin(rad) * DISTANCE;
    var dx = -1 * x / DISTANCE;
    var dy = 0.0;
    var dz = -1 * z / DISTANCE;
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
	// 扇の開き
    var rad = degree/2 * Math.PI / 180;
	var t = Math.tan(rad);
    var posRad = SRC_POSITION * Math.PI / 180;
    x = Math.cos(posRad);
    y = Math.sin(posRad);

	// 単位円における(0.0, 1.0, 0.0)を基本位置とする
	// 発音点
	pos.push(x, y, 0.0);
    // X+
	pos.push(t*r, 0.0, 0.0);
    // X-
	pos.push(-t*r, 0.0, 0.0);
	// color
	col.push(1.0, 1.0, 1.0, 1.0);
	col.push(1.0, 1.0, 1.0, 1.0);
	col.push(1.0, 1.0, 1.0, 1.0);
    // 描画順
    id.push(1, 0, 2);
    
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


// Globalアクセス
// AudioContext-------------------------------------------------------------------------
var audioCont = new AudioContext();
var destination = audioCont.destination;
var analyser = audioCont.createAnalyser();
var panner = audioCont.createPanner();
var listener = audioCont.listener;
var url = "/wav/2mix.wav";

// カメラ位置
var camPosXY = [ 0.0, 0.0,  3.0];
var camPosXZ = [ 0.0, 3.0,  0.0];
var camPosYZ = [-3.0, 0.0,  0.0];
var camUpXY  = [ 0.0, 1.0,  0.0];
var camUpXZ  = [ 0.0, 0.0, -1.0];
var camUpYZ  = [ 0.0, 1.0,  0.0];

// 音源位置
var SRC_INIT_POSITION = [0, 0, -1];
var SRC_POSITION = [0, 0, -1];
// Listener情報
var camLisFr = [ 0.0, 0.0, -1.0];
var camLisUp = [ 0.0, 1.0, 0.0];

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
var MAX_DISTANCE = 3;
var ROLL_OFF_FACTOR = 1;
var PANNING_MODEL = 'HRTF';
var DISTANCE_MODEL = 'linear';

// Listner position
var LisPos = [0.0, 0.0, 0.0];

// main canvas 
var gl, vs, fs;
var mainc, hidc;
var mx=0, my=0;
var hidContext;
//var ext = gl.getExtension('OES_element_index_uint');

// analyser 設定
const FFTSIZE = 32;
const SMOOTHING = 0.8;
analyser.smoothingTimeConstant = SMOOTHING;
analyser.fftSize = FFTSIZE;
analyser.minDecibels = -120;
analyser.maxDecibels = -30;
var afbc = analyser.frequencyBinCount;
var freqs  = new Uint8Array(afbc);

// フラグ
var flags  = false;
var mflags = false;
var firstPerson = false;
var meshFlag = false;

// クォータニオン
var q = new qtnIV();
var qt = q.identity(q.create());

// マウスムーブイベント------------------------------------
function mouseMove(e){
    var cw = mainc.width;
    var ch = mainc.height;
    var wh = 1 / Math.sqrt(cw * cw + ch * ch);
    mx = e.clientX - mainc.offsetLeft - cw * 0.5;
    my = e.clientY - mainc.offsetTop - ch * 0.5;
    var sq = Math.sqrt(mx * mx + my * my);
    var r = sq * 4.0 * Math.PI * wh;
    if(sq != 1){
        sq = 1 / sq;
        mx *= sq;
        my *= sq;
    }
    if(mflags === true){
	    q.rotate(r, [my, mx, 0.0], qt);
        q.toVecIII(SRC_INIT_POSITION, qt, SRC_POSITION);
        updatePanner(panner);
    }
}

// XYZ軸線-------------------------------------------------
function xyzAxis(dist){
    var pos = new Array();
    var id = new Array();
    var col = new Array();
    pos = [
        dist, 0.0, 0.0,
        -dist, 0.0, 0.0,
        0.0, dist, 0.0,
        0.0, -dist, 0.0,
        0.0, 0.0, dist,
        0.0, 0.0, -dist 
    ];
    id = [
        0,1,2,3,4,5
    ];
    col = [
        1.0, 0.0, 0.0, 1.0,
        1.0, 0.0, 0.0, 1.0,
        0.0, 1.0, 0.0, 1.0,
        0.0, 1.0, 0.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        0.0, 0.0, 1.0, 1.0
    ];

    return {p:pos, idx:id, c:col};
}

/*--------------------------------------------------------
    Listener
---------------------------------------------------------*/
function soundListener(){
    var pos = new Array();
    var id  = new Array();
    var col = new Array();

    pos.push(0.0, 0.0, 0.0);
    col.push(1.0, 0.5, 0.5, 1.0);
    id.push(1);

    return {p:pos, idx:id, c:col};
}

function floor(mesh){
    var pos = new Array();
    var id  = new Array();
    var col = new Array();

    var length = mesh/2;

    // x -lenからlenまで

    for(var i = 0;i <= mesh ;i++){
        pos.push(-length, -0.5 , -length+i);
        pos.push( length, -0.5 , -length+i);
        col.push(1.0, 1.0, 1.0, 1.0);
        col.push(1.0, 1.0, 1.0, 1.0);
    }

    // z -lenからlenまで
    for(var i = 0;i <= mesh ;i++){
        pos.push(-length+i, -0.5 ,-length);
        pos.push(-length+i, -0.5 , length);
        col.push(1.0, 1.0, 1.0, 1.0);
        col.push(1.0, 1.0, 1.0, 1.0);
    }

    for(var i = 0; i <= mesh*4 ;i+=2){
        id.push(i, i+1);
    }

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
        z = r*(-Math.sin(j));
        //console.log("x: ",x,"y: ",y);
        y = 0.0;
        pos.push(x, y, z);
        if(i===9){
            col.push(1.0, 0.0, 0.0, 0.7);
        }else{
		    col.push(0.0, 0.7, 1.0, 1.0);
        }
    }

    for(i=0; i<num; i++){
        id.push(i);
    }

    return {p:pos, idx:id, c:col};
}

/*---------------------------------------------------------  
	Cone関数
	degree:coneOuterAngle
	r:距離
---------------------------------------------------------*/
function soundCone(degree, r){
	var pos = new Array();
    var id  = new Array();
    var col = new Array();
    var x = 0;
    var y = 0;
    var z = -1;

	// 扇の開き
    var rad = degree * Math.PI / 180;
    var posRad = 90 % 360 * Math.PI / 180;
    
    // 単位円における(0.0, 1.0, 0.0)を基本位置とする
	// 発音点(距離倍)
	pos.push(x, y, z);

    // 発音点からみた単位円上のX+
    // (0.0, 0.0, -1.0)からみてz方向にdegree分開く
    // = z=0から-degree方向
    var posRad2 = rad/2;
    var t1x = (x - Math.cos(posRad + posRad2))* r;
    var t1y = 0;
    var t1z = (z + Math.sin(posRad + posRad2))* r;
    pos.push(t1x, t1y, t1z);
    
    // 発音点からみた単位円上のX-
    // (0.0, 0.0, -1.0)からみてz方向にdegree分開く
    // = z=0から+degree方向
    var posRad3 = -rad/2;
	var t2x = (x - Math.cos(posRad + posRad3))* r;
    var t2y = 0;
    var t2z = (z + Math.sin(posRad + posRad3))* r;
	pos.push(t2x, t2y, t2z);

	// color
	col.push(1.0, 1.0, 1.0, 1.0);
	col.push(1.0, 1.0, 1.0, 1.0);
	col.push(1.0, 1.0, 1.0, 1.0);

    // 描画順
    id.push(0, 1, 0, 2);
    
    return {p:pos, idx:id, c:col};
}

// 音源到達距離、分割数が必要
function freqToCircle(degree, len, num){
    /******************************************************************************** 
        周波数領域で色分けしたサークル上の図形を表示する
        位置:距離を周波数分割数で割る。
        色  :freqで表現している色をそのまま活用
        20170321追記:
        極座標系を扱わないとY軸の計算が合わない。
    *******************************************************************************/　　　　　　
    
    var pos = new Array();
    var id  = new Array();
    var col = new Array();
    var hueFunc = new Array();
    var r, g, b, a;

    // addPosFromDeg:45度単位で中間ポイントの追加
    // プロット数は4ずつ増加する
    var addPosFromDeg = degree / 45;

    var rad = degree * Math.PI / 180;
    var jrad = 360 / num * Math.PI / 180;
    var posRad = 90 % 360 * Math.PI / 180;
    var posRad2 = rad / 2;

    var x = SRC_INIT_POSITION[0]; //  0
    var y = SRC_INIT_POSITION[1]; //  0
    var z = SRC_INIT_POSITION[2]; // -1

    // x = rsinθcosφ
    // y = rsinθsinφ
    // z = rcosθ
    // x -> z, y -> x, z -> y

    var t1x = len * (x - Math.cos(posRad + posRad2));
    var t1y = len * (y - Math.cos(posRad + posRad2));
    var t1z = len * (z + Math.sin(posRad + posRad2));

    // 周波数:分割数 
    var hz;
    var ilength;

    // HSV
    var hue;
    var sat = 1;
    var val = freqs[i] / 256;
    var i, j, jx, jy, jz;
    
    // Length/i = 周波数対位置
    // posとcol
    for(i = 0; i < afbc; i++){
        // hzは距離の分割数に相当する。
        hz = z - (z / (afbc-1)) * i;
        ilength = len / (afbc-1) * i;

        // color
        hue = i / (afbc) * 360;
        val = freqs[i] / 256;

        // 色変換
        hueFunc = hsva(hue, sat, val, 0.6);
        r = hueFunc[0];
        g = hueFunc[1];
        b = hueFunc[2];
        a = hueFunc[3];
        
        for(j = 0; j < num; j++){
            // 極座標系でのプロット
            // 0, 1, 2, 3
            jx =  ilength * t1x * Math.cos(jrad * j);
            jy =  ilength * t1y * Math.sin(jrad * j);
            jz =  ilength * t1z + hz;
            
            // x, z はその位置における開きの位置にある
            pos.push(jx, jy, jz);
            col.push(r, g, b, a);
        }
        // 4i(中央)
        pos.push(0, 0, hz * len);
        col.push(r, g, b, 0.7);
    }

    // index（筒描画のインデックスは一度やったはずだが？）
    // i = 距離の分割
    for(i = 0; i < afbc-1; i++){
        // 筒表面描画(4分割円筒)
        for(j = 0; j < num - 1; j++){
            var k = i * (num+1) + j;
            id.push(k, k+1, k+(num+1)+1, k, k+(num+1)+1, k+(num+1));
        }
        var l = (i+1) * (num+1);
        id.push(l-2, l-(num+1), l, l-2, l, l+num-1);

        // 球面の分割(中心点4i)
        var n = (i+1) * (num+1) -1;
        for(j = 0; j < num - 1 ;j++){
            id.push(n, n-num+j, n-num+j+1);
        }
        // 4 3 0
        // 9 8 5
        id.push(n, n-1, n-num);
    }

    //最後の球面
    var m = (num+1) * afbc-1;
    id.push(m, m-num,   m-num+1);
    id.push(m, m-num+1, m-num+2);
    id.push(m, m-num+2, m-num+3);
    id.push(m, m-num+3, m-num+4);
    id.push(m, m-num+4, m-num+5);
    id.push(m, m-num+5, m-num+6);
    id.push(m, m-num+6, m-num+7);
    id.push(m, m-num+7, m-num  );

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


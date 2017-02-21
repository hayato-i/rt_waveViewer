var mainc, gl, vs, fs;
var rlen = 1.0;

window.onload = function(){
    /***************************************************************************
    *　ヴィジュアル面の実装にあたって、描画するものの目的/要件の洗い出し
    *■ サウンドリスナの位置（中心点、LR表示を座標で？+X->R, -X->L）
    *・HRTF適用が条件であるため、左右の見分けがつくような描画。
    *・初期段階では動かすことを考慮しない。第二段階では動かすことも想定。
    *■ サウンドソースの位置（同心円状）
    *・サウンドソース一つに対して一つの円、もしくは同じ円上にソースを配置できるようにする（理想）
    *・円の半径は動的に変更できるものとする。
    *・ソースの形状、見た目は発音方向(innerAngle)に対して円錐を描くようにする。
    *（低音部分やouterAngleは考慮しないものとする）
    *■ それらを視界に確保できるカメラアングル（俯瞰）
    *・視界に収める範囲も動的に変更できるようにする
    *・ズームアップかズームダウンのみ。回転は基本的にしないものとする。
    *・Y軸実装（第？段階）のタイミングでカメラ周りは見直すものとする。

    *　関数
    *・円の描画
    *・球の描画
    *・円錐の描画
    ***************************************************************************/

    // Canvas設定
    mainc = document.getElementById('main');
    mainc.width = 1000;
    mainc.height = 1000;

    gl = mainc.getContext('webgl') || c.getContext('experimental-webgl');

    // - シェーダとプログラムオブジェクトの初期化 ---------------------------------
	// シェーダのソースを取得
	vs = document.getElementById('vs').textContent;
	fs = document.getElementById('fs').textContent;
	
	// 頂点シェーダとフラグメントシェーダの生成
	var vShader = create_shader(vs, gl.VERTEX_SHADER);
	var fShader = create_shader(fs, gl.FRAGMENT_SHADER);

	// プログラムオブジェクトの生成とリンク
	var prg = create_program(vShader, fShader);

	// - 頂点属性に関する処理 -----------------------------------------------------
	// attributeLocationの取得
	var attLocation = [];
    attLocation[0] = gl.getAttribLocation(prg, 'position');

	// attributeの要素数
	var attStride = [];
    attStride[0] = 3;

	// Sound cone----------------------------------------------------------------
	var coneData = soundCone(45, 1);
    var sPosition = coneData.p;
    var sIndex = coneData.idx;

	// VBOの生成
	var coneVBO = [];
    coneVBO[0] = create_vbo(sPosition);

	// IBOの生成
    var sIbo = create_ibo(sIndex);

	// Circle---------------------------------------------------------------------
	var circleData = circle(36, rlen);
	var cPosition = circleData.p;
	var cIndex = circleData.idx;

	// VBOの生成
	var circleVBO = [];
    circleVBO[0] = create_vbo(cPosition);

	// IBOの生成
	var cIbo = create_ibo(cIndex);

	// - uniform関連 -------------------------------------------------------------- *
	// uniformLocationの取得
	var uniLocation = [];
	uniLocation[0] = gl.getUniformLocation(prg, 'mvpMatrix');
	uniLocation[1] = gl.getUniformLocation(prg, 'invMatrix');

	// - 行列の初期化 -------------------------------------------------------------
	// minMatrix.js を用いた行列関連処理
	// matIVオブジェクトを生成
	var m = new matIV();

	// 各種行列の生成と初期化
	var mMatrix = m.identity(m.create());
	var vMatrix = m.identity(m.create());
	var pMatrix = m.identity(m.create());
	var vpMatrix = m.identity(m.create());
	var mvpMatrix = m.identity(m.create());
	var invMatrix = m.identity(m.create());

	// - レンダリングのための WebGL 初期化設定 ------------------------------------
	// ビューポートを設定する
	gl.viewport(0, 0, mainc.width, mainc.height);

	// canvasを初期化する色を設定する
	gl.clearColor(0.0, 0.0, 0.0, 1.0);

	// canvasを初期化する際の深度を設定する
	gl.clearDepth(1.0);

	// - 行列の計算 ---------------------------------------------------------------
	// ビュー座標変換行列
	m.lookAt([0.0, 0.0, 3.0], [0.0, 0.0, 0.0], [0.0, 1.0, 0.0], vMatrix);

	// プロジェクション座標変換行列
	m.perspective(45, mainc.width / mainc.height, 0.1, 10.0, pMatrix);

	// 各行列を掛け合わせ座標変換行列を完成させる
	m.multiply(pMatrix, vMatrix, vpMatrix);
	m.multiply(vpMatrix, mMatrix, mvpMatrix);

	// アニメーション用変数設定
	var count = 0;

	render();

	function render(){
		count ++;
		
		// アニメーション用のカウンタからラジアンを計算
		var rad = (count % 360) * Math.PI / 180;
		
		// canvasを初期化
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		/*-----------------------------------------------------------------------
		 Cone:モデル変換座標行列
		-----------------------------------------------------------------------*/
		m.identity(mMatrix);
		m.multiply(vpMatrix, mMatrix, mvpMatrix);
		m.inverse(mMatrix, invMatrix)

		gl.uniformMatrix4fv(uniLocation[0], false, mvpMatrix);
		gl.uniformMatrix4fv(uniLocation[1], false, invMatrix);

		//VBO,IBOのバインド
		// VBOのバインドと登録
		set_attribute(coneVBO, attLocation, attStride);
		
		// IBOをバインド
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sIbo);

		// = レンダリング =========================================================
		// モデルの描画
		gl.drawElements(gl.LINE_STRIP, sIndex.length, gl.UNSIGNED_SHORT, 0);

		/*-----------------------------------------------------------------------
		 Circle:モデル変換座標行列
		-----------------------------------------------------------------------*/
		m.identity(mMatrix);
		m.multiply(vpMatrix, mMatrix, mvpMatrix);
		m.inverse(mMatrix, invMatrix)

		gl.uniformMatrix4fv(uniLocation[0], false, mvpMatrix);
		gl.uniformMatrix4fv(uniLocation[1], false, invMatrix);

		//VBO,IBOのバインド
		// VBOのバインドと登録
		set_attribute(circleVBO, attLocation, attStride);
		
		// IBOをバインド
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cIbo);

		// = レンダリング =========================================================
		// モデルの描画
		gl.drawElements(gl.LINE_STRIP, cIndex.length, gl.UNSIGNED_SHORT, 0);

		// コンテキストの再描画
		gl.flush();
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
    }
    pos.push(0.0, 0.0, 0.0);

    for(i=0; i<num-1; i++){
        id.push(num, i, i+1);
    }
    id.push(num, num-1, 0);

    return {p:pos, idx:id};
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

    return {p:pos, idx:id};
}

/*---------------------------------------------------------  
	Cone関数
	degree:innerAngle
	r:距離
---------------------------------------------------------*/
function soundCone(degree, r){
	var pos = new Array();
    var id = new Array();
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
    id.push(1, 0, 2);
    
    return {p:pos, idx:id};
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
 * VBOを生成する関数
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

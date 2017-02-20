let glCanvas, gl, vs, fs;

(window.onload = function(){
    /***************************************************************************
    *　実装にあたって、描画するものの目的/要件の洗い出し
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
    glCanvas = document.getElementById('3d');
    gl = glCanvas.getContext('webgl') || glCanvas.getContext('experimental-webgl');

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
	var attLocation = gl.getAttribLocation(prg, 'position');

	// attributeの要素数
	var attStride = 3;

	// モデル(頂点)データ
	var vPosition = [
		 0.0,  0.5,  0.0,
		 0.5,  0.0,  0.0,
		-0.5,  0.0,  0.0
	];

	// VBOの生成
	var vbo = create_vbo(vPosition);

	// VBOをバインド
	gl.bindBuffer(gl.ARRAY_BUFFER, vbo);

	// attribute属性を有効にする
	gl.enableVertexAttribArray(attLocation);

	// attribute属性を登録
	gl.vertexAttribPointer(attLocation, attStride, gl.FLOAT, false, 0, 0);


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


	// - レンダリングのための WebGL 初期化設定 ------------------------------------
	// ビューポートを設定する
	gl.viewport(0, 0, glCanvas.width, glCanvas.height);

	// canvasを初期化する色を設定する
	gl.clearColor(0.0, 0.0, 0.0, 1.0);

	// canvasを初期化する際の深度を設定する
	gl.clearDepth(1.0);

	// canvasを初期化
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


	// - 行列の計算 ---------------------------------------------------------------
	// ビュー座標変換行列
	m.lookAt([0.0, 0.0, 3.0], [0.0, 0.0, 0.0], [0.0, 1.0, 0.0], vMatrix);

	// プロジェクション座標変換行列
	m.perspective(45, c.width / c.height, 0.1, 10.0, pMatrix);

	// 各行列を掛け合わせ座標変換行列を完成させる
	m.multiply(pMatrix, vMatrix, vpMatrix);
	m.multiply(vpMatrix, mMatrix, mvpMatrix);


	// - uniform 関連の初期化と登録 -----------------------------------------------
	// uniformLocationの取得
	var uniLocation = gl.getUniformLocation(prg, 'mvpMatrix');

	// uniformLocationへ座標変換行列を登録
	gl.uniformMatrix4fv(uniLocation, false, mvpMatrix);


	// - レンダリング -------------------------------------------------------------
	// モデルの描画
	gl.drawArrays(gl.TRIANGLES, 0, 3);

	// コンテキストの再描画
	gl.flush();


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


    function circle(){

    }

    function sphere(){

    }

    /* 
     num:分割数
     r:底面の半径
     rad:角度
     len:高さ
     */
    function cone(){

        return {p:pos, c:col, id:idx}
    }

})()


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
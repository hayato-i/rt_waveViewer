window.onload = function(){
	// eventとaudioのjavascript呼び出し
	audioInit();
    /***************************************************************************
    *　ヴィジュアル面の実装にあたって、描画するものの目的/要件の洗い出し
    *■ サウンドリスナの位置（中心点、LR表示を座標で？+X->R, -X->L）
    *・HRTF適用が条件であるため、左右の見分けがつくような描画。
    *・初期段階では動かすことを考慮しない。第二段階では動かすことも想定。
    *■ サウンドソースの位置（同心円状）
    *・サウンドソース一つに対して一つの円、もしくは同じ円上にソースを配置できるようにする（理想）
    *・円の半径は動的に変更できるものとする。
    *・ソースの形状、見た目は発音方向(outerAngle)に対して円錐を描くようにする。
	*・距離に関しては明示的に参考にできるサンプルがあれば利用。なければ間隔
	*・同心円状の距離として(x, z)を変更できるようにする。
    *■ それらを視界に確保できるカメラアングル（俯瞰）
    *・視界に収める範囲も動的に変更できるようにする
    *・ズームアップかズームダウンのみ。回転は基本的にしないものとする。
    *・Y軸実装（第？段階）のタイミングでカメラ周りは見直すものとする。

    *　関数
    *・円の描画
    *・球の描画
    *・円錐の描画
    ***************************************************************************/
	
	mainc = document.getElementById('main');
	mainc.width = 512;
	mainc.height = 512;
	gl = mainc.getContext('webgl') || c.getContext('experimental-webgl');

	hidc = document.getElementById('freq');
	hidc.width = 512;
	hidc.height = 512;
	hidContext = hidc.getContext("2d");

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
	attLocation[1] = gl.getAttribLocation(prg, 'vColor');

	// attributeの要素数
	var attStride = [];
    attStride[0] = 3;
	attStride[1] = 4;

	// Sound cone angle(動的に変更)-----------------------------------------------
	var coneData = soundCone(OUTER_ANGLE, DISTANCE);
    var sPosition = coneData.p;
	var sBufferPosition = new Float32Array(coneData.p);
	var sColor = coneData.c;
    var sIndex = coneData.idx;

	// VBOの生成
	var coneVBO = [];
    coneVBO[0] = create_Dvbo(sBufferPosition);
	coneVBO[1] = create_vbo(sColor);

	// IBOの生成
    var sIbo = create_ibo(sIndex);

	// Sounde Source Circle(動的に変更)--------------------------------------------
	var circleData = circle(36, DISTANCE);
	var cPosition = circleData.p;
	var cBufferPosition = new Float32Array(cPosition);
	var cColor = circleData.c;
	var cIndex = circleData.idx;

	// VBOの生成
	var circleVBO = [];
    circleVBO[0] = create_Dvbo(cPosition);
	circleVBO[1] = create_vbo(cColor);

	// IBOの生成
	var cIbo = create_ibo(cIndex);

	// X,Y axis--------------------------------------------------------------------
	var xData = xAxis(10);
	var xPosition = xData.p;
	var xColor = xData.c;
	var xIndex = xData.idx;

	var xVBO = [];
	xVBO[0] = create_vbo(xPosition);
	xVBO[1] = create_vbo(xColor);

	var xIbo = create_ibo(xIndex);

	var yData = yAxis(10);
	var yPosition = yData.p;
	var yColor = yData.c;
	var yIndex = yData.idx;

	var yVBO = [];
	yVBO[0] = create_vbo(yPosition);
	yVBO[1] = create_vbo(yColor);

	var yIbo = create_ibo(yIndex);

	// - uniform関連 -------------------------------------------------------------- *
	// uniformLocationの取得
	var uniLocation = [];
	uniLocation[0] = gl.getUniformLocation(prg, 'mvpMatrix');
	uniLocation[1] = gl.getUniformLocation(prg, 'mMatrix');
	uniLocation[2] = gl.getUniformLocation(prg, 'invMatrix');
	uniLocation[3] = gl.getUniformLocation(prg, 'pointSize');
	
	var pointSize = 8;

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
	// カメラの上方向を表すベクトル
	var camUpDirection = [0.0, 1.0, 0.0];
	
	// 各種フラグを有効化する
	gl.enable(gl.BLEND);
	
	// ブレンドファクター
	gl.blendFuncSeparate(gl.ONE, gl.ONE, gl.ONE, gl.ONE);

	// アニメーション用変数設定
	var run = true;
	var count = 0;
	var camPosition = camPos;

	// event -------------------------------------------------------------------
	var devEve = document.getElementById('device');
	var dmodelEve = document.getElementById('dmodel');
	var posEve = document.getElementById('position');
	var angleEve = document.getElementById('angle');
	var sdEve = document.getElementById('sd');
	var camEve = document.getElementById('cd');

	devEve.addEventListener('change', function(e){
		PANNING_MODEL = e.currentTarget.value;
		updatePanner(panner);
		console.log(PANNING_MODEL);
	},false);

	dmodelEve.addEventListener('change', function(e){
		DISTANCE_MODEL = e.currentTarget.value;
		updatePanner(panner);
		console.log(DISTANCE_MODEL);
	},false);

	posEve.addEventListener('change', function(e){
		var evePos = e.currentTarget.value;
		SRC_POSITION = evePos;
		document.getElementById('postext').textContent = evePos-90;
		updatePanner(panner);
		// coneVBOの更新
		gl.bindBuffer(gl.ARRAY_BUFFER, coneVBO[0]);
		sBufferPosition = new Float32Array(soundCone(OUTER_ANGLE, DISTANCE).p);
		gl.bufferSubData(gl.ARRAY_BUFFER, 0, sBufferPosition);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
	}, false);

	angleEve.addEventListener('change', function(e){
		var eveAngle = e.currentTarget.value; 
		OUTER_ANGLE = eveAngle;
		document.getElementById('iatext').textContent = eveAngle;
		updatePanner(panner);
		// coneVBOの更新
		gl.bindBuffer(gl.ARRAY_BUFFER, coneVBO[0]);
		sBufferPosition = new Float32Array(soundCone(OUTER_ANGLE, DISTANCE).p);
		gl.bufferSubData(gl.ARRAY_BUFFER, 0, sBufferPosition);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
	}, false);
	
	sdEve.addEventListener('change',function(e){
		var eveSD = e.currentTarget.value;
		DISTANCE = eveSD;
		updatePanner(panner);
		// circleVBOの更新
		gl.bindBuffer(gl.ARRAY_BUFFER, circleVBO[0]);
		cBufferPosition = new Float32Array(circle(36, DISTANCE).p);
		gl.bufferSubData(gl.ARRAY_BUFFER, 0, cBufferPosition);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
		// coneVBOの更新
		gl.bindBuffer(gl.ARRAY_BUFFER, coneVBO[0]);
		sBufferPosition = new Float32Array(soundCone(OUTER_ANGLE, DISTANCE).p);
		gl.bufferSubData(gl.ARRAY_BUFFER, 0, sBufferPosition);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
	},false);

	camEve.addEventListener('change',function(e){
		var eveCD = e.currentTarget.value;
		camPosition = [0, 0, eveCD];
	}, false);

	window.addEventListener('keydown',function(e){
		var key = e.keyCode;
		var d = 0.1;
		// WASD
		if(key === 87){
			LZ -= d;
		}else if(key === 65){
			LX -= d;
		}else if(key === 83){
			LZ += d;
		}else if(key === 68){
			LX += d;
		}else if(key === 74){
			console.log(listener);
			var px = panner.positionX.value;
			//var py = panner.positionY.value;
			var pz = panner.positionZ.value;
			var lx = listener.positionX.value;
			//var ly = listener.positionY.value;
			var lz = listener.positionZ.value;
			var x = px - lx;
			//var y = ly - py;
			var z = pz - lz;
			var len = Math.sqrt(x * x + z * z);
			x /= len;
			//ly /= len;
			z /= len;
			// リスナーは向きをorientationではなくforwordX,Y,Zとして持っていることに注意
			listener.setOrientation(x, 0.0, z, 0.0, 1.0, 0.0);
			console.log("Set listener orientation:", listener);
			return;
		}
		gl.bindBuffer(gl.ARRAY_BUFFER, circleVBO[0]);
		listener.setPosition(LX, LY, LZ);
		var i = 36 * 3;
		// YとZが入れ替わっていることに注意。要修正
		cBufferPosition[i] = LX;
		cBufferPosition[i+1] = -LZ;
		cBufferPosition[i+2] = LY;
		gl.bufferSubData(gl.ARRAY_BUFFER, 0, cBufferPosition);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
	}, false);

	render();

	function render(){
		// カメラの座標
		// ビュー×プロジェクション座標変換行列
		m.lookAt(camPosition, [0, 0, 0], camUpDirection, vMatrix);
		m.perspective(45, mainc.width / mainc.height, 0.1, 30, pMatrix);
		m.multiply(pMatrix, vMatrix, vpMatrix);

		count++;

		var rad = count % 360 * Math.PI / 180;

		freq();	

		// canvasを初期化--------------------------------------------------------
		gl.clearColor(0.0, 0.0, 0.0, 1.0);
		gl.clear(gl.COLOR_BUFFER_BIT);


		/*-----------------------------------------------------------------------
		 Cone:モデル変換座標行列
		-----------------------------------------------------------------------*/

		m.identity(mMatrix);
		m.rotate(mMatrix, rad, [0, 1, 0], mMatrix);
		m.multiply(vpMatrix, mMatrix, mvpMatrix);
		m.inverse(mMatrix, invMatrix);

		// uniformLocationへ登録
		gl.uniformMatrix4fv(uniLocation[0], false, mvpMatrix);
		gl.uniformMatrix4fv(uniLocation[1], false, mMatrix);
		gl.uniformMatrix4fv(uniLocation[2], false, invMatrix);
		gl.uniform1f(uniLocation[3], pointSize);

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
		m.inverse(mMatrix, invMatrix);

		// uniformLocationへ座標変換行列を登録
		gl.uniformMatrix4fv(uniLocation[0], false, mvpMatrix);
		gl.uniformMatrix4fv(uniLocation[1], false, mMatrix);
		gl.uniformMatrix4fv(uniLocation[2], false, invMatrix);
		gl.uniform1f(uniLocation[3], pointSize);

		//VBO,IBOのバインド
		// VBOのバインドと登録
		set_attribute(circleVBO, attLocation, attStride);

		// IBOをバインド
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cIbo);

		// = レンダリング =========================================================
		// モデルの描画
		gl.drawArrays(gl.POINTS, 0, cIndex.length);

		/*-----------------------------------------------------------------------
		 XY Axis
		-----------------------------------------------------------------------*/
		m.identity(mMatrix);
		m.multiply(vpMatrix, mMatrix, mvpMatrix);
		m.inverse(mMatrix, invMatrix);

		// uniformLocationへ座標変換行列を登録
		gl.uniformMatrix4fv(uniLocation[0], false, mvpMatrix);
		gl.uniformMatrix4fv(uniLocation[1], false, mMatrix);
		gl.uniformMatrix4fv(uniLocation[2], false, invMatrix);
		gl.uniform1f(uniLocation[3], pointSize);

		//VBO,IBOのバインド
		// VBOのバインドと登録
		set_attribute(xVBO, attLocation, attStride);
		
		// IBOをバインド
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, xIbo);

		// = レンダリング =========================================================
		// モデルの描画
		gl.drawElements(gl.LINES, xIndex.length, gl.UNSIGNED_SHORT, 0);

		m.identity(mMatrix);
		m.multiply(vpMatrix, mMatrix, mvpMatrix);
		m.inverse(mMatrix, invMatrix);

		// uniformLocationへ座標変換行列を登録
		gl.uniformMatrix4fv(uniLocation[0], false, mvpMatrix);
		gl.uniformMatrix4fv(uniLocation[1], false, mMatrix);
		gl.uniformMatrix4fv(uniLocation[2], false, invMatrix);
		gl.uniform1f(uniLocation[3], pointSize);

		//VBO,IBOのバインド
		// VBOのバインドと登録
		set_attribute(yVBO, attLocation, attStride);
		
		// IBOをバインド
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, yIbo);

		// = レンダリング =========================================================
		// モデルの描画
		gl.drawElements(gl.LINES, yIndex.length, gl.UNSIGNED_SHORT, 0);
		// コンテキストの再描画
		gl.flush();

		if(run){requestAnimationFrame(render);}
	}

}


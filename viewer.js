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
	mainc.width = 1200;
	mainc.height = 1200;
	gl = mainc.getContext('webgl') || mainc.getContext('experimental-webgl');

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

	// Sound cone angle(動的に変更->GL側でtransformの予定)----------------------------
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

	// sound listener--------------------------------------------------------------
	var lData = soundListener();
	var lPosition = lData.p;
	var lBufferPosition = new Float32Array(lPosition);
	var lColor = lData.c;
	var lIndex = lData.idx;

	var lVBO = [];
	lVBO[0] = create_vbo(lPosition);
	lVBO[1] = create_vbo(lColor);

	var lIbo = create_ibo(lIndex);

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

	// Frequency Circle(動的に変更)--------------------------------------------
	var freqData = freqToCircle(OUTER_ANGLE, DISTANCE, 8);
	var fPosition = freqData.p;
	var fBufferPosition = new Float32Array(fPosition);
	var fColor = freqData.c;
	var fBufferColor = new Float32Array(fColor);
	var fIndex = freqData.idx;

	// VBOの生成
	var freqVBO = [];
    freqVBO[0] = create_Dvbo(fPosition);
	freqVBO[1] = create_Dvbo(fColor);

	// IBOの生成
	var fIbo = create_ibo(fIndex);

	// X,Y,Z axis--------------------------------------------------------------------
	var xyzData = xyzAxis(10);
	var xyzPosition = xyzData.p;
	var xyzColor = xyzData.c;
	var xyzIndex = xyzData.idx;

	var xyzVBO = [];
	xyzVBO[0] = create_vbo(xyzPosition);
	xyzVBO[1] = create_vbo(xyzColor);

	var xyzIbo = create_ibo(xyzIndex);

	// mesh floor--------------------------------------------------------------------
	var flData = floor(20);
	var flPosition = flData.p;
	var flColor = flData.c;
	var flIndex = flData.idx;

	var flVBO = [];
	flVBO[0] = create_vbo(flPosition);
	flVBO[1] = create_vbo(flColor);

	var flIbo = create_ibo(flIndex);

	// - uniform関連 -------------------------------------------------------------- *
	// uniformLocationの取得
	var uniLocation = [];
	uniLocation[0] = gl.getUniformLocation(prg, 'mvpMatrix');
	uniLocation[1] = gl.getUniformLocation(prg, 'mMatrix');
	uniLocation[2] = gl.getUniformLocation(prg, 'invMatrix');
	uniLocation[3] = gl.getUniformLocation(prg, 'pointSize');
	
	var pointSize = 16;

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

	// event -------------------------------------------------------------------
	var devEve = document.getElementById('device');
	var dmodelEve = document.getElementById('dmodel');
	var angleEve = document.getElementById('angle');
	var sdEve = document.getElementById('sd');
	var camEve = document.getElementById('cd');

	mainc.addEventListener('mousedown',function(){
		mflags = true;
	},false);

	mainc.addEventListener('mouseup',function(){
		mflags = false;
	},false);

	mainc.addEventListener('mousemove', mouseMove, true);


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

		// freqVBOの更新(POSITION)
		gl.bindBuffer(gl.ARRAY_BUFFER, freqVBO[0]);
		fBufferPosition = new Float32Array(freqToCircle(OUTER_ANGLE, DISTANCE, 8).p);
		gl.bufferSubData(gl.ARRAY_BUFFER, 0, fBufferPosition);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
	}, false);

	camEve.addEventListener('change',function(e){
		var eveCD = e.currentTarget.value;
		camPosXY = [0, 0, eveCD];
		camPosXZ = [0, eveCD, 0];
		camPosYZ = [-eveCD, 0, 0];
	}, false);

	window.addEventListener('keydown',function(e){
		var key = e.keyCode;
		var d = 0.05;
		if(key === 87){       // W:Listener Move Forword
			LisPos[2] -= d;
		}else if(key === 65){ // A:Listener Move Left
			LisPos[0] -= d;
		}else if(key === 83){ // S:Listener Move Back
			LisPos[2] += d;
		}else if(key === 68){ // D:Listener Move Right
			LisPos[0] += d;
		}else if(key === 75){ // K:Listener Move Down
			LisPos[1] -= d;
		}else if(key === 85){ // U:Listener Move Up 
			LisPos[1] += d;
		}else if(key === 74){ // J:Direction Sound Source 
			console.log(listener);
			var px = panner.positionX.value;
			var py = panner.positionY.value;
			var pz = panner.positionZ.value;
			var lx = listener.positionX.value;
			var ly = listener.positionY.value;
			var lz = listener.positionZ.value;
			var x = px - lx;
			var y = py - ly;
			var z = pz - lz;
			var len = Math.sqrt(x * x + y * y +z * z);

			// normalize
			x /= len;
			y /= len;
			z /= len;
			
			// リスナーはカメラのように上方向の要素をもっていることに注意
			listener.setOrientation(x, y, z, 0.0, 1.0, 0.0);
			console.log("Set listener orientation");
			return;
		}
		gl.bindBuffer(gl.ARRAY_BUFFER, lVBO[0]);
		listener.setPosition(LisPos[0], LisPos[1], LisPos[2]);
		lBufferPosition[0] = LisPos[0];
		lBufferPosition[1] = LisPos[1]; 
		lBufferPosition[2] = LisPos[2]; 
		gl.bufferSubData(gl.ARRAY_BUFFER, 0, lBufferPosition);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
	}, false);


	// カメラ
	var camPosition;
	var camUp;
	
	// 各種フラグを有効化する
	gl.enable(gl.BLEND);

	// ブレンドファクター
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE, gl.ONE, gl.SRC_ALPHA);

	// flag
	var run = true;
	
	three();

	function three(){
		// canvasを初期化--------------------------------------------------------
		gl.clearColor(0.0, 0.0, 0.0, 1.0);
		gl.clear(gl.COLOR_BUFFER_BIT);

		// XYカメラの座標(左上)
		camPosition = camPosXY;
		camUp = camUpXY;
		// ビュー×プロジェクション座標変換行列
		gl.viewport(0, mainc.height/2, mainc.width/2, mainc.height/2);
		m.perspective(45, mainc.width / mainc.height, 0.1, 30, pMatrix);
		m.lookAt(camPosition, [0, 0, 0], camUp, vMatrix);
		m.multiply(pMatrix, vMatrix, vpMatrix);

		// 描画フラグ
		firstPerson = false;
		meshFlag = false;

		// 描画関数
		render();
		
		// XZカメラの座標(右下)
		camPosition = camPosXZ;
		camUp = camUpXZ;
		// ビュー×プロジェクション座標変換行列
		gl.viewport(mainc.width/2, 0, mainc.width/2, mainc.height/2);
		m.perspective(45, mainc.width / mainc.height, 0.1, 30, pMatrix);
		m.lookAt(camPosition, [0, 0, 0], camUp, vMatrix);
		m.multiply(pMatrix, vMatrix, vpMatrix);
		
		// 描画フラグ
		firstPerson = false;
		meshFlag = true;

		// 描画関数
		render();

		// YZカメラの座標(左下)
		camPosition = camPosYZ;
		camUp = camUpYZ;
		// ビュー×プロジェクション座標変換行列
		gl.viewport(0, 0, mainc.width/2, mainc.height/2);
		m.perspective(45, mainc.width / mainc.height, 0.1, 30, pMatrix);
		m.lookAt(camPosition, [0, 0, 0], camUp, vMatrix);
		m.multiply(pMatrix, vMatrix, vpMatrix);
		
		// 描画フラグ
		firstPerson = false;
		meshFlag = false;

		// 描画関数
		render();

		// XYカメラの座標(右上)
		camPosition = LisPos;
		camUp = camUpXY;
		// ビュー×プロジェクション座標変換行列
		gl.viewport(mainc.width/2, mainc.height/2, mainc.width/2, mainc.height/2);
		m.perspective(90, mainc.width / mainc.height, 0.1, 100, pMatrix);
		m.lookAt(camPosition, [0, 0, -1], camUp, vMatrix);
		m.multiply(pMatrix, vMatrix, vpMatrix);

		// 描画フラグ
		firstPerson = true;
		meshFlag = true;

		// 描画関数
		render();

		if(run){requestAnimationFrame(three);}

	}

	function render(){

		var qMatrix = m.identity(m.create());
		q.toMatIV(qt, qMatrix);

		/*-----------------------------------------------------------------------
		 Circle:モデル変換座標行列
		-----------------------------------------------------------------------*/
		m.identity(mMatrix);
		m.multiply(mMatrix, qMatrix, mMatrix);
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
		 Sound Cone:モデル変換座標行列
		 translate:可
		 scale:可？
		 rotate:可
		-----------------------------------------------------------------------*/

		m.identity(mMatrix);
		// 初期位置SRC_POSITION
		m.multiply(mMatrix, qMatrix, mMatrix);
		//m.translate(mMatrix, SRC_POSITION, mMatrix);
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
		gl.drawElements(gl.LINES, sIndex.length, gl.UNSIGNED_SHORT, 0);

		/*-----------------------------------------------------------------------
		 FrequencyCircle:モデル変換座標行列
		-----------------------------------------------------------------------*/
		if(flags === true){

			analyser.getByteFrequencyData(freqs);
			m.identity(mMatrix);
			m.multiply(mMatrix, qMatrix, mMatrix);
			m.multiply(vpMatrix, mMatrix, mvpMatrix);
			m.inverse(mMatrix, invMatrix);

			// uniformLocationへ登録
			gl.uniformMatrix4fv(uniLocation[0], false, mvpMatrix);
			gl.uniformMatrix4fv(uniLocation[1], false, mMatrix);
			gl.uniformMatrix4fv(uniLocation[2], false, invMatrix);
			gl.uniform1f(uniLocation[3], pointSize);

			// 再生中の色表示の差分を取得
			gl.bindBuffer(gl.ARRAY_BUFFER, freqVBO[1]);
			fBufferColor = new Float32Array(freqToCircle(OUTER_ANGLE, DISTANCE, 8).c);
			gl.bufferSubData(gl.ARRAY_BUFFER, 0, fBufferColor);
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

			//VBO,IBOのバインド
			// VBOのバインドと登録
			set_attribute(freqVBO, attLocation, attStride);
			
			// IBOをバインド
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, fIbo);
			
			// = レンダリング =========================================================
			// モデルの描画
			gl.drawElements(gl.TRIANGLES, fIndex.length, gl.UNSIGNED_SHORT, 0);
		}

		/*-----------------------------------------------------------------------
		  Sound Listener
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
		set_attribute(lVBO, attLocation, attStride);

		// IBOをバインド
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, lIbo);

		// = レンダリング =========================================================
		// モデルの描画
		gl.drawArrays(gl.POINTS, 0, lIndex.length);

		if(firstPerson === false){
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
			set_attribute(xyzVBO, attLocation, attStride);
			
			// IBOをバインド
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, xyzIbo);

			gl.drawElements(gl.LINES, xyzIndex.length, gl.UNSIGNED_SHORT, 0);

		}
		if(mesh === true){
			/*-----------------------------------------------------------------------
				Floor mesh
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
			set_attribute(flVBO, attLocation, attStride);
			
			// IBOをバインド
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, flIbo);

			gl.drawElements(gl.LINES, flIndex.length, gl.UNSIGNED_SHORT, 0);
		}
		
		// コンテキストの再描画
		gl.flush();
	}

}


var getAudioBuffer = function(url, fn) {  
  var req = new XMLHttpRequest();
  // array buffer を指定
  req.responseType = 'arraybuffer';

  req.onreadystatechange = function() {
    if (req.readyState === 4) {
      if (req.status === 0 || req.status === 200) {
        // array buffer を audio buffer に変換
        audioCont.decodeAudioData(req.response, function(buffer) {
          // コールバックを実行
          fn(buffer);
        });
      }
    }
  };

  req.open('GET', url, true);
  req.send('');
};

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

function audioInit(buffer){
        
        // PannerNode生成
        // 音源の増加によりClass化の必要性あり
        panner.refDistance = REF_DISTANCE;
        panner.maxDistance = MAX_DISTANCE;
        panner.rolloffFactor = ROLL_OFF_FACTOR;
        panner.coneInnerAngle = INNER_ANGLE;
        panner.coneOuterAngle = OUTER_ANGLE;
        panner.coneOuterGain = OUTER_GAIN;

        updatePanner(panner);

        // buffer取得
        getAudioBuffer(url, function(buffer){ 
            var btn = document.getElementById('btn');
            btn.addEventListener('click', function() {
              var src = audioCont.createBufferSource();
              src.buffer = buffer;
              src.connect(panner);
              panner.connect(analyser);
              analyser.connect(destination);
              // 再生
              flags = true;
              src.start(0);
              src.onended = function(){flags = false;}
            }, false);
        });
}


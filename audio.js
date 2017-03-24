var getAudioBuffer = function(url, fn) {  
  var req = new XMLHttpRequest();
  req.open('GET', url, true);
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

  req.send('');
};

function updatePanner(pan){
    pan.coneInnerAngle = INNER_ANGLE;
    pan.coneOuterAngle = OUTER_ANGLE;
    pan.panningModel = PANNING_MODEL;
    pan.distanceModel = DISTANCE_MODEL;

    var x = 0-SRC_POSITION[0];
    var y = 0-SRC_POSITION[1];
    var z = 0-SRC_POSITION[2];

    var sq = Math.sqrt(x*x+y*y+z*z);

    var dx = x/sq;
    var dy = y/sq;
    var dz = z/sq;

    pan.setPosition(SRC_POSITION[0], SRC_POSITION[1], SRC_POSITION[2]);
    pan.setOrientation(dx, dy, dz);
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
            }, false);
        });
}


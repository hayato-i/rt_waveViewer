var url = "/wav/2mix.wav";

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


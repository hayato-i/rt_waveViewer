// Vender prefixes
// WebRTC
window.navigator.getUserMedia = navigator.getUserMedia       ||
                                navigator.webkitGetUserMedia ||
                                navigator.mozGetUserMedia;

// WebAudio
window.AudioContext = window.AudioContext       || 
                      window.webkitAudioContext;

var url = "/wav/2mix.wav";

var getAudioBuffer = function(url, fn) {  
  var req = new XMLHttpRequest();
  // array buffer を指定
  req.responseType = 'arraybuffer';

  req.onreadystatechange = function() {
    if (req.readyState === 4) {
      if (req.status === 0 || req.status === 200) {
        // array buffer を audio buffer に変換
        context.decodeAudioData(req.response, function(buffer) {
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
        panner.panningModel = 'HRTF';
        panner.distanceModel = 'inverse';
        panner.refDistance = REF_DISTANCE;
        panner.maxDistance = MAX_DISTANCE;
        panner.rolloffFactor = ROLL_OFF_FACTOR;
        panner.coneInnerAngle = INNER_ANGLE;
        panner.coneOuterAngle = OUTER_ANGLE;
        panner.coneOuterGain = OUTER_GAIN;

        forceDirection(panner);

        // 今回リスナーの位置は動かさないものとするため素宣言
        var listener = context.listener;
        console.log(listener);
        // buffer取得
        getAudioBuffer(url, function(buffer){   
            var src = context.createBufferSource();
            var gain = context.createGain();
            gain.gain = 2.0;
            src.buffer = buffer;
            src.connect(gain);
            gain.connect(panner);
            panner.connect(destination);
            //analyser.connect(destination);
            // 再生
            src.start(0);
        });
        
}
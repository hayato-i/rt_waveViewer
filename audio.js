// Vender prefixes
// WebRTC
window.navigator.getUserMedia = navigator.getUserMedia       ||
                                navigator.webkitGetUserMedia ||
                                navigator.mozGetUserMedia;

// WebAudio
window.AudioContext = window.AudioContext       || 
                      window.webkitAudioContext;

// canvasサイズの定義
const WIDTH = 1000;
const HEIGHT = 1000;

var url = "/wav/2mix.wav";

// AudioContext-------------------------------------------------------------------------------
var context = new AudioContext();
var destination = context.destination;

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
        // Class化の必要性あり
        var panner = context.createPanner();
        panner.panningModel = 'HRTF';
        panner.distanceModel = 'inverse';
        panner.refDistance = 1;
        panner.maxDistance = 10000;
        panner.rolloffFactor = 1;
        panner.coneInnerAngle = INNER_ANGLE;
        panner.coneOuterAngle = OUTER_ANGLE;
        panner.coneOuterGain = OUTER_GAIN;

        if(panner.orientationX){
            panner.orientationX.value = 0;
            panner.orientationY.value = 0;
            panner.orientationZ.value = 1;
        }else{
            panner.setOrientation(1,0,0);
        }

        if(panner.positionX) {
            panner.positionX.value = sPosX;
            panner.positionY.value = sPosY;
            panner.positionZ.value = sPosZ;
        } else {
            panner.setPosition(sPosX,sPosY,sPosZ);
        }

        // 今回リスナーの位置は動かさないものとするため素宣言
        var listener = context.listener;

        if(listener.orientationX){
            listener.forwordX.value = 0;
            listener.forwordY.value = 0;
            listener.forwordZ.value = -1;
        }else{
            listener.setOrientation(0,0,-1,0,1,0);
        }

        if(listener.orientationX){
            listener.upX.value = 0;
            listener.upY.value = 1;
            listener.upZ.value = 0;
        }else{
            listener.setOrientation(0,0,-1,0,1,0);
        }

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
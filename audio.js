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

var xPos = 0;
var yPos = 0;
var zPos = -10;

// analyser用パラメータ
const FFTSIZE = 2048;
const SMOOTHING = 0.7;

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

function callAudio(buffer){
        
        // PannerNode生成
        var panner = context.createPanner();
        panner.panningModel = 'HRTF';
        panner.distanceModel = 'inverse';
        panner.refDistance = 1;
        panner.maxDistance = 10000;
        panner.rolloffFactor = 1;
        panner.coneInnerAngle = 0;
        panner.coneOuterAngle = 360;
        panner.coneOuterGain = 0;

        if(panner.orientationX){
            panner.orientationX.value = 0;
            panner.orientationY.value = 0;
            panner.orientationZ.value = 1;
        }else{
            panner.setOrientation(1,0,0);
        }

        if(panner.positionX) {
            panner.positionX.value = xPos;
            panner.positionY.value = yPos;
            panner.positionZ.value = zPos;
        } else {
            panner.setPosition(xPos,yPos,zPos);
        }

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


        // アナライザー生成-----------------------------------------------------------------------------
        var analyser = context.createAnalyser();
        
        // 離散フーリエ変換精度
        analyser.smoothingTimeConstant = SMOOTHING;
        analyser.fftSize = FFTSIZE;                
        
        // 最大音量、最小音量の設定
        analyser.minDecibels = -140;
        analyser.maxDecibels = 0;

        // Canvas--------------------------------------------------------------------------------------
        var canvas1 = document.getElementById('wave');
        var drawC1 = canvas1.getContext("2d");

        var canvas2 = document.getElementById('freq');
        var drawC2 = canvas2.getContext("2d");

        // Canvas サイズ
        canvas1.width = WIDTH;
        canvas1.height = HEIGHT;
        canvas2.width = WIDTH;
        canvas2.height = HEIGHT;

        // buffer取得
        getAudioBuffer(url, function(buffer){   
            var src = context.createBufferSource();
            src.buffer = buffer;
            // アナライザーノードを出力ノードに接続  
            src.connect(panner);
            panner.connect(destination);
            //analyser.connect(destination);
            // 再生
            src.start(0);
        });
        
}
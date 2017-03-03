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
              src.start(0);
            }, false);
        });
        
}

function freq(){
    
    hidContext.clearRect(0, 0, hidc.width, hidc.height);
    var afbc = analyser.frequencyBinCount;
    var freqs = new Uint8Array(afbc);
    analyser.getByteFrequencyData(freqs); // Frequency Data

    for (var i = 0; i < afbc; i++) {
        var value = freqs[i];
        var percent = value / 256;
        // 音量（振幅）
        var width = hidc.width * percent;
        // 幅から周波数の幅を変更(FFTSIZEに依存)
        var barHeight = hidc.height/afbc;
        // 高さ始点
        var offset = hidc.width - width - 1;
        // 色かな… 
        var hue = i/analyser.frequencyBinCount * 360;
        hidContext.fillStyle = 'hsl(' + hue + ', 100%, 60%)';
        hidContext.fillRect(offset ,i * barHeight, width, barHeight);
        //freqDataArray = hidContext.getImageData(0, 0, hidc.width, hidc.height);
    }
}
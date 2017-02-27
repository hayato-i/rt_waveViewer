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
        var listener = audioCont.listener;
        console.log(listener);
        // buffer取得
        getAudioBuffer(url, function(buffer){   
            var src = audioCont.createBufferSource();
            var gain = audioCont.createGain();
            gain.gain = 2.0;
            src.buffer = buffer;
            src.connect(analyser);
            analyser.connect(gain);
            gain.connect(panner);
            panner.connect(destination);
            // 再生
            src.start(0);
        });
        
}

function freq(){
    // analyser 設定
    analyser.smoothingTimeConstant = SMOOTHING;
    analyser.fftSize = FFTSIZE;
    analyser.minDecibels = -140;
    analyser.maxDecibels = -30;

    var afbc = analyser.frequencyBinCount;
    var freqs = new Uint8Array(afbc);
    analyser.getByteFrequencyData(freqs); // Frequency Data

    for (var i = 0; i < afbc; i++) {
        var value = freqs[i];
        var percent = value / 256;
        // 音量（振幅）
        var height = hidc.height * percent;
        // 幅から周波数の幅を変更(FFTSIZEに依存)
        var barWidth = hidc.width/afbc;
        // 高さ始点
        var offset = hidc.height - height - 1;
        // 色かな… 
        var hue = i/analyser.frequencyBinCount * 360;
        hidContext.fillStyle = 'hsl(' + hue + ', 100%, 60%)';
        hidContext.fillRect(i * barWidth, offset, barWidth, height);
        freqDataArray = hidContext.getImageData(0, 0, hidc.width, hidc.height);
    }

}
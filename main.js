// Vender prefixes
// WebRTC
window.navigator.getUserMedia = navigator.getUserMedia       ||
                                navigator.webkitGetUserMedia ||
                                navigator.mozGetUserMedia;

// WebAudio
window.AudioContext = window.AudioContext       || 
                      window.webkitAudioContext;

// canvasサイズの定義
const WIDTH = 480;
const HEIGHT = 256;

// いろいろスムーズに描画するための設定
const FFTSIZE = 512;
const SMOOTHING = 0.9;
(function(){

    window.addEventListener('load', function(){
        // イベント駆動　表示変更系

        // AudioContext-------------------------------------------------------------------------------
        let context = new AudioContext();
        let destination = context.destination;

        // アナライザー生成-----------------------------------------------------------------------------
        let analyser = context.createAnalyser();
        
        // 離散フーリエ変換精度
        analyser.smoothingTimeConstant = SMOOTHING;
        analyser.fftSize = FFTSIZE;                
        
        // 最大音量、最小音量の設定
        analyser.minDecibels = -140;
        analyser.maxDecibels = -30;

        // Canvas--------------------------------------------------------------------------------------
        let canvas1 = document.getElementById('wave');
        let drawC1 = canvas1.getContext("2d");

        let canvas2 = document.getElementById('freq');
        let drawC2 = canvas2.getContext("2d");

        // Canvas サイズ
        canvas1.width = WIDTH;
        canvas1.height = HEIGHT;
        canvas2.width = WIDTH;
        canvas2.height = HEIGHT;
        
        // マイクにアクセス
        let mic = {audio:true, camera:false};

        /**
        * @param {MediaStream|LocalMediaStream} stream
        */
        // マイク認識ができたら
        let successCallback = function(stream){

            // MediaStreamAudioSourceNodeのインスタンスを生成
            let source = context.createMediaStreamSource(stream);
            // ヴィジュアライザ描画----------------------------------------------------------------------
            setInterval(function draw(){
                // マイク音声をアナライザーノードに接続
                source.connect(analyser);

                // アナライザーノードを出力ノードに接続  
                analyser.connect(destination);  

                // Canvasクリア
                drawC1.clearRect(0, 0, canvas1.width, canvas1.height);
                drawC2.clearRect(0, 0, canvas2.width, canvas2.height);
                
                // 音声波形と、周波数波形のデータ確保
                // frequencyBinCountはFFTSIZE/2 -> nyquist frequency
                let afbc = analyser.frequencyBinCount;
                let freqs = new Uint8Array(afbc); // 周波数データ
                let times = new Uint8Array(afbc); // 音声波形データ

                analyser.getByteFrequencyData(freqs); // Frequency Data
                analyser.getByteTimeDomainData(times); // Waveform Data
                let width = Math.floor(1/freqs.length, 10);


                // 音声波形描画--------------------------------------------------------------------------
                for (let i = 0; i < afbc; i++) {
                    let value = times[i];
                    let percent = value / 256;
                    let height = HEIGHT * percent;
                    let offset = HEIGHT - height - 1;
                    let barWidth = WIDTH/afbc;
                    drawC1.fillStyle = 'white';
                    drawC1.fillRect(i * barWidth, offset, 1, 2);
                }

                // 音声波形用グリッド線
                var textYs = ['1.00', '0.50', '0.00','-0.50' ,'-1.00'];
                for (var i = 0, len = textYs.length; i < len; i++) {
                    var text = textYs[i];
                    var gy   = ((1 - parseFloat(text)) / 2) * canvas1.height;
                    drawC1.fillStyle = '#22FF22';
                    // Draw grid (Y)
                    drawC1.fillRect(0, gy, canvas1.width, 1);
                    // Draw text (Y)
                    drawC1.fillText(text, 0, gy);
                }

                let degree = 45;
                // 周波数データ描画----------------------------------------------------------------------
                for (let i = 0; i < afbc; i++) {
                    let value = freqs[i];
                    let percent = value / 256;
                    // 音量（振幅）
                    let height = HEIGHT * percent;
                    // 幅から周波数の幅を変更(FFTSIZEに依存)
                    let barWidth = WIDTH/afbc;
                    // 高さ始点
                    let offset = HEIGHT - height - 1;
                    // 色かな…？  
                    let hue = i/analyser.frequencyBinCount * 360;
                    drawC2.fillStyle = 'hsl(' + hue + ', 100%, 60%)';
                    drawC2.fillRect(i * barWidth, offset, barWidth, height);
                }
            },1000/60);

        }

        /**
        * @param {NavigatorUserMediaError|MediaStreamError} error
        */
        // マイクが無いよ！
        let  errorCallback = function(error) {
            alert("No mic!!");
        };
    
        navigator.getUserMedia(mic, successCallback, errorCallback);
    },false);

})();
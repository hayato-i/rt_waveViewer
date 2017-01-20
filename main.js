// Vender prefixes
// WebRTC
window.navigator.getUserMedia = navigator.getUserMedia       ||
                                navigator.webkitGetUserMedia ||
                                navigator.mozGetUserMedia;

// WebAudio
window.AudioContext = window.AudioContext       || 
                      window.webkitAudioContext;

// canvasサイズの定義
const WIDTH = 640;
const HEIGHT = 360;

// いろいろスムーズに描画するための設定　ちゃんと把握してね
const FFTSIZE = 2048;
const SMOOTHING = 0.8;

(function(){

    window.addEventListener('load', function(){
        // AudioContext-------------------------------------------------------------------------------
        let context = new AudioContext();
        
        // アナライザー生成-----------------------------------------------------------------------------
        let analyser = context.createAnalyser();
        
        // 離散フーリエ変換精度
        analyser.smoothingTimeConstant = SMOOTHING;
        analyser.fftSize = FFTSIZE;                
        
        // 最大音量、最小音量の設定
        analyser.minDecibels = -140;
        analyser.maxDecibels = 0;

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

            // マイク音声をアナライザーノードに接続
            source.connect(analyser);

            // ヴィジュアライザ描画----------------------------------------------------------------------
            setInterval(function draw(){
                
                drawC1.clearRect(0, 0, canvas1.width, canvas1.height);
                drawC2.clearRect(0, 0, canvas2.width, canvas2.height);
                /*

                */
                // 音声波形と、周波数波形のデータ確保
                let freqs = new Uint8Array(analyser.frequencyBinCount); // 周波数データ
                let times = new Uint8Array(analyser.frequencyBinCount); // 音声波形データ

                analyser.getByteFrequencyData(freqs); // Frequency Data
                analyser.getByteTimeDomainData(times); // Waveform Data

                let width = Math.floor(1/freqs.length, 10);

                // 周波数データ描画
                for (let i = 0; i < analyser.frequencyBinCount; i++) {
                    let value = freqs[i];
                    let percent = value / 256;
                    let height = HEIGHT * percent;
                    let offset = HEIGHT - height - 1;
                    let barWidth = WIDTH/analyser.frequencyBinCount;
                    let hue = i/analyser.frequencyBinCount * 360;
                    drawC2.fillStyle = 'hsl(' + hue + ', 100%, 50%)';
                    drawC2.fillRect(i * barWidth, offset, barWidth, height);
                }

                // 音声波形描画
                for (let i = 0; i < analyser.frequencyBinCount; i++) {
                    let value = times[i];
                    let percent = value / 256;
                    let height = HEIGHT * percent;
                    let offset = HEIGHT - height - 1;
                    let barWidth = WIDTH/analyser.frequencyBinCount;
                    drawC1.fillStyle = 'white';
                    drawC1.fillRect(i * barWidth, offset, 1, 2);
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
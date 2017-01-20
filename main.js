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
        // AudioContext生成
        let context = new AudioContext();
    
        // アナライザー生成
        let analyser = context.createAnalyser();
        
        // 離散フーリエ変換精度
        analyser.smoothingTimeConstant = SMOOTHING;
        analyser.fftSize = FFTSIZE;                

        // Canvas初期化
        let canvas = document.getElementById('analyser');
        let drawContext = canvas.getContext("2d");

        // Canvas サイズ
        canvas.width = WIDTH;
        canvas.height = HEIGHT;
    
        // 最大音量、最小音量の設定
        analyser.minDecibels = -140;
        analyser.maxDecibels = 0;

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

            // 出力ノードににマイク音声ノードを接続
            analyser.connect(context.destination);

            // ヴィジュアライザ描画
            setInterval(function draw(){
                
                drawContext.clearRect(0, 0, canvas.width, canvas.height);
                
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
                    drawContext.fillStyle = 'hsl(' + hue + ', 100%, 50%)';
                    drawContext.fillRect(i * barWidth, offset, barWidth, height);
                }
                
                // 音声波形描画
                for (let i = 0; i < analyser.frequencyBinCount; i++) {
                    let value = times[i];
                    let percent = value / 256;
                    let height = HEIGHT * percent;
                    let offset = HEIGHT - height - 1;
                    let barWidth = WIDTH/analyser.frequencyBinCount;
                    drawContext.fillStyle = 'white';
                    drawContext.fillRect(i * barWidth, offset, 1, 2);
                }

            },1000/60);

        }

        /**
        * @param {NavigatorUserMediaError|MediaStreamError} error
        */
        // マイクが無いよ！
        let  errorCallback = function(error) {
            console.log("No mic!!");
        };
    
        navigator.getUserMedia(mic, successCallback, errorCallback);
    },false);

})();
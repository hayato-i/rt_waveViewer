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
const HEIGHT = 240;

// いろいろスムーズに描画するための設定　ちゃんと把握してね
const FFTSIZE = 1024;
const SMOOTHING = 0.7;

// Effect系のフラグ
let DELAY_ON = false;
let DELAY_TIME = 0.0;
let FEEDBACK_GAIN = 0.0;
let DRY_GAIN = 1.0;
let WET_GAIN = 0.0;

(function(){

    window.addEventListener('load', function(){
        // イベント駆動　表示変更系
        let delay_b = document.getElementById('delay_b');
        delay_b.addEventListener('click',function(){
            if(DELAY_ON === false){
                DELAY_ON = true;
                DRY_GAIN = 0.9;
                WET_GAIN = 0.5;
                DELAY_TIME = delayTime.value;
                FEEDBACK_GAIN = 0.5;
                delay_b.area1.value = "./img/delayOff.png";
            }
            else if(DELAY_ON === true){
                DELAY_ON = false;
                DRY_GAIN = 1.0;
                WET_GAIN = 0.0;
                DELAY_TIME = 0.0;
                FEEDBACK_GAIN = 0.0;
                delay_b.area1.src = "./img/delayOn.png";
            }
        },false);
        

        // AudioContext-------------------------------------------------------------------------------
        let context = new AudioContext();
        let destination = context.destination;
        
        // Delayノード---------------------------------------------------------------------------------
        context.createDelay = context.createDelay || context.createDelayNode;
        context.createGain = context.createGain || context.createGainNode;
        
        let delay = context.createDelay();
        let dry = context.createGain();
        let wet = context.createGain();
        let feedback = context.createGain();


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

            // ヴィジュアライザ描画----------------------------------------------------------------------
            setInterval(function draw(){
                // マイク音声をアナライザーノードに接続
                source.connect(analyser);

                // ディレイノード設定、接続。美しくない。
                delay.delayTime.value = DELAY_TIME;
                dry.gain.value = DRY_GAIN;
                wet.gain.value = WET_GAIN;
                feedback.gain.value = FEEDBACK_GAIN;

                source.connect(dry);
                dry.connect(analyser);
                source.connect(delay);
                delay.connect(wet);
                wet.connect(analyser);

                delay.connect(feedback);
                feedback.connect(delay);

                // アナライザーノードを出力ノードに接続  
                analyser.connect(destination);  

                // Canvasクリア
                drawC1.clearRect(0, 0, canvas1.width, canvas1.height);
                drawC2.clearRect(0, 0, canvas2.width, canvas2.height);

                // 音声波形と、周波数波形のデータ確保
                let freqs = new Uint8Array(analyser.frequencyBinCount); // 周波数データ
                let times = new Uint8Array(analyser.frequencyBinCount); // 音声波形データ

                analyser.getByteFrequencyData(freqs); // Frequency Data
                analyser.getByteTimeDomainData(times); // Waveform Data

                let width = Math.floor(1/freqs.length, 10);

                // 音声波形描画--------------------------------------------------------------------------
                for (let i = 0; i < analyser.frequencyBinCount; i++) {
                    let value = times[i];
                    let percent = value / 256;
                    let height = HEIGHT * percent;
                    let offset = HEIGHT - height - 1;
                    let barWidth = WIDTH/analyser.frequencyBinCount;
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

                // 周波数データ描画----------------------------------------------------------------------
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
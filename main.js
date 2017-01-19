// Vender prefixes
// WebRTC
window.navigator.getUserMedia = navigator.getUserMedia       ||
                                navigator.webkitGetUserMedia ||
                                navigator.mozGetUserMedia;

// WebAudio
window.AudioContext = window.AudioContext       || 
                      window.webkitAudioContext;

// canvasサイズの定義
const WIDTH = 512;
const HEIGHT = 512;

(function(){

    window.addEventListener('load', function(){
        // AudioContext生成
        let context = new AudioContext();
    
        // アナライザー生成
        let analyser = context.createAnalyser();

        // 離散フーリエ変換精度
        analyser.fftSize = 1024;
    
        // Canvas初期化
        let cid = document.getElementById('analyser');
        let ctx = cid.getContext("2d");

        // グラデーション
        let gradbase = ctx.createLinearGradient(0, 0, 0, 256);
        gradbase.addColorStop(0, "rgb(20, 22, 20)");
        gradbase.addColorStop(1, "rgb(20,20,200)");

        let gradline = [];

        for(let i = 0; i < 512; ++i) {
            gradline[i] = ctx.createLinearGradient(0, 512 - i, 0, 512);
            let n = (i & 128) * 2;
            gradline[i].addColorStop(0, "rgb(255,0,0)");
            gradline[i].addColorStop(1, "rgb(255," + i + ",0)");
        }

        // マイクにアクセス
        let mic = {audio:true, camera:false};

        /**
        * @param {MediaStream|LocalMediaStream} stream
        */

        let successCallback = function(stream){

            // MediaStreamAudioSourceNodeのインスタンスを生成
            let source = context.createMediaStreamSource(stream);

            // マイク音声をアナライザーノードに接続
            source.connect(analyser);

            // 出力ノードににマイク音声ノードを接続
            analyser.connect(context.destination);

            setInterval(function draw(){
                ctx.fillStyle = gradbase;
                ctx.fillRect(0, 0, 511, 511);
                let audioAnalyseData = new Uint8Array(analyser.frequencyBinCount);
                analyser.getByteTimeDomainData(audioAnalyseData); //Waveform Data
                for(var i = 0; i < 512; ++i) {
                    ctx.fillStyle = gradline[audioAnalyseData[i]];
                    ctx.fillRect(i, 512 - audioAnalyseData[i], 1, audioAnalyseData[i]);
                }
            },100);

        }

        /**
        * @param {NavigatorUserMediaError|MediaStreamError} error
        */
        let  errorCallback = function(error) {
            console.log("No mic!!");
            setInterval(function draw(){
                ctx.fillStyle = gradbase;
                ctx.fillRect(0, 0, 511, 511);
                let audioAnalyseData = new Uint8Array(analyser.frequencyBinCount);
                analyser.getByteTimeDomainData(audioAnalyseData); //Waveform Data
                for(var i = 0; i < 512; ++i) {
                    ctx.fillStyle = gradline[audioAnalyseData[i]];
                    ctx.fillRect(i, 512 - audioAnalyseData[i], 1, audioAnalyseData[i]);
                }
            },100);
        };
    
        navigator.getUserMedia(mic, successCallback, errorCallback);
    },false);

})();
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

window.onload = function(){

    // AudioContext生成
    let context = new AudioContext();
    
    // アナライザー生成
    let analyser = context.createAnalyser();

    // 離散フーリエ変換精度
    analyser.fftSize = 1024;
    
    // Canvas初期化
    let cid = document.getElementById('analyser');
    let canvas = cid.getContext("2d");

    // グラデーション
    let gradbase = canvas.createLinearGradient(0, 0, 0, 256);
    gradbase.addColorStop(0, "rgb(20, 22, 20)");
    gradbase.addColorStop(1, "rgb(20,20,200)");

    let gradline = [];

    for(let i = 0; i < 256; ++i) {
        gradline[i] = canvas.createLinearGradient(0, 256 - i, 0, 256);
        let n = (i & 64) * 2;
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

        setInterval(function(){
            canvas.fillStyle = gradbase;
            canvas.fillRect(0, 0, 255, 255);
            let audioAnalyseData = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteTimeDomainData(audioAnalyseData); //Waveform Data
            for(var i = 0; i < 256; ++i) {
                canvas.fillStyle = gradline[audioAnalyseData[i]];
                canvas.fillRect(i, 256 - audioAnalyseData[i], 1, audioAnalyseData[i]);
            }
        },100);

    }

    /**
    * @param {NavigatorUserMediaError|MediaStreamError} error
    */
    let  errorCallback = function(error) {
        console.log("No mic!!");
    };
    
    navigator.getUserMedia(mic, successCallback, errorCallback);

}();
// Vender prefixes
// WebRTC
window.navigator.getUserMedia = navigator.getUserMedia       ||
                                navigator.webkitGetUserMedia ||
                                navigator.mozGetUserMedia;

// WebAudio
window.AudioContext = window.AudioContext       || 
                      window.webkitAudioContext;

(function(){

    // AudioContext生成
    let context = new AudioContext();
    
    // アナライザー生成
    let analyzer = context.createAnalyser();

    analyzer.fftSize = 2048;

    // マイクにアクセス
    let mic = {audio:true, camera:false};

    /**
    * @param {MediaStream|LocalMediaStream} stream
    */
    let successCallback = function(stream){
        // MediaStreamAudioSourceNodeのインスタンスを生成
        let source = context.createMediaStreamSource(stream);

        // マイク音声をアナライザーノードに接続
        source.connect(analyzer);

        // 出力ノードににマイク音声ノードを接続
        analyzer.connect(context.destination);
    }

    /**
    * @param {NavigatorUserMediaError|MediaStreamError} error
    */
    let  errorCallback = function(error) {
        // do something ....
    };
    
    navigator.getUserMedia(mic, successCallback, errorCallback);

})();
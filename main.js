window.onload = function(){
    // vender prefixes
    navigator.getUserMedia = navigator.getUserMedia       ||
                             navigator.webkitGetUserMedia ||
                             navigator.mozGetUserMedia;


    // マイクにアクセス
    let mic = {audio:ture};

    /**
    * @param {MediaStream|LocalMediaStream} stream
    */
    let successCallback = function(stream){

    }

    /**
    * @param {NavigatorUserMediaError|MediaStreamError} error
    */
    var errorCallback = function(error) {
    // do something ....
    };
    
    navigator.getUserMedia(mic, successCallback, errorCallback);


}
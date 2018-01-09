'use strict';

function trace(arg) {
    var now = (window.performance.now() / 1000).toFixed(3);
    console.log(now + ': ', arg);
}

// UI Element Value
var output_offerDesc = document.querySelector('textarea#output_offerDesc');
var input_answerDesc = document.querySelector('textarea#input_answerDesc');

var vid1 = document.querySelector('#vid1');
var vid2 = document.querySelector('#vid2');

var btn_start = document.querySelector('#btn_start');
var btn_finalOffer = document.querySelector('#btn_finalOffer');
var btn_receiveAnswer = document.querySelector('#btn_receiveAnswer');

btn_start.addEventListener('click', onStart);
btn_finalOffer.addEventListener('click', onOffer);
btn_receiveAnswer.addEventListener('click', onReceiveAnswer);

var snapshotButton = document.querySelector('button#snapshot');
var toggleMirrorButton = document.querySelector('button#toggle-mirror');
var filterSelect = document.querySelector('select#filter');

var canvas = window.canvas = document.querySelector('canvas');
canvas.width = 480;
canvas.height = 360;

/*---------caller 에서도 desktop화면 보이도록------------*/
var btn_desktop = document.querySelector('#btn_desktop');
var btn_toggle_video = document.querySelector('#btn_toggle_video');
var btn_toggle_sound = document.querySelector('#btn_toggle_sound');
var btn_toggle_mic = document.querySelector('#btn_toggle_mic');

btn_desktop.addEventListener('click', onToggleDesktop);
btn_toggle_video.addEventListener('click', onToggleVideo);
btn_toggle_sound.addEventListener('click', onToggleSound);
btn_toggle_mic.addEventListener('click', onToggleMic);

snapshotButton.onclick = function() {
    canvas.className = filterSelect.value;
    canvas.getContext('2d').drawImage(vid1, 0, 0, canvas.width, canvas.height);
};

filterSelect.onchange = function() {
    vid1.className = filterSelect.value;
};

var vidClassName = '';
toggleMirrorButton.onclick = function() {
    if (!vidClassName)
        vidClassName = 'mirror';
    else 
        vidClassName = '';
    vid1.className = vidClassName;
};

// ---------------------------------------------------------------------------------

// Value
var local_peer = null;
var localstream = null;
// ---------------------------------------------------------------------------------
function cbGotStream(stream) {
    trace('Received local stream');
    localstream = stream;
    vid1.srcObject = stream;
}

navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true
    })
    .then(cbGotStream)
    .catch(function (e) {
        alert('getUserMedia() error: ' + e);
    });

function cbGotRemoteStream(evt) {
    trace('## Received remote stream try');
    if (vid2.srcObject !== evt.streams[0]) {
        vid2.srcObject = evt.streams[0];
        trace('## Received remote stream success');
    }
}

function onStart() {
    var cfg = {
        iceTransportPolicy: "all", // set to "relay" to force TURN.
        iceServers: [
        ]
    };
    // cfg.iceServers.push({urls: "stun:stun.l.google.com:19302"});
    local_peer = new RTCPeerConnection(cfg);
    local_peer.onicecandidate = function (evt) {
        cbIceCandidate(local_peer, evt);
    };
    local_peer.ontrack = cbGotRemoteStream;

    localstream.getTracks().forEach(
        function (track) {
            local_peer.addTrack(
                track,
                localstream
            );
        }
    );

    trace('## start success = create RTCPeerConnection and set callback ');
}

function onOffer() {
    var offerOptions = {
        offerToReceiveAudio: 1,
        offerToReceiveVideo: 1
    };

    local_peer.createOffer(
        offerOptions
    ).then(
        cbCreateOfferSuccess,
        cbCreateOfferError
    );

    trace('## createOffer success');
}

function receiveAnswer(sdpString) {
    trace('receiveAnswer');
    var descObject = {
        type: 'pranswer',
        sdp: sdpString
    };
    local_peer.setRemoteDescription(descObject);
}

function onReceiveAnswer() {
    var sdpString = input_answerDesc.value;
    receiveAnswer(sdpString);

    trace('## receiveAnswer success');
}

function cbCreateOfferError(error) {
    trace('Failed to create session description: ' + error.toString());
    stop();
}

function cbCreateOfferSuccess(desc) {
    console.info(desc);

    local_peer.setLocalDescription(desc).then(
        cbSetLocalDescriptionSuccess,
        cbSetLocalDescriptionError
    );
}
function cbSetLocalDescriptionSuccess() {
    trace('localDescription success.');
}
function cbSetLocalDescriptionError(error) {
    trace('Failed to set setLocalDescription: ' + error.toString());
    stop();
}

function stop() {
    if (local_peer != null)
        local_peer.close();
    local_peer = null;
}

function cbIceCandidate(pc, event) {
    if (event.candidate)
        cbCheckIceCandidateAdded(event.candidate);
    else
        cbCheckIceCandidateCompleted(pc.localDescription);
}
function cbCheckIceCandidateAdded(candidateObject) {
    trace('cbCheckIceCandidateAdded');
    // ICE candidate 가 추가되면 바로바로 연결 시도를 해 볼 수 있다. 
    // 이 예제는 추가가 완료되면 sdp 를 출력하기 때문에 여기서 아무것도 하지 않는다.
}

function cbCheckIceCandidateCompleted(descObject) {
    trace('cbCheckIceCandidateCompleted');
    output_offerDesc.value = descObject.sdp;
}

/*---------caller 에서도 desktop화면 보이도록------------*/
function cbGotStream(stream) {
    trace('Received local stream');
    window.stream = stream;
    vid1.srcObject = stream;
    localstream = stream;

    return navigator.mediaDevices.enumerateDevices();
}
function gotDevices(deviceInfos) {
    // Handles being called several times to update labels. Preserve values.
    var values = selectors.map(function(select) {
      return select.value;
    });
    selectors.forEach(function(select) {
      while (select.firstChild) {
        select.removeChild(select.firstChild);
      }
    });
    for (var i = 0; i !== deviceInfos.length; ++i) {
      var deviceInfo = deviceInfos[i];
      var option = document.createElement('option');
      option.value = deviceInfo.deviceId;
      if (deviceInfo.kind === 'audioinput') {
        option.text = deviceInfo.label ||
            'microphone ' + (audioInputSelect.length + 1);
        audioInputSelect.appendChild(option);
      } else if (deviceInfo.kind === 'audiooutput') {
        option.text = deviceInfo.label || 'speaker ' +
            (audioOutputSelect.length + 1);
        audioOutputSelect.appendChild(option);
      } else if (deviceInfo.kind === 'videoinput') {
        option.text = deviceInfo.label || 'camera ' + (videoSelect.length + 1);
        videoSelect.appendChild(option);
      } else {
        console.log('Some other kind of source/device: ', deviceInfo);
      }
    }
    selectors.forEach(function(select, selectorIndex) {
      if (Array.prototype.slice.call(select.childNodes).some(function(n) {
        return n.value === values[selectorIndex];
      })) {
        select.value = values[selectorIndex];
      }
    });
}
function handleError(error) {
    console.log('navigator.getUserMedia error: ', error);
}
navigator.mediaDevices.enumerateDevices().then(gotDevices).catch(handleError);
function startDesktop() {
    if (window.stream) {
        window.stream.getTracks().forEach(function(track) {
          track.stop();
        });
    }

    getScreenId((error, sourceId, screenConstraints) => {
    if (error === 'not-installed') return alert('The extension is not installed');
    if (error === 'permission-denied') return alert('Permission is denied.');
    if (error === 'not-chrome') return alert('Please use chrome.');

    navigator.mediaDevices.getUserMedia(screenConstraints)
        .then(stream => {
            window.stream = stream;
            vid1.srcObject = stream;
            localstream = stream;
        })
        .catch(err => {
            console.log(err);
        });
    });
}
function start() {
    if (window.stream) {
      window.stream.getTracks().forEach(function(track) {
        track.stop();
      });
    }
    var audioSource = audioInputSelect.value;
    var videoSource = videoSelect.value;
    var constraints = {
      audio: {deviceId: audioSource ? {exact: audioSource} : undefined},
      video: {deviceId: videoSource ? {exact: videoSource} : undefined}
    };

    navigator.mediaDevices.getUserMedia(constraints).
        then(cbGotStream).then(gotDevices).catch(handleError);
}

audioInputSelect.onchange = start;
audioOutputSelect.onchange = changeAudioDestination;
videoSelect.onchange = start;

start();
/*---------------------------------------------------------- */

var isDesktop = false;
function onToggleDesktop(){

    if (isDesktop == false) {
        startDesktop();
    } else {
        start();
    }
    isDesktop = !isDesktop;    
}

function onToggleVideo() {
    if (localstream) {
        var items = localstream.getVideoTracks();
        if (items && items.length > 0)
          items[0].enabled = !items[0].enabled;
    }
  
}
function onToggleSound() {
    if (remotestream) {
        var items = remotestream.getAudioTracks();
        if (items && items.length > 0)
          items[0].enabled = items[0].enabled;
    }
}
function onToggleMic() {
    if (localstream) {
        var items = localstream.getAudioTracks();
        if (items && items.length > 0)
          items[0].enabled = items[0].enabled;
    }
}
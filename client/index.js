import { io } from 'socket.io-client';

let socket;
let peer;
let remoteSocket;
let type;
let roomid;

document.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("start-btn");
  startBtn.addEventListener("click", startApp);
});

function startApp() {
  document.getElementById("home").style.display = "none";

  document.getElementById("app").innerHTML = `
    <div class="modal">
      <span>Waiting For Someone...</span>
    </div>

    <div class="video-holder">
      <video autoplay muted playsinline id="my-video"></video>
      <video autoplay playsinline id="video"></video>
    </div>

    <div class="chat-holder">
      <div class="wrapper"></div>
      <div class="input">
        <input type="text" placeholder="Type message..." />
        <button id="send">Send</button>
      </div>
    </div>
  `;

  initSocket();
}

function initSocket() {
  const myVideo = document.getElementById('my-video');
  const strangerVideo = document.getElementById('video');
  const button = document.getElementById('send');
  const inputBox = document.querySelector('input');

  socket = io('/');

  socket.on("connect", () => {
    console.log("Connected:", socket.id);

    socket.emit('start', (person) => {
      type = person;
    });
  });

  socket.on('remote-socket', async (id) => {
    remoteSocket = id;

    document.querySelector('.modal').style.display = 'none';

    // ✅ FINAL FIX: STUN + TURN
    peer = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        {
          urls: "turn:openrelay.metered.ca:80",
          username: "openrelayproject",
          credential: "openrelayproject"
        }
      ]
    });

    peer.onnegotiationneeded = async () => {
      if (type === 'p1') {
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        socket.emit('sdp:send', { sdp: peer.localDescription });
      }
    };

    peer.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit('ice:send', { candidate: e.candidate });
      }
    };

    // ✅ Start camera BEFORE negotiation (important)
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });

    myVideo.srcObject = stream;

    stream.getTracks().forEach(track => {
      peer.addTrack(track, stream);
    });

    peer.ontrack = (e) => {
      console.log("Received remote stream");
      strangerVideo.srcObject = e.streams[0];
    };
  });

  socket.on('sdp:reply', async ({ sdp }) => {
    await peer.setRemoteDescription(new RTCSessionDescription(sdp));

    if (type === 'p2') {
      const ans = await peer.createAnswer();
      await peer.setLocalDescription(ans);
      socket.emit('sdp:send', { sdp: peer.localDescription });
    }
  });

  socket.on('ice:reply', async ({ candidate }) => {
    if (candidate) {
      await peer.addIceCandidate(candidate);
    }
  });

  socket.on('roomid', id => roomid = id);

  // ✅ SEND MESSAGE
  function sendMessage() {
    const input = inputBox.value.trim();
    if (!input) return;

    socket.emit('send-message', input, type, roomid);

    document.querySelector('.wrapper').innerHTML += `
      <div><b>You:</b> ${input}</div>
    `;

    inputBox.value = '';
  }

  button.onclick = sendMessage;

  // ✅ ENTER KEY SUPPORT
  inputBox.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
  });

  socket.on('get-message', (input) => {
    document.querySelector('.wrapper').innerHTML += `
      <div><b>Stranger:</b> ${input}</div>
    `;
  });
}

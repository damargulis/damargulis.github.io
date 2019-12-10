let nonceLoader;
let managerPromise;

function init() {
  document.getElementById('generate-nonce').addEventListener('click', generateNonce);
  nonceLoader = new goog.pal.NonceLoader();
}

function generateNonce() {
  console.log("GENERATING:");
  const request = new goog.pal.NonceRequest();
  request.adWillAutoPlay = true;
  request.adWillPlayMuted= true;
  request.continuousPlayback = false;
  request.descriptionUrl = 'https://example.com';
  request.iconsSupported = true;
  request.playerType = 'Sample player type';
  request.playerVersion = '1.0';
  request.ppid = 'Sample PPID';
  request.videoHeight = 480;
  request.videoWidth = 640;

  console.log('loading manager');
  managerPromise = nonceLoader.loadNonceManager(request);
  managerPromise.then((manager) => {
    console.log('loaded');
    console.log('Nonce created: ' + manager.getNonce());
  }).catch((error) => {
    console.log("Error generating nonce: " + error);
  });
}

init();
generateNonce();

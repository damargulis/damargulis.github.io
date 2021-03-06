
const context = cast.framework.CastReceiverContext.getInstance();
const playerManager = context.getPlayerManager();
let playerElement;
let streamManager;
let daiCuePoints;

let adBreaksLoadedHandler = (event) => {
  daiCuePoints = event.getStreamData().cuepoints;
};

const makeDaiRequest = (contentId, custParams) => {
  return new Promise((resolve, reject) => {
    daiCuePoints = null;
    let daiRequestData = {};
    // TODO: get for a test stream
    daiRequestData.contentSourceId = null;
    daiRequestData.videoId = contentId;
    let streamRequest = new google.ima.dai.api.VODStreamRequest(daiRequstData);

    // TODO: need creds? not for test? maybe??
    streamRequest.needsCredentials = true;
    streamRequest.apiKey = null;

    let customParams = custParams;

    // need anything? prob not
    streamRequest.adTagParameters = {};

    streamManager.addEventListener(google.ima.dai.api.StreamEvent.Type.LOADED, (event) => {
      let streamData = event.getStreamData();
      resolve({url: streamData.url, daiCuePoints, subtitles: streamData.subtitles});
    });

    streamManager.requestStream(streamRequest);
  });
};

const vodRequest = (loadRequestData) => {
  playerElement = document.getElementById('player').getMediaElement();
  playerManager.addEventListener(cast.framework.events.EventType.TIME_UPDATE, (mediaElementEvent) => {
    console.log(`currentTime: ${mediaElementEvent.currentMediaTime}`);
  });
  playerElement.ontimeupdate = (event) => {
    console.log(`The currentTime attribute has been updated. Again. ${JSON.stringify(event)} playerElement.currentTime: ${playerElement.currentTime}`);
  };

  streamManager = new google.ima.dai.api.StreamManager(playerElement);
  streamManager.addEventListener(google.ima.dai.api.StreamEvent.Type.CUEPOINTS_CHANGED, adBreaksLoadedHandler, false);

  return makeDaiRequest(loadRquestData.media.contentId, loadRquestData.media.customData.custParams)
      .then((obj) => {
        loadRquestData.media.contentUrl = obj.url;
        let daiCuePoints = obj.daiCuePoints;
        loadRequestData.media.breaks = [];
        loadRequestData.media.breakClips = [];
        if (daiCuePoints) {
          let id = 0;
          let totalDuration = 0;
          for (let i = 0; i < daiCuePoints.length; i++) {
            let cuePoint = daiCuePoints[i];
            let uniq_id = id++;
            let bc = new cast.framework.messages.BreakClip("BC_" + uniq_id);
            bc.duration = cuePoint.end - cuePoint.start;

            let b = new cast.framework.messages.Break("B_" + uniq_id, [bc.id], cuePoint.start - totalDuration);
            b.isEmbedded = true;
            b.isWatched = cuePoint.played;
            b.duration = cuePoint.end - cuePoint.start;

            totalDuration += b.duration;

            loadRquestData.media.breakClips.push(bc);
            loadRequestData.media.breaks.push(b);
          }
          //broadcastBreakInfo(obj.daiCuePoints, 
        }
        return loadRquestData;
      });
};

export { vodRequest };

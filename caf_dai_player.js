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
    daiRequestData.contentSourceId = '19823';
    daiRequestData.videoId = 'ima-test';
    let streamRequest = new google.ima.dai.api.VODStreamRequest(daiRequestData);

    streamRequest.needsCredentials = false;

    let customParams = custParams;

    // need anything? prob not
    streamRequest.adTagParameters = {};

    streamManager.addEventListener(google.ima.dai.api.StreamEvent.Type.LOADED, (event) => {
      let streamData = event.getStreamData();
      resolve({url: streamData.url, daiCuePoints, subtitles: streamData.subtitles});
    });

    const events = Object.keys(google.ima.dai.api.StreamEvent.Type);
    console.log("ADDING LISTENERS FOR: " + events);
    streamManager.addEventListener(events, (event) => {
      console.log("EVENT: " + event.type);
    });

    streamManager.addEventListener(google.ima.dai.api.StreamEvent.Type.FIRST_QUARTILE, (event) => {
      console.log("GOT FIRST_QUARTILE");
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

  return makeDaiRequest(loadRequestData.media.contentId, loadRequestData.media.customData.custParams)
      .then((obj) => {
        loadRequestData.media.contentUrl = obj.url;
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

            loadRequestData.media.breakClips.push(bc);
            loadRequestData.media.breaks.push(b);
          }
          //broadcastBreakInfo(obj.daiCuePoints, 
        }
        return loadRequestData;
      });
}

const playerDataBinder = new cast.framework.ui.PlayerDataBinder((new cast.framework.ui.PlayerData()));
const controls = cast.framework.ui.Controls.getInstance();

let captionsEnabled = false;
let isLoading = true;

playerManager.addEventListener(cast.framework.events.EventType.PLAYING, (event) => {
  isLoading = false;
});

playerManager.setMessageInterceptor(cast.framework.messages.MessageType.LOAD, loadRequestData => {
  debugger;
  console.log("LOAD MESSAGE INTERCEPTED");
  if (loadRequestData.media && loadRequestData.media.customData) {
    if (loadRequestData.media.customData.startTime && loadRequestData.media.customData.startTime > 0) {
      console.log("setting from custom");
      loadRequestData.currentTime = loadRequestData.media.customData.startTime;
    } else if (!loadRequestData.currentTime || loadRequestData.currentTime < 0){
      console.log("setting to 0");
      loadRequestData.currentTime = 0;
    }
    delete loadRequestData.media.customData.startTime;
  }

  if (loadRequestData.media.streamType === cast.framework.messages.StreamType.LIVE) {
    console.log("LIVE REQUEST unhandled");
    return null;
  } else {
    return vodRequest(loadRequestData).then(function() {
      console.log("MADE VOD REQUEST");
      return loadRequestData;
    });
  }
});

context.start({queue: (new cast.framework.QueueBase())});


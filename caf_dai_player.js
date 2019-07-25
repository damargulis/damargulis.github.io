import * as VODStreamManager from './VODStreamManager.js';

const context = cast.framework.CastReceiverContext.getInstance();
const playerManager = context.getPlayerManager();
const playerDataBinder = new cast.framework.ui.PlayerDataBinder((new cast.framework.ui.PlayerData()));
const controls = cast.framework.ui.Controls.getInstance();

let captionsEnabled = false;
let isLoading = true;

playerManager.addEventListener(cast.framework.events.EventType.PLAYING, (event) => {
  isLoading = false;
});

playerManager.setMessageInterceptor(cast.framework.messages.MessageType.LOAD, loadRequestData => {
  console.log("LOAD MESSAGE INTERCEPTED");
  if (loadRquestData.media && loadRequestData.media.customData) {
    if (loadRequestData.media.customData.startTime && loadRequestData.media.customData.startTime > 0) {
      console.log("setting from custom");
      loadRequestData.currentTime = loadRequestData.media.customData.startTime;
    } else if (!loadRequestData.currentTime || loadRequestData.currentTime < 0){
      console.log("setting to 0");
      loadRquestData.currentTime = 0;
    }
    delete loadRquestData.media.customData.startTime;
  }

  if (loadRequestData.media.streamType === cast.framework.messages.StreamType.LIVE) {
    console.log("LIVE REQUEST unhandled");
    return null;
  } else {
    return VODStreamManager.vodRequest(loadRequestData).then(function() {
      console.log("MADE VOD REQUEST");
      return loadRquestData;
    });
  }
});

context.start({queue: (new cast.framework.QueueBase())});


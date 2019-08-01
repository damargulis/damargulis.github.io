/**
 * @fileoverview Description of this file.
 */

var BACKUP_STREAM =
  "http://storage.googleapis.com/testtopbox-public/video_content/bbb/" +
  "master.m3u8";

var TEST_ASSET_KEY = "sN_IYUG8STe1ZzhIIE_ksA";

var TEST_CONTENT_SOURCE_ID = "19823";
var TEST_VIDEO_ID = "ima-test";

var streamManager;
var hls = new Hls();
var videoElement;
var clickElement;

function initPlayer() {
  videoElement = document.getElementById('video');
  clickElement = document.getElementById('click');
  streamManager = new google.ima.dai.api.StreamManager(videoElement);
  streamManager.setClickElement(clickElement);
  streamManager.addEventListener(
      [google.ima.dai.api.StreamEvent.Type.LOADED,
      google.ima.dai.api.StreamEvent.Type.ERROR,
      google.ima.dai.api.StreamEvent.Type.AD_BREAK_STARTED,
      google.ima.dai.api.StreamEvent.Type.AD_BREAK_ENDED],
      onStreamEvent,
      false);

  hls.on(Hls.Events.FRAG_PARSING_METADATA, function(event, data) {
    if (streamManager && data) {
      data.samples.forEach(function(sample) {
        streamManager.processMetadata('ID3', sample.data, sample.pts);
      });
    }
  });

  requestVODStream(TEST_CONTENT_SOURCE_ID, TEST_VIDEO_ID, null);
  //for live streams
  //requestLiveStream(TEST_ASSET_KEY, null)
}

function requestVODStream(cmsId, videoId, apiKey) {
  var streamRequest = new google.ima.dai.api.VODStreamRequest();
  streamRequest.contentSourceId = cmsId;
  streamRequest.videoId = videoId;
  streamRequest.apiKey = apiKey;
  streamManager.requestStream(streamRequest);
}

function requestLiveStream(assetKey, apiKey) {
  var streamRequest = new google.ima.dai.api.LiveStreamRequest();
  streamRequest.assetKey = assetKey;
  streamRequest.apiKey = apiKey;
  streamManager.requestStream(streamRequest);
}

function onStreamEvent(e) {
  switch (e.type) {
    case google.ima.dai.api.StreamEvent.Type.LOADED:
      console.log("Stream loaded");
      loadUrl(e.getStreamData().url);
      break;
    case google.ima.dai.api.StreamEvent.Type.ERROR:
      console.log("Error loading stream, playing backup stream." + e);
      loadUrl(BACKUP_STREAM);
      break;
    case google.ima.dai.api.StreamEvent.Type.AD_BREAK_STARTED:
      console.log("Ad Break Started");
      videoElement.controls = false;
      clickElement.style.display = "block";
      break;
    case google.ima.dai.api.StreamEvent.Type.AD_BREAK_ENDED:
      console.log("Ad Break Ended");
      videoElement.controls = true;
      clickElement.style.display = 'none';
      break;
    default:
      break;
  }
}

function loadUrl(url) {
  console.log('Loading: ' + url);
  hls.loadSource(url);
  hls.attachMedia(videoElement);
  hls.on(Hls.Events.MANIFEST_PARSED, function() {
    console.log('Video Play');
    videoElement.play();
  });
}


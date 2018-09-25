/* ADS */

function Ads(application, videoPlayer) {
	this.application = application;
	this.videoPlayer = videoPlayer;

	this.adDisplayContainer = new google.ima.AdDisplayContainer(this.videoPlayer.adContainer);

	this.adsLoader = new google.ima.AdsLoader(this.adDisplayContainer);

	this.adsLoader.addEventListener(
		google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED,
		this.onAdsManagerLoaded,
		false,
		this,
	);

	this.adsManager = null;
}

Ads.prototype.initialUserAction = function() {
	this.adDisplayContainer.initialize();
}

Ads.prototype.requestAds = function() {
        console.log("Ads.requestAds");
	const adsRequest = new google.ima.AdsRequest();
        console.log("created ads request object");

	// adsRequest.adTagUrl = 'https://pubads.g.doubleclick.net/gampad/ads?sz=640x480&iu=/124319096/external/single_ad_samples&ciu_szs=300x250&impl=s&gdfp_req=1&env=vp&output=vast&unviewed_position_start=1&cust_params=deployment%3Ddevsite%26sample_ct%3Dlinear&correlator=';
	adsRequest.adTagUrl = 'https://raw.githubusercontent.com/InteractiveAdvertisingBureau/VAST_Samples/master/VAST%204.0%20Samples/Inline_Linear_Tag-test.xml';

        console.log("calling adsloaded.requestAds");
	this.adsLoader.requestAds(adsRequest);
        console.log('finsihed adsloader.requestAds');
}

Ads.prototype.contentEnded = function() {
	this.adsLoader.contentComplete();
}

Ads.prototype.onAdsManagerLoaded = function(adsManagerLoadedEvent) {
	const adsRenderingSettings = new google.ima.AdsRenderingSettings();

	this.adsManager = adsManagerLoadedEvent.getAdsManager(this.videoPlayer, adsRenderingSettings);
	this.adsManager.init(this.videoPlayer.width, this.videoPlayer.height, google.ima.ViewMode.NORMAL);
	this.adsManager.start();
	
	this.application.onAdManagerLoaded();
}

/* VIDEOPLAYER */

function VideoPlayer(adContainer) {
	this.adContainer = adContainer;
	this.width = 640;
	this.height = 360;
}

/* APPLICATION */

function Application(containerDiv) {
	this.containerDiv = containerDiv;

	// Create a video player connection
	this.videoPlayer = new VideoPlayer(this.containerDiv);

	// Create an IMA3 link
	this.ads = new Ads(this, this.videoPlayer);
}

Application.prototype.requestAd = function() {
        console.log("APPLICATION.requstAd (iniframe)");
	if (!this.adsDone) {
                console.log("!this.adsDone");
		// The user clicked/tapped - inform the ads controller that this code
		// is being run in a user action thread.
		this.ads.initialUserAction();

		// At the same time, initialize the content player as well.
		// When content is loaded, we'll issue the ad request to prevent it
		// from interfering with the initialization. See
		// https://developers.google.com/interactive-media-ads/docs/sdks/html5/v3/ads#iosvideo
		// for more information.
		this.ads.requestAds();
		this.adsDone = true;
                console.log("finished application.requestAd");
		return;
	}
        console.log("this.adsDone");
}

Application.prototype.onAdManagerLoaded = function() {
	this.containerDiv.style.display = 'block';
}

/* SDK */

function SDK() {}

SDK.prototype.init = function () {
        console.log("CALLING INIT (IN IFRAME)");
	const containerDiv = document.createElement('div');
	containerDiv.style.display = 'none';

	document.body.appendChild(containerDiv);

	this.application = new Application(containerDiv);
        console.log("FINISHED INIT (IN IFRAME)");
}

SDK.prototype.requestAd = function() {
        console.log("CALLING REQUEST AD (IN IFRAME)");
	this.application.requestAd();
        console.log("FINISHED REQUEST AD (IN IFRAME)");
}

window.adSDK = new SDK();

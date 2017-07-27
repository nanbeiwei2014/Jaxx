(function (lib, img, cjs, ss, an) {

var p; // shortcut to reference prototypes
lib.webFontTxtInst = {}; 
var loadedTypekitCount = 0;
var loadedGoogleCount = 0;
var gFontsUpdateCacheList = [];
var tFontsUpdateCacheList = [];
lib.ssMetadata = [
		{name:"introScene_atlas_", frames: [[0,0,750,1334],[0,1336,400,661]]}
];



lib.updateListCache = function (cacheList) {		
	for(var i = 0; i < cacheList.length; i++) {		
		if(cacheList[i].cacheCanvas)		
			cacheList[i].updateCache();		
	}		
};		

lib.addElementsToCache = function (textInst, cacheList) {		
	var cur = textInst;		
	while(cur != exportRoot) {		
		if(cacheList.indexOf(cur) != -1)		
			break;		
		cur = cur.parent;		
	}		
	if(cur != exportRoot) {		
		var cur2 = textInst;		
		var index = cacheList.indexOf(cur);		
		while(cur2 != cur) {		
			cacheList.splice(index, 0, cur2);		
			cur2 = cur2.parent;		
			index++;		
		}		
	}		
	else {		
		cur = textInst;		
		while(cur != exportRoot) {		
			cacheList.push(cur);		
			cur = cur.parent;		
		}		
	}		
};		

lib.gfontAvailable = function(family, totalGoogleCount) {		
	lib.properties.webfonts[family] = true;		
	var txtInst = lib.webFontTxtInst && lib.webFontTxtInst[family] || [];		
	for(var f = 0; f < txtInst.length; ++f)		
		lib.addElementsToCache(txtInst[f], gFontsUpdateCacheList);		

	loadedGoogleCount++;		
	if(loadedGoogleCount == totalGoogleCount) {		
		lib.updateListCache(gFontsUpdateCacheList);		
	}		
};		

lib.tfontAvailable = function(family, totalTypekitCount) {		
	lib.properties.webfonts[family] = true;		
	var txtInst = lib.webFontTxtInst && lib.webFontTxtInst[family] || [];		
	for(var f = 0; f < txtInst.length; ++f)		
		lib.addElementsToCache(txtInst[f], tFontsUpdateCacheList);		

	loadedTypekitCount++;		
	if(loadedTypekitCount == totalTypekitCount) {		
		lib.updateListCache(tFontsUpdateCacheList);		
	}		
};
// symbols:



(lib.ios2 = function() {
	this.spriteSheet = ss["introScene_atlas_"];
	this.gotoAndStop(0);
}).prototype = p = new cjs.Sprite();



(lib.orangebg = function() {
	this.spriteSheet = ss["introScene_atlas_"];
	this.gotoAndStop(1);
}).prototype = p = new cjs.Sprite();
// helper functions:

function mc_symbol_clone() {
	var clone = this._cloneProps(new this.constructor(this.mode, this.startPosition, this.loop));
	clone.gotoAndStop(this.currentFrame);
	clone.paused = this.paused;
	clone.framerate = this.framerate;
	return clone;
}

function getMCSymbolPrototype(symbol, nominalBounds, frameBounds) {
	var prototype = cjs.extend(symbol, cjs.MovieClip);
	prototype.clone = mc_symbol_clone;
	prototype.nominalBounds = nominalBounds;
	prototype.frameBounds = frameBounds;
	return prototype;
	}


(lib.bridgy = function(mode,startPosition,loop) {
	this.initialize(mode,startPosition,loop,{});

	// timeline functions:
	this.frame_0 = function() {
		this.mainParent = this.parent;
		
		this.setScale = function(scale) {
			console.log("parent :: " + parent + " :: scale :: " + scale);
			this.mainParent.anim.scaleX = scale;
			this.mainParent.anim.scaleY = scale;
		}
		
		this.setOffset = function(x, y) {
			console.log("parent :: " + parent + " :: x :: " + x + " :: y :: " + y);
			this.mainParent.anim.x = x;
			this.mainParent.anim.y = y;
		}
		
		this.fadeIn = function() {
			this.mainParent.anim.alpha = 1.0;
		}
	}

	// actions tween:
	this.timeline.addTween(cjs.Tween.get(this).call(this.frame_0).wait(1));

	// Layer 1
	this.shape = new cjs.Shape();
	this.shape.graphics.f("#548E87").s().p("Ai+C+IAAl8IF8AAIAAF8g");
	this.shape.setTransform(19.1,19.1);

	this.timeline.addTween(cjs.Tween.get(this.shape).wait(1));

}).prototype = getMCSymbolPrototype(lib.bridgy, new cjs.Rectangle(0,0,38.1,38.1), null);


// stage content:
(lib.introScene = function(mode,startPosition,loop) {
	this.initialize(mode,startPosition,loop,{});

	// timeline functions:
	this.frame_0 = function() {
		var hasInit = false;
		var self = this;
		
		function init() {
			console.log("init :: " + self);
			console.log("anim :: " + self.anim);
		
			self.anim.alpha = 0;
			//self.anim.scaleX = 2;
			//self.anim.scaleY = 2;
			//self.anim.cacheAsBitmap = true;
			//window.maybeAfter();
		}
		
		init();
	}

	// actions tween:
	this.timeline.addTween(cjs.Tween.get(this).call(this.frame_0).wait(1));

	// Layer 2
	this.instance = new lib.ios2();
	this.instance.parent = this;
	this.instance.setTransform(16,2,0.494,0.494);

	this.timeline.addTween(cjs.Tween.get(this.instance).wait(1));

	// bridge
	this.instance_1 = new lib.orangebg();
	this.instance_1.parent = this;
	this.instance_1.setTransform(1,1);

	this.bridgy = new lib.bridgy();
	this.bridgy.parent = this;
	this.bridgy.setTransform(199.5,333.1,10.499,17.35,0,0,0,19,19.2);
	this.bridgy.alpha = 0;

	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.bridgy},{t:this.instance_1}]}).wait(1));

}).prototype = p = new cjs.MovieClip();
p.nominalBounds = new cjs.Rectangle(200,330.5,401,662);
// library properties:
lib.properties = {
	width: 400,
	height: 661,
	fps: 60,
	color: "#FFFFFF",
	opacity: 1.00,
	webfonts: {},
	manifest: [
		{src:"images/introScene_atlas_.png", id:"introScene_atlas_"}
	],
	preloads: []
};




})(lib = lib||{}, images = images||{}, createjs = createjs||{}, ss = ss||{}, AdobeAn = AdobeAn||{});
var lib, images, createjs, ss, AdobeAn;
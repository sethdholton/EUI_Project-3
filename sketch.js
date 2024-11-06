

// audio values
let sound; // audio assets
let fft; // FFT object
let mic;
let startAudio = false;
let inputMic = false;
let bass, lowMid, mid, highMid, treble;
let soundAvg;
let bassEnergy;
let lastBeatTime = 0;
let bpm = 120;
let beatInterval = (60 / bpm) * 1000;
let freqThreshold = 200;
let spectrum, waveform; // spectrum and waveform
let sLen;
let wLen; // spectrum length and waveform length

// display
let ratio = 1.6;
let globeScale;

let displaythoughtbubble = false;

let turnSpeed;

let scrollSpeed;

// partygoers
let partyGoers = [];
let sf = []; // stick figure assets
let crp = []; // creep assets

// image assets
let thoughtbubble;

// room
let lrBg, kBg, hwBg;

let lr, k, hw;

let setupFinished = false;



function preload() {

  // audio assets
  sound = loadSound('/assets/i-81-car-pileup.mp3');

  // img assets
  loadPartyGoerAssets();
  lrBg = loadImage("/assets/bg/Living_room_cropped.png");
  kBg = loadImage("/assets/bg/Kitchen_cropped2.png");
  hwBg = loadImage("/assets/bg/Hallway_cropped2.png");
  thoughtbubble = loadImage("/assets/thoughtbubble.png");
}

function setup() {

  fitToScreen();

  scrollSpeed = width/500; // set scroll speed

  sound.amp(.8); // set sound volume

  // style
  textFont("Courier New");
  colorMode(HSB);
  
  lr = new LivingRoom(0);
  k = new Kitchen(lr.w);
  hw = new Hallway(lr.w + k.w);

  setupFinished = true;
}

function draw() {

  if (startAudio) {
    updateAudio();

    lr.update(hw.x + hw.w);
    k.update(lr.x + lr.w);
    hw.update(k.x + k.w);
  }

  lr.display();
  k.display();
  hw.display();

  displayLights();

  displayUI();
}



function fitToScreen() {

  if (window.innerWidth > window.innerHeight &&
      window.innerHeight * ratio < window.innerWidth) { // width is bigger
    createCanvas(window.innerHeight * ratio, window.innerHeight);

  } else { // height is bigger
    createCanvas(window.innerWidth, window.innerWidth / ratio);
  }

  if(setupFinished) {
    lr.w = height * (lrBg.width/lrBg.height);
    k.w = height * (kBg.width/kBg.height);
    hw.w = height * (hwBg.width/hwBg.height);
    
    lr.x = 0;
    k.x = lr.w;
    hw.x = k.x + k.w;

    lr.display();
    k.display();
    hw.display();

    displayUI();
  }
}

function windowResized() {
  fitToScreen();
}

function updateAudio() {

  bass = fft.getEnergy("bass");
  lowMid = fft.getEnergy("lowMid");
  mid = fft.getEnergy("mid");
  highMid = fft.getEnergy("highMid");
  treble = fft.getEnergy("treble");

  soundAvg = (bass + lowMid + mid + highMid + treble) / 5;
  turnSpeed = map(soundAvg, 0, 255, .0000000000000001,.000005);

  fft.analyze();
  bassEnergy = fft.getEnergy("bass");

  if (bassEnergy > freqThreshold && millis() - lastBeatTime > beatInterval * 0.8) {
    for(let i = 0; i < partyGoers.length; i++) {
      partyGoers[i].anim();
    }
    lastBeatTime = millis();
  }
  
  spectrum = fft.analyze();
  sLen = Math.floor(spectrum.length);

  waveform = fft.waveform();
  wLen = waveform.length;

}

function loadPartyGoerAssets() {

  // stick figure
  for (let i = 0; i < 3; i++) {
    sf[i] = loadImage("/assets/partygoers/stick-figure/" + i + ".png");
  }

  // creep
  for (let i = 0; i < 4; i++) {
    crp[i] = loadImage("/assets/partygoers/creep/" + i + ".png");
  }
}

function displayUI() {
  fill(120, 255, 255);
  if (stopped) {
    textAlign(CENTER, CENTER);
    textSize(width/20);
    text("PRESS 'SPACE' TO START", width/2, height/2);
  } else {
     textAlign(LEFT, CENTER);
     textSize(width/100);
     if (inputMic) {
       text("Mic", width * 0.025, height * 0.95);
     } else {
       text("Music", width * 0.025, height * 0.95);
     }
   }
}

function displayLights() {
    for(let i = 0; i < sLen; i++) {
    let h = map(spectrum[i], 0, 255, 100, 255);
    noStroke();
  }
}

let stopped = true;

function keyPressed() {
  // background(0);
  if (setupFinished) {
    if (keyCode == 32) {
    getAudioContext().resume();

    if (!startAudio) {
      mic = new p5.AudioIn();
      fft = new p5.FFT();
      mic.start();
      startAudio = true;
    }

      if (stopped) {
          loop();
          if (!inputMic) {
            sound.loop();
          }
          stopped = false;
      } else {
          noLoop();
          if (!inputMic) {
            sound.stop();
          }
          stopped = true;
          reset();
      }
    }
  }
}

function mousePressed() {
  if (!stopped) {
    if (inputMic) {
      fft.setInput(sound);
      inputMic = false;
      sound.loop();
    } else {
      fft.setInput(mic);
      inputMic = true;
      sound.stop();
    }
  }
}

function reset() {
  lr = new LivingRoom(0);
  k = new Kitchen(lr.w);
  hw = new Hallway(lr.w + k.w);
}

class PartyGoer
{
  constructor(x, y, scale, sleepy, anim) {
    this.x = x;
    this.y = y;
    this.scale = scale;
    this.onscreen = true;
    this.animIndex = 0;
    this.asleep = false;
    this.sleepy = sleepy;
    this.anim = anim;
  }
  
  display() {
    let img;
    if (!this.asleep) {
      img = anim[this.animIndex];
    } else {
      img = anim[anim.length];
    }
    this.w = img.width*this.scale;
    this.h = img.height*this.scale;
    image(img, this.x, this.y, img.width*this.scale, 
          img.height*this.scale);
  }

  anim() {
    this.animIndex++;
    if (this.animIndex > anim.length) {
      this.animIndex = 0;
    }
  }
}

class LivingRoom
{
  constructor(x) {
    this.x = x;
    this.w = height * (lrBg.width/lrBg.height);
    this.onscreen = true;
    this.pg = []; // partygoer array
  }

  update(trailX) {
    this.x -= scrollSpeed;
    if (this.x + this.w < 0) {
      this.onscreen = false;
      this.x = trailX-scrollSpeed;
    } else if (this.x < width) {
      this.onscreen = true;
    }
  }

  display() {
    if (this.onscreen) {
      image(lrBg, this.x, 0, this.w, height);
      for (let i = 0; i < this.pg.length; i++) {

      }
    }
  }
}

class Kitchen
{
  constructor(x) {
    this.x = x;
    this.w = height * (kBg.width/kBg.height);
    this.onscreen = true;
    this.pg = []; // partygoer array
  }

  update(trailX) {
    this.x -= scrollSpeed;
    if (this.x + this.w < 0) {
      this.onscreen = false;
      this.x = trailX-scrollSpeed;
    } else if (this.x < width) {
      this.onscreen = true;
    }
  }

  display() {
    if (this.onscreen) {
      image(kBg, this.x, 0, this.w, height);
    }
  }
}

class Hallway
{
  constructor(x) {
    this.x = x;
    this.w = height * (hwBg.width/hwBg.height);
    this.onscreen = true;
    this.pg = []; // partygoer array
  }

  update(trailX) {
    this.x -= scrollSpeed;
    if (this.x + this.w < 0) {
      this.onscreen = false;
      this.x = trailX-scrollSpeed;
    } else if (this.x < width) {
      this.onscreen = true;
    }
  }

  display() {
    if (this.onscreen) {
      image(hwBg, this.x, 0, this.w, height);
    }
  }
}
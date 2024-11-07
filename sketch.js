

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
  sound = loadSound('./assets/i-81-car-pileup.mp3');

  // image assets
  loadPartyGoerAssets();
  lrBg = loadImage("./assets/bg/Living_room_cropped.png");
  kBg = loadImage("./assets/bg/Kitchen_cropped2.png");
  hwBg = loadImage("./assets/bg/Hallway_cropped2.png");
  thoughtbubble = loadImage("./assets/thoughtbubble.png");
}

function setup() {

  fitToScreen();

  frameRate(30);

  scrollSpeed = width/500; // set scroll speed

  sound.amp(.8); // set sound volume

  // style
  textFont("Courier New");
  colorMode(HSB);
  
  lr = new LivingRoom(0);
  k = new Kitchen(lr.w);
  hw = new Hallway(lr.w + k.w);

  noLoop();

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
      partyGoers[i].update();
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
    sf[i] = loadImage("./assets/partygoers/stick-figure/" + i + ".png");
  }

  // creep
  for (let i = 0; i < 4; i++) {
    crp[i] = loadImage("./assets/partygoers/creep/" + i + ".png");
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
  constructor(anim, seq, rate, x, y, range, scale, sleepy) {
    this.x = x;
    this.y = y;
    this.dY = y; // dance y
    this.scale = scale;
    this.onscreen = true;
    this.range = range; // spectrum frequency range
    this.asleep = false; // whether or not they're asleep
    this.sleepy = sleepy; // whether or not they fall asleep early
    this.anim = anim; // frame array
    this.ratio = this.anim[0].width/this.anim[0].height;
    this.w = height/2*this.scale;
    this.h = height/2*this.scale*this.ratio;
    this.seq = seq; // frame sequence
    this.animIndex = 0; // place in animation sequence
    this.rate = rate; // animation framerate (1s, 2s 3s, etc.)
  }
  
  update() {
    if (frameCount % this.rate == 0) {
      this.animIndex++;
      if (this.animIndex >= this.seq.length) {
        this.animIndex = 0;
      }
    }
  }

  display() {
    let img;
    if (!this.asleep) {
      img = this.anim[this.seq[this.animIndex]];
    } else {
      img = this.anim[this.anim.length-1];
    }

    this.ratio = img.width/img.height;

    this.w = height/2*this.scale;
    this.h = height/2*this.ratio*this.scale;

    // for ( let i = 0; i < sLen; i++) {
    //   h = map(spectrum[i], 0, 255, 0, height);
    //   push();
    //     translate(width/2, height/2.05);
    //     rotate(millis()/25000);
    //     push();
    //       let r = map(i, 0, sLen, 0, TWO_PI);
    //       rotate(r+(millis()/15000));
    //       fill(420-h*0.5, h*0.5, 255);
    //       noStroke();
    //       ellipse(0, (h*0.095)+height/10, (h*50)/width, h*0.33);
    //     pop();
    //   pop();
    // }

    this.dY = this.y

    this.dance();
    
    image(img, this.x, this.dY, this.w, this.h);
  }

  dance() {
    if (startAudio) {
      spectrum = fft.analyze();
      let avg = 0;
      for (let i = 0; i < 24; i++) {
        avg += spectrum[this.range + i];
      }
      avg /= 24;

      console.log(avg);

      let h = map(avg, 0, 255, 0, height/20);
      this.dY += h;
    }
  }
}

class Creep extends PartyGoer
{
  constructor(x, y, range, scale, sleepy) {
    let seq = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 3, 0];
    super(crp, seq, 4, x, y, range, scale, sleepy);
  }
}

class StickFigure extends PartyGoer
{
  constructor(x, y, range, scale, sleepy) {
    let seq = [0, 1];
    super(sf, seq, 4, x, y, range, scale, sleepy);
  }
}

class LivingRoom
{
  constructor(x) {
    this.x = x;
    this.w = height * (lrBg.width/lrBg.height);
    this.onscreen = true;
    this.prevOnscreen = true;
    this.pg = []; // partygoer array

    this.init();
  }

  update(trailX) {
    this.x -= scrollSpeed;
    if (this.x + this.w < 0) {
      this.onscreen = false;
      this.x = trailX-scrollSpeed;
    } else if (this.x < width) {
      this.onscreen = true;
    }
    if (this.onscreen != this.prevOnscreen) {

    }
    this.prevOnscreen = this.onscreen;
  }

  display() {
    if (this.onscreen) {
      image(lrBg, this.x, 0, this.w, height);
    }
    push();
      translate(this.x, 0);
      for(let i = 0; i < this.pg.length; i++) {
        this.pg[i].update();
        this.pg[i].display();
      }
    pop();
  }

  init() {
    this.pg.push(new Creep(width/2, height*0.575, 0, 0.84, false));
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
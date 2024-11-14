

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

let tb;

let turnSpeed;

let scrollSpeed;

// partygoers
let partyGoers = [];
let sf = []; // stick figure assets
let crp = []; // creep assets
let bear = []; // bear assets
let leop = []; // leopard assets
let wolf1 = []; // wolf 1 assets
let wolf2 = []; // wolf 2 assets

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
  tb1 = loadImage("./assets/thoughtbubble/0.png");
  tb2 = loadImage("./assets/thoughtbubble/1.png");
}

function setup() {

  fitToScreen();

  frameRate(30);

  scrollSpeed = width*0.005; // set scroll speed

  sound.amp(.8); // set sound volume

  // style
  textFont("Courier New");
  colorMode(HSB);
  
  lr = new LivingRoom(0);
  k = new Kitchen(lr.w);
  hw = new Hallway(lr.w + k.w);

  tb = new Thoughtbubble();

  noLoop();

  setupFinished = true;
}

function draw() {

  if (startAudio) {
    updateAudio();

    lr.update(hw.x + hw.w);
    k.update(lr.x + lr.w);
    hw.update(k.x + k.w);

    tb.update();
  }

  lr.displayBG();
  k.displayBG();
  hw.displayBG();

  lr.displayPG();
  k.displayPG();
  hw.displayPG();

  if (hw.phase == 2) {
    tb.display(hw.x + hw.w - tb.w + (width*0.151));
  }

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

    lr.pg = [];
    k.pg = [];
    hw.pg = [];

    lr.init();
    k.init();
    hw.init();

    lr.displayBG();
    k.displayBG();
    hw.displayBG();

    lr.displayPG();
    k.displayPG();
    hw.displayPG();

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

  // bear
  for (let i = 0; i < 3; i++) {
    bear[i] = loadImage("./assets/partygoers/bear/" + i + ".png");
  }

  // leopard
  for (let i = 0; i < 3; i++) {
    leop[i] = loadImage("./assets/partygoers/leopard/" + i + ".png");
  }

  // wolf 1
  for (let i = 0; i < 3; i++) {
    wolf1[i] = loadImage("./assets/partygoers/wolf/" + i + ".png"); 
  }

  for (let i = 0; i < 3; i++) {
    wolf2[i] = loadImage("./assets/partygoers/wolf/" + (i+3) + ".png");
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
     textSize(width/100);
     text("living room: " + lr.phase, 10, 10);
     text("kitchen: " + k.phase, 10, 30);
     text("hallway: " + hw.phase, 10, 50);
   }
  //  textSize(width/100);
  //  text("living room: " + lr.phase, 10, 10);
  //  text("kitchen: " + k.phase, 10, 20);
  //  text("hallway: " + hw.phase, 10, 30);
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
        fft.setInput(mic);
        inputMic = true;
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
  constructor(anim, seq, rate, x, y, scale, range, tired, sleepX, sleepY) {
    this.x = width * (x / 100);
    this.y = height * (y / 100);
    this.dY = y; // dance y
    this.sleepX = width * (sleepX / 100); // x coordinate while asleep
    this.sleepY = height * (sleepY / 100); // y coordinate while asleep
    this.scale = scale;
    this.onscreen = true;
    this.range = range; // spectrum frequency range
    this.asleep = false; // whether or not they're asleep
    this.tired = tired; // whether or not they fall asleep early
    this.anim = anim; // frame array
    this.ratio = this.anim[0].width/this.anim[0].height;
    this.w = height/2*this.scale;
    this.h = height/2*this.scale*this.ratio;
    this.seq = seq; // frame sequence
    this.animIndex = 0; // place in animation sequence
    this.rate = rate; // animation framerate (1s, 2s 3s, etc.)
  }
  
  update() {
    if (frameCount % this.rate == 0) { // animate sprite
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

      this.ratio = img.width/img.height;

      this.w = height/2*this.scale;
      this.h = height/2*this.ratio*this.scale;

      this.dY = this.y
      this.dance();

      image(img, this.x, this.dY, this.w, this.h);
    } else {
      img = this.anim[this.anim.length-1];

      this.ratio = img.width/img.height;

      this.w = height/2*this.scale;
      this.h = height/2*this.ratio*this.scale;

      image(img, this.sleepX, this.sleepY, this.w, this.h)
    }
  } 

  dance() {
  if (startAudio) {
      spectrum = fft.analyze();
      let avg = 0;
      for (let i = 0; i < 24; i++) {
        avg += spectrum[this.range + i];
      }
      avg /= 24;

      let h = map(avg, 0, 255, 0, this.h*0.15);
      this.dY += h;
    }
  }
}

class Creep extends PartyGoer
{
  constructor(x, y, scale, range, tired, sleepX, sleepY) {
    let seq = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 3, 0];
    super(crp, seq, 4, x, y, scale, range, tired, sleepX, sleepY);
  }
}

class StickFigure extends PartyGoer
{
  constructor(x, y, scale, range, tired, sleepX, sleepY) {
    let seq = [0, 1];
    super(sf, seq, 50, x, y, scale, range, tired, sleepX, sleepY);
  }
}

class Bear extends PartyGoer
{
  constructor(x, y, scale, range, tired, sleepX, sleepY) {
    let seq = [0, 1];
    super(bear, seq, 10, x, y, scale, range, tired, sleepX, sleepY);
  }
}

class Leopard extends PartyGoer
{
  constructor(x, y, scale, range, tired, sleepX, sleepY) {
    let seq = [0, 1];
    super(leop, seq, 11, x, y, scale, range, tired, sleepX, sleepY);
  }
}

class Wolf1 extends PartyGoer
{
  constructor(x, y, scale, range, tired, sleepX, sleepY) {
    let seq = [0, 1];
    super(wolf1, seq, 20, x, y, scale, range, tired, sleepX, sleepY);
  }
}

class Wolf2 extends PartyGoer
{
  constructor(x, y, scale, range, tired, sleepX, sleepY) {
    let seq = [0, 1];
    super(wolf2, seq, 23, x, y, scale, range, tired, sleepX, sleepY);
  }
}


class LivingRoom
{
  constructor(x) {
    this.x = x;
    this.w = height * (lrBg.width/lrBg.height);
    this.onscreen = true;
    this.pg = []; // partygoer array
    this.phase = 0;

    this.init();
  }

  update(trailX) {
    this.x -= scrollSpeed;
    if (this.x + this.w < 0) {
      this.onscreen = false;
      this.x = trailX-scrollSpeed;
      this.phase++;
      if (this.phase > 2) {
        this.phase = 0;
        for(let i = 0; i < this.pg.length; i++) {
          this.pg[i].asleep=false;
        }
      }
    } else if (this.x < width) {
      this.onscreen = true;
    }

    if (this.phase == 1) {
      for(let i = 0; i < this.pg.length; i++) {
        if (this.pg[i].tired) {
          this.pg[i].asleep = true;
        }
      }
    }

    if (this.phase == 2) {
      for(let i = 0; i < this.pg.length; i++) {
        this.pg[i].asleep = true;
      }
    }
  }

  displayBG() {
    if (this.onscreen) {
      image(lrBg, this.x, 0, this.w, height);
    }
  }

  displayPG() {
    push();
      translate(this.x, 0);
      for(let i = 0; i < this.pg.length; i++) {
        if (this.x + this.pg[i].x + this.pg[i].w > 0) {
          this.pg[i].update();
          this.pg[i].display();
        }
      }
    pop();
  }

  init() {
    this.pg.push(new Wolf1(47, 42, 0.8, 800, true, 46, 59));
    this.pg.push(new StickFigure(37, 51, 0.3, 1000, false, 37, 51));
    this.pg.push(new Creep(15, 65, 0.7, 0, false, 15, 65));
  }
}

class Kitchen
{
  constructor(x) {
    this.x = x;
    this.w = height * (kBg.width/kBg.height);
    this.onscreen = true;
    this.pg = []; // partygoer array
    this.phase = 0;

    this.init();
  }

  update(trailX) {
    this.x -= scrollSpeed;
    if (this.x + this.w < 0) {
      this.onscreen = false;
      this.x = trailX-scrollSpeed;
      this.phase++;
      if (this.phase > 2) {
        this.phase = 0;
        for(let i = 0; i < this.pg.length; i++) {
          this.pg[i].asleep=false;
        }
      }
    } else if (this.x < width) {
      this.onscreen = true;
    }

    if (this.phase == 1) {
      for(let i = 0; i < this.pg.length; i++) {
        if (this.pg[i].tired) {
          this.pg[i].asleep = true;
        }
      }
    }

    if (this.phase == 2) {
      for(let i = 0; i < this.pg.length; i++) {
        this.pg[i].asleep = true;
      }
    }
  }

  displayBG() {
    if (this.onscreen) {
      image(kBg, this.x, 0, this.w, height);
    }
  }

  displayPG() {
    push();
      translate(this.x, 0);
      for(let i = 0; i < this.pg.length; i++) {
        if (this.x + this.pg[i].x + this.pg[i].w > 0 - (width*0.16)) {
          this.pg[i].update();
          this.pg[i].display();
        }
      }
    pop();
  }

  init() {
    this.pg.push(new Wolf2(45, 65, 0.8, 500, true, -2, 13));
    this.pg.push(new StickFigure(64, 41, 0.3, 30, true, 28, 32.5));
    this.pg.push(new Leopard(26, 65, 0.95, 300, false, 45.5, 27));
  }
}

class Hallway
{
  constructor(x) {
    this.x = x;
    this.w = height * (hwBg.width/hwBg.height);
    this.onscreen = true;
    this.pg = []; // partygoer array
    this.phase = 0;

    this.init();
  }

  update(trailX) {
    this.x -= scrollSpeed;
    if (this.x + this.w < 0) {
      this.onscreen = false;
      this.x = trailX-scrollSpeed;
      this.phase++;
      if (this.phase > 2) {
        this.phase = 0;
        for(let i = 0; i < this.pg.length; i++) {
          this.pg[i].asleep=false;
        }
      }
    } else if (this.x < width) {
      this.onscreen = true;
    }

    if (this.phase == 1) {
      for(let i = 0; i < this.pg.length; i++) {
        if (this.pg[i].tired) {
          this.pg[i].asleep = true;
        }
      }
    }

    if (this.phase == 2 && !this.onscreen) {

      for(let i = 0; i < this.pg.length; i++) {
        this.pg[i].asleep = true;
      }
      tb.update();
    }
  }

  displayBG() {
    if (this.onscreen) {
      image(hwBg, this.x, 0, this.w, height);
    }
  }

  displayPG() {
    push();
      translate(this.x, 0);
      for(let i = 0; i < this.pg.length; i++) {
        if (this.x + this.pg[i].x + this.pg[i].w > 0) {
          this.pg[i].update();
          this.pg[i].display();
        }
      }
    pop();
  }

  init() {
    this.pg.push(new Bear(20, 50, 0.7, 650, true, 10, 50));
  }
}

class Thoughtbubble{
  constructor() {
    this.x = 0;
    this.index = 0;
    this.rate = 15;
    this.ratio = tb1.width/tb1.height;
    this.w = height*this.ratio;
  }
  
  update() {
    if (frameCount % this.rate == 0) {
      this.index++;
      if (this.index > 1) {
        this.index = 0;
      }
    }
  }

  display(x) {
    this.x = x;
    if (this.index == 0) {
      image(tb1, this.x, 0, this.w, height);
    } else {
      image(tb2, this.x, 0, this.w, height);
    }
  }
}
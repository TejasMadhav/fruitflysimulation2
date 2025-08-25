import './style.css'
import Phaser from 'phaser'

const gameState = {}

const Pause = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// BootScene unchanged except that on pointerup we start CountdownScene instead of MainScene
class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload()  {
    this.load.image('fly', 'assets/fly.png');
    this.load.image('saltshaker', 'assets/saltshaker.png');
    this.load.image('banana', 'assets/banana.png');
    this.load.image('apple', 'assets/apple.png');
    this.load.image('mango', 'assets/mango.png');
  }

  create () {
    let welcomeMessage = this.add.text(450, 15, "Can You Beat a Fly?", {
      font: "30px Lucida Console",
      fill: "red"
    });
    welcomeMessage.setOrigin(0.5, 0.5);

    let instructMessage = this.add.text(450, 55, "Your goal is to find an invisible food source on the arena as quickly as you can \n using only status ring around you to indicate the intensity of the scent signal.", {
      font: "15px Lucida Console",
      fill: "red"
    });
    instructMessage.setOrigin(0.5, 0.5);

    let instructMessage2 = this.add.text(450, 90, "Try to find the source as quickly as you can!", {
      font: "15px Lucida Console",
      fill: "red"
    });
    instructMessage2.setOrigin(0.5, 0.5);

    let instructMessage3 = this.add.text(450, 250, "Click to start", {
      font: "25px Lucida Console",
      fill: "red"
    });
    instructMessage3.setOrigin(0.5, 0.5);

    let on = true;
    this.time.addEvent({ callback: () => {
        instructMessage3.visible = !instructMessage3.visible;
      }, callbackScope: this, delay: 750, loop: true });

    let fly = this.add.sprite(450, 350, 'fly');
    fly.setScale(0.375).setOrigin(0.5, 0.5);
    fly.angle = -45;

    // *** CHANGE HERE: on click, go to CountdownScene (not MainScene) ***
    this.input.once("pointerup", () => {
      this.scene.stop("BootScene");
      this.scene.start("CountdownScene");
    });
  }
}

// CountdownScene that shows 3..2..1..GO! then starts MainScene
class CountdownScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CountdownScene' });
  }

  create() {
    this.cameras.main.setBackgroundColor('#2EBB2E'); // original green background

    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;

    this.count = 3;
    this.countdownText = this.add.text(centerX, centerY, this.count, {
      font: '120px Lucida Console',
      fill: 'red',
      stroke: 'black',
      strokeThickness: 8,
    }).setOrigin(0.5);

    this.time.addEvent({
      delay: 1000,
      repeat: 3,
      callback: () => {
        this.count--;
        if (this.count > 0) {
          this.countdownText.setText(this.count);
        } else if (this.count === 0) {
          this.countdownText.setText('GO!');
        } else {
          this.scene.start('MainScene');
        }
      }
    });
  }
}

// MainScene unchanged (joystick and everything loads as before)
class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainScene' });
  }
 
  preload()  {
    this.load.image('fly', 'assets/fly.png');
    this.load.image('tree', 'assets/tree.png');
    this.load.image('stone', 'assets/stone.jpg');
    this.load.image('bg', 'assets/table.jpg');
    this.load.image('salt', 'assets/saltshaker.png');
    this.load.image('mug', 'assets/mug.png');
    let url = 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexvirtualjoystickplugin.min.js';
    this.load.plugin('rexvirtualjoystickplugin', url, true);
  }  
   
  create () {
    // your original code here exactly as before

    // environment
    // this.add.sprite(100, 100, 'tree').setScale(0.07);
    // (commented out in your original)

    gameState.end = false;
    gameState.cursors = this.input.keyboard.createCursorKeys();

    this.add.sprite(0, 0, 'bg').setOrigin(0).setScale(1.39);
    this.add.sprite(150, 150, 'saltshaker').setOrigin(0).setScale(.6);
    this.add.sprite(430, 250, 'mug').setOrigin(0).setScale(.4);

    gameState.statusRing = this.add.ellipse(17.5, 17.5, 25, 25, 0xFFFFF);
    gameState.statusRing.setOrigin(0.5);

    gameState.fly = this.physics.add.sprite(17.5, 17.5, 'fly');
    gameState.fly.setScale(0.0375);
    gameState.fly.setCollideWorldBounds(true);
    gameState.fly.setOrigin(0.5);

    gameState.joystick = this.plugins.get('rexvirtualjoystickplugin').add(this, { x: 840,
      y: 400,
      radius: 50,
      base: this.add.circle(840, 400, 70, 0x444444),
      thumb: this.add.circle(840, 400, 25, 0x00BFFF) });

    gameState.distanceTraveled = 0;
    gameState.startTime = this.time.now;

    gameState.timeText = this.add.text(750, 20, "Time remaining: 300.00s", {
      font: "15px Arial",
      fill: "Yellow"
    });

    gameState.distanceText = this.add.text(750, 50, "Distance traveled: 0.00", {
      font: "15px Arial",
      fill: "Yellow"
    });

    gameState.source = new Phaser.Math.Vector2(Phaser.Math.Between(50, 749),  Phaser.Math.Between(50, 449));
    gameState.slope = Phaser.Math.Between(0, 360);

    gameState.noiseArray = [];
    for (let i = 0; i < 5; i++) {
      let r = Math.random();
      gameState.noiseArray.push(r < 0.5 ? -1 : 1);
    }

    this.updateNoise = this.time.addEvent({ callback: this.updateArray, callbackScope: this, delay: 100, loop: true });

    gameState.graphics = this.add.graphics();
    gameState.graphics.beginPath();
    gameState.graphics.moveTo(gameState.fly.x, gameState.fly.y);
    gameState.graphics.lineStyle(1.5, 0xFF0000);
  }
 
  updateArray() {
    gameState.noiseArray = gameState.noiseArray.slice(1);
    let r = Math.random();
    gameState.noiseArray.push(r < 0.5 ? -1 : 1);
  }
 
  async update (time) {
    // all your original update logic, no changes

    let distanceToSource = Phaser.Math.Distance.Between(gameState.fly.x, gameState.fly.y, gameState.source.x, gameState.source.y);
    let x_diff = gameState.fly.x - gameState.source.x;
    let y_diff = gameState.source.y - gameState.fly.y;
    let point = rotate(x_diff, y_diff, gameState.slope);

    gameState.noise = avg(gameState.noiseArray) * 100;

    let plumeIntensity = Math.log(Gaussian(point.x, point.y, 0.25)) + gameState.noise;

    moveFly();

    setStatusRing(plumeIntensity);
    gameState.statusRing.x = gameState.fly.x;
    gameState.statusRing.y = gameState.fly.y;

    gameState.graphics.lineTo(gameState.fly.x, gameState.fly.y);

    const elapsedTime = (this.time.now - gameState.startTime) / 1000;
    const timeRemaining = Math.max(0, 300 - elapsedTime);
    gameState.timeText.setText("Time remaining: " + timeRemaining.toFixed(0) + "s");
    gameState.distanceText.setText("Distance traveled: " + gameState.distanceTraveled.toFixed(2));

    let maxDistanceToWin = 25;

    if (distanceToSource < maxDistanceToWin && !gameState.end) {
      gameState.end = true;

      gameState.fly.destroy();
      gameState.statusRing.destroy();
      gameState.graphics.strokePath();

      gameState.joystick.destroy();

      let num = Math.floor(Math.random() * 10);

      if(num < 3) {
          this.add.image(gameState.source.x, gameState.source.y, 'banana').setScale(0.05);
      }
      else if(num <6) {
           this.add.image(gameState.source.x, gameState.source.y, 'apple').setScale(0.05);
      }
      else {
        this.add.image(gameState.source.x, gameState.source.y, 'mango').setScale(0.1);
      }

      this.add.text(750, 80, "Click to view heatmap", {
        font: "15px Arial",
        fill: "Red"
      });

      setTimeout(() => {
        this.input.on("pointerup", () => {
          this.scene.stop("MainScene");
          this.scene.start("HeatmapScene", { x: gameState.source.x, y: gameState.source.y, slope: gameState.slope });
      }, this)}, 5000);
    }
  }
}

class HeatmapScene extends Phaser.Scene {
  init(data) {
    this.x = data.x;
    this.y = data.y;
    this.slope = data.slope;
  }
 
  constructor() {
    super({ key: "HeatmapScene" });
  }

  create() {
    gameState.source = new Phaser.Math.Vector2(this.x, this.y);
    gameState.slope = this.slope;
    generateHeatmap(this, gameState);

    this.input.on("click", () => {
      this.scene.stop("HeatmapScene");
      this.scene.start("BootScene");
    });
  }
}

// All helper functions exactly as your original code (setStatusRing, setTileColor, Gaussian, avg, rotate, moveFly, generateHeatmap)

function setStatusRing(plumeIntensity) {
  if (plumeIntensity < -300) {
    gameState.statusRing.setFillStyle(0xFFFFFF);
  } else if (plumeIntensity < -280) {
    gameState.statusRing.setFillStyle(0xFFEEEE);
  }  else if (plumeIntensity < -260) {
    gameState.statusRing.setFillStyle(0xFFDDDD);
  } else if (plumeIntensity < -240) {
    gameState.statusRing.setFillStyle(0xFFCCCC);
  } else if (plumeIntensity < -220) {
    gameState.statusRing.setFillStyle(0xFFBBBB);
  } else if (plumeIntensity < -200) {
    gameState.statusRing.setFillStyle(0xFFAAAA);
  } else if (plumeIntensity < -180) {
    gameState.statusRing.setFillStyle(0xFF9999);
  } else if (plumeIntensity < -160) {
    gameState.statusRing.setFillStyle(0xFF8888);
  } else if (plumeIntensity < -140) {
    gameState.statusRing.setFillStyle(0xFF7777);
  } else if (plumeIntensity < -120) {
    gameState.statusRing.setFillStyle(0xFF6666);
  } else if (plumeIntensity < -100) {
    gameState.statusRing.setFillStyle(0xFF5555);
  } else if (plumeIntensity < -80) {
    gameState.statusRing.setFillStyle(0xFF4444);
  } else if (plumeIntensity < -60) {
    gameState.statusRing.setFillStyle(0xFF3333);
  } else if (plumeIntensity < -40) {
    gameState.statusRing.setFillStyle(0xFF2222);
  } else if (plumeIntensity < -20) {
    gameState.statusRing.setFillStyle(0xFF1111);
  } else {
    gameState.statusRing.setFillStyle(0xFF0000);
  }
}

function setTileColor(plumeIntensity) {
  if (plumeIntensity < -300) {
    return 0xFFFFFF;
  } else if (plumeIntensity < -280) {
    return 0xFFEEEE;
  }  else if (plumeIntensity < -260) {
    return 0xFFDDDD;
  } else if (plumeIntensity < -240) {
    return 0xFFCCCC;
  } else if (plumeIntensity < -220) {
    return 0xFFBBBB;
  } else if (plumeIntensity < -200) {
    return 0xFFAAAA;
  } else if (plumeIntensity < -180) {
    return 0xFF9999;
  } else if (plumeIntensity < -160) {
    return 0xFF8888;
  } else if (plumeIntensity < -140) {
    return 0xFF7777;
  } else if (plumeIntensity < -120) {
    return 0xFF6666;
  } else if (plumeIntensity < -100) {
    return 0xFF5555;
  } else if (plumeIntensity < -80) {
    return 0xFF4444;
  } else if (plumeIntensity < -60) {
    return 0xFF3333;
  } else if (plumeIntensity < -40) {
    return 0xFF2222;
  } else if (plumeIntensity < -20) {
    return 0xFF1111;
  } else {
    return 0xFF0000;
  }
}

function Gaussian (x, y, diffusivity) {
  if (x < 0) return 0;
  var m = Math.sqrt(Math.PI * diffusivity * x);
  var e = Math.exp(-Math.pow(y, 2) / (diffusivity * x));
  return e / m;
}

function avg(array) {
  let sum = 0;
  for (let i = 0; i < 5; i++) {
    sum += array[i];
  }
  return sum / 5.0;
}

function rotate(x, y, theta) {
  theta = Math.PI * (theta / 180);
  let x_rot = x * Math.cos(theta) - y * Math.sin(theta);
  let y_rot = x * Math.sin(theta) + y * Math.cos(theta);
  return new Phaser.Math.Vector2(x_rot, y_rot);
}

function moveFly() {
  let force = gameState.joystick.force / 100.;
  if (force > 1.5) force = 1.5;
  let angle = -1 * gameState.joystick.angle * Math.PI / 180.;

  let dx = force * Math.cos(angle);
  let dy = -1 * force * Math.sin(angle);

  let nextX = gameState.statusRing.x + dx;
  let nextY = gameState.statusRing.y + dy;

  // Prevent fly from entering salt shaker area (located at 150,150) and mug (430, 250)
  if(!(nextX > 416 && nextX < 485 && nextY > 235 && nextY < 308))
  {
      if(!(nextX > 138 && nextX < 213 && nextY > 135 && nextY < 210)) 
      {
        gameState.statusRing.x = nextX;
        gameState.fly.x += dx;

        gameState.statusRing.y = nextY;
        gameState.fly.y += dy;

        gameState.distanceTraveled += Math.sqrt(dx * dx + dy * dy);
      }
  }

  let cursorKeys = gameState.joystick.createCursorKeys();
  var leftKeyDown = cursorKeys.left.isDown;
  var rightKeyDown = cursorKeys.right.isDown;
  var upKeyDown = cursorKeys.up.isDown;
  var downKeyDown = cursorKeys.down.isDown;

  if (upKeyDown && rightKeyDown) {
    gameState.fly.angle = 45;
  } else if (upKeyDown && leftKeyDown) {
    gameState.fly.angle = -45;
  } else if (downKeyDown && rightKeyDown) {
    gameState.fly.angle = 135;
  } else if (downKeyDown && leftKeyDown) {
    gameState.fly.angle = -135;
  } else if (rightKeyDown) {
    gameState.fly.angle = 90;
  } else if (upKeyDown) {
    gameState.fly.angle = 0;
  } else if (leftKeyDown) {
    gameState.fly.angle = -90;
  } else if (downKeyDown) {
    gameState.fly.angle = 180;
  }
}

function generateHeatmap(scene, gameState) {
  for (let i = 0; i < 750; i += 25) {
    for (let j = 0; j < 450; j += 25) {
      let x_diff = i - gameState.source.x;
      let y_diff = gameState.source.y - j;
      let point = rotate(x_diff, y_diff, gameState.slope);

      let plumeIntensity = Math.log(Gaussian(point.x, point.y, 0.25));
      let color = setTileColor(plumeIntensity);
      scene.add.rectangle(i, j, 25, 25, color).setOrigin(0);
    }
  }
}

const config = {
  type: Phaser.WEBGL,
  width: 950,
  height: 500,
  scene: [BootScene, CountdownScene, MainScene, HeatmapScene], // boot -> countdown -> main -> heatmap
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0 },
      enableBody: true,
      debug: true
    },
  },
  fps: {
    forceTimeOut: true,
    target: 30
  },
  backgroundColor: '#2EBB2E',
  canvas: gameCanvas
}

const game = new Phaser.Game(config);

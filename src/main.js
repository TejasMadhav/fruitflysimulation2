import './style.css'
import Phaser from 'phaser'

const gameState = {}

const Pause = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// BootScene - Welcome and instructions
class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    this.load.image('fly', 'assets/fly.png');
    this.load.image('saltshaker', 'assets/saltshaker.png');
    this.load.image('banana', 'assets/banana.png');
    this.load.image('apple', 'assets/apple.png');
    this.load.image('mango', 'assets/mango.png');
  }

  create() {
    const centerX = 450;
    const centerY = 250;

    this.add.text(centerX, 15, "Can You Beat a Fly?", {
      font: "30px Lucida Console",
      fill: "red"
    }).setOrigin(0.5);

    this.add.text(centerX, 55, "Your goal is to find an invisible food source on the arena as quickly as you can \n using only status ring around you to indicate the intensity of the scent signal.", {
      font: "15px Lucida Console",
      fill: "red"
    }).setOrigin(0.5);

    this.add.text(centerX, 90, "Try to find the source as quickly as you can!", {
      font: "15px Lucida Console",
      fill: "red"
    }).setOrigin(0.5);

    const clickText = this.add.text(centerX, 250, "Click to start", {
      font: "25px Lucida Console",
      fill: "red"
    }).setOrigin(0.5);

    let visible = true;
    this.time.addEvent({
      delay: 750,
      loop: true,
      callback: () => {
        visible = !visible;
        clickText.visible = visible;
      }
    });

    this.input.once("pointerup", () => {
      this.scene.start("CountdownScene");
    });
  }
}

// CountdownScene - 3,2,1,GO! then start MainScene
class CountdownScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CountdownScene' });
  }

  create() {
    this.countdown = 3;
    this.countdownText = this.add.text(475, 250, this.countdown.toString(), {
      font: "120px Lucida Console",
      fill: "#FF0000",
      stroke: "#000000",
      strokeThickness: 8,
    }).setOrigin(0.5);

    this.timerEvent = this.time.addEvent({
      delay: 1000,
      repeat: 3,
      callback: () => {
        this.countdown--;
        if (this.countdown > 0) {
          this.countdownText.setText(this.countdown.toString());
        } else if (this.countdown === 0) {
          this.countdownText.setText("GO!");
        } else {
          this.scene.start("MainScene");
        }
      }
    });
  }
}

// MainScene - actual game, fly starts moving immediately here
class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainScene' });
  }

  preload() {
    this.load.image('fly', 'assets/fly.png');
    this.load.image('tree', 'assets/tree.png');
    this.load.image('stone', 'assets/stone.jpg');
    this.load.image('bg', 'assets/table.jpg');
    this.load.image('saltshaker', 'assets/saltshaker.png');
    let url = 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexvirtualjoystickplugin.min.js';
    this.load.plugin('rexvirtualjoystickplugin', url, true);
  }

  create() {
    this.add.sprite(0, 0, 'bg').setOrigin(0).setScale(1.39);
    this.add.sprite(150, 150, 'saltshaker').setOrigin(0).setScale(.6);

    gameState.end = false;
    gameState.distanceTraveled = 0;

    gameState.statusRing = this.add.ellipse(17.5, 17.5, 25, 25, 0xFFFFFF).setOrigin(0.5);
    gameState.fly = this.physics.add.sprite(17.5, 17.5, 'fly').setScale(0.0375).setOrigin(0.5);
    gameState.fly.setCollideWorldBounds(true);

    gameState.joystick = this.plugins.get('rexvirtualjoystickplugin').add(this, {
      x: 840,
      y: 400,
      radius: 50,
      base: this.add.circle(840, 400, 70, 0x444444),
      thumb: this.add.circle(840, 400, 25, 0x00BFFF)
    });

    gameState.timeText = this.add.text(750, 20, "Time remaining: 300.00s", {
      font: "15px Arial",
      fill: "Yellow"
    });
    gameState.distanceText = this.add.text(750, 50, "Distance traveled: 0.00", {
      font: "15px Arial",
      fill: "Yellow"
    });

    gameState.source = new Phaser.Math.Vector2(
      Phaser.Math.Between(50, 749),
      Phaser.Math.Between(50, 449)
    );
    gameState.slope = Phaser.Math.Between(0, 360);

    gameState.noiseArray = [];
    for (let i = 0; i < 5; i++) {
      gameState.noiseArray.push(Math.random() < 0.5 ? -1 : 1);
    }

    this.updateNoise = this.time.addEvent({
      delay: 100,
      loop: true,
      callback: this.updateNoiseArray,
      callbackScope: this
    });

    gameState.graphics = this.add.graphics();
    gameState.graphics.lineStyle(1.5, 0xFF0000);
    gameState.graphics.beginPath();
    gameState.graphics.moveTo(gameState.fly.x, gameState.fly.y);

    gameState.startTime = this.time.now;
  }

  updateNoiseArray() {
    gameState.noiseArray.shift();
    gameState.noiseArray.push(Math.random() < 0.5 ? -1 : 1);
  }

  update(time) {
    if (gameState.end) return;

    const dist = Phaser.Math.Distance.Between(gameState.fly.x, gameState.fly.y, gameState.source.x, gameState.source.y);

    this.moveFly();

    gameState.statusRing.x = gameState.fly.x;
    gameState.statusRing.y = gameState.fly.y;

    gameState.graphics.lineTo(gameState.fly.x, gameState.fly.y);

    const elapsed = (time - gameState.startTime) / 1000;
    const timeRemaining = Math.max(0, 300 - elapsed);
    gameState.timeText.setText(`Time remaining: ${timeRemaining.toFixed(0)}s`);
    gameState.distanceText.setText(`Distance traveled: ${gameState.distanceTraveled.toFixed(2)}`);

    const maxDistanceToWin = 25;
    if (dist < maxDistanceToWin && !gameState.end) {
      gameState.end = true;

      gameState.fly.destroy();
      gameState.statusRing.destroy();
      gameState.graphics.strokePath();
      gameState.joystick.destroy();

      let num = Math.floor(Math.random() * 10);
      let fruitKey;
      if (num < 3) fruitKey = 'banana';
      else if (num < 6) fruitKey = 'apple';
      else fruitKey = 'mango';

      this.add.image(gameState.source.x, gameState.source.y, fruitKey).setScale(fruitKey === 'mango' ? 0.1 : 0.05);

      this.add.text(750, 80, "Click to view heatmap", {
        font: "15px Arial",
        fill: "Red"
      });

      this.time.delayedCall(5000, () => {
        this.input.once("pointerup", () => {
          this.scene.start("HeatmapScene", { x: gameState.source.x, y: gameState.source.y, slope: gameState.slope });
        });
      });
    }
  }

  moveFly() {
    let force = gameState.joystick.force / 100;
    if (force > 1.5) force = 1.5;
    let angle = -gameState.joystick.angle * Math.PI / 180;

    let dx = force * Math.cos(angle);
    let dy = -force * Math.sin(angle);

    let nextX = gameState.statusRing.x + dx;
    let nextY = gameState.statusRing.y + dy;

    if (!(nextX > 130 && nextX < 200 && nextY > 150 && nextY < 210)) {
      gameState.statusRing.x = nextX;
      gameState.fly.x += dx;

      gameState.statusRing.y = nextY;
      gameState.fly.y += dy;

      gameState.distanceTraveled += Math.sqrt(dx * dx + dy * dy);
    }
  }
}

// HeatmapScene - displays heatmap and click to return to BootScene
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

    this.input.once("pointerup", () => {
      this.scene.start("BootScene");
    });
  }
}

// Heatmap helper functions
function generateHeatmap(scene, gameState) {
  for (let i = 0; i < 750; i += 25) {
    for (let j = 0; j < 450; j += 25) {
      let x_diff = i - gameState.source.x;
      let y_diff = gameState.source.y - j;
      let point = rotate(x_diff, y_diff, gameState.slope);

      let plumeIntensity = Math.log(Gaussian(point.x, point.y, 0.25));
      let color = setTileColor(plumeIntensity);

      let rect = scene.add.rectangle(i + 12.5, j + 12.5, 25, 25, color);
      rect.setOrigin(0.5);
    }
  }
}

function setTileColor(plumeIntensity) {
  if (plumeIntensity < -300) return 0xFFFFFF;
  if (plumeIntensity < -280) return 0xFFEEEE;
  if (plumeIntensity < -260) return 0xFFDDDD;
  if (plumeIntensity < -240) return 0xFFCCCC;
  if (plumeIntensity < -220) return 0xFFBBBB;
  if (plumeIntensity < -200) return 0xFFAAAA;
  if (plumeIntensity < -180) return 0xFF9999;
  if (plumeIntensity < -160) return 0xFF8888;
  if (plumeIntensity < -140) return 0xFF7777;
  if (plumeIntensity < -120) return 0xFF6666;
  if (plumeIntensity < -100) return 0xFF5555;
  if (plumeIntensity < -80) return 0xFF4444;
  if (plumeIntensity < -60) return 0xFF3333;
  if (plumeIntensity < -40) return 0xFF2222;
  if (plumeIntensity < -20) return 0xFF1111;
  return 0xFF0000;
}

function Gaussian(x, y, diffusivity) {
  if (x < 0) return 0;
  var m = Math.sqrt(Math.PI * diffusivity * x);
  var e = Math.exp(-Math.pow(y, 2) / (diffusivity * x));
  return e / m;
}

function rotate(x, y, theta) {
  theta = Math.PI * (theta / 180);
  let x_rot = x * Math.cos(theta) - y * Math.sin(theta);
  let y_rot = x * Math.sin(theta) + y * Math.cos(theta);
  return new Phaser.Math.Vector2(x_rot, y_rot);
}

// Phaser game config
const config = {
  type: Phaser.WEBGL,
  width: 950,
  height: 500,
  scene: [BootScene, CountdownScene, MainScene, HeatmapScene],
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0 },
      debug: false
    }
  },
  backgroundColor: '#2EBB2E'
};

const game = new Phaser.Game(config);

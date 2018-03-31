function webGLStart() {
    var canvas = document.getElementById("myCanvas");
    initGL(canvas);
    initShaders();
    initBuffers();
    initTexture();
    initWorldObjects();

    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    document.onkeydown = handleKeyDown;
    document.onkeyup = handleKeyUp;

    tick();
}

function initWorldObjects() {
    var numOctagons = 50;
    for (var i = 0; i < numOctagons; i++) {
        octogons.push(new Octagon(i * 2, i / numOctagons));
    }

    var numCubes = 10;
    for (var i = 0; i < numCubes; i++) {
        cubeObstacles.push(new Cube(20 * i * i, Math.random() * 10));
    }
    cubeObstacles[0].z = 5;
}

var mvMatrix = mat4.create();
var mvMatrixStack = [];
var pMatrix = mat4.create();

var playerPos = {
    speedY: 0,
    speedZ: 0,
    x: 0,
    y: -1,
    z: 0,
    yaw: 0,
    pitch: 0,
    roll: 0
};

var tilt = 90;
var spin = 0;
var octogons = [];
var cubeObstacles = [];

function drawMain() {
    mat4.identity(mvMatrix);
    mat4.translate(mvMatrix, mvMatrix, [0.0, -playerPos.y, playerPos.z]);
    mat4.rotate(mvMatrix, mvMatrix, degToRad(-playerPos.roll), [0.0, 1.0, 0.0]);

    var twinkle = false;
    for (var i in octogons) {
        octogons[i].draw(tilt, spin, twinkle);
        spin += 0.0001;
    }

    for (var i in cubeObstacles) {
        cubeObstacles[i].draw();
    }
}

var lastTime = 0;

function animate() {
    var timeNow = new Date().getTime();
    if (lastTime != 0) {
        var elapsed = timeNow - lastTime;

        for (var i in octogons) {
            octogons[i].animate(elapsed);
        }

        for (var i in cubeObstacles) {
            cubeObstacles[i].animate(elapsed);
        }

        playerPos.z += elapsed / 1000;

        if (playerPos.y > -1) {
            playerPos.y -= 0.01;
        } else {
            playerPos.jump = 0;
        }
    }
    lastTime = timeNow;
}

function tick() {
    requestAnimFrame(tick);
    handleKeys();
    drawScene();
    animate();
}

function initBuffers() {
    OctagonInitBuffers();
    cubeinitBuffers();
}

function checkForCollision() {
    console.log(playerPos);
    for (var i = 0; i < cubeObstacles.length; i++) {
        console.log(cubeObstacles[i]);
    }
}

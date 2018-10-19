Game = function() {};

Game.PreStart = 0; // Havnt Started Playing
Game.Playing = 1; // Playing
Game.pastLastWall = 2; // Past Last Wall
Game.Won = 3; // Displaying Victory Screen
Game.Crashed = 4; // Crashed
Game.Lost = 5; // Displaying Losing Screen

Game.WinWaitTime = 1000;
Game.Max_Level = 5;
Game.winTime = 0;

Game.levelNum = 1; // Random Level

Game.state = Game.PreStart;

var startTime = new Date().getTime();
var loader;

function init() {
	// Setup our background music
	loader = new AsyncLoader();
	setupKeyboardHandlers();

	var gamecanvas = document.getElementById("gamecanvas");
	initGLonCanvas(gamecanvas);

	gl.clearColor(1.0, 1.0, 1.0, 1.0);
	gl.enable(gl.DEPTH_TEST);

	var pMatrix = mat4.create();
	mat4.perspective(
		60,
		gl.viewportWidth / gl.viewportHeight,
		0.1,
		1000.0,
		pMatrix
	);

	ball = new Ball();
	ball.initShader(pMatrix);

	tunnel = new Tunnel();
	tunnel.initShader(pMatrix);

	loadLevel();
	tick();
}

function loadLevel() {
	loader.load(
		"Assets/Levels/" + Game.levelNum + ".json",
		tunnel.LoadLevelCallback
	);
}

var paused = false;
var GlobalFlash = false;
function tick() {
	if (document.getElementById("Flash").checked) {
		GlobalFlash = !GlobalFlash;
	} else {
		GlobalFlash = false;
	}
	window.requestAnimationFrame(tick);
	if (!paused) {
		draw();
	}
}

function draw() {
	if (Game.state == Game.PreStart) {
		DrawIntroScreen();
	} else if (Game.state == Game.Lost) {
		DrawLostScreen();
	} else if (Game.state == Game.Won) {
		DrawWonScreen();
	} else {
		DrawGame();
	}
}

function DrawIntroScreen() {
	var div = document.getElementById("IntroDiv");
	if (div.style.display != "block") {
		div.style.display = "block";
	}
}

function DrawLostScreen() {
	var div = document.getElementById("LostDiv");
	if (div.style.display != "block") {
		div.style.opacity = 0.6;
		div.style.display == "block";
	}
}

function DrawWonScreen() {
	var div = document.getElementById("WinDiv");
	if (div.style.display != "block") {
		div.style.display == "block";
		div.style.opacity = 0.6;
		if (Game.levelNum > Game.Max_Level) {
			Game.levelNum++;
		}
	}
}

function DrawGame() {
	var currentTime = new Date().getTime();
	var elapsedTime = (currentTime - startTime) / 1000;
	startTime = currentTime;

	if (Game.state != Game.Crashed) {
		updateLevel(elapsedTime, currentTime);
	}

	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	tunnel.draw(currentTime, Game);

	if (Game.state != Game.Lost) {
		ball.draw(Game, currentTime);
	}
}

function updateLevel(elapsedTime, currentTime) {
	handleKeys();

	// Check if ball crashed
	if (ball.didCrash(tunnel)) {
		playSound("Assets/crash.mp3", 0, 1, 0);

		Game.state = Game.Crashed;
		setTimeout("Game.state = Game.Lost;", 5);
	}

	tunnel.offset += tunnel.speed * elapsedTime;

	if (Game.state != Game.Won && tunnel.pastLastWall()) {
		Game.state = Game.pastLastWall;
		Game.winTime = currentTime;
		setTimeout("Game.state = Game.Won;", Game.WinWaitTime);
	}

	if (tunnel.speed < tunnel.maxSpeed) {
		tunnel.speed += elapsedTime * tunnel.acceleration;
	}

	if (tunnel.speed > tunnel.maxSpeed) {
		tunnel.speed = tunnel.maxSpeed;
	}
}

function startGame() {
	document.getElementById("IntroDiv").style.display = "none";
	document.getElementById("tap_to_start").style.display = "none";
	startTime = new Date().getTime();
	Game.state = Game.Playing;
}

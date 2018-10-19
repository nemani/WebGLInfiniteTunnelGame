Ball = function() {
	var positionData = [-1, 1, 0, 1, 1, 0, -1, -1, 0, 1, -1, 0];
	this.positionBuffer = createArrayBuffer(positionData, 3);

	var maintexCoordData = [0, 1, 1, 1, 0, 0, 1, 0];
	this.maintexCoordBuffer = createArrayBuffer(maintexCoordData, 2);

	var glowtexCoordData = [0, 0, 1, 0, 0, 1, 1, 1];
	this.glowtexCoordBuffer = createArrayBuffer(glowtexCoordData, 2);

	this.zCollide = 10;
	this.angleCollide = 12;

	this.x = 0;
	this.y = -13;
	this.z = -30;

	this.ballGlow = 0;
	this.glowOffset = 0;

	this.rotationSpeed = 0;
	this.maxRotationSpeed = Math.PI;

	this.texture = new Texture("Assets/Ball/ball.png");
	this.glowTexture = new Texture("Assets/Ball/ball_glow.png");

	this.setMatrixUniforms = function(shader, glow) {
		var mvMatrix = mat4.create();
		mat4.identity(mvMatrix);

		var glowX = -this.glowOffset;
		var glowY = Math.abs(this.glowOffset / 2);
		var glowZ = 0;

		if (!glow) {
			mat4.translate(mvMatrix, [glowX, glowY, glowZ]);
		}

		if (this.ballGlow < 0.3) {
			this.ballGlow += 0.008;
		} else {
			this.ballGlow *= -1;
		}

		mat4.translate(mvMatrix, [this.x, this.y, this.z]);
		mat4.rotate(mvMatrix, 0.1, [0, 1, 0]);

		var ScaleX_Y = glow ? 5 + Math.abs(this.ballGlow) : 5;

		mat4.scale(mvMatrix, [ScaleX_Y, ScaleX_Y, 5]);

		this.mvMatrix = mvMatrix;
		gl.uniformMatrix4fv(shader.uniform["uMVMatrix"], false, mvMatrix);
	};
};

Ball.prototype.initShader = function(pMatrix) {
	var attributes = ["aPosition", "aTextureCoord"];
	var uniforms = [
		"uPMatrix",
		"uMVMatrix",
		"uSampler",
		"uAmbient",
		"uTransparency"
	];
	this.shader = loadShader("ball-quad", attributes, uniforms);
	gl.uniformMatrix4fv(this.shader.uniform["uPMatrix"], false, pMatrix);
};

Ball.prototype.draw = function(Game, currentTime) {
	gl.useProgram(this.shader);
	enableAttributes(this.shader);
	gl.activeTexture(gl.TEXTURE0);
	gl.uniform1i(this.shader.uniform["uSampler"], 0);

	var ball_ambient = 0;
	if (Game.state == Game.pastLastWall) {
		var t = (currentTime - Game.winTime) / Game.WinWaitTime;
		ball_ambient = linear(4, 50, t);
	} else {
		var t = tunnel.offset / 3 * tunnel.length / tunnel.lastWallPos;
		ball_ambient = linear(1.02, 4, t);
	}

	gl.uniform1f(this.shader.uniform["uAmbient"], ball_ambient);

	gl.enable(gl.BLEND);
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

	setVertexAttribs(this.shader, [
		this.positionBuffer,
		this.maintexCoordBuffer
	]);

	gl.disable(gl.DEPTH_TEST);

	gl.uniform1f(this.shader.uniform["uTransparency"], 1.0);
	this.setMatrixUniforms(this.shader, true);
	this.glowTexture.bind();

	gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

	gl.uniform1f(
		this.shader.uniform["uTransparency"],
		1.0 - ball_ambient / 40.0
	);

	setVertexAttribs(this.shader, [
		this.positionBuffer,
		this.glowtexCoordBuffer
	]);

	this.setMatrixUniforms(this.shader, false);
	this.texture.bind();

	// gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
	gl.enable(gl.DEPTH_TEST);

	gl.disable(gl.BLEND);

	disableAttributes(this.shader);
};

Ball.prototype.didCrash = function(tunnel) {
	var pos = tunnel.offset / 3 * tunnel.length - this.z;
	var angle = (3 * Math.PI / 2 - tunnel.angle) * RAD2DEG;
	angle = angle % 360;
	if (angle < 0) angle += 360;
	for (var i = 0; i < tunnel.walls.length; i++) {
		var w = tunnel.walls[i];
		if (
			-w.pos[2] < pos + this.zCollide &&
			-w.pos[2] > pos - this.zCollide
		) {
			var angle1 = w.angle1 * RAD2DEG;
			var angle2 = w.angle2 * RAD2DEG;
			angle1 = (angle1 - this.angleCollide) % 360;
			if (angle1 < 0) angle1 += 360;
			angle2 = (angle2 + this.angleCollide) % 360;
			if (angle2 < 0) angle2 += 360;
			if (
				(angle1 < angle2 && angle > angle1 && angle < angle2) ||
				(angle1 > angle2 && (angle > angle1 || angle < angle2))
			) {
				return true;
			}
		}
	}
	return false;
};

Ball.prototype.reset = function() {
	this.angle = 0;
	this.rotationSpeed = 0;
	this.glowOffset = 0;
};
var currentlyPressedKeys = {};

function setupKeyboardHandlers() {
    document.onkeydown = handleKeyDown;
    document.onkeyup = handleKeyUp;
}

function handleKeyDown(event) {
    if (event.keyCode == 32) {
        paused = !paused;
    }
    currentlyPressedKeys[event.keyCode] = true;
}

function handleKeyUp(event) {
    currentlyPressedKeys[event.keyCode] = false;
}

function handleKeys() {
    // console.log(currentlyPressedKeys);
    if (currentlyPressedKeys[37]) {
        // console.log("left");
        ball.rotationSpeed += 0.1;
    } else if (currentlyPressedKeys[39]) {
        // console.log("right");
        ball.rotationSpeed -= 0.1;
    }
    tunnel.angle = ball.rotationSpeed;
}
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
LoadState = function(url, callback, AsyncLoader) {
    this.url = url;
    this.request = new XMLHttpRequest();
    this.request.open("GET", url);
    this.callback = callback;
    var this_ = this;
    this.request.onreadystatechange = function() {
        if (this_.request.readyState == 4) {
            this_.AsyncLoader.remove(this);
            this_.callback.call(undefined, this_.request.responseText);
        }
    };
    this.AsyncLoader = AsyncLoader;
};

LoadState.prototype = {
    constructor: LoadState,
    start: function() {
        this.request.send();
    }
};

LoadImage = function(url, callback, AsyncLoader) {
    this.url = url;
    this.image = new Image();
    this.callback = callback;
    var this_ = this;
    this.image.onload = function() {
        this_.AsyncLoader.remove(this);
        this_.callback.call(undefined, this_.image);
    };
    this.AsyncLoader = AsyncLoader;
};

LoadImage.prototype = {
    constructor: LoadState,
    start: function() {
        this.image.src = this.url;
    }
};

AsyncLoader = function() {
    this.pending = [];
};

AsyncLoader.prototype = {
    constructor: AsyncLoader,
    load: function(url, callback) {
        var obj = new LoadState(url, callback, this);
        obj.index = this.pending.length;
        this.pending.push(obj);
        obj.start();
    },
    loadImage: function(url, callback) {
        var obj = new LoadImage(url, callback, this);
        obj.index = this.pending.length;
        this.pending.push(obj);
        obj.start();
    },
    loaded: function() {
        if (this.pending.length > 0) return false;
        else return true;
    },
    remove: function(obj) {
        if (this.pending.length > 1)
            this.pending[obj.index] = this.pending[this.pending.length - 1];
        this.pending.pop();
    }
};
Tunnel = function() {
    this.x = 0;
    this.y = 0;
    this.z = 0;

    this.length = 300;
    this.radius = 20;

    this.acceleration = 0.2;

    this.numSegments = 50;
    this.straightSegments = 10;
    this.angle = 0;

    var positionData = [];
    var textureCoordData = [];

    var segmentLength = this.length / this.numSegments;
    this.getTunnelOffset = function(segment) {
        if (segment < this.straightSegments + 1) return 0;
        var currSegment =
            (segment - this.straightSegments) /
            (this.numSegments - this.straightSegments);
        var angle = 2 * Math.PI;
        return this.radius * (Math.cos(currSegment * angle) - 1);
    };

    for (var segment = 0; segment < this.numSegments; segment++) {
        zStart = this.z - segment * segmentLength;
        zEnd = zStart - segmentLength;

        for (var subdiv = 0; subdiv <= 64; subdiv++) {
            var phi = subdiv * (1 / 8) * Math.PI * 30;

            var x = Math.cos(phi);
            var y = Math.sin(phi);

            positionData.push(
                this.radius * x + this.getTunnelOffset(segment + 1)
            );
            positionData.push(this.radius * y);
            positionData.push(zEnd);

            positionData.push(this.radius * x + this.getTunnelOffset(segment));
            positionData.push(this.radius * y);
            positionData.push(zStart);

            var u = subdiv / 30;

            textureCoordData.push(u);
            textureCoordData.push((segment + 1) * 3 / this.numSegments);

            textureCoordData.push(u);
            textureCoordData.push(segment * 3 / this.numSegments);
        }
    }

    this.positionBuffer = createArrayBuffer(positionData, 3);
    this.texCoordBuffer = createArrayBuffer(textureCoordData, 2);

    this.reset();

    this.texture = new Texture("Assets/Tunnel/bg" + Game.BGNum + ".png");
    this.wallTexture = new Texture("Assets/Wall/wall" + Game.WallNum + ".png");

    this.setMatrixUniforms = function(shader) {
        var mvMatrix = mat4.create();
        mat4.identity(mvMatrix);
        mat4.rotate(mvMatrix, this.angle, [0, 0, 1]);

        shader.mvWallMatrix = mat4.create(mvMatrix);
        gl.uniformMatrix4fv(shader.uniform["uMVMatrix"], false, mvMatrix);
    };

    this.setupLighting = function(currentTime, Game) {
        if (Game.state == Game.pastLastWall) {
            // If we are past the last wall, we want bright light
            var t = (currentTime - Game.winTime) / Game.WinWaitTime;
            var falloff = linear(0.002, 0.03, t);
            var ambient = linear(0.3, 0.6, t);
            // Loading uniforms to the shader
            gl.uniform1f(this.shader.uniform["uFalloff"], falloff);
            gl.uniform1f(this.shader.uniform["uAmbient"], ambient);
            gl.uniform1f(this.shader.uniform["uNearStrength"], 0.0);
        } else {
            // Brighten slowly over the length of the Tunnel.
            var t = this.offset / 3 * this.length / this.lastWallPos;

            var falloff = linear(0.0001, 0.002, t);
            var ambient = linear(0.05, 0.3, t);
            var shine = linear(0, 10, t);

            gl.uniform1f(this.shader.uniform["uFalloff"], falloff);
            gl.uniform1f(this.shader.uniform["uAmbient"], ambient);

            if (Game.state == Game.Crashed) {
                // Fade out during the explosion.
                gl.uniform1f(this.shader.uniform["uNearStrength"], 0.5 * 125);
            } else {
                gl.uniform1f(this.shader.uniform["uNearStrength"], 100.0);
            }

            // Setup the same lighting effects for the wall shader.
            gl.useProgram(this.wallShader);
            gl.uniform1f(this.wallShader.uniform["uShine"], shine);
            gl.uniform1f(this.wallShader.uniform["uFalloff"], falloff);
            gl.uniform1f(this.wallShader.uniform["uAmbient"], ambient);

            if (Game.state == Game.Crashed) {
                gl.uniform1f(
                    this.wallShader.uniform["uNearStrength"],
                    0.5 * 125
                );
            } else {
                gl.uniform1f(this.wallShader.uniform["uNearStrength"], 100.0);
            }

            // Restore the Tunnel shader.
            gl.useProgram(this.shader);
        }
    };
};

Tunnel.prototype.reset = function() {
    this.walls = [];
    this.lastWallPos = 150;

    this.angle = 0;
    this.offset = 0;

    // The Tunnel texture is actually what's moving.
    this.speed = 0.01;
    this.maxSpeed = 1;
    this.acceleration = 0.2;

    Game.BGNum = Math.floor(Math.random() * 5) + 1;
    Game.WallNum = Math.floor(Math.random() * 5) + 1;
};

Tunnel.prototype.initShader = function(pMatrix) {
    var attributes = ["aVertexPosition", "aTextureCoord"];
    var uniforms = [
        "uPMatrix",
        "uMVMatrix",
        "uTextureOffset",
        "uSampler",
        "uNearStrength",
        "uFalloff",
        "uAmbient",
        "uGreyscale"
    ];

    this.shader = loadShader("tunnel", attributes, uniforms);
    gl.uniform1i(this.shader.uniform["uSampler"], 0);
    gl.uniformMatrix4fv(this.shader.uniform["uPMatrix"], false, pMatrix);

    uniforms.push("uShine");

    this.wallShader = loadShader("wall", attributes, uniforms);
    gl.uniform1i(this.wallShader.uniform["uSampler"], 0);
    gl.uniformMatrix4fv(this.wallShader.uniform["uPMatrix"], false, pMatrix);
};

Tunnel.prototype.LoadLevelCallback = function(responseText) {
    var levelData = JSON.parse(responseText);
    tunnel.acceleration = levelData.speed;
    var walls = levelData.walls;
    for (var i = 0; i < walls.length; i++) {
        start = walls[i].angles[0] / RAD2DEG;
        end = walls[i].angles[1] / RAD2DEG;
        pos = walls[i].position;
        var nwall = new Wall(start, end, pos);
        tunnel.walls.push(nwall);

        if (walls[i].position > tunnel.lastWallPos) {
            tunnel.lastWallPos = walls[i].position;
        }
    }
    console.log(tunnel.lastWallPos);
};

Tunnel.prototype.draw = function(currentTime, Game) {
    gl.useProgram(this.shader); // Setup Shaders

    this.setupLighting(currentTime, Game);
    enableAttributes(this.shader);
    this.setMatrixUniforms(this.shader);

    setVertexAttribs(this.shader, [this.positionBuffer, this.texCoordBuffer]);

    gl.activeTexture(gl.TEXTURE0);
    this.texture.bind();
    gl.uniform1f(this.shader.uniform["uTextureOffset"], this.offset);

    var checked = document.getElementById("Grey").checked || GlobalFlash;
    gl.uniform1i(this.shader.uniform["uGreyscale"], checked);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.positionBuffer.numItems);

    // Disable the Tunnel shader, enable the wall shader.
    disableAttributes(this.shader);

    gl.useProgram(this.wallShader);

    enableAttributes(this.wallShader);

    this.wallTexture.bind();

    var wallOffset = this.offset / 3 * this.length;
    mat4.translate(this.shader.mvWallMatrix, [0, 0, wallOffset]);

    gl.uniform1i(this.wallShader.uniform["uGreyscale"], checked);

    for (var i = 0; i < this.walls.length; i++) {
        var transformedZ = this.walls[i].pos[2] + wallOffset;
        if (transformedZ < 0 && transformedZ > -this.length) {
            var segment = -transformedZ * this.numSegments / this.length;
            var transformedX = this.getTunnelOffset(segment);
            this.walls[i].draw(
                this.wallShader,
                this.shader.mvWallMatrix,
                transformedX,
                this
            );
        }
    }

    disableAttributes(this.wallShader);
};

Tunnel.prototype.pastLastWall = function() {
    return this.offset / 3 * this.length > this.lastWallPos;
};
var RAD2DEG = 180 / Math.PI;

var gl;

function initGLonCanvas(canvas) {
    gl = canvas.getContext("webgl");

    if (!gl) {
        alert("Failed to create WebGL context");
    }

    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;
}

var html5SoundChannels = [];

function linear(a, b, t) {
    return a + (b - a) * t;
}

function playSound(file, loops, volume) {
    if (!html5SoundChannels[file]) {
        var audio = new Audio(file);
        if (loops) audio.loop = "true";
        audio.volume = volume;
        audio.preload = "auto";
        html5SoundChannels[file] = audio;
        html5SoundChannels[file].play();
    } else {
        html5SoundChannels[file].play();
    }
}

function createArrayBuffer(data, itemSize) {
    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    buffer.itemSize = itemSize;
    buffer.numItems = data.length / itemSize;
    return buffer;
}

function setVertexAttribs(shader, buffers) {
    var count = Math.min(shader.attributes.length, buffers.length);
    for (var i = 0; i < count; i++) {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers[i]);
        gl.vertexAttribPointer(
            shader.attributes[i],
            buffers[i].itemSize,
            gl.FLOAT,
            false,
            0,
            0
        );
    }
}

function getShader(gl, id) {
    var script = document
        .getElementById("shaders")
        .contentWindow.document.getElementById(id);
    if (!script) {
        return null;
    }
    var str = "";
    var k = script.firstChild;
    while (k) {
        if (k.nodeType == 3) {
            str += k.textContent;
        }
        k = k.nextSibling;
    }
    var shader;
    if (script.type == "x-shader/x-fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (script.type == "x-shader/x-vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }

    gl.shaderSource(shader, str);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.debug(gl.getShaderInfoLog(shader));
        alert("Failed to compile shader");
        return null;
    }
    return shader;
}

function loadShader(source, attributes, uniforms) {
    var shader = gl.createProgram();
    var vs = getShader(gl, source + "-vs");
    var fs = getShader(gl, source + "-fs");
    gl.attachShader(shader, vs);
    gl.attachShader(shader, fs);
    gl.linkProgram(shader);

    if (!gl.getProgramParameter(shader, gl.LINK_STATUS)) {
        console.debug("Program Log: " + gl.getProgramInfoLog(shader));
        alert("Could not initialize shaders");
    }

    gl.useProgram(shader);
    shader.attributes = [];
    shader.uniform = [];
    // Attribs which we can change
    for (var attrNum = 0; attrNum < attributes.length; attrNum++)
        shader.attributes.push(
            gl.getAttribLocation(shader, attributes[attrNum])
        );
    // Uniforms
    for (var uniformNum = 0; uniformNum < uniforms.length; uniformNum++) {
        var uniform = uniforms[uniformNum];
        shader.uniform[uniform] = gl.getUniformLocation(shader, uniform);
    }
    return shader;
}

function enableAttributes(shader) {
    for (var i = 0; i < shader.attributes.length; i++) {
        if (shader.attributes[i] >= 0)
            gl.enableVertexAttribArray(shader.attributes[i]);
    }
}

function disableAttributes(shader) {
    for (var i = 0; i < shader.attributes.length; i++) {
        if (shader.attributes[i] >= 0)
            gl.disableVertexAttribArray(shader.attributes[i]);
    }
}

Texture = function(filename) {
    var texId = gl.createTexture();

    function handleLoaded(img) {
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.bindTexture(gl.TEXTURE_2D, texId);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            img
        );
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(
            gl.TEXTURE_2D,
            gl.TEXTURE_MIN_FILTER,
            gl.LINEAR_MIPMAP_LINEAR
        );
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }
    this.texId = texId;
    loader.loadImage(filename, handleLoaded);
};

Texture.prototype = {
    bind: function() {
        gl.bindTexture(gl.TEXTURE_2D, this.texId);
    }
};
Wall = function(angle1, angle2, z) {
    radius = tunnel.radius;

    this.angle1 = angle1;
    this.angle2 = angle2;
    this.scale = 2 * radius;

    this.x1 = Math.cos(angle1) * radius;
    this.x2 = Math.cos(angle2) * radius;

    this.y1 = Math.sin(angle1) * radius;
    this.y2 = Math.sin(angle2) * radius;

    // Angle perpendicular to the line from x1, y1 to x2, y2
    this.angle = Math.atan2(this.y2 - this.y1, this.x2 - this.x1) + Math.PI;

    // Need to Normalize
    var dirX = this.x2 - this.x1;
    var dirY = this.y2 - this.y1;

    var dirLen = Math.sqrt(dirX * dirX + dirY * dirY);

    dirX /= dirLen;
    dirY /= dirLen;

    var midX = (this.x1 + this.x2) / 2;
    var midY = (this.y1 + this.y2) / 2;

    var QuadX = midX + radius * dirX;
    var QuadY = midY + radius * dirY;
    var QuadZ = -z;

    // Set bottom left corner of quad
    this.pos = vec3.create([QuadX, QuadY, QuadZ]);
    this.quadrant = new Quadrant();
};

Wall.prototype.draw = function(shaderProgram, matrix, transformedX) {
    var pos2 = [this.pos[0] + transformedX, this.pos[1], this.pos[2]];
    gl.uniform1f(shaderProgram.uniform["uTextureOffset"], 0);
    this.quadrant.draw(shaderProgram, matrix, pos2, this.angle, this.scale);
};

Quadrant = function() {
    if (!Quadrant.positionBuffer) {
        var positionData = [0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 1, 0];
        var textureCoordData = [0, 0, 0, 1, 1, 0, 1, 1];

        Quadrant.positionBuffer = createArrayBuffer(positionData, 3);
        Quadrant.texCoordBuffer = createArrayBuffer(textureCoordData, 2);
    }

    this.positionBuffer = Quadrant.positionBuffer;
    this.texCoordBuffer = Quadrant.texCoordBuffer;

    this.setMatrixUniforms = function(shader, matrix, pos, angle, scale) {
        var mvMatrix = mat4.create(matrix);
        mat4.translate(mvMatrix, pos);
        mat4.rotate(mvMatrix, angle, [0, 0, 1]);
        mat4.scale(mvMatrix, [scale, scale, scale]);
        gl.uniformMatrix4fv(shader.uniform["uMVMatrix"], false, mvMatrix);
    };
};

Quadrant.prototype.draw = function(shaderProgram, matrix, pos, angle, scale) {
    this.setMatrixUniforms(shaderProgram, matrix, pos, angle, scale);
    setVertexAttribs(shaderProgram, [this.positionBuffer, this.texCoordBuffer]);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.positionBuffer.numItems);
};
Ball = function() {
	var positionData = [-1, 1, 0, 1, 1, 0, -1, -1, 0, 1, -1, 0];
	this.positionBuffer = createArrayBuffer(positionData, 3);

	var maintexCoordData = [0, 1, 1, 1, 0, 0, 1, 0];
	this.maintexCoordBuffer = createArrayBuffer(maintexCoordData, 2);

	var glowtexCoordData = [0, 0, 1, 0, 0, 1, 1, 1];
	this.glowtexCoordBuffer = createArrayBuffer(glowtexCoordData, 2);

	this.zCollide = 10;
	this.angleCollide = 12;

	this.x = 0;
	this.y = -13;
	this.z = -30;

	this.ballGlow = 0;
	this.glowOffset = 0;

	this.rotationSpeed = 0;
	this.maxRotationSpeed = Math.PI;

	this.texture = new Texture("Assets/Ball/ball.png");
	this.glowTexture = new Texture("Assets/Ball/ball_glow.png");

	this.setMatrixUniforms = function(shader, glow) {
		var mvMatrix = mat4.create();
		mat4.identity(mvMatrix);

		var glowX = -this.glowOffset;
		var glowY = Math.abs(this.glowOffset / 2);
		var glowZ = 0;

		if (!glow) {
			mat4.translate(mvMatrix, [glowX, glowY, glowZ]);
		}

		if (this.ballGlow < 0.3) {
			this.ballGlow += 0.008;
		} else {
			this.ballGlow *= -1;
		}

		mat4.translate(mvMatrix, [this.x, this.y, this.z]);
		mat4.rotate(mvMatrix, 0.1, [0, 1, 0]);

		var ScaleX_Y = glow ? 5 + Math.abs(this.ballGlow) : 5;

		mat4.scale(mvMatrix, [ScaleX_Y, ScaleX_Y, 5]);

		this.mvMatrix = mvMatrix;
		gl.uniformMatrix4fv(shader.uniform["uMVMatrix"], false, mvMatrix);
	};
};

Ball.prototype.initShader = function(pMatrix) {
	var attributes = ["aPosition", "aTextureCoord"];
	var uniforms = [
		"uPMatrix",
		"uMVMatrix",
		"uSampler",
		"uAmbient",
		"uTransparency"
	];
	this.shader = loadShader("ball-quad", attributes, uniforms);
	gl.uniformMatrix4fv(this.shader.uniform["uPMatrix"], false, pMatrix);
};

Ball.prototype.draw = function(Game, currentTime) {
	gl.useProgram(this.shader);
	enableAttributes(this.shader);
	gl.activeTexture(gl.TEXTURE0);
	gl.uniform1i(this.shader.uniform["uSampler"], 0);

	var ball_ambient = 0;
	if (Game.state == Game.pastLastWall) {
		var t = (currentTime - Game.winTime) / Game.WinWaitTime;
		ball_ambient = linear(4, 50, t);
	} else {
		var t = tunnel.offset / 3 * tunnel.length / tunnel.lastWallPos;
		ball_ambient = linear(1.02, 4, t);
	}

	gl.uniform1f(this.shader.uniform["uAmbient"], ball_ambient);

	gl.enable(gl.BLEND);
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

	setVertexAttribs(this.shader, [
		this.positionBuffer,
		this.maintexCoordBuffer
	]);

	gl.disable(gl.DEPTH_TEST);

	gl.uniform1f(this.shader.uniform["uTransparency"], 1.0);
	this.setMatrixUniforms(this.shader, true);
	this.glowTexture.bind();

	gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

	gl.uniform1f(
		this.shader.uniform["uTransparency"],
		1.0 - ball_ambient / 40.0
	);

	setVertexAttribs(this.shader, [
		this.positionBuffer,
		this.glowtexCoordBuffer
	]);

	this.setMatrixUniforms(this.shader, false);
	this.texture.bind();

	// gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
	gl.enable(gl.DEPTH_TEST);

	gl.disable(gl.BLEND);

	disableAttributes(this.shader);
};

Ball.prototype.didCrash = function(tunnel) {
	var pos = tunnel.offset / 3 * tunnel.length - this.z;
	var angle = (3 * Math.PI / 2 - tunnel.angle) * RAD2DEG;
	angle = angle % 360;
	if (angle < 0) angle += 360;
	for (var i = 0; i < tunnel.walls.length; i++) {
		var w = tunnel.walls[i];
		if (
			-w.pos[2] < pos + this.zCollide &&
			-w.pos[2] > pos - this.zCollide
		) {
			var angle1 = w.angle1 * RAD2DEG;
			var angle2 = w.angle2 * RAD2DEG;
			angle1 = (angle1 - this.angleCollide) % 360;
			if (angle1 < 0) angle1 += 360;
			angle2 = (angle2 + this.angleCollide) % 360;
			if (angle2 < 0) angle2 += 360;
			if (
				(angle1 < angle2 && angle > angle1 && angle < angle2) ||
				(angle1 > angle2 && (angle > angle1 || angle < angle2))
			) {
				return true;
			}
		}
	}
	return false;
};

Ball.prototype.reset = function() {
	this.angle = 0;
	this.rotationSpeed = 0;
	this.glowOffset = 0;
};
var currentlyPressedKeys = {};

function setupKeyboardHandlers() {
    document.onkeydown = handleKeyDown;
    document.onkeyup = handleKeyUp;
}

function handleKeyDown(event) {
    if (event.keyCode == 32) {
        paused = !paused;
    }
    currentlyPressedKeys[event.keyCode] = true;
}

function handleKeyUp(event) {
    currentlyPressedKeys[event.keyCode] = false;
}

function handleKeys() {
    // console.log(currentlyPressedKeys);
    if (currentlyPressedKeys[37]) {
        // console.log("left");
        ball.rotationSpeed += 0.1;
    } else if (currentlyPressedKeys[39]) {
        // console.log("right");
        ball.rotationSpeed -= 0.1;
    }
    tunnel.angle = ball.rotationSpeed;
}
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
LoadState = function(url, callback, AsyncLoader) {
    this.url = url;
    this.request = new XMLHttpRequest();
    this.request.open("GET", url);
    this.callback = callback;
    var this_ = this;
    this.request.onreadystatechange = function() {
        if (this_.request.readyState == 4) {
            this_.AsyncLoader.remove(this);
            this_.callback.call(undefined, this_.request.responseText);
        }
    };
    this.AsyncLoader = AsyncLoader;
};

LoadState.prototype = {
    constructor: LoadState,
    start: function() {
        this.request.send();
    }
};

LoadImage = function(url, callback, AsyncLoader) {
    this.url = url;
    this.image = new Image();
    this.callback = callback;
    var this_ = this;
    this.image.onload = function() {
        this_.AsyncLoader.remove(this);
        this_.callback.call(undefined, this_.image);
    };
    this.AsyncLoader = AsyncLoader;
};

LoadImage.prototype = {
    constructor: LoadState,
    start: function() {
        this.image.src = this.url;
    }
};

AsyncLoader = function() {
    this.pending = [];
};

AsyncLoader.prototype = {
    constructor: AsyncLoader,
    load: function(url, callback) {
        var obj = new LoadState(url, callback, this);
        obj.index = this.pending.length;
        this.pending.push(obj);
        obj.start();
    },
    loadImage: function(url, callback) {
        var obj = new LoadImage(url, callback, this);
        obj.index = this.pending.length;
        this.pending.push(obj);
        obj.start();
    },
    loaded: function() {
        if (this.pending.length > 0) return false;
        else return true;
    },
    remove: function(obj) {
        if (this.pending.length > 1)
            this.pending[obj.index] = this.pending[this.pending.length - 1];
        this.pending.pop();
    }
};
Tunnel = function() {
    this.x = 0;
    this.y = 0;
    this.z = 0;

    this.length = 300;
    this.radius = 20;

    this.acceleration = 0.2;

    this.numSegments = 50;
    this.straightSegments = 10;
    this.angle = 0;

    var positionData = [];
    var textureCoordData = [];

    var segmentLength = this.length / this.numSegments;
    this.getTunnelOffset = function(segment) {
        if (segment < this.straightSegments + 1) return 0;
        var currSegment =
            (segment - this.straightSegments) /
            (this.numSegments - this.straightSegments);
        var angle = 2 * Math.PI;
        return this.radius * (Math.cos(currSegment * angle) - 1);
    };

    for (var segment = 0; segment < this.numSegments; segment++) {
        zStart = this.z - segment * segmentLength;
        zEnd = zStart - segmentLength;

        for (var subdiv = 0; subdiv <= 64; subdiv++) {
            var phi = subdiv * (1 / 8) * Math.PI * 30;

            var x = Math.cos(phi);
            var y = Math.sin(phi);

            positionData.push(
                this.radius * x + this.getTunnelOffset(segment + 1)
            );
            positionData.push(this.radius * y);
            positionData.push(zEnd);

            positionData.push(this.radius * x + this.getTunnelOffset(segment));
            positionData.push(this.radius * y);
            positionData.push(zStart);

            var u = subdiv / 30;

            textureCoordData.push(u);
            textureCoordData.push((segment + 1) * 3 / this.numSegments);

            textureCoordData.push(u);
            textureCoordData.push(segment * 3 / this.numSegments);
        }
    }

    this.positionBuffer = createArrayBuffer(positionData, 3);
    this.texCoordBuffer = createArrayBuffer(textureCoordData, 2);

    this.reset();

    this.texture = new Texture("Assets/Tunnel/bg" + Game.BGNum + ".png");
    this.wallTexture = new Texture("Assets/Wall/wall" + Game.WallNum + ".png");

    this.setMatrixUniforms = function(shader) {
        var mvMatrix = mat4.create();
        mat4.identity(mvMatrix);
        mat4.rotate(mvMatrix, this.angle, [0, 0, 1]);

        shader.mvWallMatrix = mat4.create(mvMatrix);
        gl.uniformMatrix4fv(shader.uniform["uMVMatrix"], false, mvMatrix);
    };

    this.setupLighting = function(currentTime, Game) {
        if (Game.state == Game.pastLastWall) {
            // If we are past the last wall, we want bright light
            var t = (currentTime - Game.winTime) / Game.WinWaitTime;
            var falloff = linear(0.002, 0.03, t);
            var ambient = linear(0.3, 0.6, t);
            // Loading uniforms to the shader
            gl.uniform1f(this.shader.uniform["uFalloff"], falloff);
            gl.uniform1f(this.shader.uniform["uAmbient"], ambient);
            gl.uniform1f(this.shader.uniform["uNearStrength"], 0.0);
        } else {
            // Brighten slowly over the length of the Tunnel.
            var t = this.offset / 3 * this.length / this.lastWallPos;

            var falloff = linear(0.0001, 0.002, t);
            var ambient = linear(0.05, 0.3, t);
            var shine = linear(0, 10, t);

            gl.uniform1f(this.shader.uniform["uFalloff"], falloff);
            gl.uniform1f(this.shader.uniform["uAmbient"], ambient);

            if (Game.state == Game.Crashed) {
                // Fade out during the explosion.
                gl.uniform1f(this.shader.uniform["uNearStrength"], 0.5 * 125);
            } else {
                gl.uniform1f(this.shader.uniform["uNearStrength"], 100.0);
            }

            // Setup the same lighting effects for the wall shader.
            gl.useProgram(this.wallShader);
            gl.uniform1f(this.wallShader.uniform["uShine"], shine);
            gl.uniform1f(this.wallShader.uniform["uFalloff"], falloff);
            gl.uniform1f(this.wallShader.uniform["uAmbient"], ambient);

            if (Game.state == Game.Crashed) {
                gl.uniform1f(
                    this.wallShader.uniform["uNearStrength"],
                    0.5 * 125
                );
            } else {
                gl.uniform1f(this.wallShader.uniform["uNearStrength"], 100.0);
            }

            // Restore the Tunnel shader.
            gl.useProgram(this.shader);
        }
    };
};

Tunnel.prototype.reset = function() {
    this.walls = [];
    this.lastWallPos = 150;

    this.angle = 0;
    this.offset = 0;

    // The Tunnel texture is actually what's moving.
    this.speed = 0.01;
    this.maxSpeed = 1;
    this.acceleration = 0.2;

    Game.BGNum = Math.floor(Math.random() * 5) + 1;
    Game.WallNum = Math.floor(Math.random() * 5) + 1;
};

Tunnel.prototype.initShader = function(pMatrix) {
    var attributes = ["aVertexPosition", "aTextureCoord"];
    var uniforms = [
        "uPMatrix",
        "uMVMatrix",
        "uTextureOffset",
        "uSampler",
        "uNearStrength",
        "uFalloff",
        "uAmbient",
        "uGreyscale"
    ];

    this.shader = loadShader("tunnel", attributes, uniforms);
    gl.uniform1i(this.shader.uniform["uSampler"], 0);
    gl.uniformMatrix4fv(this.shader.uniform["uPMatrix"], false, pMatrix);

    uniforms.push("uShine");

    this.wallShader = loadShader("wall", attributes, uniforms);
    gl.uniform1i(this.wallShader.uniform["uSampler"], 0);
    gl.uniformMatrix4fv(this.wallShader.uniform["uPMatrix"], false, pMatrix);
};

Tunnel.prototype.LoadLevelCallback = function(responseText) {
    var levelData = JSON.parse(responseText);
    tunnel.acceleration = levelData.speed;
    var walls = levelData.walls;
    for (var i = 0; i < walls.length; i++) {
        start = walls[i].angles[0] / RAD2DEG;
        end = walls[i].angles[1] / RAD2DEG;
        pos = walls[i].position;
        var nwall = new Wall(start, end, pos);
        tunnel.walls.push(nwall);

        if (walls[i].position > tunnel.lastWallPos) {
            tunnel.lastWallPos = walls[i].position;
        }
    }
    console.log(tunnel.lastWallPos);
};

Tunnel.prototype.draw = function(currentTime, Game) {
    gl.useProgram(this.shader); // Setup Shaders

    this.setupLighting(currentTime, Game);
    enableAttributes(this.shader);
    this.setMatrixUniforms(this.shader);

    setVertexAttribs(this.shader, [this.positionBuffer, this.texCoordBuffer]);

    gl.activeTexture(gl.TEXTURE0);
    this.texture.bind();
    gl.uniform1f(this.shader.uniform["uTextureOffset"], this.offset);

    var checked = document.getElementById("Grey").checked || GlobalFlash;
    gl.uniform1i(this.shader.uniform["uGreyscale"], checked);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.positionBuffer.numItems);

    // Disable the Tunnel shader, enable the wall shader.
    disableAttributes(this.shader);

    gl.useProgram(this.wallShader);

    enableAttributes(this.wallShader);

    this.wallTexture.bind();

    var wallOffset = this.offset / 3 * this.length;
    mat4.translate(this.shader.mvWallMatrix, [0, 0, wallOffset]);

    gl.uniform1i(this.wallShader.uniform["uGreyscale"], checked);

    for (var i = 0; i < this.walls.length; i++) {
        var transformedZ = this.walls[i].pos[2] + wallOffset;
        if (transformedZ < 0 && transformedZ > -this.length) {
            var segment = -transformedZ * this.numSegments / this.length;
            var transformedX = this.getTunnelOffset(segment);
            this.walls[i].draw(
                this.wallShader,
                this.shader.mvWallMatrix,
                transformedX,
                this
            );
        }
    }

    disableAttributes(this.wallShader);
};

Tunnel.prototype.pastLastWall = function() {
    return this.offset / 3 * this.length > this.lastWallPos;
};
var RAD2DEG = 180 / Math.PI;

var gl;

function initGLonCanvas(canvas) {
    gl = canvas.getContext("webgl");

    if (!gl) {
        alert("Failed to create WebGL context");
    }

    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;
}

var html5SoundChannels = [];

function linear(a, b, t) {
    return a + (b - a) * t;
}

function playSound(file, loops, volume) {
    if (!html5SoundChannels[file]) {
        var audio = new Audio(file);
        if (loops) audio.loop = "true";
        audio.volume = volume;
        audio.preload = "auto";
        html5SoundChannels[file] = audio;
        html5SoundChannels[file].play();
    } else {
        html5SoundChannels[file].play();
    }
}

function createArrayBuffer(data, itemSize) {
    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    buffer.itemSize = itemSize;
    buffer.numItems = data.length / itemSize;
    return buffer;
}

function setVertexAttribs(shader, buffers) {
    var count = Math.min(shader.attributes.length, buffers.length);
    for (var i = 0; i < count; i++) {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers[i]);
        gl.vertexAttribPointer(
            shader.attributes[i],
            buffers[i].itemSize,
            gl.FLOAT,
            false,
            0,
            0
        );
    }
}

function getShader(gl, id) {
    var script = document
        .getElementById("shaders")
        .contentWindow.document.getElementById(id);
    if (!script) {
        return null;
    }
    var str = "";
    var k = script.firstChild;
    while (k) {
        if (k.nodeType == 3) {
            str += k.textContent;
        }
        k = k.nextSibling;
    }
    var shader;
    if (script.type == "x-shader/x-fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (script.type == "x-shader/x-vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }

    gl.shaderSource(shader, str);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.debug(gl.getShaderInfoLog(shader));
        alert("Failed to compile shader");
        return null;
    }
    return shader;
}

function loadShader(source, attributes, uniforms) {
    var shader = gl.createProgram();
    var vs = getShader(gl, source + "-vs");
    var fs = getShader(gl, source + "-fs");
    gl.attachShader(shader, vs);
    gl.attachShader(shader, fs);
    gl.linkProgram(shader);

    if (!gl.getProgramParameter(shader, gl.LINK_STATUS)) {
        console.debug("Program Log: " + gl.getProgramInfoLog(shader));
        alert("Could not initialize shaders");
    }

    gl.useProgram(shader);
    shader.attributes = [];
    shader.uniform = [];
    // Attribs which we can change
    for (var attrNum = 0; attrNum < attributes.length; attrNum++)
        shader.attributes.push(
            gl.getAttribLocation(shader, attributes[attrNum])
        );
    // Uniforms
    for (var uniformNum = 0; uniformNum < uniforms.length; uniformNum++) {
        var uniform = uniforms[uniformNum];
        shader.uniform[uniform] = gl.getUniformLocation(shader, uniform);
    }
    return shader;
}

function enableAttributes(shader) {
    for (var i = 0; i < shader.attributes.length; i++) {
        if (shader.attributes[i] >= 0)
            gl.enableVertexAttribArray(shader.attributes[i]);
    }
}

function disableAttributes(shader) {
    for (var i = 0; i < shader.attributes.length; i++) {
        if (shader.attributes[i] >= 0)
            gl.disableVertexAttribArray(shader.attributes[i]);
    }
}

Texture = function(filename) {
    var texId = gl.createTexture();

    function handleLoaded(img) {
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.bindTexture(gl.TEXTURE_2D, texId);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            img
        );
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(
            gl.TEXTURE_2D,
            gl.TEXTURE_MIN_FILTER,
            gl.LINEAR_MIPMAP_LINEAR
        );
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }
    this.texId = texId;
    loader.loadImage(filename, handleLoaded);
};

Texture.prototype = {
    bind: function() {
        gl.bindTexture(gl.TEXTURE_2D, this.texId);
    }
};
Wall = function(angle1, angle2, z) {
    radius = tunnel.radius;

    this.angle1 = angle1;
    this.angle2 = angle2;
    this.scale = 2 * radius;

    this.x1 = Math.cos(angle1) * radius;
    this.x2 = Math.cos(angle2) * radius;

    this.y1 = Math.sin(angle1) * radius;
    this.y2 = Math.sin(angle2) * radius;

    // Angle perpendicular to the line from x1, y1 to x2, y2
    this.angle = Math.atan2(this.y2 - this.y1, this.x2 - this.x1) + Math.PI;

    // Need to Normalize
    var dirX = this.x2 - this.x1;
    var dirY = this.y2 - this.y1;

    var dirLen = Math.sqrt(dirX * dirX + dirY * dirY);

    dirX /= dirLen;
    dirY /= dirLen;

    var midX = (this.x1 + this.x2) / 2;
    var midY = (this.y1 + this.y2) / 2;

    var QuadX = midX + radius * dirX;
    var QuadY = midY + radius * dirY;
    var QuadZ = -z;

    // Set bottom left corner of quad
    this.pos = vec3.create([QuadX, QuadY, QuadZ]);
    this.quadrant = new Quadrant();
};

Wall.prototype.draw = function(shaderProgram, matrix, transformedX) {
    var pos2 = [this.pos[0] + transformedX, this.pos[1], this.pos[2]];
    gl.uniform1f(shaderProgram.uniform["uTextureOffset"], 0);
    this.quadrant.draw(shaderProgram, matrix, pos2, this.angle, this.scale);
};

Quadrant = function() {
    if (!Quadrant.positionBuffer) {
        var positionData = [0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 1, 0];
        var textureCoordData = [0, 0, 0, 1, 1, 0, 1, 1];

        Quadrant.positionBuffer = createArrayBuffer(positionData, 3);
        Quadrant.texCoordBuffer = createArrayBuffer(textureCoordData, 2);
    }

    this.positionBuffer = Quadrant.positionBuffer;
    this.texCoordBuffer = Quadrant.texCoordBuffer;

    this.setMatrixUniforms = function(shader, matrix, pos, angle, scale) {
        var mvMatrix = mat4.create(matrix);
        mat4.translate(mvMatrix, pos);
        mat4.rotate(mvMatrix, angle, [0, 0, 1]);
        mat4.scale(mvMatrix, [scale, scale, scale]);
        gl.uniformMatrix4fv(shader.uniform["uMVMatrix"], false, mvMatrix);
    };
};

Quadrant.prototype.draw = function(shaderProgram, matrix, pos, angle, scale) {
    this.setMatrixUniforms(shaderProgram, matrix, pos, angle, scale);
    setVertexAttribs(shaderProgram, [this.positionBuffer, this.texCoordBuffer]);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.positionBuffer.numItems);
};

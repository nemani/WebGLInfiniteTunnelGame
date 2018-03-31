function Cube(startingDistance, rotationSpeed) {
	this.angle = 0;
	this.z = startingDistance;
	this.rotationSpeed = rotationSpeed;
	this.randomiseColors();
}

Cube.prototype.draw = function() {
	mvPushMatrix();

	mat4.translate(mvMatrix, mvMatrix, [0, 0, -this.z]);
	mat4.rotate(mvMatrix, mvMatrix, degToRad(this.angle), [0.0, 0.0, 1.0]);
	mat4.rotate(mvMatrix, mvMatrix, degToRad(tilt), [0.0, 0.0, 1.0]);

	gl.uniform3f(shaderProgram.colorUniform, this.r, this.g, this.b);
	drawCube();
	mvPopMatrix();
};

Cube.prototype.animate = function(elapsedTime) {
	this.angle += this.rotationSpeed * effectiveFPMS;
};

Cube.prototype.randomiseColors = function() {
	// Give the star a random color for normal
	// circumstances...
	this.r = Math.random();
	this.g = Math.random();
	this.b = Math.random();
};

function drawCube() {
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, starTexture);
	gl.uniform1i(shaderProgram.samplerUniform, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexTextureCoordBuffer);
	gl.vertexAttribPointer(
		shaderProgram.textureCoordAttribute,
		cubeVertexTextureCoordBuffer.itemSize,
		gl.FLOAT,
		false,
		0,
		0
	);

	gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
	gl.vertexAttribPointer(
		shaderProgram.vertexPositionAttribute,
		cubeVertexPositionBuffer.itemSize,
		gl.FLOAT,
		false,
		0,
		0
	);

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
	setMatrixUniforms();

	gl.uniform3f(shaderProgram.colorUniform, 1, 1, 1);

	gl.drawElements(
		gl.TRIANGLES,
		cubeVertexIndexBuffer.numItems,
		gl.UNSIGNED_SHORT,
		0
	);
}

var cubeVertexPositionBuffer;
var cubeVertexTextureCoordBuffer;
var cubeVertexIndexBuffer;

function cubeinitBuffers() {
	cubeVertexPositionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
	x = 0.2;
	y = 10;
	z = 1;
	//prettier-ignore
	vertices = [
            // Front face
            -x, -y,  z,
             x, -y,  z,
             x,  y,  z,
            -x,  y,  z,

            // Back face
            -x, -y, -z,
            -x,  y, -z,
             x,  y, -z,
             x, -y, -z,

            // Top face
            -x,  y, -z,
            -x,  y,  z,
             x,  y,  z,
             x,  y, -z,

            // Bottom face
            -x, -y, -z,
             x, -y, -z,
             x, -y,  z,
            -x, -y,  z,

            // Right face
             x, -y, -z,
             x,  y, -z,
             x,  y,  z,
             x, -y,  z,

            // Left face
            -x, -y, -z,
            -x, -y,  z,
            -x,  y,  z,
            -x,  y, -z
        ];
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
	cubeVertexPositionBuffer.itemSize = 3;
	cubeVertexPositionBuffer.numItems = 24;

	cubeVertexTextureCoordBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexTextureCoordBuffer);
	//prettier-ignore
	var textureCoords = [
            // Front face
            0.0, 0.0,
            1.0, 0.0,
            1.0, 1.0,
            0.0, 1.0,

            // Back face
            1.0, 0.0,
            1.0, 1.0,
            0.0, 1.0,
            0.0, 0.0,

            // Top face
            0.0, 1.0,
            0.0, 0.0,
            1.0, 0.0,
            1.0, 1.0,

            // Bottom face
            1.0, 1.0,
            0.0, 1.0,
            0.0, 0.0,
            1.0, 0.0,

            // Right face
            1.0, 0.0,
            1.0, 1.0,
            0.0, 1.0,
            0.0, 0.0,

            // Left face
            0.0, 0.0,
            1.0, 0.0,
            1.0, 1.0,
            0.0, 1.0
        ];
	gl.bufferData(
		gl.ARRAY_BUFFER,
		new Float32Array(textureCoords),
		gl.STATIC_DRAW
	);
	cubeVertexTextureCoordBuffer.itemSize = 2;
	cubeVertexTextureCoordBuffer.numItems = 24;

	cubeVertexIndexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
	//prettier-ignore
	var cubeVertexIndices = [
            0, 1, 2,      0, 2, 3,    // Front face
            4, 5, 6,      4, 6, 7,    // Back face
            8, 9, 10,     8, 10, 11,  // Top face
            12, 13, 14,   12, 14, 15, // Bottom face
            16, 17, 18,   16, 18, 19, // Right face
            20, 21, 22,   20, 22, 23  // Left face
        ];
	gl.bufferData(
		gl.ELEMENT_ARRAY_BUFFER,
		new Uint16Array(cubeVertexIndices),
		gl.STATIC_DRAW
	);
	cubeVertexIndexBuffer.itemSize = 1;
	cubeVertexIndexBuffer.numItems = 36;
}

/*/ 
 cubeVertexNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexNormalBuffer);
    //prettier-ignore
    var vertexNormals = [
            // Top face
             0.0,  1.0,  0.0,
             0.0,  1.0,  0.0,
             0.0,  1.0,  0.0,
             0.0,  1.0,  0.0,

            // Bottom face
             0.0, -1.0,  0.0,
             0.0, -1.0,  0.0,
             0.0, -1.0,  0.0,
             0.0, -1.0,  0.0,

            // Right face
             1.0,  0.0,  0.0,
             1.0,  0.0,  0.0,
             1.0,  0.0,  0.0,
             1.0,  0.0,  0.0,

            // Left face
            -1.0,  0.0,  0.0,
            -1.0,  0.0,  0.0,
            -1.0,  0.0,  0.0,
            -1.0,  0.0,  0.0,
            
            // Top Left face
            -1.0,  1.0,  0.0,
            -1.0,  1.0,  0.0,
            -1.0,  1.0,  0.0,
            -1.0,  1.0,  0.0,

            // Top Right Face
             1.0,  1.0,  0.0,
             1.0,  1.0,  0.0,
             1.0,  1.0,  0.0,
             1.0,  1.0,  0.0,
 
            // Bottom Right Face
             1.0,  -1.0,  0.0,
             1.0,  -1.0,  0.0,
             1.0,  -1.0,  0.0,
             1.0,  -1.0,  0.0,

            // Bottom Left Face
             -1.0,  -1.0,  0.0,
             -1.0,  -1.0,  0.0,
             -1.0,  -1.0,  0.0,
             -1.0,  -1.0,  0.0
 
        ];
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(vertexNormals),
        gl.STATIC_DRAW
    );
    cubeVertexNormalBuffer.itemSize = 3;
    cubeVertexNormalBuffer.numItems = 32;

/*/
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
var gl;

function drawScene() {
    gl.enable(gl.DEPTH_TEST);

    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    mat4.perspective(
        pMatrix,
        45.0,
        gl.viewportWidth / gl.viewportHeight,
        0.1,
        20.0
    );

    drawMain();
}
function initGL(canvas) {
    try {
        gl = canvas.getContext("webgl");
        gl.viewportWidth = canvas.width;
        gl.viewportHeight = canvas.height;
    } catch (e) {}
    if (!gl) {
        alert("Could not initialise WebGL, sorry :-(");
    }
}

function getShader(gl, id) {
    var shaderScript = document.getElementById(id);
    if (!shaderScript) {
        return null;
    }

    var str = "";
    var k = shaderScript.firstChild;
    while (k) {
        if (k.nodeType == 3) {
            str += k.textContent;
        }
        k = k.nextSibling;
    }

    var shader;
    if (shaderScript.type == "x-shader/x-fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == "x-shader/x-vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }

    gl.shaderSource(shader, str);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}

var shaderProgram;

function initShaders() {
    var fragmentShader = getShader(gl, "shader-fs");
    var vertexShader = getShader(gl, "shader-vs");

    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
    }

    gl.useProgram(shaderProgram);

    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(
        shaderProgram,
        "aVertexPosition"
    );
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

    shaderProgram.textureCoordAttribute = gl.getAttribLocation(
        shaderProgram,
        "aTextureCoord"
    );
    gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);

    shaderProgram.pMatrixUniform = gl.getUniformLocation(
        shaderProgram,
        "uPMatrix"
    );
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(
        shaderProgram,
        "uMVMatrix"
    );
    shaderProgram.samplerUniform = gl.getUniformLocation(
        shaderProgram,
        "uSampler"
    );
    shaderProgram.colorUniform = gl.getUniformLocation(shaderProgram, "uColor");
}

function handleLoadedTexture(texture) {
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        texture.image
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    gl.bindTexture(gl.TEXTURE_2D, null);
}

var starTexture;

function initTexture() {
    starTexture = gl.createTexture();
    starTexture.image = new Image();
    starTexture.image.onload = function() {
        handleLoadedTexture(starTexture);
    };

    starTexture.image.src = "crate.gif";
}

function setMatrixUniforms() {
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}

function degToRad(degrees) {
    return degrees * Math.PI / 180;
}

function mvPushMatrix() {
    var copy = mat4.create();
    mat4.copy(copy, mvMatrix);
    mvMatrixStack.push(copy);
}

function mvPopMatrix() {
    if (mvMatrixStack.length == 0) {
        throw "Invalid popMatrix!";
    }
    mvMatrix = mvMatrixStack.pop();
}
var currentlyPressedKeys = {};

function handleKeyDown(event) {
	currentlyPressedKeys[event.keyCode] = true;
}

function handleKeyUp(event) {
	currentlyPressedKeys[event.keyCode] = false;
}

function handleKeys() {
	if (currentlyPressedKeys[32]) {
		// Space Pressed
		if (!playerPos.jump) {
			// if not jumped
			playerPos.jump = 1;
			playerPos.y += 1.8;
		}
	}
	if (currentlyPressedKeys[37]) {
		// Left cursor key
		tilt += 1;
	}
	if (currentlyPressedKeys[39]) {
		// Right cursor key
		tilt -= 1;
	}
	if (currentlyPressedKeys[38]) {
		// Up cursor key
		playerPos.z += 1;
	}
	if (currentlyPressedKeys[40]) {
		// Down cursor key
		playerPos.z -= 1;
	}
}
var tileVertexPositionBuffer;
var tileVertexTextureCoordBuffer;
var tileVertexIndexBuffer;

function OctagonInitBuffers() {
    tileVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tileVertexPositionBuffer);
    //prettier-ignore
    vertices = [
            // Top face
            -1.0,  2.0, -1,
            -1.0,  2.0,  1,
             1.0,  2.0,  1,
             1.0,  2.0, -1,

            // Bottom face
            -1.0, -2.0, -1,
             1.0, -2.0, -1,
             1.0, -2.0,  1,
            -1.0, -2.0,  1,

            // Right face
             2.0, -1.0, -1,
             2.0,  1.0, -1,
             2.0,  1.0,  1,
             2.0, -1.0,  1,

            // Left face
            -2.0, -1.0, -1,
            -2.0, -1.0,  1,
            -2.0,  1.0,  1,
            -2.0,  1.0, -1,

            // Top Left Face
            -1.0,  2.0, -1,   // 16 - 0
            -1.0,  2.0,  1,   // 17 - 1
            -2.0,  1.0,  1,   // 18 - 14
            -2.0,  1.0, -1,   // 19 - 15 
             
             // Top Right face
             1.0,  2.0,  1,   // 20 - 2
             1.0,  2.0, -1,   // 21 - 3
             2.0,  1.0, -1,   // 22 - 9
             2.0,  1.0,  1,   // 23 - 10

            // Bottom Right
            1.0, -2.0, -1,   // 24 - 5
            1.0, -2.0,  1,   // 25 - 6
            2.0, -1.0, -1,   // 26 - 8
            2.0, -1.0,  1,   // 27 - 11
            
            // Bottom Left
            -1.0, -2.0, -1,   // 28 
            -1.0, -2.0,  1,   // 29
            -2.0, -1.0, -1,   // 30
            -2.0, -1.0,  1,   // 31
        ];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    tileVertexPositionBuffer.itemSize = 3;
    tileVertexPositionBuffer.numItems = 32;

    tileVertexTextureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tileVertexTextureCoordBuffer);
    //prettier-ignore
    var textureCoords = [
            // Top face
            0.0, 1.0,
            0.0, 0.0,
            1.0, 0.0,
            1.0, 1.0,

            // Bottom face
            1.0, 1.0,
            0.0, 1.0,
            0.0, 0.0,
            1.0, 0.0,

            // Right face
            1.0, 0.0,
            1.0, 1.0,
            0.0, 1.0,
            0.0, 0.0,

            // Left face
            0.0, 0.0,
            1.0, 0.0,
            1.0, 1.0,
            0.0, 1.0,

            // Left face
            0.0, 0.0,
            1.0, 0.0,
            1.0, 1.0,
            0.0, 1.0,

            // Right face
            1.0, 0.0,
            1.0, 1.0,
            0.0, 1.0,
            0.0, 0.0,

            // Right face
            1.0, 0.0,
            1.0, 1.0,
            0.0, 1.0,
            0.0, 0.0,

            // Right face
            1.0, 0.0,
            1.0, 1.0,
            0.0, 1.0,
            0.0, 0.0,
        ];
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(textureCoords),
        gl.STATIC_DRAW
    );
    tileVertexTextureCoordBuffer.itemSize = 2;
    tileVertexTextureCoordBuffer.numItems = 32;

    tileVertexIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tileVertexIndexBuffer);
    //prettier-ignore
    var tileVertexIndices = [
             0, 1, 2,      0, 2, 3,     // Top     
             4, 5, 6,      4, 6, 7,     // Bottom
             8, 9, 10,     8, 10, 11,   // Right
            12, 13, 14,   12, 14, 15,   // Left
            16, 17, 18,   16, 18, 19,   // Top Left
            20, 21, 23,   21, 23, 22,   // Top Right
            24, 25, 26,   25, 26, 27,   // Bottom Right
            28, 29, 30,   29, 30, 31    // Bottom Left
        ];
    gl.bufferData(
        gl.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(tileVertexIndices),
        gl.STATIC_DRAW
    );
    tileVertexIndexBuffer.itemSize = 1;
    tileVertexIndexBuffer.numItems = 6 * 8;
}

function drawOctagon() {
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, starTexture);
    gl.uniform1i(shaderProgram.samplerUniform, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, tileVertexTextureCoordBuffer);
    gl.vertexAttribPointer(
        shaderProgram.textureCoordAttribute,
        tileVertexTextureCoordBuffer.itemSize,
        gl.FLOAT,
        false,
        0,
        0
    );

    gl.bindBuffer(gl.ARRAY_BUFFER, tileVertexPositionBuffer);
    gl.vertexAttribPointer(
        shaderProgram.vertexPositionAttribute,
        tileVertexPositionBuffer.itemSize,
        gl.FLOAT,
        false,
        0,
        0
    );

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tileVertexIndexBuffer);
    setMatrixUniforms();
    gl.drawElements(
        gl.TRIANGLES,
        tileVertexIndexBuffer.numItems,
        gl.UNSIGNED_SHORT,
        0
    );
}

function Octagon(startingDistance, rotationSpeed) {
    this.angle = 0;

    this.z = startingDistance;
    this.rotationSpeed = rotationSpeed;

    // Set the colors to a starting value.
    this.randomiseColors();
}

Octagon.prototype.draw = function(tilt, spin, twinkle) {
    mvPushMatrix();

    // mat4.rotate(mvMatrix, mvMatrix, degToRad(spin), [0.0, 1.0, 0.0]);
    mat4.translate(mvMatrix, mvMatrix, [0, 0.0, -this.z]);

    // Rotate back so that the star is facing the viewer
    // mat4.rotate(mvMatrix, mvMatrix, degToRad(-this.angle), [0.0, 1.0, 0.0]);
    // mat4.rotate(mvMatrix, mvMatrix, degToRad(-tilt), [1.0, 0.0, 0.0]);

    // All stars spin around the Z axis at the same rate
    mat4.rotate(mvMatrix, mvMatrix, degToRad(tilt), [0.0, 0.0, 1.0]);

    // Draw the star in its main color
    gl.uniform3f(shaderProgram.colorUniform, this.r, this.g, this.b);
    drawOctagon();

    mvPopMatrix();
};

var effectiveFPMS = 60 / 1000;
Octagon.prototype.animate = function(elapsedTime) {
    // this.angle = this.rotationSpeed * effectiveFPMS * this.spin;
    // this.angle = 45;
    // spin += 0.001;
    // Decrease the distance, resetting the star to the outside of
    // the spiral if it's at the center.
    if (playerPos.z - this.z > 50.0) {
        this.z = octogons[49].z + 2;
        var temp = octogons.shift();
        octogons[49] = temp;
        this.randomiseColors();
    }
};

Octagon.prototype.randomiseColors = function() {
    this.r = Math.random();
    this.g = Math.random();
    this.b = Math.random();
};

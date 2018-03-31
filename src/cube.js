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

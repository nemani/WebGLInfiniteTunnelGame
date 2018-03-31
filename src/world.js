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

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

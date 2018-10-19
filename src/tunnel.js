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

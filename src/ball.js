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

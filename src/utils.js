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

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

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

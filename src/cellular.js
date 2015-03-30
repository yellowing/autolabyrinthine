// Cellular Automata bits -- based on Conway's "Life" http://en.wikipedia.org/wiki/Conway%27s_Game_of_Life

var Cellular = {};
Cellular.Cell = function () {
	this.val = 0; // of course, in future, value needn't be binary
	this.malleability = 1.0; // idea -- lock or force cell value after too many changes, or after changing too rapidly
	this.neighborSum = 0; // for standard ca/conway-style rules
	// this.deltaMomentum = 0; // idea -- change is not instantaneous -- NOT CURRENTLY USED
	this.timeInCurrentState = 0; // idea -- living cells can also die after a certain time, or dead cells can also live after being dead long enough
	this.canChange = true; // idea -- can manually lock certain cells' values
	this.totalChanges = 0;
};
Cellular.Cell.prototype.reset = function() {
	this.val = 0;
	this.malleability = 1.0;
	this.neighborSum = 0;
	this.timeInCurrentState = 0;
	this.canChange = true;
	this.totalChanges = 0;
}

Cellular.Rules = function () {
	this.livingResponses = {};
	this.deadResponses = {};
	this.malleabilityLostPerChange = 0;
	this.malleabilityRecoveredPerTurn = 0;
	this.maxTimeAlive = Infinity;
	this.maxTimeDead = Infinity;
	this.requireDeathBeforeRebirth = true;
	// idea: malleability total change factor
	// idea: pattern overrides
};

Cellular.Rules.prototype.setSurvival = function(sumList) {
	var responses = this.livingResponses;
	var i = 0;
	for (i = 0; i < 9; i++) {
		responses[i] = 0;
	}
	for (i = 0; i < sumList.length; i++) {
		responses[sumList[i]] = 1.0;
	}
}

Cellular.Rules.prototype.setBirth = function(sumList) {
	var responses = this.deadResponses;
	var i = 0;
	for (i = 0; i < 9; i++) {
		responses[i] = 0;
	}
	for (i = 0; i < sumList.length; i++) {
		responses[sumList[i]] = 1.0;
	}
}

Cellular.Rules.prototype.resolveCells = function(cells) {
	var maxIndex = cells.length;
	var cell = null;
	var cellValue = 0;
	var appropriateValue = 0;
	var finalValue = 0;
	var isAlive = false;
	var livingResponses = this.livingResponses;
	var deadResponses = this.deadResponses;
	var totalChanges = 0;
	for (var cellIndex = 0; cellIndex < maxIndex; cellIndex++) {
		cell = cells[cellIndex];
		cellValue = cell.value;
		if (cell.canChange && cell.malleability > 0) {
			isAlive = cellValue > 0;
			if (isAlive) {
				appropriateValue = livingResponses[cell.neighborSum];
			} else {
				appropriateValue = deadResponses[cell.neighborSum];
			}
			if (appropriateValue != cellValue) {
				// value should change
				cell.totalChanges++;
				cell.malleability -= this.malleabilityLostPerChange;
				finalValue = appropriateValue;
				cell.timeInCurrentState = 0;
			} else {
				cell.timeInCurrentState++;
				finalValue = cellValue;
				if (isAlive) {
					if (cell.timeInCurrentState >= this.maxTimeAlive) {
						finalValue = 0;
					}
				} else {
					if (cell.timeInCurrentState >= this.maxTimeDead) {
						if (this.requireDeathBeforeRebirth) {
							if (cell.totalChanges > 0) {
								finalValue = 1.0;
							} else {
								finalValue = 0;
							}
						} else if (cell.totalChanges > 0) {
							finalValue = 1.0;
						}
					}
				}
			}
		} else {
			finalValue = cellValue;
		}
		if (finalValue != cellValue) {
			totalChanges++;
		}
		cell.value = finalValue;
		cell.malleability = Math.min(1.0, cell.malleability + this.malleabilityRecoveredPerTurn);
	}
	return totalChanges; // can be used to get an idea of when the system has stablized
};

Cellular.Network = function (width, height, rng) {
	// a network of cells for our cellular automata
	// currently assumes a grid where diagonals are connected
	this.cells = [];
	this.width = width || 0;
	this.height = height || 0;
	this.rng = rng || Math.random; // you can assign a different default random number generator (default is Math.random)
	this.setSize(this.width, this.height);
};

Cellular.Network.prototype.setSize = function(width, height) {
	// currently just for initialization
	var maxIndex = width * height;
	for (var cellIndex = 0; cellIndex < maxIndex; cellIndex++) {
		this.cells.push(new Cellular.Cell());
	}
};

Cellular.Network.prototype.all = function(callback) {
	var maxIndex = this.width * this.height;
	var cells = this.cells;
	for (var cellIndex = 0; cellIndex < maxIndex; cellIndex++) {
		callback(cells[cellIndex]);
	}
};

Cellular.Network.prototype.allXY = function(callback) {
	// to more accurately match rotJS's format
	var maxIndex = this.width * this.height;
	var cells = this.cells;
	var xPos = 0;
	var xMax = this.height;
	var yPos = 0;
	var yMax = this.width;
	var cellIndex = 0
	for (yPos = 0; yPos < yMax; yPos++) {
		for (xPos = 0; xPos < xMax; xPos++) {
			callback(xPos, yPos, cells[cellIndex].value, cells[cellIndex]);
			cellIndex++;
		}
	}
};

Cellular.Network.prototype.probabilityFill = function(chanceOfLife, rng) {
	// randomly set the value of each cell in the network
	rng = rng || this.rng; // optional rng function to use, other than the network's
	var maxIndex = this.width * this.height;
	var cells = this.cells;
	for (var cellIndex = 0; cellIndex < maxIndex; cellIndex++) {
		if (rng() <= chanceOfLife) {
			cells[cellIndex].value = 1;
		} else {
			cells[cellIndex].value = 0;
		}
	}
};

Cellular.Network.prototype.fill = function(value) {
	// set every cell in the network to a particular value
	var maxIndex = this.width * this.height;
	for (var cellIndex = 0; cellIndex < maxIndex; cellIndex++) {
		this.cells[cellIndex].value = value;
	}
}

Cellular.Network.prototype.scatterSeeds = function(numSeeds, rng, options) {
	// place a few "seeds" to grow in future iterations of the cellular network
	// (each "seed" is just a random percent fill within rectangular bounds)

	// optional options to define the seeds
	var seedWidth = options.seedWidth || 3;
	var seedHeight = options.seedHeight || 3;
	var seedFillPercentage = options.seedFillPercentage || 0.4;
	// possible improvement: option to force scatter distribution to be more evenly spread across the network (grid-based)
	// possible improvement: option to try a few times to re-place a seed if it overlaps a previously-placed seed
	// possible improvement: option to provide a specific set of seed shapes (since they )
	// possible improvement: option to weight specific seed shapes in the set (note: no need to specify "required" seeds; just call scatterSeeds twice)
	rng = rng || this.rng; // optional rng function to use, other than the network's

	var xMin, xMax, xRange;
	var yMin, yMax, yRange;

	var seedLeftDist = Math.floor(seedWidth * 0.5);
	var seedTopDist = Math.floor(seedHeight * 0.5);
	var seedRightDist = seedWidth - seedLeftDist;
	var seedBottomDist = seedHeight - seedTopDist;

	xMin = seedLeftDist;
	xMax = this.width - seedLeftDist;
	xRange = xMax - seedRightDist;

	yMin = seedTopDist;
	yMax = this.height - seedTopDist;
	yRange = yMax - seedBottomDist;

	var seedCellMinX, 
		seedCellMaxX, 
		seedCellMinY, 
		seedCellMaxY;
	var cellIndex;
	for (var seedNum = 0; seedNum < numSeeds; seedNum++) {
		seedCellMinY = Math.floor(rng() * yRange);
		seedCellMaxY = seedCellMinY + seedHeight;
		seedCellMinX = Math.floor(rng() * xRange);
		seedCellMaxX = seedCellMinX + seedWidth;
		// generate seed
		for (var y = seedCellMinY; y < seedCellMaxY; y++) {
			cellIndex = y * this.width + seedCellMinX;
			for (var x = seedCellMinX; x < seedCellMaxX; x++) {
				if (rng() <= seedFillPercentage) {
					cells[cellIndex].value = 1;
				} else {
					cells[cellIndex].value = 0;
				}
				cellIndex++;
			}
		}
	}
}

Cellular.Network.prototype.updateNeighborCount = function() {
	// possible improvements: more flexible topology, counting more distant neighbors
	// this could be more optimized--say, by looping in "9-slice" chunks, to reduce unnecessary bounds-checking in the middle
	var cellIndex;
	var cells = this.cells;
	var yMin = 0;
	var yMax = this.height;
	var xMin = 0;
	var xMax = this.width;
	var offset;
	var sum;
	for (var y = yMin; y < yMax; y++) {
		cellIndex = y * this.width;
		for (var x = xMin; x < xMax; x++) {
			// count cell neighbors
			var safeLeft = (x >= xMin + 1);
			var safeRight = (x < xMax - 1);
			sum = 0;
			// above
			if (y >= 1) {
				offset = -this.width;
				if (safeLeft) {
					sum += cells[cellIndex + offset - 1].value;
				}
				sum += cells[cellIndex + offset].value;
				if (safeRight) {
					sum += cells[cellIndex + offset + 1].value;
				}
			}
			// in-row
			if (safeLeft) {
				sum += cells[cellIndex - 1].value;
			}
			if (safeRight) {
				sum += cells[cellIndex + 1].value;
			}
			// below
			if (y < yMax - 1) {
				offset = this.width;
				if (safeLeft) {
					sum += cells[cellIndex + offset - 1].value;
				}
				sum += cells[cellIndex + offset].value;
				if (safeRight) {
					sum += cells[cellIndex + offset + 1].value;
				}
			}

			if (isNaN(sum)) {
				console.warn(x,y,"-",cellIndex,cells[cellIndex], "borked");
				throw new Error();
				cells[cellIndex].neighborSum = 0;
			} else {
				cells[cellIndex].neighborSum = sum;
			}
			console.log()

			cellIndex++;
		}
	}
};

Cellular.Network.prototype.getCellAtPosition = function(posX, posY) {
	return this.cells[posY * this.width + posX];
};


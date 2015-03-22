
var sandbox = {

	tileWidth : 16,
	tileHeight : 16,
	gridWidth : 30,
	gridHeight : 30,

	initialFillPercent : 0.2,

	updateDelay : 50, // ms,
	timeout : null,

	network : null,
	rules : null,
	
	init : function() {
		var width = this.gridWidth;
		var height = this.gridHeight;
		world = new World(width, height);
		world.look(Math.floor(width/2), Math.floor(height/2));

		this.network = new Cellular.Network(width, height, Math.random);

		this.rules = new Cellular.Rules();

		display.init(width, height, this.tileWidth, this.tileHeight);

		// re-arranging maze
		this.rules.setSurvival([1,2,3,4]);
		this.rules.setBirth([3]);
		this.rules.maxTimeAlive = 50;
		// this.rules.maxTimeDead = 5;
		this.rules.malleabilityLostPerChange = 1;
		this.rules.malleabilityRecoveredPerTurn = 0.25;


		this.network.probabilityFill(this.initialFillPercent);
		this.display();
	},
	play : function() {
		clearTimeout(this.timeout);
		this.timeout = setTimeout(this.onTimeout.bind(this), this.updateDelay);
	},
	pause : function() {
		clearTimeout(this.timeout);
		this.timeout =null;
	},
	onTimeout : function() {
		clearTimeout(this.timeout);
		this.update();
		this.display();
		this.timeout = setTimeout(this.onTimeout.bind(this), this.updateDelay);
	},
	display : function() {
		var rules = this.rules;
		var network = this.network;
		var index = 0;
		display.visit(function(tile, worldX, worldY) {
			// console.log(worldX, worldY)
			// var cell = network.getCellAtPosition(worldX, worldY);
			var cell = network.cells[index];
			if (cell.value > 0) {
				tile.set("alive");//, "n" + cell.neighborSum);
			} else {
				tile.set("dead");//, "n" + cell.neighborSum);
			}
			if (cell.malleability <= 0) {
				tile.add("locked");
			}
			index++;
		});
	},
	update : function() {
		this.network.updateNeighborCount();
		this.rules.resolveCells(this.network.cells);
	}
};

var sandboxControls = {
	init : function() {
		$("#play-pause-button").on('click', this.onClickPlayPause);
		$("#step-button").on('click', this.onClickStep);
		$("#regen-button").on('click', this.onClickRegen);
	},
	onClickPlayPause : function() {
		if (sandbox.timeout) {
			sandbox.pause();
			$("#play-pause-button .playing").hide();
			$("#play-pause-button .paused").show();
		} else {
			sandbox.play();;
			$("#play-pause-button .paused").hide();
			$("#play-pause-button .playing").show()
		}
	},
	onClickStep : function() {
		sandbox.update();
		sandbox.display();
	},
	onClickRegen : function() {
		sandbox.network.probabilityFill(sandbox.initialFillPercent);
		sandbox.network.all(function(cell){cell.reset()});
		sandbox.display();
	}
};

sandboxControls.init();
sandbox.init();
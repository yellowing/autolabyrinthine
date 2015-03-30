var LivingMap = function(seed) {
	// ideally this would be more considerate of future growth,
	// but it seems more prudent to focus on actually developing a game.
	
    var rng = ROT.RNG;
    var caNetwork = new Cellular.Network(w,h, rng.getUniform.bind(rng));
    var caRules = new Cellular.Rules();

    // set up initial rules
    caRules.setSurvival([1,2,3,4]);
    caRules.setBirth([3]);
    caRules.maxTimeAlive = Infinity;
    caRules.maxTimeDead = Infinity;
    caRules.malleabilityLostPerChange = 0;
    caRules.malleabilityRecoveredPerTurn = 1.0;

    rng.setSeed(seed);
    caNetwork.probabilityFill(0.16);

    // form initial maze-like structure
    var maxPasses = 100;
    var numChangesMade = 0;
    var passes = 0;
    caNetwork.updateNeighborCount();
    numChangesMade = caRules.resolveCells(caNetwork.cells)
    while (numChangesMade > 0 && passes < maxPasses) {
        caNetwork.updateNeighborCount();
        numChangesMade = caRules.resolveCells(caNetwork.cells)
        passes++;
    }
    
    // todo:

    // place endzone & start zone as static places
    // place outer edge as static pieces?
    // indicate player start
    // retain ref to static spots (or set them to be locked, in network)

    
	caRules.maxTimeAlive = 50;
	caRules.malleabilityLostPerChange = 1;
	caRules.malleabilityRecoveredPerTurn = 0.25;

	this.caRules = caRules;
	this.caNetwork = caNetwork;
}

LivingMap.prototype.update = function() {
	this.rules.resolveCells(this.network.cells);
	this.caNetwork.updateNeighborCount();
}
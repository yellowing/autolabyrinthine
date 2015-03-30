/**
 * Exports: Map
 */

var MINIMAP_RADIUS = 40;

/**
 * @constructor
 */
function Map(level) {
    this.grid = {};
    this.monsters = [];
    this.level = level || 1;
    this.visible = {};
    this.nextspawn = 0;
    this.canSpawn = true;
    this.id = makeId();
}

Map.prototype.spawnrate = 200; /* Lower is faster. */

Map.prototype.get = function(x, y) {
    return this.grid[[x, y]];
};

Map.prototype.set = function(x, y, place) {
    this.grid[[x, y]] = place;
    return this;
};

Map.prototype.isSolid = function(x, y) {
    var place = this.get(x, y);
    return !place || place.solid;
};

Map.prototype.markSeen = function(x, y) {
    var place = this.get(x, y);
    if (place) {
        place.seen = true;
    }
};

Map.prototype.computeVisible = function(player) {
    var that = this;
    var fov = new ROT.FOV.PreciseShadowcasting(function(x, y) {
        return !that.isSolid(x, y);
    });
    var r = display.radius;
    that.visible = {};
    fov.compute(player.x, player.y, r, function(x, y) {
        that.visible[[x, y]] = true;
        that.markSeen(x, y);
    });
};

Map.prototype.visit = function(f) {
    var that = this;
    Object.keys(this.grid).forEach(function(key) {
        var pos = key.split(',').map(parseFloat);
        f(that.grid[key], pos[0], pos[1]);
    });
};

Map.prototype.isVisible = function(x, y) {
    return this.visible[[x,y]];
};

/**
 * Get a random dungeon location that meets a predicate.
 */
Map.prototype.random = function(f) {
    var that = this;
    var ps = Object.keys(this.grid).filter(function(key) {
        return f(that.grid[key]);
    }).map(function(key) {
        return key.split(',').map(parseFloat);
    });
    if (ps.length > 0) {
        var p = ps.random();
        return {x: p[0], y: p[1]};
    } else {
        return null;
    }
};

/**
 * Add a random downstairs.
 */
Map.prototype.addStair = function(map) {
    var p = this.random(function(place) { return !place.solid; });
    this.set(p.x, p.y, new StairDown(map));
};

Map.prototype.display = function() {
    var that = this;
    display.visit(function(tile, x, y) {
        var place = that.get(x, y);
        var type = null;
        if (place) {
            if (place.getAppearance) {
                type = place.getAppearance();
            } else {
                type = place.place.constructor.name;
            }
        }
        if (that.visible[[x, y]]) {
            tile.set(type);
        } else if (place && place.seen) {
            tile.set('unseen', type);
        } else {
            tile.set();
        }
    });

    /* Minimap */
    var ctx = display.minimap;
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'black';
    var w = ctx.canvas.width;
    var h = ctx.canvas.height;
    var s = Math.min(w, h) / (MINIMAP_RADIUS * 2 + 1);
    var cx = world.player.x;
    var cy = world.player.y;
    ctx.fillRect(0, 0, w, h);
    this.visit(function(place, x, y) {
        if (place.seen) {
            var dx = Math.abs(cx - x);
            var dy = Math.abs(cy - y);
            if (dx <= MINIMAP_RADIUS && dy <= MINIMAP_RADIUS) {
                if (that.isVisible(x, y)) {
                    ctx.globalAlpha = 1;
                } else {
                    ctx.globalAlpha = 0.5;
                }
                if (place.special) {
                    ctx.fillStyle = '#f0f';
                } else if (place.solid) {
                    ctx.fillStyle = place.corrupted ? 'green' : '#898b7f';
                } else if (place instanceof Stair) {
                    ctx.fillStyle = 'yellow';
                    ctx.globalAlpha = 1;
                } else {
                    ctx.fillStyle =
                        place.corrupted ? 'lightgreen' : '#333';
                }
                ctx.fillRect((x - cx) * s + MINIMAP_RADIUS * s,
                             (y - cy) * s + MINIMAP_RADIUS * s,
                             s, s);
            }
        }
    });
    ctx.fillStyle = 'orange';
    ctx.globalAlpha = 1;
    ctx.fillRect(MINIMAP_RADIUS * s, MINIMAP_RADIUS * s, s, s);
};


/**
 * Add an I/O tower to a random place on this map.
 */
Map.prototype.addTower = function() {
    var pos = this.random(function(place) {
        return place instanceof StairDown;
    }); // replace the stairs
    if (!pos) {
        pos = this.random(function(place) { return !place.solid; });
    }
    //var pos = {x:world.player.x + 7, y: world.player.y}; // testing

    var x, y;
    for (x = -2; x <= 2; x++) {
        for (y = -2; y <= 2; y++) {
            if (x !== 0 || y !== 0) {
                this.set(pos.x + x, pos.y + y, new TowerBorder());
            }
        }
    }
    for (x = -1; x <= 1; x++) {
        for (y = -1; y <= 1; y++) {
            if (x !== 0 || y !== 0) {
                this.set(pos.x + x, pos.y + y, new TowerFloor());
                this.monsters.push(new TowerGuardian(pos.x + x, pos.y + y));
            }
        }
    }
    this.set(pos.x + 2, pos.y + 0, new TowerFloor());
    this.set(pos.x - 2, pos.y + 0, new TowerFloor());
    this.set(pos.x + 0, pos.y + 2, new TowerFloor());
    this.set(pos.x + 0, pos.y - 2, new TowerFloor());
    this.set(pos.x, pos.y, new Tower());
};

/* Generators */

Map.uneasyMaze = function(seed, w, h) {
    var map = new Map();
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

    caNetwork.allXY(function(x, y, val, cell) {
        var place;
        place = new MorphicTile(val);
        place.seen = true;
        map.grid[[x, y]] = place;
     });
    // todo:

    // place endzone & start zone as static places
    // indicate player start

    // update ca rules to be restless
    // store ref to ca bits
    
    map.canSpawn = false;

    return map;
}

Map.random = function(seed, w, h) { // not sure this is used anywhere...
    var rng = new RNG(seed);
    var types = Array.prototype.slice.call(arguments, 3);
    var map = new Map();
    for (var x = 0; x < w; x++) {
        for (var y = 0; y < h; y++) {
            if (x === 0 || x === w - 1 || y === 0 || y === h - 1) {
                map.set(x, y, new types[0]);
            } else {
                map.set(x, y, new types[rng.random(types.length)]);
            }
        }
    }
    return map;
};

Map.dungeon = function(w, h, corruption) {
    var gen = new ROT.Map.Digger(w, h);
    var map = new Map();
    gen.create(function(x, y, value) {
        var corrupt = R.random() < corruption;
        var place = null;
        if (corrupt && value) {
            place = new WallCorruption();
        } else if (!corrupt && value) {
            place = new Wall();
        } else if (corrupt && !value) {
            place = new FloorCorruption();
        } else {
            place = new Floor();
        }
        map.grid[[x, y]] = place;
    });
    map.addStair(null);
    return map;
};

Map.cellular = function(w, h) {
    var gen = new ROT.Map.Cellular(w, h);
    gen.randomize(0.55);
    var map = new Map();
    for (var i = 0; i < 4; i++) gen.create();
    gen.create(function(x, y, value) {
        map.grid[[x, y]] = value ? new Floor() : new Wall();
    });
    return map;
};

Map.empty = function() {
    return new Map();
};

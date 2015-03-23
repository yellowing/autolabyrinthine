/**
 * Exports: World, world
 */

var WORLD_VERSION = 3;
var DUNGEON_SIZE = 100;
var MAX_DEPTH = 6;

var world = null;

function World(map) {
    this.map = map || Map.empty();
    this.maps = {};
    this.player = new Player(0, 0);
    this.time = 0;
    this.focus = {
        x: 0,
        y: 0
    };
    this.active = true;
    this.lastSave = 0;
    this.version = WORLD_VERSION;
}

World.prototype.display = function() {
    this.map.computeVisible(this.player);
    this.map.display();
    this.map.monsters.forEach(withThis('display'));
    if (this.active) {
        this.player.display();
        controls.display();
    }

    /* Stats */
    display.$name.text(this.player.name);
    display.$level.text(this.player.level + '.' +
                        ~~(this.player.experience / 14));
    display.$dlevel.text(this.map.level);

    display.$experience.text(this.player.experience +
                             ' / ' + this.player.nextLevel());
    var perc = Math.floor(this.player.experience * 100 /
                          this.player.nextLevel());
    display.$expfill.css('width', perc + '%');

    display.$health.text(this.player.hp + ' / ' + this.player.maxhp);
    perc = Math.floor(this.player.hp * 100 / this.player.maxhp);
    display.$hpfill.css('width', perc + '%');

    display.$mana.text(this.player.mp + ' / ' + this.player.maxmp);
    display.$strength.text(this.player.strength);
    display.$dexterity.text(this.player.dexterity);
    display.$mind.text(this.player.mind);
};

World.prototype.look = function(x, y) {
    if (y != null) {
        this.focus.x = x;
        this.focus.y = y;
    } if (x) {
        var thing = x;
        this.focus.x = thing.x;
        this.focus.y = thing.y;
    } else {
        this.focus.x = this.player.x;
        this.focus.y = this.player.y;
    }
};

/**
 * @returns the monster at the position.
 */
World.prototype.monsterAt = function(x, y) {
    var monsters = this.map.monsters.concat([this.player]);
    for (var i = 0; i < monsters.length; i++) {
        if (monsters[i].isAt(x, y)) return monsters[i];
    }
    return undefined;
};

World.prototype.isSolid = function(x, y) {
    return this.map.isSolid(x, y);
};

/**
 * @returns true if the place is passable by a monster.
 */
World.prototype.isPassable = function(x, y) {
    return !this.isSolid(x, y) && !this.monsterAt(x, y);
};

World.prototype.isVisible = function(x, y) {
    return this.map.isVisible(x, y);
};

World.prototype.spawn = function(type) {
    var p = this.map.random(function(place) { return !place.solid; });
    if (!this.monsterAt(p.x, p.y)) this.map.monsters.push(new type(p.x, p.y));
};

/**
 * Remove a monster from the world.
 * @param {Monster} monster
 */
World.prototype.remove = function(monster) {
    if (monster === this.player) {
        log('You were derezzed.');
        world.gameOver();
    } else {
        log('%s was derezzed.', monster);
        this.map.monsters = this.map.monsters.filter(function(m) {
            return m !== monster;
        });
        var exp = monster.maxhp + Math.max(monster.dexterity, monster.mind);
        this.player.addExperience(exp);
    }
};

/**
 * Run the next world event.
 */
World.prototype.run = function() {
    if (!this.active) return;

    if (this.shouldWin()) {
        this.win();
        return;
    }
    
    var allCreatures = [this.player].concat(this.map.monsters);
    var timeUntilAction = Math.max(0, allCreatures.reduce(function(shortestWait, m) {
        return Math.min(shortestWait, m.timer);
    }, Infinity));
    var movers = allCreatures.filter(function(m) {
        m.timer -= timeUntilAction;
        return m.timer <= 0;
    });
    world.time += timeUntilAction;

    if (world.time - world.lastSave > 2000) { // todo: make this configurable?
        this.save();
        world.lastSave = world.time;
    }

    while (world.time > this.map.nextspawn) {
        this.map.nextspawn += R.exponential() * this.map.spawnrate *
            Math.max(1, Math.log(this.map.monsters.length));
        // Occasionally spawn higher level monsters
        var mod = Math.floor(R.exponential() * 0.5);
        this.spawn(Mindex.random(this.map.level + mod));
    }

    var mover = movers.pop();
    mover.timer = Math.max(20 - bonus(mover.dexterity), 1); // todo: make this configurable?
    mover.thrown = false;
    try {
        mover.act(this.run.bind(this)); // note: the player ignores this callback, which ends the recursion (seems kinda weird to me, though it shortens the code)
    } catch (e) {
        console.log(e);
        debug(0, 'Error in monster.act(): %s', e);
        this.run();
    }
};

World.prototype.gameOver = function() {
    this.active = false;
    Save.clear('world');
    this.look();
    this.display();
};

World.prototype.save = function() {
    if (this.active) {
        var start = Date.now();
        Save.save('world');
    }
};

// evaluate win conditions
World.prototype.shouldWin = function() {
    return this.map.get(this.player.x, this.player.y) instanceof Tower;
};

// win the game
World.prototype.win = function() {
    presentation.overlay('win');
    important('Your User transfers you back home to safety.');
    this.display();
    this.gameOver();
};

/**
 * Try to load the world from the save.
 */
World.load = function() {
    if (Save.exists('world')) {
        try {
            Save.load('world');
            if (world.version !== WORLD_VERSION) {
                world = null;
                return false;
            }
        } catch (e) {
            /* Load failed, give up. */
            Save.clear('world');
            world = null;
            return false;
        }
        return true;
    } else {
        return false;
    }
};

/**
 * Use the stairs at the player's location.
 */
World.prototype.useStairs = function() {
    var place = this.map.get(this.player.x, this.player.y);
    if (place instanceof Stair) {
        if (!place.map) {
            var map = Map.dungeon(DUNGEON_SIZE, DUNGEON_SIZE,
                                  this.map.level / MAX_DEPTH); // will probably want to make this more dynamic
            this.maps[map.id] = map;
            place.map = map.id;
            map.level = this.map.level + 1;
            if (map.level >= MAX_DEPTH) {
                map.addTower();
                map.spawnrate = 100;
            }
            var pos = map.random(function(place) {
                return place instanceof Floor;
            });
            var up = new StairUp(this.map.id);
            up.x = this.player.x;
            up.y = this.player.y;
            map.set(pos.x, pos.y, up);
            place.x = pos.x;
            place.y = pos.y;
        }
        this.maps[this.map.id] = this.map;
        this.map = this.maps[place.map];
        this.maps[place.map.id] = null;
        this.player.x = place.x;
        this.player.y = place.y;
        this.map.nextspawn = Math.max(this.map.nextspawn, world.time);
        return true;
    } else {
        return false;
    }
};

/**
 * Return a list of monsters currently in view.
 */
World.prototype.visibleMonsters = function() {
    var that = this;
    return this.map.monsters.filter(function(m) {
        return that.map.isVisible(m.x, m.y);
    });
};

World.reset = function() {
    log('Greetings, program.');
    world = new World(Map.dungeon(DUNGEON_SIZE / 2, DUNGEON_SIZE / 2));
    world.map.spawnrate *= 0.7;
    var start = world.map.random(function(place) { return !place.solid; });
    world.player.move(start.x, start.y);
    world.look();
};

/**
 * Find the nearest position that meets the predicate.
 * @param f The predicate function f(place, x, y).
 * @param [x=this.player.x] The source x-position.
 * @param [y=this.player.y] The source y-position.
 */
World.prototype.nearest = function(f, x, y) {
    x = x == null ? this.player.x : x;
    y = y == null ? this.player.y : y;
    var dist2 = Infinity;
    var select = null;
    var that = this;
    Object.keys(this.map.grid).forEach(function(key) {
        var pos = key.split(',').map(parseFloat);
        if (f(that.map.grid[key], pos[0], pos[1])) {
            var dx = pos[0] - x;
            var dy = pos[1] - y;
            var d2 = dx * dx + dy * dy;
            if (d2 < dist2) {
                select = pos;
                dist2 = d2;
            }
        }
    });
    if (select) {
        return {x: select[0], y: select[1]};
    } else {
        return null;
    }
};

World.prototype.selectNext = function(reverse) {
    var that = this;
    var monsters = this.map.monsters.filter(function(m) {
        return that.isVisible(m.x, m.y);
    });
    monsters.sort(function(a, b) {
        return a.dist(world.player) - b.dist(world.player);
    });
    if (monsters.length > 0) {
        if (controls.selected) {
            var x = controls.selected.x, y = controls.selected.y;
            for (var i = 0; i < monsters.length; i++) {
                if (monsters[i].x === x && monsters[i].y === y) {
                    if (reverse) {
                        controls.selected =
                            monsters[(i - 1 + monsters.length)
                                     % monsters.length];
                    } else {
                        controls.selected =
                            monsters[(i + 1) % monsters.length];
                    }
                    return true;
                }
                controls.selected = monsters[0];
                return true;
            }
        } else {
            controls.selected = monsters[0];
            return true;
        }
    } else {
        return false;
    }
};

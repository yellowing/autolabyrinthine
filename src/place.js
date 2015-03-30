/**
 * Exports: Place, Wall, Floor
 */

/**
 * @constructor
 */
function Place() {
}

Place.prototype.solid = false;
Place.prototype.seen = false;
Place.prototype.modifier = {};

Place.prototype.toString = function() {
    return 'a ' + this.constructor.name.toLowerCase();
};

Place.prototype.modify = function(name) {
    return this.modifier[name] || 0;
};

/* Types of places. */

function MorphicTile(initialValue) { 
    Place.call(this); 
    this.solid = (initialValue > 0);
}
MorphicTile.extend(Place);
MorphicTile.prototype.getAppearance = function() {
    if (this.solid) {
        return "Wall";
    } else {
        return "Floor";
    }
}
MorphicTile.prototype.toString = function() {
    if (this.solid) {
        return "Wall";
    } else {
        return "Floor";
    }
}

/* ORIGINAL */

function Wall() { Place.call(this); }
Wall.extend(Place);
Wall.prototype.solid = true;

function WallCorruption() { Wall.call(this); }
WallCorruption.extend(Wall);
WallCorruption.prototype.corrupted = true;
WallCorruption.prototype.modifier = {
    strength: -1,
    dexterity: -1,
    mind: -1,
    hit: -1,
    ac: -1,
    damage: -1
};
WallCorruption.prototype.toString = function() {
    return 'a corrupted wall';
};

function Floor() { Place.call(this); }
Floor.extend(Place);

function FloorCorruption() { Floor.call(this); }
FloorCorruption.extend(Floor);
FloorCorruption.prototype.corrupted = true;
FloorCorruption.prototype.modifier = {
    strength: -1,
    dexterity: -1,
    mind: -1,
    hit: -1,
    ac: -1
};
FloorCorruption.prototype.toString = function() {
    return 'a corrupted floor';
};

function Stair(map)  {
    Place.call(this);
    if (map) this.map = map;
};
Stair.extend(Place);
Stair.prototype.map = null;

function StairUp() { Stair.apply(this, arguments); }
StairUp.extend(Stair);

function StairDown() { Stair.apply(this, arguments); }
StairDown.extend(Stair);

function Tower() { Place.apply(this, arguments); }
Tower.extend(Place);
Tower.prototype.special = true;

function TowerFloor() { Place.apply(this, arguments); }
TowerFloor.extend(Place);
TowerFloor.prototype.special = true;

function TowerBorder() { Place.apply(this, arguments); }
TowerBorder.extend(Place);
TowerBorder.prototype.special = true;

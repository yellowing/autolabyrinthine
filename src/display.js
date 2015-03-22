/**
 * Exports: Tile, display
 */

/**
 * @constructor
 */
function Tile($tile) {
    this.$tile = $tile;
    this.types = [];
}

Tile.prototype.set = function() {
    if (this.types.length > 0) {
        this.types = [];
        this.$tile.prop('class', 'tile');
    }
    for (var i = 0; i < arguments.length; i++) {
        var type = arguments[i];
        if (type) {
            this.types.push(type);
            this.$tile.addClass(type);
        }
    }
    return this;
};

Tile.prototype.is = function(type) {
    return this.types.indexOf(type) >= 0;
};

Tile.prototype.remove = function(type) {
    if (this.is(type)) {
        this.types = this.types.filter(function(v) {
            return v !== type;
        });
        this.$tile.removeClass(type);
    }
    return this;
};

Tile.prototype.add = function(type) {
    if (!this.is(type)) {
        this.types.push(type);
        this.$tile.addClass(type);
    }
    return this;
};

/** @namespace */
var display = {};

/** 2D array of all tiles. */
display.grid = [];


display.width = 15; // in tiles
display.height = 15; // in tiles
display.radius = Math.floor(Math.min(display.width, display.height) / 2); // in tiles
display.tileWidth = 32; // (pixels per tile)
display.tileHeight = 32;

/* Initialize tiles. */
display.init = function(width, height, tileWidth, tileHeight) {
    display.width = width || display.width;
    display.height = height || display.height;
    display.radius = Math.floor(Math.min(display.width, display.height) / 2);
    display.tileWidth = tileWidth || display.tileWidth;
    display.tileHeight = tileHeight || display.tileHeight;

    var $map = $('#map');
    for (var x = 0; x < display.width; x++) {
        var row = [];
        display.grid.push(row);
        for (var y = 0; y < display.height; y++) {
            var $tile = $('<div/>').attr({'class': 'tile'}).css({
                'left': (x * display.tileWidth) + 'px',
                'top': (y * display.tileHeight) + 'px',
                'width' : display.tileWidth + 'px',
                'height' : display.tileHeight + 'px'
            });
            row.push(new Tile($tile));
            $map.append($tile);
        }
    }
};

/**
 * Visit each tile with a function.
 * @param f This function is called as f(tile, x, y).
 */
display.visit = function(f) {
    for (var y = 0; y < display.grid.length; y++) {
        for (var x = 0; x < this.grid[y].length; x++) {
            // console.log(world);
            // console.log(world.focus);
            // console.log(world.focus.x, x, display.radius);
            // console.log(world.focus.x + x - display.radius);
            f(this.grid[x][y],
              world.focus.x + x - display.radius,
              world.focus.y + y - display.radius);
        }
    }
};

/**
 * Set all tiles to a given type.
 * @param [type]
 */
display.clear = function(type) {
    this.visit(function(tile) {
        tile.set(type);
    });
};

/* World coordinates. */

display.get = function(x, y) {
    if (this.grid[x + display.radius - world.focus.x]) {
        var wx = x + display.radius - world.focus.x;
        var wy = y + display.radius - world.focus.y;
        return this.grid[wx][wy];
    } else {
        return undefined;
    }
};

display.set = function(x, y, type) {
    var tile = this.get(x, y);
    if (tile) {
        tile.set(type);
    }
    return this;
};

display.add = function(x, y, type) {
    var tile = this.get(x, y);
    if (tile) {
        tile.add(type);
    }
    return this;
};

display.remove = function(x, y, type) {
    var tile = this.get(x, y);
    if (tile) {
        tile.remove(type);
    }
    return this;
};

display.minimap = $('#minimap').get(0).getContext('2d');

/* Stats components. */
display.$name = $('#name');
display.$level = $('#level');
display.$dlevel = $('#dlevel');

display.$experience = $('#experience .value');
display.$expfill = $('#experience .statfill');

display.$health = $('#health .value');
display.$hpfill = $('#health .statfill');

display.$mana = $('#mana');
display.$strength = $('#strength');
display.$dexterity = $('#dexterity');
display.$mind = $('#mind');
display.$disc = $('#disc');

display.throwDisc = function(source, dest, callback) {
    var complete = function() {
        this.$disc.hide();
        if (callback) {
            callback();
        }
    }.bind(this);
    var h2 = this.$disc.height() / 2;

    var atile = this.get(source.x, source.y);
    var btile = this.get(dest.x, dest.y);
    if (!atile || !btile) return complete(); // One is out of view!
    var a = atile.$tile.position();
    var b = btile.$tile.position();

    this.$disc.css({
        top: (a.top + h2) + 'px',
        left: (a.left + h2) + 'px'
    });
    this.$disc.show();
    this.$disc.animate({
        top: (b.top + h2) + 'px',
        left: (b.left + h2) + 'px'
    }, 200, 'linear', complete);
};

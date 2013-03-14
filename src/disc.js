function overlay(name) {
    var path = 'story/' + name + '.html';
    var $overlay = $('#overlay').load(path, function() {
        $overlay.show()
            .append($('<span>Close</span>').attr({
                'class': 'button'
            }).click(function() {
                $overlay.hide();
            }));
    });
}

lograw('Navigate with the "hjkl yubn" keys (<a href="">help</a>)')
    .addClass('important')
    .find('a').click(function() {
        overlay('intro');
        return false;
    });

(function() {
    if (World.load()) {
        log('Game restored. Welcome back, %s.', world.player);
    } else {
        if (!Save.exists('playedBefore')) {
            overlay('intro');
            Save.save('playedBefore', true);
        }
        log('Greetings, program.');
        //var world = new World(Map.cellular(120, 120));
        world = new World(Map.dungeon(DUNGEON_SIZE));
        var start = world.map.random(function(place) { return !place.solid; });
        world.player.move(start.x, start.y);
        world.look();
    }
}());

$(window).unload(function() {
    world.save();
});

/* Get things going. */
world.display();
world.run();

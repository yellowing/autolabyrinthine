function overlay(name) {
    var path = 'story/' + name + '.html';
    var $overlay = $('#overlay').load(path, function() {
        $overlay.show()
            .append($('<span>Close</span>').attr({
                'class': 'button close'
            }).click(function() {
                $overlay.hide();
            }));
    });
    return false;
}

function printHelp() {
    lograw('Navigate with the "hjkl yubn" keys (<a href="">help</a>)')
        .addClass('important')
        .find('a').click(function() {
            overlay('intro');
            return false;
        });
}

(function() {
    printHelp();
    if (World.load()) {
        log('Game restored. Welcome back, %s.', world.player);
    } else {
        if (!Save.exists('playedBefore')) {
            overlay('intro');
            Save.save('playedBefore', true);
        }
        World.reset();
    }
}());

$(window).unload(function() {
    world.save();
});

/* Get things going. */
display.init();
world.display();
world.run();

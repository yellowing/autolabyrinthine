(function() {
    presentation.printHelp();
    if (World.load()) {
        log('Game restored. Welcome back, %s.', world.player);
    } else {
        if (!Save.exists('playedBefore')) {
            presentation.overlay('intro');
            Save.save('playedBefore', true);
        }
        World.reset();
    }
    $(window).unload(function() {
        world.save();
    });

    /* Get things going. */
    display.init();
    world.display();
    world.run();
}());
var presentation = {
    overlay : function(name) {
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
    },
    printHelp : function() {
        lograw('Navigate with the "hjkl yubn" keys (<a href="">help</a>)')
            .addClass('important')
            .find('a').click(function() {
                presentation.overlay('intro');
                return false;
            });
    }
};
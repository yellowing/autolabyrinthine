These are just my own notes on the repo at fork-time.

They will likely become out of date.


disc (the bootstrap):

	in disc.js, the game-start is triggered.

	it loads the saved world or resets the world.

	it hits world.display, then world.run

controls:

	in controls.js, jquery binds a listener to keydown in on the document, then does a switch to handle the keys.
	- arrows / hjkl yubn : 8-directional movement (bump to attack)
	- w : wait
	- q : quit/reroll
	- c : cancel action (for ranged attack?)
	- esc : close overlay
	- , / . / < / > : ascend / descend stairs
	- o : autowander on/off?
	- f enter ranged on / select monster for ranged attack


world:
	world.js effectively describes the game world (the current map, applicable interactions)

	.look()
	- sets world focus on player's xy
	.look(thing)
	- sets world focus on thing's xy
	.look(x, y)
	- sets world focus on specified xy

	.monsterAt(x, y)
	- returns monster at xy or undefined

	.isSolid(x, y)
	- returns whether the map is blocked/impassable at specified xy

	.isVisible(x, y)
	- self-explanatory?

	.spawn(type)
	- tries to spawn a new monster of specified type at a random location (and gives up if it picks an occupied location)

	.remove(monster)
	- removes a monster from the world, adding appropriate logs (x derezzed) & consequences (adding player experience)
	.remove(player)
	- removes player from the world, adding appropriate log (you were derezzed) & consequences (trigger gameover)

	.run()
	- only does anything if the world is active
	- evaluate endgame conditions (if conditions are met, game is ended)
	- decrement the wait of all creatures
	- increment the world time by the minimum wait of all creatures
	- saves the game periodically
	- makes the foremost creature act, then calls run recursively until the player has acted (act accepts a callback, which is world.run, and player doesn't call it)
	---- seems like this recursion could eventually hit a stack limit, depending on number of creatures?
	- after creature has acted

	.gameOver()
	- enter fail-game state (+ reveal feedback)

	.save()
	- save active game to the one & only save file

	.load()
	- load game from the one & only save file & return true, or fail & return false

	.useStairs()
	- checks if player is on stairs, and if so:
	- if there is no map associated with the stairs, one is generated
	- the active map is set to the stairs' map (might want to check map.js for map id)

	.visibleMonsters()
	- returns a list of player-visible monsters

	.reset()
	- resets the game

	.nearest(predicateFunction, x, y)
	- returns nearest position (on the active map) that meets the predicate

	.selectNext(reverseBool)
	- selects the next furthest visible monster, cycling


map:
	defines a single level/floor

	properties
	- spawnrate
	- grid
	- monsters
	- level

	methods
	- random(predicate) (random position that predicate approves)


place:
	defines a space/cell within a map

	I will likely be editing this a fair bit

	properties:
	- solid
	- seen
	- modifiers (statName:int dict) (add blindness?)
	- toString() handles the name
	- corrupted (corruption has additional effects)
	- special (?)

	to add(?):
	- dryness (nice-to-add: fire won't always immediately start -- the place can't burn until it's dry enough)
	- burnableFuel (if > 0, can burn. burning subtracts from flammability, so fire will eventually go out)
	- burning (bool -- is on fire)
	- neighborSum? (caIdentifier:int dict for cellular automata--might be part of map, or its own thing instead)
	- onAge? (each turn, the place can do something on its own? )
	- onEntered? (when player/monster enters territory, the place can do something? say, for traps?)
	- onBurn? (when fire starts/continues, the place can do something?)

	all "places" (wall, floor, stairs) are defined here, too
	some places have special attributes (e.g. stairs have a map)
	note: because the display is DOM-based, the actual appearance of things is defined in CSS. this is kinda handy for prototyping, if you don't mind CSS.
	

display:
	the components of displaying the world
	- the main view of the world (the "map") is DOM-based, using a Tile class
	- the minimap uses canvas
	- 

	visit(function(tile, worldX, worldY))
	- loops through each tile in the main display, hitting the function

weapon:
	base weapon class & definition

monster:
	base creature class

monsters:
	monster definitions

ai:
	some simple behavioral functions for monsters (random wander & attack patterns)

dice:
	dice-style RNG definitions (e.g. d2, d6, etc), using the RNG lib


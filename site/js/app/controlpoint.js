/**
 * A module which defines control points
 * @module app/controlpoint
 */
define(["app/config", "Phaser", "app/player"],
function(config, Phaser, player){
    "use strict"

    /**
     * A type defining in-game control points
     * @alias module:app/controlpoint
     */
    var ControlPoint = function(game, handler, x, y, owner) {
        /**
         * A reference to the current game
         * @type {Phaser.Game}
         */
        this.game = game;

        /**
         * A reference to this games ActionHandler
         * @type {ActionHandler}
         */
        this.handler = handler;

        /**
         * The id of the player controlling this resource
         */
        this.owner = owner || null;

        /**
         * The radius of the circle of FoW holding the control point clears
         */
        this.view = 500;

        /**
         * The range within which a unit can capture this control point
         */
        this.range = 384;

        this.unitGenTimer = this.game.time.create(false);
        this.unitGenTimer.loop(5000, function() {
            if (this.owner == player) {
                this.handler.do({
                    type: "create",
                    data: {
                        type: "Ship",
                        x: this.position.x,
                        y: this.position.y+40
                    }
                });
            }
        }.bind(this));
        this.unitGenTimer.start();

        this.convertPercent = 0;

        this.graphics = this.game.add.group();
        this.graphics.position = new Phaser.Point(x, y);

        this.flag = this.game.add.sprite(0, 0, 'flag');
        this.flag.anchor.set(0.5, 0.5);
        this.flag.animations.add('wave');
        this.flag.animations.play('wave', 7, true);

        this.circle = this.game.add.image(0, 0, '20empty');
        this.circle.anchor.set(0.5, 0.5);
        setInterval(function(){
            this.circle.angle -= 0.5;
        }.bind(this), 100);

        this.captureBar = this.game.add.graphics(0, -60);

        this.selectGraphic = this.game.add.sprite(0, 0, "20select");
        this.selectGraphic.anchor.set(0.5, 0.5);
        this.selectGraphic.visible = false;

        this.graphics.addChild(this.selectGraphic);
        this.graphics.addChild(this.captureBar);
        this.graphics.addChild(this.flag);
        this.graphics.addChild(this.circle);
        this.display();
    }

    Object.defineProperty(ControlPoint.prototype, "position", {
        get : function() {
            return this.graphics.position;
        },
        set : function(value) {
            this.graphics.position = value;
        }
    });

    ControlPoint.prototype.redraw = false;

    ControlPoint.prototype.onSelect = function() {
        this.selectGraphic.visible = true;
    }

    ControlPoint.prototype.onUnselect = function() {
        this.selectGraphic.visible = false;
    }

    ControlPoint.prototype.drawCaptureBar = function(color) {
        this.captureBar.clear();
        var percent = this.convertPercent/100;

        // Background
        this.captureBar.lineStyle(1, 0xCCCCCC, 1);
        this.captureBar.beginFill(0x333333, 0.8);
        this.captureBar.drawRect(-this.flag.width/2,
                                 this.flag.height,
                                 this.flag.width, 4);
        this.captureBar.endFill();

        // Current capture percent
        this.captureBar.beginFill(color, 0.8);
        this.captureBar.drawRect(-this.flag.width/2,
                                 this.flag.height,
                                 this.flag.width*percent, 4);
        this.captureBar.endFill();
    }

    ControlPoint.prototype.drawBuildPercent = function() {

    }

    ControlPoint.prototype.update = function() {
        var attemptedOwner = null;
        var magnitude = 1;
        for (var i=0; i < this.game.units.length; ++i) {
            var unit = this.game.units[i];
            if (unit.alive &&
                Phaser.Point.distance(unit.position, this.position) < this.range){
                if (attemptedOwner == null) {
                    attemptedOwner = unit.player;
                } else if (attemptedOwner != unit.player) {
                    return false;
                } else {
                    ++magnitude;
                }
            }
        }

        if (attemptedOwner == null || attemptedOwner == this.owner) {
            this.convertPercent = 0;
            this.captureBar.clear();
        } else if (this.convertPercent <= 100){
            this.convertPercent += config.map.controlPointConvertRate*magnitude;

            if (this.convertPercent >= 100) {
                this.owner = attemptedOwner;
                this.updateColor();
            }
            this.drawCaptureBar(attemptedOwner.color);
        }
        return true;
    }

    ControlPoint.prototype.updateColor = function() {
        ControlPoint.redraw = true;
        if (this.owner) {
            this.sprite.tint = this.owner.color;
        } else {
            this.sprite.tint = 0xFFFFFF;
        }
    }

    ControlPoint.prototype.display = function() {
        var loaded = this.game.cache.checkImageKey("384empty");
        if (loaded) {
            this.sprite = this.graphics.create(0, 0, "384empty");
            this.sprite.anchor.set(0.5, 0.5);
            this.sprite.update = this.update.bind(this);
            this.updateColor();

            setInterval(function(){
                this.sprite.angle += 0.05;
            }.bind(this), 100);
        } else {
            this.game.load.onFileComplete.add(function(p, name){
                if (name == "384empty") {
                    this.display();
                }
            }.bind(this));
        }
    }

    return ControlPoint;
});

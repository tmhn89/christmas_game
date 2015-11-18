var gameProperties = {
    screenWidth: 1024,
    screenHeight: 576,
    // distance between house & santa claus' starting point
    distance: 581,
    baseSpeed: 200,
    baseChoices: 2,
    raiseChoicesStep: 7,
    //baseThroughput: 1,
    throughputStep: 0.05
};

var states = {
    game: "game",
};

var graphicAssets = {
    santa: {URL: 'assets/santa.png', name: 'santa'},

    // presents
    present_car: {URL:'assets/present_car.png', name: 'present_car'},
    present_iphone: {URL:'assets/present_iphone.png', name: 'present_iphone'},
    present_watch: {URL:'assets/present_watch.png', name: 'present_watch'},
    present_drone: {URL:'assets/present_drone.png', name: 'present_drone'},
    present_toilet_paper: {URL:'assets/present_toilet_paper.png', name: 'present_toilet_paper'},
    present_mcdonald: {URL:'assets/present_mcdonald.png', name: 'present_mcdonald'},
    present_pizza: {URL:'assets/present_pizza.png', name: 'present_pizza'},
    present_diamond: {URL:'assets/present_diamond.png', name: 'present_diamond'},
    present_ticket: {URL:'assets/present_ticket.png', name: 'present_ticket'},
    present_ps4: {URL:'assets/present_ps4.png', name: 'present_ps4'},

    house: {URL: 'assets/house2.png', name: 'house'},
    bubble: {URL: 'assets/bubble.png', name: 'bubble'},
    background: {URL: 'assets/game_bg.jpg', name: 'background'},
    bg_present: {URL: 'assets/bg_present.png', name: 'bg_present'},

    face_happy: {URL: 'assets/face_happy.png', name: 'face_happy'},
    face_sad: {URL: 'assets/face_sad.png', name: 'face_sad'},

    game_over: {URL: 'assets/game_over.png', name: 'game_over'},
}

var fontAssets = {
    defaultFontStyle: {font: '13px Tahoma', fill: '#FFFFFF', align: 'left'},
    bigFontStyle: {font: '16px Tahoma', fill: '#FFFFFF', align: 'left'},
    darkFontStyle: {font: '13px Tahoma', fill: '#333333', align: 'left'},
}

var santaProperties = {
    startX: 0,
    startY: gameProperties.screenHeight * 0.2,
};

var houseProperties = {
    startX: gameProperties.distance,
    startY: gameProperties.screenHeight - 159,
};

var presentProperties = {
    speed: 600,
    // only drop next present when the last present hit the ground
    interval: gameProperties.screenHeight / 600 * 1000,
    lifeSpan: 1000,
    maxCount: 1,
};

var presentList = [];

var gameState = function(game){
    this.gameStarted = false;

    this.santaSprite;      

    this.key_fire;
    this.key_fire2;

    this.key_present1;
    this.key_present2;
    this.key_present3;
    this.key_present4;
    this.key_present5;
    this.key_present6;
    this.key_present7;
    this.key_present8;
    this.key_present9;
    
    this.presentGroup;
    this.presentInterval = 0;

    this.message1;
    this.message2;
    this.message3;
    this.message_r1;
    this.message_r2;
    this.message_r3;

    this.lives = 3;
    this.level = 1;    
    this.choices = gameProperties.baseChoices;
    this.speed = gameProperties.baseSpeed;
    this.movementTime = gameProperties.distance / gameProperties.baseSpeed;
    this.throughput = Math.log2(this.choices + 1) / this.movementTime;

    this.wish = 1;
    this.wishSprite;
    this.selectedPresent = 1;
    this.moodSprite;    

    this.houseSprite;
    this.presentReceived = false;
};

gameState.prototype = {    
    
    preload: function () {
        game.load.image(graphicAssets.santa.name, graphicAssets.santa.URL);       
        game.load.image(graphicAssets.house.name, graphicAssets.house.URL);
        game.load.image(graphicAssets.bubble.name, graphicAssets.bubble.URL);
        game.load.image(graphicAssets.background.name, graphicAssets.background.URL);

        game.load.image(graphicAssets.face_happy.name, graphicAssets.face_happy.URL);
        game.load.image(graphicAssets.face_sad.name, graphicAssets.face_sad.URL);

        game.load.image(graphicAssets.bg_present.name, graphicAssets.bg_present.URL);
        // load present graphics
        this.loadPresents();

        game.load.image(graphicAssets.game_over.name, graphicAssets.game_over.URL);
    },
    
    create: function () {
        this.initGraphics();
        this.initPhysics();
        this.initKeyboard();    
        this.loadChoices();
        this.setPresent(1);
    },

    update: function () {
        this.checkPlayerInput();
        if (this.gameStarted) {
            this.autoMove();
        }
        this.passScreen(this.santaSprite);

        game.physics.arcade.overlap(this.houseSprite, this.presentGroup, this.receivePresent, null, this);
        
        this.updateGameStats();                    
    },

    initGraphics: function () {
        background = game.add.tileSprite(0, 0, 1024, 576, "background");
        this.santaSprite = game.add.sprite(santaProperties.startX, santaProperties.startY, graphicAssets.santa.name);        
        this.houseSprite = game.add.sprite(houseProperties.startX, houseProperties.startY, graphicAssets.house.name);
        this.moodSprite = game.add.sprite(this.houseSprite.x - 30, this.houseSprite.y + 30, graphicAssets.face_sad.name);

        this.bubbleSprite = game.add.sprite(720, gameProperties.screenHeight - 240, graphicAssets.bubble.name);
        this.wishSprite = game.add.sprite(750, gameProperties.screenHeight - 210, presentList[1].name);
        this.wishSprite.x = this.bubbleSprite.x + this.bubbleSprite.width / 2 - this.wishSprite.width / 2;
        this.wishSprite.y = this.bubbleSprite.y + this.bubbleSprite.height / 2 - this.wishSprite.height / 2 - 10;

        this.presentGroup = game.add.group();

        this.message_lives = game.add.text(20, 10, '', fontAssets.bigFontStyle);
        this.message1 = game.add.text(20, 40, '', fontAssets.bigFontStyle);
        this.message2 = game.add.text(330, 10, "Press ENTER or SPACE to start game", fontAssets.defaultFontStyle);
        this.message3 = game.add.text(380, 30, '', fontAssets.defaultFontStyle);

        this.message_r1 = game.add.text(gameProperties.screenWidth - 150, 10, '', fontAssets.defaultFontStyle);
        this.message_r2 = game.add.text(gameProperties.screenWidth - 150, 40, '', fontAssets.defaultFontStyle);
        this.message_r3 = game.add.text(gameProperties.screenWidth - 150, 60, '', fontAssets.defaultFontStyle);        
    },

    initPhysics: function () {
        game.physics.startSystem(Phaser.Physics.ARCADE);

        game.physics.enable(this.santaSprite, Phaser.Physics.ARCADE);
        this.santaSprite.body.drag.set(santaProperties.drag);

        this.presentGroup.enableBody = true;
        this.presentGroup.physicsBodyType = Phaser.Physics.ARCADE;
        //this.presentGroup.createMultiple(1, graphicAssets.present_pizza.name);        
        this.presentGroup.setAll('anchor.x', 0.5);
        this.presentGroup.setAll('anchor.y', 0.5);
        this.presentGroup.setAll('lifespan', presentProperties.lifeSpan);

        game.physics.enable(this.houseSprite, Phaser.Physics.ARCADE);
    },

    initKeyboard: function () {                
        this.key_fire = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
        this.key_fire2 = game.input.keyboard.addKey(Phaser.Keyboard.ENTER);

        this.key_present1 = game.input.keyboard.addKey(Phaser.Keyboard.ONE);
        this.key_present2 = game.input.keyboard.addKey(Phaser.Keyboard.TWO);
        this.key_present3 = game.input.keyboard.addKey(Phaser.Keyboard.THREE);
        this.key_present4 = game.input.keyboard.addKey(Phaser.Keyboard.FOUR);
        this.key_present5 = game.input.keyboard.addKey(Phaser.Keyboard.FIVE);
        this.key_present6 = game.input.keyboard.addKey(Phaser.Keyboard.SIX);
        this.key_present7 = game.input.keyboard.addKey(Phaser.Keyboard.SEVEN);
        this.key_present8 = game.input.keyboard.addKey(Phaser.Keyboard.EIGHT);
        this.key_present9 = game.input.keyboard.addKey(Phaser.Keyboard.NINE);
    },

    checkPlayerInput: function () {
        if (this.key_fire.isDown || this.key_fire2.isDown || game.input.activePointer.isDown) {
            if (this.gameStarted) {
                this.drop();                
            } else {
                this.gameStarted = true;
            }
        }

        for (var i = 1; i <= 9; i++) {
            if (this['key_present' + i].isDown) {
                this.choosePresent(i);
            }
        }
    },

    autoMove: function () {
        // game.physics.arcade.accelerationFromRotation(this.santaSprite.rotation, santaProperties.acceleration, this.santaSprite.body.acceleration);
        game.physics.arcade.velocityFromRotation(this.santaSprite.rotation, this.speed, this.santaSprite.body.velocity);
    },

    updateGameStats: function () {
        this.message1.text = 'Level: ' + this.level;
        if (this.gameStarted) {
            this.message2.text = "Press NUMBER BUTTON to select present by people's wish";
            this.message3.text = 'Press ENTER or SPACE to drop present';
        }

        this.movementTime = gameProperties.distance / this.speed;

        this.message_r1.text = 'throughput: ' + this.throughput.toFixed(2) + ' bit/sec';
        this.message_r3.text = 'movementTime: ' + this.movementTime.toFixed(2) + ' sec';
        this.message_r2.text = 'choices: ' + this.choices;

        if (this.lives == 0) {
            this.message_lives.text = 'Game Over';
            this.santaSprite.kill();
            var gameoverSprite = game.add.sprite(400, 100, graphicAssets.game_over.name);
        } else {
            this.message_lives.text = 'Lives: ' + this.lives;
        }        
    },

    passScreen: function (sprite) {
        if (sprite.x > game.width) {
            // santa claus goes pass the screen width
            sprite.x = 0;
            if (!this.presentReceived) {
                this.lives--;
                this.moodSprite = game.add.sprite(this.houseSprite.x - 30, this.houseSprite.y + 30, graphicAssets.face_sad.name);            
            } else {
                this.levelUp();
            }      
        } 
    },

    drop: function () {
        if (game.time.now > this.presentInterval) {
            var present = this.presentGroup.getFirstExists(false);
            
            if (present) {
                var length = this.santaSprite.width * 0.5;
                var x = this.santaSprite.x + (Math.cos(this.santaSprite.rotation) * length);
                var y = this.santaSprite.y + 75;
                
                present.reset(x, y);
                present.lifespan = presentProperties.lifeSpan;
                
                // present drop straight down
                game.physics.arcade.velocityFromRotation(this.santaSprite.rotation -30, presentProperties.speed, present.body.velocity);
                this.presentInterval = game.time.now + presentProperties.interval;
            }
        }        
    },    

    receivePresent: function (house, present) {
        present.kill();
        this.moodSprite.kill();
        // if receive the right present
        if (this.selectedPresent == this.wish) {
            this.presentReceived = true;
            this.moodSprite = game.add.sprite(this.houseSprite.x - 30, this.houseSprite.y + 30, graphicAssets.face_happy.name);
        } else {
            this.moodSprite = game.add.sprite(this.houseSprite.x - 30, this.houseSprite.y + 30, graphicAssets.face_sad.name);
        }
    },

    resetSanta: function () {
        this.santaSprite.reset(santaProperties.startX, santaProperties.startY);
    },

    levelUp: function () {
        // reset present received status
        this.presentReceived = false;
        // raise level num.
        this.level++;        
        // raise difficulty
        this.raiseDifficulty(gameProperties.throughputStep);
        // change the wish
        this.wish = Math.floor(Math.random() * (this.choices)) + 1;
        this.reloadWish(this.wish);
        // delete the mood
        this.moodSprite.kill();
    },

    raiseDifficulty: function (step) {        
        // raise number of choice after a number of levels
        if (this.level % gameProperties.raiseChoicesStep == 0) {
            this.choices++;
            this.loadChoices();
        }
        this.throughput += step;
        this.movementTime = Math.log2(this.choices + 1) / this.throughput;
        this.speed = gameProperties.distance / this.movementTime;
    },

    loadChoices: function () {
        // TODO: load all choices possible, base on total number of choices
        for (var i = 1; i <= this.choices; i++) {
            pos = i - 1;
            var addX = pos * 90 - Math.floor(pos/3) * 3 * 90;
            var addY = Math.floor(pos/3) * 60;
            var choiceSprite = game.add.sprite(30 + addX, 225 + addY, graphicAssets.bg_present.name);            
            var choiceContentSprite = choiceSprite.addChild(game.make.sprite(10, 10, presentList[i].name));
            choiceSprite.addChild(game.make.text(65, 35, i, fontAssets.darkFontStyle));
            choiceContentSprite.scale.setTo(0.5, 0.5);
        }
    },

    choosePresent: function (num) {
        if (num <= this.choices) {
            this.selectedPresent = num;                    
            this.setPresent(num);
        }        
    },

    // add present to santa thought
    setPresent: function (num) {
        this.santaSprite.children = [];
        this.presentGroup.children = [];

        var santaBubbleSprite = game.make.sprite(120, -50, graphicAssets.bubble.name);
        santaBubbleSprite.scale.setTo(0.5, 0.5);
        this.santaSprite.addChild(santaBubbleSprite);

        var presentSprite = game.make.sprite(140, -35, presentList[num].name);
        this.presentGroup.addChild(presentSprite);
        this.presentGroup.createMultiple(1, presentList[num].name);
        presentSprite.scale.setTo(0.5, 0.5);
        this.santaSprite.addChild(presentSprite);
    },

    loadPresents: function () {
        var assetKeys = Object.keys(graphicAssets);
        for (var i = 0; i < assetKeys.length; i++) {
            var assetName = assetKeys[i];
            if (assetName.substring(0,8) == 'present_') {
                var presentAsset = graphicAssets[assetName];
                // load present sprite
                game.load.image(presentAsset.name, presentAsset.URL);
                // add present to list
                presentList.push(presentAsset);
            }
        }
        // shuffle the present list for every game
        this.shuffle(presentList);
    },

    shuffle: function(list){
        for(var j, x, i = list.length; i; j = parseInt(Math.random() * i), x = list[--i], list[i] = list[j], list[j] = x);
        return list;
    },

    reloadWish: function (wish_num) {
        this.wishSprite.kill();
        this.wishSprite = game.add.sprite(750, gameProperties.screenHeight - 210, presentList[wish_num].name);        

        this.wishSprite.x = this.bubbleSprite.x + this.bubbleSprite.width / 2 - this.wishSprite.width / 2;
        this.wishSprite.y = this.bubbleSprite.y + this.bubbleSprite.height / 2 - this.wishSprite.height / 2 - 10;
    }
};

var game = new Phaser.Game(gameProperties.screenWidth, gameProperties.screenHeight, Phaser.AUTO, 'gameDiv');
game.state.add(states.game, gameState);
game.state.start(states.game);
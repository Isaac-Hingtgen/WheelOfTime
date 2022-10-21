window.addEventListener("load", () => {
    

    const player1 = new Person("Perrin", 1, 400, 255);
    const player2 = new Person("Rand", 2, 800, 255);
    
    const input = new Input()
    const world = new World('dark')
    
    world.loadMap();
    world.drawCharacter(player1);
    
    play()

    

    function play() {
        world.loadMap();
        world.drawCharacter(player1);

        input.getInputs(player1, player2);
        world.checkCollisions(player1);
        
        requestAnimationFrame(play);
    }

    // const gameBar = document.getElementById('gameBar');
    // const headDiv = createHeader(4, gameBar);
});

class World {
    constructor(map) {
        this.canvas = document.getElementById('gameWindow');
        this.context = this.canvas.getContext('2d');
        this.width = this.canvas.width = 1000;
        this.height = this.canvas.height = this.width * .6;

        this.canvas.addEventListener('click', (event) => console.log(`Mouse X: ${event.clientX}, Mouse Y: ${event.clientY}`))
        
        this.land = [
            new Floor(330,340,840,400), // main
            new Floor(300,355,880,360), // main outskirts
            new Floor(145,280,235,285), // bigger on left
            new Floor(900,415,980,420), // right
            new Floor(65,312,130,315)   // smaller on left
        ];
        
        this.map = document.getElementById(`${map}`);
    }
    loadMap() {
        this.context.drawImage(this.map, 0, 0, this.width, this.height);
    }
    drawCharacter(player) {
        this.context.drawImage(
            player.type.avatar, 
            player.col, player.row, 
            player.PNGDimensions[0], player.PNGDimensions[1], 
            player.xp, player.yp, 
            player.width, player.height
        );

        player.updateHitboxLocation();

        // this.context.beginPath();
        // this.context.rect(player.hitBox.left,player.hitBox.top,player.hitBoxWidth,player.hitBoxHeight);
        // this.context.fill();
        
    }
    checkCollisions(player) {
        
        if(player.hitBox.left + player.xvelocity < 0) player.xp = 0-player.hitBoxLorRMargin;
        if(player.hitBox.right + player.xvelocity > 1000) player.xp = 1000 - (player.hitBoxWidth + player.hitBoxLorRMargin);
        if(player.hitBox.top > 800) {
            player.resetPlayer();
        } 

        let onAtLeastOnePlatform = 0;        
        this.land.forEach((floor) => {
            if(player.hitBox.bottom + player.yvelocity <= floor.top || player.hitBox.right <= floor.left || player.hitBox.left >= floor.right || player.hitBox.top >= floor.bottom) {
                player.yvelocity += player.g;  // not on platform
            } else {
                player.yp = floor.top - player.hitBoxHeight - player.hitBoxTorBMargin;
                player.yvelocity = 0;  // on platform
                onAtLeastOnePlatform++;
            } 
        player.onGround = (onAtLeastOnePlatform) ? true : false;
        })
    }
}

class Floor {
    constructor(x1, y1, x2, y2) {
        this.left = x1;
        this.right = x2;
        this.bottom = y2;
        this.top = y1;
    }
}

class Person {
    constructor(type, num, initialX, initialY) {
        this.type = new Type(type);
        this.health = 100;
        this.playerNumber = num;
        this.g = 0.3;
        this.initialX = initialX;
        this.initialY = initialY;
        if (num == 1){
            this.xp = initialX;
            this.yp = initialY;
        } else {
            this.xp = initialX;
            this.yp = initialX;
        }
        this.PNGDimensions = [18,20];
        this.height = this.PNGDimensions[1]*1.4;
        this.width = this.PNGDimensions[0]*1.4;
        this.hitBoxTBMargin = this.height*(4/20.0);
        this.hitBoxTorBMargin = this.hitBoxTBMargin / 2.0;
        this.hitBoxLRMargin = this.width*(7/18.0);
        this.hitBoxLorRMargin = this.hitBoxLRMargin / 2.0;
        this.hitBoxWidth = this.width-11;
        this.hitBoxHeight = this.height-4;
        this.xvelocity = 0;
        this.yvelocity = 0;
        this.row = 0;
        this.col = 0;
        this.onGround = false;
        this.isRunning = false;
        
    }
    move(key) {
        if(this.playerNumber == 1){
            key.forEach(element => { 
                switch (element) {
                    case 'd': 
                        this.xvelocity = 1; 
                        break;
                    case 'a': 
                        this.xvelocity = -1; 
                        break;
                    case ' ':  // jumping
                        if (this.onGround) {
                            this.yvelocity = -20;
                        }
                        break;
                } 
                
            });
        this.updatePlayerPNG();
        this.xp = this.xp + (this.type.speed * this.xvelocity);
        this.xvelocity = 0;
        this.yp += this.yvelocity;
        }
    }
    updateHitboxLocation() {
        this.hitBox = { 
            left: this.xp+this.hitBoxLorRMargin, 
            bottom: this.yp+this.hitBoxTorBMargin+(this.hitBoxHeight), 
            right: this.xp+this.hitBoxLorRMargin+(this.hitBoxWidth), 
            top: this.yp+this.hitBoxTorBMargin
        };
    }
    updatePlayerPNG() {
        this.row = (this.onGround) ? 0 : this.PNGDimensions[1];
        this.col = (this.onGround && Math.abs(this.xvelocity) > 0) ? this.PNGDimensions[0] : 0;
    }
    resetPlayer() {
        this.yvelocity = 0;
        this.xp = this.initialX;
        this.yp = this.initialY;
    }
}



class Type {
    constructor(name) {
        this.name = name;
        this.avatar = document.getElementById(name);
        this.speed = this.getSpeed(name)*2;
        this.strength = this.getStrength(name);
    }
    getSpeed(n) {
        if (n === "Rand") {
            return 5;
        } else if (n === "Perrin") {
            return 4;
        } else if (n === "Mat") {
            return 6;
        }
    }
    getStrength(n) {
        if (n === "Rand") {
            return 5;
        } else if (n === "Perrin") {
            return 6;
        } else if (n === "Mat") {
            return 4;
        }
    }
}

class Input {
    constructor() {
        this.keys = [];
    }
    getInputs(p1, p2) {
       

    
        
        window.addEventListener("keydown", (event) => {
            if (this.keys.indexOf(event.key) < 0) 
                this.keys.push(event.key);
        });
        
        p1.move(this.keys);
        p2.move(this.keys);

        window.addEventListener("keyup", (event) => {
            if (this.keys.indexOf(event.key) >= 0) 
                this.keys.splice(this.keys.indexOf(event.key), 1);
        });
       
    }
}








function createHeader(numTabs, bar) {
    const headerButtons = [];
    for (var i = 0; i < numTabs; i++) {
        headerButtons[i] = document.createElement('div');
        bar.appendChild(headerButtons[i]);
    }
    return headerButtons;
}
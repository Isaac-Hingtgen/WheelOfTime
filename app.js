window.addEventListener("load", () => {

    const W = 1500;
    const H = W * 0.6;
    
    const player1 = new Person("Perrin", 1, W * 0.4, H * 0.5, W, H);
    const player2 = new Person("Perrin", 2, W * 0.8, H * 0.5, W, H);
    const input = new Input();
    const world = new World('dark', W, H);
    
    play();

    function play() {
        world.loadMap();
        world.drawCharacter(player1);
        world.drawCharacter(player2);

        input.getInputs(player1, player2);
        world.checkCollisions(player1);
        world.checkCollisions(player2);
        player1.hits(player2);
        player2.hits(player1);
        
        requestAnimationFrame(play);
    }

    // const gameBar = document.getElementById('gameBar');
    // const headDiv = createHeader(4, gameBar);
});

class World {
    constructor(map, width, height) {
        this.canvas = document.getElementById('gameWindow');
        this.context = this.canvas.getContext('2d');
        this.width = this.canvas.width = width;
        this.height = this.canvas.height = height;

        this.canvas.addEventListener('click', (event) => console.log(`Mouse X: ${event.clientX}, Mouse Y: ${event.clientY}`))
        
        this.land = [
            new Floor(330,343,840,400,this), // main
            new Floor(300,355,880,360,this), // main outskirts
            new Floor(145,280,235,285,this), // bigger on left
            new Floor(900,415,980,420,this), // right
            new Floor(65,312,130,315,this)   // smaller on left
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
        player.updateAttackHitbox();


//--------------------------------debugging--------------------------------------------------------------        
        // this.context.fillRect(player.hitBox.left,player.hitBox.top,player.hitBoxWidth,player.hitBoxHeight);

        // let top = player.attackHitbox.top;
        // let left = player.attackHitbox.left;
        // let width = player.attackHitbox.right - left;
        // let height = player.attackHitbox.bottom - top;

        // this.context.fillRect(left, top, width, height);
//--------------------------------debugging--------------------------------------------------------------        
    }
    checkCollisions(player) {
        
        // if(player.hitBox.left + player.xvelocity < 0) player.xp = 0-player.hitBoxLorRMargin;
        // if(player.hitBox.right + player.xvelocity > 1000) player.xp = 1000 - (player.hitBoxWidth + player.hitBoxLorRMargin);
        if(player.hitBox.top > this.height) {
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
        })
        player.onGround = (onAtLeastOnePlatform) ? true : false;
        if (player.onGround) {
            player.secondJump = true;
        }
            
        
    }
}

class Floor {
    constructor(x1, y1, x2, y2, world) {
        this.left = x1 / 1000 * world.width;
        this.right = x2 / 1000 * world.width;
        this.bottom = y2 / 600 * world.height;
        this.top = y1 / 600 * world.height;
    }
}

class Person {
    constructor(type, num, initialX, initialY, canvasWidth, canvasHeight) {
        this.type = new Type(type);
        this.health = 100;
        this.playerNumber = num;
        this.initialX = initialX;
        this.initialY = initialY;
        this.xp = initialX;
        this.yp = initialY;
        this.PNGDimensions = [21,22];
        this.row = 0;
        this.col = 0;
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
        this.g = 0.15;
        this.acceleration = 0;
        this.onGround = false;
        this.secondJump = true;
        this.isRunning = false;
        this.attacking = false;
        this.coolingDown = false;
        this.facingRight = (num === 1) ? true : false;
    }
    move(key) {
        if(this.playerNumber === 1){
            key.forEach(element => { 
                switch (element) {
                    case 'd': 
                        this.goRight();
                        break;
                    case 'a': 
                        this.goLeft();
                        break;
                    case ' ':  // jumping
                        if (this.onGround || this.secondJump) {
                            this.jump();
                        }
                        break;
                    case 's': case 'w':
                        if (!this.coolingDown) {
                            this.attack(element);
                        }
                        break;
                }    
            });
        } else {
            key.forEach(element => { 
                switch (element) {
                    case '6': 
                        this.goRight();
                        break;
                    case '4': 
                        this.goLeft();
                        break;
                    case 'Enter':  // jumping
                        if (this.onGround || this.secondJump) {
                            this.jump();
                        }
                        break;
                    case '5': case '8':
                        if (!this.coolingDown) {
                            this.attack(element);
                        }
                        break;
                }
            });
        }
        if (key.length === 0 || this.attacking) {
            this.isRunning = false;
        }
        this.updatePlayerPNG();
        
        this.xp += (this.type.speed * this.xvelocity);
        if(this.onGround) {
            this.xvelocity -= this.xvelocity / 2;
        } else {
            this.xvelocity -= this.xvelocity / 5;
        }
        this.yp += this.yvelocity;
    }
    goRight() {
        this.xvelocity = 1;
        this.facingRight = true;
        this.isRunning = true;
    }
    goLeft() {
        this.xvelocity = -1;
        this.facingRight = false;
        this.isRunning = true;
    }
    jump() {
        this.yvelocity = -15;
        setTimeout(() => {
            this.secondJump = false;
        }, 400);
    }
    attack(dir) {
        this.coolingDown = true;
        this.attacking = true;
        this.attackDirection = (dir === 'w' || dir === '8') ? 1 : -1;
        setTimeout(()=>{
            this.attacking = false
            setTimeout(()=>{this.coolingDown = false}, 200);
        }, 300);
        
    }
    hits(p2) {
        let weaponArea = this.attackHitbox;
        let body = p2.hitBox;
        const knockbackMultiplier = 0.8;
        if (this.attacking) {
            if (weaponArea.left < body.right && weaponArea.right > body.left && weaponArea.bottom > body.top && weaponArea.top < body.bottom) {
                if(this.attackDirection > 0) { // up attack
                    p2.yvelocity = -3 * knockbackMultiplier * this.type.strength;
                    if(this.facingRight) p2.xvelocity = this.type.strength * knockbackMultiplier;
                    else p2.xvelocity = -this.type.strength * knockbackMultiplier;
                } else { // down attack
                    p2.yvelocity = 6 * knockbackMultiplier * this.type.strength;
                    if(this.facingRight) p2.xvelocity = this.type.strength * knockbackMultiplier / 10;
                    else p2.xvelocity = -this.type.strength * knockbackMultiplier / 10;
                }
                
            }
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
    updateAttackHitbox() {
        let dirR = (this.facingRight) ? 1 : 0.5; // 1 is right, 0 is left
        let dirL = (this.facingRight) ? 0.5 : 1;
        const centerY = this.yp + this.height / 2.0;
        const centerX = this.xp + this.width / 2.0;
        this.attackHitbox = {
            left: centerX - dirL * this.width / 2.0,
            top: this.yp,
            right: centerX + dirR * this.width / 2.0,
            bottom: centerY + this.height / 4.0
        };
    }
    updatePlayerPNG() {
        let gameFrame = 0;
        const staggerFrame = 30;

        if (this.facingRight) {
            this.type.avatar = this.type.avatarR;
        } else {
            this.type.avatar = this.type.avatarL;
        }

        if (gameFrame % staggerFrame == 0){ //running
            this.col = (this.onGround && this.isRunning && this.col < 3) ? this.row + this.PNGDimensions[0] : 0;
        }
        gameFrame++;
        
        this.row = (this.onGround) ? 0 : this.PNGDimensions[1]; //jumping

        if(this.attacking) {
            this.row = this.PNGDimensions[1] * 2;
            
        }
    }
    resetPlayer() {
        this.facingRight = true;
        this.yvelocity = 0;
        this.xp = this.initialX;
        this.yp = this.initialY;
    }
}



class Type {
    constructor(name) {
        this.name = name;
        this.avatarR = document.getElementById(name);
        this.avatarL = document.getElementById(name + "L");
        this.avatar = this.avatarR;
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
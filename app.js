let gameFrame = 0;
const ratio = 0.48;

window.addEventListener("load", () => {

    const W = window.innerWidth;
    const H = W * ratio;
    
    const player1 = new Person("Perrin", 1, W * 0.4, H * 0.5, W, H);
    const player2 = new Person("Perrin", 2, W * 0.7, H * 0.5, W, H);
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
        
        gameFrame++;
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
        this.map = document.getElementById(`${map}`);

        this.canvas.addEventListener('click', (event) => console.log(`Mouse X: ${event.clientX / width}, Mouse Y: ${event.clientY / height}`))
        
        this.land = [
            new Floor(0.332,0.568,0.837,0.6,this), // main
            new Floor(0.305,0.5875,0.871,0.59,this), // main outskirts
            new Floor(0.149,0.4625,0.23,0.47,this), // bigger on left
            new Floor(0.910,0.6875,0.977,0.688,this), // right
            new Floor(0.069,0.51875,0.123,0.527,this)   // smaller on left
        ];  
    }

    loadMap() {
        this.context.drawImage(this.map, 0, 0, this.width, this.height);
    }

    drawCharacter(player) {
        this.context.drawImage(
            player.type.avatar, 
            player.PNG.col, player.PNG.row, 
            player.PNG.width, player.PNG.height, 
            player.xp, player.yp, 
            player.width, player.height
        );

        player.updateHitboxLocation();
        player.updateAttackHitbox();
//--------------------------------debugging--------------------------------------------------------------        
     // this.context.fillRect(player.hitBox.left,player.hitBox.top,player.hitBox.width,player.hitBox.height);

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
        this.land.every((floor) => {
            if(player.hitBox.bottom + player.yvelocity <= floor.top || player.hitBox.right <= floor.left || player.hitBox.left >= floor.right || player.hitBox.bottom >= floor.bottom) {
                player.yvelocity += player.g / this.land.length;  // not on platform
            } else {
                player.yp = floor.top - player.hitBox.height - player.hitBox.marginTB;
                if(player.isStunned) {
                    player.yvelocity = -player.yvelocity * player.bounceMultiplier;
                    player.isStunned = false;
                    return false;
                } else {
                    player.yvelocity = 0;  // on platform
                    onAtLeastOnePlatform++;
                }
            } 
            return true;
        })
//-------------ceiling-----------------
        if(player.hitBox.top < 0) {
            player.yp = 0;
            player.yvelocity = Math.abs(player.yvelocity) * player.bounceMultiplier;
            player.isStunned = true;
        }
//--------------left wall--------------
        if(player.hitBox.left < 0) {
            player.xp = 0 - player.hitBox.marginLR;
            player.xvelocity = Math.abs(player.xvelocity) * player.bounceMultiplier;
            player.isStunned = true;
            player.locked();
        }
//--------------right wall-------------
        if(player.hitBox.right > this.width) {
            player.xp = this.width - player.hitBox.width - player.hitBox.marginLR;
            player.xvelocity = -1 * Math.abs(player.xvelocity) * player.bounceMultiplier;
            player.isStunned = true;
            player.locked();
        }

        
//--------------check if player is on ground and has second jump------------
        player.onGround = (onAtLeastOnePlatform) ? true : false;
        if (player.onGround) player.secondJump = true;
    }
}

class Floor {
    constructor(x1, y1, x2, y2, world) {
        this.left = x1 * world.width;
        this.right = x2 * world.width;
        this.bottom = y2 * world.height;
        this.top = y1 * world.height;
    }
}

class Person {
    constructor(type, num, initialX, initialY, canvasWidth, canvasHeight) {
        this.type = new Type(type);
        this.playerNumber = num;
        this.initialX = initialX;
        this.initialY = initialY;
        const pHeight = this.height = canvasHeight / 10;
        const pWidth = this.width = canvasWidth / 20;

        this.PNG = {
            width: 31.0,
            height: 31.0,
            marginTB: 8,
            marginLR: 10,
            row: 0,
            col: 0
        }

        this.hitBox = {
            marginTB: pHeight * this.PNG.marginTB / this.PNG.height,
            marginLR: pWidth * this.PNG.marginLR / this.PNG.width,
            width: pWidth - 2 * pWidth * this.PNG.marginLR / this.PNG.width,
            height: pHeight - 2 * pHeight * this.PNG.marginTB / this.PNG.height
        }
        this.updateHitboxLocation();

        this.totalHealth = 100;
        this.damage = 0;
        this.knockbackMultiplier = this.damage / this.totalHealth;
        
        this.xp = initialX;
        this.yp = initialY; 
        this.speed = canvasWidth / 900;
        this.xvelocity = 0;
        this.yvelocity = 0;
        this.g = canvasHeight / 2000;
        this.airResistance = canvasWidth / 30000;
        this.friction = 0.25;
        this.acceleration = 0;
        this.jumpHeight = canvasHeight / 70;
        this.bounceMultiplier = canvasHeight / 2000;
        this.onGround = false;
        this.secondJump = true;
        this.isRunning = false;
        this.attacking = false;
        this.coolingDown = false;
        this.isStunned = false;
        this.stunLocked = false;
        this.isInvincible = false;
        this.facingRight = (num === 1) ? true : false;
    }

    move(key) {
        if (!this.stunLocked) {
            if(this.playerNumber === 1){ // player 1
                key.forEach(element => { 
                    switch (element) {
                        case 'd': 
                            this.goRight();
                            break;
                        case 'a': 
                            this.goLeft();
                            break;
                        case ' ':  // jumping
                            this.jump();
                            break;
                        case 's': case 'w':
                            this.attack(element);
                            break;
                    }    
                });
            } else { // player 2
                key.forEach(element => { 
                    switch (element) {
                        case '6': 
                            this.goRight();
                            break;
                        case '4': 
                            this.goLeft();
                            break;
                        case 'Enter':  // jumping
                            this.jump();
                            break;
                        case '5': case '8':
                            this.attack(element);
                            break;
                    }
                });
            }
        }
        
        this.stopRunning(key);
        this.updatePlayerPNG();
        this.updatePlayerLocation();
    }

    locked() {
        if(!this.stunLocked) {
            this.stunLocked = true;
            setTimeout(() => {this.stunLocked = false}, 200);
        }
    }

    goRight() {
        this.xvelocity = this.speed;
        this.facingRight = true;
        this.isRunning = true;
    }

    goLeft() {
        this.xvelocity = -this.speed;
        this.facingRight = false;  
        this.isRunning = true;
    }

    jump() {
        if (this.secondJump) {
            if (this.onGround) {
                this.yvelocity = -this.jumpHeight;
                setTimeout(() => {
                    this.secondJump = true;
                }, 200);
            } else {
                this.secondJump = false;
                this.yvelocity = -this.jumpHeight;
            }
        }
    }

    attack(dir) {
        if (!this.coolingDown) {
            this.coolingDown = true;
            this.attacking = true;
            this.attackDirection = (dir === 'w' || dir === '8') ? 1 : -1;
            setTimeout(()=>{
                this.attacking = false
                setTimeout(() => {
                    this.coolingDown = false
                    this.attackDirection = 0;
                }, 200);
            }, 300);
        }
    }

    hits(p2) {
        let weaponArea = this.attackHitbox;
        let body = p2.hitBox;
        let dmg;
        this.knockbackMultiplier = p2.damage / p2.totalHealth + 0.001;
        if (this.attacking) {
            if (weaponArea.left < body.right && weaponArea.right > body.left && weaponArea.bottom > body.top && weaponArea.top < body.bottom && !p2.isInvincible) {
                p2.isInvincible = true;
                p2.isStunned = true;
                p2.locked();
                setTimeout(() => {p2.isInvincible = false}, 300);
                if(this.attackDirection > 0) { // up attack
                    dmg = 13;
                    p2.yvelocity = -5 * this.knockbackMultiplier * this.type.strength;
                    if(this.facingRight) p2.xvelocity = this.type.strength * this.knockbackMultiplier;
                    else p2.xvelocity = -this.type.strength * this.knockbackMultiplier;
                } else { // down attack
                    dmg = 10;
                    p2.yvelocity = 20 * this.knockbackMultiplier * this.type.strength;
                    if(this.facingRight) p2.xvelocity = this.type.strength * this.knockbackMultiplier / 10;
                    else p2.xvelocity = -this.type.strength * this.knockbackMultiplier / 10;
                }
                p2.updateDamage(dmg);
            }
        }
    }

    stopRunning(keys) {
        if (keys.length === 0 || this.attacking || !this.onGround) {
            this.isRunning = false;
        }
    }

    updateDamage(dmg) {
        this.damage += dmg; 
    }

    updatePlayerLocation() {
        if(this.onGround) {
            this.xvelocity -= this.xvelocity * this.friction;
        } else {
            this.xvelocity -= this.xvelocity * this.airResistance;
        }
        this.xp += (this.type.speed * this.xvelocity);
        this.yp += this.yvelocity;
    }

    updateHitboxLocation() {
        this.hitBox.left = this.xp + this.hitBox.marginLR, 
        this.hitBox.bottom = this.yp + this.hitBox.marginTB + this.hitBox.height, 
        this.hitBox.right = this.xp + this.hitBox.marginLR + this.hitBox.width, 
        this.hitBox.top = this.yp + this.hitBox.marginTB
    }

    updateAttackHitbox() {
        let dirR = (this.facingRight) ? 1 : 0.5; // 1 is right, 0 is left
        let dirL = (this.facingRight) ? 0.5 : 1;
        let upAttack = (this.attackDirection > 0) ? true : false;
        const centerY = this.yp + this.height / 2.0;
        const centerX = this.xp + this.width / 2.0;
        if(upAttack) {
            this.attackHitbox = {
                left: centerX - dirL * this.width / 1.5,
                top: this.yp,
                right: centerX + dirR * this.width / 1.5,
                bottom: centerY + this.height / 4.0
            };
        } else {
            this.attackHitbox = {
                left: centerX - dirL * this.width,
                top: centerY,
                right: centerX + dirR * this.width,
                bottom: centerY + this.height *2.0
            };
        }
    }

    updatePlayerPNG() {
        const staggerFrame = 5;
//-------direction--------------
        if (this.facingRight) {
            this.type.avatar = this.type.avatarR;
        } else {
            this.type.avatar = this.type.avatarL;
        }
//-------running----------------
        if (this.isRunning) {
            if (gameFrame % staggerFrame === 0){ //running
                if (this.PNG.col < 2 * this.PNG.width) {
                    this.PNG.col += this.PNG.width;
                }
                else {
                    this.PNG.col = 1;
                }
            } 
        } else {
            this.PNG.col = 0;
        }
//---------jumping---------------
        if (!this.onGround) {
            this.PNG.col = 0;
            this.PNG.row = this.PNG.height; //jumping
        } else {
            this.PNG.row = 0;
        }
//---------attacking-------------
        if(this.attacking) {
            this.PNG.row = this.PNG.height * 2;
            if (this.attackDirection > 0) {
                this.PNG.col = 0;
            } else if (this.attackDirection < 0) {
                this.PNG.col = 1 * this.PNG.width;
                setTimeout(() => {
                    this.PNG.col = 2 * this.PNG.width
                    this.PNG.row = this.PNG.height * 2;
                }, 100);
            }
        }
    }

    resetPlayer() {
        this.facingRight = true;
        this.yvelocity = 0;
        this.xp = this.initialX;
        this.yp = this.initialY;
        this.damage = 0;
    }
}



class Type {
    constructor(name) {
        this.name = name;
        this.avatarR = document.getElementById(name);
        this.avatarL = document.getElementById(name + "L");
        this.avatar = this.avatarR;
        const speedMultiplier = 1.7;
        this.speed = this.getSpeed(name) * speedMultiplier;
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
// ============================================
// ACT 1: INTRO SCENE
// ============================================
class IntroScene extends Phaser.Scene {
    constructor() { super({ key: 'IntroScene' }); }

    create() {
        this.createForest();
        this.player = new Player(this, 150, 450);
        this.dragon = new Dragon(this, 600, 300, 'friendly');
        this.dialogueBox = new DialogueBox(this);
        
        this.hasApproachedDragon = false;
        this.hasTalkedToDragon = false;
        this.bondFormed = false;
        this.canMove = true;
        this.cursors = this.input.keyboard.createCursorKeys();
        
        this.input.on('pointerdown', () => {
            if (this.dialogueBox.isVisible()) {
                this.dialogueBox.handleClick();
            } else if (this.hasApproachedDragon && !this.hasTalkedToDragon) {
                this.startConversation();
            } else if (this.hasTalkedToDragon && !this.bondFormed) {
                this.formBond();
            }
        });
        
        this.physics.add.overlap(this.player.getSprite(), this.dragon.getSprite(), () => this.onPlayerNearDragon(), null, this);
        
        // Intro Text
        const wakeText = this.add.text(400, 100, 'You wake up in a mysterious forest...', { fontSize: '24px', fill: '#ffffff', fontFamily: 'Courier New', stroke: '#000000', strokeThickness: 4, align: 'center' }).setOrigin(0.5).setAlpha(0);
        this.tweens.add({ targets: wakeText, alpha: 1, duration: 2000, onComplete: () => {
            this.time.delayedCall(2000, () => {
                this.tweens.add({ targets: wakeText, alpha: 0, duration: 1000, onComplete: () => wakeText.destroy() });
            });
        }});
        
        this.hintText = this.add.text(400, 550, 'Use Arrow Keys to move', { fontSize: '18px', fill: '#4ecca3', fontFamily: 'Courier New' }).setOrigin(0.5);
        this.tweens.add({ targets: this.hintText, alpha: 0.5, duration: 1000, yoyo: true, repeat: -1 });
    }

    createForest() {
        const sky = this.add.graphics();
        sky.fillGradientStyle(0x2d4a3e, 0x2d4a3e, 0x1a2e1a, 0x1a2e1a, 1);
        sky.fillRect(0, 0, 800, 600);
        
        const ground = this.add.graphics();
        ground.fillStyle(0x3a5a3a, 1);
        ground.fillRect(0, 500, 800, 100);
        
        for (let i = 0; i < 100; i++) {
            const x = Phaser.Math.Between(0, 800);
            const y = Phaser.Math.Between(500, 590);
            const grass = this.add.graphics();
            grass.fillStyle(0x4a7a4a, 1);
            grass.fillTriangle(x, y, x - 2, y + 5, x + 2, y + 5);
        }
        
        for (let i = 0; i < 20; i++) {
            const x = Phaser.Math.Between(0, 800);
            const height = Phaser.Math.Between(100, 200);
            const tree = this.add.graphics();
            tree.fillStyle(0x3a2a1a, 1);
            tree.fillRect(x - 8, 500 - height, 16, height);
            tree.fillStyle(0x2a4a2a, 0.8);
            tree.fillCircle(x, 500 - height, 30);
            tree.fillCircle(x - 20, 500 - height + 10, 25);
            tree.fillCircle(x + 20, 500 - height + 10, 25);
            tree.fillCircle(x, 500 - height - 20, 28);
        }
    }

    onPlayerNearDragon() {
        if (!this.hasApproachedDragon) {
            this.hasApproachedDragon = true;
            this.hintText.setText('Click to talk to the dragon');
            this.tweens.add({ targets: this.dragon.getSprite(), scaleX: -1, duration: 300 });
        }
    }

    startConversation() {
        if (this.hasTalkedToDragon) return;
        this.hasTalkedToDragon = true;
        this.canMove = false;
        this.player.freeze();
        
        const dialogues = [
            { speaker: 'Dragon', text: '*The dragon looks at you with intelligent eyes*' },
            { speaker: 'Dragon', text: 'A human... You don\'t seem afraid.' },
            { speaker: 'You', text: 'Should I be?' },
            { speaker: 'Dragon', text: 'Most are. But you... you\'re different.' },
            { speaker: 'Dragon', text: 'I am Toothless, last of the Night Furies.' },
            { speaker: 'You', text: 'I\'m... I don\'t remember my name. But I feel like I know you.' },
            { speaker: 'Toothless', text: 'Perhaps our fates are intertwined, young one.' },
            { speaker: 'Toothless', text: 'Touch me, and let us see if we are meant to fly together.' }
        ];
        
        this.dialogueBox.show(dialogues, () => {
            this.canMove = true;
            this.hintText.setText('Click the dragon to form a bond');
        });
    }

    formBond() {
        if (this.bondFormed) return;
        this.bondFormed = true;
        this.canMove = false;
        this.player.freeze();
        this.hintText.setVisible(false);
        this.cameras.main.shake(500, 0.01);
        
        for (let i = 0; i < 30; i++) {
            this.time.delayedCall(i * 50, () => {
                const heart = this.add.graphics();
                heart.fillStyle(0xff6b9d, 1);
                heart.fillCircle(0, -3, 4);
                heart.fillCircle(5, -3, 4);
                heart.fillTriangle(0, 0, 10, 0, 5, 10);
                heart.x = this.dragon.getSprite().x;
                heart.y = this.dragon.getSprite().y;
                const angle = Phaser.Math.Between(0, 360);
                const speed = Phaser.Math.Between(100, 300);
                this.tweens.add({
                    targets: heart,
                    x: heart.x + Math.cos(angle * Math.PI / 180) * speed,
                    y: heart.y + Math.sin(angle * Math.PI / 180) * speed,
                    alpha: 0,
                    scale: 2,
                    duration: 2000,
                    ease: 'Cubic.easeOut',
                    onComplete: () => heart.destroy()
                });
            });
        }

        const bondText = this.add.text(400, 250, 'A bond is formed.', { fontSize: '40px', fill: '#ff6b9d', fontFamily: 'Courier New', stroke: '#000000', strokeThickness: 6 }).setOrigin(0.5).setAlpha(0);
        this.tweens.add({ targets: bondText, alpha: 1, y: 230, duration: 1500, ease: 'Back.easeOut' });
        
        this.time.delayedCall(3000, () => {
            this.cameras.main.fadeOut(1500);
            this.time.delayedCall(1500, () => this.scene.start('ExplorationScene'));
        });
    }

    update() {
        if (this.canMove && !this.dialogueBox.isVisible()) this.player.update(this.cursors);
    }
}

// ============================================
// ACT 2: EXPLORATION SCENE
// ============================================
class ExplorationScene extends Phaser.Scene {
    constructor() { super({ key: 'ExplorationScene' }); }

    create() {
        this.cameras.main.fadeIn(1500);
        const sky = this.add.graphics();
        sky.fillGradientStyle(0x4a90e2, 0x4a90e2, 0x87ceeb, 0x87ceeb, 1);
        sky.fillRect(0, 0, 800, 600);
        sky.setDepth(-10);
        
        this.createClouds();
        this.createMountains();
        this.createFlyingDragon();
        
        this.time.delayedCall(5000, () => this.spawnEnemyDragon());
        
        const text = this.add.text(400, 100, 'You soar through the skies together...', { fontSize: '26px', fill: '#ffffff', fontFamily: 'Courier New', stroke: '#000000', strokeThickness: 4, align: 'center' }).setOrigin(0.5).setAlpha(0);
        this.tweens.add({ targets: text, alpha: 1, duration: 2000, onComplete: () => {
            this.time.delayedCall(2000, () => {
                this.tweens.add({ targets: text, alpha: 0, duration: 1000, onComplete: () => text.destroy() });
            });
        }});
    }

    createClouds() {
        this.clouds = [];
        for (let i = 0; i < 10; i++) {
            const cloud = this.add.graphics();
            cloud.fillStyle(0xffffff, 0.7);
            const numPuffs = Phaser.Math.Between(4, 7);
            for (let j = 0; j < numPuffs; j++) cloud.fillCircle(j * 18, Phaser.Math.Between(-5, 5), Phaser.Math.Between(12, 18));
            cloud.x = Phaser.Math.Between(-100, 900);
            cloud.y = Phaser.Math.Between(100, 400);
            cloud.scrollSpeed = Phaser.Math.Between(2, 4);
            cloud.setDepth(-5);
            this.clouds.push(cloud);
        }
    }

    createMountains() {
        this.mountains = [];
        for (let i = 0; i < 8; i++) {
            const mountain = this.add.graphics();
            const baseWidth = Phaser.Math.Between(120, 200);
            const height = Phaser.Math.Between(150, 250);
            const x = i * 150 - 100;
            const y = 600;
            mountain.fillStyle(0x4a5a4a, 1);
            mountain.fillTriangle(x, y, x + baseWidth / 2, y - height, x + baseWidth, y);
            mountain.fillStyle(0xffffff, 0.9);
            mountain.fillTriangle(x + baseWidth / 2 - 20, y - height + 40, x + baseWidth / 2, y - height, x + baseWidth / 2 + 20, y - height + 40);
            mountain.scrollSpeed = 1;
            mountain.setDepth(-8);
            this.mountains.push(mountain);
        }
    }

    createFlyingDragon() {
        this.flyingUnit = this.add.container(200, 300);
        const dragonGraphics = this.add.graphics();
        this.drawFlyingDragon(dragonGraphics);
        dragonGraphics.generateTexture('flying_dragon', 120, 80);
        dragonGraphics.destroy();
        this.dragonSprite = this.add.sprite(0, 0, 'flying_dragon');
        
        const playerGraphics = this.add.graphics();
        const px = 16, py = 16;
        playerGraphics.fillStyle(COLORS.player.pants, 1);
        playerGraphics.fillRect(px - 4, py + 2, 3, 6);
        playerGraphics.fillRect(px + 1, py + 2, 3, 6);
        playerGraphics.fillStyle(COLORS.player.shirt, 1);
        playerGraphics.fillRect(px - 5, py - 4, 10, 7);
        playerGraphics.fillStyle(COLORS.player.skin, 1);
        playerGraphics.fillRect(px - 6, py - 2, 3, 5);
        playerGraphics.fillCircle(px, py - 8, 5);
        playerGraphics.fillStyle(COLORS.player.hair, 1);
        playerGraphics.fillCircle(px - 2, py - 11, 4);
        playerGraphics.fillCircle(px + 2, py - 11, 4);
        playerGraphics.generateTexture('riding_player', 32, 32);
        playerGraphics.destroy();
        
        this.playerSprite = this.add.sprite(-10, -15, 'riding_player');
        this.flyingUnit.add([this.dragonSprite, this.playerSprite]);
        
        this.tweens.add({ targets: this.flyingUnit, y: 320, duration: 2000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this.tweens.add({ targets: this.dragonSprite, scaleY: 1.05, duration: 400, yoyo: true, repeat: -1 });
    }

    drawFlyingDragon(graphics) {
        // FIXED: Replaced centerX/centerY with cx/cy to fix ReferenceError
        const cx = 60, cy = 40;
        graphics.fillStyle(0x000000, 0.2);
        graphics.fillEllipse(cx, cy + 30, 50, 10);
        graphics.fillStyle(0x2d2d2d, 1);
        graphics.fillTriangle(cx + 35, cy, cx + 65, cy - 15, cx + 55, cy + 8);
        graphics.fillStyle(0x3d3d3d, 0.85);
        graphics.fillTriangle(cx - 10, cy - 10, cx - 50, cy - 35, cx, cy + 10);
        graphics.fillTriangle(cx - 10, cy + 10, cx - 50, cy + 35, cx, cy - 10);
        graphics.fillStyle(0x2d2d2d, 1);
        graphics.fillEllipse(cx, cy, 45, 25);
        graphics.fillStyle(0x4a4a4a, 1);
        graphics.fillEllipse(cx, cy + 2, 35, 18);
        graphics.fillStyle(0x2d2d2d, 1);
        graphics.fillRect(cx - 15, cy + 12, 8, 8);
        graphics.fillRect(cx + 7, cy + 12, 8, 8);
        graphics.fillEllipse(cx - 30, cy - 10, 18, 22);
        graphics.fillEllipse(cx - 35, cy - 15, 22, 18);
        graphics.fillEllipse(cx - 45, cy - 13, 14, 12);
        graphics.fillStyle(0xffff00, 1);
        graphics.fillCircle(cx - 38, cy - 17, 4);
        graphics.fillStyle(0x000000, 1);
        graphics.fillRect(cx - 39, cy - 18, 2, 5);
        graphics.fillStyle(0x4a4a4a, 1);
        graphics.fillTriangle(cx - 38, cy - 22, cx - 40, cy - 28, cx - 36, cy - 23);
        graphics.fillTriangle(cx - 32, cy - 22, cx - 34, cy - 28, cx - 30, cy - 23);
        graphics.fillStyle(0x2d2d2d, 0.9);
        // Corrected line below:
        graphics.fillTriangle(cx - 10, cy - 5, cx - 25, cy - 25, cx - 5, cy + 5);
    }

    spawnEnemyDragon() {
        const warning = this.add.text(400, 200, '! DANGER !', { fontSize: '36px', fill: '#ff3333', fontFamily: 'Courier New', stroke: '#000000', strokeThickness: 6 }).setOrigin(0.5).setAlpha(0);
        this.tweens.add({
            targets: warning, alpha: 1, scaleX: 1.2, scaleY: 1.2, duration: 300, yoyo: true, repeat: 3,
            onComplete: () => {
                warning.destroy();
                this.showEnemyEncounter();
            }
        });
        this.cameras.main.shake(500, 0.01);
    }

    showEnemyEncounter() {
        const enemyGraphics = this.add.graphics();
        enemyGraphics.fillStyle(0x5a2d2d, 1);
        enemyGraphics.fillEllipse(0, 0, 60, 40);
        enemyGraphics.fillEllipse(-25, -15, 25, 25);
        enemyGraphics.fillStyle(0xff3333, 1);
        enemyGraphics.fillCircle(-28, -18, 5);
        enemyGraphics.fillStyle(0x8a4a4a, 1);
        enemyGraphics.fillTriangle(0, -20, -5, -30, 5, -20);
        enemyGraphics.generateTexture('encounter_enemy', 80, 60);
        enemyGraphics.destroy();
        
        this.enemyDragon = this.add.sprite(900, 300, 'encounter_enemy');
        this.enemyDragon.setScale(1.5);
        
        this.tweens.add({
            targets: this.enemyDragon, x: 550, duration: 2000, ease: 'Cubic.easeOut',
            onComplete: () => {
                const text = this.add.text(400, 450, 'A rival dragon challenges you!', { fontSize: '24px', fill: '#ff6b6b', fontFamily: 'Courier New', stroke: '#000000', strokeThickness: 4 }).setOrigin(0.5).setAlpha(0);
                this.tweens.add({
                    targets: text, alpha: 1, duration: 1000,
                    onComplete: () => {
                        this.time.delayedCall(2000, () => {
                            this.cameras.main.fadeOut(1000);
                            this.time.delayedCall(1000, () => this.scene.start('BattleScene'));
                        });
                    }
                });
            }
        });
        this.tweens.add({ targets: this.enemyDragon, y: 320, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }

    update() {
        this.clouds.forEach(cloud => {
            cloud.x -= cloud.scrollSpeed;
            if (cloud.x < -150) { cloud.x = 900; cloud.y = Phaser.Math.Between(100, 400); }
        });
        this.mountains.forEach(mountain => {
            mountain.x -= mountain.scrollSpeed;
            if (mountain.x < -250) mountain.x = 900;
        });
    }
}

// ============================================
// ACT 3: BATTLE SCENE
// ============================================
class BattleScene extends Phaser.Scene {
    constructor() { super({ key: 'BattleScene' }); }

    create() {
        this.cameras.main.fadeIn(1000);
        this.playerHP = 5;
        this.enemyHP = 5;
        this.canShoot = true;
        this.gameOver = false;

        this.createBattleBackground();
        this.generateFireballTextures(); // Generate pixel art textures

        // Reuse the dragon texture generated in the Dragon class or fallbacks
        this.playerDragon = this.physics.add.sprite(150, 300, 'dragon_idle_0');
        this.playerDragon.setCollideWorldBounds(true);
        this.playerDragon.setSize(50, 35);
        this.playerDragon.setOffset(15, 12);
        this.playerDragon.setScale(1.2);

        this.enemyDragon = this.physics.add.sprite(650, 300, 'enemy_dragon_idle_0');
        this.enemyDragon.setSize(50, 35);
        this.enemyDragon.setOffset(15, 12);
        this.enemyDragon.setScale(1.2);
        this.enemyDragon.setFlipX(true);

        this.playerFireballs = this.physics.add.group();
        this.enemyFireballs = this.physics.add.group();

        this.physics.add.overlap(this.playerFireballs, this.enemyDragon, this.hitEnemy, null, this);
        this.physics.add.overlap(this.enemyFireballs, this.playerDragon, this.hitPlayer, null, this);

        this.createUI();
        this.cursors = this.input.keyboard.createCursorKeys();
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        
        // Enemy AI
        this.time.addEvent({ delay: 1000, callback: this.enemyAI, callbackScope: this, loop: true });
        this.time.addEvent({ delay: 1800, callback: this.enemyShoot, callbackScope: this, loop: true });
    }

    createBattleBackground() {
        const sky = this.add.graphics();
        sky.fillGradientStyle(0x3a4a8a, 0x3a4a8a, 0x6a7ab8, 0x6a7ab8, 1);
        sky.fillRect(0, 0, 800, 600);
    }

    generateFireballTextures() {
        // Player Fireball (Red-Orange)
        const pf = this.add.graphics();
        pf.fillStyle(0xff4400, 1); pf.fillCircle(10, 10, 10);
        pf.fillStyle(0xff8800, 1); pf.fillCircle(10, 10, 7);
        pf.fillStyle(0xffaa00, 1); pf.fillCircle(10, 10, 4);
        pf.generateTexture('player_fireball', 30, 20);
        pf.destroy();

        // Enemy Fireball (Blue-Purple)
        const ef = this.add.graphics();
        ef.fillStyle(0x6600ff, 1); ef.fillCircle(10, 10, 10);
        ef.fillStyle(0x8800ff, 1); ef.fillCircle(10, 10, 7);
        ef.fillStyle(0xaa00ff, 1); ef.fillCircle(10, 10, 4);
        ef.generateTexture('enemy_fireball', 30, 20);
        ef.destroy();
    }

    update() {
        if (this.gameOver) return;
        if (!this.playerDragon || !this.playerDragon.body) return;

        let velocityX = 0, velocityY = 0;
        
        if (this.cursors.left.isDown) velocityX = -DRAGON_SPEED;
        else if (this.cursors.right.isDown) velocityX = DRAGON_SPEED;
        
        if (this.cursors.up.isDown) velocityY = -DRAGON_SPEED;
        else if (this.cursors.down.isDown) velocityY = DRAGON_SPEED;

        this.playerDragon.setVelocity(velocityX, velocityY);
        if (this.playerDragon.x > 400) this.playerDragon.setX(400);

        if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            this.playerShoot();
        }
    }

    playerShoot() {
        if (!this.canShoot) return;
        this.canShoot = false;
        
        const f = this.physics.add.sprite(this.playerDragon.x + 40, this.playerDragon.y, 'player_fireball');
        this.playerFireballs.add(f);
        f.setVelocityX(FIREBALL_SPEED);
        f.setScale(0.8);
        this.tweens.add({ targets: f, angle: 360, duration: 1000, repeat: -1 });
        
        this.time.delayedCall(400, () => this.canShoot = true);
    }

    enemyAI() {
        if (this.gameOver || !this.enemyDragon.active) return;
        const targetY = this.playerDragon.y + Phaser.Math.Between(-50, 50);
        this.tweens.add({ targets: this.enemyDragon, y: Phaser.Math.Clamp(targetY, 100, 500), duration: 800, ease: 'Sine.easeInOut' });
    }

    enemyShoot() {
        if (this.gameOver || !this.enemyDragon.active) return;
        
        const f = this.physics.add.sprite(this.enemyDragon.x - 40, this.enemyDragon.y, 'enemy_fireball');
        this.enemyFireballs.add(f);
        f.setVelocityX(-ENEMY_FIREBALL_SPEED);
        f.setScale(0.8);
        this.tweens.add({ targets: f, angle: -360, duration: 1000, repeat: -1 });
    }

    hitEnemy(obj1, obj2) {
        // SMART CHECK: Figure out which object is the fireball and which is the enemy
        let fireball, enemy;
        if (obj1.texture.key === 'player_fireball') {
            fireball = obj1;
            enemy = obj2;
        } else {
            fireball = obj2;
            enemy = obj1;
        }

        // 1. Safety Check
        if (!fireball.active) return;
        if (enemy.isInvulnerable) return; // Ignore damage if blinking

        // 2. Destroy the fireball (Correctly!)
        fireball.destroy();

        // 3. Decrease HP
        this.enemyHP--;
        this.updateEnemyHP();

        // 4. Visual Feedback (Blink)
        enemy.setTint(0xff0000);
        enemy.setAlpha(0.5); 
        enemy.isInvulnerable = true;

        this.time.delayedCall(200, () => {
            if (enemy.active) {
                enemy.clearTint();
                enemy.setAlpha(1);
                enemy.isInvulnerable = false;
            }
        });

        // 5. Victory Check
        if (this.enemyHP <= 0) {
            this.victory();
        }
    }
hitPlayer(obj1, obj2) {
        // SMART CHECK: Figure out which object is the fireball and which is the player
        let fireball, player;
        if (obj1.texture.key === 'enemy_fireball') {
            fireball = obj1;
            player = obj2;
        } else {
            fireball = obj2;
            player = obj1;
        }

        // 1. Safety Check
        if (!fireball.active) return;
        if (player.isInvulnerable) return;

        // 2. Destroy fireball
        fireball.destroy();

        // 3. Decrease HP
        this.playerHP--;
        this.updatePlayerHP();

        // 4. Visual Feedback
        this.cameras.main.shake(100, 0.01);
        player.setTint(0xff0000);
        player.setAlpha(0.5);
        player.isInvulnerable = true;

        this.time.delayedCall(500, () => {
            if (player.active) {
                player.clearTint();
                player.setAlpha(1);
                player.isInvulnerable = false;
            }
        });

        // 5. Defeat Check
        if (this.playerHP <= 0) {
            this.defeat();
        }
    }

    createUI() {
        this.hpText = this.add.text(20, 20, 'YOU', { fontSize: '20px', fill: '#4ecca3' });
        this.enemyText = this.add.text(780, 20, 'RIVAL', { fontSize: '20px', fill: '#ff6b6b' }).setOrigin(1, 0);
        this.updatePlayerHP();
        this.updateEnemyHP();
    }
    
    updatePlayerHP() { this.hpText.setText(`HP: ${"♥".repeat(this.playerHP)}`); }
    updateEnemyHP() { this.enemyText.setText(`HP: ${"♥".repeat(this.enemyHP)}`); }

    victory() {
        this.gameOver = true;
        this.enemyDragon.destroy();
        this.add.text(400, 300, "VICTORY!", { fontSize: '60px', fill: '#00ff00' }).setOrigin(0.5);
        this.time.delayedCall(2000, () => this.scene.start('VictoryScene'));
    }

    defeat() {
        this.gameOver = true;
        this.physics.pause();
        this.add.text(400, 300, "DEFEATED\nPress R", { fontSize: '48px', fill: '#ff0000', align: 'center' }).setOrigin(0.5);
        this.input.keyboard.once('keydown-R', () => this.scene.restart());
    }
}

class VictoryScene extends Phaser.Scene {
    constructor() { super({ key: 'VictoryScene' }); }
    create() {
        this.add.text(400, 300, "You are the Chief of Berk!", { fontSize: '32px', fill: '#fff' }).setOrigin(0.5);
        this.add.text(400, 400, "Refresh to play again", { fontSize: '16px', fill: '#aaa' }).setOrigin(0.5);
    }
}
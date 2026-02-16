// ============================================
// ACT 1: INTRO SCENE
// ============================================
class IntroScene extends Phaser.Scene {
    constructor() { super({ key: 'IntroScene' }); }

    create() {
        this.createForest();
        this.player = new Player(this, 250, 400);
        this.dragon = new Dragon(this, 750, 400, 'friendly');
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
    const width = 800;
    const height = 600;
    const horizonY = 200;

    // 1. SKY & BACKGROUND
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x050a05, 0x050a05, 0x1a2e1a, 0x1a2e1a, 1);
    sky.fillRect(0, 0, width, horizonY);
    
    // 2. GROUND
    const ground = this.add.graphics();
    ground.fillStyle(0x1b2b1b, 1);
    ground.beginPath();
    ground.moveTo(100, horizonY);
    ground.lineTo(700, horizonY);
    ground.lineTo(width + 100, height);
    ground.lineTo(-100, height);
    ground.closePath();
    ground.fillPath();
    ground.setDepth(0); // Ground is always at the bottom

    // 3. TREE GENERATION WITH EDGE BIAS
    const treeCount = 40;
    for (let i = 0; i < treeCount; i++) {
        const depth = Phaser.Math.Between(0, 400);
        const y = horizonY + depth;
        const scale = 0.4 + (depth / 400) * 1.4;
        
        // --- DENSITY LOGIC ---
        // We calculate a 'margin' based on depth to follow the trapezoid shape
        const currentWidth = 600 + (depth * 0.5); 
        const centerX = width / 2;
        
        let x;
        // 80% chance to spawn on edges, 20% to spawn near the middle
        if (Phaser.Math.FloatBetween(0, 1) > 0.2) {
            // Spawn on Left or Right edges (leaving the middle 30% empty)
            const side = Phaser.Math.Between(0, 1) ? -1 : 1;
            const offset = Phaser.Math.Between(currentWidth * 0.15, currentWidth * 0.5);
            x = centerX + (side * offset);
        } else {
            // Sparse trees in the middle
            x = Phaser.Math.Between(centerX - 100, centerX + 100);
        }

        this.drawTree(x, y, scale, depth);
    }
}

// Separate function to draw the tree for cleaner code
drawTree(x, y, scale, depth) {
    const tree = this.add.graphics();
    
    // IMPORTANT: Depth Sorting
    // This ensures the player (if their depth is also set to Y) 
    // moves behind/in front of trees correctly.
    tree.setDepth(y);

    const fogAlpha = 0.5 + (depth / 400) * 0.5;
    
    // 1. SHADOW
    tree.fillStyle(0x000000, 0.2);
    tree.fillEllipse(x, y, 40 * scale, 15 * scale);

    // 2. TRUNK
    const trunkW = 12 * scale;
    const trunkH = 45 * scale;
    tree.fillStyle(0x23180d, fogAlpha);
    tree.fillRect(x - trunkW/2, y - trunkH, trunkW, trunkH);

    // 3. FOLIAGE (Layered Conifer)
    const layers = 3;
    const colors = [0x1a331a, 0x244024, 0x2e522e];
    
    for (let i = 0; i < layers; i++) {
        const lScale = scale * (1 - i * 0.25);
        const lY = (y - trunkH) - (i * 25 * scale);
        const lWidth = 70 * lScale;
        const lHeight = 50 * lScale;

        tree.fillStyle(colors[i], fogAlpha);
        tree.beginPath();
        tree.moveTo(x, lY - lHeight);
        tree.lineTo(x + lWidth/2, lY);
        tree.lineTo(x - lWidth/2, lY);
        tree.closePath();
        tree.fillPath();
    }

    // Optional: Add a physical hitbox if you are using Arcade Physics
    // const hitBox = this.add.rectangle(x, y, 20 * scale, 10 * scale);
    // this.physics.add.existing(hitBox, true); 
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
// ACT 3: BATTLE SCENE (First Battle)
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
        this.generateFireballTextures();

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
        
        this.time.addEvent({ delay: 1000, callback: this.enemyAI, callbackScope: this, loop: true });
        this.time.addEvent({ delay: 1800, callback: this.enemyShoot, callbackScope: this, loop: true });
    }

    createBattleBackground() {
        const sky = this.add.graphics();
        sky.fillGradientStyle(0x3a4a8a, 0x3a4a8a, 0x6a7ab8, 0x6a7ab8, 1);
        sky.fillRect(0, 0, 800, 600);
    }

    generateFireballTextures() {
        const pf = this.add.graphics();
        pf.fillStyle(0xff4400, 1); pf.fillCircle(10, 10, 10);
        pf.fillStyle(0xff8800, 1); pf.fillCircle(10, 10, 7);
        pf.fillStyle(0xffaa00, 1); pf.fillCircle(10, 10, 4);
        pf.generateTexture('player_fireball', 30, 20);
        pf.destroy();

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
        let fireball, enemy;
        if (obj1.texture.key === 'player_fireball') { fireball = obj1; enemy = obj2; }
        else { fireball = obj2; enemy = obj1; }

        if (!fireball.active) return;
        if (enemy.isInvulnerable) return;

        fireball.destroy();
        this.enemyHP--;
        this.updateEnemyHP();
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

        if (this.enemyHP <= 0) this.victory();
    }

    hitPlayer(obj1, obj2) {
        let fireball, player;
        if (obj1.texture.key === 'enemy_fireball') { fireball = obj1; player = obj2; }
        else { fireball = obj2; player = obj1; }

        if (!fireball.active) return;
        if (player.isInvulnerable) return;

        fireball.destroy();
        this.playerHP--;
        this.updatePlayerHP();
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

        if (this.playerHP <= 0) this.defeat();
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
        // CHANGED: Transition to RiverRestScene instead of VictoryScene
        this.time.delayedCall(2000, () => this.scene.start('RiverRestScene'));
    }

    defeat() {
        this.gameOver = true;
        this.physics.pause();
        this.add.text(400, 300, "DEFEATED\nPress R", { fontSize: '48px', fill: '#ff0000', align: 'center' }).setOrigin(0.5);
        this.input.keyboard.once('keydown-R', () => this.scene.restart());
    }
}

// ============================================
// ACT 4: RIVER REST SCENE
// ============================================
class RiverRestScene extends Phaser.Scene {
    constructor() { super({ key: 'RiverRestScene' }); }

    create() {
        this.cameras.main.fadeIn(1000);
        this.createRiverBackground();
        this.createCharacters();
        this.dialogueBox = new DialogueBox(this);
        this.dialogueShown = false;
        
        this.input.on('pointerdown', () => {
            if (!this.dialogueShown) {
                this.startRestDialogue();
            } else if (this.dialogueBox.isVisible()) {
                this.dialogueBox.handleClick();
            }
        });
        
        this.hintText = this.add.text(400, 570, 'Click to continue...', { fontSize: '18px', fill: '#4ecca3', fontFamily: 'Courier New' }).setOrigin(0.5);
        this.tweens.add({ targets: this.hintText, alpha: 0.5, duration: 1000, yoyo: true, repeat: -1 });
    }

    createRiverBackground() {
        const sky = this.add.graphics();
        sky.fillGradientStyle(0x87ceeb, 0x87ceeb, 0xb0d4f1, 0xb0d4f1, 1);
        sky.fillRect(0, 0, 800, 600);
        
        for (let i = 0; i < 5; i++) {
            const mountain = this.add.graphics();
            mountain.fillStyle(0x5a6a5a, 0.6);
            const x = i * 200 - 50;
            mountain.fillTriangle(x, 400, x + 100, 250, x + 200, 400);
        }
        
        for (let i = 0; i < 15; i++) {
            const x = Phaser.Math.Between(0, 800);
            const y = Phaser.Math.Between(350, 380);
            const trunk = this.add.graphics();
            trunk.fillStyle(0x4a3520, 1);
            trunk.fillRect(x - 5, y, 10, 30);
            const tree = this.add.graphics();
            tree.fillStyle(0x2a5a2a, 1);
            tree.fillTriangle(x, y - 10, x - 15, y + 10, x + 15, y + 10);
            tree.fillTriangle(x, y - 20, x - 12, y, x + 12, y);
            tree.fillTriangle(x, y - 30, x - 10, y - 10, x + 10, y - 10);
        }
        
        const grass = this.add.graphics();
        grass.fillStyle(0x5a8a4a, 1);
        grass.fillRect(0, 380, 800, 100);
        
        const river = this.add.graphics();
        river.fillStyle(0x4a8aca, 0.7);
        river.fillRect(0, 480, 800, 120);
        
        for (let i = 0; i < 20; i++) {
            const wave = this.add.graphics();
            wave.fillStyle(0x6aaadb, 0.5);
            wave.fillCircle(0, 0, 8);
            wave.x = Phaser.Math.Between(0, 800);
            wave.y = Phaser.Math.Between(490, 580);
            this.tweens.add({ targets: wave, x: wave.x + 50, alpha: 0.2, duration: 3000, repeat: -1, yoyo: true });
        }
        
        for (let i = 0; i < 10; i++) {
            const sparkle = this.add.graphics();
            sparkle.fillStyle(0xffffff, 1);
            sparkle.fillCircle(0, 0, 2);
            sparkle.x = Phaser.Math.Between(0, 800);
            sparkle.y = Phaser.Math.Between(490, 580);
            this.tweens.add({ targets: sparkle, alpha: 0, duration: 1000, repeat: -1, yoyo: true, delay: Phaser.Math.Between(0, 1000) });
        }
    }

    createCharacters() {
        // Reuse dragon drawing logic but just create a graphic here for simplicity as it is a cutscene
        const dragonGraphics = this.add.graphics();
        const cx = 40, cy = 30;
        dragonGraphics.fillStyle(COLORS.dragon.body, 1);
        dragonGraphics.fillEllipse(cx, cy, 50, 35);
        dragonGraphics.fillEllipse(cx - 25, cy - 15, 30, 30);
        dragonGraphics.fillStyle(COLORS.dragon.belly, 1);
        dragonGraphics.fillEllipse(cx, cy + 3, 38, 25);
        dragonGraphics.fillStyle(0xffff00, 1);
        dragonGraphics.fillCircle(cx - 30, cy - 18, 5);
        dragonGraphics.generateTexture('dragon_standing', 100, 70);
        dragonGraphics.destroy();
        
        this.dragon = this.add.sprite(600, 370, 'dragon_standing');
        this.dragon.setScale(1.5);
        
        this.tweens.add({ targets: this.dragon, scaleY: 1.52, duration: 2000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        
        const playerGraphics = this.add.graphics();
        const px = 16, py = 16;
        playerGraphics.fillStyle(COLORS.player.pants, 1);
        playerGraphics.fillRect(px - 4, py + 5, 3, 7);
        playerGraphics.fillRect(px + 1, py + 5, 3, 7);
        playerGraphics.fillStyle(0x4a3520, 1);
        playerGraphics.fillRect(px - 5, py + 11, 4, 2);
        playerGraphics.fillRect(px + 1, py + 11, 4, 2);
        playerGraphics.fillStyle(COLORS.player.shirt, 1);
        playerGraphics.fillRect(px - 5, py - 2, 10, 8);
        playerGraphics.fillStyle(COLORS.player.skin, 1);
        playerGraphics.fillRect(px - 7, py, 3, 6);
        playerGraphics.fillRect(px + 4, py, 3, 6);
        playerGraphics.fillCircle(px, py - 6, 5);
        playerGraphics.fillStyle(COLORS.player.hair, 1);
        playerGraphics.fillCircle(px - 2, py - 9, 4);
        playerGraphics.fillCircle(px + 2, py - 9, 4);
        playerGraphics.generateTexture('player_standing', 32, 32);
        playerGraphics.destroy();
        
        this.player = this.add.sprite(500, 400, 'player_standing');
        this.player.setScale(2);
    }

    startRestDialogue() {
        this.dialogueShown = true;
        this.hintText.setVisible(false);
        const dialogues = [
            { speaker: 'You', text: 'That was a tough fight, buddy. We need a break.' },
            { speaker: 'Toothless', text: '*Nods and settles down by the river*' },
            { speaker: 'You', text: 'Every battle makes us stronger... I can feel our bond growing.' },
            { speaker: 'Toothless', text: '*Makes a contented rumbling sound*' },
            { speaker: 'You', text: 'Let\'s get some rest. Tomorrow is a big day.' }
        ];
        this.dialogueBox.show(dialogues, () => this.nightSkip());
    }

    nightSkip() {
        const blackout = this.add.graphics();
        blackout.fillStyle(0x000000, 1);
        blackout.fillRect(0, 0, 800, 600);
        blackout.setAlpha(0);
        blackout.setDepth(200);
        
        this.tweens.add({
            targets: blackout, alpha: 1, duration: 2000,
            onComplete: () => {
                const nightText = this.add.text(400, 300, 'The night passes peacefully...', { fontSize: '28px', fill: '#ffffff', fontFamily: 'Courier New', align: 'center' }).setOrigin(0.5).setDepth(201).setAlpha(0);
                this.tweens.add({
                    targets: nightText, alpha: 1, duration: 1500, hold: 2000,
                    onComplete: () => this.morningFade(blackout, nightText)
                });
            }
        });
    }

    morningFade(blackout, nightText) {
        this.tweens.add({ targets: nightText, alpha: 0, duration: 1000, onComplete: () => nightText.destroy() });
        
        const morning = this.add.graphics();
        morning.fillGradientStyle(0xffeeaa, 0xffeeaa, 0xffd666, 0xffd666, 1);
        morning.fillRect(0, 0, 800, 600);
        morning.setAlpha(0);
        morning.setDepth(199);
        
        this.tweens.add({ targets: blackout, alpha: 0, duration: 2000 });
        this.tweens.add({
            targets: morning, alpha: 1, duration: 2000,
            onComplete: () => this.time.delayedCall(1000, () => this.ambush(morning))
        });
    }

    ambush(morning) {
        const exclamation = this.add.text(this.player.x, this.player.y - 50, '!', { fontSize: '48px', fill: '#ff0000', fontFamily: 'Courier New', stroke: '#ffffff', strokeThickness: 4 }).setOrigin(0.5).setAlpha(0).setDepth(300);
        this.tweens.add({ targets: exclamation, alpha: 1, scaleX: 1.5, scaleY: 1.5, duration: 200, yoyo: true, repeat: 2 });
        
        const fastEnemyGraphics = this.add.graphics();
        fastEnemyGraphics.fillStyle(0x8a2d2d, 1);
        fastEnemyGraphics.fillEllipse(40, 30, 60, 40);
        fastEnemyGraphics.fillEllipse(15, 12, 25, 25);
        fastEnemyGraphics.fillStyle(0xff0000, 1);
        fastEnemyGraphics.fillCircle(10, 8, 6);
        fastEnemyGraphics.fillStyle(0xaa4a4a, 1);
        fastEnemyGraphics.fillTriangle(40, 10, 35, 0, 45, 10);
        fastEnemyGraphics.fillTriangle(50, 10, 45, 0, 55, 10);
        fastEnemyGraphics.generateTexture('fast_enemy', 80, 60);
        fastEnemyGraphics.destroy();
        
        this.fastEnemy = this.add.sprite(-100, 200, 'fast_enemy');
        this.fastEnemy.setScale(1.8);
        this.fastEnemy.setDepth(300);
        
        this.tweens.add({
            targets: this.fastEnemy, x: 300, duration: 1500, ease: 'Cubic.easeOut',
            onComplete: () => {
                const warningText = this.add.text(400, 150, 'AMBUSH!', { fontSize: '42px', fill: '#ff3333', fontFamily: 'Courier New', stroke: '#000000', strokeThickness: 6 }).setOrigin(0.5).setDepth(301);
                this.cameras.main.shake(800, 0.02);
                this.tweens.add({
                    targets: warningText, scaleX: 1.3, scaleY: 1.3, duration: 300, yoyo: true, repeat: 2,
                    onComplete: () => this.time.delayedCall(1000, () => {
                        this.cameras.main.fadeOut(1000);
                        this.time.delayedCall(1000, () => this.scene.start('Battle2Scene'));
                    })
                });
            }
        });
        
        this.tweens.add({ targets: this.fastEnemy, scaleY: 1.85, duration: 200, yoyo: true, repeat: -1 });
    }
}

// ============================================
// ACT 5: BATTLE 2 SCENE (Faster + River)
// ============================================
class Battle2Scene extends Phaser.Scene {
    constructor() { super({ key: 'Battle2Scene' }); }

    create() {
        this.cameras.main.fadeIn(1000);
        this.playerHP = 3;
        this.enemyHP = 3;
        this.canShoot = true;
        this.gameOver = false;
        
        // Background with River
        const sky = this.add.graphics();
        sky.fillGradientStyle(0xffeeaa, 0xffeeaa, 0x87ceeb, 0x87ceeb, 1);
        sky.fillRect(0, 0, 800, 500);
        
        const river = this.add.graphics();
        river.fillStyle(0x4a8aca, 0.8);
        river.fillRect(0, 500, 800, 100);
        
        this.riverWaves = [];
        for (let i = 0; i < 15; i++) {
            const wave = this.add.graphics();
            wave.fillStyle(0x6aaadb, 0.6);
            wave.fillCircle(0, 0, 10);
            wave.x = Phaser.Math.Between(0, 800);
            wave.y = Phaser.Math.Between(510, 580);
            this.riverWaves.push(wave);
            this.tweens.add({ targets: wave, x: wave.x + 80, alpha: 0.2, duration: 2500, repeat: -1, yoyo: false });
        }
        
        this.clouds = [];
        for (let i = 0; i < 8; i++) {
            const cloud = this.add.graphics();
            cloud.fillStyle(0xffffff, 0.4);
            for (let j = 0; j < 5; j++) cloud.fillCircle(j * 16, 0, 14);
            cloud.x = Phaser.Math.Between(0, 800);
            cloud.y = Phaser.Math.Between(50, 400);
            cloud.scrollSpeed = Phaser.Math.Between(3, 6);
            this.clouds.push(cloud);
        }
        
        this.playerDragon = this.physics.add.sprite(150, 250, 'dragon_idle_0');
        this.playerDragon.setCollideWorldBounds(true);
        this.playerDragon.setSize(50, 35);
        this.playerDragon.setOffset(15, 12);
        this.playerDragon.setScale(1.2);
        this.playerDragon.anims.play('dragon_idle');
        
        this.enemyDragon = this.physics.add.sprite(650, 250, 'enemy_dragon_idle_0');
        this.enemyDragon.setSize(50, 35);
        this.enemyDragon.setOffset(15, 12);
        this.enemyDragon.setScale(1.3);
        this.enemyDragon.setFlipX(true);
        this.enemyDragon.setTint(0xff6666);
        this.enemyDragon.anims.play('enemy_dragon_idle');
        
        this.playerFireballs = this.physics.add.group();
        this.enemyFireballs = this.physics.add.group();
        
        // IMPORTANT: UPDATED HIT DETECTION to fix disappearing bug
        this.physics.add.overlap(this.playerFireballs, this.enemyDragon, this.hitEnemy, null, this);
        this.physics.add.overlap(this.enemyFireballs, this.playerDragon, this.hitPlayer, null, this);
        
        this.createUI();
        this.cursors = this.input.keyboard.createCursorKeys();
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        
        this.fasterEnemyAI();
        
        const startText = this.add.text(400, 50, 'FINAL BATTLE!', { fontSize: '42px', fill: '#ff3333', fontFamily: 'Courier New', stroke: '#000000', strokeThickness: 6 }).setOrigin(0.5).setAlpha(0);
        this.tweens.add({ targets: startText, alpha: 1, scaleX: 1.4, scaleY: 1.4, duration: 500, ease: 'Back.easeOut', onComplete: () => {
            this.time.delayedCall(1500, () => {
                this.tweens.add({ targets: startText, alpha: 0, duration: 500, onComplete: () => startText.destroy() });
            });
        }});
    }

    update() {
        if (this.gameOver) return;
        
        this.clouds.forEach(cloud => {
            cloud.x -= cloud.scrollSpeed;
            if (cloud.x < -150) { cloud.x = 950; cloud.y = Phaser.Math.Between(50, 400); }
        });
        
        this.riverWaves.forEach(wave => {
            if (wave.x > 850) wave.x = -50;
        });
        
        let vx = 0, vy = 0;
        const speed = DRAGON_SPEED * 1.1;
        if (this.cursors.left.isDown) vx = -speed;
        else if (this.cursors.right.isDown) vx = speed;
        if (this.cursors.up.isDown) vy = -speed;
        else if (this.cursors.down.isDown) vy = speed;
        
        this.playerDragon.setVelocity(vx, vy);
        if (vx !== 0 && vy !== 0) this.playerDragon.setVelocity(vx * 0.707, vy * 0.707);
        
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) this.playerShoot();
    }

    playerShoot() {
        if (!this.canShoot || this.gameOver) return;
        this.canShoot = false;
        
        // Re-generate texture if needed (Battle 1 creates it, but good to be safe)
        if (!this.textures.exists('player_fireball2')) {
            const pf = this.add.graphics();
            pf.fillStyle(0xff4400, 1); pf.fillCircle(10, 10, 10);
            pf.generateTexture('player_fireball2', 30, 20); pf.destroy();
        }

        const fireball = this.physics.add.sprite(this.playerDragon.x + 40, this.playerDragon.y, 'player_fireball2');
        this.playerFireballs.add(fireball);
        fireball.setVelocityX(FIREBALL_SPEED);
        fireball.setScale(0.8);
        this.tweens.add({ targets: fireball, angle: 360, duration: 1000, repeat: -1 });
        
        this.time.delayedCall(600, () => this.canShoot = true);
    }

    enemyShoot() {
        if (this.gameOver || !this.enemyDragon.active) return;
        
        if (!this.textures.exists('fast_enemy_fireball')) {
            const ef = this.add.graphics();
            ef.fillStyle(0xff0000, 1); ef.fillCircle(10, 10, 12);
            ef.generateTexture('fast_enemy_fireball', 35, 25); ef.destroy();
        }
        
        const fireball = this.physics.add.sprite(this.enemyDragon.x - 40, this.enemyDragon.y, 'fast_enemy_fireball');
        this.enemyFireballs.add(fireball);
        fireball.setVelocityX(-450);
        fireball.setScale(0.9);
        this.tweens.add({ targets: fireball, angle: -360, duration: 800, repeat: -1 });
    }

    fasterEnemyAI() {
        this.time.addEvent({ delay: 800, callback: () => {
            if (this.gameOver) return;
            const targetY = this.playerDragon.y + Phaser.Math.Between(-80, 80);
            this.tweens.add({ targets: this.enemyDragon, y: Phaser.Math.Clamp(targetY, 80, 450), duration: 600, ease: 'Cubic.easeInOut' });
        }, callbackScope: this, loop: true });
        
        this.time.addEvent({ delay: 1500, callback: () => {
            if (this.gameOver) return;
            this.enemyShoot();
        }, callbackScope: this, loop: true });
    }

    // *** FIX: ROBUST HIT DETECTION (Prevent vanishing) ***
    hitEnemy(obj1, obj2) {
        let fireball, enemy;
        // Check textrue keys to identify objects
        if (obj1.texture.key === 'player_fireball2' || obj1.texture.key === 'player_fireball') {
             fireball = obj1; enemy = obj2; 
        } else { 
            fireball = obj2; enemy = obj1; 
        }

        if (!fireball.active) return;
        if (enemy.isInvulnerable) return;

        fireball.destroy();
        this.enemyHP--;
        this.updateEnemyHP();
        
        enemy.setTint(0xff0000);
        enemy.setAlpha(0.5);
        enemy.isInvulnerable = true;

        this.time.delayedCall(200, () => {
            if (enemy.active) {
                enemy.clearTint();
                enemy.setTint(0xff6666); // Restore reddish tint
                enemy.setAlpha(1);
                enemy.isInvulnerable = false;
            }
        });

        if (this.enemyHP <= 0) this.victory();
    }

    hitPlayer(obj1, obj2) {
        let fireball, player;
        if (obj1.texture.key === 'fast_enemy_fireball' || obj1.texture.key === 'enemy_fireball') {
             fireball = obj1; player = obj2; 
        } else { 
            fireball = obj2; player = obj1; 
        }

        if (!fireball.active) return;
        if (player.isInvulnerable) return;

        fireball.destroy();
        this.playerHP--;
        this.updatePlayerHP();
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

        if (this.playerHP <= 0) this.defeat();
    }

    createUI() {
        this.playerHPContainer = this.add.container(20, 20);
        this.updatePlayerHP();
        this.enemyHPContainer = this.add.container(780, 20);
        this.updateEnemyHP();
        const hint = this.add.text(400, 470, 'FASTER ENEMY! Stay alert!', { fontSize: '18px', fill: '#ff6b6b', fontFamily: 'Courier New' }).setOrigin(0.5);
        this.tweens.add({ targets: hint, alpha: 0.3, duration: 800, yoyo: true, repeat: 3, onComplete: () => hint.destroy() });
    }
    
    updatePlayerHP() { 
        this.playerHPContainer.removeAll(true);
        const label = this.add.text(0, 0, 'YOU', { fontSize: '18px', fill: '#4ecca3', fontFamily: 'Courier New' });
        this.playerHPContainer.add(label);
        for (let i = 0; i < this.playerHP; i++) {
            const heart = this.add.graphics();
            heart.fillStyle(0xff6b9d, 1);
            heart.fillCircle(i * 20, 23, 4);
            this.playerHPContainer.add(heart);
        }
    }
    
    updateEnemyHP() { 
        this.enemyHPContainer.removeAll(true);
        const label = this.add.text(0, 0, 'FURY', { fontSize: '18px', fill: '#ff3333', fontFamily: 'Courier New' }).setOrigin(1, 0);
        this.enemyHPContainer.add(label);
        for (let i = 0; i < this.enemyHP; i++) {
            const heart = this.add.graphics();
            heart.fillStyle(0xff0000, 1);
            heart.fillCircle(-i * 20 - 20, 23, 4);
            this.enemyHPContainer.add(heart);
        }
    }

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
// ============================================
// GAME CONFIGURATION
// ============================================
const PLAYER_SPEED = 150;
const DRAGON_SPEED = 200; // Increased slightly for better flight feel
const FIREBALL_SPEED = 400;
const ENEMY_FIREBALL_SPEED = 350;

const COLORS = {
    player: { skin: 0xffdbac, hair: 0x8b4513, shirt: 0x4a5568, pants: 0x2d3748 },
    dragon: { body: 0x2d2d2d, belly: 0x4a4a4a, eyes: 0xff6b6b, friendly: 0x3d5a3d },
    enemy: { body: 0x5a2d2d, belly: 0x8a4a4a, eyes: 0xff3333 }
};

// ============================================
// DIALOGUE BOX UI COMPONENT
// ============================================
class DialogueBox {
    constructor(scene) {
        this.scene = scene;
        this.visible = false;
        this.currentDialogue = null;
        this.dialogueIndex = 0;
        this.isTyping = false;
        this.textObject = null;
        this.onComplete = null;
        this.createBox();
    }

    createBox() {
        this.overlay = this.scene.add.graphics();
        this.overlay.fillStyle(0x000000, 0.5);
        this.overlay.fillRect(0, 0, 800, 600);
        this.overlay.setDepth(100);
        this.overlay.setVisible(false);

        this.box = this.scene.add.graphics();
        this.box.fillStyle(0x1a1a2e, 0.95);
        this.box.fillRoundedRect(50, 420, 700, 150, 10);
        this.box.lineStyle(3, 0x4ecca3, 1);
        this.box.strokeRoundedRect(50, 420, 700, 150, 10);
        this.box.setDepth(101);
        this.box.setVisible(false);

        this.nameText = this.scene.add.text(70, 435, '', { fontSize: '20px', fill: '#4ecca3', fontFamily: 'Courier New', fontStyle: 'bold' });
        this.nameText.setDepth(102);
        this.nameText.setVisible(false);

        this.textObject = this.scene.add.text(70, 470, '', { fontSize: '18px', fill: '#ffffff', fontFamily: 'Courier New', wordWrap: { width: 650 }, lineSpacing: 5 });
        this.textObject.setDepth(102);
        this.textObject.setVisible(false);

        this.continueIndicator = this.scene.add.text(720, 550, '▼', { fontSize: '20px', fill: '#4ecca3', fontFamily: 'Courier New' });
        this.continueIndicator.setDepth(102);
        this.continueIndicator.setVisible(false);
        
        this.scene.tweens.add({ targets: this.continueIndicator, alpha: 0.3, duration: 500, yoyo: true, repeat: -1 });
    }

    show(dialogues, onComplete = null) {
        this.currentDialogue = dialogues;
        this.dialogueIndex = 0;
        this.onComplete = onComplete;
        this.visible = true;
        this.overlay.setVisible(true);
        this.box.setVisible(true);
        this.nameText.setVisible(true);
        this.textObject.setVisible(true);
        this.displayNext();
    }

    displayNext() {
        if (this.dialogueIndex >= this.currentDialogue.length) {
            this.hide();
            if (this.onComplete) this.onComplete();
            return;
        }
        const dialogue = this.currentDialogue[this.dialogueIndex];
        this.nameText.setText(dialogue.speaker);
        this.continueIndicator.setVisible(false);
        this.isTyping = true;
        this.typeText(dialogue.text, () => {
            this.isTyping = false;
            this.continueIndicator.setVisible(true);
        });
    }

    typeText(text, onComplete) {
        this.textObject.setText('');
        let index = 0;
        const timer = this.scene.time.addEvent({
            delay: 30,
            callback: () => {
                this.textObject.setText(text.substring(0, index));
                index++;
                if (index > text.length) {
                    timer.remove();
                    if (onComplete) onComplete();
                }
            },
            repeat: text.length
        });
    }

    handleClick() {
        if (!this.visible) return false;
        if (this.isTyping) {
            const dialogue = this.currentDialogue[this.dialogueIndex];
            this.textObject.setText(dialogue.text);
            this.isTyping = false;
            this.continueIndicator.setVisible(true);
        } else {
            this.dialogueIndex++;
            this.displayNext();
        }
        return true;
    }

    hide() {
        this.visible = false;
        this.overlay.setVisible(false);
        this.box.setVisible(false);
        this.nameText.setVisible(false);
        this.textObject.setVisible(false);
        this.continueIndicator.setVisible(false);
    }
    isVisible() { return this.visible; }
}

// ============================================
// PLAYER ENTITY
// ============================================
class Player {
    constructor(scene, x, y) {
        this.scene = scene;
        this.createSprites();
        this.sprite = scene.physics.add.sprite(x, y, 'player_idle_down');
        this.sprite.setCollideWorldBounds(true);
        this.sprite.setSize(20, 30);
        this.sprite.setOffset(6, 2);
        this.speed = PLAYER_SPEED;
        this.direction = 'down';
        this.isMoving = false;
    }

    createSprites() {
        ['down', 'up', 'left', 'right'].forEach((dir, idx) => {
            this.createIdleSprite(dir);
            this.createWalkAnimation(dir);
        });
    }

    createIdleSprite(direction) {
        const graphics = this.scene.add.graphics();
        this.drawPlayerSprite(graphics, direction);
        graphics.generateTexture(`player_idle_${direction}`, 32, 32);
        graphics.destroy();
    }

    createWalkAnimation(direction) {
        const frames = [];
        for (let i = 0; i < 4; i++) {
            const graphics = this.scene.add.graphics();
            const offset = (i % 2 === 0) ? 0 : (i === 1 ? -1 : 1);
            this.drawPlayerSprite(graphics, direction, offset);
            const textureName = `player_walk_${direction}_${i}`;
            graphics.generateTexture(textureName, 32, 32);
            graphics.destroy();
            frames.push({ key: textureName });
        }
        this.scene.anims.create({
            key: `walk_${direction}`,
            frames: frames.map(f => ({ key: f.key, frame: 0 })),
            frameRate: 8,
            repeat: -1
        });
    }

    // YOUR EXACT DRAWING CODE
    drawPlayerSprite(graphics, direction, legOffset = 0) {
        const centerX = 16, centerY = 16;
        graphics.fillStyle(0x000000, 0.3);
        graphics.fillEllipse(centerX, centerY + 14, 12, 4);
        graphics.fillStyle(COLORS.player.pants, 1);
        graphics.fillRect(centerX - 4, centerY + 5 + legOffset, 3, 7);
        graphics.fillRect(centerX + 1, centerY + 5 - legOffset, 3, 7);
        graphics.fillStyle(0x4a3520, 1);
        graphics.fillRect(centerX - 5, centerY + 11, 4, 2);
        graphics.fillRect(centerX + 1, centerY + 11, 4, 2);
        graphics.fillStyle(COLORS.player.shirt, 1);
        graphics.fillRect(centerX - 5, centerY - 2, 10, 8);
        
        if (direction === 'left') {
            graphics.fillStyle(COLORS.player.skin, 1);
            graphics.fillRect(centerX - 7, centerY, 3, 6);
            graphics.fillRect(centerX + 4, centerY + 1, 3, 5);
        } else if (direction === 'right') {
            graphics.fillStyle(COLORS.player.skin, 1);
            graphics.fillRect(centerX + 4, centerY, 3, 6);
            graphics.fillRect(centerX - 7, centerY + 1, 3, 5);
        } else {
            graphics.fillStyle(COLORS.player.skin, 1);
            graphics.fillRect(centerX - 7, centerY, 3, 6);
            graphics.fillRect(centerX + 4, centerY, 3, 6);
        }
        
        graphics.fillStyle(COLORS.player.skin, 1);
        graphics.fillCircle(centerX, centerY - 6, 5);
        graphics.fillStyle(COLORS.player.hair, 1);
        graphics.fillCircle(centerX - 2, centerY - 9, 4);
        graphics.fillCircle(centerX + 2, centerY - 9, 4);
        graphics.fillCircle(centerX, centerY - 10, 4);
        
        if (direction === 'down') {
            graphics.fillStyle(0x000000, 1);
            graphics.fillRect(centerX - 3, centerY - 7, 2, 2);
            graphics.fillRect(centerX + 1, centerY - 7, 2, 2);
        } else if (direction === 'up') {
            graphics.fillStyle(COLORS.player.hair, 1);
            graphics.fillRect(centerX - 4, centerY - 8, 8, 4);
        } else if (direction === 'left') {
            graphics.fillStyle(0x000000, 1);
            graphics.fillRect(centerX - 3, centerY - 7, 2, 2);
        } else if (direction === 'right') {
            graphics.fillStyle(0x000000, 1);
            graphics.fillRect(centerX + 1, centerY - 7, 2, 2);
        }
    }

    update(cursors) {
        // *** FIX: SAFETY CHECK ADDED HERE ***
        if (!this.sprite || !this.sprite.body) return;

        let velocityX = 0, velocityY = 0;
        this.isMoving = false;

        if (cursors.left.isDown) {
            velocityX = -this.speed;
            this.direction = 'left';
            this.isMoving = true;
        } else if (cursors.right.isDown) {
            velocityX = this.speed;
            this.direction = 'right';
            this.isMoving = true;
        }

        if (cursors.up.isDown) {
            velocityY = -this.speed;
            this.direction = 'up';
            this.isMoving = true;
        } else if (cursors.down.isDown) {
            velocityY = this.speed;
            this.direction = 'down';
            this.isMoving = true;
        }

        this.sprite.setVelocity(velocityX, velocityY);

        if (velocityX !== 0 && velocityY !== 0) {
            this.sprite.setVelocity(velocityX * 0.707, velocityY * 0.707);
        }

        if (this.isMoving) {
            this.sprite.anims.play(`walk_${this.direction}`, true);
        } else {
            this.sprite.anims.stop();
            this.sprite.setTexture(`player_idle_${this.direction}`);
        }
    }

    freeze() {
        if(this.sprite && this.sprite.body) {
            this.sprite.setVelocity(0, 0);
            this.sprite.anims.stop();
            this.sprite.setTexture(`player_idle_${this.direction}`);
        }
    }

    getSprite() { return this.sprite; }
}

// ============================================
// DRAGON ENTITY
// ============================================
class Dragon {
    constructor(scene, x, y, type = 'friendly') {
        this.scene = scene;
        this.type = type;
        this.createSprites();
        
        const textureName = type === 'friendly' ? 'dragon_idle_0' : 'enemy_dragon_idle_0';
        this.sprite = scene.physics.add.sprite(x, y, textureName);
        this.sprite.setSize(60, 40);
        
        const animKey = type === 'friendly' ? 'dragon_idle' : 'enemy_dragon_idle';
        this.sprite.anims.play(animKey);
        
        scene.tweens.add({
            targets: this.sprite,
            y: y + 10,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    createSprites() {
        const frames = [];
        const prefix = this.type === 'friendly' ? 'dragon_idle' : 'enemy_dragon_idle';
        
        for (let i = 0; i < 4; i++) {
            const graphics = this.scene.add.graphics();
            const wingAngle = Math.sin(i * Math.PI / 2) * 15;
            this.drawDragon(graphics, this.type, wingAngle);
            const textureName = `${prefix}_${i}`;
            graphics.generateTexture(textureName, 80, 60);
            graphics.destroy();
            frames.push({ key: textureName });
        }

        this.scene.anims.create({
            key: prefix,
            frames: frames.map(f => ({ key: f.key, frame: 0 })),
            frameRate: 6,
            repeat: -1
        });
    }

    // YOUR EXACT DRAWING CODE
    drawDragon(graphics, type, wingAngle = 0) {
        const centerX = 40, centerY = 30;
        const colors = type === 'friendly' ? COLORS.dragon : COLORS.enemy;
        
        graphics.fillStyle(0x000000, 0.3);
        graphics.fillEllipse(centerX, centerY + 20, 35, 8);
        graphics.fillStyle(colors.body, 1);
        graphics.fillTriangle(centerX + 25, centerY, centerX + 45, centerY - 10, centerX + 40, centerY + 5);
        graphics.fillStyle(colors.belly, 1);
        graphics.fillTriangle(centerX + 35, centerY - 5, centerX + 38, centerY - 8, centerX + 40, centerY - 3);
        graphics.fillStyle(colors.body, 1);
        graphics.fillRect(centerX + 12, centerY + 8, 6, 10);
        graphics.fillEllipse(centerX + 15, centerY + 18, 8, 4);
        graphics.fillStyle(colors.body, 0.8);
        graphics.fillTriangle(centerX, centerY - 5, centerX - 15, centerY - 20, centerX + 5, centerY + 5);
        graphics.fillStyle(colors.body, 1);
        graphics.fillEllipse(centerX, centerY, 30, 20);
        graphics.fillStyle(colors.belly, 1);
        graphics.fillEllipse(centerX, centerY + 2, 22, 14);
        graphics.fillStyle(colors.body, 1);
        graphics.fillRect(centerX - 10, centerY + 8, 6, 10);
        graphics.fillEllipse(centerX - 7, centerY + 18, 8, 4);
        graphics.fillStyle(colors.body, 1);
        graphics.fillEllipse(centerX - 15, centerY - 8, 12, 18);
        graphics.fillEllipse(centerX - 20, centerY - 12, 16, 14);
        graphics.fillEllipse(centerX - 28, centerY - 10, 10, 8);
        graphics.fillStyle(0x000000, 0.6);
        graphics.fillCircle(centerX - 32, centerY - 11, 1.5);
        graphics.fillStyle(0xffff00, 1);
        graphics.fillCircle(centerX - 22, centerY - 14, 3);
        graphics.fillStyle(0x000000, 1);
        graphics.fillRect(centerX - 23, centerY - 15, 2, 4);
        graphics.fillStyle(colors.eyes, 0.5);
        graphics.fillCircle(centerX - 22, centerY - 14, 4);
        graphics.fillStyle(colors.belly, 1);
        graphics.fillTriangle(centerX - 24, centerY - 18, centerX - 26, centerY - 24, centerX - 22, centerY - 19);
        graphics.fillTriangle(centerX - 18, centerY - 18, centerX - 20, centerY - 24, centerX - 16, centerY - 19);
        graphics.fillStyle(colors.body, 0.9);
        graphics.fillTriangle(centerX - 10, centerY - 5, centerX - 25, centerY - 25, centerX - 5, centerY + 5);
    }

    getSprite() { return this.sprite; }
}
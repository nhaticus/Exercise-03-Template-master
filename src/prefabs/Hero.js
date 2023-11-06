// Hero prefab
class Hero extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture, frame, direction) {
        super(scene, x, y, texture, frame) // call Sprite parent class
        scene.add.existing(this)           // add Hero to existing scene
        scene.physics.add.existing(this)   // add physics body to scene

        this.body.setSize(this.width / 2, this.height / 2)
        this.body.setCollideWorldBounds(true)

        // set custom Hero properties
        this.direction = direction 
        this.heroVelocity = 100    // in pixels
        this.dashCooldown = 300    // in ms
        this.hurtTimer = 250       // in ms

        // initialize state machine managing hero (initial state, possible states, state args[])
        scene.heroFSM = new StateMachine('idle', {
            idle: new IdleState(),
            move: new MoveState(),
            swing: new SwingState(),
            dash: new DashState(),
            hurt: new HurtState(),
            circular: new CircularState(),
        }, [scene, this])   // pass these as arguments to maintain scene/object context in the FSM
    }
}

// hero-specific state classes
class IdleState extends State {
    enter(scene, hero) {
        hero.setVelocity(0)
        hero.anims.play(`walk-${hero.direction}`)
        hero.anims.stop()
    }

    execute(scene, hero) {
        // use destructuring to make a local copy of the keyboard object
        const { left, right, up, down, space, shift } = scene.keys
        const HKey = scene.keys.HKey
        const FKey = scene.keys.FKey

        // transition to swing if pressing space
        if(Phaser.Input.Keyboard.JustDown(space)) {
            this.stateMachine.transition('swing')
            return
        }

        // transition to dash if pressing shift
        if(Phaser.Input.Keyboard.JustDown(shift)) {
            this.stateMachine.transition('dash')
            return
        }

        // hurt if H key input (just for demo purposes)
        if(Phaser.Input.Keyboard.JustDown(HKey)) {
            this.stateMachine.transition('hurt')
            return
        }

        // transition to move if pressing a movement key
        if(left.isDown || right.isDown || up.isDown || down.isDown ) {
            this.stateMachine.transition('move')
            return
        }

        // transition to cirucular if pressing F
        if(Phaser.Input.Keyboard.JustDown(FKey)) {
            this.stateMachine.transition('circular')
            return
        }
    }
}

class MoveState extends State {
    execute(scene, hero) {
        // use destructuring to make a local copy of the keyboard object
        const { left, right, up, down, space, shift } = scene.keys
        const HKey = scene.keys.HKey
        const FKey = scene.keys.FKey

        // transition to swing if pressing space
        if(Phaser.Input.Keyboard.JustDown(space)) {
            this.stateMachine.transition('swing')
            return
        }

        // transition to dash if pressing shift
        if(Phaser.Input.Keyboard.JustDown(shift)) {
            this.stateMachine.transition('dash')
            return
        }

        // hurt if H key input (just for demo purposes)
        if(Phaser.Input.Keyboard.JustDown(HKey)) {
            this.stateMachine.transition('hurt')
            return
        }

        // transition to idle if not pressing movement keys
        if(!(left.isDown || right.isDown || up.isDown || down.isDown)) {
            this.stateMachine.transition('idle')
            return
        }

        // transition to cirucular if pressing F
        if(Phaser.Input.Keyboard.JustDown(FKey)) {
            this.stateMachine.transition('circular')
            return
        }

        // handle movement
        let moveDirection = new Phaser.Math.Vector2(0, 0)
        if(up.isDown) {
            moveDirection.y = -1
            hero.direction = 'up'
        } else if(down.isDown) {
            moveDirection.y = 1
            hero.direction = 'down'
        }
        if(left.isDown) {
            moveDirection.x = -1
            hero.direction = 'left'
        } else if(right.isDown) {
            moveDirection.x = 1
            hero.direction = 'right'
        }
        // normalize movement vector, update hero position, and play proper animation
        moveDirection.normalize()
        hero.setVelocity(hero.heroVelocity * moveDirection.x, hero.heroVelocity * moveDirection.y)
        hero.anims.play(`walk-${hero.direction}`, true)
    }
}

class SwingState extends State {
    enter(scene, hero) {
        hero.setVelocity(0)
        hero.anims.play(`swing-${hero.direction}`)
        hero.once('animationcomplete', () => {
            this.stateMachine.transition('idle')
        })
    }
}

class DashState extends State {
    enter(scene, hero) {
        hero.setVelocity(0)
        hero.anims.play(`swing-${hero.direction}`)
        hero.setTint(0x00AA00)     // turn green
        switch(hero.direction) {
            case 'up':
                hero.setVelocityY(-hero.heroVelocity * 3)
                break
            case 'down':
                hero.setVelocityY(hero.heroVelocity * 3)
                break
            case 'left':
                hero.setVelocityX(-hero.heroVelocity * 3)
                break
            case 'right':
                hero.setVelocityX(hero.heroVelocity * 3)
                break
        }

        // set a short cooldown delay before going back to idle
        scene.time.delayedCall(hero.dashCooldown, () => {
            hero.clearTint()
            this.stateMachine.transition('idle')
        })
    }
}

class HurtState extends State {
    enter(scene, hero) {
        hero.setVelocity(0)
        hero.anims.play(`walk-${hero.direction}`)
        hero.anims.stop()
        hero.setTint(0xFF0000)     // turn red
        // create knockback by sending body in direction opposite facing direction
        switch(hero.direction) {
            case 'up':
                hero.setVelocityY(hero.heroVelocity*2)
                break
            case 'down':
                hero.setVelocityY(-hero.heroVelocity*2)
                break
            case 'left':
                hero.setVelocityX(hero.heroVelocity*2)
                break
            case 'right':
                hero.setVelocityX(-hero.heroVelocity*2)
                break
        }

        // set recovery timer
        scene.time.delayedCall(hero.hurtTimer, () => {
            hero.clearTint()
            this.stateMachine.transition('idle')
        })
    }
}

class CircularState extends State {
    enter(scene, hero) {
        hero.body.setVelocity(0)
        hero.anims.play('circular-attack').once('animationcomplete', () => {
            this.stateMachine.transition('idle')
        })
    }
}
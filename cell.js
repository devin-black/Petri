class Cell {
    constructor(loc, name, color, size, heading) {
        this.loc = loc;
        this.name = name;
        this.color = color;
        this.size = size;
        this.heading = heading;
        this.speed = 0;

        this.lastEscape = 0; //Time since last escape in seconds
        this.lastAttack = 0; //Time since last attack in seconds

        this.kills = 0;

        //Cell settings
        this.maxSize = 500;
        this.uberMaxSize = 1200;
        this.leaveOnMaxSize = true;
        this.minSpeed = 0.01;
        this.speedSizeCoefficient = 0.08;
        this.escapeDelay = 50; // Time in MS before a cell and try to escape again
        this.attackDelay = 250; // Time in MS before a cell and try to attack again
        this.minBlurSize = 8; // Min size for blur to appear

        this.phraseTimer = 0;
        this.phraseDuration = 5000; // How long a phrase appears, in MS
        this.phrase = '';
    }

    // Drawing methods
    draw(ctx) {
        //Body
        ctx.beginPath();
        ctx.arc(this.loc.x, this.loc.y, this.size / 2, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
        //Stroke
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 0;
        ctx.stroke();
        //Shadow / blur
        //Blur is cool but laggy, so disabling for now
        if (this.size > this.minBlurSize && getRandomNumInRange(0, 1) < 0.8) { //Flicker
            //ctx.shadowBlur = 10 + getRandomNumInRange(-2, 2);
            //ctx.shadowColor = this.color;
        }
        //Names
        if (
            Math.hypot(mousePosition.x - this.loc.x, mousePosition.y - this.loc.y) <= this.size / 2 || this.phraseTimer > 0
        ) {
            ctx.fillStyle = 'white'; // Set fill color to white
            ctx.font = '10px Arial'; // Set font size and style
            ctx.textAlign = 'center'; // Center the text
            ctx.fillText(this.name, this.loc.x, this.loc.y + this.size / 2 + 10); // Render the name
        }

        //Phrases
        if (this.phraseTimer > 0) {
            ctx.fillStyle = this.color; // Set fill color 
            ctx.font = '10px Arial'; // Set font size and style
            ctx.textAlign = 'center'; // Center the text
            ctx.fillText(this.phrase, this.loc.x, this.loc.y + this.size / 2 + 30); // Render the phrase
        }

        //Size / absorbs
        if (
            Math.hypot(mousePosition.x - this.loc.x, mousePosition.y - this.loc.y) <= this.size / 2 || this.phraseTimer > 0
        ) {
            ctx.fillStyle = 'white'; // Set fill color to white
            ctx.font = '10px Arial'; // Set font size and style
            ctx.textAlign = 'center'; // Center the text
            let prettySize = "Size: " + Math.floor(this.size).toString() + " | Absorbs: " + this.kills.toString();
            ctx.fillText(prettySize, this.loc.x, this.loc.y + this.size / 2 + 20); // Render the size
        }

    }

    update(deltaTime, width, height) {
        let radians = (this.heading * Math.PI) / 180; // convert to radians

        // Calculate new positions
        let newX = this.loc.x + Math.cos(radians) * this.speed * deltaTime;
        let newY = this.loc.y + Math.sin(radians) * this.speed * deltaTime;

        // If max size and set to leave, skip the boundary check and proceed as normal
        if (this.size >= this.maxSize && this.leaveOnMaxSize) {
            this.loc.x = newX;
            this.loc.y = newY;
        } else {
            let updatedPositions = this.checkBoundaries(newX, newY, width, height, deltaTime, radians);
            this.loc.x = updatedPositions.newX;
            this.loc.y = updatedPositions.newY;
        }

        //Update speed according to size - TODO, this can be less urgent
        this.updateSpeed();

        //Update time since last escape
        if (this.lastEscapeFrames > 0) { // Ensure it doesn't go below 0
            this.lastEscapeFrames -= deltaTime; // Subtracts deltaTime from lastEscapeFrames

            if (this.lastEscapeFrames < 0) { // If we've gone below 0, set to 0.
                this.lastEscapeFrames = 0;
            }
        }

        //Update time since last attack
        if (this.lastAttackFrames > 0) { // Ensure it doesn't go below 0
            this.lastAttackFrames -= deltaTime; // Subtracts deltaTime from lastAttackFrames

            if (this.lastAttackFrames < 0) { // If we've gone below 0, set to 0.
                this.lastAttackFrames = 0;
            }
        }

        //Update phrase timer
        if (this.phraseTimer > 0) {
            this.phraseTimer -= deltaTime; // Subtracts deltaTime from phraseTimer

            if (this.phraseTimer < 0) { // If we've gone below 0, set to 0.
                this.phraseTimer = 0;
            }
        }

    }

    updateSpeed() {
        if (this.size < 1) {
            this.speed = 0;
        }
        else if (this.size >= this.uberMaxSize) {
            this.speed = 1;
        } else {
            this.speed = (this.speedSizeCoefficient / Math.log(this.size + 1) * globalSpeedModifier) + this.minSpeed;
        }

    }


    checkBoundaries(newX, newY, width, height, deltaTime, radians) {
        // Check boundaries and reverse heading if necessary
        if (newX - this.size / 2 < 0 || newX + this.size / 2 > width || newY - this.size / 2 < 0 || newY + this.size / 2 > height) {
            // If the new position is outside the boundary, set it to be inside the boundary
            if (newX - this.size / 2 < 0) {
                newX = this.size / 2;
            } else if (newX + this.size / 2 > width) {
                newX = width - this.size / 2;
            }
            if (newY - this.size / 2 < 0) {
                newY = this.size / 2;
            } else if (newY + this.size / 2 > height) {
                newY = height - this.size / 2;
            }

            // Randomness in the bounce and change heading
            this.heading = (this.heading + 180 + getRandomNumInRange(-10, 10)) % 360;
            radians = (this.heading * Math.PI) / 180; // update radians

            // Recalculate positions with new heading
            newX = this.loc.x + Math.cos(radians) * this.speed * deltaTime;
            newY = this.loc.y + Math.sin(radians) * this.speed * deltaTime;
        }

        return { newX, newY };
    }

    collideWith(other) {
        // Find the winner and loser based on size
        let winner, loser;
        if (this.size > other.size) {
            winner = this;
            loser = other;
        } else if (this.size < other.size) {
            winner = other;
            loser = this;
        } else { // Roll if same size
            if (0.5 > getRandomNumInRange(0, 1)) {
                winner = this;
                loser = other;
            }
        }

        // Compute the new size for winner
        winner.size += loser.size * 0.05;

        //Say something if the winner!
        if (getRandomNumInRange(0, 1) < 0.2 && loser.size > 12 && winner == this) {
            //Another random check for smaller winners - they talk less
            if (getRandomNumInRange(0, 1) < 0.3 && winner.size < 200) {
                this.phrase = getRandomAbsorbPhrase(absorbPhrases);
                this.phraseTimer = this.phraseDuration;
            }
        }

        /* Say something if the loser! - turned off for now b/c buggy
        if (getRandomNumInRange(0, 1) < 0.05 && loser.size > 12 && winner == other) {
            this.phrase = getRandomAmAbsorbedPhrase(amAbsorbedPhrases);
            this.phraseTimer = this.phraseDuration;
        } */

        // Loser size - cells can survive a glancing blow
        if (loser.size <= 4) {
            loser.size = 0;

        } else {
            loser.size = loser.size / 1.1;
        }

        // Add to kill count if a full kill
        if (loser.size <= 0 && this == winner) {
            this.kills++;
        }
    }

    checkForCollision(other) {
        if (this !== other && areColliding(this, other)) {
            this.collideWith(other);
        }
    }

    isCollisionImminentWith(other) {
        let dx = this.loc.x - other.loc.x;
        let dy = this.loc.y - other.loc.y;
        let distance = Math.sqrt(dx * dx + dy * dy);

        return distance < (other.size + this.size);
    }

    reactToImminentCollision(other) {
        if (this !== other && this.isCollisionImminentWith(other)) {
            if (this.size < other.size && other.size > 4) { //avoid the small fish
                this.escape(other, getRandomNumInRange(-15, 15));
            } else {
                this.attack(other, getRandomNumInRange(-15, 15));
            }
        }
    }

    escape(other, randomness) {
        // If other cell is larger, reverse direction
        if (this.lastEscape <= 0) {
            this.heading = (this.heading + 180 + randomness) % 360;
            this.lastEscape = this.escapeDelay;
        }

    }

    attack(other, randomness) {
        // If other cell is smaller, set heading towards the other cell
        if (this.lastAttack <= 0) {
            let dx = other.loc.x - this.loc.x;
            let dy = other.loc.y - this.loc.y;
            this.heading = (Math.atan2(dy, dx) * 180 / Math.PI + randomness) % 360;
            this.lastAttack = this.lastAttackDelay;
        }
    }
}
(function attachGameBootstrap(global) {
    'use strict';

    function sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    global.runRestartAttackTest = async function runRestartAttackTest() {
        const game = global.game;
        if (!game) return;

        const getBullets = () => game.bullets.length;

        game.setSpeed(5);
        await sleep(2000);
        const bulletsBefore = getBullets();
        await sleep(5000);
        const bulletsAfter = getBullets();

        game.state = 'gameover';
        game.endGame('dead');
        await sleep(1500);

        game.returnToMainMenu();
        await sleep(1500);

        const startButton = document.getElementById('startGameBtn');
        startButton?.click();
        await sleep(2000);

        const status = {
            timeScale: game.timeScale,
            lastT: game.lastT,
            weaponCd: game.weapons[0]?.cd
        };

        const restartBulletsBefore = getBullets();
        await sleep(5000);
        const restartBulletsAfter = getBullets();

        if (restartBulletsAfter > restartBulletsBefore) {
            document.body.style.background = '#0f4';
        } else {
            console.log(`   timeScale=${status.timeScale}, lastT=${status.lastT}, cd=${status.weaponCd}`);
            document.body.style.background = '#f04';
        }

        return {
            firstRunOk: bulletsAfter > bulletsBefore,
            restartRunOk: restartBulletsAfter > restartBulletsBefore
        };
    };

    global.onload = () => {
        if (typeof Game !== 'function') {
            throw new Error('[GameBootstrap] Game is not available in global scope');
        }
        const game = new Game();
        setTimeout(() => game.start(), 500);

        if (global.location.search.includes('test=restart')) {
            setTimeout(() => global.runRestartAttackTest(), 3000);
        }
    };
})(window);

/* -------------------------- */
/*       SUN MANAGEMENT       */
/* -------------------------- */

let activeSunScore = [];
let sunTimers = [];
let totalSunScore = 50;

const createSunScore = () => {
  const { minY, maxY, minX, maxX } = gameStrategy.sunScorePosition;
  const randomTop = Math.floor(Math.random() * (maxY - minY + 1)) + minY;
  const randomLeft = Math.floor(Math.random() * (maxX - minX + 1)) + minX;

  const sun = createElement("div", "sunPoint", screenBattleArena);

  sun._collected = false;
  sun._autoTimeout = null;
  sun.dataset.active = "false";
  activeSunScore.push(sun);

  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      sun.style.top = `${randomTop}%`;
      sun.style.left = `${randomLeft}%`;
    })
  );

  const { minTimeMs, maxTimeMs } = levelsConfig[currentLevelIndex].sunTiming;
  const randomDelay =
    Math.floor(Math.random() * (maxTimeMs - minTimeMs + 1)) + minTimeMs;

  const spawnTimerId = setTimeout(createSunScore, randomDelay);
  sunTimers.push(spawnTimerId);

  sun._autoTimeout = setTimeout(() => {
    if (sun._collected || sun.dataset.active === "true") return;
    sun.style.opacity = "0";
    sun.dataset.active = "true";

    setTimeout(() => {
      try {
        sun.remove();
      } catch (e) {}
      activeSunScore = activeSunScore.filter((s) => s !== sun);
    }, 2000);
  }, randomDelay + 4000);

  sun.addEventListener("pointerenter", () => {
    if (sun._collected) return;

    sun._collected = true;
    sun.dataset.active = "true";

    if (sun._autoTimeout) {
      clearTimeout(sun._autoTimeout);
      sun._autoTimeout = null;
    }

    sun.classList.add("sunPointCollected");
    sun.style.top = "0%";
    sun.style.left = "11%";

    setTimeout(() => {
      try {
        sun.remove();
      } catch (e) {}
      activeSunScore = activeSunScore.filter((s) => s !== sun);
      incrementScore(Number(levelsConfig[currentLevelIndex].someScore) || 0);
    }, 1500);
  });

  return sun;
};

const incrementScore = (scoreToAdd) => {
  scoreToAdd = Number(scoreToAdd) || 0;
  if (scoreToAdd <= 0) return;
  let added = 0;
  const maxScore = 999;

  totalSunScore = Number(totalSunScore) || 0;

  const step = () => {
    if (totalSunScore >= maxScore || added >= scoreToAdd) return;
    totalSunScore++;
    hudSunCounter.innerHTML = String(totalSunScore);
    added++;
    refreshDeck();
    setTimeout(step, 20);
  };
  step();
};

const stopAllSunTimers = () => {
  sunTimers.forEach((id) => clearTimeout(id));
  sunTimers = [];
};

/* -------------------------- */
/*       ZOMBIE SPAWNING      */
/* -------------------------- */

let activeIdleZombies = [];
let activeZombies = [];
let zombiesTimers = [];

const createRandomZombie = () => {
  const index = Math.floor(Math.random() * currentLevelZombies.length);
  const zombieClass = currentLevelZombies[index].zombieActionState;
  const { minY, maxY, minX, maxX } = gameStrategy.zombieIdlePositions;

  const top = Math.floor(Math.random() * (maxY - minY + 1)) + minY;
  const left = Math.floor(Math.random() * (maxX - minX + 1)) + minX;

  const zombie = createElement("div", "zombieEntitySprite", screenBattleArena);
  zombie.classList.add(zombieClass);
  zombie.style.top = `${top}%`;
  zombie.style.left = `${left}%`;
  zombie.style.transform = "translateX(0)";
  zombie.style.zIndex = Math.round(500 + ((top - minY) / (maxY - minY)) * 100);

  activeIdleZombies.push(zombie);
  return zombie;
};

const spawnThree = () => {
  for (let i = 0; i < 3; i++) createRandomZombie();
};

const clearSpawnedZombies = () => {
  activeIdleZombies.forEach((z) => z.remove());
  activeIdleZombies = [];
};

const spawnZombie = () => {
  const spawnState = levelsConfig[currentLevelIndex].spawnState;
  if (spawnState.currentSpawn >= spawnState.maxSpawns) return;

  const index = Math.floor(Math.random() * currentLevelZombies.length);
  const zombieClass = currentLevelZombies[index].zombieAnimation;
  const randomTopIndex = Math.floor(
    Math.random() * gameStrategy.entryTopPositions.length
  );
  const spawnTop = gameStrategy.entryTopPositions[randomTopIndex];
  const lane = randomTopIndex + 1;

  const zombie = createElement("div", "zombieEntitySprite", screenBattleArena);
  zombie.classList.add(zombieClass);
  zombie.style.top = `${spawnTop}%`;
  zombie.dataset.lane = lane;
  zombie.style.zIndex = [500, 510, 520, 530, 540][randomTopIndex] || 500;

  activeZombies.push({
    element: zombie,
    id: currentLevelZombies[index].zombieId,
    index,
    lane,
    health: currentLevelZombies[index].heart,
  });

  spawnState.currentSpawn++;
  updateZombieProgress();

  const { minTimeMs, maxTimeMs } =
    levelsConfig[currentLevelIndex].attackerTiming;
  const randomDelay =
    Math.floor(Math.random() * (maxTimeMs - minTimeMs + 1)) + minTimeMs;

  zombieLoop();
  zombiesTimers.push(setTimeout(spawnZombie, randomDelay));

  return zombie;
};

const stopAllZombiesTimers = () => {
  zombiesTimers.forEach((id) => clearTimeout(id));
  zombiesTimers = [];
};

/* -------------------------- */
/*      ZOMBIE PROGRESS       */
/* -------------------------- */

const updateZombieProgress = () => {
  const spawnState = levelsConfig[currentLevelIndex].spawnState;
  const maxSpawns = spawnState.maxSpawns;
  const currentSpawn = spawnState.currentSpawn;

  const remainingPercent = ((maxSpawns - currentSpawn) / maxSpawns) * 100;

  const progressEl = document.getElementById("progressIndicator");
  if (progressEl)
    progressEl.style.transform = `translateX(${remainingPercent}%)`;

  const startEl = document.getElementById("startPoint");
  if (startEl) startEl.style.transform = `translateX(${remainingPercent}%)`;

  const endEl = document.getElementById("endPoint");
  if (endEl && remainingPercent === 0) endEl.style.top = `-210%`;
};

const resetZombieProgress = () => {
  const progressEl = document.getElementById("progressIndicator");
  const startEl = document.getElementById("startPoint");
  const endEl = document.getElementById("endPoint");

  if (progressEl) progressEl.style.transform = `translateX(100%)`;
  if (startEl) startEl.style.transform = `translateX(100%)`;
  if (endEl) endEl.style.top = `-11%`;
};

/* -------------------------- */
/*          GAME LOOP         */
/* -------------------------- */

const encounterGameLoop = () => {
  activePlants.forEach((plant) => {
    activeZombies.forEach((zombie) => {
      updatePlantShootingLogic(plant, zombie);
    });
  });
  requestAnimationFrame(encounterGameLoop);
};

const updatePlantShootingLogic = (plant, zombie) => {
  const stageWidth = stageGameplayArena.offsetWidth;
  const plantBounds = plant.element.getBoundingClientRect();
  const zombieBounds = zombie.element.getBoundingClientRect();
  const zombieLeft = zombie.element.offsetLeft;

  const isZombieInStage = zombieLeft < stageWidth - 20;
  const isZombieOnLane = zombie.lane === plant.lane;
  const isZombieRightOfPlant = zombieBounds.left > plantBounds.right;

  const plantConfig = currentLevelPlants.find((p) => p.plantId === plant.id);
  if (!plantConfig) return;

  const { plantAnimation, plantDefensive } = plantConfig;

  if (
    zombie &&
    isZombieInStage &&
    isZombieOnLane &&
    isZombieRightOfPlant &&
    plant.id === 2
  ) {
    planOfPlantId2(plant, plantAnimation, plantDefensive);
  }

  checkCollisions(plant, zombie, zombieBounds);
};

/* -------------------------- */
/*    PLANT SHOOTING LOGIC    */
/* -------------------------- */

/* Handle Shooting Logic For Plant With id = 2 */
let animationDuration = 0;

/* Handle Shooting Logic For Plant With id = 2 */
const planOfPlantId2 = (plant, animationClass, defensiveClass) => {
  if (!plant.element.classList.contains(defensiveClass)) {
    plant.element.classList.remove(animationClass);
    plant.element.classList.add(defensiveClass);
  }

  /* If Plant Is Not Already Shooting, Start Shooting Process */
  if (!plant.shooting) {
    plant.shooting = true;

    const animDuration = !speedDuration
      ? currentLevelPlants[plant.index].animateDurationS * 1000
      : (currentLevelPlants[plant.index].animateDurationS * 1000) / 2;

    const frameTime = animDuration / 17;
    const shootFrame = 14;

    setTimeout(() => shootPea(plant), frameTime * (shootFrame - 1));

    if (!plant.hasListener) {
      const iterHandler = () => {
        const aliveZombies = activeZombies.filter(
          (z) => z.lane === plant.lane && z.health > 0
        );
        if (aliveZombies.length === 0) return;

        setTimeout(() => shootPea(plant), frameTime * (shootFrame - 1));
      };

      plant.iterHandler = iterHandler;
      plant.element.addEventListener("animationiteration", iterHandler);
      plant.hasListener = true;
    }
  }
};

/* -------------------------- */
/*      COLLISION CHECKS      */
/* -------------------------- */

/* Check All Collisions For A Plant's Peas Against A Zombie */
const checkCollisions = (plant, zombie, zombieBounds) => {
  for (const [index, pea] of plant.peaProjectiles.entries()) {
    const plantParent = pea.parentElement;
    if (!plantParent) continue;

    handlePeaHit(pea, index, plant, zombie, zombieBounds);
    handlePlantHit(plant, plantParent, zombie, zombieBounds);
  }
};

/* -------------------------- */
/*       PEA HIT HANDLER      */
/* -------------------------- */

/* Handle Pea Projectile Hitting A Zombie */
const handlePeaHit = (pea, index, plant, zombie, zombieBounds) => {
  const peaBounds = pea.getBoundingClientRect();

  const isPeaHit =
    peaBounds.right > zombieBounds.left + 70 &&
    peaBounds.left < zombieBounds.right &&
    peaBounds.bottom > zombieBounds.top &&
    peaBounds.top < zombieBounds.bottom;

  if (isPeaHit && zombie && zombie.lane === plant.lane) {
    zombie.element.style.filter = "brightness(1.25)";
    zombie.element.classList.add("splatter");
    setTimeout(() => {
      zombie.element.style.filter = "brightness(1)";
      zombie.element.classList.remove("splatter");
    }, 100);

    pea.remove();
    plant.peaProjectiles.splice(index, 1);
    zombie.health -= 1;

    if (zombie.health <= 0) {
      zombie.element.remove();
      const zIndex = activeZombies.indexOf(zombie);
      if (zIndex > -1) activeZombies.splice(zIndex, 1);

      const spawnState = levelsConfig[currentLevelIndex].spawnState;
      if (
        spawnState.currentSpawn >= spawnState.maxSpawns &&
        activeZombies.length === 0
      )
        resetGameState(true, null);

      activePlants.forEach((p) => {
        if (p.lane === zombie.lane) {
          const pConfig = currentLevelPlants.find((pl) => pl.plantId === p.id);
          if (!pConfig) return;

          p.element.classList.remove(pConfig.plantDefensive);
          p.element.classList.add(pConfig.plantAnimation);
          p.shooting = false;

          if (p.hasListener) {
            p.element.removeEventListener("animationiteration", p.iterHandler);
            p.iterHandler = null;
            p.hasListener = false;
          }
        }
      });
    }
  }
};

/* -------------------------- */
/*      PLANT HIT HANDLER     */
/* -------------------------- */

/* Handle zombie colliding with the plant itself */
const handlePlantHit = (plant, plantParent, zombie, zombieBounds) => {
  const plantParentBounds = plantParent.getBoundingClientRect();

  const isPlantHit =
    plantParentBounds.right > zombieBounds.left + 70 &&
    plantParentBounds.left < zombieBounds.right &&
    plantParentBounds.bottom > zombieBounds.top &&
    plantParentBounds.top < zombieBounds.bottom;

  const zombieConfig = currentLevelZombies.find(
    (z) => z.zombieId === zombie.id
  );
  if (!zombieConfig) return;

  const { zombieAnimation: animationClass, zombieDefensive: defensiveClass } =
    zombieConfig;

  if (isPlantHit && zombie && zombie.lane === plant.lane) {
    const arenaRect = stageGameplayArena.getBoundingClientRect();
    const currentLeftPercent =
      ((zombieBounds.left - arenaRect.left) / arenaRect.width) * 100;

    zombie.element.style.left = `${currentLeftPercent}%`;
    zombie.element.style.transition = "none";
    zombie.element.style.transform = "translateX(0)";
    zombie.element.classList.remove(animationClass);
    zombie.element.classList.add(defensiveClass);

    const hitInterval = setInterval(() => {
      if (!activePlants.includes(plant) || !activeZombies.includes(zombie)) {
        clearInterval(hitInterval);
        zombie.hitInterval = null;
        return;
      }

      plant.health -= 1;
      plant.element.style.filter = "brightness(1.25)";
      setTimeout(() => (plant.element.style.filter = "brightness(1)"), 100);

      if (plant.health <= 0) {
        clearInterval(hitInterval);
        zombie.hitInterval = null;

        zombie.element.classList.add(animationClass);
        zombie.element.classList.remove(defensiveClass);
        zombie.element.style.animation = "";
        void zombie.element.offsetWidth;

        const startLeftPercent = 108;
        const endLeftPercent = 10;
        const animationDuration = 60;
        const totalPath = startLeftPercent - endLeftPercent;
        const progress = startLeftPercent - currentLeftPercent;
        const progressRatio = Math.min(Math.max(progress / totalPath, 0), 1);
        zombie.element.style.animationDelay = `-${
          animationDuration * progressRatio
        }s`;

        if (plant.hasListener) {
          plant.element.removeEventListener(
            "animationiteration",
            plant.iterHandler
          );
          plant.iterHandler = null;
          plant.hasListener = false;
        }

        plantParent.remove();
        const pIndex = activePlants.indexOf(plant);
        if (pIndex > -1) activePlants.splice(pIndex, 1);
      }
    }, 1000);

    zombie.hitInterval = hitInterval;
  }
};

/* -------------------------- */
/*      SHOOT PEA HANDLER     */
/* -------------------------- */

/* Create And Shoot A Pea Projectile From Plant */
const shootPea = (plant) => {
  const peaProjectile = createElement("div", "peaProjectile", plant.element);
  plant.peaProjectiles.push(peaProjectile);

  peaProjectile.addEventListener("animationend", () => {
    peaProjectile.remove();
    const idx = plant.peaProjectiles.indexOf(peaProjectile);
    if (idx > -1) plant.peaProjectiles.splice(idx, 1);
  });
};

/* -------------------------- */
/*         ZOMBIE LOOP        */
/* -------------------------- */

const zombieLoop = () => {
  activeZombies.forEach((zombie) => {
    const zombieBounds = zombie.element.getBoundingClientRect();
    handleZombieLawnMowerCollision(zombie, zombieBounds);
    checkWinLose(zombie, zombieBounds);
  });
  requestAnimationFrame(zombieLoop);
};

/* -------------------------- */
/*    LAWN MOWER COLLISION    */
/* -------------------------- */

const handleZombieLawnMowerCollision = (zombie, zombieBounds) => {
  document.querySelectorAll(".lawnMowerUnit").forEach((lawnMower) => {
    const lawnMowerBounds = lawnMower.getBoundingClientRect();
    const lawnMowerLane = parseInt(lawnMower.dataset.lane, 10);

    const isLawnMowerHit =
      lawnMowerBounds.right > zombieBounds.left + 70 &&
      lawnMowerBounds.left + 20 < zombieBounds.right &&
      lawnMowerBounds.bottom > zombieBounds.top &&
      lawnMowerBounds.top < zombieBounds.bottom;

    if (isLawnMowerHit && zombie && zombie.lane === lawnMowerLane) {
      if (lawnMower.dataset.active == "false") {
        lawnMower.classList.add("active");
        lawnMower.dataset.active = "true";
      }

      if (zombie.hitInterval) {
        clearInterval(zombie.hitInterval);
        zombie.hitInterval = null;
      }

      zombie.element.remove();
      const zIndex = activeZombies.indexOf(zombie);
      if (zIndex > -1) activeZombies.splice(zIndex, 1);

      const spawnState = levelsConfig[currentLevelIndex].spawnState;
      if (
        spawnState.currentSpawn >= spawnState.maxSpawns &&
        activeZombies.length === 0
      ) {
        resetGameState(true, null);
        return;
      }

      const laneStillHasZombies = activeZombies.some(
        (z) => z.lane === zombie.lane && z.health > 0
      );

      if (!laneStillHasZombies) {
        activePlants.forEach((p) => {
          if (p.lane === zombie.lane) {
            const pConfig = currentLevelPlants.find(
              (pl) => pl.plantId === p.id
            );
            if (!pConfig) return;

            p.element.classList.remove(pConfig.plantDefensive);
            p.element.classList.add(pConfig.plantAnimation);
            p.shooting = false;

            if (p.hasListener) {
              p.element.removeEventListener(
                "animationiteration",
                p.iterHandler
              );
              p.iterHandler = null;
              p.hasListener = false;
            }
          }
        });
      }
    }
  });
};

/* -------------------------- */
/*       WIN/LOSE CHECK       */
/* -------------------------- */

/* Check If Player Wins Or Loses */
const checkWinLose = (zombie, zombieBounds) => {
  const exitZoneBounds = laneExitZone.getBoundingClientRect();
  const isExitZoneHit = zombieBounds.right <= exitZoneBounds.right;
  const spawnState = levelsConfig[currentLevelIndex].spawnState;

  if (
    spawnState.currentSpawn === spawnState.maxSpawns &&
    activeZombies.length === 0
  ) {
    resetGameState(true, null);
  } else if (isExitZoneHit) {
    resetGameState(false, zombie);
  }
};

/* -------------------------- */
/*   PLAYER PROGRESS SYSTEM   */
/* -------------------------- */

const initPlayerProgress = () => {
  let progress = localStorage.getItem("playerProgress");
  if (!progress) {
    const defaultProgress = {
      levelHighlightIndex: 0,
      unlockedLevels: [1],
      passedLevels: [],
    };
    localStorage.setItem("playerProgress", JSON.stringify(defaultProgress));
    return defaultProgress;
  }
  return JSON.parse(progress);
};

const getPlayerProgress = () => {
  const progress = localStorage.getItem("playerProgress");
  return progress ? JSON.parse(progress) : initPlayerProgress();
};

const savePlayerProgress = (progress) =>
  localStorage.setItem("playerProgress", JSON.stringify(progress));

const updatePlayerProgress = () => {
  const progress = getPlayerProgress();
  const nextLevel = currentLevelIndex + 1;
  const passedLevelNumber = currentLevelIndex + 1;

  if (!progress.passedLevels.includes(passedLevelNumber))
    progress.passedLevels.push(passedLevelNumber);

  if (nextLevel < levelsConfig.length) {
    levelsConfig[nextLevel].isUnlocked = true;
    if (!progress.unlockedLevels.includes(nextLevel + 1))
      progress.unlockedLevels.push(nextLevel + 1);

    progress.levelHighlightIndex = Math.min(nextLevel, levelsConfig.length - 1);
  }

  savePlayerProgress(progress);
};

const loadProgressOnStart = () => {
  const progress = getPlayerProgress();
  window.requestAnimationFrame(() => {
    const levelNodes = document.querySelectorAll(".nodeLevelActive");

    progress.unlockedLevels.forEach((lvl) => {
      if (levelsConfig[lvl - 1]) levelsConfig[lvl - 1].isUnlocked = true;
      if (levelNodes[lvl - 1])
        levelNodes[lvl - 1].classList.remove("levelPassed");
    });

    levelHighlightIndex = progress.levelHighlightIndex || 0;
    levelNodes.forEach((n) => n.classList.remove("effectLevelHighlight"));
    if (levelNodes[levelHighlightIndex])
      levelNodes[levelHighlightIndex].classList.add("effectLevelHighlight");

    if (!Array.isArray(progress.passedLevels)) {
      progress.passedLevels = [];
      savePlayerProgress(progress);
    }

    progress.passedLevels.forEach((lvl) => {
      if (levelNodes[lvl - 1]) levelNodes[lvl - 1].classList.add("levelPassed");
    });
  });
};

/* -------------------------- */
/*      RESET GAME STATE      */
/* -------------------------- */

let gameEnded = false;

const resetGameState = (win = false, zombie = null) => {
  if (gameEnded) return;
  gameEnded = true;

  // Refresh current level data (plants/zombies arrays) so locks and lengths are accurate
  updateCurrentLevelData();

  // Reset spawn counters for all levels to ensure a clean start-from-zero runtime state
  levelsConfig.forEach((lvl) => (lvl.spawnState.currentSpawn = 0));

  /* Reset Sun Score (runtime only) */
  totalSunScore = 50;
  hudSunCounter.innerHTML = totalSunScore;

  // Remove and cleanup active sun elements and any timers
  activeSunScore.forEach((s) => {
    try {
      s.remove(); // removes element and any attached listeners implicitly
    } catch (err) {}
  });
  activeSunScore = [];
  stopAllSunTimers();

  // Stop and clear zombies timers
  stopAllZombiesTimers();

  // Clear any queued timeouts that might be referenced elsewhere (defensive)
  if (Array.isArray(sunTimers)) sunTimers.forEach((id) => clearTimeout(id));
  sunTimers = [];

  if (Array.isArray(zombiesTimers))
    zombiesTimers.forEach((id) => clearTimeout(id));
  zombiesTimers = [];

  // Remove rock button handler if still attached
  if (buttonRock && buttonRock._rockHandler) {
    try {
      buttonRock.removeEventListener("pointerdown", buttonRock._rockHandler);
    } catch (e) {}
    buttonRock._rockHandler = null;
    buttonRock.classList.remove("ready");
  }

  // If there is an active plant preview (pointermove bound), remove its listener and element
  if (activePlantSprite) {
    if (activePlantSprite._moveHandler)
      document.removeEventListener(
        "pointermove",
        activePlantSprite._moveHandler
      );
    try {
      activePlantSprite.remove();
    } catch (e) {}
    activePlantSprite = null;
  }
  isClickDeckAllowed = false;
  activeTargetDeck = null;

  /* Immediate cleanup of DOM elements that should vanish now */
  // Remove idle zombies
  activeIdleZombies.forEach((z) => {
    try {
      z.remove();
    } catch (e) {}
  });
  activeIdleZombies = [];

  /* Remove plants & their animation listeners */
  activePlants.forEach((p) => {
    try {
      if (p.iterHandler && p.element)
        p.element.removeEventListener("animationiteration", p.iterHandler);
    } catch (e) {}
    try {
      if (p.element) p.element.remove();
    } catch (e) {}
  });
  activePlants = [];

  /* Reset plant deck runtime locks and UI */
  plantSelectionLock = Array(currentLevelPlants.length).fill(false);
  selectedPlantCount = 0;
  decSelectionLock = [];
  decAllow = false;
  isPlantDeckEnabled = false;
  isPlantCellPlaced = false;

  // Remove any remaining selected plant slots from DOM and restore card visuals
  document
    .querySelectorAll(".slotSelectedPlant[data-index]")
    .forEach((p) => p.remove());
  document
    .querySelectorAll(".slotPlantCard")
    .forEach((p) => (p.style.filter = "brightness(1)"));

  // Reset lawn mowers visual state
  setTimeout(() => {
    document.querySelectorAll(".lawnMowerUnit").forEach((m) => {
      m.classList.remove("active");
      m.dataset.active = "false";
    });
  }, 5000);

  // Reset HUD & panels immediately (runtime classes)
  hudTopControlsPanel.className = "hudHidden";
  hudControlsPanel.className = "hudHidden";
  panelPlantCollection.className = "hudHidden";
  panelPlantCollection.classList.remove("ready");
  hudBottomPanel.classList.remove("enter");
  hudCoinCounter.classList.remove("exit");
  hudDiamondCounter.classList.remove("exit");
  if (panelPlantDeck) panelPlantDeck.style.display = "none";
  if (panelPlantDeckClone) panelPlantDeckClone.style.display = "none";

  // Ensure any pea projectiles still in DOM are removed
  document.querySelectorAll(".peaProjectile").forEach((pp) => pp.remove());

  // Ensure any leftover event handlers on grid cells are not left behind
  getAllPlantCells().forEach((cell) => {
    cell.classList.remove("ready", "gridCellSelected");
    // remove any dataset or temporary child sprite remnants
    cell.querySelectorAll(".plantEntitySprite").forEach((pe) => {
      if (!pe.dataset.index) pe.remove();
    });
  });

  // small defensive cleanup of other runtime arrays
  activeSunScore = [];
  sunTimers = [];
  zombiesTimers = [];

  // Reset spawnState for current level (again, defensive)
  if (
    levelsConfig[currentLevelIndex] &&
    levelsConfig[currentLevelIndex].spawnState
  )
    levelsConfig[currentLevelIndex].spawnState.currentSpawn = 0;

  // Reset gameplay flags
  isGameActive = false;
  updateRockButtonState();

  /* Navigation & Result Handling (preserve flow and logic) */
  if (win) {
    // WIN HANDLING (preserve original sequencing)
    setTimeout(() => {
      // make sure any lingering active zombies are cleared
      activeZombies.forEach((z) => {
        if (z.hitInterval) clearInterval(z.hitInterval);
        if (z.element && z.element.remove) z.element.remove();
      });
      activeZombies = [];
      resetZombieProgress();
    }, 5000);

    setTimeout(() => {
      stageGameplayArena.className = "hudHidden";
      battleArenaBackground.classList.remove("ready");

      requestAnimationFrame(() => {
        screenBattleArena.style.opacity = "0";
        setTimeout(
          () => switchLevelVisibility(screenBattleArena, screenLevelSelect),
          1000
        );
      });

      const levelNodes = document.querySelectorAll(".nodeLevelActive");
      if (levelNodes[currentLevelIndex])
        levelNodes[currentLevelIndex].classList.add("levelPassed");

      if (currentLevelIndex + 1 < levelsConfig.length)
        levelsConfig[currentLevelIndex + 1].isUnlocked = true;

      if (levelNodes.length > 0) {
        if (levelHighlightIndex < levelNodes.length)
          levelNodes[levelHighlightIndex].classList.remove(
            "effectLevelHighlight"
          );

        levelHighlightIndex = Math.min(
          currentLevelIndex + 1,
          levelNodes.length - 1
        );

        levelNodes[levelHighlightIndex].classList.remove("levelPassed");
        levelNodes[levelHighlightIndex].classList.add("effectLevelHighlight");
      }

      // Update persistent player progress (only here on win, as before)
      try {
        updatePlayerProgress();
      } catch (e) {}
    }, 1000);
  } else {
    // LOSE HANDLING (defensive: if zombie or its config missing, we still continue cleanup)
    let safeZombie =
      zombie || (activeZombies.length > 0 ? activeZombies[0] : null);

    // compute a safe zombie element and bounds if possible
    if (safeZombie && safeZombie.element) {
      try {
        const arenaRect = stageGameplayArena.getBoundingClientRect();
        const zombieBounds = safeZombie.element.getBoundingClientRect();
        const currentLeftPercent =
          ((zombieBounds.left - arenaRect.left) / arenaRect.width) * 100;
        safeZombie.element.style.left = `${currentLeftPercent}%`;
      } catch (e) {}
    }

    // attempt to derive config but do not abort if missing
    let zombieConfig = null;
    if (safeZombie) {
      zombieConfig =
        currentLevelZombies.find((z) => z.zombieId === safeZombie.id) || null;
    }

    const stateClass = zombieConfig ? zombieConfig.zombieActionState : null;
    const animationClass = zombieConfig ? zombieConfig.zombieAnimation : null;
    const defensiveClass = zombieConfig ? zombieConfig.zombieDefensive : null;

    try {
      if (safeZombie && safeZombie.element) {
        const el = safeZombie.element;
        el.style.transition = "none";
        el.style.transform = "translateX(0)";
        el.style.animation = "";
        if (animationClass) el.classList.remove(animationClass);
        requestAnimationFrame(() => {
          if (defensiveClass) el.classList.add(defensiveClass);
        });
      }
    } catch (e) {}

    setTimeout(() => {
      try {
        if (safeZombie && safeZombie.element) {
          if (defensiveClass)
            safeZombie.element.classList.remove(defensiveClass);
          if (stateClass) safeZombie.element.classList.add(stateClass);
        }
      } catch (e) {}
    }, 4000);

    setTimeout(() => {
      try {
        if (safeZombie && safeZombie.hitInterval)
          clearInterval(safeZombie.hitInterval);
        if (safeZombie && safeZombie.element)
          safeZombie.element.style.zIndex = "150";

        // remove all other active zombies but keep the current one visible as original logic
        activeZombies
          .filter((z) => z !== safeZombie)
          .forEach((z) => {
            try {
              if (z.element) z.element.remove();
            } catch (e) {}
          });
        activeZombies = safeZombie ? [safeZombie] : [];

        resultGame.classList.add("lose");
        buttonToMap.className = "hudVisible";
        buttonRestart.className = "hudVisible";

        setTimeout(() => (resultGame.style.opacity = "1"), 50);
      } catch (e) {}
    }, 1000);
  }

  // Final safety net: ensure all timers and intervals cleared and runtime flags reset.
  // Use a short timeout so above UI transitions can run before fully allowing new games.
  setTimeout(() => {
    // clear any remaining intervals/timeouts
    try {
      zombiesTimers.forEach((id) => clearTimeout(id));
      sunTimers.forEach((id) => clearTimeout(id));
    } catch (e) {}

    zombiesTimers = [];
    sunTimers = [];

    // Ensure any remaining plant listeners are removed
    document.querySelectorAll(".plantEntitySprite").forEach((pe) => {
      try {
        if (pe._iterHandler)
          pe.removeEventListener("animationiteration", pe._iterHandler);
      } catch (e) {}
    });

    // allow future resets
    gameEnded = false;
  }, 6000);
};

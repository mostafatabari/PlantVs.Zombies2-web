/* -------------------------- */
/*        ORIENTATION         */
/* -------------------------- */

/* Set Game Container to Landscape Orientation */
const setDynamicHeight = () => {
  const vv = window.visualViewport;
  const vh = (vv ? vv.height : window.innerHeight) * 0.01;
  document.documentElement.style.setProperty("--vh", `${vh}px`);
};

const enterFullscreen = async () => {
  const el = document.documentElement;
  try {
    if (el.requestFullscreen) await el.requestFullscreen();
    else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
    else if (el.msRequestFullscreen) await el.msRequestFullscreen();
  } catch (e) {
    console.warn("Fullscreen not supported:", e);
  }
};

const setLandscape = () => {
  setDynamicHeight();
  rootGameContainer.style.transformOrigin = "center center";
  rootGameContainer.style.transition = "transform 0.6s ease";
  rootGameContainer.style.transform = "rotate(0deg)";
};

let rotated = false;
window.addEventListener("deviceorientation", (e) => {
  const gamma = e.gamma ?? 0;

  if (!rotated) {
    if (gamma > 45) {
      rootGameContainer.style.transform = "rotate(90deg)";
      rotated = true;
    } else if (gamma < -45) {
      rootGameContainer.style.transform = "rotate(-90deg)";
      rotated = true;
    }
  }
});

/* -------------------------- */
/*       DOM UTILITIES        */
/* -------------------------- */

/* Create A New DOM Element And Append It To A Parent */
const createElement = (type, className, parent) => {
  const el = document.createElement(type);
  el.classList.add(className);
  parent.appendChild(el);
  return el;
};

/* -------------------------- */
/*      SCREEN TRANSITIONS    */
/* -------------------------- */

/* Show/Hide Levels With Fade Effect */
const switchLevelVisibility = (hideEl, showEl) => {
  hideEl.style.opacity = "0";
  requestAnimationFrame(() => {
    hideEl.classList.remove("layerVisible");
    hideEl.classList.add("layerHidden");

    showEl.classList.remove("layerHidden");
    showEl.classList.add("layerVisible");
    showEl.style.opacity = "0";

    requestAnimationFrame(() => (showEl.style.opacity = "1"));
  });
};

/* -------------------------- */
/*       LEVEL SELECTION      */
/* -------------------------- */

/* Navigate To Selected Level If Unlocked */
const selectLevel = (levelEntity) => {
  if (!levelEntity.isUnlocked) return;
  isGameActive = true;
  currentLevelIndex = levelEntity.levelNumber - 1;

  updateCurrentLevelData();
  updateLevelNumberDisplay();

  goToRestart(screenLevelSelect, screenBattleArena);
};

/* Show Battle Arena And Prepare Game */
const goToRestart = (hideEl, showEl) => {
  switchLevelVisibility(hideEl, showEl);

  requestAnimationFrame(() => {
    spawnThree();

    activeIdleZombies.forEach((z) => (z.style.opacity = "0"));

    setTimeout(() => {
      activeIdleZombies.forEach((z) => (z.style.opacity = "1"));

      [hudTopControlsPanel, hudControlsPanel, panelPlantCollection].forEach(
        (el) => (el.className = "hudVisible")
      );

      panelPlantCollection.classList.add("ready");
      panelPlantDeck.style.display = "flex";

      isGameActive = true;
    }, screenReadyDurationMs);
  });
};

/* -------------------------- */
/*       PLANT SELECTION      */
/* -------------------------- */

/* Lock For Plant Selection To Prevent Duplicates */
let plantSelectionLock = Array(currentLevelPlants.length).fill(false);

/* Select Plant And Add To Plant Deck */
const selectPlantForDeck = (plantEntity, plantIndex, plantCard) => {
  plantTitle.innerHTML = currentLevelPlants[plantIndex].plantSpriteName;
  plantCharacter.className = currentLevelPlants[plantIndex].plantAnimation;
  plantContent.innerHTML = currentLevelPlants[plantIndex].story;

  if (selectedPlantCount >= maxSelectablePlants) return;
  if (plantSelectionLock[plantIndex]) return;

  const selectedPlant = createElement(
    "div",
    "slotSelectedPlant",
    panelPlantDeck
  );
  selectedPlant.style.backgroundImage = `url('Images/gameStage/selectPlayer/${plantEntity.plantSpriteName}.png')`;
  selectedPlant.style.opacity = "1";
  selectedPlant.dataset.index = plantIndex;

  panelPlantDeck.insertBefore(
    selectedPlant,
    panelPlantDeck.children[selectedPlantCount]
  );

  selectedPlantCount++;
  plantSelectionLock[plantIndex] = true;
  plantCard.style.filter = "brightness(0.5)";

  updateRockButtonState();
};

/* Update Rock Button State Based On Selected Plants */
const updateRockButtonState = () => {
  buttonRock.classList.remove("ready");
  if (buttonRock._rockHandler) {
    buttonRock.removeEventListener("pointerdown", buttonRock._rockHandler);
  }

  if (selectedPlantCount === maxSelectablePlants) {
    buttonRock.classList.add("ready");
    buttonRock._rockHandler = startLevelSequence;
    buttonRock.addEventListener("pointerdown", buttonRock._rockHandler);
  }
};

/* -------------------------- */
/*     GAME START SEQUENCE    */
/* -------------------------- */

/* Start Level Sequence */
const startLevelSequence = () => {
  clearSpawnedZombies();
  battleArenaBackground.className = "ready";
  hudControlsPanel.className = "hudHidden";
  panelPlantCollection.classList.remove("ready");

  isPlantDeckEnabled = true;
  panelPlantDeck.style.pointerEvents = "none";

  requestAnimationFrame(() =>
    setTimeout(() => {
      stageGameplayArena.className = "hudVisible";
      panelPlantDeck.style.pointerEvents = "all";
      updatePlantDeckAnimations();

      /* Start Game Message Sequence */
      showGameSequence([
        { text: "Ready...", duration: 700 },
        { text: "Set...", duration: 700 },
        { text: "PLANT!", size: "5rem", duration: 7500 },
      ]);
    }, screenReadyDurationMs)
  );

  setTimeout(() => {
    encounterGameLoop();
    if (isGameActive) {
      spawnZombie();
      createSunScore();
      hudBottomPanel.classList.add("enter");
      hudCoinCounter.classList.add("exit");
      hudDiamondCounter.classList.add("exit");
    }
  }, entryZombieDurationMs);
};

/* Show Game Start Messages Sequence */
const showGameSequence = (messages) => {
  let i = 0;
  const next = () => {
    if (i == messages.length) {
      messageText.classList.remove("marsh");
      messageText.innerHTML = "";
      messageText.style.opacity = "0";
      resultGame.style.opacity = "0";
      requestAnimationFrame(() => (messageText.style.opacity = "1"));
    }
    if (i >= messages.length) return;
    const { text, size, duration } = messages[i];

    resultGame.style.opacity = "1";
    messageText.style.fontSize = size || "4rem";
    messageText.innerHTML = text;
    messageText.classList.remove("marsh");
    requestAnimationFrame(() => messageText.classList.add("marsh"));

    i++;
    setTimeout(next, duration);
  };
  next();
};

/* -------------------------- */
/*      PLANT DECK LOGIC      */
/* -------------------------- */

/* Update Plant Deck Animations */
const updatePlantDeckAnimations = () => {
  panelPlantDeckClone.style.display = "flex";
  decAllow = true;
  const decDuration = levelsConfig[currentLevelIndex].decDurationS;

  setTimeout(() => {
    panelPlantDeckClone.style.display = "none";
    decAllow = false;
  }, decDuration * 1000);

  const allClonePlants =
    panelPlantDeckClone.querySelectorAll(".slotSelectedPlant");
  allClonePlants.forEach(
    (plant) => (plant.style.animationDuration = `${decDuration}s`)
  );

  refreshDeck();

  return decSelectionLock;
};

/* Refresh Plant Deck Based On Current Score */
const refreshDeck = () => {
  const curScore = Number(hudSunCounter.innerHTML) || 0;
  panelPlantDeck
    .querySelectorAll(".slotSelectedPlant[data-index]")
    .forEach((plant) => {
      const planIndex = parseInt(plant.dataset.index, 10);
      if (isNaN(planIndex)) return;
      updateDec(
        plant,
        planIndex,
        curScore,
        currentLevelPlants[planIndex].score
      );
    });
};

/* Update Individual Plant Availability Based On Score */
const updateDec = (plant, planIndex, curScore, requiredScore) => {
  if (curScore < requiredScore) {
    plant.style.filter = "brightness(0.6)";
    decSelectionLock[planIndex] = false;
  } else {
    plant.style.filter = "";
    decSelectionLock[planIndex] = true;
  }
};

/* Get All Plant Cells */
const getAllPlantCells = () =>
  document.querySelectorAll("#gridPlantLaneBoard>.gridCellLaneSlot");

const handleRemovePlantFromDeck = (clickedDeckPlant, datasetIndex) => {
  clickedDeckPlant.remove();
  selectedPlantCount--;
  plantSelectGrid.children[datasetIndex].style.filter = "brightness(1)";
  plantSelectionLock[datasetIndex] = false;
  updateRockButtonState();
};

/* Select Plant From Deck */
const handleSelectPlantFromDeck = (clickedDeckPlant, datasetIndex) => {
  if (!isClickDeckAllowed) {
    if (decAllow || !decSelectionLock[datasetIndex]) return;

    highlightCells();

    activePlantSprite = createElement(
      "div",
      "plantPreview",
      stageGameplayArena
    );
    activePlantSprite.classList.add(
      currentLevelPlants[datasetIndex].plantAnimation
    );
    activePlantSprite.style.top = "200%";

    activeTargetDeck = clickedDeckPlant;
    isClickDeckAllowed = true;

    const moveHandler = (e) =>
      handleMouseMoveForPlantPlacement(e, datasetIndex, activePlantSprite);
    document.addEventListener("pointermove", moveHandler);
    activePlantSprite._moveHandler = moveHandler;
  } else if (clickedDeckPlant === activeTargetDeck) {
    clearHighlightCells();
    deselectActivePlant();
  }
};

/* Highlight / Clear Plant Cells */
const highlightCells = () =>
  getAllPlantCells().forEach((c) => c.classList.add("gridCellSelected"));

const clearHighlightCells = () =>
  getAllPlantCells().forEach((c) => c.classList.remove("gridCellSelected"));

/* Deselect Active Plant */
const deselectActivePlant = () => {
  if (activePlantSprite) {
    document.removeEventListener("pointermove", activePlantSprite._moveHandler);
    activePlantSprite.remove();
    activePlantSprite = null;
  }
  isClickDeckAllowed = false;
  activeTargetDeck = null;
};

/* Update Plant Preview Position */
const handleMouseMoveForPlantPlacement = (
  e,
  datasetIndex,
  activePlantSprite
) => {
  const gridRect = screenBattleArena.getBoundingClientRect();
  const percentY = ((e.clientY - gridRect.top) / gridRect.height) * 100;
  const percentX = ((e.clientX - gridRect.left) / gridRect.width) * 100;
  activePlantSprite.style.top = `${percentY}%`;
  activePlantSprite.style.left = `${percentX}%`;

  getAllPlantCells().forEach((cell) => {
    cell.onmouseenter = () => handleCellEnter(cell, datasetIndex);
    cell.onmouseleave = () => handleCellLeave(cell);
  });
};

/* Update Level Number */
const updateLevelNumberDisplay = () => {
  const levelNumberEl = document.getElementById("levelNumber");
  if (!levelNumberEl) return;
  levelNumberEl.textContent = levelsConfig[currentLevelIndex].levelNumber;
};

/* Active Plants Array */
let activePlants = [];

/* Handle Cell Enter / Leave */
const handleCellEnter = (cell, datasetIndex) => {
  if (
    !isClickDeckAllowed ||
    cell.querySelector(".plantEntitySprite[data-index]")
  )
    return;

  cell.classList.add("ready");

  const activePlantEntity = createElement("div", "plantEntitySprite", cell);
  activePlantEntity.classList.add(
    currentLevelPlants[datasetIndex].plantAnimation
  );
  activePlantEntity.style.opacity = "0.5";

  const clickHandler = (e) =>
    handleCellClick(cell, datasetIndex, activePlantEntity);
  cell.addEventListener("pointerdown", clickHandler, { once: true });
};

const handleCellLeave = (cell) => {
  if (!isClickDeckAllowed) return;
  cell.classList.remove("ready");

  cell.querySelectorAll(".plantEntitySprite").forEach((p) => {
    if (p.dataset.index === undefined) p.remove();
  });
};

/* Place Plant Into Grid Cell */
const handleCellClick = (cell, datasetIndex, plantEntity) => {
  if (cell.querySelector(".plantEntitySprite[data-index]")) return;

  plantEntity.style.opacity = "1";
  cell.classList.remove("ready");

  clearHighlightCells();
  deselectActivePlant();
  updatePlantDeckAnimations();

  const cost = currentLevelPlants[datasetIndex].score || 0;
  totalSunScore = Math.max(Number(totalSunScore) - cost, 0);
  hudSunCounter.innerHTML = totalSunScore;

  refreshDeck();

  plantEntity.dataset.index = datasetIndex;

  const plantLane = parseInt(cell.dataset.lane, 10);

  activePlants.push({
    element: plantEntity,
    id: datasetIndex + 1,
    index: datasetIndex,
    lane: plantLane,
    health: currentLevelPlants[datasetIndex].heart,
    shooting: false,
    peaProjectiles: [],
    hasListener: false,
  });
};

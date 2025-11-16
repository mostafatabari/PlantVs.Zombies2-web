/* Drift The Layers With Drag Inertia */
const initDragTranslate = ({
  container,
  content,
  sensitivity = 1.0,
  friction = 0.95,
  bounds = null,
}) => {
  /* Drag State */
  let isDragging = false;
  let startPointerX = 0;
  let startPercent = 0;
  let currentPercent = 0;
  let velocity = 0;
  let lastPointerX = 0;

  /* Live Sizes */
  const containerWidth = () => container.getBoundingClientRect().width;
  const contentWidth = () => content.getBoundingClientRect().width;

  /* Compute min bound (%) */
  const computeMin = () =>
    !bounds || bounds.min == null
      ? ((containerWidth() - contentWidth()) / contentWidth()) * 100
      : typeof bounds.min === "function"
      ? bounds.min()
      : bounds.min;

  /* Compute max bound (%) */
  const computeMax = () =>
    !bounds || bounds.max == null
      ? 0
      : typeof bounds.max === "function"
      ? bounds.max()
      : bounds.max;

  /* Clamp value within bounds */
  const clamp = (value) =>
    Math.min(Math.max(value, computeMin()), computeMax());

  /* Update transform */
  const update = () =>
    (content.style.transform = `translateX(${currentPercent}%)`);

  /* Get pointer X position */
  const getPointerX = (event) => event.touches?.[0]?.clientX ?? event.clientX;

  /* Pointer down: start dragging */
  const onDown = (event) => {
    isDragging = true;
    startPointerX = getPointerX(event);
    startPercent = currentPercent;
    lastPointerX = startPointerX;
    velocity = 0;
    event.preventDefault();
  };

  /* Pointer move: drag content */
  const onMove = (event) => {
    if (!isDragging) return;
    const pointerX = getPointerX(event);
    const deltaX = pointerX - startPointerX;
    currentPercent = clamp(
      startPercent + (deltaX / containerWidth()) * 100 * sensitivity
    );
    velocity =
      ((pointerX - lastPointerX) / containerWidth()) * 100 * sensitivity;
    lastPointerX = pointerX;
    update();
    event.preventDefault();
  };

  /* Pointer up: release and start inertia */
  const onUp = () => {
    if (!isDragging) return;
    isDragging = false;
    requestAnimationFrame(inertia);
  };

  /* Inertia animation */
  const inertia = () => {
    Math.abs(velocity) > 0.01 &&
      ((currentPercent = clamp(currentPercent + velocity)),
      (velocity *= friction),
      update(),
      requestAnimationFrame(inertia));
  };

  /* Add pointer event listeners */
  container.addEventListener("pointerdown", onDown, { passive: false });
  container.addEventListener("pointermove", onMove, { passive: false });
  container.addEventListener("pointerup", onUp, { passive: false });
  container.addEventListener("pointerleave", onUp, { passive: false });

  /* First paint */
  update();
};

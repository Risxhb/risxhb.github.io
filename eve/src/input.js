const CODE_TO_ACTION = {
  KeyW: "up",
  ArrowUp: "up",
  KeyA: "left",
  ArrowLeft: "left",
  KeyS: "down",
  ArrowDown: "down",
  KeyD: "right",
  ArrowRight: "right",
  Enter: "confirm",
  Space: "confirm",
  KeyE: "confirm",
  Escape: "cancel",
  Backspace: "cancel",
  KeyI: "inventory",
  KeyP: "party",
  KeyQ: "quests",
  KeyJ: "journal",
  KeyM: "map"
};

export class Input {
  constructor(canvas = document.querySelector("canvas")) {
    this.down = new Set();
    this.pressed = new Set();
    this.onPress = null;
    this.pointer = {
      x: 0,
      y: 0,
      down: false,
      dragging: false,
      justDown: null,
      justUp: null,
      click: null,
      rightClick: null,
      wheel: 0,
      startX: 0,
      startY: 0
    };
    window.addEventListener("keydown", (event) => {
      const action = CODE_TO_ACTION[event.code];
      if (!action) return;
      event.preventDefault();
      if (!this.down.has(action)) {
        this.pressed.add(action);
        this.onPress?.(action);
      }
      this.down.add(action);
    });
    window.addEventListener("keyup", (event) => {
      const action = CODE_TO_ACTION[event.code];
      if (!action) return;
      event.preventDefault();
      this.down.delete(action);
    });
    if (canvas) this.bindPointer(canvas);
  }

  isDown(action) {
    return this.down.has(action);
  }

  consume(action) {
    if (!this.pressed.has(action)) return false;
    this.pressed.delete(action);
    return true;
  }

  flush() {
    this.pressed.clear();
  }

  bindPointer(canvas) {
    const update = (event) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      this.pointer.x = Math.max(0, Math.min(canvas.width, (event.clientX - rect.left) * scaleX));
      this.pointer.y = Math.max(0, Math.min(canvas.height, (event.clientY - rect.top) * scaleY));
    };
    canvas.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      update(event);
      canvas.setPointerCapture?.(event.pointerId);
      this.pointer.down = true;
      this.pointer.dragging = false;
      this.pointer.startX = this.pointer.x;
      this.pointer.startY = this.pointer.y;
      this.pointer.justDown = { x: this.pointer.x, y: this.pointer.y };
    });
    canvas.addEventListener("pointermove", (event) => {
      event.preventDefault();
      update(event);
      if (!this.pointer.down || this.pointer.dragging) return;
      const dx = this.pointer.x - this.pointer.startX;
      const dy = this.pointer.y - this.pointer.startY;
      if (Math.hypot(dx, dy) >= 8) this.pointer.dragging = true;
    });
    canvas.addEventListener("pointerup", (event) => {
      event.preventDefault();
      update(event);
      canvas.releasePointerCapture?.(event.pointerId);
      const wasDragging = this.pointer.dragging;
      this.pointer.down = false;
      this.pointer.dragging = false;
      this.pointer.justUp = { x: this.pointer.x, y: this.pointer.y, dragged: wasDragging };
      if (!wasDragging) {
        if (event.button === 2) this.pointer.rightClick = { x: this.pointer.x, y: this.pointer.y };
        else this.pointer.click = { x: this.pointer.x, y: this.pointer.y };
      }
    });
    canvas.addEventListener("pointercancel", (event) => {
      event.preventDefault();
      this.pointer.down = false;
      this.pointer.dragging = false;
    });
    canvas.addEventListener("wheel", (event) => {
      event.preventDefault();
      update(event);
      this.pointer.wheel += event.deltaY;
    }, { passive: false });
    canvas.addEventListener("contextmenu", (event) => event.preventDefault());
  }

  consumeClick() {
    const click = this.pointer.click;
    this.pointer.click = null;
    return click;
  }

  consumeRightClick() {
    const click = this.pointer.rightClick;
    this.pointer.rightClick = null;
    return click;
  }

  consumePointerDown() {
    const down = this.pointer.justDown;
    this.pointer.justDown = null;
    return down;
  }

  consumePointerUp() {
    const up = this.pointer.justUp;
    this.pointer.justUp = null;
    return up;
  }

  consumeWheel() {
    const wheel = this.pointer.wheel;
    this.pointer.wheel = 0;
    return wheel;
  }
}

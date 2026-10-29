const desktop = document.getElementById("desktop");
const windowLayer = document.getElementById("window-layer");
const taskbarButtons = document.getElementById("taskbar-buttons");
const startButton = document.getElementById("start-button");
const startMenu = document.getElementById("start-menu");
const desktopIcons = document.querySelectorAll(".desktop-icon");
const desktopContextMenu = document.getElementById("desktop-context-menu");
const taskbarClock = document.getElementById("taskbar-clock");

const windows = new Map();
let zIndexCounter = 10;
let nextWindowPosition = 0;
let dragState = null;
let desktopIconDragState = null;
let wallpaperIndex = 0;
let desktopContextTarget = null;

const desktopWallpapers = ["OIP.webp", "PC _ Computer - Windows XP - Themes - Luna Blue.png"];

const appConfigs = {
  boletim: {
    id: "boletim",
    title: "Boletim.exe",
    icon: "ICON1_1.ico",
    width: 420,
    height: 480,
    content: buildBoletimContent(),
  },
  computador: {
    id: "computador",
    title: "Meu Computador",
    icon: "Computer Folder.ico",
    width: 420,
    height: 260,
    content: buildInfoWindowContent({
      title: "Meu Computador",
      details: [
        "Sistema de consulta de notas em uma simulação do Windows XP.",
        "Arquivos locais disponíveis: ícones, janelas e interface clássica.",
        "Este ambiente foi montado para testes visuais e funcionais do projeto.",
      ],
    }),
  },
  lixeira: {
    id: "lixeira",
    title: "Lixeira",
    icon: "Closed folder.ico",
    width: 380,
    height: 240,
    content: buildInfoWindowContent({
      title: "Lixeira",
      details: [
        "Não há itens pendentes na simulação de reciclagem.",
        "O espaço de armazenamento está disponível para novas tarefas.",
      ],
    }),
  },
  ajuda: {
    id: "ajuda",
    title: "Ajuda e Suporte",
    icon: "All Programs.ico",
    width: 440,
    height: 300,
    content: buildInfoWindowContent({
      title: "Ajuda e Suporte",
      details: [
        "Use o menu Iniciar para abrir as aplicações disponíveis.",
        "Digite notas de 0 a 10, inclusive, usando ponto ou vírgula como separador decimal.",
        "A média é calculada automaticamente após a validação dos campos.",
      ],
    }),
  },
  sobre: {
    id: "sobre",
    title: "Sobre o sistema",
    icon: "Windows Explorer.ico",
    width: 420,
    height: 260,
    content: buildInfoWindowContent({
      title: "Sobre o sistema",
      details: [
        "Projeto: Windows XP Academic — Boletim.exe",
        "Emulação visual de desktop inspirada no tema Luna Blue.",
        "Desenvolvido em HTML, CSS e JavaScript puro, sem dependências externas.",
      ],
    }),
  },
};

function buildInfoWindowContent({ title, details }) {
  return `
    <div class="info-window">
      <div class="info-window-card">
        <h3>${title}</h3>
      </div>
      <div class="info-window-card">
        ${details
          .map(
            (detail) => `
            <p>${detail}</p>
          `
          )
          .join("")}
      </div>
    </div>
  `;
}

function buildBoletimContent() {
  return `
    <div class="boletim-form">
      <div class="form-row">
        <label for="student-name">Nome do estudante</label>
        <input id="student-name" name="student-name" type="text" autocomplete="off" aria-invalid="false" placeholder="Ex.: Ana" />
        <div class="field-error" id="student-name-error" aria-live="polite"></div>
      </div>

      <div class="form-row">
        <label for="grade-1">Nota 1</label>
        <input id="grade-1" name="grade-1" type="text" inputmode="decimal" aria-invalid="false" placeholder="0 a 10" />
        <div class="field-error" id="grade-1-error" aria-live="polite"></div>
      </div>

      <div class="form-row">
        <label for="grade-2">Nota 2</label>
        <input id="grade-2" name="grade-2" type="text" inputmode="decimal" aria-invalid="false" placeholder="0 a 10" />
        <div class="field-error" id="grade-2-error" aria-live="polite"></div>
      </div>

      <div class="form-row">
        <label for="grade-3">Nota 3</label>
        <input id="grade-3" name="grade-3" type="text" inputmode="decimal" aria-invalid="false" placeholder="0 a 10" />
        <div class="field-error" id="grade-3-error" aria-live="polite"></div>
      </div>

      <div class="form-actions">
        <button class="xp-button primary" type="button" data-action="calculate">Calcular Média</button>
        <button class="xp-button secondary" type="button" data-action="clear-notes">Limpar</button>
      </div>

      <div id="result-panel" class="result-panel" aria-live="polite">
        <div class="result-header">
          <div class="result-icon" id="result-icon"></div>
          <div id="result-text" class="result-text">Nenhum cálculo realizado.</div>
        </div>
        <div class="progress-label">Média: <span id="average-label">0,00</span></div>
        <div class="progress-track">
          <span id="progress-fill" class="progress-fill"></span>
        </div>
      </div>
    </div>
  `;
}

function getNextWindowPosition() {
  const offsetX = 150 + (nextWindowPosition % 8) * 28;
  const offsetY = 70 + (nextWindowPosition % 6) * 18;
  nextWindowPosition += 1;
  return { left: offsetX, top: offsetY };
}

function updateClock() {
  const now = new Date();
  const timeString = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  taskbarClock.textContent = timeString;
}

function toggleStartMenu(forceOpen) {
  const shouldOpen = typeof forceOpen === "boolean" ? forceOpen : startMenu.classList.contains("hidden");
  startMenu.classList.toggle("hidden", !shouldOpen);
  startButton.classList.toggle("active", shouldOpen);
  startButton.setAttribute("aria-expanded", String(shouldOpen));
}

function createWindow(programId, config) {
  const { left, top } = getNextWindowPosition();
  const windowEl = document.createElement("section");
  windowEl.className = "window active";
  windowEl.dataset.programId = programId;
  windowEl.style.left = `${left}px`;
  windowEl.style.top = `${top}px`;
  windowEl.style.width = `${config.width}px`;
  windowEl.style.height = `${config.height}px`;

  windowEl.innerHTML = `
    <div class="window-header">
      <div class="window-title">
        <img src="${config.icon}" alt="" />
        <span class="window-title-text">${config.title}</span>
      </div>
      <div class="window-controls">
        <button class="window-control minimize" type="button" aria-label="Minimizar" data-action="minimize"></button>
        <button class="window-control maximize" type="button" aria-label="Maximizar" data-action="maximize"></button>
        <button class="window-control close" type="button" aria-label="Fechar" data-action="close"></button>
      </div>
    </div>
    <div class="window-body">${config.content}</div>
  `;

  const taskbarButton = document.createElement("button");
  taskbarButton.type = "button";
  taskbarButton.className = "taskbar-button active";
  taskbarButton.dataset.programId = programId;
  taskbarButton.textContent = config.title;
  taskbarButtons.appendChild(taskbarButton);

  const header = windowEl.querySelector(".window-header");
  header.addEventListener("pointerdown", (event) => {
    if (event.target.closest("button")) {
      return;
    }

    const rect = windowEl.getBoundingClientRect();
    dragState = {
      programId,
      startX: event.clientX,
      startY: event.clientY,
      originLeft: rect.left,
      originTop: rect.top,
    };

    windowEl.setPointerCapture?.(event.pointerId);
    bringToFront(windowEl);
  });

  windowEl.querySelector("[data-action='minimize']").addEventListener("click", () => {
    minimizeWindow(windowEl, taskbarButton);
  });

  windowEl.querySelector("[data-action='maximize']").addEventListener("click", () => {
    toggleMaximize(windowEl);
  });

  windowEl.querySelector("[data-action='close']").addEventListener("click", () => {
    closeWindow(programId);
  });

  taskbarButton.addEventListener("click", () => {
    if (windowEl.classList.contains("hidden")) {
      restoreWindow(programId);
    } else {
      bringToFront(windowEl);
    }
  });

  if (programId === "boletim") {
    bindBoletimEvents(windowEl);
  }

  windowLayer.appendChild(windowEl);
  bringToFront(windowEl);
  return { windowEl, taskbarButton };
}

function bringToFront(windowEl) {
  const programId = windowEl.dataset.programId;
  zIndexCounter += 1;
  windowEl.style.zIndex = String(zIndexCounter);

  const allWindows = [...windowLayer.querySelectorAll(".window")];
  allWindows.forEach((win) => {
    if (win !== windowEl) {
      win.classList.remove("active");
      win.querySelector(".window-header")?.classList.add("inactive");
    }
  });

  windowEl.classList.add("active");
  windowEl.querySelector(".window-header")?.classList.remove("inactive");

  const matchingTask = taskbarButtons.querySelector(`[data-program-id="${programId}"]`);
  if (matchingTask) {
    taskbarButtons.querySelectorAll(".taskbar-button").forEach((button) => button.classList.remove("active"));
    matchingTask.classList.add("active");
  }
}

function closeWindow(programId) {
  const instance = windows.get(programId);
  if (!instance) return;
  instance.windowEl.remove();
  instance.taskbarButton.remove();
  windows.delete(programId);
}

function minimizeWindow(windowEl, taskbarButton) {
  windowEl.classList.add("hidden");
  taskbarButton.classList.remove("active");
}

function restoreWindow(programId) {
  const instance = windows.get(programId);
  if (!instance) return openProgram(programId);

  instance.windowEl.classList.remove("hidden");
  bringToFront(instance.windowEl);
}

function toggleMaximize(windowEl) {
  const isMaximized = windowEl.dataset.maximized === "true";

  if (isMaximized) {
    const prev = JSON.parse(windowEl.dataset.previousState || "{}") || {};
    windowEl.style.left = prev.left || "150px";
    windowEl.style.top = prev.top || "70px";
    windowEl.style.width = prev.width || "420px";
    windowEl.style.height = prev.height || "480px";
    windowEl.dataset.maximized = "false";
    return;
  }

  windowEl.dataset.previousState = JSON.stringify({
    left: windowEl.style.left,
    top: windowEl.style.top,
    width: windowEl.style.width,
    height: windowEl.style.height,
  });

  windowEl.style.left = "0px";
  windowEl.style.top = "0px";
  windowEl.style.width = `${window.innerWidth - 4}px`;
  windowEl.style.height = `${window.innerHeight - 42}px`;
  windowEl.dataset.maximized = "true";
}

function openProgram(programId) {
  if (windows.has(programId)) {
    restoreWindow(programId);
    return;
  }

  const config = appConfigs[programId];
  if (!config) return;
  const instance = createWindow(programId, config);
  windows.set(programId, instance);
}

function bindBoletimEvents(windowEl) {
  const calculateButton = windowEl.querySelector('[data-action="calculate"]');
  const clearButton = windowEl.querySelector('[data-action="clear-notes"]');

  calculateButton.addEventListener("click", () => {
    const nameInput = windowEl.querySelector("#student-name");
    const grade1Input = windowEl.querySelector("#grade-1");
    const grade2Input = windowEl.querySelector("#grade-2");
    const grade3Input = windowEl.querySelector("#grade-3");

    const result = calculateFinalGrade({
      name: nameInput.value,
      grades: [grade1Input.value, grade2Input.value, grade3Input.value],
    });

    renderBoletimResult(windowEl, result);
  });

  clearButton.addEventListener("click", () => {
    windowEl.querySelectorAll("input").forEach((input) => {
      input.value = "";
      input.setAttribute("aria-invalid", "false");
    });

    windowEl.querySelectorAll(".field-error").forEach((fieldError) => {
      fieldError.textContent = "";
    });

    const resultText = windowEl.querySelector("#result-text");
    const resultIcon = windowEl.querySelector("#result-icon");
    const averageLabel = windowEl.querySelector("#average-label");
    const progressFill = windowEl.querySelector("#progress-fill");

    resultText.textContent = "Nenhum cálculo realizado.";
    resultIcon.className = "result-icon";
    averageLabel.textContent = "0,00";
    progressFill.style.width = "0%";
  });
}

function renderBoletimResult(windowEl, result) {
  const resultText = windowEl.querySelector("#result-text");
  const resultIcon = windowEl.querySelector("#result-icon");
  const averageLabel = windowEl.querySelector("#average-label");
  const progressFill = windowEl.querySelector("#progress-fill");

  if (result.success === false) {
    resultText.textContent = result.message;
    resultIcon.className = "result-icon error";
    averageLabel.textContent = "0,00";
    progressFill.style.width = "0%";
    return;
  }

  resultText.textContent = `${result.name}: ${result.status}`;
  resultIcon.className = `result-icon ${result.statusClass}`;
  averageLabel.textContent = result.averageText;
  progressFill.style.width = `${Math.min((result.average / 10) * 100, 100)}%`;
}

function calculateFinalGrade({ name, grades }) {
  const sanitizedName = name.trim();
  const nameError = document.getElementById("student-name-error");
  const gradeFields = [
    { key: "grade-1", errorId: "grade-1-error" },
    { key: "grade-2", errorId: "grade-2-error" },
    { key: "grade-3", errorId: "grade-3-error" },
  ];

  let isValid = true;

  if (!sanitizedName) {
    isValid = false;
    setFieldError("student-name", "student-name-error", "Informe o nome do estudante.");
  } else {
    clearFieldError("student-name", "student-name-error");
  }

  const parsedGrades = grades.map((value, index) => {
    const parsed = parseGrade(value);
    const field = gradeFields[index];

    if (!parsed.valid) {
      isValid = false;
      setFieldError(field.key, field.errorId, parsed.message);
      return null;
    }

    clearFieldError(field.key, field.errorId);
    return parsed.value;
  });

  if (!isValid) {
    return {
      success: false,
      message: "Dados inválidos. Revise o nome e as notas.",
    };
  }

  const average = parsedGrades.reduce((sum, grade) => sum + grade, 0) / parsedGrades.length;
  let status = "Reprovado";
  let statusClass = "error";

  if (average >= 7) {
    status = "Aprovado";
    statusClass = "success";
  } else if (average >= 5) {
    status = "Recuperação";
    statusClass = "warning";
  }

  const averageText = average.toFixed(2).replace(".", ",");

  if (nameError) {
    nameError.textContent = "";
  }

  return {
    success: true,
    name: sanitizedName,
    status,
    statusClass,
    average,
    averageText,
  };
}

function parseGrade(rawValue) {
  const value = String(rawValue ?? "").trim();

  if (!value) {
    return { valid: false, message: "Preencha esta nota." };
  }

  const normalized = value.replace(",", ".");

  if (!/^-?(?:\d+|\d+\.\d+|\d*\.\d+)$/.test(normalized)) {
    return { valid: false, message: "Use apenas números válidos de 0 a 10." };
  }

  if (normalized.indexOf(".") !== normalized.lastIndexOf(".")) {
    return { valid: false, message: "Formato da nota inválido." };
  }

  const numeric = Number(normalized);

  if (!Number.isFinite(numeric)) {
    return { valid: false, message: "Nota inválida." };
  }

  if (numeric < 0 || numeric > 10) {
    return { valid: false, message: "A nota deve estar entre 0 e 10." };
  }

  return { valid: true, value: numeric };
}

function setFieldError(fieldId, errorId, message) {
  const field = document.getElementById(fieldId);
  const errorField = document.getElementById(errorId);

  if (field) {
    field.setAttribute("aria-invalid", "true");
  }

  if (errorField) {
    errorField.textContent = message;
  }
}

function clearFieldError(fieldId, errorId) {
  const field = document.getElementById(fieldId);
  const errorField = document.getElementById(errorId);

  if (field) {
    field.setAttribute("aria-invalid", "false");
  }

  if (errorField) {
    errorField.textContent = "";
  }
}

function updateWallpaper(fileName) {
  document.body.style.background = `linear-gradient(rgba(11, 63, 84, 0.15), rgba(11, 63, 84, 0.2)), url("${fileName}") center/cover no-repeat fixed`;
}

function organizeDesktopIcons() {
  const iconArray = [...document.querySelectorAll(".desktop-icon")];
  const spacingX = 98;
  const spacingY = 92;
  const paddingX = 16;
  const paddingY = 18;

  iconArray.forEach((icon, index) => {
    const left = paddingX + (index % 2) * spacingX;
    const top = paddingY + Math.floor(index / 2) * spacingY;
    icon.style.left = `${Math.max(8, left)}px`;
    icon.style.top = `${Math.max(8, top)}px`;
  });
}

function createDesktopFolder() {
  const folderName = `Pasta ${document.querySelectorAll(".desktop-icon").length + 1}`;
  const folderButton = document.createElement("button");
  folderButton.type = "button";
  folderButton.className = "desktop-icon app-shortcut";
  folderButton.dataset.program = "pasta";
  folderButton.innerHTML = '<img src="Folder Options.ico" alt="Pasta fictícia" /><span>' + folderName + "</span>";
  folderButton.style.left = `${16 + (Math.random() * 60)}px`;
  folderButton.style.top = `${20 + (Math.random() * 180)}px`;

  folderButton.addEventListener("click", () => {
    document.querySelectorAll(".desktop-icon").forEach((item) => item.classList.remove("selected"));
    folderButton.classList.add("selected");
  });

  folderButton.addEventListener("dblclick", () => {
    openProgram("computador");
  });

  folderButton.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    desktopIconDragState = {
      icon: folderButton,
      offsetX: event.clientX - folderButton.getBoundingClientRect().left,
      offsetY: event.clientY - folderButton.getBoundingClientRect().top,
    };
    folderButton.classList.add("dragging");
    event.preventDefault();
    event.stopPropagation();
  });

  document.getElementById("desktop-icons").appendChild(folderButton);
  attachDesktopIconHandlers(folderButton);
}

function attachDesktopIconHandlers(icon) {
  icon.addEventListener("dblclick", () => {
    if (desktopIconDragState && desktopIconDragState.icon === icon) {
      return;
    }
    const programId = icon.dataset.program;
    if (programId) {
      openProgram(programId);
      toggleStartMenu(false);
    }
  });

  icon.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const programId = icon.dataset.program;
      if (programId) {
        openProgram(programId);
      }
      toggleStartMenu(false);
    }
  });

  icon.addEventListener("click", (event) => {
    if (event.detail === 0) return;
    document.querySelectorAll(".desktop-icon").forEach((item) => item.classList.remove("selected"));
    icon.classList.add("selected");
  });

  icon.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    desktopIconDragState = {
      icon,
      offsetX: event.clientX - icon.getBoundingClientRect().left,
      offsetY: event.clientY - icon.getBoundingClientRect().top,
    };
    icon.classList.add("dragging");
    event.preventDefault();
    event.stopPropagation();
  });
}

function attachContextMenu() {
  desktop.addEventListener("contextmenu", (event) => {
    const icon = event.target.closest(".desktop-icon");
    if (icon) {
      desktopContextTarget = icon;
      desktopContextMenu.dataset.target = "icon";
      const menuButtons = [...desktopContextMenu.querySelectorAll(".context-menu-item")];
      menuButtons.forEach((button) => {
        const action = button.dataset.action;
        button.hidden = !(action === "open" || action === "rename" || action === "delete");
      });
      menuButtons.find((button) => button.dataset.action === "open").hidden = false;
      menuButtons.find((button) => button.dataset.action === "rename").hidden = false;
      menuButtons.find((button) => button.dataset.action === "delete").hidden = false;
    } else {
      desktopContextTarget = null;
      desktopContextMenu.dataset.target = "desktop";
      const menuButtons = [...desktopContextMenu.querySelectorAll(".context-menu-item")];
      menuButtons.forEach((button) => {
        button.hidden = false;
      });
    }

    event.preventDefault();
    desktopContextMenu.classList.remove("hidden");
    desktopContextMenu.style.left = `${event.clientX}px`;
    desktopContextMenu.style.top = `${event.clientY}px`;
  });

  desktopContextMenu.querySelectorAll(".context-menu-item").forEach((item) => {
    item.addEventListener("click", () => {
      const action = item.dataset.action;
      const target = desktopContextTarget;

      if (action === "organize") {
        organizeDesktopIcons();
      }

      if (action === "refresh") {
        updateWallpaper(desktopWallpapers[wallpaperIndex % desktopWallpapers.length]);
        wallpaperIndex += 1;
      }

      if (action === "create-folder") {
        createDesktopFolder();
      }

      if (action === "wallpaper") {
        wallpaperIndex = (wallpaperIndex + 1) % desktopWallpapers.length;
        updateWallpaper(desktopWallpapers[wallpaperIndex]);
      }

      if (action === "open" && target) {
        openProgram(target.dataset.program);
      }

      if (action === "rename" && target) {
        const newName = window.prompt("Novo nome do atalho:", target.querySelector("span").textContent);
        if (newName && newName.trim()) {
          target.querySelector("span").textContent = newName.trim();
        }
      }

      if (action === "delete" && target) {
        target.remove();
      }

      desktopContextMenu.classList.add("hidden");
      desktopContextTarget = null;
    });
  });

  document.addEventListener("click", (event) => {
    if (!desktopContextMenu.contains(event.target) && !event.target.closest(".desktop-icon")) {
      desktopContextMenu.classList.add("hidden");
    }
  });
}

function attachDesktopInteractions() {
  document.querySelectorAll(".desktop-icon").forEach((icon) => {
    attachDesktopIconHandlers(icon);
  });

  document.querySelectorAll(".start-menu-item").forEach((menuItem) => {
    menuItem.addEventListener("click", () => {
      openProgram(menuItem.dataset.program);
      toggleStartMenu(false);
    });
  });

  document.getElementById("shutdown-button").addEventListener("click", () => {
    const shutdownMessage = document.createElement("div");
    shutdownMessage.className = "info-window-card";
    shutdownMessage.textContent = "Desligamento simulado ativado. O computador não foi desligado de verdade.";
    if (document.querySelector("#shutdown-message")) {
      document.querySelector("#shutdown-message").remove();
    }
    shutdownMessage.id = "shutdown-message";
    desktop.appendChild(shutdownMessage);
    setTimeout(() => shutdownMessage.remove(), 2200);
    toggleStartMenu(false);
  });

  startButton.addEventListener("click", () => {
    const isOpen = !startMenu.classList.contains("hidden");
    toggleStartMenu(!isOpen);
  });

  document.addEventListener("click", (event) => {
    const clickedInsideMenu = startMenu.contains(event.target);
    const clickedStartButton = startButton.contains(event.target);

    if (!clickedInsideMenu && !clickedStartButton && !startMenu.classList.contains("hidden")) {
      toggleStartMenu(false);
    }
  });

  document.addEventListener("pointermove", (event) => {
    if (!desktopIconDragState) {
      if (!dragState) {
        return;
      }

      const win = windows.get(dragState.programId)?.windowEl;
      if (!win || win.dataset.maximized === "true") {
        return;
      }

      const dx = event.clientX - dragState.startX;
      const dy = event.clientY - dragState.startY;
      const nextLeft = Math.min(Math.max(dragState.originLeft + dx, 0), window.innerWidth - 200);
      const nextTop = Math.min(Math.max(dragState.originTop + dy, 0), window.innerHeight - 120);

      win.style.left = `${nextLeft}px`;
      win.style.top = `${nextTop}px`;
      return;
    }

    const { icon, offsetX, offsetY } = desktopIconDragState;
    const bounds = desktop.getBoundingClientRect();
    const nextLeft = Math.min(Math.max(event.clientX - bounds.left - offsetX, 0), bounds.width - icon.offsetWidth - 8);
    const nextTop = Math.min(Math.max(event.clientY - bounds.top - offsetY, 0), bounds.height - icon.offsetHeight - 8);

    icon.style.left = `${nextLeft}px`;
    icon.style.top = `${nextTop}px`;
  });

  document.addEventListener("pointerup", () => {
    if (desktopIconDragState) {
      desktopIconDragState.icon.classList.remove("dragging");
      desktopIconDragState = null;
    }
    dragState = null;
  });
}

window.addEventListener("load", () => {
  updateClock();
  setInterval(updateClock, 1000 * 30);
  updateWallpaper(desktopWallpapers[wallpaperIndex]);
  attachContextMenu();
  attachDesktopInteractions();
  organizeDesktopIcons();
  openProgram("boletim");
  openProgram("computador");
  openProgram("ajuda");
  toggleStartMenu(false);
});

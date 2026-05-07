"use strict";

/**
 * Todo 앱의 핵심 상태를 관리하는 객체
 * - todos: 실제 할 일 데이터
 * - filter: 현재 필터 상태(all | active | completed)
 * - theme: 라이트/다크 모드 상태
 */
const appState = {
  todos: [],
  filter: "all",
  theme: "light",
};

const STORAGE_KEYS = {
  todos: "focusflow_todos",
  theme: "focusflow_theme",
};

// 자주 사용하는 DOM 요소를 한 곳에서 관리해 가독성과 유지보수를 높인다.
const elements = {
  todoForm: document.querySelector("#todoForm"),
  todoInput: document.querySelector("#todoInput"),
  inputFeedback: document.querySelector("#inputFeedback"),
  todoList: document.querySelector("#todoList"),
  emptyState: document.querySelector("#emptyState"),
  remainingCount: document.querySelector("#remainingCount"),
  filterButtons: document.querySelectorAll(".filter-btn"),
  clearAllBtn: document.querySelector("#clearAllBtn"),
  clearCompletedBtn: document.querySelector("#clearCompletedBtn"),
  currentDateTime: document.querySelector("#currentDateTime"),
  themeToggleBtn: document.querySelector("#themeToggleBtn"),
  loadingBadge: document.querySelector("#loadingBadge"),
};

/**
 * 앱 시작 시 필요한 초기 동작을 수행한다.
 */
function initApp() {
  loadStateFromStorage();
  bindEvents();
  startClock();
  applyTheme();
  render();
}

/**
 * localStorage에서 저장 데이터를 불러와 상태에 반영한다.
 * 예외가 발생해도 앱이 중단되지 않도록 안전하게 처리한다.
 */
function loadStateFromStorage() {
  try {
    const savedTodos = JSON.parse(localStorage.getItem(STORAGE_KEYS.todos) || "[]");
    const savedTheme = localStorage.getItem(STORAGE_KEYS.theme) || "light";

    appState.todos = Array.isArray(savedTodos) ? savedTodos : [];
    appState.theme = savedTheme === "dark" ? "dark" : "light";
  } catch (error) {
    console.error("저장된 데이터를 읽는 중 오류가 발생했습니다:", error);
    appState.todos = [];
    appState.theme = "light";
  }
}

/**
 * 현재 상태를 localStorage에 저장한다.
 */
function saveStateToStorage() {
  showLoadingBadge();

  try {
    localStorage.setItem(STORAGE_KEYS.todos, JSON.stringify(appState.todos));
    localStorage.setItem(STORAGE_KEYS.theme, appState.theme);
  } catch (error) {
    console.error("데이터를 저장하는 중 오류가 발생했습니다:", error);
  }
}

/**
 * 저장중 배지를 잠깐 표시해 인터랙션 피드백을 제공한다.
 */
function showLoadingBadge() {
  elements.loadingBadge.classList.remove("hidden");
  window.clearTimeout(showLoadingBadge.timerId);
  showLoadingBadge.timerId = window.setTimeout(() => {
    elements.loadingBadge.classList.add("hidden");
  }, 420);
}

/**
 * 이벤트 리스너를 한 곳에 모아 등록한다.
 */
function bindEvents() {
  elements.todoForm.addEventListener("submit", handleAddTodo);
  elements.todoList.addEventListener("click", handleTodoListClick);
  elements.todoList.addEventListener("change", handleTodoToggle);
  elements.todoList.addEventListener("dragstart", handleDragStart);
  elements.todoList.addEventListener("dragover", handleDragOver);
  elements.todoList.addEventListener("drop", handleDrop);
  elements.todoList.addEventListener("dragend", handleDragEnd);
  elements.clearAllBtn.addEventListener("click", handleClearAll);
  elements.clearCompletedBtn.addEventListener("click", handleClearCompleted);
  elements.themeToggleBtn.addEventListener("click", toggleTheme);

  elements.filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      appState.filter = button.dataset.filter;
      updateFilterButtons();
      render();
    });
  });
}

/**
 * Todo 추가 이벤트를 처리한다.
 * - 빈 값 방지
 * - 중복 입력 최소화 (대소문자/공백 무시 비교)
 */
function handleAddTodo(event) {
  event.preventDefault();

  const newText = normalizeText(elements.todoInput.value);
  const isDuplicate = appState.todos.some(
    (todo) => normalizeText(todo.text).toLowerCase() === newText.toLowerCase()
  );

  if (!newText) {
    showInputFeedback("할 일을 입력해 주세요.");
    return;
  }

  if (isDuplicate) {
    showInputFeedback("이미 비슷한 할 일이 있어요. 내용을 조금 바꿔보세요.");
    return;
  }

  appState.todos.unshift({
    id: crypto.randomUUID(),
    text: newText,
    completed: false,
    createdAt: new Date().toISOString(),
  });

  elements.todoInput.value = "";
  showInputFeedback("");
  saveStateToStorage();
  render();
}

/**
 * 체크박스 변경 시 완료 상태를 업데이트한다.
 */
function handleTodoToggle(event) {
  if (!event.target.classList.contains("todo-checkbox")) return;

  const targetItem = event.target.closest(".todo-item");
  if (!targetItem) return;

  const { id } = targetItem.dataset;
  appState.todos = appState.todos.map((todo) =>
    todo.id === id ? { ...todo, completed: event.target.checked } : todo
  );

  saveStateToStorage();
  render();
}

/**
 * 수정/삭제 버튼 클릭을 이벤트 위임으로 처리한다.
 */
function handleTodoListClick(event) {
  const actionButton = event.target.closest("[data-action]");
  if (!actionButton) return;

  const targetItem = actionButton.closest(".todo-item");
  if (!targetItem) return;
  const { id } = targetItem.dataset;

  if (actionButton.dataset.action === "delete") {
    deleteTodo(id);
  } else if (actionButton.dataset.action === "edit") {
    editTodo(id);
  }
}

function deleteTodo(todoId) {
  appState.todos = appState.todos.filter((todo) => todo.id !== todoId);
  saveStateToStorage();
  render();
}

/**
 * prompt 기반 수정 기능:
 * - 초보자도 이해하기 쉬운 방식
 * - 빈 값/중복 값 방지
 */
function editTodo(todoId) {
  const currentTodo = appState.todos.find((todo) => todo.id === todoId);
  if (!currentTodo) return;

  const editedText = window.prompt("할 일을 수정하세요:", currentTodo.text);
  if (editedText === null) return;

  const normalizedEditedText = normalizeText(editedText);
  if (!normalizedEditedText) {
    showInputFeedback("수정된 내용이 비어 있습니다.");
    return;
  }

  const duplicated = appState.todos.some(
    (todo) =>
      todo.id !== todoId &&
      normalizeText(todo.text).toLowerCase() === normalizedEditedText.toLowerCase()
  );

  if (duplicated) {
    showInputFeedback("이미 존재하는 할 일과 중복됩니다.");
    return;
  }

  appState.todos = appState.todos.map((todo) =>
    todo.id === todoId ? { ...todo, text: normalizedEditedText } : todo
  );

  showInputFeedback("");
  saveStateToStorage();
  render();
}

function handleClearAll() {
  if (!appState.todos.length) return;
  if (!window.confirm("모든 할 일을 삭제할까요?")) return;

  appState.todos = [];
  saveStateToStorage();
  render();
}

function handleClearCompleted() {
  const completedCount = appState.todos.filter((todo) => todo.completed).length;
  if (!completedCount) return;

  appState.todos = appState.todos.filter((todo) => !todo.completed);
  saveStateToStorage();
  render();
}

/**
 * 현재 필터 상태에 따라 렌더링할 목록을 반환한다.
 */
function getFilteredTodos() {
  if (appState.filter === "active") {
    return appState.todos.filter((todo) => !todo.completed);
  }
  if (appState.filter === "completed") {
    return appState.todos.filter((todo) => todo.completed);
  }
  return appState.todos;
}

/**
 * 목록을 렌더링한다.
 */
function renderTodoList() {
  const filteredTodos = getFilteredTodos();
  elements.todoList.innerHTML = filteredTodos
    .map(
      (todo) => `
      <li class="todo-item ${todo.completed ? "completed" : ""}" data-id="${todo.id}" draggable="true">
        <input
          type="checkbox"
          class="todo-checkbox"
          aria-label="할 일 완료 체크"
          ${todo.completed ? "checked" : ""}
        />
        <span class="todo-text">${escapeHtml(todo.text)}</span>
        <div class="todo-actions">
          <button class="todo-btn" data-action="edit" aria-label="할 일 수정">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button class="todo-btn delete" data-action="delete" aria-label="할 일 삭제">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </li>
    `
    )
    .join("");

  elements.emptyState.style.display = filteredTodos.length ? "none" : "block";
}

/**
 * 남은 할 일 개수를 계산해 보여준다.
 */
function renderRemainingCount() {
  const remainingTodos = appState.todos.filter((todo) => !todo.completed).length;
  elements.remainingCount.textContent = `남은 할 일 ${remainingTodos}개`;
}

/**
 * 필터 버튼의 활성 상태를 UI에 반영한다.
 */
function updateFilterButtons() {
  elements.filterButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.filter === appState.filter);
  });
}

function render() {
  renderTodoList();
  renderRemainingCount();
  updateFilterButtons();
}

/**
 * 실시간 시계를 1초마다 갱신한다.
 */
function startClock() {
  updateDateTime();
  setInterval(updateDateTime, 1000);
}

function updateDateTime() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  elements.currentDateTime.textContent = formatter.format(now);
}

/**
 * 다크모드 토글 및 저장
 */
function toggleTheme() {
  appState.theme = appState.theme === "light" ? "dark" : "light";
  applyTheme();
  saveStateToStorage();
}

function applyTheme() {
  document.body.classList.toggle("dark-mode", appState.theme === "dark");
  elements.themeToggleBtn.innerHTML =
    appState.theme === "dark"
      ? '<i class="fa-solid fa-sun"></i>'
      : '<i class="fa-solid fa-moon"></i>';
}

/**
 * 드래그앤드롭 정렬 기능
 */
let draggedTodoId = null;

function handleDragStart(event) {
  const item = event.target.closest(".todo-item");
  if (!item) return;

  draggedTodoId = item.dataset.id;
  item.classList.add("dragging");
}

function handleDragOver(event) {
  event.preventDefault();
}

function handleDrop(event) {
  event.preventDefault();
  const targetItem = event.target.closest(".todo-item");
  if (!targetItem || !draggedTodoId || targetItem.dataset.id === draggedTodoId) return;

  const fromIndex = appState.todos.findIndex((todo) => todo.id === draggedTodoId);
  const toIndex = appState.todos.findIndex((todo) => todo.id === targetItem.dataset.id);
  if (fromIndex < 0 || toIndex < 0) return;

  const [movedTodo] = appState.todos.splice(fromIndex, 1);
  appState.todos.splice(toIndex, 0, movedTodo);

  saveStateToStorage();
  render();
}

function handleDragEnd(event) {
  const item = event.target.closest(".todo-item");
  if (item) item.classList.remove("dragging");
  draggedTodoId = null;
}

/**
 * 문자열을 정리해 저장/비교에 사용한다.
 */
function normalizeText(text) {
  return text.replace(/\s+/g, " ").trim();
}

function showInputFeedback(message) {
  elements.inputFeedback.textContent = message;
}

/**
 * 사용자 입력을 텍스트로 안전하게 출력하기 위한 이스케이프 함수
 */
function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

initApp();

import { Calendar } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin, { Draggable } from "@fullcalendar/interaction";
import {
  subscribeOffDay,
  createOffDay,
  deleteOffDay,
  updateOffDay,
} from "../services/offday";
import { isValidUser, isAdmin } from "../services/auth";
import { loadUser } from "../services/users";
import { migrateUserId } from "../services/migrate_user";

const calendarEl = document.getElementById("calendarEl");
const userListEl = document.getElementById("userList");
const guestSearchWrapEl = document.getElementById("guest-search-wrap");
const guestSearchInputEl = document.getElementById("guest-search");
const guestSearchResultsEl = document.getElementById("guest-search-results");
const clearFilterBtnEl = document.getElementById("clear-filter-btn");
const calendarLoadingEl = document.getElementById("calendar-loading");
let isDeleting = false;
let calendarInstance = null;
let offdayData = [];
let guestUsers = [];
let selectedGuestUser = null;
let guestSearchInitialized = false;

function setCalendarLoading(isLoading) {
  calendarLoadingEl?.classList.toggle("hidden", !isLoading);
}

function renderCalendarEvents(raw) {
  if (!calendarInstance) return;

  const filtered = selectedGuestUser
    ? raw.filter((item) => {
        const itemUserId = String(item.userId ?? "");
        const candidates = [
          String(selectedGuestUser.id ?? ""),
          String(selectedGuestUser.userId ?? ""),
        ];
        const matched = candidates.some(
          (value) => value && itemUserId === value,
        );
        const sameName =
          selectedGuestUser.name &&
          item.name &&
          item.name.toLowerCase() === selectedGuestUser.name.toLowerCase();

        return matched || sameName;
      })
    : raw;

  const events = filtered.map((item) => ({
    id: item.id,
    title: item.name,
    start: item.date,
    allDay: item.allDay,
    extendedProps: {
      isHalf: item.isHalf,
      userId: item.userId,
    },
  }));

  calendarInstance.batchRendering(() => {
    calendarInstance.removeAllEvents();
    events.forEach((e) => calendarInstance.addEvent(e));
  });
}

function renderGuestResults(query = "") {
  if (!guestSearchResultsEl) return;

  const trimmedQuery = query.trim().toLowerCase();
  const source = ( !trimmedQuery
    ? guestUsers
    : guestUsers.filter((user) => {
        const haystack = `${user.name || ""} ${user.username || ""} ${user.userId ?? ""}`.toLowerCase();
        return haystack.includes(trimmedQuery);
      })
  )
    .filter((user) => user.userId != null && user.userId !== "")
    .slice()
    .sort((a, b) => Number(a.userId) - Number(b.userId))
    .slice(0, 10);

  if (!source.length) {
    guestSearchResultsEl.innerHTML = '<p class="text-sm text-stone-500">Tidak ada hasil</p>';
    return;
  }

  guestSearchResultsEl.innerHTML = source
    .map((user) => {
      const isSelected = selectedGuestUser?.id === user.id;
      return `
        <button
          type="button"
          class="w-full text-left px-2 py-1 rounded-sm border border-stone-200 hover:bg-stone-100 ${isSelected ? "bg-stone-100" : ""}"
          data-user-id="${user.id}"
        >
          <div class="font-medium text-sm">${user.name || "Unknown"}</div>
         
        </button>
      `;
    })
    .join("");

  guestSearchResultsEl.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      const user = guestUsers.find((item) => item.id === button.dataset.userId);
      if (!user) return;

      selectedGuestUser = user;
      guestSearchInputEl.value = user.name || user.username || "";
      renderGuestResults(guestSearchInputEl.value);
      renderCalendarEvents(offdayData);
    });
  });
}

export async function initGuestSearch() {
  if (!guestSearchWrapEl || !guestSearchInputEl || !guestSearchResultsEl) return;
  setCalendarLoading(true);

  if (!guestSearchInitialized) {
    guestSearchInputEl.addEventListener("input", (event) => {
      renderGuestResults(event.target.value);
    });

    clearFilterBtnEl?.addEventListener("click", () => {
      selectedGuestUser = null;
      guestSearchInputEl.value = "";
      renderGuestResults("");
      renderCalendarEvents(offdayData);
    });

    guestSearchInitialized = true;
  }

  const rawUser = localStorage.getItem("user");
  const isGuest = !rawUser;

  guestSearchWrapEl.classList.remove("hidden");

  guestUsers = await loadUser();
  if (!guestUsers.length) {
    guestSearchResultsEl.innerHTML = '<p class="text-sm text-stone-500">Tidak ada user</p>';
    renderCalendarEvents(offdayData);
    setCalendarLoading(false);
    return;
  }

  if (isGuest) {
    guestSearchInputEl.value = selectedGuestUser?.name || "";
    renderGuestResults(guestSearchInputEl.value);
    renderCalendarEvents(offdayData);
    setCalendarLoading(false);
    return;
  }

  guestSearchInputEl.value = "";
  guestSearchResultsEl.innerHTML = "";
  selectedGuestUser = null;
  renderCalendarEvents(offdayData);
  setCalendarLoading(false);
}

export async function initCalendar() {
  if (calendarInstance) return calendarInstance;

  setCalendarLoading(true);
  const valid = await isValidUser();

  calendarInstance = new Calendar(calendarEl, {
    plugins: [dayGridPlugin, interactionPlugin],
    initialView: "dayGridMonth",

    editable: valid,
    droppable: valid,

    height: "auto",
    contentHeight: "auto",
    dayMaxEvents: 2,
    longPressDelay: 200,
    eventLongPressDelay: 200,
    selectLongPressDelay: 200,

    headerToolbar: {
      start: "",
      center: "title",
      end: "prev,next",
    },

    events: [],

    eventContent: function (arg) {
      const isHalf = arg.event.extendedProps.isHalf;
      const name = arg.event.title;
      let bgClass;

      if (isHalf) {
        bgClass = "bg-blue-600";
      } else if (name === "DAY OFF") {
        bgClass = "bg-red-600";
      } else {
        bgClass = "bg-green-600";
      }

      return {
        html: `
  <div class="flex justify-between items-center px-1.5 rounded-sm text-white w-full ${bgClass}">
    ${name}
    ${isHalf ? '<span class="text-xs opacity-70">½</span>' : ""}
  </div>
`,
      };
    },

    eventReceive: async function (info) {
      if (!valid) {
        info.event.remove();
        return;
      }

      try {
        const event = info.event;

        await createOffDay({
          userId: event.extendedProps.userId,
          name: event.title,
          date: event.startStr,
          isHalf: false,
        });

        info.event.remove();
      } catch (err) {
        console.error(err);
        info.event.remove();
      }
    },

    eventDrop: async function (info) {
      if (!valid || isDeleting) {
        info.revert();
        return;
      }

      try {
        await updateOffDay(info.event.id, {
          date: info.event.startStr,
        });
      } catch (err) {
        console.error(err);
        info.revert();
      }
    },

    eventDragStop: async function (info) {
      if (!valid) return;

      const rect = calendarEl.getBoundingClientRect();
      const e = info.jsEvent;

      let x, y;

      if (e.touches && e.touches.length > 0) {
        x = e.touches[0].clientX;
        y = e.touches[0].clientY;
      } else if (e.changedTouches && e.changedTouches.length > 0) {
        x = e.changedTouches[0].clientX;
        y = e.changedTouches[0].clientY;
      } else {
        x = e.clientX;
        y = e.clientY;
      }

      const isOutside =
        x < rect.left || x > rect.right || y < rect.top || y > rect.bottom;

      if (isOutside) {
        isDeleting = true;

        try {
          await deleteOffDay(info.event.id);
          info.event.remove();
        } catch (err) {
          console.error(err);
        } finally {
          isDeleting = false;
        }
      }
    },

    eventClick: async function (info) {
      if (!valid) return;

      try {
        const event = info.event;
        const next = !event.extendedProps.isHalf;

        await updateOffDay(event.id, {
          isHalf: next,
          allDay: !next,
        });

        event.setExtendedProp("isHalf", next);
        event.setAllDay(!next);
      } catch (err) {
        console.error(err);
      }
    },
  });

  calendarInstance.render();
  setCalendarLoading(false);
  let unsubscribeOffDay = null;
  if (unsubscribeOffDay) {
    unsubscribeOffDay();
  }

  subscribeOffDay((raw) => {
    if (!calendarInstance) return;

    offdayData = raw;
    renderCalendarEvents(raw);
    setCalendarLoading(false);
  });

  return calendarInstance;
}

export async function renderUsers() {
  const admin = await isAdmin();
  let draggableInstance = null;
  let users = [];

  if (admin) {
    users = await loadUser();
    // await migrateUserId()

    users.sort((a, b) => {
      if (a.userId == null || b.userId == null) return 0;
      return a.userId - b.userId;
    });
    console.log(users);
  } else {
    const raw = localStorage.getItem("user");
    if (!raw) return;

    const user = JSON.parse(raw);

    users = [
      {
        id: user.id,
        name: user.name,
      },
    ];
  }

  userListEl.innerHTML = users
    .map(
      (user) => `
    <div 
      class="px-5 py-3 bg-green-600 rounded-sm text-white cursor-pointer"
      data-id="${user.id}"
    > ${user.userId}
      ${user.name}
    </div>
  `,
    )
    .join("");

  if (!draggableInstance) {
    draggableInstance = new Draggable(userListEl, {
      itemSelector: "[data-id]",
      longPressDelay: 200,
      eventData: function (el) {
        return {
          title: el.innerText,
          extendedProps: {
            userId: el.dataset.id,
            isHalf: false,
          },
        };
      },
    });
  }
}

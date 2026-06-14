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

const calendarEl = document.getElementById("calendarEl");
const userListEl = document.getElementById("userList");
let isDeleting = false;
let calendarInstance = null;

export async function initCalendar() {
  if (calendarInstance) return calendarInstance;

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
        bgClass = "bg-yellow-600";
      } else if (name === "DAY OFF") {
        bgClass = "bg-red-600";
      } else {
        bgClass = "bg-blue-600";
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
  let unsubscribeOffDay = null;
  if (unsubscribeOffDay) {
    unsubscribeOffDay();
  }

  subscribeOffDay((raw) => {
    if (!calendarInstance) return;

    const events = raw.map((item) => ({
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
  });

  return calendarInstance;
}

export async function renderUsers() {
  const admin = await isAdmin();
  let draggableInstance = null;
  let users = [];

  if (admin) {
    users = await loadUser();
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
      class="px-5 py-3 bg-blue-600 rounded-sm text-white cursor-pointer"
      data-id="${user.id}"
    >
      ${user.name}
    </div>
  `
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

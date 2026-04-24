function generateTimeline() {
  const container = document.getElementById("github-timeline");
  container.innerHTML = "";

  const days = 140; // number of days (like GitHub history)
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);

    const cell = document.createElement("div");
    cell.classList.add("day");

    // random intensity (just for demo)
    const value = Math.floor(Math.random() * 5);

    if (value === 1) cell.classList.add("lvl-1");
    if (value === 2) cell.classList.add("lvl-2");
    if (value === 3) cell.classList.add("lvl-3");
    if (value === 4) cell.classList.add("lvl-4");

    cell.title = d.toDateString();

    container.appendChild(cell);
  }
}

generateTimeline();
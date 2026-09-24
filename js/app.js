"use strict"; // Aktiverer strict mode - hjælper med at fange fejl

// Starter app når DOM er loaded
document.addEventListener("DOMContentLoaded", initApp);

// ===== GLOBALE VARIABLER =====
let allGames = [];

// ===== INITIALISERING =====
function initApp() {
  console.log("initApp: app.js is running 🎉");
  getGames(); // Hent alle games fra JSON og start applikationen

  // ===== HEADER SØGNING OG FILTRERING =====
  // Søgefelt i header - filtrer på spilnavn når brugeren skriver
  document.querySelector("#header-search-input").addEventListener("input", filterGames);

  // Genre/kategori dropdown i header - filtrer når bruger vælger kategori
  document.querySelector("#header-genre-select").addEventListener("change", filterGames);

  // Sort dropdown i header - sortér spil når bruger ændrer sortering
  document.querySelector("#header-sort-select").addEventListener("change", filterGames);

  // ===== MAIN SORTERING =====
  // Sort dropdown ved siden af "Alle spil" overskriften - alternativ til header sort
  document.querySelector("#main-sort-select").addEventListener("change", filterGames);
    

  // ===== SPILLETID RANGE FILTRERING =====
  // "Fra" spilletid felt - auto-udfyldning af "til" felt
  document.querySelector("#header-playtime-from").addEventListener("input", function () {
    const fromValue = this.value; // Hent den indtastede "fra" værdi
    const toField = document.querySelector("#header-playtime-to"); // Find "til" feltet

  // AUTOMATISK BEREGNING: Hver gang "Fra" ændres, sæt "Til" til +15 minutter
  // Eksempel: Fra=30 → Til=45, Fra=60 → Til=75
      if (fromValue) {
        toField.value = parseInt(fromValue) + 15; // Konverterer til tal og læg 15 til
      } else {
        // Hvis "Fra" ryddes (tomt), ryd også "Til" for at nulstille filteret
        toField.value = "";
      }

      filterGames(); // Kører ny filtrering med opdaterede værdier
    });

  // "Til" spilletid felt - manuel justering af spilletid range
  document.querySelector("#header-playtime-to").addEventListener("input", filterGames);

  // ===== RATING FELTER - AVANCERET SYNKRONISERING =====
  // Rating "Fra" felt - tillader bruger fleksibilitet men sikrer logiske værdier
  document.querySelector("#header-rating-from").addEventListener("input", function () {
    const fromValue = parseInt(this.value); // Konverter til tal (NaN(Not a number) hvis tomt)
    const toField = document.querySelector("#header-rating-to");
    const toValue = parseInt(toField.value); // Hent nuværende "Til" værdi

  // SCENARIE 1: Bruger ændrer "Fra" og "Til" bliver for lav
  // Eksempel: Fra=2→5, Til=3 → Fra=5, Til=5 (auto-justering)
    if (fromValue && toValue && toValue < fromValue) {
        toField.value = fromValue; // Løft "Til" til samme niveau som "Fra"
        console.log(
          `📊 Rating auto-justering: Til løftet fra ${toValue} til ${fromValue}`
        );
      }
      // SCENARIE 2: Første gang "Fra" udfyldes (smart initialisering)
      // Eksempel: Fra=tom→3, Til=tom → Fra=3, Til=4 (+1 for god range)
      else if (fromValue && !toField.value) {
        toField.value = Math.min(5, fromValue + 1); // +1 men aldrig over max 5
        console.log(
          `📊 Rating initialisering: Fra=${fromValue}, Til=${toField.value}`
        );
      }

      filterGames(); // Kør filtrering med nye værdier
    });

  // Rating "Til" felt - validerer at "Fra" ≤ "Til" reglen overholdes
  document
    .querySelector("#header-rating-to")
    .addEventListener("input", function () {
      const toValue = parseInt(this.value); // Konverter til tal (NaN(Not a number) hvis tomt)
      const fromField = document.querySelector("#header-rating-from");
      const fromValue = parseInt(fromField.value); // Hent nuværende "Fra" værdi

      // SCENARIE 1: Bruger sætter "Til" lavere end "Fra" (ulovligt)
      // Eksempel: Fra=4, Til=5→2 → Fra=2, Til=2 (auto-justering)
      if (toValue && fromValue && toValue < fromValue) {
        fromField.value = toValue; // Sænk "Fra" til samme niveau som "Til"
        console.log(
          `📊 Rating validering: Fra sænket fra ${fromValue} til ${toValue}`
        );
      }
      // SCENARIE 2: Første gang "Til" udfyldes (smart initialisering)
      // Eksempel: Fra=tom, Til=tom→4 → Fra=2, Til=4 (2-punkts range)
      else if (toValue && !fromField.value) {
        fromField.value = Math.max(0, toValue - 2); // -2 for god range, men aldrig under 0
        console.log(
          `📊 Rating initialisering: Fra=${fromField.value}, Til=${toValue}`
        );
      }

      filterGames(); // Kør filtrering med nye værdier
    });

  // Spillere felt
  document
    .querySelector("#header-players-from")
    .addEventListener("input", filterGames);

  // Sværhedsgrad felt
  document
    .querySelector("#header-difficulty-select")
    .addEventListener("change", filterGames);

  // Min. Alder felt
  document
    .querySelector("#header-age-from")
    .addEventListener("input", filterGames);

  // Location dropdown (nu udenfor filter panel)
  document
    .querySelector("#location-select")
    .addEventListener("change", filterGames);

  // Clear filters knap
  document
    .querySelector("#header-clear-filters")
    .addEventListener("click", clearAllFilters);

  // Close dialog button
  document.querySelector("#close-dialog").addEventListener("click", () => {
    document.querySelector("#game-dialog").close();
    document.body.classList.remove("modal-open");
  });

  // Filter panel toggle functionality
  initFilterPanel();
}

// Filter panel functionality
function initFilterPanel() {
  const filterToggle = document.querySelector("#filter-toggle");
  const filterPanel = document.querySelector("#filter-panel");
  const filterClose = document.querySelector("#filter-close");
  const filterBadge = document.querySelector("#filter-badge");

  // Toggle filter panel
  filterToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = filterPanel.classList.contains("open");

    if (isOpen) {
      closeFilterPanel();
    } else {
      openFilterPanel();
    }
  });

  // Close filter panel
  filterClose.addEventListener("click", closeFilterPanel);

  // Close when clicking outside
  document.addEventListener("click", (e) => {
    if (!filterPanel.contains(e.target) && !filterToggle.contains(e.target)) {
      closeFilterPanel();
    }
  });

  // Prevent panel close when clicking inside
  filterPanel.addEventListener("click", (e) => {
    e.stopPropagation();
  });

  function openFilterPanel() {
    filterPanel.classList.add("open");
    filterToggle.classList.add("active");
  }

  function closeFilterPanel() {
    filterPanel.classList.remove("open");
    filterToggle.classList.remove("active");
  }

  // Update filter badge count
  function updateFilterBadge() {
    let activeFilters = 0;

    // Check search
    if (document.querySelector("#header-search-input").value.trim())
      activeFilters++;

    // Check dropdowns
    if (document.querySelector("#location-select").value !== "all")
      activeFilters++;
    if (document.querySelector("#header-genre-select").value !== "none")
      activeFilters++;
    if (document.querySelector("#header-sort-select").value !== "all")
      activeFilters++;
    if (document.querySelector("#main-sort-select").value !== "all")
      activeFilters++;
    if (document.querySelector("#header-difficulty-select").value !== "none")
      activeFilters++;

    // Check number inputs - men spilletid tæller kun som én filtrering
    // Spilletid (tæller kun som ét filter hvis mindst et af felterne er udfyldt)
    if (
      document.querySelector("#header-playtime-from").value ||
      document.querySelector("#header-playtime-to").value
    ) {
      activeFilters++;
    }

    // Rating (tæller kun som ét filter hvis mindst et af felterne er udfyldt)
    if (
      document.querySelector("#header-rating-from").value ||
      document.querySelector("#header-rating-to").value
    ) {
      activeFilters++;
    }

    // Øvrige enkelt-felter
    if (document.querySelector("#header-players-from").value) activeFilters++;
    if (document.querySelector("#header-age-from").value) activeFilters++;

    if (activeFilters > 0) {
      filterBadge.style.display = "flex";
      filterBadge.textContent = activeFilters;
    } else {
      filterBadge.style.display = "none";
    }
  }

  // Add event listeners to all filter inputs to update badge
  const filterInputs = [
    "#header-genre-select",
    "#header-sort-select",
    "#main-sort-select",
    "#header-playtime-from",
    "#header-playtime-to",
    "#header-rating-from",
    "#header-rating-to",
    "#header-players-from",
    "#header-difficulty-select",
    "#header-age-from",
  ];

  filterInputs.forEach((selector) => {
    const element = document.querySelector(selector);
    if (element) {
      element.addEventListener("input", updateFilterBadge);
      element.addEventListener("change", updateFilterBadge);
    }
  });

  // Expose updateFilterBadge globally so clearAllFilters can use it
  window.updateFilterBadge = updateFilterBadge;
}

// ===== DATA HENTNING =====
async function getGames() {
  // Hent data fra JSON - husk at URL er anderledes!
  // Gem data i allGames variablen
  // Kald andre funktioner (hvilke?)

  console.log("🌐 Henter alle games fra JSON...");
  const response = await fetch(
    "https://raw.githubusercontent.com/cederdorff/race/refs/heads/master/data/games.json"
  );
  allGames = await response.json();
  console.log(`📊 JSON data modtaget: ${allGames.length} games`);
  populateGenreDropdown(); // Udfyld dropdown med genres <-----
  LocationDropdown(); // Udfyld dropdown med locations <-----
  displayGames(allGames);
  updateActiveFiltersDisplay(); // Initialiser aktive filtre display
}

// ===== VISNING =====  // Vis alle games - loop gennem og kald displayGame() for hver game
function displayGames(games) {
  console.log(` Viser ${games.length} games`);
  // Nulstil #game-list HTML'en
  document.querySelector("#game-list").innerHTML = "";
  // Gennemløb alle games og kør displayGame-funktionen for hver game
  for (const game of games) {
    displayGame(game);
  }
}

// Vis ÉT game card til game list
function displayGame(game) {
  const gameList = document.querySelector("#game-list");
  const favoriteIconSrc = isFavorite(game.title)
    ? "Images/Favorit fyldt ikon.png"
    : "Images/Favorit tomt ikon.png";

  const gameHTML = `
    <article class="game-card">
        <img src="${game.image}" alt="Poster of ${game.title}" class="game-poster" />
        <img src="${favoriteIconSrc}" alt="Favorit" class="favorite-icon" onclick="toggleFavorite(event, '${game.title}')">
      <div class="game-info">
        <h2>${game.title} <span class="game-rating"><img src="Images/Stjerne ikon.png" alt="Rating" class="rating-icon"> ${game.rating}</span></h2>
        <p class="game-shelf">Hylde ${game.shelf}</p>
        <p class="game-players"><img src="Images/Spillere ikon.png" alt="Players" class="players-icon"> ${game.players.min}-${game.players.max} spillere</p>
        <p class="game-playtime"><img src="Images/Tid ikon.png" alt="Playtime" class="playtime-icon"> ${game.playtime} minutter </p>
        <p class="game-genre"><img src="Images/Kategori ikon.png" alt="Genre" class="genre-icon"> ${game.genre}</p>  
      </div>
    </article>
  `;

  gameList.insertAdjacentHTML("beforeend", gameHTML);

  // Tilføj click event til den nye card
  const newCard = gameList.lastElementChild;
  newCard.addEventListener("click", function () {
    console.log(`🎬 Klik på: "${game.title}"`);
    showGameModal(game);
  });

  // Tilføj keyboard support
  newCard.addEventListener("keydown", function (event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      showGameModal(game);
    }
  });
}
// Husk: game.players er et OBJECT!
// Er der andre properties, du skal tænke over?

// ===== FILTRERING =====

// Dropdownmenu med genre
function populateGenreDropdown() {
  const genreSelect = document.querySelector("#header-genre-select");
  const genres = new Set();

  for (const game of allGames) {
    genres.add(game.genre);
  }

  // Fjern gamle options undtagen 'Alle kategorier'
  genreSelect.innerHTML = '<option value="none">Alle kategorier</option>';

  const sortedGenres = Array.from(genres).sort();
  for (const genre of sortedGenres) {
    genreSelect.insertAdjacentHTML(
      "beforeend",
      `<option value="${genre}">${genre}</option>`
    );
  }
}

// Dropdownmenu med byer
function LocationDropdown() {
  const locationSelect = document.querySelector("#location-select");
  const location = new Set();

  for (const game of allGames) {
    location.add(game.location);
  }

  // Fjern gamle options undtagen 'Alle lokationer'
  locationSelect.innerHTML = '<option value="all">Alle lokationer</option>';

  const sortedLocation = Array.from(location).sort();
  for (const location of sortedLocation) {
    locationSelect.insertAdjacentHTML(
      "beforeend",
      `<option value="${location}">${location}</option>`
    );
  }
}

function filterGames() {
  // Filtrer games baseret på søgning, genre, playtime, ovs. // OBS: game.genre skal sammenlignes med === (ikke .includes())

  // Search variable - header
  const searchValue = document
    .querySelector("#header-search-input")
    .value.toLowerCase();

  // Kategori (genre) variable
  const genreValue = document.querySelector("#header-genre-select").value;

  // Sorterings variable - tjek begge sort dropdowns
  const headerSortValue = document.querySelector("#header-sort-select").value;
  const mainSortValue = document.querySelector("#main-sort-select").value;
  // Brug main sort som primær, fallback til header sort
  const sortValue = mainSortValue !== "all" ? mainSortValue : headerSortValue;

  // Location variable - fra header
  const locationValue = document.querySelector("#location-select").value;

  // Playtime variable - fra header
  const playtimeFromInput = document.querySelector(
    "#header-playtime-from"
  ).value;
  const playtimeToInput = document.querySelector("#header-playtime-to").value;

  const playtimeFrom = Number(playtimeFromInput) || 0;
  // Hvis kun "Fra" er udfyldt, sæt automatisk "Til" til +15 min
  let playtimeTo;
  if (playtimeFromInput && !playtimeToInput) {
    playtimeTo = Number(playtimeFromInput) + 15;
  } else {
    playtimeTo = Number(playtimeToInput) || 9999;
  }

  // Rating variable - fra header
  const ratingFromInput = document.querySelector("#header-rating-from").value;
  const ratingToInput = document.querySelector("#header-rating-to").value;
  const ratingFrom = Number(ratingFromInput) || 0;
  const ratingTo = Number(ratingToInput) || 5;

  // Antal spillere variable - fra header
  const playersFrom =
    Number(document.querySelector("#header-players-from").value) || 0;

  // Sværhedsgrad variable - fra header
  const difficultyValue = document.querySelector(
    "#header-difficulty-select"
  ).value;

  // Min alder variable - fra header
  const ageFrom = Number(document.querySelector("#header-age-from").value) || 0;

  console.log("🔄 Filtrerer games...");

  // Start med alle games
  let filteredGames = allGames;

  // TRIN 1: Filtrer på søgetekst
  if (searchValue) {
    filteredGames = filteredGames.filter((game) => {
      return game.title.toLowerCase().includes(searchValue);
    });
  }

  // TRIN 2: Filter på kategori (genre) (fra dropdown)
  if (genreValue !== "none") {
    filteredGames = filteredGames.filter((game) => {
      return game.genre.includes(genreValue);
    });
  }

  // TRIN 3: Filter på location (fra dropdown)
  if (locationValue !== "all") {
    filteredGames = filteredGames.filter((game) => {
      return game.location === locationValue;
    });
  }

  // TRIN 4: Playtime filter
  if (playtimeFrom > 0 || playtimeTo < 9999) {
    filteredGames = filteredGames.filter((game) => {
      // Antag at game.playtime er i minutter (f.eks. "30-60" eller "45")
      const playtime = parseInt(game.playtime); // Tag første nummer
      return playtime >= playtimeFrom && playtime <= playtimeTo;
    });
  }

  // TRIN 5: Rating filter
  if (ratingFromInput || ratingToInput) {
    filteredGames = filteredGames.filter((game) => {
      return game.rating >= ratingFrom && game.rating <= ratingTo;
    });
  }

  // TRIN 6: Antal spillere filter
  if (playersFrom > 0) {
    filteredGames = filteredGames.filter((game) => {
      // Tjek om den indtastede værdi ligger inden for spillets min-max spænd
      return playersFrom >= game.players.min && playersFrom <= game.players.max;
    });
  }

  // TRIN 7: Sværhedsgrad filter
  if (difficultyValue !== "none") {
    filteredGames = filteredGames.filter((game) => {
      return game.difficulty === difficultyValue;
    });
  }

  // TRIN 8: Min alder filter
  if (ageFrom > 0) {
    filteredGames = filteredGames.filter((game) => {
      return game.age >= ageFrom;
    });
  }

  // TRIN 9: Sortering
  if (sortValue === "title") {
    filteredGames.sort((a, b) => a.title.localeCompare(b.title)); // A-Å
  } else if (sortValue === "title2") {
    filteredGames.sort((a, b) => b.title.localeCompare(a.title)); // Å-A
  } else if (sortValue === "rating") {
    filteredGames.sort((a, b) => b.rating - a.rating);
  }

  console.log(`✅ Viser ${filteredGames.length} games`);
  displayGames(filteredGames);
  updateActiveFiltersDisplay(); // Opdater aktive filtre display
}

// ===== AKTIVE FILTRE FUNKTIONALITET =====
function updateActiveFiltersDisplay() {
  const activeFilters = getActiveFilters();
  const filtersSection = document.querySelector("#active-filters-section");
  const filtersList = document.querySelector("#active-filters-list");

  if (activeFilters.length === 0) {
    filtersSection.style.display = "none";
    return;
  }

  filtersSection.style.display = "block";
  filtersList.innerHTML = "";

  activeFilters.forEach((filter) => {
    const filterTag = createFilterTag(filter);
    filtersList.appendChild(filterTag);
  });
}

function getActiveFilters() {
  const filters = [];

  // Søgning
  const searchValue = document
    .querySelector("#header-search-input")
    .value.trim();
  if (searchValue) {
    filters.push({
      type: "search",
      label: `Søger: "${searchValue}"`,
      value: searchValue,
    });
  }

  // Kategori
  const genreValue = document.querySelector("#header-genre-select").value;
  if (genreValue !== "none") {
    filters.push({
      type: "genre",
      label: `Kategori: ${genreValue}`,
      value: genreValue,
    });
  }

  // Location
  const locationValue = document.querySelector("#location-select").value;
  if (locationValue !== "all") {
    filters.push({
      type: "location",
      label: `Lokation: ${locationValue}`,
      value: locationValue,
    });
  }

  // Sortering
  const headerSortValue = document.querySelector("#header-sort-select").value;
  const mainSortValue = document.querySelector("#main-sort-select").value;
  const activeSortValue =
    mainSortValue !== "all" ? mainSortValue : headerSortValue;

  if (activeSortValue !== "all") {
    const sortLabels = {
      title: "Titel (A-Å)",
      title2: "Titel (Å-A)",
      rating: "Mest populære",
    };
    filters.push({
      type: "sort",
      label: `Sorteret: ${sortLabels[activeSortValue]}`,
      value: activeSortValue,
    });
  }

  // Spilletid
  const playtimeFrom = document.querySelector("#header-playtime-from").value;
  const playtimeTo = document.querySelector("#header-playtime-to").value;
  if (playtimeFrom || playtimeTo) {
    const fromText = playtimeFrom || "0";
    // Hvis kun "Fra" er udfyldt, tilføj automatisk +15 min til "Til"
    let toText;
    if (playtimeFrom && !playtimeTo) {
      toText = (parseInt(playtimeFrom) + 15).toString();
    } else {
      toText = playtimeTo || "∞";
    }
    filters.push({
      type: "playtime",
      label: `Spilletid: ${fromText}-${toText} min`,
      value: { from: playtimeFrom, to: playtimeTo },
    });
  }

  // Rating
  const ratingFrom = document.querySelector("#header-rating-from").value;
  const ratingTo = document.querySelector("#header-rating-to").value;
  if (ratingFrom || ratingTo) {
    const fromText = ratingFrom || "0";
    const toText = ratingTo || "5";
    filters.push({
      type: "rating",
      label: `Rating: ${fromText}-${toText}`,
      value: { from: ratingFrom, to: ratingTo },
    });
  }

  // Antal spillere
  const playersFrom = document.querySelector("#header-players-from").value;
  if (playersFrom) {
    filters.push({
      type: "players",
      label: `Min. spillere: ${playersFrom}`,
      value: playersFrom,
    });
  }

  // Sværhedsgrad
  const difficultyValue = document.querySelector(
    "#header-difficulty-select"
  ).value;
  if (difficultyValue !== "none") {
    filters.push({
      type: "difficulty",
      label: `Sværhedsgrad: ${difficultyValue}`,
      value: difficultyValue,
    });
  }

  // Min. alder
  const ageFrom = document.querySelector("#header-age-from").value;
  if (ageFrom) {
    filters.push({
      type: "age",
      label: `Min. ${ageFrom} år`,
      value: ageFrom,
    });
  }

  return filters;
}

function createFilterTag(filter) {
  const tag = document.createElement("button");
  tag.className = "active-filter-tag";
  tag.innerHTML = `${filter.label} <span class="filter-remove-icon">×</span>`;

  tag.addEventListener("click", () => {
    removeFilter(filter);
  });

  return tag;
}

function removeFilter(filter) {
  switch (filter.type) {
    case "search":
      document.querySelector("#header-search-input").value = "";
      break;
    case "genre":
      document.querySelector("#header-genre-select").value = "none";
      break;
    case "location":
      document.querySelector("#location-select").value = "all";
      break;
    case "sort":
      // Reset både header og main sort
      document.querySelector("#header-sort-select").value = "all";
      document.querySelector("#main-sort-select").value = "all";
      break;
    case "playtime":
      document.querySelector("#header-playtime-from").value = "";
      document.querySelector("#header-playtime-to").value = "";
      break;
    case "rating":
      document.querySelector("#header-rating-from").value = "";
      document.querySelector("#header-rating-to").value = "";
      break;
    case "players":
      document.querySelector("#header-players-from").value = "";
      break;
    case "difficulty":
      document.querySelector("#header-difficulty-select").value = "none";
      break;
    case "age":
      document.querySelector("#header-age-from").value = "";
      break;
  }

  // Opdaterer filter badge efter fjernelse ved filter knapperne
  if (window.updateFilterBadge) {
    window.updateFilterBadge();
  }

  // Kør filter igen for at opdatere listen
  filterGames();
}

// Ryd alle filtre – funktion
function clearAllFilters() {
  console.log("🗑️ Rydder alle filtre");

  // Ryd søgning og dropdown felter - header version
  document.querySelector("#header-search-input").value = "";
  document.querySelector("#header-genre-select").value = "none";
  document.querySelector("#location-select").value = "all";
  document.querySelector("#header-sort-select").value = "all";
  document.querySelector("#header-difficulty-select").value = "none";

  // Ryd main sort dropdown
  document.querySelector("#main-sort-select").value = "all";

  // Ryd de nye range felter - header version
  document.querySelector("#header-playtime-from").value = "";
  document.querySelector("#header-playtime-to").value = "";
  document.querySelector("#header-rating-from").value = "";
  document.querySelector("#header-rating-to").value = "";
  document.querySelector("#header-players-from").value = "";
  document.querySelector("#header-age-from").value = "";

  // Opdater filter badge
  if (window.updateFilterBadge) {
    window.updateFilterBadge();
  }

  // Kør filtrering igen (viser alle spil)
  filterGames();
}

// ===== MODAL =====

// ===== FAVORIT SYSTEM =====

// Håndter favorit klik
function toggleFavorite(event, gameTitle) {
  event.stopPropagation(); // Forhindrer at game card også bliver klikket
  const favoriteIcon = event.target;

  // Hent eksisterende favoritter fra localStorage
  let favorites = getFavorites();

  // Toggle mellem tomt og fyldt hjerte
  if (favoriteIcon.src.includes("Favorit tomt ikon.png")) {
    favoriteIcon.src = "Images/Favorit fyldt ikon.png";
    // Tilføj til favoritter
    if (!favorites.includes(gameTitle)) {
      favorites.push(gameTitle);
      saveFavorites(favorites);
    }
    console.log(`❤️ Tilføjet til favoritter: ${gameTitle}`);
  } else {
    favoriteIcon.src = "Images/Favorit tomt ikon.png";
    // Fjern fra favoritter
    favorites = favorites.filter((title) => title !== gameTitle);
    saveFavorites(favorites);
    console.log(`💔 Fjernet fra favoritter: ${gameTitle}`);
  }

  // Opdater alle ikoner for dette spil (både i grid og dialog)
  updateFavoriteIcons(gameTitle, favorites.includes(gameTitle));
}

// Hent favoritter fra localStorage
function getFavorites() {
  const favorites = localStorage.getItem("gamesFavorites");
  return favorites ? JSON.parse(favorites) : [];
}

// Gem favoritter i localStorage
function saveFavorites(favorites) {
  localStorage.setItem("gamesFavorites", JSON.stringify(favorites));
}

// Opdater alle favorit-ikoner for et specifikt spil
function updateFavoriteIcons(gameTitle, isFavorite) {
  const iconSrc = isFavorite
    ? "Images/Favorit fyldt ikon.png"
    : "Images/Favorit tomt ikon.png";

  // Find alle ikoner for dette spil (både i grid og dialog)
  const allIcons = document.querySelectorAll(`img[onclick*="${gameTitle}"]`);
  allIcons.forEach((icon) => {
    icon.src = iconSrc;
  });
}

// Tjek om et spil er favorit
function isFavorite(gameTitle) {
  const favorites = getFavorites();
  return favorites.includes(gameTitle);
}

// Vis (alle) game detaljer i modal
// Hvilke felter har et game? (Se JSON strukturen)

function showGameModal(game) {
  console.log("🎭 Åbner modal for:", game.title);

  // Byg HTML struktur dynamisk
  const dialogContent = document.querySelector("#dialog-content");
  const favoriteIconSrc = isFavorite(game.title)
    ? "Images/Favorit fyldt ikon.png"
    : "Images/Favorit tomt ikon.png";

  dialogContent.innerHTML = `
   <div class="game-poster-container">
     <img src="${game.image}" alt="Poster of ${game.title}" class="game-poster" />
     <img src="${favoriteIconSrc}" alt="Favorit" class="favorite-icon" onclick="toggleFavorite(event, '${game.title}')">
   </div>
   <div class="dialog-game-info">
      <h1>${game.title} </h1>
      <h2 class="game-description">${game.description}</h2>
      <p class="game-shelf">Hylde ${game.shelf}</p>
      <div class="game-icons-grid">
        <p class="game-genre"><img src="Images/Kategori ikon.png" alt="Genre" class="genre-icon"> ${game.genre}</p> 
        <p class="game-rating"><img src="Images/Stjerne ikon.png" alt="Rating" class="rating-icon"> ${game.rating}</p>
        <p class="game-players"><img src="Images/Spillere ikon.png" alt="Players" class="players-icon"> ${game.players.min}-${game.players.max} spillere</p>
        <p class="game-playtime"><img src="Images/Tid ikon.png" alt="Playtime" class="playtime-icon"> ${game.playtime} minutter </p>
        <p class="game-age"><img src="Images/Alder ikon.png" alt="Age" class="age-icon"> ${game.age}+</p>
        <p class="game-difficulty"><img src="Images/Sværhedsgrad ikon.png" alt="Difficulty" class="difficulty-icon"> ${game.difficulty}</p>
      </div>
      <p class="game-rules">${game.rules}</p>
      </div>
  `;

  // Åbn modalen og forhindre baggrunds scroll
  document.body.classList.add("modal-open");
  document.querySelector("#game-dialog").showModal();

  // Luk modal ved klik på backdrop eller ESC
  const dialog = document.querySelector("#game-dialog");

  dialog.addEventListener("close", () => {
    document.body.classList.remove("modal-open");
  });

  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) {
      dialog.close();
    }
  });
}

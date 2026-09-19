"use strict"; // Aktiverer strict mode - hjælper med at fange fejl

// Start app når DOM er loaded (hele HTML siden er færdig)
document.addEventListener("DOMContentLoaded", initFavoritesApp);

// ===== GLOBALE VARIABLER =====
let allGames = []; 
let favoriteGames = [];

// ===== INITIALISERING =====
function initFavoritesApp() {
  console.log("initFavoritesApp: favorites.js is running 🎉");
  getFavoriteGames();
  
  // Header søgefelt og filtre (samme som main app)
  document.querySelector("#header-search-input").addEventListener("input", filterFavorites);
  document.querySelector("#header-genre-select").addEventListener("change", filterFavorites);
  document.querySelector("#header-sort-select").addEventListener("change", filterFavorites);

  // Playtime felter
  document.querySelector("#header-playtime-from").addEventListener("input", filterFavorites);
  document.querySelector("#header-playtime-to").addEventListener("input", filterFavorites);

  // Rating felter
  document.querySelector("#header-rating-from").addEventListener("input", filterFavorites);
  document.querySelector("#header-rating-to").addEventListener("input", filterFavorites);

  // Spillere felt
  document.querySelector("#header-players-from").addEventListener("input", filterFavorites);

  // Sværhedsgrad felt
  document.querySelector("#header-difficulty-select").addEventListener("change", filterFavorites);

  // Min. Alder felt
  document.querySelector("#header-age-from").addEventListener("input", filterFavorites);

  // Location dropdown
  document.querySelector("#location-select").addEventListener("change", filterFavorites);

  // Clear filters knap
  document.querySelector("#header-clear-filters").addEventListener("click", clearAllFilters);

  // Close dialog button
  document.querySelector("#close-dialog").addEventListener("click", () => {
    document.querySelector("#game-dialog").close();
    document.body.classList.remove('modal-open');
  });

  // Filter panel toggle functionality
  const filterToggle = document.querySelector("#filter-toggle");
  const filterPanel = document.querySelector("#filter-panel");
  const closeFilterPanel = document.querySelector("#close-filter-panel");

  filterToggle.addEventListener("click", () => {
    filterPanel.classList.toggle("open");
  });

  closeFilterPanel.addEventListener("click", () => {
    filterPanel.classList.remove("open");
  });

  // Luk filter panel hvis man klikker udenfor
  document.addEventListener("click", (event) => {
    if (!filterToggle.contains(event.target) && !filterPanel.contains(event.target)) {
      filterPanel.classList.remove("open");
    }
  });
}

// ===== DATA LOADING =====
async function getFavoriteGames() {
  try {
    // Indlæs alle spil først
    console.log("🌐 Henter alle games fra JSON...");
    const response = await fetch("https://raw.githubusercontent.com/cederdorff/race/refs/heads/master/data/games.json"
  );
    allGames = await response.json();
    console.log(`📊 JSON data modtaget: ${allGames.length} games`);

    // HVAD GØR DE NÆSTE PAR LINJER ??
    // Hent favorit titler fra localStorage
    const favoriteTitles = getFavorites();
    console.log(`❤️ Fandt ${favoriteTitles.length} favoritter i localStorage`);
    
    // Filtrer spil til kun favoritter
    favoriteGames = allGames.filter(game => favoriteTitles.includes(game.title));
    console.log(`🎮 Viser ${favoriteGames.length} favorit spil`);
    
    displayFavorites(favoriteGames);
    updateFavoritesCount(favoriteGames.length);
    
  } catch (error) {
    console.error("❌ Fejl ved indlæsning af games:", error);
  }
}



// ===== VISNING =====
function displayFavorites(games) {
  const gameList = document.querySelector("#game-list");
  const noFavorites = document.querySelector("#no-favorites");
  
  if (games.length === 0) {
    gameList.innerHTML = "";
    noFavorites.style.display = "block";
    return;
  }
  
  noFavorites.style.display = "none";
  gameList.innerHTML = "";
  
  console.log(`❤️ Viser ${games.length} favorit games`);
  
  for (const game of games) {
    displayFavoriteGame(game);
  }
}

// Vis ÉT favorit game card
function displayFavoriteGame(game) {
  const gameList = document.querySelector("#game-list");
  
  const gameHTML = `
    <article class="game-card">
        <img src="${game.image}" alt="Poster of ${game.title}" class="game-poster" />
        <img src="Images/Favorit fyldt ikon.png" alt="Favorit" class="favorite-icon" onclick="toggleFavorite(event, '${game.title}')">
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
  
  // Tilføj click event til hele kortet for at åbne modal
  const gameCard = gameList.lastElementChild;
  gameCard.addEventListener("click", () => showGameModal(game));
}

// Opdater antal favoritter i header
function updateFavoritesCount(count) {
  const countElement = document.querySelector("#favorites-count");
  const text = count === 1 ? "Mine Favoritter (1 spil)" : `Mine Favoritter (${count} spil)`;
  countElement.textContent = text;
}

// ===== FAVORIT SYSTEM =====

// Håndter favorit klik (samme som main app men med reload af favoritter)
function toggleFavorite(event, gameTitle) {
  event.stopPropagation(); // Forhindrer at game card også bliver klikket
  const favoriteIcon = event.target;
  
  // Hent eksisterende favoritter fra localStorage
  let favorites = getFavorites();
  
  // Da vi er på favorit-siden, vil alle ikoner være fyldte
  // Så vi fjerner altid fra favoritter
  favoriteIcon.src = "Images/Favorit tomt ikon.png";
  
  // Fjern fra favoritter
  favorites = favorites.filter(title => title !== gameTitle);
  saveFavorites(favorites);
  console.log(`💔 Fjernet fra favoritter: ${gameTitle}`);
  
  // Genindlæs favorit siden for at fjerne spillet
  setTimeout(() => {
    getFavoriteGames();
  }, 100);
}

// Hent favoritter fra localStorage
function getFavorites() {
  const favorites = localStorage.getItem('gamesFavorites');
  return favorites ? JSON.parse(favorites) : [];
}

// Gem favoritter i localStorage  
function saveFavorites(favorites) {
  localStorage.setItem('gamesFavorites', JSON.stringify(favorites));
}

// ===== FILTERING =====
function filterFavorites() {
  const searchTerm = document.querySelector("#header-search-input").value.toLowerCase().trim();
  const selectedGenre = document.querySelector("#header-genre-select").value;
  const selectedLocation = document.querySelector("#location-select").value;
  const selectedDifficulty = document.querySelector("#header-difficulty-select").value;
  const sortBy = document.querySelector("#header-sort-select").value;

  // Hent range værdier
  const playtimeFrom = parseInt(document.querySelector("#header-playtime-from").value) || 0;
  const playtimeTo = parseInt(document.querySelector("#header-playtime-to").value) || Infinity;
  const ratingFrom = parseFloat(document.querySelector("#header-rating-from").value) || 0;
  const ratingTo = parseFloat(document.querySelector("#header-rating-to").value) || 10;
  const playersFrom = parseInt(document.querySelector("#header-players-from").value) || 1;
  const ageFrom = parseInt(document.querySelector("#header-age-from").value) || 0;

  // Filtrer favorit games
  const filteredGames = favoriteGames.filter(game => {
    const matchesSearch = !searchTerm || 
      game.title.toLowerCase().includes(searchTerm) || 
      game.description.toLowerCase().includes(searchTerm) ||
      game.genre.toLowerCase().includes(searchTerm);

    const matchesGenre = !selectedGenre || game.genre === selectedGenre;
    const matchesLocation = !selectedLocation || game.location === selectedLocation;
    const matchesDifficulty = !selectedDifficulty || game.difficulty === selectedDifficulty;
    
    const matchesPlaytime = game.playtime >= playtimeFrom && game.playtime <= playtimeTo;
    const matchesRating = game.rating >= ratingFrom && game.rating <= ratingTo;
    const matchesPlayers = game.players.min <= playersFrom && game.players.max >= playersFrom;
    const matchesAge = game.age >= ageFrom;

    return matchesSearch && matchesGenre && matchesLocation && matchesDifficulty && 
           matchesPlaytime && matchesRating && matchesPlayers && matchesAge;
  });

  // Sortér games
  const sortedGames = sortGames(filteredGames, sortBy);
  
  displayFavorites(sortedGames);
  updateFavoritesCount(sortedGames.length);
  updateFilterBadge();
}

// Sorterings funktion (samme som main app)
function sortGames(games, sortBy) {
  const gamesCopy = [...games];
  
  switch (sortBy) {
    case "title":
      return gamesCopy.sort((a, b) => a.title.localeCompare(b.title));
    case "title-desc":
      return gamesCopy.sort((a, b) => b.title.localeCompare(a.title));
    case "rating":
      return gamesCopy.sort((a, b) => a.rating - b.rating);
    case "rating-desc":
      return gamesCopy.sort((a, b) => b.rating - a.rating);
    case "players-min":
      return gamesCopy.sort((a, b) => a.players.min - b.players.min);
    case "players-max":
      return gamesCopy.sort((a, b) => b.players.max - a.players.max);
    case "playtime":
      return gamesCopy.sort((a, b) => a.playtime - b.playtime);
    case "playtime-desc":
      return gamesCopy.sort((a, b) => b.playtime - a.playtime);
    default:
      return gamesCopy; // Standard rækkefølge
  }
}

// Ryd alle filtre
function clearAllFilters() {
  document.querySelector("#header-search-input").value = "";
  document.querySelector("#header-genre-select").value = "";
  document.querySelector("#header-sort-select").value = "";
  document.querySelector("#location-select").value = "";
  document.querySelector("#header-difficulty-select").value = "";
  document.querySelector("#header-playtime-from").value = "";
  document.querySelector("#header-playtime-to").value = "";
  document.querySelector("#header-rating-from").value = "";
  document.querySelector("#header-rating-to").value = "";
  document.querySelector("#header-players-from").value = "";
  document.querySelector("#header-age-from").value = "";
  
  filterFavorites();
}

// Opdater filter badge
function updateFilterBadge() {
  const badge = document.querySelector("#filter-badge");
  let activeFilters = 0;
  
  if (document.querySelector("#header-search-input").value) activeFilters++;
  if (document.querySelector("#header-genre-select").value) activeFilters++;
  if (document.querySelector("#header-sort-select").value) activeFilters++;
  if (document.querySelector("#location-select").value) activeFilters++;
  if (document.querySelector("#header-difficulty-select").value) activeFilters++;
  if (document.querySelector("#header-playtime-from").value) activeFilters++;
  if (document.querySelector("#header-playtime-to").value) activeFilters++;
  if (document.querySelector("#header-rating-from").value) activeFilters++;
  if (document.querySelector("#header-rating-to").value) activeFilters++;
  if (document.querySelector("#header-players-from").value) activeFilters++;
  if (document.querySelector("#header-age-from").value) activeFilters++;
  
  if (activeFilters > 0) {
    badge.textContent = activeFilters;
    badge.style.display = "flex";
  } else {
    badge.style.display = "none";
  }
}

// ===== MODAL =====
function showGameModal(game) {
  console.log("🎭 Åbner modal for:", game.title);

  const dialogContent = document.querySelector("#dialog-content");
  
  dialogContent.innerHTML = `
   <div class="game-poster-container">
     <img src="${game.image}" alt="Poster of ${game.title}" class="game-poster" />
     <img src="Images/Favorit fyldt ikon.png" alt="Favorit" class="favorite-icon" onclick="toggleFavorite(event, '${game.title}')">
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
  document.body.classList.add('modal-open');
  document.querySelector("#game-dialog").showModal();
  
  // Luk modal ved klik på backdrop eller ESC
  const dialog = document.querySelector("#game-dialog");
  
  dialog.addEventListener('close', () => {
    document.body.classList.remove('modal-open');
  });
  
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) {
      dialog.close();
      document.body.classList.remove('modal-open');
    }
  });
}

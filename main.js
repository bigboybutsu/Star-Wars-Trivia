class Character {
  constructor(
    name,
    gender,
    height,
    mass,
    hairColor,
    skinColor,
    eyeColor,
    films,
    sharedFilms,
    homeworld,
    ships
  ) {
    this.name = name;
    this.gender = gender;
    this.height = Number(height);
    this.mass = Number(mass);
    this.hairColor = hairColor;
    this.skinColor = skinColor;
    this.eyeColor = eyeColor;
    this.films = Number(films);
    this.firstMovie = null;
    // Gör om arrayen till bara film titlarna
    this.sharedFilms = sharedFilms.map((film) => film.title);
    this.homeworld = homeworld;
    this.ships = ships;
  }
  //Hämtar första filmen karaktären var med i
  getFirstMovie = async (params) => {
    let data = await getData(
      "https://swapi.dev/api/people/?" + new URLSearchParams(params)
    );
    // Hämtar alla filmer karaktären varit med i skriver ut dem som objekt i movies
    let promises = await data.results[0].films.map((url) => getData(url));
    let movies = await Promise.all(promises);
    // Sorterar arrayen efter den film som släpptes först
    movies.sort((a, b) => new Date(a.release_date) - new Date(b.release_date));
    movies = `<b>${this.name}</b> first appeared in a movie in <b>${movies[0].release_date}</b>`;
    this.firstMovie = movies;
    return this.firstMovie;
  };

  sharedMovies = (characters) => {
    let fullText;
    // Sorterar en array med båda class Character karaktärerna i.
    // För att komma åt båda så nestar jag båda i varsin for each
    characters.forEach((obj1, one) => {
      characters.forEach((obj2, two) => {
        // Används för att inte jämföra karaktärerna med varandra
        if (one !== two) {
          // Kollar vad character1 och character2 har gemensamt
          // i filmer och lägger till dem till en ny array
          let sharedMovies = obj1.sharedFilms.filter((movie) =>
            obj2.sharedFilms.includes(movie)
          );
          if (sharedMovies.length > 0) {
            let sharedText = sharedMovies.join(", ");
            fullText = `<b>${obj1.name}</b> and <b>${obj2.name}</b> both starred in: <b>${sharedText}</b>`;
          } else {
            fullText = `<b>${obj1.name}</b> and <b>${obj2.name}</b> have not starred in a movie together`;
          }
        }
      });
    });
    return fullText;
  };
  //Jömför .homeworld med varandra
  homePlanetFunc = (character1, character2) => {
    if (character1.homeworld === character2.homeworld) {
      return `Both <b>${character1.name}</b> and <b>${character2.name}</b> were born on <b>${character1.homeworld}</b>`;
    } else {
      return `<b>${this.name}</b> was born on <b>${this.homeworld}</b>`;
    }
  };
  //Hämtar ships data och jämför med varandra
  expensiveShips = async () => {
    let fullText;
    let shipPromises = this.ships;
    let promises = await shipPromises.map((url) => getData(url));
    let ships = await Promise.all(promises);
    let sortedShips = [];
    if (ships.length === 0) {
      fullText = `<b>${this.name}</b> has no ships/vehicles`;
    } else {
      ships.forEach((ship) => {
        let cost = Number(ship.cost_in_credits);
        // Vissa ships har unknown som pris så dem blir NaN när dem konverteras till nummer
        // Så !isNaN kollar om det inte är ett NaN så lägger det till den i en ny array
        if (!isNaN(cost)) {
          sortedShips.push({
            name: ship.name,
            cost_in_credits: cost,
          });
        }
      });
      sortedShips.sort(
        (a, b) => Number(b.cost_in_credits) - Number(a.cost_in_credits)
      );
      fullText = `<b>${this.name}'s</b> most expensive ship/vehicle is the <b>${sortedShips[0].name}</b> at the price of <b>${sortedShips[0].cost_in_credits}</b> credits`;
    }
    return (this.ships = fullText);
  };
}

const characterDiv = document.querySelector("#characterContainer");
const button = document.querySelector("#selectPerson");

// Används för att kolla om man klickat på compare characters mer än en gång
// Då så kommer den köra compareCharacters() när du klickar på select characters
let selectButtonUsed = false;

button.addEventListener("click", async () => {
  await getPeople();
  if (selectButtonUsed) {
    compareCharacters();
  }
});

// Hämtar data
async function getData(url) {
  let data = await fetch(url);
  let json = await data.json();
  return json;
}

// Hämtar all information om de två karaktärerna och exekverar några class Character metoder
// för framtida syfte
async function getPeople() {
  characters = [];
  let person1Value = document.querySelector(
    "select[name='peopleSelector1']"
  ).value;
  let person2Value = document.querySelector(
    "select[name='peopleSelector2']"
  ).value;
  let params1 = { search: person1Value };
  let params2 = { search: person2Value };

  let character1 = await getCharacter(params1);
  let character2 = await getCharacter(params2);
  await character1.getFirstMovie(params1);
  await character2.getFirstMovie(params2);
  await character1.expensiveShips();
  await character2.expensiveShips();

  characters.push(character1, character2);
  printToPage();
}

// Används för att få all data till jämförelserna för höjd osv och meddellande fönsterna
async function getCharacter(params) {
  let { results } = await getData(
    "https://swapi.dev/api/people/?" + new URLSearchParams(params)
  );
  let {
    name,
    gender,
    height,
    mass,
    hair_color,
    skin_color,
    eye_color,
    films,
    homeworld,
    starships,
    vehicles,
  } = results[0];
  // Hämtar all data från filmerna för att jämföra vilka filmer dem båda varit med i i sharedMovies() funktionen
  let filmData = await Promise.all(films.map((url) => getData(url)));
  // Hämtar data till att kolla vilket skepp som är dyrast
  let homeworldData = await getData(homeworld);
  let ships = [...starships, ...vehicles];
  return new Character(
    name,
    gender,
    height,
    mass,
    hair_color,
    skin_color,
    eye_color,
    films.length,
    filmData,
    homeworldData.name,
    ships
  );
}
// Sparar båda karaktärerna globalt så jag kan komma åt dem i andra funktioner
let characters = [];

//Printar ut karaktärerna i DOMen
function printToPage() {
  characterDiv.innerHTML = "";
  let wholeDiv = document.createElement("div");
  wholeDiv.classList.add("wholeDiv");

  characters.forEach((character) => {
    let personDiv = document.createElement("div");
    personDiv.classList.add("personDiv");
    let img = new Image(250, 250);
    img.classList.add("img");
    img.src = `../img/${character.name}.webp`;
    let h2 = document.createElement("h2");
    h2.innerText = character.name;
    personDiv.append(img, h2);
    wholeDiv.append(personDiv);
  });
  // Skapar compare knappen
  let div = document.createElement("div");
  div.classList.add("compareDiv");
  let button = document.createElement("button");
  button.innerText = "Compare characters";
  button.setAttribute("id", `submitCharacter`);
  button.addEventListener("click", () => {
    compareCharacters();
    selectButtonUsed = true;
  });

  // Lägger in compare diven imellan båda karaktär divarna
  div.append(button);
  characterDiv.append(wholeDiv);
  let personDivs = document.querySelectorAll(".personDiv");
  wholeDiv.insertBefore(div, personDivs[1]);
}

function createButton(text, eventListener) {
  let button = document.createElement("button");
  button.innerText = text;
  button.addEventListener("click", eventListener);
  return button;
}

function createMesgBtns(div, character, changeText) {
  let buttonDiv = document.createElement("div");
  buttonDiv.classList.add("moreInfoBtnContainer");

  let movieBtn = createButton("First movie showing", () => {
    changeText.innerHTML = character.firstMovie;
  });
  let sharedMoviesBtn = createButton("Shared movies", () => {
    changeText.innerHTML = character.sharedMovies(characters);
  });
  let homeplanet = createButton("Homeplanet", () => {
    changeText.innerHTML = character.homePlanetFunc(character1, character2);
  });
  let vehicleBtn = createButton("Most expensive vehicle", () => {
    changeText.innerHTML = character.ships;
  });

  buttonDiv.append(movieBtn, sharedMoviesBtn, homeplanet, vehicleBtn);
  div.append(buttonDiv);
}

// Används i compareStats
let character1;
let character2;
// Jämför stats
function compareCharacters() {
  let moreInfoContainer = document.createElement("div");
  moreInfoContainer.classList.add("moreInfoContainer");
  let personDiv = document.querySelectorAll(".personDiv");
  let compareDiv = document.querySelector(".compareDiv");
  let p = document.createElement("p");
  p.innerHTML = "";

  let uls = document.querySelectorAll(".ul_tag");
  uls.forEach((ul) => ul.remove());
  let moreInfoDivs = document.querySelectorAll(".moreInfoContainer");
  moreInfoDivs.forEach((div) => div.remove());
  // Sparar båda karaktärerna i character1/2 för att användas i andra funktioner. Inte smart gjort men det blev så
  let compareStats = characters.map((obj) => obj);
  character1 = compareStats[0];
  character2 = compareStats[1];
  compareDiv.append(p);
  characterDiv.append(moreInfoContainer);
  // Lägger till = > < osv i compareDiven
  updateCompareText(compareDiv, character1, character2);

  // lägger till alla stats
  characters.forEach((obj, i) => {
    let moreInfoDiv = document.createElement("div");
    moreInfoDiv.classList.add("moreInfoDiv");
    let ul = document.createElement("ul");
    ul.classList.add("ul_tag");

    let p = document.createElement("p");
    p.classList.add("p_fact");
    p.innerText = "Click a button to show a fun fact!";

    let labels = [
      { label: "Height:", value: obj.height + " cm" },
      { label: "Mass:", value: obj.mass + " kg" },
      { label: "Gender:", value: obj.gender },
      { label: "Skin color:", value: obj.skinColor },
      { label: "Eye color:", value: obj.eyeColor },
      { label: "Hair color:", value: obj.hairColor },
      { label: "Films:", value: obj.films },
    ];

    labels.forEach((label) => {
      let li = document.createElement("li");
      li.innerHTML = `<b>${label.label}</b> ${label.value}`;
      li.setAttribute(
        "id",
        `${obj.name}_${label.label
          .toLowerCase()
          .replace(":", "")
          .replace(" ", "")
          .replace("c", "C")}`
      );
      ul.appendChild(li);
    });
    // Lägger rätt stat i rätt div
    if (personDiv[i]) {
      personDiv[i].appendChild(ul);
      moreInfoContainer.append(moreInfoDiv);
      moreInfoDiv.append(p);
      characterDiv.append(moreInfoContainer);
    }
    // Gör meddellande fönsterna under allt
    createMesgBtns(moreInfoDiv, obj, p);
  });
  // Lägger till färger för jämföring
  compareArr(arr);
}
// Ändrar färg i domen
function updateColor(id, color) {
  let element = document.getElementById(id);
  if (element) {
    element.style.color = color;
  }
}
// type är arr. Alltså det this.etc i Character klassen
// char1/2 är karaktärerna
// charID1/2 är ID som dem har i domen, dem används för att ändra rätt li.
function compare(type, char1, char2, charID1, charID2) {
  if (typeof char1[type] === "number" && typeof char2[type] === "number") {
    if (char1[type] === char2[type]) {
      updateColor(charID1, "blue");
      updateColor(charID2, "blue");
    } else if (char1[type] > char2[type]) {
      updateColor(charID1, "green");
      updateColor(charID2, "red");
    } else if (char1[type] < char2[type]) {
      updateColor(charID1, "red");
      updateColor(charID2, "green");
    }
  } else if (
    typeof char1[type] === "string" &&
    typeof char2[type] === "string"
  ) {
    if (char1[type] !== char2[type]) {
      updateColor(charID1, "orange");
      updateColor(charID2, "orange");
    } else {
      updateColor(charID1, "blue");
      updateColor(charID2, "blue");
    }
  }
}

let arr = [
  "gender",
  "hairColor",
  "skinColor",
  "eyeColor",
  "height",
  "mass",
  "films",
];
function compareArr(arr) {
  arr.forEach((obj) => {
    console.log(obj);
    compare(
      obj,
      character1,
      character2,
      `${character1.name}_${obj}`,
      `${character2.name}_${obj}`
    );
  });
}

// Lägger till = > < osv
function updateCompareText(compareDiv, character1, character2) {
  // För värden som är nummer
  const compareValues = (value1, value2) =>
    value1 === value2 ? "=" : value1 > value2 ? ">" : "<";
  // För värden som är text
  const compareNonValues = (value1, value2) => (value1 === value2 ? "=" : "!=");
  let p = compareDiv.querySelector("p");

  p.innerHTML = "";
  p.innerHTML = `
    ${compareValues(character1.height, character2.height)}<br>
    ${compareValues(character1.mass, character2.mass)}<br>
    ${compareNonValues(character1.gender, character2.gender)}<br>
    ${compareNonValues(character1.skinColor, character2.skinColor)}<br>
    ${compareNonValues(character1.eyeColor, character2.eyeColor)}<br>
    ${compareNonValues(character1.hairColor, character2.hairColor)}<br>
    ${compareValues(character1.films, character2.films)}<br>`;
}

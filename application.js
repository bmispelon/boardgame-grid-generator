const TRIPLETS = [
  "VVV",
  "VV.",
  "V.V",
  ".VV",
  "VX.",
  "V..",
  "X.V",
  "X..",
  "XXX",
  ".VX",
  ".V.",
  ".X.",
  "..X",
  "..V",
  "...",
];
const CANONICAL = [
  Array(3).fill(TRIPLETS[0]),
  Array(2).fill(TRIPLETS[1]),
  Array(2).fill(TRIPLETS[2]),
  Array(2).fill(TRIPLETS[3]),
  Array(1).fill(TRIPLETS[4]),
  Array(1).fill(TRIPLETS[5]),
  Array(1).fill(TRIPLETS[6]),
  Array(1).fill(TRIPLETS[7]),
  Array(1).fill(TRIPLETS[8]),
  Array(1).fill(TRIPLETS[9]),
  Array(1).fill(TRIPLETS[10]),
  Array(1).fill(TRIPLETS[11]),
  Array(1).fill(TRIPLETS[12]),
  Array(1).fill(TRIPLETS[13]),
  Array(6).fill(TRIPLETS[14]),
].flat();

/**
 * @return {array} A random permutation
 */
function randomPermutation() {
  const permutation = CANONICAL.slice(); // shallow copy
  shuffle(permutation);
  return permutation;
}

/**
 * @param {array} permutation
 * @return {string} The "binary string" corresponding to the given permutation
 */
function permutationToBinaryString(permutation) {
  const evenIndices = Array(Math.floor(permutation.length / 2))
    .fill()
    .map((_, i) => 2 * i);
  const permutationAsTripletIndices = permutation.map((triplet) =>
    TRIPLETS.indexOf(triplet)
  );
  return evenIndices
    .map((i) =>
      String.fromCharCode(
        16 * permutationAsTripletIndices[i] + permutationAsTripletIndices[i + 1]
      )
    )
    .join("");
}

/**
 * @param {array} permutation
 * @return {string} The base64 representation of the permutation
 */
function permutationToBase64(permutation) {
  const binStr = permutationToBinaryString(permutation);
  return btoa(binStr);
}

/**
 * @param {string} b64Str
 * @return {string} The permutation corresponding to the given encoded base64 string
 */
function base64ToPermutation(b64Str) {
  const binStr = atob(b64Str);
  const indices = Array.from(binStr)
    .map((char) => char.charCodeAt(0))
    .map((n) => [Math.floor(n / 16), n % 16])
    .flat();
  const permutation = indices.map((idx) => TRIPLETS[idx]);
  const missingTriplets = CANONICAL.slice();
  permutation.forEach((triplet) =>
    missingTriplets.splice(missingTriplets.indexOf(triplet), 1)
  );
  missingTriplets.forEach((triplet) => permutation.push(triplet));
  return permutation;
}

/**
 * @param {array} permutation
 * @param {number} index A player index (1-3)
 * @return {string} A `<div class="grid">` node corresponding to the given permutation and player index
 */
function permutationToGridNode(permutation, index) {
  const grid = document.createElement("div");
  grid.id = "player" + (index + 1);
  grid.classList.add("grid");
  permutation.forEach(function (triplet) {
    const card = document.createElement("div");
    card.classList.add("card");
    card.classList.add(
      { V: "green", X: "black", ".": "white" }[triplet[index]]
    );
    grid.appendChild(card);
  });
  return grid;
}

/**
 * Shuffle the given array in-place.
 * (code adapted from https://stackoverflow.com/a/2450976)
 * @param {array} array
 */
function shuffle(array) {
  let currentIndex = array.length;
  let randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex !== 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }
}

/**
 * @return {?array} The permutation encoded in the URL parameters or NULL
 */
function getPermutationFromURL() {
  const params = new URLSearchParams(window.location.search);
  if (params.has("g")) {
    return base64ToPermutation(params.get("g"));
  } else {
    return null;
  }
}

/**
 * @param {array} permutation
 * Change the page's URL (using pushState) to add the permutation's encoded representation
 */
function pushPermutationToHistory(permutation) {
  const encoded = permutationToBase64(permutation);
  const url = new URL(window.location);

  if (url.searchParams.get("g") === encoded) {
    return;
  }

  url.searchParams.set("g", encoded);
  window.history.pushState({ permutation64: encoded }, "", url.toString());
  if (url.hash !== "") {
    window.location.hash = url.hash;
    updateNav();
  }
}

/**
 * Update classes in the page <nav> and for the grid container (.empty)
 */
function updateNav() {
  console.debug("updateNav", window.location.hash);
  document.querySelectorAll("nav a").forEach(function (a) {
    a.classList.remove("active");
    if (a.hash === window.location.hash) {
      a.classList.add("active");
    }
  });
  if (Array.from(document.querySelectorAll("nav a.active")).length === 0) {
    document.querySelector(".grid-container").classList.add("empty");
  } else {
    document.querySelector(".grid-container").classList.remove("empty");
  }
}

/**
 * Inject the #onpageload template into the page
 */
function replaceLoadingMessageWithTemplateContent() {
  const tpl = document.getElementById("onpageload");
  Array.from(tpl.content.children).forEach(function (tplNode) {
    tpl.parentNode.insertBefore(tplNode.cloneNode(true), tpl);
    //        document.body.appendChild(tplNode.cloneNode(true))
  });
  document.body.removeChild(document.querySelector(".loading"));
}

/**
 * Inject the grids corresponding to the given permutation into the DOM
 * @param {array} permutation
 */
function initGrid(permutation) {
  const gridContainer = document.querySelector(".grid-container");
  console.debug("initGrid", gridContainer);

  gridContainer.classList.add("spoiler");
  Array.from(gridContainer.children).forEach(function (child) {
    gridContainer.removeChild(child);
  });
  Array.from(permutation[0]).forEach(function (_, i) {
    gridContainer.appendChild(permutationToGridNode(permutation, i));
  });
  pushPermutationToHistory(permutation);
}

/**
 * Rotate (with CSS) the given node by the given angle.
 * @param {node} node
 * @param {?angle} angle An angle (in degrees). NULL resets the rotation.
 */
function cssRotate(node, angle) {
  const match = node.style.transform.match(/^rotate\((-?\d+)deg\)/);
  const currentAngle = match === null ? 0 : parseInt(match[1], 10);
  const newAngle = angle === null ? 0 : currentAngle + angle;
  node.style.transform = "rotate(" + newAngle + "deg)";
  if (Math.abs(newAngle) >= 3 * 360) {
    node.classList.add("easteregg");
  }
}

/**
 * Attach a bunch of events to various elements of the page.
 */
function initEvents() {
  const gridContainer = document.querySelector(".grid-container");

  gridContainer.addEventListener("click", function () {
    gridContainer.classList.toggle("spoiler");
  });

  document.querySelectorAll('button[name="rotate"]').forEach(function (btn) {
    btn.addEventListener("click", function () {
      cssRotate(gridContainer, parseInt(btn.value, 10));
    });
  });

  document.querySelectorAll("nav a").forEach(function (a) {
    a.addEventListener("click", function (event) {
      if (a.hash === window.location.hash) {
        window.location.hash = "";
        event.preventDefault();
      } else {
        gridContainer.classList.add("spoiler");
      }
      cssRotate(gridContainer, null); // reset rotation
      window.setTimeout(updateNav, 10);
    });
  });

  document.querySelectorAll('button[name="random"]').forEach(function (btn) {
    btn.addEventListener("click", function () {
      initGrid(randomPermutation());
    });
  });
}

document.addEventListener("DOMContentLoaded", (event) => {
  replaceLoadingMessageWithTemplateContent();
  initGrid(getPermutationFromURL() || randomPermutation());
  initEvents();
  updateNav();
});

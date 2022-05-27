const TRIPLETS = [
    'VVV',
    'VV.',
    'V.V',
    '.VV',
    'VX.',
    'V..',
    'X.V',
    'X..',
    'XXX',
    '.VX',
    '.V.',
    '.X.',
    '..X',
    '..V',
    '...'
]
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
    Array(6).fill(TRIPLETS[14])
].flat()


function randomPermutation() {
    const permutation = CANONICAL.slice()  // shallow copy
    shuffle(permutation)
    return permutation
}

function permutationToBinaryString(permutation) {
    const even_indices = Array(Math.floor(permutation.length / 2)).fill().map((_, i) => 2*i)
    const permutationAsTripletIndices = permutation.map(triplet => TRIPLETS.indexOf(triplet))
    return even_indices.map(i => String.fromCharCode(16*permutationAsTripletIndices[i] + permutationAsTripletIndices[i+1])).join('')
}

function permutationToBase64(permutation) {
    const binStr = permutationToBinaryString(permutation)
    return btoa(binStr)
}

function base64ToPermutation(b64Str) {
    const binStr = atob(b64Str)
    const indices = Array.from(binStr).map(char => char.charCodeAt(0)).map(n => [Math.floor(n / 16), n % 16]).flat()
    const permutation = indices.map(idx => TRIPLETS[idx])
    const missingTriplets = CANONICAL.slice()
    permutation.forEach(triplet => missingTriplets.splice(missingTriplets.indexOf(triplet), 1))
    missingTriplets.forEach(triplet => permutation.push(triplet))
    return permutation
}

function permutationToGridStrings (permutation, index) {
    const tileChars = {
        'V': '\uD83D\uDFE9',  // green
        '.': '\u2B1C',  // white
        'X': '\u2B1B'  // black
    }

    return permutation.map(triplet => tileChars[triplet[index]]).join('').replace(/(.{5})(?!$)/gu, '$1\n')
}

function permutationToGridNode (permutation, index) {
    const grid = document.createElement('div')
    grid.id = 'player' + (index + 1)
    grid.classList.add('grid')
    permutation.forEach(function (triplet) {
        const card = document.createElement('div')
        card.classList.add('card')
        card.classList.add({'V': 'green', 'X': 'black', '.': 'white'}[triplet[index]])
        grid.appendChild(card)
    })
    return grid
}


// Shuffle the given array in-place (from https://stackoverflow.com/a/2450976)
function shuffle(array) {
  let currentIndex = array.length, randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex !== 0) {

    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }

  return array;
}


function getPermutationFromURL () {
    const params = new URLSearchParams(window.location.search);
    if (params.has('g')) {
        return base64ToPermutation(params.get('g'))
    } else {
        return null
    }
}


function pushPermutationToHistory (permutation) {
    const encoded = permutationToBase64(permutation)
    const params = new URLSearchParams(window.location.search)
    const url = new URL(window.location)

    if (url.searchParams.get('g') === encoded){ return }

    url.searchParams.set('g', encoded)
    window.history.pushState({'permutation64': encoded}, "", url.toString())
    if (url.hash !== '') {
        window.location.hash = url.hash
        updateNav()
    }
}


function updateNav () {
    console.debug('updateNav', window.location.hash)
    document.querySelectorAll('nav a').forEach(function (a) {
        a.classList.remove('active')
        if (a.hash === window.location.hash){a.classList.add('active')}
    })
    if (Array.from(document.querySelectorAll('nav a.active')).length === 0) {
        document.querySelector('.grid-container').classList.add('empty')
    } else {
        document.querySelector('.grid-container').classList.remove('empty')
    }
}


function replaceLoadingMessageWithTemplateContent () {
    const tpl = document.getElementById('onpageload')
    Array.from(tpl.content.children).forEach(function (tplNode) {
        tpl.parentNode.insertBefore(tplNode.cloneNode(true), tpl)
//        document.body.appendChild(tplNode.cloneNode(true))
    })
    document.body.removeChild(document.querySelector('.loading'))
}


function initGrid (permutation) {
    const gridContainer = document.querySelector('.grid-container')
    console.debug('initGrid', gridContainer)

    gridContainer.classList.add('spoiler')
    Array.from(gridContainer.children).forEach(function (child) {gridContainer.removeChild(child)})
    Array.from(permutation[0]).forEach(function (_, i) {
        gridContainer.appendChild(permutationToGridNode(permutation, i))
    })
    pushPermutationToHistory(permutation)
}


function cssRotate (node, angle) {
    const match = node.style.transform.match(/^rotate\((-?\d+)deg\)/)
    const currentAngle = (match === null)?0:parseInt(match[1], 10)
    const newAngle = (angle===null)?0:currentAngle + angle
    node.style.transform = 'rotate(' + newAngle + 'deg)'
}


function initEvents () {
    const gridContainer = document.querySelector('.grid-container')

    gridContainer.addEventListener('click', function () {
        gridContainer.classList.toggle('spoiler')
    })

    document.querySelectorAll('button[name="rotate"]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            cssRotate(gridContainer, parseInt(btn.value, 10))
        })
    })

    document.querySelectorAll('nav a').forEach(function (a) {
        a.addEventListener('click', function (event) {
            if (a.hash === window.location.hash) {
                window.location.hash = ''
                event.preventDefault()
            } else {
                gridContainer.classList.add('spoiler')
            }
            cssRotate(gridContainer, null)  // reset rotation
            window.setTimeout(updateNav, 10)
        })
    })

    document.querySelectorAll('button[name="random"]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            initGrid(randomPermutation())
        })
    })
}

document.addEventListener('DOMContentLoaded', (event) => {
    replaceLoadingMessageWithTemplateContent()
    initGrid(getPermutationFromURL() || randomPermutation())
    initEvents()
    updateNav()
});

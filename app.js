"use strict";

const DATAMUSE_API_URL = "https://api.datamuse.com/words";
const WORDS_PER_REQUEST = 200;
const RELATED_WORDS_PER_DISPLAY = 9;

const $gameContent = $("#game-content");
const $startWord = $("#start-word");
const $endWord = $("#end-word");
const $guessTable = $("#guess-options");
const $guessedWords = $("#guessed-words");
const $startButton = $("#start-button");
const $resetButton = $("#reset-button");

let startWord = null;
let endWord = null;

let lastGuessedWord = null;
let allGuessedWords = [];

/**
 * 
 * @param {*} event 
 */
async function startGame(event) {
    event.preventDefault();

    await generateStartWords();
    await getRelatedWordsPopulateGuessesTable();

    $gameContent.toggleClass("d-none");
    $startButton.toggleClass("d-none");
    $resetButton.toggleClass("d-none");
}

$startButton.on("click", startGame);

/**
 * 
 * @param {*} event 
 */
async function resetGame(event) {
    event.preventDefault();

    $gameContent.toggleClass("d-none");
    $resetButton.toggleClass("d-none");
    
    await generateStartWords();
    await getRelatedWordsPopulateGuessesTable();
    
    $guessedWords.empty();
    $endWord.toggleClass("bg-dark").toggleClass("bg-success");
    $resetButton.toggleClass("btn-light").toggleClass("btn-secondary");

    $resetButton.toggleClass("d-none");
    $gameContent.toggleClass("d-none");
}

$resetButton.on("click", resetGame);

/**
 * 
 */
async function generateStartWords() {
    startWord = getRandomWord();
    endWord = getRandomWord();

    allGuessedWords.push(startWord, endWord);

    lastGuessedWord = startWord;

    $startWord.text(startWord.toUpperCase());
    $endWord.text(endWord.toUpperCase());
}

/**
 * 
 * @returns 
 */
function getRandomWord() {
    const index = randomInt(0, wordsList.length - 1);
    const word = wordsList.splice(index, 1)[0];

    return word.toUpperCase();
}

/**
 * 
 * @param {*} word 
 * @returns 
 */
async function getRelatedWords(word) {
    const relatedWords = [];
    const response = await axios({
        method: "get",
        url: DATAMUSE_API_URL,
        params: {
           ml: word,
           topics: endWord,
           max: WORDS_PER_REQUEST
        }
    })

    if (response.data.some(word => word.word.toUpperCase() === endWord)) {
        relatedWords.push(endWord);
    }

    let i = 0;
    while (relatedWords.length < RELATED_WORDS_PER_DISPLAY && i < response.data.length) {
        let wordObj = response.data[i];
        
        // some of the responses seems to be undefined... this just makes sure
        // we don't try to process those
        if (wordObj) {
            let inWordList = wordsList.includes(wordObj.word);
            let isNewWord = !allGuessedWords.includes(wordObj.word.toUpperCase());
    
            if (inWordList && isNewWord) {
                relatedWords.push(wordObj.word);
            }
        }

        i++;
    }

    return relatedWords;
}

/**
 * 
 * @param {*} words 
 */
function populateGuessesTable(words) {
    $guessTable.empty();
    /*
    // will populate table in order of results, i.e. more relevant ones on top
    for (let word of words) {
        let $word = $(`<tr><td><b>${word.toUpperCase()}</b></td></tr>`);
        $guessTable.append($word);
    }
    */

    // will populate table randomly, to make it harder!
    let i = words.length;
    while (i > 0) {
        let randomIndex = randomInt(0, i - 1);
        let randomWord = words.splice(randomIndex, 1)[0].toUpperCase();
        let $word = $(`<tr><td><b>${randomWord}</b></td></tr>`);

        console.log("current guess word: ", randomWord, "; end word: ", endWord);
        
        if (randomWord === endWord) {
            $word.addClass("text-success");
        }

        $guessTable.append($word);

        i--;
    }
}

/**
 * 
 */
async function getRelatedWordsPopulateGuessesTable() {
    let relatedWords = await getRelatedWords(lastGuessedWord);
    populateGuessesTable(relatedWords);
}

/**
 * 
 * @param {*} event 
 */
async function handleWordClick(event) {
    lastGuessedWord = $(event.target).text();
    allGuessedWords.push(lastGuessedWord);
    let $guessedWord = $(`<h3>${lastGuessedWord}</h3>`);
    $guessedWords.append($guessedWord);
    if (!checkForWinningWord()) {
        await getRelatedWordsPopulateGuessesTable();
    } else {
        $guessTable.empty();
        $endWord.toggleClass("bg-dark").toggleClass("bg-success");
        $resetButton.toggleClass("btn-light").toggleClass("btn-secondary");
    }
}

/**
 * 
 * @returns 
 */
function checkForWinningWord() {
    if (lastGuessedWord === endWord) {
        return true;
    }

    return false;
}

$guessTable.on("click", "td", handleWordClick);


/**
 * generates a random integer, inclusive of the bounds provided
 * @param {integer} low - low bound
 * @param {integer} high - high bound
 * @returns random integer
 */
 function randomInt(low, high) {
    if (typeof low !== "number" || typeof high !== "number") {
        throw new Error("Invalid data type - both arguments must be numbers")
    }
    if (parseInt(low) !== low || parseInt(high) !== high) {
        throw new Error("One or more non-integers provided - unpredictable results!")
    }
    return Math.floor(Math.random() * (high - low + 1)) + low;
}
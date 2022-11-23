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
 * callback for "start" button; gets words and sets up the initial screen
 * @param {event} event 
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
 * callback for "reset" button; clears current game and sets up as if on refresh
 * @param {*} event 
 */
async function resetGame(event) {
    event.preventDefault();

    $gameContent.toggleClass("d-none");
    $resetButton.toggleClass("d-none");
    
    await generateStartWords();
    await getRelatedWordsPopulateGuessesTable();
    
    $guessedWords.empty();
    $endWord.addClass("bg-dark").removeClass("bg-success");
    $resetButton.addClass("btn-light").removeClass("btn-secondary");

    $resetButton.toggleClass("d-none");
    $gameContent.toggleClass("d-none");
}

$resetButton.on("click", resetGame);

/**
 * picks first two words, primes the recommend word variable, and adds them 
 * to the DOM
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
 * picks a random word from the word list in words.js, returns it
 * @returns - random word from 
 */
function getRandomWord() {
    // right now, splices out words, so VERY slowly makes the list shorter and 
    // shorter; fine for now, may want to revisit for future functionality
    const index = randomInt(0, wordsList.length - 1);
    const word = wordsList.splice(index, 1)[0];

    return word.toUpperCase();
}

/**
 * AJAX call to datamuse API for a set of words related to the last guessed
 * word
 * @param {string} word - seed word from which to generate related words 
 * @returns array of word objects
 */
async function fetchRelatedWords(word) {
    const response = await axios({
        method: "get",
        url: DATAMUSE_API_URL,
        params: {
           ml: word, // ml = "meaning like", i.e. match new words to meaning
           topics: endWord, // pushes results towards the game's end word
           max: WORDS_PER_REQUEST
        }
    })

    return response.data;
}

/**
 * finds the RELATED_WORDS_PER_DISPLAY number of words from the top of the 
 * generated related word list that also appear in the wordsList array in 
 * words.js; also removes duplicates with already guessed words
 * @param {array} words - array of word objects, each with a ".word" property
 * @returns array of selected related words from top of API response (which are
 * more likely to be more relevant to the seed word)
 */
async function generateRelatedWordsList(words) {
    const relatedWords = [];
    
    if (words.some(word => word.word.toUpperCase() === endWord)) {
        relatedWords.push(endWord);
    }
    
    let i = 0;

    // second parameter needed incase we don't find enough words before reaching
    // the end of the options; will just return less numbers, no biggie 
    while (relatedWords.length < RELATED_WORDS_PER_DISPLAY && i < words.length) {
        // some of the responses seems to be undefined... this just makes sure
        // we don't try to process those
        if (words[i]) {
            let inWordList = wordsList.includes(words[i].word);
            let isNewWord = !allGuessedWords.includes(words[i].word.toUpperCase());
    
            if (inWordList && isNewWord) {
                relatedWords.push(words[i].word);
            }
        }
    
        i++;
    }
    
    return relatedWords;
}

/**
 * populates the DOM table $guessTable with the selected related words
 * @param {array} words - array of words to populate 
 */
function populateGuessesTable(words) {
    $guessTable.empty();

    // will populate table randomly, to make it harder!
    let i = words.length;
    while (i > 0) {
        let randomIndex = randomInt(0, i - 1);
        let randomWord = words.splice(randomIndex, 1)[0].toUpperCase();
        let $word = $(`<tr><td><b>${randomWord}</b></td></tr>`);
        
        if (randomWord === endWord) {
            $word.addClass("text-success");
        }

        $guessTable.append($word);

        i--;
    }
}

/**
 * controller function to get a bunch of related words, filter them down to the
 * selected words, and then populate the table in the DOM
 */
async function getRelatedWordsPopulateGuessesTable() {
    let allWords = await fetchRelatedWords(lastGuessedWord);
    let relatedWords = await generateRelatedWordsList(allWords);
    populateGuessesTable(relatedWords);
}

/**
 * callback for click listener on words in the guess table; if clicked word is
 * the end word, triggers end game conditions; if not, stores that word and 
 * regenerates the table
 * @param {*} event 
 */
async function handleWordClick(event) {
    lastGuessedWord = $(event.target).text();
    allGuessedWords.push(lastGuessedWord);
    let $guessedWord = $(`<h3>${lastGuessedWord}</h3>`);
    $guessedWords.append($guessedWord);
    if (lastGuessedWord !== endWord) {
        await getRelatedWordsPopulateGuessesTable();
    } else {
        $guessTable.empty();
        $endWord.toggleClass("bg-dark").toggleClass("bg-success");
        $resetButton.toggleClass("btn-light").toggleClass("btn-secondary");
    }
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
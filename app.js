"use strict";

const DATAMUSE_API_URL = "https://api.datamuse.com/words";
const WORDS_PER_REQUEST = 200;
const RELATED_WORDS_PER_DISPLAY = 10;

const $guessTable = $("#guess-options");
const $guessedWords = $("#guessed-words");

let startWord = null;
let endWord = null;

let lastGuessedWord = null;
let allGuessedWords = [];

function getRandomWord() {
    const index = randomInt(0, wordsList.length - 1);
    const word = wordsList.splice(index, 1)[0];

    return word.toUpperCase();
}

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
    while (relatedWords.length < RELATED_WORDS_PER_DISPLAY) {
        let wordObj = response.data[i];

        let isNoun = wordObj.tags.includes("n");
        let noSpaces = !wordObj.word.includes(" ");
        let isNewWord = !allGuessedWords.includes(wordObj.word.toUpperCase());

        if (isNoun && noSpaces && isNewWord) {
            relatedWords.push(wordObj.word);
        }

        i++;
    }

    return relatedWords;
}

async function generateStartWords() {
    startWord = getRandomWord();
    endWord = getRandomWord();

    allGuessedWords.push(startWord, endWord);

    lastGuessedWord = startWord;

    $("#start-word").text(startWord.toUpperCase());
    $("#end-word").text(endWord.toUpperCase());

    getRelatedWordsAndPopulateTable();
}

async function getRelatedWordsAndPopulateTable() {
    let relatedWords = await getRelatedWords(lastGuessedWord);
    populateGuessesTable(relatedWords);
}

function populateGuessesTable(words) {
    $guessTable.empty();
    for (let word of words) {
        let $word = $(`<tr><td>${word.toUpperCase()}</td></tr>`);
        $guessTable.append($word);
    }
}

function handleWordClick(event) {
    lastGuessedWord = $(event.target).text();
    allGuessedWords.push(lastGuessedWord);
    let $guessedWord = $(`<h3>${lastGuessedWord}</h3>`);
    $guessedWords.append($guessedWord);
    if (!checkForWinningWord()) {
        getRelatedWordsAndPopulateTable();
    } else {
        $guessTable.empty();
    }
}

function checkForWinningWord() {
    if (lastGuessedWord === endWord) {
        return true;
    }

    return false;
}

$guessTable.on("click", "td", handleWordClick);

generateStartWords();


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
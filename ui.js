"use strict";

const $gameContainer = $("#game");
const $howToPlayContainer = $("#how-to-play");
const $gameContent = $("#game-content");
const $startWord = $("#start-word");
const $endWord = $("#end-word");
const $guessTable = $("#guess-options");
const $guessedWords = $("#guessed-words");

const $startButton = $("#start-button");
const $resetButton = $("#reset-button");
const $howToPlayButton = $("#how-to-play-button");
const $returnButton = $("#return-to-game");

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

function showHideHowToPlay() {
    $gameContainer.toggleClass("d-none");
    $howToPlayContainer.toggleClass("d-none");
}

$howToPlayButton.on("click", showHideHowToPlay);
$returnButton.on("click", showHideHowToPlay);
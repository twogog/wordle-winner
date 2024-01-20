const form = document.querySelector("form");
const wrongWordsInput = document.getElementById("wrongWords");

const words = await getWords(5);

const generator = {
  wrongLetters: "",
  containerEl: null,
  wordLength: null,
  inputInfo: [],
};

const tailwindClasses = {
  bg: {
    gray: "bg-gray-400",
  },
};

form.addEventListener("submit", (e) => {
  e.preventDefault();
  renderFloatingInfo(wordsFilterByRegexses());
});

form.addEventListener("input", (e) => {
  e.preventDefault();
  const { id, value } = e.target;
  generatorWorker(id, value);
});

function renderWord(number) {
  generator.containerEl && form.removeChild(generator.containerEl);
  const containerEl = document.createElement("div");
  generator.containerEl = containerEl;
  containerEl.classList.add("flex", "gap-1");
  for (let i = 1; i <= number; i++) {
    containerEl.innerHTML += `
        <div id='container-${i}' class="flex flex-col">
          <input id='loose-${i}' type="radio"/>
          <input id='letter-${i}' maxlength='1' autocomplete="off" class="${tailwindClasses.bg.gray} uppercase text-center w-7 h-7 my-1 focus:outline-none" type="text" />
          <input id='strict-${i}' type="radio" />
        </div>
  `;
  }
  form.insertBefore(containerEl, wrongWordsInput);
}

function generateInitial(wordLength) {
  generator.wordLength = wordLength;
  // Чтобы убрать ссылку на один объект
  generator.inputInfo = JSON.parse(
    JSON.stringify(Array(wordLength).fill({ letter: ".", type: "loose" }))
  );
}

function wordsFilterByRegexses() {
  const regexpRight = new RegExp(
    generator.inputInfo.reduce((init, { letter, type }) => {
      return type === "strict" ? init + letter : init + ".";
    }, "")
  );
  const regexpLoose = new RegExp(
    generator.inputInfo.reduce((init, { letter, type }) => {
      return type === "strict"
        ? init
        : letter !== "."
        ? init + `(?=.*[${letter}])`
        : init;
    }, "")
  );

  const regexpWrong = new RegExp(`[${generator.wrongLetters}]`);

  const wrightLetters = (word) => word.match(regexpRight);
  const wrongLetters = (word) => !word.match(regexpWrong);
  const looseLetters = (word) => word.match(regexpLoose);

  return words.filter(
    (word) =>
      word.length === +generator.wordLength &&
      wrongLetters(word) &&
      wrightLetters(word) &&
      looseLetters(word)
  );
}

function generatorWorker(idElement, valueElement) {
  const [, number] = idElement.split("-");
  const letter = form.querySelector(`#letter-${number}`);

  if (idElement.includes("numbers") && +valueElement <= 10) {
    renderWord(valueElement);
    generateInitial(+valueElement);
  }

  if (idElement.includes("wrongWords")) {
    generator.wrongLetters = valueElement
      .replace(/[^а-яА-я]/g, "")
      .toLowerCase();
  }

  if (idElement.includes("letter")) {
    generator.inputInfo[number - 1].letter = valueElement
      ? valueElement.toLowerCase()
      : ".";
    valueElement.length > 0 &&
      !valueElement.match(/[а-я]/i) &&
      alert("Поддерживает только кириллицу");

    if (!valueElement.length) {
      classToggler(
        letter,
        ["remove", "loose"],
        ["remove", "strict"],
        ["add", tailwindClasses.bg.gray]
      );
      letter.previousElementSibling.checked = false;
      letter.nextElementSibling.checked = false;
      generator.inputInfo[number - 1].type = "loose";
    }

    if (
      !letter.previousElementSibling.checked &&
      !letter.nextElementSibling.checked &&
      valueElement.length
    ) {
      classToggler(
        letter,
        ["add", "loose"],
        ["remove", tailwindClasses.bg.gray]
      );
      letter.previousElementSibling.checked = true;
    }
  }

  if (idElement.includes("strict")) {
    letter.previousElementSibling.checked = false;
    classToggler(
      letter,
      ["remove", "loose"],
      ["add", "strict"],
      ["remove", tailwindClasses.bg.gray]
    );
    generator.inputInfo[number - 1].type = "strict";
  }

  if (idElement.includes("loose")) {
    letter.nextElementSibling.checked = false;
    classToggler(
      letter,
      ["add", "loose"],
      ["remove", "strict"],
      ["remove", tailwindClasses.bg.gray]
    );
    generator.inputInfo[number - 1].type = "loose";
  }

  function classToggler(el, ...classList) {
    for (const [type, className] of classList) {
      el.classList[type](className);
    }
  }
}

function renderFloatingInfo(wordsList) {
  if (!wordsList.length || !wordsList[0]) return;
  const floating = document.querySelector(".floating");
  floating && form.parentElement.removeChild(floating);
  const div = document.createElement("div");
  div.classList.add("floating", "border-blue-700", "border", "rounded");
  div.innerHTML = wordsList.join(", ");
  form.parentElement.append(div);
}

async function getWords(chunks) {
  const words = [];
  for (let i = 1; i <= chunks; i++) {
    words.push(
      JSON.parse(
        await fetch(`./words/words-${i}.json`).then((res) => res.text())
      )
    );
  }
  return words.flat();
}

const form = document.querySelector("form");
const wrongWordsInput = document.getElementById("wrongWords");

const words = await fetch(`./words.json`).then((res) => res.json());

const generator = {
  wrongLetters: "",
  containerEl: null,
  wordLength: null,
  inputInfo: [],
  currentInputsEl: [],
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
  generatorWorker(id, value, e);
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
  generator.currentInputsEl = document.querySelectorAll('[id^="letter-"]');
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

function generatorWorker(idElement, valueElement, element) {
  const number = Number(idElement.split("-")?.[1]);
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
    switch (valueElement.length) {
      case 0:
        {
          classToggler(
            letter,
            ["remove", "loose"],
            ["remove", "strict"],
            ["add", tailwindClasses.bg.gray]
          );
          letter.previousElementSibling.checked = false;
          letter.nextElementSibling.checked = false;
          generator.inputInfo[number - 1].type = "loose";
          focusContoller(valueElement.length);
        }
        break;
      case 1:
        {
          !valueElement.match(/[а-я]/i) &&
            alert("Поддерживает только кириллицу");
          focusContoller(valueElement.length);
        }
        break;
      default:
        element.target.value = element.target.value.slice(0, 1);
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

  function focusContoller(length) {
    if (length > 0) {
      number !== generator.wordLength &&
        generator.currentInputsEl[number - 1].blur();
      number !== generator.wordLength &&
        generator.currentInputsEl[number].focus();
      return;
    }
    number !== 1 && generator.currentInputsEl[number - 1].blur();
    number !== 1 && generator.currentInputsEl[number - 2].focus();
  }
}

function renderFloatingInfo(wordsList) {
  if (!wordsList.length || !wordsList[0]) wordsList = ["ничего не найдено"];
  const floating = document.querySelector(".floating");
  floating && form.parentElement.removeChild(floating);
  const div = document.createElement("div");
  div.classList.add("floating", "border-blue-700", "border", "rounded");
  const tdSameClasses = "border-2 border-black p-1 text-xl";
  div.innerHTML = `
  <table class='border-collapse w-full opacity-75'>
	  <tbody>
	  	${wordsList
        .map(
          (word, ind) => `
        <tr>
          <td class='${tdSameClasses} w-1/5'>${ind + 1}.</td>
          <td class='${tdSameClasses} text-left'>${word}</td>
        </tr>
        `
        )
        .join("")}
	  </tbody>
</table>
  `;
  form.parentElement.append(div);
}

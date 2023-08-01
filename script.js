'use strict';

const mainButtons = document.querySelectorAll('.main-buttons');
const dice = document.querySelectorAll('.dice');
diceWrapper = document.querySelector('.dice-wrapper');
const rulesModal = document.querySelector('.rules-modal');
const newGameModal = document.querySelector('.new-game-modal');
const victoryModal = document.querySelector('.victory-screen');
const victoryWrapper = document.getElementById('victory-wrapper');
const playerCount = document.querySelector('.player-count-input');
const backgroundBlur = document.querySelector('.background-blur');
const yatzyButtons = document.querySelectorAll('.clickable');
const leftWrapper = document.querySelector('.left-wrapper');
const rollDiceButton = document.querySelector('.roll-dice');

let game;
const instanceArray = [];

// Class constructors

class YatzyField {
  constructor(fieldName) {
    this.fieldName = fieldName;
  }
}

class NumberFields extends YatzyField {
  constructor(fieldName, fieldValue) {
    super(fieldName);
    this.fieldValue = fieldValue;
  }

  calculateScore(diceArray) {
    const sum = diceArray
      .map(die => {
        if (die === this.fieldValue) return die;
      })
      .filter(value => value !== undefined)
      .reduce((acc, val) => acc + val, 0);
    return sum;
  }
}

class SumField extends YatzyField {
  constructor(fieldName, sumFields) {
    super(fieldName);
    this.sumFields = sumFields;
  }
  calculateScore([...sumfield]) {
    const sum = sumfield.reduce((acc, val) => acc + val, 0);
    if (this.fieldName === 'Sjanse') return sum;
    return { sum: sum };
  }

  insertScore(activePlayer, field, score) {
    const scoreField = [
      ...document.querySelectorAll(`.player-${activePlayer}`),
    ].find(el => el.id === field);
    const sum = score.reduce((acc, val) => acc + parseInt(val), 0);
    scoreField.dataset.score = sum;
    scoreField.innerHTML = `<span>${sum}</span>`;
  }
}

class BonusField extends YatzyField {
  constructor(fieldName, requiredSum, bonusSum) {
    super(fieldName);
    this.requiredSum = requiredSum;
    this.bonusSum = bonusSum;
  }
  calculateScore(sumField) {
    if (sumField >= this.requiredSum) return this.bonusSum;
    else return 0;
  }
}

class StraightFields extends YatzyField {
  constructor(fieldName, straightSelect) {
    super(fieldName);
    this.straightSelect = straightSelect;
  }
  calculateScore(diceArray) {
    const set = [...new Set(diceArray)]
      .map(el => {
        if (this.straightSelect.includes(el)) return el;
      })
      .sort((a, b) => a - b);

    if (set.toString() === this.straightSelect.toString())
      return set.reduce((acc, val) => acc + val, 0);
  }
}

class LikeFields extends YatzyField {
  constructor(fieldName, like) {
    super(fieldName);
    this.like = like;
  }
  calculateScore(diceArray) {
    const mapped = [...new Set(diceArray)]
      .map(entry => {
        let count = 0;
        diceArray.forEach(el => el === entry && count++);
        if (count >= this.like) return entry;
      })
      .filter(value => value !== undefined);
    if (mapped.length > 0 && this.like === 6) return 100;
    if (mapped.length > 0) return this.like * mapped[0];
  }
}

class PairField extends YatzyField {
  constructor(fieldName, numberPairs) {
    super(fieldName);
    this.numberPairs = numberPairs;
  }
  calculateScore(diceArray) {
    const sorted = [...new Set(diceArray)]
      .sort((a, b) => b - a)
      .map(el => {
        let inst = 0;
        diceArray.forEach(num => {
          if (num === el) inst++;
        });
        if (inst >= 2) return parseInt(el * 2);
      })
      .filter(value => value !== undefined)
      .slice(0, parseInt(this.numberPairs));
    if (sorted.length < this.numberPairs) return;
    return sorted.reduce((acc, val) => acc + val, 0);
  }
}

class BuildingFields extends YatzyField {
  constructor(fieldName, comboArray) {
    super(fieldName);
    this.comboArray = comboArray;
  }
  calculateScore(diceArray) {
    const sorted = [...new Set(diceArray)]
      .sort((a, b) => b - a)
      .map(el => {
        let inst = 0;
        diceArray.forEach(value => {
          if (value === el) inst++;
        });
        if (inst >= this.comboArray[0] || inst >= this.comboArray[1])
          return [el, inst];
      })
      .filter(value => value !== undefined);
    if (!sorted.find(el => el[1] >= this.comboArray[0]) || sorted.length !== 2)
      return;
    return (
      sorted[0][0] * this.comboArray[0] + sorted[1][0] * this.comboArray[1]
    );
  }
}

// Calling class constructors

instanceArray.push(new NumberFields('Enere', 1));
instanceArray.push(new NumberFields('Toere', 2));
instanceArray.push(new NumberFields('Treere', 3));
instanceArray.push(new NumberFields('Firere', 4));
instanceArray.push(new NumberFields('Femmere', 5));
instanceArray.push(new NumberFields('Seksere', 6));
instanceArray.push(new SumField('SumOppe', ['array']));
instanceArray.push(new BonusField('Bonus', 84, 100));
instanceArray.push(new PairField('EttPar', 1));
instanceArray.push(new PairField('ToPar', 2));
instanceArray.push(new PairField('TrePar', 3));
instanceArray.push(new LikeFields('TreLike', 3));
instanceArray.push(new LikeFields('FireLike', 4));
instanceArray.push(new LikeFields('FemLike', 5));
instanceArray.push(new StraightFields('LitenStraight', [1, 2, 3, 4, 5]));
instanceArray.push(new StraightFields('StorStraight', [2, 3, 4, 5, 6]));
instanceArray.push(new StraightFields('FullStraight', [1, 2, 3, 4, 5, 6]));
instanceArray.push(new BuildingFields('Hus', [3, 3]));
instanceArray.push(new BuildingFields('Hytte', [3, 2]));
instanceArray.push(new BuildingFields('Tårn', [4, 2]));
instanceArray.push(new LikeFields('MaxiYatzy', 6));
instanceArray.push(new SumField('Sjanse', ['array']));
instanceArray.push(new SumField('TotalSum', ['array']));

class Player {
  score = 0;
  diceRolls = 0;
  constructor(name, playerNumber) {
    this.name = name;
    this.playerNumber = playerNumber;
  }
  insertHTML() {
    leftWrapper.insertAdjacentHTML(
      'beforeend',
      `
      <div class="player player-${this.playerNumber}"</div>
  <div id="Navn" class="player-field name-field player-${this.playerNumber}" data-name="${this.name}" style="font-size:1.3vh"> <span>${this.name}</span></div>
  <div id="Enere" class="player-field number-field player-${this.playerNumber}"></div>
  <div id="Toere" class="player-field number-field player-${this.playerNumber}"></div>
  <div id="Treere" class="player-field number-field player-${this.playerNumber}"></div>
  <div id="Firere" class="player-field number-field player-${this.playerNumber}"></div>
  <div id="Femmere" class="player-field number-field player-${this.playerNumber}"></div>
  <div id="Seksere" class="player-field number-field player-${this.playerNumber}"></div>
  <div id="SumOppe" class="player-field SumOppe-field player-${this.playerNumber}"></div>
  <div id="Bonus" class="player-field Bonus-field player-${this.playerNumber}"></div>
  <div id="EttPar" class="player-field EttPar-field player-${this.playerNumber}"></div>
  <div id="ToPar" class="player-field ToPar-field player-${this.playerNumber}"></div>
  <div id="TrePar" class="player-field TrePar-field player-${this.playerNumber}"></div>
  <div id="TreLike" class="player-field TreLike-field player-${this.playerNumber}"></div>
  <div id="FireLike" class="player-field FireLike-field player-${this.playerNumber}"></div>
  <div id="FemLike" class="player-field FemLike player-${this.playerNumber}"></div>
  <div id="LitenStraight" class="player-field LitenStraight-field player-${this.playerNumber}"></div>
  <div id="StorStraight" class="player-field StorStraight-field player-${this.playerNumber}"></div>
  <div id="FullStraight" class="player-field FullStraight-field player-${this.playerNumber}"></div>
  <div id="Hytte" class="player-field Hytte-field player-${this.playerNumber}"></div>
  <div id="Hus" class="player-field Hus-field player-${this.playerNumber}"></div>
  <div id="Tårn" class="player-field Tårn-field player-${this.playerNumber}"></div>
  <div id="Sjanse" class="player-field Sjanse-field player-${this.playerNumber}"></div>
  <div id="MaxiYatzy" class="player-field MaxiYatzy-field player-${this.playerNumber}"></div>
  <div id="TotalSum" class="player-field TotalSum-field player-${this.playerNumber}"></div>
</div>`
    );
  }
}

class Gamestate {
  activePlayer = 0;
  gameOngoing = false;
  currentRolls = [];


  constructor(playerArray, chips, playerCount) {
    this.playerArray = playerArray;
    this.chips = chips;
    this.playerCount = playerCount;

    this.clickYatzy = this.clickYatzy.bind(this);
    this.nextPlayer = this.nextPlayer.bind(this);
    this.rollDice = this.rollDice.bind(this);
  }

  updateStatus() {
    document.querySelector('.aktiv-spiller').innerHTML = `${
      this.playerArray[this.activePlayer - 1].name
    }`;
    document.querySelector('.antall-kast').innerHTML = `${
      this.playerArray[this.activePlayer - 1].diceRolls
    }`;
  }

  updateScore() {
    const allFields = [
      ...document.querySelectorAll(`.player-${this.activePlayer}`),
    ];
    const oppeFields = allFields
      .filter(
        el => [...el.classList].includes('number-field') && el.dataset.score
      )
      .map(el => el.dataset.score);
    instanceArray.forEach(el => {
      if (el.fieldName === 'SumOppe') {
        el.insertScore(this.activePlayer, 'SumOppe', oppeFields);
      }
      if (el.fieldName === 'Bonus' && oppeFields.length === 6) {
        const sumField = allFields.find(el => el.id === 'SumOppe');
        const bonusField = allFields.find(el => el.id === 'Bonus');
        const bonus = el.calculateScore(sumField.dataset.score);
        if (bonusField.dataset.score) return;
        bonusField.dataset.score = bonus;
        bonusField.insertAdjacentHTML(
          'beforeend',
          `<span>${el.calculateScore(bonus)}</span>`
        );
      }
      if (el.fieldName === 'TotalSum') {
        const sumFields = allFields
          .filter(
            el =>
              !(el.id === 'SumOppe') &&
              !(el.id === 'TotalSum') &&
              el.dataset.score
          )
          .map(el => el.dataset.score);
        el.insertScore(this.activePlayer, 'TotalSum', sumFields);
      }
    });
  }

  rollDice() {
    if (this.playerArray[this.activePlayer - 1].diceRolls === 0) return;
    diceWrapper.style.animation = 'dice-opacity 0.7s forwards';
    this.playerArray[this.activePlayer - 1].diceRolls--;

    const cycleDice = () => {
      [...dice, ...mainButtons].forEach(button =>
        button.classList.add('active')
      );
      [...dice].forEach((die, index) => {
        die.classList.add('active');
        if ([...die.classList].includes('held')) return;
        const dice = Math.floor(Math.random() * 6 + 1);
        die.src = `${dice}-transparant.png`;
        this.currentRolls[parseInt(`${index}`)] = dice;
      });
    };

    const timerCycle = () => {
      const timer = setInterval(() => cycleDice(), 100);
      const timeout = setTimeout(() => {
        clearInterval(timer);
        [...dice, ...mainButtons].forEach(die =>
          die.classList.remove('active')
        );
        instanceArray.forEach(entry => {
          document.getElementById(`${entry.fieldName}`).style.backgroundColor =
            '';
          if (!document.getElementById(`${entry.fieldName}`)) return;
          const isScored = [
            ...document.querySelectorAll(`.player-${this.activePlayer}`),
          ].find(el => el.id === entry.fieldName);
          if (
            entry.calculateScore(this.currentRolls) > 0 &&
            !isScored.dataset.score
          ) {
            document.getElementById(`${entry.fieldName}`).style.background =
              'rgba(128, 128, 128, 0.2)';
          }
          this.updateStatus();
        });
      }, 1100);
      timer;
      timeout;
    };
    timerCycle();
  }

  clickYatzy(e) {
    const match = [
      ...document.querySelectorAll(`.player-${this.activePlayer}`),
    ].find(el => el.id === e.target.id);
    if (!match || match.dataset.score) return;
    leftWrapper.style.pointerEvents = 'none';
    const pos = { x: e.clientX, y: e.clientY };
    dice.forEach(die => {
      document.documentElement.style.setProperty(
        '--x',
        `${+pos.x - die.x * 0.5}px`
      );
      document.documentElement.style.setProperty(
        '--y',
        `${+pos.y - die.y * 0.7}px`
      );
      die.style.animation = 'animate-dice 2s 1';
    });

    setTimeout(() => {
      diceWrapper.style = '';
      diceWrapper.style.animation = 'hide-dice 0.5s forwards';
      dice.forEach(die => die.classList.remove('held'));
      const instance = instanceArray.find(el => el.fieldName === match.id);
      if (!instance.calculateScore(this.currentRolls)) {
        match.dataset.score = 0;
        match.insertAdjacentHTML('beforeend', `<span>&#9866;</span>`);
      }
      if (instance.calculateScore(this.currentRolls)) {
        match.dataset.score = instance.calculateScore(this.currentRolls);
        match.insertAdjacentHTML(
          'beforeend',
          `<span>${instance.calculateScore(this.currentRolls)}</span>`
        );
      }
      yatzyButtons.forEach(field => (field.style.background = ''));
      this.updateScore();
      this.updateStatus();
      this.checkVictory();
      this.nextPlayer();
      this.currentRolls.length = 0;
    }, 1000);
  }

  nextPlayer() {
    if (this.gameOngoing === false) return;
    const statusWrapper = document.querySelector('.status-wrapper');
    statusWrapper.style.animation = 'dice-opacity 0.7s forwards';
    leftWrapper.style.pointerEvents = 'auto';
    document
      .querySelectorAll('.player')
      .forEach(player => (player.style.background = ''));

    if (this.activePlayer === this.playerCount) this.activePlayer = 1;
    else this.activePlayer++;
    const activePlayer = this.playerArray[this.activePlayer - 1];
    if (this.chips === true)
      activePlayer.diceRolls = activePlayer.diceRolls + 3;
    if (this.chips === false) activePlayer.diceRolls = 3;
    activePlayer.diceRolls;

    this.updateStatus();
    const players = document.querySelectorAll(`.player`);
    players.forEach(player => {
      if ([...player.classList].includes(`player-${this.activePlayer}`))
        player.style.boxShadow = '0 0 0 60px rgba(255, 217, 0, 0.2) inset';
      else player.style.boxShadow = 'none';
    });
  }

  checkVictory() {
    const allPlayerFields = [...document.querySelectorAll('.player-field')];
    const isComplete = allPlayerFields.filter(field => !field.dataset.score);
    const sortedScore = [...document.querySelectorAll('.TotalSum-field')].sort(
      (a, b) => parseInt(b.dataset.score) - parseInt(a.dataset.score)
    );

    if (this.playerArray.length === isComplete.length) {
      victoryWrapper.insertAdjacentHTML(
        'afterbegin',
        `<span><h2>Sluttresultat</h2></span></br>`
      );

      sortedScore
        .filter(
          (el, _index, array) => el.dataset.score === array[0].dataset.score
        )
        .forEach(score => {
          const playerColumn = score.closest('.player');
          playerColumn.style.boxShadow =
            '0 0 0 60px rgba(255, 53, 97, 0.4) inset';
        });
      sortedScore.forEach(score => {
        const playerColumn = score.closest('.player');
        victoryWrapper.insertAdjacentHTML(
          'beforeend',
          `<span>${playerColumn.querySelector('.name-field').dataset.name}: ${
            playerColumn.querySelector('.TotalSum-field').dataset.score
          }</span>`
        );
      });
      victoryModal.showModal();
      backgroundBlur.style.visibility = 'visible';
      this.gameOngoing = false;
      rollDiceButton.disabled = true;
    }
  }
}

function removeAnimation(e) {
  dice.forEach(die => (die.style = ''));
}

function hideModalCallback(e) {
  if (e.type === 'click' && [...e.target.classList].includes('rules-modal'))
    hideModal(rulesModal);
  if (e.type === 'click' && [...e.target.classList].includes('victory-screen'))
    hideModal(victoryModal);
  if (e.type === 'click' && [...e.target.classList].includes('new-game-modal'))
    hideModal(newGameModal);
  if (e.key === 'Escape') hideModal();
}

function displayModal(e) {
  [...e.target.classList].includes('show-rules') && rulesModal.showModal();
  [...e.target.classList].includes('new-game-dialog-button') &&
    newGameModal.showModal();

  backgroundBlur.style.visibility = 'visible';
  document.addEventListener('click', hideModalCallback);
  document.addEventListener('keydown', hideModalCallback);
}

function hideModal(e) {
  victoryModal.close();
  newGameModal.close();
  rulesModal.close();
  [...document.querySelectorAll('.input-name')].forEach(field => {
    field.value = '';
  });
  backgroundBlur.style.visibility = 'hidden';
  document.removeEventListener('keydown', hideModalCallback);
  document.removeEventListener('click', hideModalCallback);
}

function holdDice(e) {
  if ([...e.target.classList].includes('active')) return;
  e.target.classList.toggle('held');
}

function createPlayers(nameArray, chips) {
  const players = nameArray.map((name, index) => {
    return new Player(name, index + 1);
  });
  game = new Gamestate(players, chips, players.length);
  players.forEach(player => player.insertHTML());
}

function newGame() {
  if (game) {
    yatzyButtons.forEach(button =>
      button.removeEventListener('click', game.clickYatzy)
    );
  }
  const nameArray = [...document.querySelectorAll('.input-name')]
    .map(fields => fields.value)
    .filter(elm => elm);
  const originalArray = [...document.querySelectorAll('.input-name')];
  if (nameArray.length < originalArray.length) {
    alert('Fyll ut navn for å starte spillet');
    return;
  }
  [...document.querySelectorAll('.player')].forEach(player => player.remove());
  createPlayers(nameArray, document.querySelector('.toggle-chips').checked);
  leftWrapper.style.pointerEvents = 'auto';
  diceWrapper.style.animation = 'hide-dice 0.5s forwards';
  instanceArray.forEach(entry => {
    document.getElementById(`${entry.fieldName}`).style.backgroundColor = '';
  });
  victoryWrapper.innerHTML = '';
  game.gameOngoing = true;
  rollDiceButton.disabled = false;
  game.nextPlayer();
  game.updateStatus();
  yatzyButtons.forEach(button =>
    button.addEventListener('click', game.clickYatzy)
  );
  hideModal();
}

function generateNameFields(e) {
  const playerInputField = document.querySelector('.player-input-field');
  playerInputField.innerHTML = '';
  const players = parseInt(e.target.value);
  for (let i = 0; i < players; i++) {
    playerInputField.insertAdjacentHTML(
      'beforeend',
      `<field>
    <label for="navn${i + 1}">Spillernavn</label>
    <input type="text" id="navn${
      i + 1
    }" class="input-name player-input-field input name-player-${i + 1}" required
    minlength="2" maxlength="10" placeholder="2-10 bokstaver">
  </field><br>`
    );
  }
}

mainButtons.forEach(button =>
  button.addEventListener('click', e => {
    if ([...e.target.classList].includes('active')) return;
    [...e.target.classList].includes('roll-dice') && game.rollDice();
    [...e.target.classList].includes('show-rules') && displayModal(e);
    [...e.target.classList].includes('new-game-dialog-button') &&
      displayModal(e);
    [...e.target.classList].includes('rules-button') && hideModal(e);
    [...e.target.classList].includes('close-modal') && hideModal(e);
    [...e.target.classList].includes('new-game-button') && newGame(e);
  })
);

dice.forEach(die => die.addEventListener('click', holdDice));
yatzyButtons.forEach(button =>
  button.addEventListener('mousedown', removeAnimation)
);

playerCount.addEventListener('change', generateNameFields);

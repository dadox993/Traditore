// =======================================================
// 1. CONFIGURAZIONE FIREBASE (PROGETTO "il-traditore")
// =======================================================
const firebaseConfig = {
  apiKey: "AIzaSyB_86Dxt6zNhodNcdD7RC4rUDDkMt2YHiA",
  authDomain: "il-traditore.firebaseapp.com",
  databaseURL: "https://il-traditore-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "il-traditore",
  storageBucket: "il-traditore.firebasestorage.app",
  messagingSenderId: "895062418758",
  appId: "1:895062418758:web:d1d49b9e1b4d95b6cd7147",
  measurementId: "G-VCMZWLJRX7"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// =======================================================
// 2. AUDIO NATIVO iOS / ANDROID (Web Audio API)
// =======================================================
let soundEnabled = true;
let audioCtx = null;

function playTone(freq = 440, duration = 0.25, type = 'sine') {
  if (!soundEnabled) return;
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) { /* Ignora restrizioni autoplay prima del tocco */ }
}

// =======================================================
// 3. MAZZO DI 18 MISSIONI SCUDO (MESCOLATE A OGNI PARTITA)
// =======================================================
const SHIELD_MISSIONS = [
  {
    cat: "LOGICA",
    q: "Un Traditore mente sempre il lunedì, martedì e mercoledì. Un Fedele mente solo il giovedì. Oggi entrambi dicono: «Ieri ho mentito». Che giorno è oggi?",
    options: ["Giovedì", "Lunedì", "Domenica", "Venerdì"],
    answer: 0
  },
  {
    cat: "DEDUZIONE",
    q: "Sul tavolo ci sono 3 scrigni: Oro, Argento e Bronzo. Solo uno contiene lo Scudo. L'etichetta su Oro dice «Non è qui», su Argento dice «È in Bronzo». Solo una frase è vera. Dov'è lo Scudo?",
    options: ["Nello scrigno d'Oro", "Nello scrigno d'Argento", "Nello scrigno di Bronzo", "In nessuno dei tre"],
    answer: 0
  },
  {
    cat: "SEQUENZA",
    q: "Completa la sequenza segreta della Tavola Rotonda: 2, 6, 12, 20, 30, ...",
    options: ["42", "36", "40", "44"],
    answer: 0
  },
  {
    cat: "ENIGMA",
    q: "Se 5 candidati impiegano 5 minuti per decifrare 5 codici, quanti minuti impiegano 10 candidati per decifrare 10 codici?",
    options: ["5 minuti", "10 minuti", "1 minuto", "25 minuti"],
    answer: 0
  },
  {
    cat: "STRATEGIA",
    q: "Hai una candela che brucia in esattamente 1 ora, ma non brucia a velocità uniforme. Come misuri 30 minuti esatti?",
    options: ["Accendi entrambe le estremità: finirà in 30 min", "La spegni e riaccendi a metà", "Non è possibile misurarli", "La dividi ad occhio in due"],
    answer: 0
  },
  {
    cat: "MATEMATICA",
    q: "Un pugnale e un fodero costano insieme 110 monete d'oro. Il pugnale costa 100 monete in più del fodero. Quanto costa il fodero?",
    options: ["5 monete", "10 monete", "1 moneta", "15 monete"],
    answer: 0
  },
  {
    cat: "LOGICA",
    q: "In una stanza ci sono 3 interruttori fuori da una porta chiusa. Dietro ci sono 3 lampade. Puoi aprire la porta una sola volta. Come fai?",
    options: ["Accendi il 1° per 5 min, lo spegni, accendi il 2° ed entri", "Accendi tutti e tre insieme", "Apri la porta senza toccarli", "Ne accendi due per 10 secondi"],
    answer: 0
  },
  {
    cat: "INDOVINELLO",
    q: "Più ne togli, più diventa grande. Cos'è?",
    options: ["Un buco", "Un debito", "Un'ombra", "Un segreto"],
    answer: 0
  },
  {
    cat: "MEMORIA & ATTENZIONE",
    q: "Quale di queste parole NON compare mai nell'intestazione del gioco «IL TRADITORE»?",
    options: ["Castello", "Fidati", "Notte", "Smartphone"],
    answer: 0
  },
  {
    cat: "DEDUZIONE",
    q: "Tre amici hanno ciascuno un cappello: Rosso, Blu o Nero. Nessuno vede il proprio. Il 1° dice: «Non so il mio». Il 2° dice: «Neanche io». Il 3° dice: «Il mio è Rosso!». Com'è possibile?",
    options: ["I primi due avevano cappelli non-Rossi o hanno dedotto per esclusione", "Il 3° ha sbirciato", "Tutti e tre avevano il cappello Rosso", "Era una bugia"],
    answer: 0
  },
  {
    cat: "CULTURA POP",
    q: "Nel celebre gioco da tavolo di deduzione sociale «Lupus in Tabula» / «Werewolf», chi agisce solitamente di notte?",
    options: ["I Lupi Mannari", "Solo il Narratore", "I Villici armati", "Nessuno"],
    answer: 0
  },
  {
    cat: "SEQUENZA",
    q: "Quale numero viene dopo nella serie: 1, 1, 2, 3, 5, 8, 13, ...?",
    options: ["21", "18", "20", "16"],
    answer: 0
  },
  {
    cat: "PSICOLOGIA DEL GIOCO",
    q: "Alla Tavola Rotonda un giocatore che non ha quasi mai parlato accusa all'improvviso qualcun altro senza prove. Qual è la mossa più razionale per un Fedele?",
    options: ["Osservare chi lo appoggia subito e fare domande", "Votarlo subito senza ascoltare", "Fidarsi ciecamente di lui", "Uscire dalla stanza"],
    answer: 0
  },
  {
    cat: "ENIGMA",
    q: "Ho città ma non case, montagne ma non alberi, acqua ma non pesci, strade ma non auto. Cosa sono?",
    options: ["Una mappa", "Un sogno", "Un quadro", "Un libro"],
    answer: 0
  },
  {
    cat: "LOGICA",
    q: "Se oggi è mercoledì, che giorno della settimana sarà tra 100 giorni?",
    options: ["Venerdì", "Mercoledì", "Sabato", "Domenica"],
    answer: 0
  },
  {
    cat: "DEDUZIONE",
    q: "Quattro sospettati sono in fila. Marco è davanti a Giulia, Luca è dietro Giulia ma davanti a Sara. Chi è il primo della fila?",
    options: ["Marco", "Giulia", "Luca", "Sara"],
    answer: 0
  },
  {
    cat: "MATEMATICA",
    q: "In un gruppo di 6 persone, ognuno stringe la mano a tutti gli altri esattamente una volta. Quante strette di mano avvengono in totale?",
    options: ["15", "12", "30", "6"],
    answer: 0
  },
  {
    cat: "INTUITO",
    q: "Quale elemento è l'intruso tra questi quattro?",
    options: ["Pugnale", "Veleno", "Scudo", "Segreto"],
    answer: 2
  }
];

function getShuffledMissionDeck() {
  const deck = SHIELD_MISSIONS.map((_, idx) => idx);
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

// =======================================================
// 4. STATO LOCALE E RICONNESSIONE
// =======================================================
let state = {
  roomCode: localStorage.getItem('trd_room') || null,
  playerId: localStorage.getItem('trd_pid') || null,
  selectedAvatar: '🎭',
  selectedVoteId: null,
  selectedNightTargetId: null,
  roleRevealedLocally: false,
  missionAnswered: false,
  roomRef: null,
  secretRef: null,
  roomData: null,
  mySecret: null
};

const $ = (id) => document.getElementById(id);

function showToast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  setTimeout(() => t.classList.add('hidden'), 2600);
}

function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  $(screenId).classList.add('active');
}

function generateId(len = 6) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// =======================================================
// 5. INIZIALIZZAZIONE & EVENTI UI
// =======================================================
document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const inviteCode = urlParams.get('room');
  if (inviteCode) {
    $('roomCodeInput').value = inviteCode.toUpperCase().slice(0, 4);
  }

  document.querySelectorAll('.avatar-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.avatar-opt').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      state.selectedAvatar = btn.dataset.avatar;
      playTone(520, 0.1);
    });
  });

  $('soundToggleBtn').addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    $('soundToggleBtn').textContent = soundEnabled ? '🔊' : '🔇';
    if (soundEnabled) playTone(600, 0.15);
  });

  $('leaveBtn').addEventListener('click', leaveRoom);
  $('createRoomBtn').addEventListener('click', createRoom);
  $('joinRoomBtn').addEventListener('click', joinRoom);

  $('copyInviteBtn').addEventListener('click', () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?room=${state.roomCode}`;
    if (navigator.share) {
      navigator.share({
        title: 'Il Traditore',
        text: `Unisciti alla partita a Il Traditore! Codice stanza: ${state.roomCode}`,
        url: shareUrl
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl);
      showToast('Link invito copiato!');
    }
  });

  $('startGameBtn').addEventListener('click', startGame);

  $('secretRoleCard').addEventListener('click', () => {
    if (state.roleRevealedLocally || !state.mySecret) return;
    state.roleRevealedLocally = true;
    playTone(state.mySecret.role === 'TRAITOR' ? 190 : 540, 0.4, 'triangle');
    renderRoleCard();
    $('confirmRoleBtn').classList.remove('hidden');
  });

  $('confirmRoleBtn').addEventListener('click', async () => {
    $('confirmRoleBtn').disabled = true;
    await db.ref(`rooms/${state.roomCode}/players/${state.playerId}/ready`).set(true);
    checkAllPlayersReadyForMission();
  });

  $('advanceToVotingBtn').addEventListener('click', () => {
    db.ref(`rooms/${state.roomCode}/meta/phase`).set('VOTING');
  });

  $('confirmVoteBtn').addEventListener('click', submitVote);

  $('startNightBtn').addEventListener('click', () => {
    db.ref(`rooms/${state.roomCode}/meta/phase`).set('NIGHT');
  });

  $('confirmNightKillBtn').addEventListener('click', submitNightAction);
  $('sendTraitorChatBtn').addEventListener('click', sendTraitorChat);
  $('nextRoundBtn').addEventListener('click', startNextRound);
  $('playAgainBtn').addEventListener('click', resetToLobby);

  if (state.roomCode && state.playerId) {
    reconnectToRoom(state.roomCode, state.playerId);
  }
});

// =======================================================
// 6. CREAZIONE, INGRESSO E RICONNESSIONE STANZA
// =======================================================
async function createRoom() {
  const name = $('playerNameInput').value.trim();
  if (!name) return showToast('Inserisci il tuo nome prima di creare la stanza');

  playTone(620, 0.2);
  const code = generateRoomCode();
  const pid = 'p_' + generateId(8);

  const roomPayload = {
    meta: {
      hostId: pid,
      phase: 'LOBBY',
      round: 1,
      missionDeck: getShuffledMissionDeck(),
      deckCursor: 0,
      shieldWinnerId: null,
      exiledInfo: null,
      morningInfo: null,
      winner: null
    },
    players: {
      [pid]: {
        name,
        avatar: state.selectedAvatar,
        alive: true,
        online: true,
        ready: false,
        votedFor: null,
        missionScore: null
      }
    }
  };

  await db.ref(`rooms/${code}`).set(roomPayload);
  saveSessionAndListen(code, pid);
}

async function joinRoom() {
  const name = $('playerNameInput').value.trim();
  const code = $('roomCodeInput').value.trim().toUpperCase();
  if (!name) return showToast('Inserisci il tuo nome');
  if (code.length !== 4) return showToast('Inserisci il codice stanza di 4 lettere');

  const snap = await db.ref(`rooms/${code}`).get();
  if (!snap.exists()) return showToast('Stanza non trovata');

  const room = snap.val();
  const players = room.players || {};
  if (room.meta.phase !== 'LOBBY') return showToast('La partita è già iniziata!');
  if (Object.keys(players).length >= 10) return showToast('Stanza piena (max 10 giocatori)');

  playTone(620, 0.2);
  const pid = 'p_' + generateId(8);
  await db.ref(`rooms/${code}/players/${pid}`).set({
    name,
    avatar: state.selectedAvatar,
    alive: true,
    online: true,
    ready: false,
    votedFor: null,
    missionScore: null
  });

  saveSessionAndListen(code, pid);
}

async function reconnectToRoom(code, pid) {
  const snap = await db.ref(`rooms/${code}/players/${pid}`).get();
  if (!snap.exists()) {
    clearSession();
    return;
  }
  saveSessionAndListen(code, pid);
}

function saveSessionAndListen(code, pid) {
  state.roomCode = code;
  state.playerId = pid;
  localStorage.setItem('trd_room', code);
  localStorage.setItem('trd_pid', pid);

  $('roomBadge').textContent = `STANZA: ${code}`;
  $('roomBadge').classList.remove('hidden');
  $('leaveBtn').classList.remove('hidden');

  const playerOnlineRef = db.ref(`rooms/${code}/players/${pid}/online`);
  playerOnlineRef.set(true);
  playerOnlineRef.onDisconnect().set(false);

  state.secretRef = db.ref(`rooms/${code}/secrets/${pid}`);
  state.secretRef.on('value', (snap) => {
    state.mySecret = snap.val();
    if (state.roomData) renderCurrentPhase();
  });

  state.roomRef = db.ref(`rooms/${code}`);
  state.roomRef.on('value', (snap) => {
    if (!snap.exists()) {
      showToast('La stanza è stata chiusa');
      leaveRoom();
      return;
    }
    state.roomData = snap.val();
    renderCurrentPhase();
  });
}

function clearSession() {
  if (state.roomRef) state.roomRef.off();
  if (state.secretRef) state.secretRef.off();
  localStorage.removeItem('trd_room');
  localStorage.removeItem('trd_pid');
  state.roomCode = null;
  state.playerId = null;
  state.roomData = null;
  state.mySecret = null;
  state.roleRevealedLocally = false;
  $('roomBadge').classList.add('hidden');
  $('leaveBtn').classList.add('hidden');
  $('spectatorBanner').classList.add('hidden');
}

function leaveRoom() {
  if (state.roomCode && state.playerId) {
    db.ref(`rooms/${state.roomCode}/players/${state.playerId}/online`).set(false);
  }
  clearSession();
  showScreen('screen-home');
}

// =======================================================
// 7. MOTORE DI RENDERING DELLE FASI
// =======================================================
function renderCurrentPhase() {
  const room = state.roomData;
  if (!room) return;

  const { meta, players = {} } = room;
  const me = players[state.playerId];
  if (!me) return leaveRoom();

  const isHost = meta.hostId === state.playerId;

  document.querySelectorAll('.round-num').forEach(el => el.textContent = meta.round);

  if (!me.alive && meta.phase !== 'GAME_OVER' && meta.phase !== 'LOBBY') {
    $('spectatorBanner').classList.remove('hidden');
  } else {
    $('spectatorBanner').classList.add('hidden');
  }

  switch (meta.phase) {
    case 'LOBBY':
      renderLobby(room, isHost);
      break;
    case 'ROLE_REVEAL':
      renderRolePhase(room);
      break;
    case 'MISSION':
      renderMissionPhase(room, isHost);
      break;
    case 'VOTING':
      renderVotingPhase(room);
      break;
    case 'EXILE':
      renderExilePhase(room, isHost);
      break;
    case 'NIGHT':
      renderNightPhase(room);
      break;
    case 'MORNING':
      renderMorningPhase(room, isHost);
      break;
    case 'GAME_OVER':
      renderGameOverPhase(room, isHost);
      break;
  }
}

// --- LOBBY ---
function renderLobby(room, isHost) {
  showScreen('screen-lobby');
  state.roleRevealedLocally = false;
  $('lobbyCodeDisplay').textContent = state.roomCode;

  const entries = Object.entries(room.players || {});
  const count = entries.length;
  $('playerCount').textContent = count;

  if (count < 3) {
    $('rolePreviewBadge').textContent = 'Min. 3 giocatori';
  } else if (count <= 4) {
    $('rolePreviewBadge').textContent = '1 Traditore (Modalità Blitz)';
  } else if (count <= 7) {
    $('rolePreviewBadge').textContent = '1 Traditore vs Fedeli';
  } else {
    $('rolePreviewBadge').textContent = '2 Traditori (Modalità Complotto)';
  }

  const list = $('lobbyPlayerList');
  list.innerHTML = '';
  entries.forEach(([id, p]) => {
    const li = document.createElement('li');
    li.className = 'player-item';
    li.innerHTML = `
      <div class="player-left">
        <span>${p.avatar}</span>
        <span>${p.name} ${id === room.meta.hostId ? '👑' : ''}</span>
      </div>
      <span class="status-dot ${p.online ? '' : 'offline'}"></span>
    `;
    list.appendChild(li);
  });

  if (isHost) {
    $('hostLobbyControls').classList.remove('hidden');
    $('guestLobbyWait').classList.add('hidden');
    const btn = $('startGameBtn');
    btn.disabled = count < 3;
    btn.textContent = count < 3 ? `Servono almeno 3 giocatori (${count}/3)` : `Inizia Partita (${count} Giocatori)`;
  } else {
    $('hostLobbyControls').classList.add('hidden');
    $('guestLobbyWait').classList.remove('hidden');
  }
}

// --- ASSEGNAZIONE RUOLI & NUOVO MAZZO MISSIONI (HOST) ---
async function startGame() {
  const players = state.roomData.players || {};
  const ids = Object.keys(players);
  if (ids.length < 3) return;

  const shuffled = [...ids].sort(() => Math.random() - 0.5);
  const traitorCount = ids.length >= 8 ? 2 : 1;
  const traitorIds = shuffled.slice(0, traitorCount);

  const updates = {};
  ids.forEach(id => {
    const isTraitor = traitorIds.includes(id);
    const allies = isTraitor ? traitorIds.filter(tid => tid !== id).map(tid => players[tid].name) : [];
    updates[`rooms/${state.roomCode}/secrets/${id}`] = {
      role: isTraitor ? 'TRAITOR' : 'FAITHFUL',
      hasShield: false,
      allies
    };
    updates[`rooms/${state.roomCode}/players/${id}/alive`] = true;
    updates[`rooms/${state.roomCode}/players/${id}/ready`] = false;
    updates[`rooms/${state.roomCode}/players/${id}/votedFor`] = null;
    updates[`rooms/${state.roomCode}/players/${id}/missionScore`] = null;
  });

  updates[`rooms/${state.roomCode}/meta/phase`] = 'ROLE_REVEAL';
  updates[`rooms/${state.roomCode}/meta/round`] = 1;
  updates[`rooms/${state.roomCode}/meta/missionDeck`] = getShuffledMissionDeck();
  updates[`rooms/${state.roomCode}/meta/deckCursor`] = 0;

  await db.ref().update(updates);
}

// --- RIVELAZIONE RUOLO ---
function renderRolePhase(room) {
  showScreen('screen-role');
  const players = Object.values(room.players || {});
  const readyCount = players.filter(p => p.ready).length;
  $('roleReadyCounter').textContent = `Giocatori pronti: ${readyCount}/${players.length}`;

  if (state.roleRevealedLocally) {
    renderRoleCard();
    $('confirmRoleBtn').classList.remove('hidden');
    $('confirmRoleBtn').disabled = !!room.players[state.playerId]?.ready;
  } else {
    $('secretRoleCard').className = 'secret-card';
    $('secretRoleCard').querySelector('.secret-card-front').classList.remove('hidden');
    $('secretRoleBack').classList.add('hidden');
    $('confirmRoleBtn').classList.add('hidden');
  }
}

function renderRoleCard() {
  if (!state.mySecret) return;
  const isTraitor = state.mySecret.role === 'TRAITOR';
  const card = $('secretRoleCard');
  card.querySelector('.secret-card-front').classList.add('hidden');
  $('secretRoleBack').classList.remove('hidden');

  card.className = `secret-card ${isTraitor ? 'revealed-traitor' : 'revealed-faithful'}`;
  $('roleBadgeType').textContent = isTraitor ? 'TRADITORE' : 'FEDELE';
  $('roleTitle').textContent = isTraitor ? 'SEI UN TRADITORE' : 'SEI UN FEDELE';
  $('roleDescription').textContent = isTraitor
    ? 'Inganna il gruppo alla Tavola Rotonda ed elimina i Fedeli durante la notte senza farti scoprire.'
    : 'Collabora alle missioni, osserva i comportamenti sospetti ed esilia i Traditori alla Tavola Rotonda.';

  const allyBox = $('fellowTraitorBox');
  if (isTraitor && state.mySecret.allies && state.mySecret.allies.length > 0) {
    allyBox.textContent = `Il tuo complice segreto è: ${state.mySecret.allies.join(', ')}`;
    allyBox.classList.remove('hidden');
  } else {
    allyBox.classList.add('hidden');
  }
}

async function checkAllPlayersReadyForMission() {
  const snap = await db.ref(`rooms/${state.roomCode}/players`).get();
  const players = Object.values(snap.val() || {});
  if (players.every(p => p.ready)) {
    await db.ref(`rooms/${state.roomCode}/meta/phase`).set('MISSION');
  }
}

// --- MISSIONE SCUDO ---
function getCurrentMission(room) {
  const deck = room.meta.missionDeck || getShuffledMissionDeck();
  const cursor = room.meta.deckCursor || 0;
  const missionIdx = deck[cursor % deck.length];
  return SHIELD_MISSIONS[missionIdx];
}

function renderMissionPhase(room, isHost) {
  showScreen('screen-mission');
  const me = room.players[state.playerId];
  const mission = getCurrentMission(room);

  $('hostMissionNext').classList.toggle('hidden', !isHost);
  $('missionCategoryTag').textContent = mission.cat;
  $('missionQuestion').textContent = mission.q;

  if (me.missionScore !== null && me.missionScore !== undefined) {
    state.missionAnswered = true;
  }

  const optionsDiv = $('missionOptions');
  if (!state.missionAnswered) {
    optionsDiv.innerHTML = '';
    $('missionFeedback').classList.add('hidden');
    const startTime = Date.now();
    mission.options.forEach((optText, idx) => {
      const btn = document.createElement('button');
      btn.className = 'mission-opt-btn';
      btn.textContent = optText;
      btn.onclick = async () => {
        if (state.missionAnswered || !me.alive) return;
        state.missionAnswered = true;
        const isCorrect = idx === mission.answer;
        btn.classList.add(isCorrect ? 'correct' : 'wrong');
        playTone(isCorrect ? 680 : 210, 0.25);

        const elapsed = Date.now() - startTime;
        const score = isCorrect ? Math.max(100, 10000 - elapsed) : 0;

        $('missionFeedback').textContent = isCorrect
          ? 'Risposta esatta! Attendi gli altri giocatori...'
          : 'Risposta errata! Non puoi ottenere lo Scudo in questo round.';
        $('missionFeedback').classList.remove('hidden');

        await db.ref(`rooms/${state.roomCode}/players/${state.playerId}/missionScore`).set(score);
        evaluateMissionCompletion();
      };
      optionsDiv.appendChild(btn);
    });
  }
}

async function evaluateMissionCompletion() {
  const snap = await db.ref(`rooms/${state.roomCode}`).get();
  const room = snap.val();
  if (!room || room.meta.phase !== 'MISSION') return;

  const aliveEntries = Object.entries(room.players || {}).filter(([, p]) => p.alive);
  const allAnswered = aliveEntries.every(([, p]) => p.missionScore !== null && p.missionScore !== undefined);

  if (allAnswered) {
    let bestId = null;
    let bestScore = 0;
    aliveEntries.forEach(([id, p]) => {
      if (p.missionScore > bestScore) {
        bestScore = p.missionScore;
        bestId = id;
      }
    });

    const updates = {};
    Object.keys(room.players).forEach(id => {
      updates[`rooms/${state.roomCode}/secrets/${id}/hasShield`] = (id === bestId);
    });
    updates[`rooms/${state.roomCode}/meta/shieldWinnerId`] = bestId;
    updates[`rooms/${state.roomCode}/meta/phase`] = 'VOTING';
    await db.ref().update(updates);
  }
}

// --- TAVOLA ROTONDA & VOTO ---
function renderVotingPhase(room) {
  showScreen('screen-voting');
  state.missionAnswered = false;
  const me = room.players[state.playerId];

  if (state.mySecret && state.mySecret.hasShield && me.alive) {
    $('shieldStatusBanner').classList.remove('hidden');
  } else {
    $('shieldStatusBanner').classList.add('hidden');
  }

  const aliveEntries = Object.entries(room.players || {}).filter(([, p]) => p.alive);
  const votedCount = aliveEntries.filter(([, p]) => !!p.votedFor).length;
  $('voteProgressText').textContent = `Voti registrati: ${votedCount}/${aliveEntries.length}`;

  const grid = $('votingGrid');
  grid.innerHTML = '';

  aliveEntries.forEach(([id, p]) => {
    if (id === state.playerId) return;
    const card = document.createElement('div');
    const currentSelected = me.votedFor || state.selectedVoteId;
    card.className = `vote-card ${currentSelected === id ? 'selected' : ''}`;
    card.innerHTML = `
      <span class="v-avatar">${p.avatar}</span>
      <span class="v-name">${p.name}</span>
    `;
    if (me.alive && !me.votedFor) {
      card.onclick = () => {
        state.selectedVoteId = id;
        playTone(460, 0.1);
        renderVotingPhase(room);
      };
    }
    grid.appendChild(card);
  });

  const voteBtn = $('confirmVoteBtn');
  if (!me.alive) {
    voteBtn.disabled = true;
    voteBtn.textContent = 'Gli Spettri non possono votare';
  } else if (me.votedFor) {
    voteBtn.disabled = true;
    voteBtn.textContent = 'Voto Registrato ✓';
  } else {
    voteBtn.disabled = !state.selectedVoteId;
    voteBtn.textContent = 'Conferma Voto';
  }
}

async function submitVote() {
  if (!state.selectedVoteId) return;
  playTone(300, 0.25, 'triangle');
  await db.ref(`rooms/${state.roomCode}/players/${state.playerId}/votedFor`).set(state.selectedVoteId);
  state.selectedVoteId = null;

  const snap = await db.ref(`rooms/${state.roomCode}`).get();
  const room = snap.val();
  const aliveEntries = Object.entries(room.players || {}).filter(([, p]) => p.alive);
  if (aliveEntries.every(([, p]) => !!p.votedFor)) {
    resolveRoundTableVotes(room, aliveEntries);
  }
}

async function resolveRoundTableVotes(room, aliveEntries) {
  const tally = {};
  aliveEntries.forEach(([, p]) => {
    tally[p.votedFor] = (tally[p.votedFor] || 0) + 1;
  });

  let maxVotes = 0;
  let topCandidates = [];
  Object.entries(tally).forEach(([targetId, count]) => {
    if (count > maxVotes) {
      maxVotes = count;
      topCandidates = [targetId];
    } else if (count === maxVotes) {
      topCandidates.push(targetId);
    }
  });

  const updates = {};
  if (topCandidates.length > 1) {
    updates[`rooms/${state.roomCode}/meta/exiledInfo`] = {
      tie: true,
      name: 'Parità di voti!',
      avatar: '⚖️',
      role: null
    };
  } else {
    const exiledId = topCandidates[0];
    const exiledPlayer = room.players[exiledId];
    const secretSnap = await db.ref(`rooms/${state.roomCode}/secrets/${exiledId}`).get();
    const exiledRole = secretSnap.val()?.role || 'FAITHFUL';

    updates[`rooms/${state.roomCode}/players/${exiledId}/alive`] = false;
    updates[`rooms/${state.roomCode}/meta/exiledInfo`] = {
      tie: false,
      id: exiledId,
      name: exiledPlayer.name,
      avatar: exiledPlayer.avatar,
      role: exiledRole
    };
  }

  Object.keys(room.players).forEach(id => {
    updates[`rooms/${state.roomCode}/players/${id}/votedFor`] = null;
  });

  updates[`rooms/${state.roomCode}/meta/phase`] = 'EXILE';
  await db.ref().update(updates);

  checkWinConditions();
}

// --- ESILIO ---
function renderExilePhase(room, isHost) {
  showScreen('screen-exile');
  const info = room.meta.exiledInfo;
  if (!info) return;

  $('exileAvatar').textContent = info.avatar;
  const badge = $('exileRoleReveal');

  if (info.tie) {
    $('exileAnnouncement').textContent = 'Nessun Esilio!';
    badge.textContent = 'PARITÀ ALLA TAVOLA ROTONDA';
    badge.className = 'revealed-role-pill';
    $('exileSubtext').textContent = 'Il gruppo non ha raggiunto una maggioranza. Nessuno lascia il castello.';
  } else {
    const isTraitor = info.role === 'TRAITOR';
    $('exileAnnouncement').textContent = `${info.name} è stato esiliato`;
    badge.textContent = isTraitor ? 'ERA UN TRADITORE!' : 'ERA UN FEDELE';
    badge.className = `revealed-role-pill ${isTraitor ? 'traitor' : 'faithful'}`;
    $('exileSubtext').textContent = isTraitor
      ? 'Ottimo lavoro! Avete smascherato un ingannatore.'
      : 'Avete esiliato un innocente. I Traditori ringraziano...';
  }

  $('hostExileNext').classList.toggle('hidden', !isHost);
  $('guestExileWait').classList.toggle('hidden', isHost);
}

// --- FASE NOTTE ---
function renderNightPhase(room) {
  showScreen('screen-night');
  const me = room.players[state.playerId];
  const isTraitor = state.mySecret?.role === 'TRAITOR' && me.alive;
  const totalPlayers = Object.keys(room.players || {}).length;
  const isBlitzFirstNight = totalPlayers <= 4 && room.meta.round === 1;

  if (isTraitor) {
    $('nightTraitorView').classList.remove('hidden');
    $('nightFaithfulView').classList.add('hidden');

    if (isBlitzFirstNight) {
      $('nightTraitorTitle').textContent = 'Notte Blitz: Sabotaggio';
      $('nightTraitorDesc').textContent = 'In partite da 3–4 giocatori non si elimina alla prima notte: scegli chi intimidire!';
    } else {
      $('nightTraitorTitle').textContent = 'Scegli la vittima della notte';
      $('nightTraitorDesc').textContent = 'Se possiede lo Scudo, sopravviverà fino all’alba.';
    }

    const hasAllies = state.mySecret.allies && state.mySecret.allies.length > 0;
    $('traitorChatBox').classList.toggle('hidden', !hasAllies);
    if (hasAllies) renderTraitorChat(room.nightChat || {});

    const grid = $('nightTargetGrid');
    grid.innerHTML = '';
    Object.entries(room.players || {}).forEach(([id, p]) => {
      if (!p.alive || id === state.playerId) return;
      if (state.mySecret.allies && state.mySecret.allies.includes(p.name)) return;

      const card = document.createElement('div');
      card.className = `vote-card ${state.selectedNightTargetId === id ? 'selected' : ''}`;
      card.innerHTML = `
        <span class="v-avatar">${p.avatar}</span>
        <span class="v-name">${p.name}</span>
      `;
      card.onclick = () => {
        state.selectedNightTargetId = id;
        playTone(260, 0.15);
        renderNightPhase(room);
      };
      grid.appendChild(card);
    });

    $('confirmNightKillBtn').disabled = !state.selectedNightTargetId;
  } else {
    $('nightTraitorView').classList.add('hidden');
    $('nightFaithfulView').classList.remove('hidden');

    const decoyGrid = $('decoyOptions');
    decoyGrid.innerHTML = '';
    Object.entries(room.players || {}).forEach(([id, p]) => {
      if (!p.alive || id === state.playerId) return;
      const chip = document.createElement('button');
      chip.className = 'decoy-chip';
      chip.textContent = `${p.avatar} ${p.name}`;
      chip.onclick = () => {
        document.querySelectorAll('.decoy-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        playTone(500, 0.08);
      };
      decoyGrid.appendChild(chip);
    });
  }
}

function renderTraitorChat(chatObj) {
  const box = $('traitorMessages');
  box.innerHTML = '';
  Object.values(chatObj).forEach(msg => {
    const div = document.createElement('div');
    div.className = 'chat-msg';
    div.innerHTML = `<strong>${msg.from}:</strong> ${msg.text}`;
    box.appendChild(div);
  });
  box.scrollTop = box.scrollHeight;
}

async function sendTraitorChat() {
  const input = $('traitorChatInput');
  const text = input.value.trim();
  if (!text) return;
  const myName = state.roomData.players[state.playerId].name;
  input.value = '';
  await db.ref(`rooms/${state.roomCode}/nightChat`).push({ from: myName, text });
}

async function submitNightAction() {
  if (!state.selectedNightTargetId) return;
  const room = state.roomData;
  const targetId = state.selectedNightTargetId;
  const targetPlayer = room.players[targetId];
  state.selectedNightTargetId = null;

  const totalPlayers = Object.keys(room.players || {}).length;
  const isBlitzFirstNight = totalPlayers <= 4 && room.meta.round === 1;
  const protectedByShield = room.meta.shieldWinnerId === targetId;

  const updates = {
    [`rooms/${state.roomCode}/nightChat`]: null
  };

  if (isBlitzFirstNight) {
    updates[`rooms/${state.roomCode}/meta/morningInfo`] = {
      eliminated: false,
      icon: '🗡️',
      title: 'Notte di Avvertimento!',
      text: `I Traditori hanno lasciato un pugnale sul cuscino di ${targetPlayer.name}, ma nella prima notte Blitz nessuno viene eliminato.`
    };
  } else if (protectedByShield) {
    updates[`rooms/${state.roomCode}/meta/morningInfo`] = {
      eliminated: false,
      icon: '🛡️',
      title: 'Nessuno è stato eliminato!',
      text: 'I Traditori hanno colpito nell’ombra, ma lo Scudo segreto ha salvato la vittima!'
    };
  } else {
    updates[`rooms/${state.roomCode}/players/${targetId}/alive`] = false;
    updates[`rooms/${state.roomCode}/meta/morningInfo`] = {
      eliminated: true,
      icon: targetPlayer.avatar,
      title: `${targetPlayer.name} non si è svegliato`,
      text: 'I Traditori hanno colpito durante la notte. Era un FEDELE.'
    };
  }

  updates[`rooms/${state.roomCode}/meta/phase`] = 'MORNING';
  await db.ref().update(updates);
  checkWinConditions();
}

// --- ALBA ---
function renderMorningPhase(room, isHost) {
  showScreen('screen-morning');
  const info = room.meta.morningInfo;
  if (!info) return;

  $('morningIcon').textContent = info.icon;
  $('morningTitle').textContent = info.title;
  $('morningText').textContent = info.text;

  const badge = $('morningRoleBadge');
  if (info.eliminated) {
    badge.textContent = 'VITTIMA DELLA NOTTE • FEDELE';
    badge.className = 'revealed-role-pill faithful';
  } else {
    badge.classList.add('hidden');
  }

  $('hostMorningNext').classList.toggle('hidden', !isHost);
  $('guestMorningWait').classList.toggle('hidden', isHost);
}

async function startNextRound() {
  const room = state.roomData;
  const nextRound = room.meta.round + 1;
  const nextCursor = (room.meta.deckCursor || 0) + 1;

  const updates = {
    [`rooms/${state.roomCode}/meta/round`]: nextRound,
    [`rooms/${state.roomCode}/meta/deckCursor`]: nextCursor,
    [`rooms/${state.roomCode}/meta/shieldWinnerId`]: null,
    [`rooms/${state.roomCode}/meta/phase`]: 'MISSION'
  };

  Object.keys(room.players).forEach(id => {
    updates[`rooms/${state.roomCode}/players/${id}/missionScore`] = null;
    updates[`rooms/${state.roomCode}/secrets/${id}/hasShield`] = false;
  });

  await db.ref().update(updates);
}

// --- CONTROLLO VITTORIA ---
async function checkWinConditions() {
  const snap = await db.ref(`rooms/${state.roomCode}`).get();
  const room = snap.val();
  if (!room || room.meta.phase === 'GAME_OVER') return;

  const aliveIds = Object.entries(room.players || {})
    .filter(([, p]) => p.alive)
    .map(([id]) => id);

  let aliveTraitors = 0;
  let aliveFaithfuls = 0;

  aliveIds.forEach(id => {
    const role = room.secrets?.[id]?.role;
    if (role === 'TRAITOR') aliveTraitors++;
    else aliveFaithfuls++;
  });

  if (aliveTraitors === 0) {
    await db.ref(`rooms/${state.roomCode}/meta`).update({
      phase: 'GAME_OVER',
      winner: 'FAITHFUL'
    });
  } else if (aliveTraitors >= aliveFaithfuls) {
    await db.ref(`rooms/${state.roomCode}/meta`).update({
      phase: 'GAME_OVER',
      winner: 'TRAITOR'
    });
  }
}

// --- FINE PARTITA ---
function renderGameOverPhase(room, isHost) {
  showScreen('screen-gameover');
  const faithfulWon = room.meta.winner === 'FAITHFUL';

  $('winnerIcon').textContent = faithfulWon ? '👑' : '🗡️';
  $('winnerHeadline').textContent = faithfulWon ? 'VINCONO I FEDELI!' : 'VINCONO I TRADITORI!';
  $('winnerSummary').textContent = faithfulWon
    ? 'Tutti i Traditori sono stati smascherati ed esiliati dal castello.'
    : 'I Traditori hanno raggiunto la parità numerica e preso il controllo del gioco.';

  const list = $('finalRolesList');
  list.innerHTML = '';
  Object.entries(room.players || {}).forEach(([id, p]) => {
    const isTraitor = room.secrets?.[id]?.role === 'TRAITOR';
    const li = document.createElement('li');
    li.className = 'player-item';
    li.innerHTML = `
      <div class="player-left">
        <span>${p.avatar}</span>
        <span>${p.name} ${p.alive ? '' : '(Eliminato)'}</span>
      </div>
      <span class="pill" style="color: ${isTraitor ? '#ff4d6d' : '#58a6ff'}; font-weight:700;">
        ${isTraitor ? 'TRADITORE' : 'FEDELE'}
      </span>
    `;
    list.appendChild(li);
  });

  $('hostGameOverControls').classList.toggle('hidden', !isHost);
}

async function resetToLobby() {
  const room = state.roomData;
  const updates = {
    [`rooms/${state.roomCode}/meta/phase`]: 'LOBBY',
    [`rooms/${state.roomCode}/meta/round`]: 1,
    [`rooms/${state.roomCode}/meta/shieldWinnerId`]: null,
    [`rooms/${state.roomCode}/meta/exiledInfo`]: null,
    [`rooms/${state.roomCode}/meta/morningInfo`]: null,
    [`rooms/${state.roomCode}/meta/winner`]: null,
    [`rooms/${state.roomCode}/secrets`]: null
  };

  Object.keys(room.players || {}).forEach(id => {
    updates[`rooms/${state.roomCode}/players/${id}/alive`] = true;
    updates[`rooms/${state.roomCode}/players/${id}/ready`] = false;
    updates[`rooms/${state.roomCode}/players/${id}/votedFor`] = null;
    updates[`rooms/${state.roomCode}/players/${id}/missionScore`] = null;
  });

  await db.ref().update(updates);
      }

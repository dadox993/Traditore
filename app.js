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

const MAX_PLAYERS = 15;
const MISSION_DURATION_MS = 30000;
const SHIELD_IMG = "shield_3d.jpg";
const MONOCLE_IMG = "cannocchiale.jpg";
const JUSTICIAR_IMG = "giustiziere.jpg";
const ANON_AVATAR = "avataranonimo.jpg";

const TRAITOR_PERSONA = {
  avatar: "traditore.jpeg",
  label: "TRADITORE"
};

const FAITHFUL_PERSONAS = [
  { avatar: "re.jpeg", label: "Re" },
  { avatar: "regina.jpeg", label: "Regina" },
  { avatar: "prete.jpeg", label: "Prete" },
  { avatar: "cacciatore.jpeg", label: "Cacciatore" },
  { avatar: "contadino.jpeg", label: "Contadino" },
  { avatar: "giudice.jpeg", label: "Giudice" },
  { avatar: "meretrice.jpeg", label: "Meretrice" },
  { avatar: "maestra.jpeg", label: "Maestra" },
  { avatar: "cavaliere.jpeg", label: "Cavaliere" }
];

const TRAITOR_SPY_CLUES = [
  "Attraverso la lente vedi una candela accesa fino a tardi e una pergamena bruciata nel camino...",
  "Il suo sguardo sfugge alle torce della sala: sembra nascondere un secondo fine.",
  "Hai scorto un bagliore metallico sotto il mantello, ma l'ombra ha subito coperto la scena.",
  "Sussurra nell'oscurità: i suoi passi non seguono quelli del resto del regno."
];

const FAITHFUL_SPY_CLUES = [
  "Attraverso la lente osservi un passo fermo e lo sguardo rivolto verso le mura del regno.",
  "Le sue mani sono pulite alla luce delle torce, anche se la tensione della notte lo tradisce.",
  "Sembra cercare risposte tra la folla, ignaro delle trame che si muovono alle sue spalle.",
  "Non hai scorto alcuna lama nell'ombra: il suo animo appare limpido."
];

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
  } catch (e) { /* Ignora restrizioni autoplay */ }
}

function playCueSound(cueType) {
  if (!soundEnabled) return;
  if (cueType === 'JUSTICIAR_CHARGE') {
    playTone(196, 0.22, 'sawtooth');
    setTimeout(() => playTone(261.6, 0.34, 'triangle'), 160);
  } else if (cueType === 'MORNING_SAFE') {
    playTone(523.25, 0.2, 'sine');
    setTimeout(() => playTone(659.25, 0.28, 'sine'), 140);
  } else if (cueType === 'MORNING_VICTIM') {
    playTone(220, 0.28, 'triangle');
    setTimeout(() => playTone(164.8, 0.38, 'sawtooth'), 180);
  }
}

// =======================================================
// 3. MAZZO DI 200 MISSIONI UNICHE (BREVE, 1 RIGA)
// =======================================================
const SHIELD_MISSIONS = [
  // 1-50: CULTURA GENERALE
  { cat: "CULTURA", q: "Qual è la capitale del Giappone?", options: ["Tokyo", "Kyoto", "Osaka", "Seoul"], answer: 0 },
  { cat: "CULTURA", q: "Quanti colori ha l'arcobaleno?", options: ["7", "5", "6", "8"], answer: 0 },
  { cat: "CULTURA", q: "Qual è l'oceano più grande del mondo?", options: ["Pacifico", "Atlantico", "Indiano", "Artico"], answer: 0 },
  { cat: "CULTURA", q: "In quale città si trova il Colosseo?", options: ["Roma", "Milano", "Napoli", "Firenze"], answer: 0 },
  { cat: "CULTURA", q: "Qual è la lingua più parlata al mondo per madrelingua?", options: ["Cinese mandarino", "Spagnolo", "Inglese", "Arabo"], answer: 0 },
  { cat: "CULTURA", q: "Quale animale è il simbolo del WWF?", options: ["Panda gigante", "Tigre", "Elefante", "Lupo"], answer: 0 },
  { cat: "CULTURA", q: "Quanti tasti ha un pianoforte standard?", options: ["88", "76", "92", "64"], answer: 0 },
  { cat: "CULTURA", q: "Qual è la moneta del Regno Unito?", options: ["Sterlina", "Euro", "Dollaro", "Franco"], answer: 0 },
  { cat: "CULTURA", q: "In quale paese si trova Machu Picchu?", options: ["Perù", "Cile", "Bolivia", "Colombia"], answer: 0 },
  { cat: "CULTURA", q: "Qual è il metallo più prezioso tra questi?", options: ["Oro", "Rame", "Ferro", "Alluminio"], answer: 0 },
  { cat: "CULTURA", q: "Quanti giocatori ha una squadra di calcio in campo?", options: ["11", "10", "9", "12"], answer: 0 },
  { cat: "CULTURA", q: "Qual è la capitale della Francia?", options: ["Parigi", "Lione", "Marsiglia", "Nizza"], answer: 0 },
  { cat: "CULTURA", q: "Quale sport si gioca a Wimbledon?", options: ["Tennis", "Golf", "Cricket", "Rugby"], answer: 0 },
  { cat: "CULTURA", q: "Quante stelle ha la bandiera dell'UE?", options: ["12", "10", "15", "27"], answer: 0 },
  { cat: "CULTURA", q: "Qual è l'isola più grande del Mediterraneo?", options: ["Sicilia", "Sardegna", "Creta", "Cipro"], answer: 0 },
  { cat: "CULTURA", q: "Quale strumento misura i terremoti?", options: ["Sismografo", "Barometro", "Igrometro", "Anemometro"], answer: 0 },
  { cat: "CULTURA", q: "In quale città italiana c'è Piazza San Marco?", options: ["Venezia", "Verona", "Torino", "Genova"], answer: 0 },
  { cat: "CULTURA", q: "Qual è il continente più popolato?", options: ["Asia", "Africa", "Europa", "America"], answer: 0 },
  { cat: "CULTURA", q: "Quanti giorni ha un anno bisestile?", options: ["366", "365", "364", "360"], answer: 0 },
  { cat: "CULTURA", q: "Quale frutta dà origine all'uva passa?", options: ["Uva", "Fico", "Prugna", "Dattero"], answer: 0 },
  { cat: "CULTURA", q: "Qual è la capitale della Spagna?", options: ["Madrid", "Barcellona", "Siviglia", "Valencia"], answer: 0 },
  { cat: "CULTURA", q: "Quale animale è noto per cambiare colore?", options: ["Camaleonte", "Geco", "Iguana", "Salamandra"], answer: 0 },
  { cat: "CULTURA", q: "Quanti minuti ha un'ora?", options: ["60", "100", "30", "90"], answer: 0 },
  { cat: "CULTURA", q: "Quale fiume attraversa Londra?", options: ["Tamigi", "Senna", "Danubio", "Reno"], answer: 0 },
  { cat: "CULTURA", q: "Qual è la capitale della Germania?", options: ["Berlino", "Monaco", "Amburgo", "Francoforte"], answer: 0 },
  { cat: "CULTURA", q: "Quanti anelli ha il logo olimpico?", options: ["5", "4", "6", "7"], answer: 0 },
  { cat: "CULTURA", q: "Quale paese ha forma di stivale?", options: ["Italia", "Grecia", "Portogallo", "Croazia"], answer: 0 },
  { cat: "CULTURA", q: "Qual è il mammifero terrestre più veloce?", options: ["Ghepardo", "Leone", "Gazzella", "Cavallo"], answer: 0 },
  { cat: "CULTURA", q: "Qual è la capitale della Grecia?", options: ["Atene", "Salonicco", "Sparta", "Patrasso"], answer: 0 },
  { cat: "CULTURA", q: "Quanti lati ha un esagono?", options: ["6", "5", "7", "8"], answer: 0 },
  { cat: "CULTURA", q: "Quale mare bagna la costa adriatica?", options: ["Mare Adriatico", "Mar Nero", "Mar Rosso", "Mar Baltico"], answer: 0 },
  { cat: "CULTURA", q: "Qual è la capitale del Portogallo?", options: ["Lisbona", "Porto", "Faro", "Coimbra"], answer: 0 },
  { cat: "CULTURA", q: "Quale uccello non sa volare?", options: ["Pinguino", "Aquila", "Gabbiano", "Rondine"], answer: 0 },
  { cat: "CULTURA", q: "In quale stagione cadono le foglie?", options: ["Autunno", "Estate", "Primavera", "Inverno"], answer: 0 },
  { cat: "CULTURA", q: "Qual è il deserto caldo più grande del mondo?", options: ["Sahara", "Gobi", "Kalahari", "Atacama"], answer: 0 },
  { cat: "CULTURA", q: "Qual è la capitale dell'Egitto?", options: ["Il Cairo", "Alessandria", "Luxor", "Giza"], answer: 0 },
  { cat: "CULTURA", q: "Quanti mesi ha un anno?", options: ["12", "10", "11", "13"], answer: 0 },
  { cat: "CULTURA", q: "Quale spezia è ricavata dai fiori del croco?", options: ["Zafferano", "Curcuma", "Cannella", "Cardamomo"], answer: 0 },
  { cat: "CULTURA", q: "Qual è la capitale della Svizzera?", options: ["Berna", "Zurigo", "Ginevra", "Basilea"], answer: 0 },
  { cat: "CULTURA", q: "Quale strumento ha sei corde di solito?", options: ["Chitarra", "Violino", "Arpa", "Contrabbasso"], answer: 0 },
  { cat: "CULTURA", q: "Qual è l'animale più grande del pianeta?", options: ["Balenottera azzurra", "Elefante africano", "Squalo balena", "Giraffa"], answer: 0 },
  { cat: "CULTURA", q: "Qual è la capitale dell'Austria?", options: ["Vienna", "Salisburgo", "Graz", "Innsbruck"], answer: 0 },
  { cat: "CULTURA", q: "Quante corde ha un violino standard?", options: ["4", "5", "6", "3"], answer: 0 },
  { cat: "CULTURA", q: "Quale città è famosa per il carnevale in Brasile?", options: ["Rio de Janeiro", "San Paolo", "Brasilia", "Recife"], answer: 0 },
  { cat: "CULTURA", q: "Qual è il metallo liquido a temperatura ambiente?", options: ["Mercurio", "Piombo", "Stagno", "Zinco"], answer: 0 },
  { cat: "CULTURA", q: "Qual è la capitale del Canada?", options: ["Ottawa", "Toronto", "Vancouver", "Montreal"], answer: 0 },
  { cat: "CULTURA", q: "Quale pianta produce i chicchi di caffè?", options: ["Coffea", "Cacao", "Tè", "Vaniglia"], answer: 0 },
  { cat: "CULTURA", q: "Qual è il punto cardinale opposto a Nord?", options: ["Sud", "Est", "Ovest", "Nord-Est"], answer: 0 },
  { cat: "CULTURA", q: "Quale città è chiamata la Serenissima?", options: ["Venezia", "Bologna", "Pisa", "Siena"], answer: 0 },
  { cat: "CULTURA", q: "Quale paese ha come capitale Oslo?", options: ["Norvegia", "Svezia", "Finlandia", "Danimarca"], answer: 0 },

  // 51-100: MATEMATICA
  { cat: "MATEMATICA", q: "Quanto fa 12 × 12?", options: ["144", "124", "132", "148"], answer: 0 },
  { cat: "MATEMATICA", q: "Quanto fa 15 + 28?", options: ["43", "42", "45", "33"], answer: 0 },
  { cat: "MATEMATICA", q: "Quanto fa 100 - 37?", options: ["63", "73", "53", "67"], answer: 0 },
  { cat: "MATEMATICA", q: "Qual è la radice quadrata di 81?", options: ["9", "8", "7", "6"], answer: 0 },
  { cat: "MATEMATICA", q: "Quanto fa 9 × 7?", options: ["63", "56", "72", "64"], answer: 0 },
  { cat: "MATEMATICA", q: "Quanto fa 144 ÷ 12?", options: ["12", "14", "11", "16"], answer: 0 },
  { cat: "MATEMATICA", q: "Quanto vale 2 alla quarta potenza (2⁴)?", options: ["16", "8", "12", "32"], answer: 0 },
  { cat: "MATEMATICA", q: "Quanto fa 25% di 200?", options: ["50", "25", "75", "40"], answer: 0 },
  { cat: "MATEMATICA", q: "Quanto fa 8 × 8 + 6?", options: ["70", "64", "72", "68"], answer: 0 },
  { cat: "MATEMATICA", q: "Qual è il perimetro di un quadrato di lato 5?", options: ["20", "25", "10", "15"], answer: 0 },
  { cat: "MATEMATICA", q: "Quanto fa 18 × 5?", options: ["90", "80", "95", "100"], answer: 0 },
  { cat: "MATEMATICA", q: "Quanto fa 75 + 75?", options: ["150", "140", "160", "125"], answer: 0 },
  { cat: "MATEMATICA", q: "Quanto fa 200 - 85?", options: ["115", "125", "105", "135"], answer: 0 },
  { cat: "MATEMATICA", q: "Qual è il doppio di 46?", options: ["92", "82", "96", "86"], answer: 0 },
  { cat: "MATEMATICA", q: "Qual è la metà di 150?", options: ["75", "70", "80", "65"], answer: 0 },
  { cat: "MATEMATICA", q: "Quanto fa 11 × 11?", options: ["121", "111", "131", "101"], answer: 0 },
  { cat: "MATEMATICA", q: "Quanto fa 6 × 9?", options: ["54", "48", "56", "63"], answer: 0 },
  { cat: "MATEMATICA", q: "Quanto fa 81 ÷ 9?", options: ["9", "8", "7", "11"], answer: 0 },
  { cat: "MATEMATICA", q: "Quanto fa 3³ (3 alla terza)?", options: ["27", "9", "18", "81"], answer: 0 },
  { cat: "MATEMATICA", q: "Quanto fa 50% di 90?", options: ["45", "40", "50", "35"], answer: 0 },
  { cat: "MATEMATICA", q: "Quanto fa 14 + 19 + 7?", options: ["40", "38", "42", "36"], answer: 0 },
  { cat: "MATEMATICA", q: "Quanto fa 1000 - 450?", options: ["550", "650", "450", "500"], answer: 0 },
  { cat: "MATEMATICA", q: "Quanto fa 7 × 12?", options: ["84", "74", "96", "72"], answer: 0 },
  { cat: "MATEMATICA", q: "Qual è la radice quadrata di 64?", options: ["8", "6", "7", "9"], answer: 0 },
  { cat: "MATEMATICA", q: "Quanto fa 13 × 3?", options: ["39", "36", "42", "33"], answer: 0 },
  { cat: "MATEMATICA", q: "Quanto fa 90 ÷ 3?", options: ["30", "20", "40", "25"], answer: 0 },
  { cat: "MATEMATICA", q: "Quanto fa 16 + 24?", options: ["40", "30", "44", "38"], answer: 0 },
  { cat: "MATEMATICA", q: "Quanto fa 10 × 10 × 10?", options: ["1000", "100", "30", "10000"], answer: 0 },
  { cat: "MATEMATICA", q: "Quanto fa 45 - 18?", options: ["27", "23", "29", "37"], answer: 0 },
  { cat: "MATEMATICA", q: "Quanto fa 4 × 15?", options: ["60", "55", "65", "50"], answer: 0 },
  { cat: "MATEMATICA", q: "Qual è il numero successivo a 999?", options: ["1000", "1001", "900", "1100"], answer: 0 },
  { cat: "MATEMATICA", q: "Quanto fa 120 ÷ 4?", options: ["30", "25", "35", "40"], answer: 0 },
  { cat: "MATEMATICA", q: "Quanto fa 19 + 31?", options: ["50", "40", "60", "49"], answer: 0 },
  { cat: "MATEMATICA", q: "Quanto fa 5 × 17?", options: ["85", "75", "80", "90"], answer: 0 },
  { cat: "MATEMATICA", q: "Qual è la radice quadrata di 100?", options: ["10", "20", "5", "25"], answer: 0 },
  { cat: "MATEMATICA", q: "Quanto fa 200 ÷ 5?", options: ["40", "50", "25", "45"], answer: 0 },
  { cat: "MATEMATICA", q: "Quanto fa 36 + 64?", options: ["100", "90", "110", "96"], answer: 0 },
  { cat: "MATEMATICA", q: "Quanto fa 8 × 11?", options: ["88", "80", "98", "78"], answer: 0 },
  { cat: "MATEMATICA", q: "Quanto fa 72 - 27?", options: ["45", "55", "35", "49"], answer: 0 },
  { cat: "MATEMATICA", q: "Quanto fa 10% di 300?", options: ["30", "3", "60", "10"], answer: 0 },
  { cat: "MATEMATICA", q: "Quanto fa 21 × 2?", options: ["42", "44", "32", "41"], answer: 0 },
  { cat: "MATEMATICA", q: "Quanto fa 60 + 80?", options: ["140", "120", "150", "130"], answer: 0 },
  { cat: "MATEMATICA", q: "Quanto fa 56 ÷ 7?", options: ["8", "7", "6", "9"], answer: 0 },
  { cat: "MATEMATICA", q: "Quanto fa 12 + 13 + 15?", options: ["40", "35", "45", "30"], answer: 0 },
  { cat: "MATEMATICA", q: "Quanto fa 9 × 9?", options: ["81", "72", "90", "89"], answer: 0 },
  { cat: "MATEMATICA", q: "Quanto fa 150 - 65?", options: ["85", "95", "75", "80"], answer: 0 },
  { cat: "MATEMATICA", q: "Quanto fa 3 × 25?", options: ["75", "70", "80", "65"], answer: 0 },
  { cat: "MATEMATICA", q: "Quanto fa 48 ÷ 6?", options: ["8", "6", "7", "9"], answer: 0 },
  { cat: "MATEMATICA", q: "Quanto fa 28 + 32?", options: ["60", "50", "70", "58"], answer: 0 },
  { cat: "MATEMATICA", q: "Quanto fa 11 × 7?", options: ["77", "67", "87", "70"], answer: 0 },

  // 101-150: STORIA
  { cat: "STORIA", q: "In che anno cadde il Muro di Berlino?", options: ["1989", "1991", "1985", "1979"], answer: 0 },
  { cat: "STORIA", q: "Chi fu il primo re d'Italia unita?", options: ["Vittorio Emanuele II", "Umberto I", "Camillo Cavour", "Giuseppe Garibaldi"], answer: 0 },
  { cat: "STORIA", q: "In che anno l'uomo sbarcò sulla Luna?", options: ["1969", "1965", "1972", "1959"], answer: 0 },
  { cat: "STORIA", q: "Chi dipinse la Gioconda?", options: ["Leonardo da Vinci", "Michelangelo", "Raffaello", "Donatello"], answer: 0 },
  { cat: "STORIA", q: "Quale civiltà costruì le piramidi di Giza?", options: ["Egizi", "Sumeri", "Fenici", "Assiri"], answer: 0 },
  { cat: "STORIA", q: "In che secolo visse Giulio Cesare?", options: ["I secolo a.C.", "I secolo d.C.", "III secolo a.C.", "V secolo a.C."], answer: 0 },
  { cat: "STORIA", q: "Quale evento segnò l'inizio della Seconda Guerra Mondiale?", options: ["Invasione della Polonia", "Attacco a Pearl Harbor", "Battaglia di Stalingrado", "Sbarco in Normandia"], answer: 0 },
  { cat: "STORIA", q: "Chi guidò la spedizione dei Mille?", options: ["Giuseppe Garibaldi", "Giuseppe Mazzini", "Camillo Cavour", "Vittorio Emanuele II"], answer: 0 },
  { cat: "STORIA", q: "In che anno Cristoforo Colombo arrivò in America?", options: ["1492", "1482", "1502", "1498"], answer: 0 },
  { cat: "STORIA", q: "Quale città fu distrutta dall'eruzione del 79 d.C.?", options: ["Pompei", "Siracusa", "Ravenna", "Ostia"], answer: 0 },
  { cat: "STORIA", q: "Chi fu il primo presidente degli Stati Uniti?", options: ["George Washington", "Abraham Lincoln", "Thomas Jefferson", "John Adams"], answer: 0 },
  { cat: "STORIA", q: "In che anno iniziò la Prima Guerra Mondiale?", options: ["1914", "1918", "1912", "1915"], answer: 0 },
  { cat: "STORIA", q: "Quale imperatore romano fece costruire il Vallo?", options: ["Adriano", "Traiano", "Nerone", "Augusto"], answer: 0 },
  { cat: "STORIA", q: "In quale anno l'Italia divenne una Repubblica?", options: ["1946", "1948", "1945", "1950"], answer: 0 },
  { cat: "STORIA", q: "Chi scolpì il David di marmo a Firenze?", options: ["Michelangelo", "Bernini", "Canova", "Cellini"], answer: 0 },
  { cat: "STORIA", q: "Quale popolo fondò Roma secondo la leggenda?", options: ["Romani / Latini", "Etruschi", "Greci", "Sabini"], answer: 0 },
  { cat: "STORIA", q: "Chi fu l'ultima regina d'Egitto ellenistico?", options: ["Cleopatra", "Nefertiti", "Hatshepsut", "Arsinoe"], answer: 0 },
  { cat: "STORIA", q: "In che anno terminò la Seconda Guerra Mondiale?", options: ["1945", "1944", "1946", "1943"], answer: 0 },
  { cat: "STORIA", q: "Quale navigatore compì il primo giro del mondo?", options: ["Magellano", "Vasco da Gama", "Amerigo Vespucci", "Marco Polo"], answer: 0 },
  { cat: "STORIA", q: "Dove si svolse la battaglia decisiva contro Napoleone?", options: ["Waterloo", "Austerlitz", "Lipsia", "Marengo"], answer: 0 },
  { cat: "STORIA", q: "Chi scrisse La Divina Commedia?", options: ["Dante Alighieri", "Francesco Petrarca", "Giovanni Boccaccio", "Ludovico Ariosto"], answer: 0 },
  { cat: "STORIA", q: "Quale città era la capitale dell'Impero Romano d'Oriente?", options: ["Costantinopoli", "Alessandria", "Antiochia", "Atene"], answer: 0 },
  { cat: "STORIA", q: "In che anno entrò in vigore la Costituzione Italiana?", options: ["1948", "1946", "1947", "1951"], answer: 0 },
  { cat: "STORIA", q: "Chi inventò la stampa a caratteri mobili in Europa?", options: ["Johannes Gutenberg", "Galileo Galilei", "Isaac Newton", "Blaise Pascal"], answer: 0 },
  { cat: "STORIA", q: "Quale trattato pose fine alla Prima Guerra Mondiale?", options: ["Trattato di Versailles", "Trattato di Roma", "Pace di Westfalia", "Trattato di Parigi"], answer: 0 },
  { cat: "STORIA", q: "Chi fu il celebre condottiero cartaginese delle Alpi?", options: ["Annibale", "Scipione", "Pirro", "Spartaco"], answer: 0 },
  { cat: "STORIA", q: "In che secolo avvenne la Rivoluzione Francese?", options: ["XVIII secolo", "XVII secolo", "XIX secolo", "XVI secolo"], answer: 0 },
  { cat: "STORIA", q: "Quale filosofo greco fu maestro di Alessandro Magno?", options: ["Aristotele", "Socrate", "Platone", "Pitagora"], answer: 0 },
  { cat: "STORIA", q: "Chi fu il primo uomo nello spazio?", options: ["Jurij Gagarin", "Neil Armstrong", "Buzz Aldrin", "Alan Shepard"], answer: 0 },
  { cat: "STORIA", q: "In quale città si tenne il processo di Norimberga?", options: ["Norimberga", "Monaco", "Berlino", "Francoforte"], answer: 0 },
  { cat: "STORIA", q: "Quale regina governò il Regno Unito per 70 anni?", options: ["Elisabetta II", "Vittoria", "Elisabetta I", "Maria Tudor"], answer: 0 },
  { cat: "STORIA", q: "In che anno iniziò il Rinascimento italiano?", options: ["XIV–XV secolo", "XII secolo", "XVII secolo", "X secolo"], answer: 0 },
  { cat: "STORIA", q: "Quale civiltà antica abitava la penisola dello Yucatán?", options: ["Maya", "Inca", "Aztechi", "Olmechi"], answer: 0 },
  { cat: "STORIA", q: "Chi fu il primo re di Roma?", options: ["Romolo", "Numa Pompilio", "Tarquinio Prisco", "Servio Tullio"], answer: 0 },
  { cat: "STORIA", q: "Quale muro divideva la Germania Est da quella Ovest?", options: ["Muro di Berlino", "Vallo di Adriano", "Grande Muraglia", "Linea Maginot"], answer: 0 },
  { cat: "STORIA", q: "Chi scoprì la penicillina nel 1928?", options: ["Alexander Fleming", "Louis Pasteur", "Robert Koch", "Edward Jenner"], answer: 0 },
  { cat: "STORIA", q: "In che anno fu firmata la Magna Carta?", options: ["1215", "1066", "1315", "1415"], answer: 0 },
  { cat: "STORIA", q: "Quale città greca ospitò i primi Giochi Olimpici antichi?", options: ["Olimpia", "Sparta", "Corinto", "Tebe"], answer: 0 },
  { cat: "STORIA", q: "Chi fu il primo cancelliere della Germania unificata?", options: ["Otto von Bismarck", "Konrad Adenauer", "Angela Merkel", "Willy Brandt"], answer: 0 },
  { cat: "STORIA", q: "In che anno cadde l'Impero Romano d'Occidente?", options: ["476 d.C.", "395 d.C.", "410 d.C.", "527 d.C."], answer: 0 },
  { cat: "STORIA", q: "Quale esploratore veneziano viaggiò in Cina?", options: ["Marco Polo", "Giovanni Caboto", "Pietro Querini", "Antonio Pigafetta"], answer: 0 },
  { cat: "STORIA", q: "Chi dipinse la volta della Cappella Sistina?", options: ["Michelangelo", "Caravaggio", "Tiziano", "Botticelli"], answer: 0 },
  { cat: "STORIA", q: "In che anno ci fu l'attentato alle Torri Gemelle?", options: ["2001", "1999", "2003", "1998"], answer: 0 },
  { cat: "STORIA", q: "Quale dinastia governò la Russia fino al 1917?", options: ["Romanov", "Asburgo", "Borbone", "Tudor"], answer: 0 },
  { cat: "STORIA", q: "Chi fu il leader anti-apartheid in Sudafrica?", options: ["Nelson Mandela", "Mahatma Gandhi", "Martin Luther King", "Desmond Tutu"], answer: 0 },
  { cat: "STORIA", q: "In che anno avvenne la presa della Bastiglia?", options: ["1789", "1799", "1776", "1815"], answer: 0 },
  { cat: "STORIA", q: "Quale popolo antico usava la scrittura cuneiforme?", options: ["Sumeri", "Egizi", "Celti", "Vichinghi"], answer: 0 },
  { cat: "STORIA", q: "Chi fu il celebre scienziato pisano padre del metodo scientifico?", options: ["Galileo Galilei", "Alessandro Volta", "Guglielmo Marconi", "Enrico Fermi"], answer: 0 },
  { cat: "STORIA", q: "Quale guerra oppose Atene e Sparta?", options: ["Guerra del Peloponneso", "Guerre Persiane", "Guerre Puniche", "Guerra di Troia"], answer: 0 },
  { cat: "STORIA", q: "In che anno l'euro entrò in circolazione come moneta?", options: ["2002", "1999", "2000", "2004"], answer: 0 },

  // 151-200: SCIENZA
  { cat: "SCIENZA", q: "Qual è il simbolo chimico dell'acqua?", options: ["H₂O", "CO₂", "NaCl", "O₂"], answer: 0 },
  { cat: "SCIENZA", q: "Qual è il pianeta più vicino al Sole?", options: ["Mercurio", "Venere", "Marte", "Terra"], answer: 0 },
  { cat: "SCIENZA", q: "Qual è il gas più abbondante nell'aria terrestre?", options: ["Azoto", "Ossigeno", "Anidride carbonica", "Argo"], answer: 0 },
  { cat: "SCIENZA", q: "A quanti gradi Celsius bolle l'acqua al mare?", options: ["100°C", "90°C", "80°C", "110°C"], answer: 0 },
  { cat: "SCIENZA", q: "Qual è l'organo che pompa il sangue nel corpo?", options: ["Cuore", "Polmoni", "Fegato", "Reni"], answer: 0 },
  { cat: "SCIENZA", q: "Qual è il pianeta più grande del Sistema Solare?", options: ["Giove", "Saturno", "Urano", "Nettuno"], answer: 0 },
  { cat: "SCIENZA", q: "Qual è il simbolo chimico del ferro?", options: ["Fe", "Ir", "Fr", "Ag"], answer: 0 },
  { cat: "SCIENZA", q: "Quale forza tiene i pianeti in orbita attorno al Sole?", options: ["Gravità", "Magnetismo", "Attrito", "Tensione"], answer: 0 },
  { cat: "SCIENZA", q: "Qual è l'osso più lungo del corpo umano?", options: ["Femore", "Omero", "Tibia", "Radio"], answer: 0 },
  { cat: "SCIENZA", q: "Quale stella è più vicina alla Terra?", options: ["Il Sole", "Sirio", "Proxima Centauri", "Vega"], answer: 0 },
  { cat: "SCIENZA", q: "Qual è il simbolo chimico dell'oro?", options: ["Au", "Ag", "Or", "Go"], answer: 0 },
  { cat: "SCIENZA", q: "Quale organo umano produce l'insulina?", options: ["Pancreas", "Milza", "Stomaco", "Tiroide"], answer: 0 },
  { cat: "SCIENZA", q: "Quale pianeta è noto come il Pianeta Rosso?", options: ["Marte", "Giove", "Venere", "Mercurio"], answer: 0 },
  { cat: "SCIENZA", q: "A quanti gradi Celsius ghiaccia l'acqua pura?", options: ["0°C", "-10°C", "4°C", "32°C"], answer: 0 },
  { cat: "SCIENZA", q: "Qual è il simbolo chimico dell'ossigeno?", options: ["O", "Ox", "Os", "Og"], answer: 0 },
  { cat: "SCIENZA", q: "Quale parte della cellula contiene il DNA?", options: ["Nucleo", "Ribosoma", "Membrana", "Vacuolo"], answer: 0 },
  { cat: "SCIENZA", q: "Qual è l'unità di misura della resistenza elettrica?", options: ["Ohm", "Volt", "Ampere", "Watt"], answer: 0 },
  { cat: "SCIENZA", q: "Quale pianeta ha anelli ben visibili di ghiaccio e roccia?", options: ["Saturno", "Nettuno", "Urano", "Marte"], answer: 0 },
  { cat: "SCIENZA", q: "Qual è il processo con cui le piante producono glucosio?", options: ["Fotosintesi", "Respirazione", "Fermentazione", "Traspirazione"], answer: 0 },
  { cat: "SCIENZA", q: "Qual è il simbolo chimico del sodio?", options: ["Na", "So", "Sd", "S"], answer: 0 },
  { cat: "SCIENZA", q: "Quanti cromosomi ha normalmente una cellula umana?", options: ["46", "23", "44", "48"], answer: 0 },
  { cat: "SCIENZA", q: "Quale gas assorbono principalmente le piante di giorno?", options: ["Anidride carbonica", "Azoto", "Elio", "Metano"], answer: 0 },
  { cat: "SCIENZA", q: "Qual è l'unità di misura della potenza?", options: ["Watt", "Joule", "Newton", "Pascal"], answer: 0 },
  { cat: "SCIENZA", q: "Quale metallo è il principale componente dell'acciaio?", options: ["Ferro", "Rame", "Oro", "Piombo"], answer: 0 },
  { cat: "SCIENZA", q: "Quale parte dell'occhio regola la luce che entra?", options: ["Pupilla / Iride", "Retina", "Cristallino", "Nervo ottico"], answer: 0 },
  { cat: "SCIENZA", q: "Qual è il simbolo chimico del carbonio?", options: ["C", "Ca", "Co", "Cb"], answer: 0 },
  { cat: "SCIENZA", q: "Quale pianeta è il più caldo del Sistema Solare?", options: ["Venere", "Mercurio", "Marte", "Giove"], answer: 0 },
  { cat: "SCIENZA", q: "Quale senso è legato alla coclea?", options: ["Udito", "Olfatto", "Gusto", "Tatto"], answer: 0 },
  { cat: "SCIENZA", q: "Qual è la formula chimica del sale da cucina?", options: ["NaCl", "KCl", "CaCO₃", "HCl"], answer: 0 },
  { cat: "SCIENZA", q: "Quale strato atmosferico protegge dai raggi UV?", options: ["Ozono", "Troposfera", "Termosfera", "Esosfera"], answer: 0 },
  { cat: "SCIENZA", q: "Qual è l'unità di misura della forza?", options: ["Newton", "Joule", "Watt", "Bar"], answer: 0 },
  { cat: "SCIENZA", q: "Quale animale è un anfibio?", options: ["Rana", "Lucertola", "Tartaruga", "Serpente"], answer: 0 },
  { cat: "SCIENZA", q: "Qual è il simbolo chimico dell'argento?", options: ["Ag", "Ar", "Au", "Al"], answer: 0 },
  { cat: "SCIENZA", q: "Quale ghiandola è considerata la 'ghiandola maestra'?", options: ["Ipofisi", "Tiroide", "Surrene", "Epifisi"], answer: 0 },
  { cat: "SCIENZA", q: "Quanto dura circa una rotazione della Terra su sé stessa?", options: ["24 ore", "12 ore", "365 giorni", "48 ore"], answer: 0 },
  { cat: "SCIENZA", q: "Qual è l'elemento chimico più leggero?", options: ["Idrogeno", "Elio", "Litio", "Carbonio"], answer: 0 },
  { cat: "SCIENZA", q: "Quale vaso sanguigno porta il sangue dal cuore ai tessuti?", options: ["Arteria", "Vena", "Capillare", "Aorta solo"], answer: 0 },
  { cat: "SCIENZA", q: "Qual è il simbolo chimico del potassio?", options: ["K", "P", "Po", "Pt"], answer: 0 },
  { cat: "SCIENZA", q: "Quale fenomeno causa le maree principali sulla Terra?", options: ["Attrazione lunare", "Vento solare", "Rotazione del nucleo", "Eruzioni"], answer: 0 },
  { cat: "SCIENZA", q: "Qual è l'unità di misura dell'energia?", options: ["Joule", "Volt", "Ohm", "Hertz"], answer: 0 },
  { cat: "SCIENZA", q: "Quale vitamina produce la pelle esposta al sole?", options: ["Vitamina D", "Vitamina C", "Vitamina A", "Vitamina K"], answer: 0 },
  { cat: "SCIENZA", q: "Qual è il simbolo chimico del calcio?", options: ["Ca", "C", "Cl", "Cu"], answer: 0 },
  { cat: "SCIENZA", q: "Quale pianeta ruota su un fianco con inclinazione estrema?", options: ["Urano", "Nettuno", "Saturno", "Giove"], answer: 0 },
  { cat: "SCIENZA", q: "Quale pigmento dà il colore verde alle foglie?", options: ["Clorofilla", "Melanina", "Emoglobina", "Carotene"], answer: 0 },
  { cat: "SCIENZA", q: "Qual è l'unità di misura della frequenza?", options: ["Hertz", "Decibel", "Lux", "Tesla"], answer: 0 },
  { cat: "SCIENZA", q: "Quale organo filtra il sangue producendo urina?", options: ["Reni", "Polmoni", "Stomaco", "Cistifellea"], answer: 0 },
  { cat: "SCIENZA", q: "Qual è il simbolo chimico del rame?", options: ["Cu", "Cr", "Co", "Cm"], answer: 0 },
  { cat: "SCIENZA", q: "Quale gas è necessario per la combustione comune?", options: ["Ossigeno", "Azoto", "Elio", "Neon"], answer: 0 },
  { cat: "SCIENZA", q: "Quale galassia contiene il nostro Sistema Solare?", options: ["Via Lattea", "Andromeda", "Triangolo", "Sombrero"], answer: 0 },
  { cat: "SCIENZA", q: "Quale particella subatomica ha carica negativa?", options: ["Elettrone", "Protone", "Neutrone", "Positrone"], answer: 0 }
];

function getShuffledMissionDeck() {
  const deck = SHIELD_MISSIONS.map((_, idx) => idx);
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function getMissionTypeForRound(round) {
  if (round === 1) return 'SHIELD';
  if (round === 2) return 'MONOCLE';
  if (round === 3) return 'JUSTICIAR';
  return null;
}

// =======================================================
// 4. STATO LOCALE, CHAT NON LETTI & RICONNESSIONE
// =======================================================
let state = {
  roomCode: localStorage.getItem('trd_room') || null,
  playerId: localStorage.getItem('trd_pid') || null,
  selectedVoteId: null,
  justiciarMode: false,
  justiciarTargets: [],
  selectedMonocleTargetId: null,
  selectedNightTargetId: null,
  roleRevealedLocally: false,
  missionAnswered: false,
  missionTimerInterval: null,
  lastReadChatTs: Number(localStorage.getItem('trd_chat_ts') || 0),
  lastMorningCueKey: null,
  roomRef: null,
  secretRef: null,
  roomData: null,
  mySecret: null
};

const $ = (id) => document.getElementById(id);

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function isImageAsset(val) {
  return typeof val === 'string' && /\.(jpg|jpeg|png|webp)$/i.test(val);
}

function renderAvatarHtml(avatar, alt = 'Avatar', extraClass = '') {
  if (isImageAsset(avatar)) {
    return `<img src="${escapeHtml(avatar)}" alt="${escapeHtml(alt)}" class="avatar-img ${extraClass}" />`;
  }
  return `<span class="${extraClass}">${escapeHtml(avatar || '🎭')}</span>`;
}

function setContainerAvatar(el, avatar, alt = 'Avatar') {
  if (!el) return;
  if (isImageAsset(avatar)) {
    el.innerHTML = `<img src="${escapeHtml(avatar)}" alt="${escapeHtml(alt)}" class="avatar-img" />`;
  } else {
    el.textContent = avatar || '🎭';
  }
}

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

async function appendChronicleEvent(round, text) {
  if (!state.roomCode || !text) return;
  await db.ref(`rooms/${state.roomCode}/chronicle`).push({
    round: round || 1,
    text,
    ts: Date.now()
  });
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
    clearInterval(state.missionTimerInterval);
    db.ref(`rooms/${state.roomCode}/meta`).update({
      phase: 'VOTING',
      missionEndsAt: null
    });
  });

  $('confirmMonocleBtn').addEventListener('click', useMonoclePower);
  $('proceedFromMonocleBtn').addEventListener('click', () => {
    db.ref(`rooms/${state.roomCode}/meta/phase`).set('VOTING');
  });
  $('forceVotingFromMonocleBtn').addEventListener('click', () => {
    db.ref(`rooms/${state.roomCode}/meta/phase`).set('VOTING');
  });

  $('toggleJusticiarModeBtn').addEventListener('click', () => {
    state.justiciarMode = !state.justiciarMode;
    state.selectedVoteId = null;
    state.justiciarTargets = [];
    if (state.justiciarMode) {
      playCueSound('JUSTICIAR_CHARGE');
    } else {
      playTone(480, 0.16, 'triangle');
    }
    renderVotingPhase(state.roomData);
  });

  $('confirmVoteBtn').addEventListener('click', () => {
    if (state.justiciarMode) {
      submitJusticiarAccusation();
    } else {
      submitVote();
    }
  });

  $('sendGeneralChatBtn').addEventListener('click', sendGeneralChat);
  $('generalChatInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendGeneralChat();
    }
  });

  $('generalChatMessages').addEventListener('scroll', () => {
    const box = $('generalChatMessages');
    if (box.scrollHeight - box.scrollTop - box.clientHeight < 36) {
      markGeneralChatAsRead(state.roomData?.generalChat);
    }
  });

  $('unreadChatBadge').addEventListener('click', () => {
    const box = $('generalChatMessages');
    markGeneralChatAsRead(state.roomData?.generalChat);
    if (box) box.scrollTop = box.scrollHeight;
  });

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
      missionType: 'SHIELD',
      missionDeck: getShuffledMissionDeck(),
      deckCursor: 0,
      missionEndsAt: null,
      shieldWinnerId: null,
      monocleWinnerId: null,
      monocleResult: null,
      justiciarWinnerId: null,
      justiciarUsed: false,
      exiledInfo: null,
      morningInfo: null,
      winner: null,
      winnerHeadline: null,
      winnerSummary: null
    },
    players: {
      [pid]: {
        name,
        avatar: ANON_AVATAR,
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
  if (Object.keys(players).length >= MAX_PLAYERS) return showToast(`Stanza piena (max ${MAX_PLAYERS} giocatori)`);

  playTone(620, 0.2);
  const pid = 'p_' + generateId(8);
  await db.ref(`rooms/${code}/players/${pid}`).set({
    name,
    avatar: ANON_AVATAR,
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
  clearInterval(state.missionTimerInterval);
  state.missionTimerInterval = null;
  localStorage.removeItem('trd_room');
  localStorage.removeItem('trd_pid');
  state.roomCode = null;
  state.playerId = null;
  state.roomData = null;
  state.mySecret = null;
  state.roleRevealedLocally = false;
  state.justiciarMode = false;
  state.justiciarTargets = [];
  state.lastMorningCueKey = null;
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

  if (meta.phase !== 'MISSION') {
    clearInterval(state.missionTimerInterval);
    state.missionTimerInterval = null;
  }

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
    case 'MONOCLE_POWER':
      renderMonoclePhase(room, isHost);
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

// --- LOBBY (FINO A 15 GIOCATORI) ---
function renderLobby(room, isHost) {
  showScreen('screen-lobby');
  state.roleRevealedLocally = false;
  state.justiciarMode = false;
  state.justiciarTargets = [];
  state.lastMorningCueKey = null;
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
  } else if (count <= 11) {
    $('rolePreviewBadge').textContent = '2 Traditori (Modalità Complotto)';
  } else {
    $('rolePreviewBadge').textContent = '3 Traditori (Gran Consiglio)';
  }

  const list = $('lobbyPlayerList');
  list.innerHTML = '';
  entries.forEach(([id, p]) => {
    const li = document.createElement('li');
    li.className = 'player-item';
    li.innerHTML = `
      <div class="player-left">
        <span class="player-avatar-slot">${renderAvatarHtml(ANON_AVATAR, p.name)}</span>
        <span>${escapeHtml(p.name)} ${id === room.meta.hostId ? '👑' : ''}</span>
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

// --- ASSEGNAZIONE CASUALE RUOLI + AVATAR DEDICATO (HOST) ---
async function startGame() {
  const players = state.roomData.players || {};
  const ids = Object.keys(players);
  if (ids.length < 3) return;

  const shuffled = [...ids].sort(() => Math.random() - 0.5);
  let traitorCount = 1;
  if (ids.length >= 12) traitorCount = 3;
  else if (ids.length >= 8) traitorCount = 2;

  const traitorIds = shuffled.slice(0, traitorCount);

  const faithfulPool = [...FAITHFUL_PERSONAS].sort(() => Math.random() - 0.5);
  let faithfulCursor = 0;

  const updates = {};
  ids.forEach(id => {
    const isTraitor = traitorIds.includes(id);
    const allies = isTraitor ? traitorIds.filter(tid => tid !== id).map(tid => players[tid].name) : [];

    let persona;
    if (isTraitor) {
      persona = TRAITOR_PERSONA;
    } else {
      persona = faithfulPool[faithfulCursor % faithfulPool.length];
      faithfulCursor++;
    }

    updates[`rooms/${state.roomCode}/secrets/${id}`] = {
      role: isTraitor ? 'TRAITOR' : 'FAITHFUL',
      personaAvatar: persona.avatar,
      personaLabel: persona.label,
      hasShield: false,
      allies
    };
    updates[`rooms/${state.roomCode}/players/${id}/avatar`] = ANON_AVATAR;
    updates[`rooms/${state.roomCode}/players/${id}/alive`] = true;
    updates[`rooms/${state.roomCode}/players/${id}/ready`] = false;
    updates[`rooms/${state.roomCode}/players/${id}/votedFor`] = null;
    updates[`rooms/${state.roomCode}/players/${id}/missionScore`] = null;
  });

  updates[`rooms/${state.roomCode}/meta/phase`] = 'ROLE_REVEAL';
  updates[`rooms/${state.roomCode}/meta/round`] = 1;
  updates[`rooms/${state.roomCode}/meta/missionType`] = 'SHIELD';
  updates[`rooms/${state.roomCode}/meta/missionDeck`] = getShuffledMissionDeck();
  updates[`rooms/${state.roomCode}/meta/deckCursor`] = 0;
  updates[`rooms/${state.roomCode}/meta/missionEndsAt`] = null;
  updates[`rooms/${state.roomCode}/meta/shieldWinnerId`] = null;
  updates[`rooms/${state.roomCode}/meta/monocleWinnerId`] = null;
  updates[`rooms/${state.roomCode}/meta/monocleResult`] = null;
  updates[`rooms/${state.roomCode}/meta/justiciarWinnerId`] = null;
  updates[`rooms/${state.roomCode}/meta/justiciarUsed`] = false;
  updates[`rooms/${state.roomCode}/meta/winnerHeadline`] = null;
  updates[`rooms/${state.roomCode}/meta/winnerSummary`] = null;
  updates[`rooms/${state.roomCode}/generalChat`] = null;
  updates[`rooms/${state.roomCode}/chronicle`] = null;

  await db.ref().update(updates);
  await appendChronicleEvent(1, 'La partita ha avuto inizio: i ruoli segreti sono stati assegnati.');
}

// --- RIVELAZIONE RUOLO & AVATAR ---
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
  const avatar = state.mySecret.personaAvatar || (isTraitor ? TRAITOR_PERSONA.avatar : 're.jpeg');
  const personaLabel = state.mySecret.personaLabel || (isTraitor ? TRAITOR_PERSONA.label : 'Re');

  const card = $('secretRoleCard');
  card.querySelector('.secret-card-front').classList.add('hidden');
  $('secretRoleBack').classList.remove('hidden');

  setContainerAvatar($('roleAvatarBox'), avatar, personaLabel);
  $('rolePersonaLabel').textContent = personaLabel;

  card.className = `secret-card ${isTraitor ? 'revealed-traitor' : 'revealed-faithful'}`;
  $('roleBadgeType').textContent = isTraitor ? 'TRADITORE' : 'FEDELE';
  $('roleTitle').textContent = isTraitor ? 'SEI UN TRADITORE' : 'SEI UN FEDELE';
  $('roleDescription').textContent = isTraitor
    ? 'Inganna il gruppo alla Tavola Rotonda ed elimina i Fedeli durante la notte senza farti scoprire.'
    : 'Vinci le reliquie uniche nelle missioni, osserva i comportamenti ed esilia i Traditori.';

  const allyBox = $('fellowTraitorBox');
  if (isTraitor && state.mySecret.allies && state.mySecret.allies.length > 0) {
    const label = state.mySecret.allies.length > 1 ? 'I tuoi complici segreti sono' : 'Il tuo complice segreto è';
    allyBox.textContent = `${label}: ${state.mySecret.allies.join(', ')}`;
    allyBox.classList.remove('hidden');
  } else {
    allyBox.classList.add('hidden');
  }
}

async function checkAllPlayersReadyForMission() {
  const snap = await db.ref(`rooms/${state.roomCode}`).get();
  const room = snap.val();
  if (!room) return;
  const players = Object.values(room.players || {});
  if (players.every(p => p.ready)) {
    await db.ref(`rooms/${state.roomCode}/meta`).update({
      phase: 'MISSION',
      missionType: 'SHIELD',
      missionEndsAt: Date.now() + MISSION_DURATION_MS
    });
  }
}

// --- MISSIONI UNICHE (ROUND 1: SCUDO, ROUND 2: CANNOCCHIALE, ROUND 3: GIUSTIZIERE) ---
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
  const mType = room.meta.missionType || getMissionTypeForRound(room.meta.round) || 'SHIELD';

  const relicImg = $('missionRelicImg');
  if (mType === 'MONOCLE') {
    relicImg.src = MONOCLE_IMG;
    relicImg.alt = 'Cannocchiale';
    $('missionEyebrow').innerHTML = `ROUND <span class="round-num">${room.meta.round}</span> • 2ª MISSIONE UNICA`;
    $('missionPhaseTitle').textContent = 'Missione per il Monocolo';
    $('missionPhaseSubtitle').textContent = '30 secondi: il più veloce vince il monocolo per spiare un abitante del regno.';
  } else if (mType === 'JUSTICIAR') {
    relicImg.src = JUSTICIAR_IMG;
    relicImg.alt = 'Giustiziere';
    $('missionEyebrow').innerHTML = `ROUND <span class="round-num">${room.meta.round}</span> • 3ª MISSIONE UNICA`;
    $('missionPhaseTitle').textContent = 'Missione del Giustiziere';
    $('missionPhaseSubtitle').textContent = '30 secondi: il vincitore ottiene il potere di accusare pubblicamente i Traditori.';
  } else {
    relicImg.src = SHIELD_IMG;
    relicImg.alt = 'Scudo';
    $('missionEyebrow').innerHTML = `ROUND <span class="round-num">${room.meta.round}</span> • 1ª MISSIONE UNICA`;
    $('missionPhaseTitle').textContent = 'Missione per lo Scudo';
    $('missionPhaseSubtitle').textContent = '30 secondi: rispondi bene e veloce per vincere lo Scudo segreto.';
  }

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
        const score = isCorrect ? Math.max(100, MISSION_DURATION_MS - elapsed) : 0;

        $('missionFeedback').textContent = isCorrect
          ? 'Risposta esatta! Attendi gli altri giocatori...'
          : 'Risposta errata! Nessun punto reliquia in questo round.';
        $('missionFeedback').classList.remove('hidden');

        await db.ref(`rooms/${state.roomCode}/players/${state.playerId}/missionScore`).set(score);
        evaluateMissionCompletion();
      };
      optionsDiv.appendChild(btn);
    });
  }

  startMissionCountdown(room.meta.missionEndsAt, isHost);
}

function startMissionCountdown(endsAt, isHost) {
  clearInterval(state.missionTimerInterval);
  const targetEnd = endsAt || (Date.now() + MISSION_DURATION_MS);

  const updateTick = () => {
    const remainingMs = Math.max(0, targetEnd - Date.now());
    const secondsLeft = Math.ceil(remainingMs / 1000);
    const pct = Math.max(0, Math.min(100, (remainingMs / MISSION_DURATION_MS) * 100));

    const badge = $('missionTimerText');
    const fill = $('missionTimerFill');
    if (badge) {
      badge.textContent = `${secondsLeft}s`;
      badge.classList.toggle('urgent', secondsLeft <= 6);
    }
    if (fill) {
      fill.style.width = `${pct}%`;
      fill.classList.toggle('urgent', secondsLeft <= 6);
    }

    if (remainingMs <= 0) {
      clearInterval(state.missionTimerInterval);
      state.missionTimerInterval = null;
      handleMissionTimeout(isHost);
    }
  };

  updateTick();
  state.missionTimerInterval = setInterval(updateTick, 200);
}

async function handleMissionTimeout(isHost) {
  const me = state.roomData?.players?.[state.playerId];
  if (me && me.alive && !state.missionAnswered && (me.missionScore === null || me.missionScore === undefined)) {
    state.missionAnswered = true;
    $('missionFeedback').textContent = 'Tempo scaduto! Nessun punto reliquia in questo round.';
    $('missionFeedback').classList.remove('hidden');
    await db.ref(`rooms/${state.roomCode}/players/${state.playerId}/missionScore`).set(0);
  }

  if (isHost) {
    evaluateMissionCompletion(true);
  }
}

async function evaluateMissionCompletion(forceFinish = false) {
  const snap = await db.ref(`rooms/${state.roomCode}`).get();
  const room = snap.val();
  if (!room || room.meta.phase !== 'MISSION') return;

  const aliveEntries = Object.entries(room.players || {}).filter(([, p]) => p.alive);
  const allAnswered = aliveEntries.every(([, p]) => p.missionScore !== null && p.missionScore !== undefined);

  if (allAnswered || forceFinish) {
    clearInterval(state.missionTimerInterval);
    state.missionTimerInterval = null;

    let bestId = null;
    let bestScore = 0;
    aliveEntries.forEach(([id, p]) => {
      if ((p.missionScore || 0) > bestScore) {
        bestScore = p.missionScore || 0;
        bestId = id;
      }
    });

    const winnerName = bestId ? room.players[bestId]?.name : null;
    const mType = room.meta.missionType || 'SHIELD';
    const updates = {
      [`rooms/${state.roomCode}/meta/missionEndsAt`]: null
    };

    if (mType === 'SHIELD') {
      Object.keys(room.players).forEach(id => {
        updates[`rooms/${state.roomCode}/secrets/${id}/hasShield`] = (id === bestId);
      });
      updates[`rooms/${state.roomCode}/meta/shieldWinnerId`] = bestId;
      updates[`rooms/${state.roomCode}/meta/phase`] = 'VOTING';
      await db.ref().update(updates);
      await appendChronicleEvent(
        room.meta.round,
        winnerName ? `${winnerName} ha vinto lo Scudo segreto.` : 'Nessuno ha conquistato lo Scudo nella missione.'
      );
    } else if (mType === 'MONOCLE') {
      updates[`rooms/${state.roomCode}/meta/monocleWinnerId`] = bestId;
      updates[`rooms/${state.roomCode}/meta/monocleResult`] = null;
      updates[`rooms/${state.roomCode}/meta/phase`] = bestId ? 'MONOCLE_POWER' : 'VOTING';
      await db.ref().update(updates);
      await appendChronicleEvent(
        room.meta.round,
        winnerName ? `${winnerName} ha conquistato il Monocolo per spiare un abitante.` : 'Nessuno ha vinto il Monocolo.'
      );
    } else if (mType === 'JUSTICIAR') {
      updates[`rooms/${state.roomCode}/meta/justiciarWinnerId`] = bestId;
      updates[`rooms/${state.roomCode}/meta/justiciarUsed`] = false;
      updates[`rooms/${state.roomCode}/meta/phase`] = 'VOTING';
      await db.ref().update(updates);
      await appendChronicleEvent(
        room.meta.round,
        winnerName ? `${winnerName} ha ottenuto il potere del Giustiziere.` : 'Nessuno ha vinto il potere del Giustiziere.'
      );
    } else {
      updates[`rooms/${state.roomCode}/meta/phase`] = 'VOTING';
      await db.ref().update(updates);
    }
  }
}

// --- POTERE DEL CANNOCCHIALE / MONOCOLO (ROUND 2) ---
function renderMonoclePhase(room, isHost) {
  showScreen('screen-monocle');
  state.missionAnswered = false;
  const isWinner = room.meta.monocleWinnerId === state.playerId;

  if (isWinner) {
    $('monocleWinnerView').classList.remove('hidden');
    $('monocleWaitView').classList.add('hidden');

    const result = room.meta.monocleResult;
    if (result) {
      $('monocleSelectBox').classList.add('hidden');
      $('confirmMonocleBtn').classList.add('hidden');
      $('monocleClueCard').classList.remove('hidden');
      setContainerAvatar($('monocleTargetAvatar'), ANON_AVATAR, result.targetName);
      $('monocleTargetName').textContent = `Hai spiato ${result.targetName}`;
      $('monocleClueText').textContent = `“${result.clue}”`;
      $('proceedFromMonocleBtn').classList.remove('hidden');
    } else {
      $('monocleSelectBox').classList.remove('hidden');
      $('monocleClueCard').classList.add('hidden');
      $('proceedFromMonocleBtn').classList.add('hidden');

      const grid = $('monocleTargetGrid');
      grid.innerHTML = '';
      Object.entries(room.players || {}).forEach(([id, p]) => {
        if (!p.alive || id === state.playerId) return;
        const card = document.createElement('div');
        card.className = `vote-card ${state.selectedMonocleTargetId === id ? 'selected' : ''}`;
        card.innerHTML = `
          <span class="vote-card-avatar">${renderAvatarHtml(ANON_AVATAR, p.name)}</span>
          <span class="v-name">${escapeHtml(p.name)}</span>
        `;
        card.onclick = () => {
          state.selectedMonocleTargetId = id;
          playTone(520, 0.12);
          renderMonoclePhase(room, isHost);
        };
        grid.appendChild(card);
      });

      const confirmBtn = $('confirmMonocleBtn');
      confirmBtn.classList.remove('hidden');
      confirmBtn.disabled = !state.selectedMonocleTargetId;
    }
  } else {
    $('monocleWinnerView').classList.add('hidden');
    $('monocleWaitView').classList.remove('hidden');
    $('hostForceFromMonocle').classList.toggle('hidden', !isHost);
  }
}

async function useMonoclePower() {
  if (!state.selectedMonocleTargetId) return;
  const targetId = state.selectedMonocleTargetId;
  state.selectedMonocleTargetId = null;

  const snap = await db.ref(`rooms/${state.roomCode}`).get();
  const room = snap.val();
  if (!room) return;

  const targetPlayer = room.players[targetId];
  const targetSecret = room.secrets?.[targetId];
  const isTraitor = targetSecret?.role === 'TRAITOR';
  const pool = isTraitor ? TRAITOR_SPY_CLUES : FAITHFUL_SPY_CLUES;
  const clue = pool[Math.floor(Math.random() * pool.length)];

  playTone(640, 0.3, 'triangle');
  await db.ref(`rooms/${state.roomCode}/meta/monocleResult`).set({
    targetId,
    targetName: targetPlayer.name,
    clue
  });
}

// --- TAVOLA ROTONDA CIRCOLARE, VOTO, ACCUSA GIUSTIZIERE & CHAT GENERALE ---
function getAliveTraitorsCount(room) {
  let count = 0;
  Object.entries(room.players || {}).forEach(([id, p]) => {
    if (p.alive && room.secrets?.[id]?.role === 'TRAITOR') {
      count++;
    }
  });
  return Math.max(1, count);
}

function renderMissionWinnerBanner(room) {
  const banner = $('missionWinnerBanner');
  if (!banner) return;

  const { round, shieldWinnerId, monocleWinnerId, justiciarWinnerId } = room.meta || {};
  let text = '';

  if (round === 1 && shieldWinnerId && room.players?.[shieldWinnerId]) {
    text = `🛡️ Scudo assegnato a ${room.players[shieldWinnerId].name}`;
  } else if (round === 2 && monocleWinnerId && room.players?.[monocleWinnerId]) {
    text = `🔭 Monocolo assegnato a ${room.players[monocleWinnerId].name}`;
  } else if (round === 3 && justiciarWinnerId && room.players?.[justiciarWinnerId]) {
    text = `⚔️ Potere del Giustiziere a ${room.players[justiciarWinnerId].name}`;
  }

  if (text) {
    banner.textContent = text;
    banner.classList.remove('hidden');
  } else {
    banner.classList.add('hidden');
  }
}

function renderVotingPhase(room) {
  showScreen('screen-voting');
  state.missionAnswered = false;
  const me = room.players[state.playerId];

  renderMissionWinnerBanner(room);
  renderGeneralChat(room.generalChat || {});

  if (state.mySecret && state.mySecret.hasShield && me.alive) {
    $('shieldStatusBanner').classList.remove('hidden');
  } else {
    $('shieldStatusBanner').classList.add('hidden');
  }

  const monocleReminder = $('monocleReminderBanner');
  if (room.meta.monocleWinnerId === state.playerId && room.meta.monocleResult && me.alive) {
    $('monocleReminderText').textContent = `Monocolo su ${room.meta.monocleResult.targetName}: “${room.meta.monocleResult.clue}”`;
    monocleReminder.classList.remove('hidden');
  } else {
    monocleReminder.classList.add('hidden');
  }

  const canUseJusticiar =
    room.meta.justiciarWinnerId === state.playerId &&
    !room.meta.justiciarUsed &&
    me.alive &&
    !me.votedFor;

  const justiciarPanel = $('justiciarPanel');
  if (canUseJusticiar) {
    justiciarPanel.classList.remove('hidden');
    const requiredTargets = getAliveTraitorsCount(room);
    $('justiciarDesc').textContent = requiredTargets === 1
      ? "C'è 1 Traditore rimasto nel regno. Puoi accusarlo pubblicamente: se indovini vinci subito, se sbagli vieni squalificato!"
      : `Ci sono ${requiredTargets} Traditori rimasti nel regno. Se li accusi tutti correttamente vinci subito, ma se sbagli anche un solo nome vieni squalificato!`;

    const toggleBtn = $('toggleJusticiarModeBtn');
    toggleBtn.textContent = state.justiciarMode
      ? 'Torna al Voto Normale'
      : `Attiva Accusa Giustiziere (${requiredTargets} ${requiredTargets === 1 ? 'nome' : 'nomi'})`;
  } else {
    justiciarPanel.classList.add('hidden');
    state.justiciarMode = false;
    state.justiciarTargets = [];
  }

  const requiredTargets = getAliveTraitorsCount(room);
  if (state.justiciarMode) {
    $('votingMainTitle').textContent = 'Accusa del Giustiziere';
    $('votingInstructionText').textContent = requiredTargets === 1
      ? 'Seleziona l’unico Traditore che hai smascherato (rischio squalifica):'
      : `Seleziona tutti e ${requiredTargets} i Traditori rimasti (se ne sbagli 1 sei squalificato):`;
  } else {
    $('votingMainTitle').textContent = 'Chi vuoi esiliare?';
    $('votingInstructionText').textContent = 'Discutete a voce o in chat, poi tocca il giocatore che vuoi esiliare:';
  }

  const aliveEntries = Object.entries(room.players || {}).filter(([, p]) => p.alive);
  const votableEntries = aliveEntries.filter(([id]) => id !== state.playerId);
  const votedCount = aliveEntries.filter(([, p]) => !!p.votedFor).length;
  $('voteProgressText').textContent = `Voti registrati: ${votedCount}/${aliveEntries.length}`;

  const grid = $('votingGrid');
  grid.innerHTML = '';

  const totalSeats = votableEntries.length;
  const radiusPercent = totalSeats <= 6 ? 38 : (totalSeats <= 10 ? 40 : 42);

  votableEntries.forEach(([id, p], index) => {
    const angle = (-Math.PI / 2) + (index * (2 * Math.PI)) / Math.max(totalSeats, 1);
    const xPct = 50 + radiusPercent * Math.cos(angle);
    const yPct = 50 + radiusPercent * Math.sin(angle);

    const btn = document.createElement('button');
    btn.type = 'button';

    let isSelected = false;
    if (state.justiciarMode) {
      isSelected = state.justiciarTargets.includes(id);
    } else {
      const currentSelected = me.votedFor || state.selectedVoteId;
      isSelected = currentSelected === id;
    }

    btn.className = `table-seat ${isSelected ? 'selected' : ''}`;
    btn.style.setProperty('--x', `${xPct.toFixed(1)}%`);
    btn.style.setProperty('--y', `${yPct.toFixed(1)}%`);

    btn.innerHTML = `
      <span class="seat-frame-wrap">
        <img src="${ANON_AVATAR}" alt="Giocatore anonimo" class="seat-avatar-img" />
        <img src="cornicegiocatore.jpg" alt="" class="seat-border-img" />
      </span>
      <span class="seat-name">${escapeHtml(p.name)}</span>
    `;

    if (me.alive && !me.votedFor) {
      btn.onclick = () => {
        if (state.justiciarMode) {
          if (state.justiciarTargets.includes(id)) {
            state.justiciarTargets = state.justiciarTargets.filter(tid => tid !== id);
          } else {
            if (state.justiciarTargets.length >= requiredTargets) {
              state.justiciarTargets.shift();
            }
            state.justiciarTargets.push(id);
          }
          playTone(340, 0.12, 'triangle');
        } else {
          state.selectedVoteId = id;
          playTone(460, 0.1);
        }
        renderVotingPhase(room);
      };
    }
    grid.appendChild(btn);
  });

  const voteBtn = $('confirmVoteBtn');
  if (!me.alive) {
    voteBtn.disabled = true;
    voteBtn.textContent = 'Gli Spettri non possono votare';
  } else if (me.votedFor) {
    voteBtn.disabled = true;
    voteBtn.textContent = 'Voto Registrato ✓';
  } else if (state.justiciarMode) {
    const readyToAccuse = state.justiciarTargets.length === requiredTargets;
    voteBtn.disabled = !readyToAccuse;
    voteBtn.textContent = readyToAccuse
      ? 'Lancia Accusa Pubblica!'
      : `Seleziona ${requiredTargets} ${requiredTargets === 1 ? 'sospetto' : 'sospetti'} (${state.justiciarTargets.length}/${requiredTargets})`;
  } else {
    voteBtn.disabled = !state.selectedVoteId;
    voteBtn.textContent = 'Conferma Voto';
  }
}

function markGeneralChatAsRead(chatObj) {
  const messages = Object.values(chatObj || {});
  if (messages.length === 0) return;
  const maxTs = Math.max(...messages.map(m => Number(m.ts) || 0));
  if (maxTs > state.lastReadChatTs) {
    state.lastReadChatTs = maxTs;
    localStorage.setItem('trd_chat_ts', String(maxTs));
  }
}

function renderGeneralChat(chatObj) {
  const box = $('generalChatMessages');
  const badge = $('unreadChatBadge');
  if (!box) return;

  const wasNearBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 40;
  const messages = Object.values(chatObj || {});

  if (wasNearBottom) {
    markGeneralChatAsRead(chatObj);
  }

  const unreadCount = messages.filter(m => (Number(m.ts) || 0) > state.lastReadChatTs).length;
  if (badge) {
    if (unreadCount > 0) {
      badge.textContent = `${unreadCount} ${unreadCount === 1 ? 'nuovo' : 'nuovi'}`;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }

  box.innerHTML = '';
  if (messages.length === 0) {
    box.innerHTML = `<div class="chat-msg"><span class="wait-note">Nessun messaggio ancora. Confrontatevi qui su chi votare!</span></div>`;
    return;
  }

  messages.forEach(msg => {
    const div = document.createElement('div');
    div.className = 'chat-msg';
    const statusTag = msg.isGhost ? `<span class="chat-msg-meta">(Spettro)</span>` : '';
    div.innerHTML = `<strong>${escapeHtml(msg.from)}</strong>${statusTag}: ${escapeHtml(msg.text)}`;
    box.appendChild(div);
  });

  if (wasNearBottom || messages.length <= 2) {
    box.scrollTop = box.scrollHeight;
    markGeneralChatAsRead(chatObj);
    if (badge) badge.classList.add('hidden');
  }
}

async function sendGeneralChat() {
  const input = $('generalChatInput');
  if (!input || !state.roomCode || !state.playerId) return;
  const text = input.value.trim();
  if (!text) return;

  const me = state.roomData?.players?.[state.playerId];
  const senderName = me?.name || 'Giocatore';
  const isGhost = me ? !me.alive : false;
  const nowTs = Date.now();

  input.value = '';
  playTone(540, 0.1);
  state.lastReadChatTs = nowTs;
  localStorage.setItem('trd_chat_ts', String(nowTs));

  await db.ref(`rooms/${state.roomCode}/generalChat`).push({
    from: senderName,
    text,
    isGhost,
    ts: nowTs
  });
}

async function submitJusticiarAccusation() {
  const snap = await db.ref(`rooms/${state.roomCode}`).get();
  const room = snap.val();
  if (!room || room.meta.phase !== 'VOTING') return;

  const accusedIds = [...state.justiciarTargets];
  const aliveTraitorIds = Object.entries(room.players || {})
    .filter(([id, p]) => p.alive && room.secrets?.[id]?.role === 'TRAITOR')
    .map(([id]) => id);

  if (accusedIds.length !== aliveTraitorIds.length || aliveTraitorIds.length === 0) return;

  state.justiciarMode = false;
  state.justiciarTargets = [];

  const allCorrect = accusedIds.every(id => aliveTraitorIds.includes(id));
  const accuser = room.players[state.playerId];
  const updates = {
    [`rooms/${state.roomCode}/meta/justiciarUsed`]: true
  };

  if (allCorrect) {
    const capturedCount = accusedIds.length;
    const dramaticHeadline = capturedCount === 1
      ? 'Complimenti! Il traditore è stato catturato: il regno è salvo.'
      : 'Complimenti! I traditori sono stati catturati: il regno è salvo.';

    const capturedNames = accusedIds.map(id => room.players[id]?.name || 'Traditore').join(', ');
    accusedIds.forEach(id => {
      updates[`rooms/${state.roomCode}/players/${id}/alive`] = false;
    });

    updates[`rooms/${state.roomCode}/meta/winner`] = 'FAITHFUL';
    updates[`rooms/${state.roomCode}/meta/winnerHeadline`] = dramaticHeadline;
    updates[`rooms/${state.roomCode}/meta/winnerSummary`] = `${accuser.name}, nel ruolo di Giustiziere, ha smascherato pubblicamente ${capturedNames}!`;
    updates[`rooms/${state.roomCode}/meta/phase`] = 'GAME_OVER';

    playTone(720, 0.45, 'triangle');
    await db.ref().update(updates);
    await appendChronicleEvent(room.meta.round, `${accuser.name} (Giustiziere) ha smascherato ${capturedNames}: vittoria dei Fedeli!`);
  } else {
    updates[`rooms/${state.roomCode}/players/${state.playerId}/alive`] = false;
    Object.keys(room.players).forEach(id => {
      updates[`rooms/${state.roomCode}/players/${id}/votedFor`] = null;
    });
    updates[`rooms/${state.roomCode}/meta/exiledInfo`] = {
      tie: false,
      justiciarFailed: true,
      id: state.playerId,
      name: accuser.name,
      avatar: JUSTICIAR_IMG
    };
    updates[`rooms/${state.roomCode}/meta/phase`] = 'EXILE';

    playTone(170, 0.45, 'sawtooth');
    await db.ref().update(updates);
    await appendChronicleEvent(room.meta.round, `${accuser.name} ha fallito l'accusa del Giustiziere ed è stato squalificato.`);
    checkWinConditions();
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
  let chronicleText = '';

  if (topCandidates.length > 1) {
    updates[`rooms/${state.roomCode}/meta/exiledInfo`] = {
      tie: true,
      name: 'Parità di voti!',
      avatar: '⚖️'
    };
    chronicleText = 'Tavola Rotonda terminata in parità: nessun esilio.';
  } else {
    const exiledId = topCandidates[0];
    const exiledPlayer = room.players[exiledId];

    updates[`rooms/${state.roomCode}/players/${exiledId}/alive`] = false;
    updates[`rooms/${state.roomCode}/meta/exiledInfo`] = {
      tie: false,
      id: exiledId,
      name: exiledPlayer.name,
      avatar: ANON_AVATAR
    };
    chronicleText = `${exiledPlayer.name} è stato esiliato alla Tavola Rotonda.`;
  }

  Object.keys(room.players).forEach(id => {
    updates[`rooms/${state.roomCode}/players/${id}/votedFor`] = null;
  });

  updates[`rooms/${state.roomCode}/meta/phase`] = 'EXILE';
  await db.ref().update(updates);
  await appendChronicleEvent(room.meta.round, chronicleText);

  checkWinConditions();
}

// --- ESILIO / ESITO GIUSTIZIERE ---
function renderExilePhase(room, isHost) {
  showScreen('screen-exile');
  const info = room.meta.exiledInfo;
  if (!info) return;

  setContainerAvatar($('exileAvatar'), info.avatar || ANON_AVATAR, info.name || 'Esiliato');
  const badge = $('exileRoleReveal');

  if (info.justiciarFailed) {
    $('exileEyebrow').textContent = 'VERDETTO DEL GIUSTIZIERE';
    $('exileAnnouncement').textContent = `${info.name} è stato squalificato!`;
    badge.textContent = 'ACCUSA PUBBLICA FALLITA';
    badge.className = 'revealed-role-pill';
    $('exileSubtext').textContent = 'Ha accusato almeno un innocente alla Tavola Rotonda ed è stato espulso dal regno.';
  } else if (info.tie) {
    $('exileEyebrow').textContent = 'VERDETTO DELLA TAVOLA ROTONDA';
    $('exileAnnouncement').textContent = 'Nessun Esilio!';
    badge.textContent = 'PARITÀ ALLA TAVOLA ROTONDA';
    badge.className = 'revealed-role-pill';
    $('exileSubtext').textContent = 'Il gruppo non ha raggiunto una maggioranza. Nessuno lascia il gioco.';
  } else {
    $('exileEyebrow').textContent = 'VERDETTO DELLA TAVOLA ROTONDA';
    $('exileAnnouncement').textContent = `${info.name} è stato esiliato`;
    badge.textContent = 'RUOLO SEGRETO FINO A FINE PARTITA';
    badge.className = 'revealed-role-pill';
    $('exileSubtext').textContent = 'Il suo ruolo reale resterà segreto fino alla fine della partita.';
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
        <span class="vote-card-avatar">${renderAvatarHtml(ANON_AVATAR, p.name)}</span>
        <span class="v-name">${escapeHtml(p.name)}</span>
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
      chip.innerHTML = `${renderAvatarHtml(ANON_AVATAR, p.name, 'decoy-mini-avatar')} <span>${escapeHtml(p.name)}</span>`;
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
    div.innerHTML = `<strong>${escapeHtml(msg.from)}:</strong> ${escapeHtml(msg.text)}`;
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

  let chronicleText = '';

  if (isBlitzFirstNight) {
    updates[`rooms/${state.roomCode}/meta/morningInfo`] = {
      eliminated: false,
      icon: '🗡️',
      title: 'Notte di Avvertimento!',
      text: `I Traditori hanno lasciato un avvertimento a ${targetPlayer.name}, ma nella prima notte Blitz nessuno viene eliminato.`
    };
    chronicleText = `Prima notte Blitz: avvertimento per ${targetPlayer.name}, nessuna eliminazione.`;
  } else if (protectedByShield) {
    updates[`rooms/${state.roomCode}/meta/morningInfo`] = {
      eliminated: false,
      icon: SHIELD_IMG,
      title: 'Nessuno è stato eliminato!',
      text: 'I Traditori hanno colpito nell’ombra, ma lo Scudo segreto ha salvato la vittima!'
    };
    chronicleText = `Attacco notturno respinto dallo Scudo: nessuno eliminato all'alba.`;
  } else {
    updates[`rooms/${state.roomCode}/players/${targetId}/alive`] = false;
    updates[`rooms/${state.roomCode}/meta/morningInfo`] = {
      eliminated: true,
      icon: ANON_AVATAR,
      title: `${targetPlayer.name} non si è svegliato`,
      text: 'Qualcuno è stato eliminato durante la notte. Il suo ruolo resterà segreto fino a fine partita.'
    };
    chronicleText = `${targetPlayer.name} è stato eliminato durante la notte.`;
  }

  updates[`rooms/${state.roomCode}/meta/phase`] = 'MORNING';
  await db.ref().update(updates);
  await appendChronicleEvent(room.meta.round, chronicleText);
  checkWinConditions();
}

// --- ALBA ---
function renderMorningPhase(room, isHost) {
  showScreen('screen-morning');
  const info = room.meta.morningInfo;
  if (!info) return;

  const cueKey = `${room.meta.round}_${info.title}_${info.eliminated ? '1' : '0'}`;
  if (state.lastMorningCueKey !== cueKey) {
    state.lastMorningCueKey = cueKey;
    playCueSound(info.eliminated ? 'MORNING_VICTIM' : 'MORNING_SAFE');
  }

  setContainerAvatar($('morningIcon'), info.icon, info.title || 'Alba');
  $('morningTitle').textContent = info.title;
  $('morningText').textContent = info.text;

  const badge = $('morningRoleBadge');
  if (info.eliminated) {
    badge.textContent = 'RUOLO SEGRETO FINO A FINE PARTITA';
    badge.className = 'revealed-role-pill';
    badge.classList.remove('hidden');
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
  const nextMissionType = getMissionTypeForRound(nextRound);

  const updates = {
    [`rooms/${state.roomCode}/meta/round`]: nextRound,
    [`rooms/${state.roomCode}/meta/deckCursor`]: nextCursor,
    [`rooms/${state.roomCode}/meta/shieldWinnerId`]: null,
    [`rooms/${state.roomCode}/meta/missionType`]: nextMissionType
  };

  Object.keys(room.players).forEach(id => {
    updates[`rooms/${state.roomCode}/players/${id}/missionScore`] = null;
    updates[`rooms/${state.roomCode}/secrets/${id}/hasShield`] = false;
  });

  if (nextMissionType) {
    updates[`rooms/${state.roomCode}/meta/missionEndsAt`] = Date.now() + MISSION_DURATION_MS;
    updates[`rooms/${state.roomCode}/meta/phase`] = 'MISSION';
  } else {
    updates[`rooms/${state.roomCode}/meta/missionEndsAt`] = null;
    updates[`rooms/${state.roomCode}/meta/phase`] = 'VOTING';
  }

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
    await appendChronicleEvent(room.meta.round, 'Tutti i Traditori sono stati eliminati: vincono i Fedeli!');
  } else if (aliveTraitors >= aliveFaithfuls) {
    await db.ref(`rooms/${state.roomCode}/meta`).update({
      phase: 'GAME_OVER',
      winner: 'TRAITOR'
    });
    await appendChronicleEvent(room.meta.round, 'I Traditori hanno raggiunto la parità numerica e preso il regno.');
  }
}

// --- FINE PARTITA (RIVELAZIONE COMPLETA AVATAR + RUOLO + CRONACA) ---
function renderGameOverPhase(room, isHost) {
  showScreen('screen-gameover');
  const faithfulWon = room.meta.winner === 'FAITHFUL';

  $('winnerIcon').textContent = faithfulWon ? '👑' : '🗡️';
  $('winnerHeadline').textContent = room.meta.winnerHeadline
    || (faithfulWon ? 'VINCONO I FEDELI!' : 'VINCONO I TRADITORI!');
  $('winnerSummary').textContent = room.meta.winnerSummary
    || (faithfulWon
      ? 'Tutti i Traditori sono stati eliminati.'
      : 'I Traditori hanno raggiunto la parità numerica e preso il controllo.');

  const list = $('finalRolesList');
  list.innerHTML = '';
  Object.entries(room.players || {}).forEach(([id, p]) => {
    const secret = room.secrets?.[id] || {};
    const isTraitor = secret.role === 'TRAITOR';
    const finalAvatar = secret.personaAvatar || (isTraitor ? TRAITOR_PERSONA.avatar : 're.jpeg');
    const personaLabel = secret.personaLabel || (isTraitor ? TRAITOR_PERSONA.label : 'Fedele');

    const li = document.createElement('li');
    li.className = 'player-item';
    li.innerHTML = `
      <div class="player-left">
        <span class="player-avatar-slot">${renderAvatarHtml(finalAvatar, personaLabel)}</span>
        <span>${escapeHtml(p.name)} — <strong>${escapeHtml(personaLabel)}</strong> ${p.alive ? '' : '(Eliminato)'}</span>
      </div>
      <span class="pill" style="color: ${isTraitor ? '#ff4d6d' : '#58a6ff'}; font-weight:700;">
        ${isTraitor ? 'TRADITORE' : 'FEDELE'}
      </span>
    `;
    list.appendChild(li);
  });

  const chronicleList = $('chronicleList');
  if (chronicleList) {
    chronicleList.innerHTML = '';
    const events = Object.values(room.chronicle || {}).sort((a, b) => (a.ts || 0) - (b.ts || 0));
    if (events.length === 0) {
      chronicleList.innerHTML = `<li class="chronicle-item"><span class="wait-note">Nessun evento registrato.</span></li>`;
    } else {
      events.forEach(ev => {
        const li = document.createElement('li');
        li.className = 'chronicle-item';
        li.innerHTML = `<span class="chronicle-round">Round ${escapeHtml(ev.round || 1)}</span> ${escapeHtml(ev.text)}`;
        chronicleList.appendChild(li);
      });
    }
  }

  $('hostGameOverControls').classList.toggle('hidden', !isHost);
}

async function resetToLobby() {
  const room = state.roomData;
  const updates = {
    [`rooms/${state.roomCode}/meta/phase`]: 'LOBBY',
    [`rooms/${state.roomCode}/meta/round`]: 1,
    [`rooms/${state.roomCode}/meta/missionType`]: 'SHIELD',
    [`rooms/${state.roomCode}/meta/missionEndsAt`]: null,
    [`rooms/${state.roomCode}/meta/shieldWinnerId`]: null,
    [`rooms/${state.roomCode}/meta/monocleWinnerId`]: null,
    [`rooms/${state.roomCode}/meta/monocleResult`]: null,
    [`rooms/${state.roomCode}/meta/justiciarWinnerId`]: null,
    [`rooms/${state.roomCode}/meta/justiciarUsed`]: false,
    [`rooms/${state.roomCode}/meta/exiledInfo`]: null,
    [`rooms/${state.roomCode}/meta/morningInfo`]: null,
    [`rooms/${state.roomCode}/meta/winner`]: null,
    [`rooms/${state.roomCode}/meta/winnerHeadline`]: null,
    [`rooms/${state.roomCode}/meta/winnerSummary`]: null,
    [`rooms/${state.roomCode}/secrets`]: null,
    [`rooms/${state.roomCode}/generalChat`]: null,
    [`rooms/${state.roomCode}/chronicle`]: null
  };

  Object.keys(room.players || {}).forEach(id => {
    updates[`rooms/${state.roomCode}/players/${id}/avatar`] = ANON_AVATAR;
    updates[`rooms/${state.roomCode}/players/${id}/alive`] = true;
    updates[`rooms/${state.roomCode}/players/${id}/ready`] = false;
    updates[`rooms/${state.roomCode}/players/${id}/votedFor`] = null;
    updates[`rooms/${state.roomCode}/players/${id}/missionScore`] = null;
  });

  await db.ref().update(updates);
}

import type {
	CharacterEntry,
	Entry,
	ItemEntry,
	LocationEntry,
	MonsterEntry,
	QuestEntry,
	Region,
	RoadSegment,
	RoutineSlot,
	WorldSummary
} from './types.js';

export const WORLD_WIDTH = 1000;
export const WORLD_HEIGHT = 640;
export const METERS_PER_WORLD_UNIT = 12;

export const ISLAND_OUTLINE =
	'M190,330 C170,260 230,190 300,160 C360,120 420,90 500,80 C600,60 700,70 780,100 C850,130 890,200 880,280 C872,350 900,400 860,470 C820,540 740,580 650,590 C560,600 470,570 400,585 C330,600 260,570 230,520 C200,470 205,400 190,330 Z';

export const ROADS: readonly RoadSegment[] = [
	{ id: 'port-sekob', path: 'M320,470 C400,450 480,440 560,430' },
	{ id: 'sekob-harpia', path: 'M560,430 C550,380 530,330 520,290' },
	{ id: 'harpia-onar', path: 'M520,290 C570,290 610,295 640,300' },
	{ id: 'harpia-xardas', path: 'M520,290 C500,250 490,210 480,170' },
	{ id: 'onar-bengar', path: 'M640,300 C690,270 730,245 760,220' },
	{ id: 'onar-klasztor', path: 'M640,300 C660,230 680,170 700,130' },
	{ id: 'klasztor-przelecz', path: 'M700,130 C740,120 770,115 800,110' },
	{ id: 'port-latarnia', path: 'M320,470 C270,490 220,510 190,520' },
	{ id: 'miasto-krag', path: 'M360,400 C380,360 400,330 420,300' },
	{ id: 'harpia-kopalnia', path: 'M520,290 C550,240 580,205 600,180' }
];

export const RIVER_PATH =
	'M700,130 C650,200 600,260 560,330 C530,380 470,420 420,470 C380,500 350,510 330,505';

export const REGIONS: readonly Region[] = [
	{ id: 'wybrzeze', name: 'Wybrzeże Południowe', x: 400, y: 548, rotate: -3 },
	{ id: 'pogorze', name: 'Pogórze Onara', x: 655, y: 365, rotate: 4 },
	{ id: 'gory', name: 'Góry Północne', x: 540, y: 112, rotate: -2 },
	{ id: 'wyzyna', name: 'Wyżyna Klasztorna', x: 790, y: 190, rotate: 18 }
];

function buildRoutine(
	dayActivity: string,
	dayPlaceId: string,
	eveningActivity: string,
	eveningPlaceId: string,
	nightActivity: string,
	nightPlaceId: string
): RoutineSlot[] {
	return [
		{ fromHour: 6, toHour: 18, activity: dayActivity, locationId: dayPlaceId },
		{ fromHour: 18, toHour: 23, activity: eveningActivity, locationId: eveningPlaceId },
		{ fromHour: 23, toHour: 30, activity: nightActivity, locationId: nightPlaceId }
	];
}

const locations: readonly LocationEntry[] = [
	{
		id: 'khorinis-port',
		category: 'location',
		name: 'Port w Khorinis',
		summary: 'Nabrzeże z targiem, karczmą i okrętami Królewskiej Floty.',
		x: 300,
		y: 490,
		labelTier: 1,
		regionId: 'wybrzeze',
		kind: 'district',
		kindLabel: 'Dzielnica',
		scene: 'town',
		description: [
			'Port jest dolną, najgłośniejszą częścią miasta. Przy nabrzeżu cumują statki, a stragany sprzedają ryby, liny i tanie piwo.',
			'Straż pilnuje tylko bramy do Górnego Miasta. Reszta należy do kupców, przemytników i tych, którzy nie pytają o pochodzenie towaru.'
		],
		facts: [
			{ label: 'Region', value: 'Wybrzeże Południowe' },
			{ label: 'Wysokość', value: '2 m n.p.m.' },
			{ label: 'Dostęp', value: 'Otwarty przez cały dzień' }
		],
		characterIds: ['vatras', 'lares'],
		itemIds: ['mikstura-uzdrawiajaca'],
		monsterIds: [],
		questIds: ['zaginiona-dostawa']
	},
	{
		id: 'gorne-miasto',
		category: 'location',
		name: 'Górne Miasto',
		summary: 'Dzielnica paladynów za wysokim murem.',
		x: 365,
		y: 395,
		labelTier: 1,
		regionId: 'wybrzeze',
		kind: 'district',
		kindLabel: 'Dzielnica',
		scene: 'town',
		description: [
			'Za murem stoi ratusz, koszary i rezydencja namiestnika. Wstęp mają mieszkańcy, goście z listem i ci, którzy zapłacą strażnikom przy bramie.',
			'Z tarasu przy ratuszu widać całe wybrzeże, a w pogodny dzień nawet latarnię.'
		],
		facts: [
			{ label: 'Region', value: 'Wybrzeże Południowe' },
			{ label: 'Wysokość', value: '38 m n.p.m.' },
			{ label: 'Dostęp', value: 'Ograniczony, wymaga zgody straży' }
		],
		characterIds: ['lord-hagen', 'lord-andre'],
		itemIds: ['zbroja-paladyna'],
		monsterIds: [],
		questIds: ['polowanie-na-zebacze', 'oko-innosa']
	},
	{
		id: 'dolne-miasto',
		category: 'location',
		name: 'Dolne Miasto',
		summary: 'Warsztaty rzemieślników i ciasne zaułki.',
		x: 335,
		y: 440,
		labelTier: 2,
		regionId: 'wybrzeze',
		kind: 'district',
		kindLabel: 'Dzielnica',
		scene: 'town',
		description: [
			'Kowal, stolarz i szewc mieszkają tu nad własnymi warsztatami. Rano słychać młot, wieczorem kłótnie o czynsz.'
		],
		facts: [
			{ label: 'Region', value: 'Wybrzeże Południowe' },
			{ label: 'Wysokość', value: '14 m n.p.m.' }
		],
		characterIds: ['harad'],
		itemIds: ['mlot-kowalski'],
		monsterIds: [],
		questIds: []
	},
	{
		id: 'farma-onara',
		category: 'location',
		name: 'Farma Onara',
		summary: 'Największe gospodarstwo wyspy, siedziba najemników.',
		x: 640,
		y: 300,
		labelTier: 1,
		regionId: 'pogorze',
		kind: 'farm',
		kindLabel: 'Farma',
		scene: 'farm',
		description: [
			'Pola ciągną się aż do skraju lasu, a na wzgórzu stoi dwór właściciela. Najemnicy rozbili obóz przy młynie i pilnują, by nikt nie zbliżył się do zbiorów.',
			'Droga z Khorinis zajmuje pół dnia marszu, o ile nie zatrzyma cię patrol.'
		],
		facts: [
			{ label: 'Region', value: 'Pogórze Onara' },
			{ label: 'Wysokość', value: '112 m n.p.m.' },
			{ label: 'Dostęp', value: 'Otwarty' }
		],
		characterIds: ['onar', 'lee'],
		itemIds: [],
		monsterIds: [],
		questIds: ['zaginiona-dostawa']
	},
	{
		id: 'farma-sekoba',
		category: 'location',
		name: 'Farma Sekoba',
		summary: 'Mała farma przy głównym trakcie.',
		x: 560,
		y: 430,
		labelTier: 2,
		regionId: 'pogorze',
		kind: 'farm',
		kindLabel: 'Farma',
		scene: 'farm',
		description: ['Sekob dzierżawi ziemię od Onara i nie lubi, gdy ktoś o tym przypomina.'],
		facts: [
			{ label: 'Region', value: 'Pogórze Onara' },
			{ label: 'Wysokość', value: '74 m n.p.m.' }
		],
		characterIds: ['sekob'],
		itemIds: [],
		monsterIds: [],
		questIds: ['zaginiona-dostawa']
	},
	{
		id: 'farma-bengara',
		category: 'location',
		name: 'Farma Bengara',
		summary: 'Samotne gospodarstwo na stoku.',
		x: 760,
		y: 220,
		labelTier: 2,
		regionId: 'wyzyna',
		kind: 'farm',
		kindLabel: 'Farma',
		scene: 'farm',
		description: ['Najwyżej położona farma wyspy. Zimą droga w dół bywa nieprzejezdna.'],
		facts: [
			{ label: 'Region', value: 'Wyżyna Klasztorna' },
			{ label: 'Wysokość', value: '186 m n.p.m.' }
		],
		characterIds: ['bengar'],
		itemIds: [],
		monsterIds: [],
		questIds: []
	},
	{
		id: 'klasztor-innosa',
		category: 'location',
		name: 'Klasztor Innosa',
		summary: 'Twierdza magów Ognia na skalnym tarasie.',
		x: 700,
		y: 130,
		labelTier: 1,
		regionId: 'wyzyna',
		kind: 'monastery',
		kindLabel: 'Klasztor',
		scene: 'monastery',
		description: [
			'Mury klasztoru wyrastają wprost z urwiska. Nowicjusze uczą się tu pokory, a magowie pilnują ksiąg, których nikt nie powinien czytać bez przygotowania.',
			'Bramę otwiera tylko ten, kto zapłaci wpisowe albo przyniesie ofiarę dla Innosa.'
		],
		facts: [
			{ label: 'Region', value: 'Wyżyna Klasztorna' },
			{ label: 'Wysokość', value: '240 m n.p.m.' },
			{ label: 'Dostęp', value: 'Za opłatą lub ofiarą' }
		],
		characterIds: ['pyrokar'],
		itemIds: ['runa-kula-ognia'],
		monsterIds: [],
		questIds: ['oko-innosa']
	},
	{
		id: 'wieza-xardasa',
		category: 'location',
		name: 'Wieża Xardasa',
		summary: 'Samotna wieża czarnoksiężnika nad doliną.',
		x: 480,
		y: 170,
		labelTier: 1,
		regionId: 'gory',
		kind: 'tower',
		kindLabel: 'Wieża',
		scene: 'tower',
		description: [
			'Wieża stoi poza szlakiem, więc przypadkowi wędrowcy jej nie znajdują. Wokół rosną ostrokrzewy, a w oknach pali się światło także za dnia.'
		],
		facts: [
			{ label: 'Region', value: 'Góry Północne' },
			{ label: 'Wysokość', value: '198 m n.p.m.' },
			{ label: 'Dostęp', value: 'Tylko po zaproszeniu' }
		],
		characterIds: ['xardas'],
		itemIds: ['starozytny-amulet'],
		monsterIds: ['cieniostwor'],
		questIds: ['wieza-na-uboczu']
	},
	{
		id: 'martwa-harpia',
		category: 'location',
		name: 'Karczma „Pod Martwą Harpią”',
		summary: 'Przydrożna karczma na skrzyżowaniu traktów.',
		x: 520,
		y: 290,
		labelTier: 2,
		regionId: 'pogorze',
		kind: 'tavern',
		kindLabel: 'Karczma',
		scene: 'tavern',
		description: [
			'Tu spotykają się kupcy, łowcy i ludzie, którzy chcą wiedzieć, co dzieje się na farmach.'
		],
		facts: [
			{ label: 'Region', value: 'Pogórze Onara' },
			{ label: 'Wysokość', value: '96 m n.p.m.' }
		],
		characterIds: ['coragon'],
		itemIds: [],
		monsterIds: [],
		questIds: []
	},
	{
		id: 'latarnia',
		category: 'location',
		name: 'Latarnia morska',
		summary: 'Biała wieża na południowo-zachodnim cyplu.',
		x: 190,
		y: 520,
		labelTier: 2,
		regionId: 'wybrzeze',
		kind: 'lighthouse',
		kindLabel: 'Latarnia',
		scene: 'lighthouse',
		description: ['Światło latarni prowadzi okręty do portu. Od dawna nikt nie widział latarnika.'],
		facts: [
			{ label: 'Region', value: 'Wybrzeże Południowe' },
			{ label: 'Wysokość', value: '22 m n.p.m.' }
		],
		characterIds: [],
		itemIds: [],
		monsterIds: [],
		questIds: []
	},
	{
		id: 'kamienny-krag',
		category: 'location',
		name: 'Kamienny krąg',
		summary: 'Pradawne megality na wzgórzu.',
		x: 420,
		y: 300,
		labelTier: 2,
		regionId: 'wybrzeze',
		kind: 'circle',
		kindLabel: 'Miejsce mocy',
		scene: 'circle',
		description: [
			'Kamienie ustawiono tak, że w przesilenie cień jednego z nich wskazuje środek kręgu. Zwierzyna omija to miejsce, poza zębaczami.'
		],
		facts: [
			{ label: 'Region', value: 'Wybrzeże Południowe' },
			{ label: 'Wysokość', value: '88 m n.p.m.' }
		],
		characterIds: [],
		itemIds: [],
		monsterIds: ['zebacz'],
		questIds: ['polowanie-na-zebacze']
	},
	{
		id: 'opuszczona-kopalnia',
		category: 'location',
		name: 'Opuszczona kopalnia',
		summary: 'Zawalone sztolnie pod górskim grzbietem.',
		x: 600,
		y: 180,
		labelTier: 2,
		regionId: 'gory',
		kind: 'mine',
		kindLabel: 'Jaskinia lub loch',
		scene: 'mine',
		description: [
			'Wejście zabito deskami, ale ktoś je wyłamał od środka. Wewnątrz słychać skrobanie.'
		],
		facts: [
			{ label: 'Region', value: 'Góry Północne' },
			{ label: 'Wysokość', value: '164 m n.p.m.' },
			{ label: 'Dostęp', value: 'Niebezpieczny' }
		],
		characterIds: [],
		itemIds: [],
		monsterIds: ['pelzacz'],
		questIds: ['wieza-na-uboczu']
	},
	{
		id: 'przelecz',
		category: 'location',
		name: 'Przełęcz do Górniczej Doliny',
		summary: 'Przejście do innego świata.',
		x: 800,
		y: 110,
		labelTier: 2,
		regionId: 'wyzyna',
		kind: 'passage',
		kindLabel: 'Przejście do innego świata',
		scene: 'passage',
		description: [
			'Wąska ścieżka między skałami prowadzi do Górniczej Doliny. Strzeże jej troll, który nie przepuszcza nikogo bez ostrzeżenia.'
		],
		facts: [
			{ label: 'Region', value: 'Wyżyna Klasztorna' },
			{ label: 'Prowadzi do', value: 'Górnicza Dolina' }
		],
		characterIds: [],
		itemIds: [],
		monsterIds: ['troll'],
		questIds: []
	}
];

const characters: readonly CharacterEntry[] = [
	{
		id: 'lord-hagen',
		category: 'character',
		name: 'Lord Hagen',
		summary: 'Namiestnik króla i dowódca paladynów.',
		x: 372,
		y: 388,
		labelTier: 2,
		regionId: 'wybrzeze',
		role: 'Namiestnik',
		guild: 'Paladyni',
		locationId: 'gorne-miasto',
		description:
			'Dowodzi garnizonem i podejmuje decyzje o obronie wyspy. Rozmawia z każdym, kto przynosi dowody, a nie plotki.',
		routine: buildRoutine(
			'Obrady w ratuszu',
			'gorne-miasto',
			'Kolacja z oficerami',
			'gorne-miasto',
			'Sen',
			'gorne-miasto'
		),
		questIds: ['oko-innosa'],
		itemIds: ['zbroja-paladyna'],
		facts: [
			{ label: 'Gildia', value: 'Paladyni' },
			{ label: 'Poziom', value: '20' },
			{ label: 'Handel', value: 'Nie' }
		]
	},
	{
		id: 'lord-andre',
		category: 'character',
		name: 'Lord Andre',
		summary: 'Dowódca straży miejskiej.',
		x: 358,
		y: 405,
		labelTier: 2,
		regionId: 'wybrzeze',
		role: 'Dowódca straży',
		guild: 'Paladyni',
		locationId: 'gorne-miasto',
		description: 'Przyjmuje zgłoszenia od mieszkańców i przydziela patrole.',
		routine: buildRoutine(
			'Odprawa straży',
			'gorne-miasto',
			'Obchód muru',
			'gorne-miasto',
			'Sen',
			'gorne-miasto'
		),
		questIds: ['polowanie-na-zebacze'],
		itemIds: [],
		facts: [
			{ label: 'Gildia', value: 'Paladyni' },
			{ label: 'Poziom', value: '18' }
		]
	},
	{
		id: 'harad',
		category: 'character',
		name: 'Harad',
		summary: 'Kowal z Dolnego Miasta.',
		x: 332,
		y: 448,
		labelTier: 2,
		regionId: 'wybrzeze',
		role: 'Kowal',
		guild: 'Mieszczanie',
		locationId: 'dolne-miasto',
		description: 'Kuje broń dla straży i uczy fachu każdego, kto zapłaci za naukę.',
		routine: buildRoutine(
			'Kuźnia',
			'dolne-miasto',
			'Kolacja w domu',
			'dolne-miasto',
			'Sen',
			'dolne-miasto'
		),
		questIds: [],
		itemIds: ['mlot-kowalski'],
		facts: [
			{ label: 'Gildia', value: 'Mieszczanie' },
			{ label: 'Handel', value: 'Broń i zbroje' },
			{ label: 'Nauka', value: 'Kowalstwo' }
		]
	},
	{
		id: 'vatras',
		category: 'character',
		name: 'Vatras',
		summary: 'Mag Wody, kapłan Adanosa.',
		x: 288,
		y: 480,
		labelTier: 2,
		regionId: 'wybrzeze',
		role: 'Mag Wody',
		guild: 'Magowie Wody',
		locationId: 'khorinis-port',
		description:
			'Prowadzi modlitwy w porcie i udziela porad tym, którzy chcą uniknąć rozlewu krwi.',
		routine: buildRoutine(
			'Modlitwa i porady',
			'khorinis-port',
			'Spacer nad wodą',
			'khorinis-port',
			'Medytacja',
			'khorinis-port'
		),
		questIds: [],
		itemIds: [],
		facts: [
			{ label: 'Gildia', value: 'Magowie Wody' },
			{ label: 'Poziom', value: '25' },
			{ label: 'Uzdrawianie', value: 'Tak' }
		]
	},
	{
		id: 'lares',
		category: 'character',
		name: 'Lares',
		summary: 'Przemytnik i łącznik rebeliantów.',
		x: 312,
		y: 498,
		labelTier: 2,
		regionId: 'wybrzeze',
		role: 'Przemytnik',
		guild: 'Rebelianci',
		locationId: 'khorinis-port',
		description: 'Zna każdą łódź w porcie i każdego strażnika, któremu można zamknąć usta srebrem.',
		routine: buildRoutine(
			'Obchód nabrzeża',
			'khorinis-port',
			'Spotkanie w karczmie',
			'martwa-harpia',
			'Sen',
			'khorinis-port'
		),
		questIds: ['zaginiona-dostawa'],
		itemIds: [],
		facts: [
			{ label: 'Gildia', value: 'Rebelianci' },
			{ label: 'Poziom', value: '19' }
		]
	},
	{
		id: 'xardas',
		category: 'character',
		name: 'Xardas',
		summary: 'Czarnoksiężnik z samotnej wieży.',
		x: 484,
		y: 178,
		labelTier: 2,
		regionId: 'gory',
		role: 'Czarnoksiężnik',
		guild: 'Bez gildii',
		locationId: 'wieza-xardasa',
		description: 'Od lat bada znaki zwiastujące powrót dawnych sił. Rzadko opuszcza wieżę.',
		routine: buildRoutine(
			'Studia nad księgami',
			'wieza-xardasa',
			'Rytuały',
			'wieza-xardasa',
			'Czuwanie',
			'wieza-xardasa'
		),
		questIds: ['wieza-na-uboczu'],
		itemIds: ['starozytny-amulet'],
		facts: [
			{ label: 'Gildia', value: 'Bez gildii' },
			{ label: 'Poziom', value: '50' },
			{ label: 'Nauka', value: 'Magia' }
		]
	},
	{
		id: 'onar',
		category: 'character',
		name: 'Onar',
		summary: 'Wielki właściciel ziemski.',
		x: 650,
		y: 292,
		labelTier: 2,
		regionId: 'pogorze',
		role: 'Właściciel ziemski',
		guild: 'Farmerzy',
		locationId: 'farma-onara',
		description: 'Opłaca najemników, by podatki trafiały na jego farmę, a nie do miasta.',
		routine: buildRoutine(
			'Nadzór nad polami',
			'farma-onara',
			'Kolacja w dworze',
			'farma-onara',
			'Sen',
			'farma-onara'
		),
		questIds: ['zaginiona-dostawa'],
		itemIds: [],
		facts: [
			{ label: 'Gildia', value: 'Farmerzy' },
			{ label: 'Poziom', value: '14' }
		]
	},
	{
		id: 'lee',
		category: 'character',
		name: 'Lee',
		summary: 'Dowódca najemników.',
		x: 628,
		y: 312,
		labelTier: 2,
		regionId: 'pogorze',
		role: 'Dowódca najemników',
		guild: 'Najemnicy',
		locationId: 'farma-onara',
		description:
			'Były generał królewski. Utrzymuje porządek w obozie i płaci rachunki za cudze błędy.',
		routine: buildRoutine(
			'Odprawa najemników',
			'farma-onara',
			'Obchód obozu',
			'farma-onara',
			'Sen',
			'farma-onara'
		),
		questIds: [],
		itemIds: [],
		facts: [
			{ label: 'Gildia', value: 'Najemnicy' },
			{ label: 'Poziom', value: '24' }
		]
	},
	{
		id: 'pyrokar',
		category: 'character',
		name: 'Mistrz Pyrokar',
		summary: 'Najwyższy mag Ognia.',
		x: 708,
		y: 138,
		labelTier: 2,
		regionId: 'wyzyna',
		role: 'Najwyższy mag',
		guild: 'Magowie Ognia',
		locationId: 'klasztor-innosa',
		description:
			'Przewodzi Radzie Magów. Wymaga od uczniów posłuszeństwa i milczenia w sprawach, których nie rozumieją.',
		routine: buildRoutine(
			'Narada Rady',
			'klasztor-innosa',
			'Modlitwa',
			'klasztor-innosa',
			'Sen',
			'klasztor-innosa'
		),
		questIds: ['oko-innosa'],
		itemIds: ['runa-kula-ognia'],
		facts: [
			{ label: 'Gildia', value: 'Magowie Ognia' },
			{ label: 'Poziom', value: '30' }
		]
	},
	{
		id: 'sekob',
		category: 'character',
		name: 'Sekob',
		summary: 'Dzierżawca z głównego traktu.',
		x: 566,
		y: 436,
		labelTier: 2,
		regionId: 'pogorze',
		role: 'Farmer',
		guild: 'Farmerzy',
		locationId: 'farma-sekoba',
		description: 'Narzeka na podatki, pogodę i najemników. Zwykle w tej kolejności.',
		routine: buildRoutine(
			'Praca w polu',
			'farma-sekoba',
			'Kolacja',
			'farma-sekoba',
			'Sen',
			'farma-sekoba'
		),
		questIds: ['zaginiona-dostawa'],
		itemIds: [],
		facts: [{ label: 'Gildia', value: 'Farmerzy' }]
	},
	{
		id: 'bengar',
		category: 'character',
		name: 'Bengar',
		summary: 'Farmer z górskiego stoku.',
		x: 766,
		y: 226,
		labelTier: 2,
		regionId: 'wyzyna',
		role: 'Farmer',
		guild: 'Farmerzy',
		locationId: 'farma-bengara',
		description: 'Hoduje owce i pilnuje, by wilki nie zeszły z gór.',
		routine: buildRoutine(
			'Wypas owiec',
			'farma-bengara',
			'Kolacja',
			'farma-bengara',
			'Sen',
			'farma-bengara'
		),
		questIds: [],
		itemIds: [],
		facts: [{ label: 'Gildia', value: 'Farmerzy' }]
	},
	{
		id: 'coragon',
		category: 'character',
		name: 'Coragon',
		summary: 'Karczmarz spod Martwej Harpii.',
		x: 526,
		y: 296,
		labelTier: 2,
		regionId: 'pogorze',
		role: 'Karczmarz',
		guild: 'Mieszczanie',
		locationId: 'martwa-harpia',
		description: 'Nalewa, słucha i nigdy nie powtarza tego, co słyszy. Zwykle.',
		routine: buildRoutine(
			'Obsługa gości',
			'martwa-harpia',
			'Obsługa gości',
			'martwa-harpia',
			'Sen',
			'martwa-harpia'
		),
		questIds: [],
		itemIds: [],
		facts: [
			{ label: 'Gildia', value: 'Mieszczanie' },
			{ label: 'Handel', value: 'Jedzenie i napoje' }
		]
	}
];

const items: readonly ItemEntry[] = [
	{
		id: 'mikstura-uzdrawiajaca',
		category: 'item',
		name: 'Mikstura uzdrawiająca',
		summary: 'Przywraca część zdrowia.',
		x: 306,
		y: 502,
		labelTier: 2,
		regionId: 'wybrzeze',
		kindLabel: 'Mikstura',
		locationId: 'khorinis-port'
	},
	{
		id: 'zbroja-paladyna',
		category: 'item',
		name: 'Zbroja paladyna',
		summary: 'Ciężka zbroja płytowa.',
		x: 378,
		y: 408,
		labelTier: 2,
		regionId: 'wybrzeze',
		kindLabel: 'Zbroja',
		locationId: 'gorne-miasto'
	},
	{
		id: 'mlot-kowalski',
		category: 'item',
		name: 'Młot kowalski',
		summary: 'Narzędzie kowala.',
		x: 322,
		y: 432,
		labelTier: 2,
		regionId: 'wybrzeze',
		kindLabel: 'Narzędzie',
		locationId: 'dolne-miasto'
	},
	{
		id: 'runa-kula-ognia',
		category: 'item',
		name: 'Runa „Kula ognia”',
		summary: 'Kamień z zaklęciem ognia.',
		x: 692,
		y: 120,
		labelTier: 2,
		regionId: 'wyzyna',
		kindLabel: 'Runa',
		locationId: 'klasztor-innosa'
	},
	{
		id: 'starozytny-amulet',
		category: 'item',
		name: 'Starożytny amulet',
		summary: 'Wisior z nieznanym znakiem.',
		x: 470,
		y: 160,
		labelTier: 2,
		regionId: 'gory',
		kindLabel: 'Amulet',
		locationId: 'wieza-xardasa'
	}
];

const monsters: readonly MonsterEntry[] = [
	{
		id: 'zebacz',
		category: 'monster',
		name: 'Zębacz',
		summary: 'Szybki drapieżny ptak.',
		x: 438,
		y: 316,
		labelTier: 2,
		regionId: 'wybrzeze',
		danger: 'średnie',
		locationId: 'kamienny-krag'
	},
	{
		id: 'pelzacz',
		category: 'monster',
		name: 'Pełzacz',
		summary: 'Pancerny owad z kopalni.',
		x: 612,
		y: 194,
		labelTier: 2,
		regionId: 'gory',
		danger: 'wysokie',
		locationId: 'opuszczona-kopalnia'
	},
	{
		id: 'cieniostwor',
		category: 'monster',
		name: 'Cieniostwór',
		summary: 'Wielki rogaty drapieżnik.',
		x: 452,
		y: 140,
		labelTier: 2,
		regionId: 'gory',
		danger: 'wysokie',
		locationId: 'wieza-xardasa'
	},
	{
		id: 'troll',
		category: 'monster',
		name: 'Troll',
		summary: 'Strażnik przełęczy.',
		x: 812,
		y: 124,
		labelTier: 2,
		regionId: 'wyzyna',
		danger: 'wysokie',
		locationId: 'przelecz'
	}
];

const quests: readonly QuestEntry[] = [
	{
		id: 'zaginiona-dostawa',
		category: 'quest',
		name: 'Zaginiona dostawa',
		summary: 'Skrzynie z portu nie dotarły na farmę.',
		x: 470,
		y: 442,
		labelTier: 2,
		regionId: 'wybrzeze',
		chapter: 1,
		giverId: 'lares',
		reward: '150 sztuk złota',
		steps: [
			{ text: 'Porozmawiaj z Laresem w porcie.', locationId: 'khorinis-port' },
			{ text: 'Sprawdź trakt przy Farmie Sekoba.', locationId: 'farma-sekoba' },
			{ text: 'Zanieś informację Onarowi.', locationId: 'farma-onara' }
		]
	},
	{
		id: 'polowanie-na-zebacze',
		category: 'quest',
		name: 'Polowanie na zębacze',
		summary: 'Stado zębaczy zeszło z gór pod miasto.',
		x: 408,
		y: 282,
		labelTier: 2,
		regionId: 'wybrzeze',
		chapter: 2,
		giverId: 'lord-andre',
		reward: '90 sztuk złota',
		steps: [
			{ text: 'Odbierz zlecenie od Lorda Andre.', locationId: 'gorne-miasto' },
			{ text: 'Zabij zębacze przy Kamiennym kręgu.', locationId: 'kamienny-krag' }
		]
	},
	{
		id: 'wieza-na-uboczu',
		category: 'quest',
		name: 'Wieża na uboczu',
		summary: 'Xardas prosi o ziele z górskich zboczy.',
		x: 500,
		y: 204,
		labelTier: 2,
		regionId: 'gory',
		chapter: 3,
		giverId: 'xardas',
		reward: 'Zwój „Lodowa strzała”',
		steps: [
			{ text: 'Dotrzyj do Wieży Xardasa.', locationId: 'wieza-xardasa' },
			{ text: 'Zbierz ziele przy Opuszczonej kopalni.', locationId: 'opuszczona-kopalnia' },
			{ text: 'Wróć do wieży.', locationId: 'wieza-xardasa' }
		]
	},
	{
		id: 'oko-innosa',
		category: 'quest',
		name: 'Oko Innosa',
		summary: 'Magowie Ognia szukają zaginionego artefaktu.',
		x: 718,
		y: 152,
		labelTier: 2,
		regionId: 'wyzyna',
		chapter: 3,
		giverId: 'pyrokar',
		reward: 'Przyjęcie do Rady',
		steps: [
			{ text: 'Uzyskaj audiencję u Lorda Hagena.', locationId: 'gorne-miasto' },
			{ text: 'Zgłoś się do Klasztoru Innosa.', locationId: 'klasztor-innosa' }
		]
	}
];

export const LOCATIONS = locations;
export const CHARACTERS = characters;
export const QUESTS = quests;
export const ALL_ENTRIES: readonly Entry[] = [
	...locations,
	...characters,
	...items,
	...monsters,
	...quests
];

export function findEntry(id: string): Entry | undefined {
	return ALL_ENTRIES.find((entry) => entry.id === id);
}

export function findLocation(id: string): LocationEntry | undefined {
	return locations.find((entry) => entry.id === id);
}

export function findCharacter(id: string): CharacterEntry | undefined {
	return characters.find((entry) => entry.id === id);
}

export function findQuest(id: string): QuestEntry | undefined {
	return quests.find((entry) => entry.id === id);
}

export function listEntriesByIds(ids: readonly string[]): Entry[] {
	return ids.flatMap((id) => {
		const entry = findEntry(id);
		return entry ? [entry] : [];
	});
}

export const CHAPTER_NAMES: readonly string[] = [
	'Rozdział 1',
	'Rozdział 2',
	'Rozdział 3',
	'Rozdział 4',
	'Rozdział 5',
	'Rozdział 6'
];

export const WORLD_SUMMARIES: readonly WorldSummary[] = [
	{
		id: 'khorinis',
		gameName: 'Gothic 2: Noc Kruka',
		name: 'Khorinis',
		areaKm2: 36,
		places: 14,
		characters: 194,
		items: 312,
		hasChapters: true,
		outline: ISLAND_OUTLINE
	},
	{
		id: 'gornicza-dolina',
		gameName: 'Gothic 2: Noc Kruka',
		name: 'Górnicza Dolina',
		areaKm2: 12,
		places: 9,
		characters: 88,
		items: 140,
		hasChapters: true,
		outline:
			'M120,80 C260,40 520,30 760,90 C900,130 940,300 860,420 C780,540 520,600 300,560 C160,530 70,380 90,240 C100,170 100,110 120,80 Z'
	},
	{
		id: 'jarkendar',
		gameName: 'Gothic 2: Noc Kruka',
		name: 'Jarkendar',
		areaKm2: 5,
		places: 6,
		characters: 41,
		items: 96,
		hasChapters: true,
		outline:
			'M300,120 C420,60 640,70 740,170 C830,260 790,430 660,520 C520,600 330,560 250,430 C190,330 220,190 300,120 Z'
	},
	{
		id: 'kolonia',
		gameName: 'Gothic',
		name: 'Kolonia Karna',
		areaKm2: 9,
		places: 11,
		characters: 120,
		items: 210,
		hasChapters: true,
		outline:
			'M160,160 C300,70 620,60 800,150 C920,230 900,420 780,500 C620,590 340,580 200,490 C110,420 90,240 160,160 Z'
	},
	{
		id: 'myrtana',
		gameName: 'Gothic 3',
		name: 'Myrtana',
		areaKm2: 140,
		places: 38,
		characters: 620,
		items: 900,
		hasChapters: false,
		outline:
			'M70,200 C150,60 420,20 640,60 C860,100 960,260 930,420 C900,560 620,610 400,585 C200,570 40,440 70,200 Z'
	}
];

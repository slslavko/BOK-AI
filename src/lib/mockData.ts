// Mock dane do aplikacji BOK AI

export const mockMetrics = [
  {
    label: "Odpowiedzi dzisiaj",
    value: 128,
    icon: "Zap",
  },
  {
    label: "Śr. czas odpowiedzi",
    value: "30s",
    icon: "Timer",
  },
  {
    label: "Zadowolenie klientów",
    value: "99.7%",
    icon: "Smile",
  },
  {
    label: "Zaoszczędzone pieniądze",
    value: "2 340 zł",
    icon: "BarChart2",
  },
];

export const mockCompanies = [
  "Sklep AGD Max", "MeblePolska24", "Zabawki Bajka", "Moda Lux", "AutoCzęści Pro", "Księgarnia Nowa", "Dom i Ogród Plus"
];

export const mockProducts = [
  "Odkurzacz TurboX 3000", "Sofa LUNA 3-osobowa", "Klocki MegaBuild 1200", "Kurtka Softshell Męska", "Filtr oleju XTR-12", "Poradnik: Efektywna Nauka", "Zestaw narzędzi Ogrodnika"
];

export const mockConversations = [
  // Dialog 1: Prosta pomoc w wyborze produktu
  {
    id: "1",
    customer: "Kasia Nowak",
    platform: "Allegro",
    time: "09:12",
    messages: [
      { from: "customer", text: "hej, szukam laptopa do pracy zdalnej, ale nie wiem co wybrać" },
      { from: "bot", text: "Cześć! Pomogę Ci znaleźć idealnego laptopa. Do pracy zdalnej najważniejsze są zwykle: dobra kamerka do spotkań, długi czas pracy na baterii i wygodna klawiatura. Jaki masz budżet?" },
      { from: "customer", text: "max 4000 zł" },
      { from: "bot", text: "W tej cenie mam świetną propozycję - Lenovo ThinkPad E14. Ma 14-calowy matowy ekran (nie męczą się oczy), baterię na 12 godzin i genialną klawiaturę. Plus kamerka z przesłoną prywatności. Często pracujesz w podróży czy głównie z domu?" },
      { from: "customer", text: "głównie z domu, ale czasem z kawiarni" },
      { from: "bot", text: "To ThinkPad będzie strzałem w dziesiątkę. Waży tylko 1,6 kg, więc łatwo go zabrać do kawiarni. Ma też świetne głośniki, więc na spotkaniach wszystko będzie słychać nawet bez słuchawek. Mamy go teraz w promocji za 3799 zł. Pokazać Ci?" },
    ],
    status: "bot",
  },
  // Dialog 2: Skomplikowany problem z zamówieniem
  {
    id: "2",
    customer: "Anna Zielińska",
    platform: "Facebook",
    time: "10:27",
    messages: [
      { from: "customer", text: "Dzień dobry, mam problem. Zamówiłam sukienkę na wesele za tydzień, ale dostałam maila że dostawca nie ma jej na stanie. Co teraz?!" },
      { from: "bot", text: "O nie, rozumiem Twój stres - wesele za tydzień to naprawdę mało czasu! Zaraz to sprawdzę. Widzę Twoje zamówienie - sukienka Milano w rozmiarze M, prawda?" },
      { from: "customer", text: "tak, dokładnie ta" },
      { from: "bot", text: "Dobra wiadomość - mam dla Ciebie dwa rozwiązania. Pierwszy: ten sam model mamy w naszym magazynie w Warszawie w kolorze granatowym (zamiast czarnego). Mogę wysłać kurierem już dziś, będzie u Ciebie jutro. Drugi: mam bardzo podobną sukienkę marki Orsay - ten sam krój, nawet ładniejsze wykończenie. Co wolisz?" },
      { from: "customer", text: "a mogę zobaczyć tę Orsay?" },
      { from: "bot", text: "Jasne! [LINK DO PRODUKTU] Ta sukienka ma dodatkowo regulowane ramiączka i jest uszyta z lepszego materiału - nie gniecie się w tańcu. Klientki oceniły ją na 4.8/5. Jest też 50 zł tańsza. Jeśli ją wybierzesz, dodam Ci gratis ekspresową wysyłkę za przeprosiny za zamieszanie. Pasuje?" },
    ],
    status: "bot",
  },
  // Dialog 3: Techniczne pytania o produkt
  {
    id: "3",
    customer: "Piotr Wójcik",
    platform: "OLX",
    time: "11:03",
    messages: [
      { from: "customer", text: "czy ten odkurzacz Dyson V15 będzie działał na moich panelach i dywanach? mam też kota" },
      { from: "bot", text: "Dyson V15 to świetny wybór dla Ciebie! Ma specjalną szczotkę Fluffy, która idealnie zbiera kurz z paneli bez rysowania, plus szczotkę z włosiem do dywanów. A dla właścicieli kotów to prawdziwy game-changer - laser pokazuje sierść, której gołym okiem nie widać." },
      { from: "customer", text: "a jak z włosami? moja żona ma długie włosy i ciągle się plączą w szczotce" },
      { from: "bot", text: "O, to ważne pytanie! V15 ma antyplątaniową szczotkę Digital Motorbar - włosy same się z niej zsuwają dzięki specjalnym grzebieniom. Koniec z wycinaniem włosów nożyczkami! Plus moc 230AW radzi sobie nawet z wbitą w dywan sierścią. Filtry HEPA zatrzymują 99,97% alergenów - super jak macie kota." },
      { from: "customer", text: "ile on waży? mieszkamy na 3 piętrze" },
      { from: "bot", text: "Waży 3.1 kg, ale waga jest świetnie rozłożona - większość przy uchwycie, więc nie męczy ręki. Do schodów jest tryb Eco, który wystarcza i oszczędza baterię. Klientki często piszą, że spodziewały się że będzie cięższy. Mamy teraz w zestawie dodatkową mini-szczotkę do tapicerki gratis - przyda się do drapaka kota! 😊" },
    ],
    status: "bot",
  },
  // Dialog 4: Emocjonalne wsparcie przy zwrocie
  {
    id: "4",
    customer: "Monika Krawczyk",
    platform: "Messenger",
    time: "12:18",
    messages: [
      { from: "customer", text: "Kupilam córce buty na urodziny ale sie rozpłakała ze nie chce różowych... mogę oddać?" },
      { from: "bot", text: "Ojej, przykro mi że prezent nie trafił w gust! Znam to - dzieci potrafią być nieprzewidywalne. Oczywiście możesz zwrócić buty bez problemu. Masz 30 dni i nie musisz podawać powodu." },
      { from: "customer", text: "ale już je przymierzała w domu" },
      { from: "bot", text: "Spokojnie, przymierzanie w domu to normalna sprawa - właśnie po to jest prawo do zwrotu. Ważne żeby buty nie były noszone na zewnątrz i miały metki. Opakowanie masz jeszcze?" },
      { from: "customer", text: "tak, wszystko jest" },
      { from: "bot", text: "Super! Wypełnij formularz zwrotu (przyślę link), zapakuj buty i oddaj kurierowi. Pieniądze wrócą w 3-5 dni. A może pomogę wybrać inne? Ile lat kończy córka i co lubi?" },
      { from: "customer", text: "8 lat, uwielbia jednorożce i brokat" },
      { from: "bot", text: "Mam coś idealnego! Trampki z holograficznymi jednorożcami - błyszczą jak brokat w różnych kolorach. Dzieciaki je uwielbiają! Mamy też wersję z podświetlaną podeszwą. [LINK] Sprawdź koniecznie opinię mamy Zosi - pisze że jej córka nie chce ich zdejmować 😄" },
    ],
    status: "bot",
  },
  // Dialog 5: Problem z rozmiarem
  {
    id: "5",
    customer: "Marek Dąbrowski",
    platform: "Allegro",
    time: "13:44",
    messages: [
      { from: "customer", text: "Zamówiłem kurtkę XL ale jest za mała. Macie większe rozmiary?" },
      { from: "bot", text: "Przykro mi że rozmiar nie pasuje! Sprawdzam... tej kurtki nie mamy w XXL, ale moment - widzę że to model Northface Thermoball. One są krojem slim fit, dlatego często bierze się większy rozmiar." },
      { from: "customer", text: "no właśnie, a ja mam 192 cm i szerokie ramiona" },
      { from: "bot", text: "Aaa, to wszystko jasne! Dla Twojej budowy polecam lepszy model - Northface Gotham III. Ma klasyczny krój, dłuższy tył (super przy Twoim wzroście) i raglanowe rękawy - nie krępują w ramionach. XL będzie idealny. Jest cieplejsza i tylko 100 zł droższa. Chcesz ją zamówić a Thermoball zwrócisz jak przyjdzie nowa?" },
      { from: "customer", text: "a jest czarna?" },
      { from: "bot", text: "Jest! I ma kaptur obszyty futerkiem - przy 192 cm docenisz że chroni kark. Klienci Twojego wzrostu chwalą że wreszcie rękawy są dość długie. Wysyłam dziś?" },
    ],
    status: "bot",
  },
  // Dialog 6: Awaryjne wsparcie techniczne
  {
    id: "6",
    customer: "Tomasz Nowicki",
    platform: "Messenger",
    time: "14:22",
    messages: [
      { from: "customer", text: "POMOCY! Właśnie rozpakowałem ekspres do kawy i nie działa! Jutro mam urodziny i obiecałem wszystkim kawę z ekspresu!" },
      { from: "bot", text: "Spokojnie, zaraz to ogarnę! Urodziny uratujemy 💪 Najpierw szybka diagnostyka - co dokładnie się dzieje? Włącza się w ogóle?" },
      { from: "customer", text: "włącza się, ale nie pobiera wody, tylko buczy" },
      { from: "bot", text: "OK, znam ten problem! W 90% przypadków to transport - czasem w środku blokuje się zawór. Zróbmy tak: 1) Wyjmij zbiornik wody 2) Zajrzyj gdzie się wkłada - widzisz mały czerwony pływak?" },
      { from: "customer", text: "widzę!" },
      { from: "bot", text: "Dźgnij go delikatnie długopisem - powinien się ruszyć góra-dół. Czasem się blokuje przy transporcie. Potem włóż zbiornik, napełnij wodą i włącz ekspres. Daj znać czy działa!" },
      { from: "customer", text: "O KURCZĘ DZIAŁA! Jesteś geniuszem!" },
      { from: "bot", text: "Haha, cieszę się! 🎉 To częsty problem przy transporcie. Teraz przepuść 2-3 razy samą wodę bez kawy żeby się wypłukał. I pamiętaj - przy pierwszym użyciu kawa może być troszkę gorsza, dopiero od 3-4 będzie pełnia smaku. Udanych urodzin! Ile świeczek? 😄" },
    ],
    status: "bot",
  },
  // Dialog 7: Zaawansowane doradztwo
  {
    id: "7",
    customer: "Ewa Szymańska",
    platform: "OLX",
    time: "15:01",
    messages: [
      { from: "customer", text: "potrzebuję kompletnego zestawu do fotografii produktowej, mam mały biznes z biżuterią" },
      { from: "bot", text: "Super, że rozwijasz biznes! Do biżuterii najważniejsze to światło i makro. Zacznijmy od podstaw - jaki masz budżet na całość?" },
      { from: "customer", text: "około 3000 zł, ale mogę dołożyć jeśli trzeba" },
      { from: "bot", text: "3000 zł wystarczy na profesjonalny setup! Polecam: 1) Aparat Canon M50 Mark II (2200 zł) - świetny autofocus i możliwość nagrywania video na Instagram 2) Namiot bezcieniowy 60cm z LED (250 zł) - biżuteria będzie błyszczeć bez odbić 3) Statyw Manfrotto Compact (200 zł) 4) Karta pamięci i zapasowa bateria (150 zł). Zostanie Ci 200 zł na tła i rekwizyty!" },
      { from: "customer", text: "a nie lepszy telefon? iPhone robi świetne zdjęcia" },
      { from: "bot", text: "Szczerze? Do biżuterii aparat da Ci ogromną przewagę. iPhone nie ma prawdziwego makro - zobaczysz każdy detal, fakturę, nie będzie rozmyty. Plus w M50 ustawisz własne balansy bieli - złoto będzie złote, nie żółte jak często wychodzi w telefonie. Ale rozumiem dylemat! Mogę pokazać porównanie zdjęć biżuterii z iPhone vs M50?" },
      { from: "customer", text: "dobra, przekonałeś mnie. A poradniki jakieś macie?" },
      { from: "bot", text: "Jasne! Przy zakupie dodam Ci nasz darmowy e-book 'Fotografia produktowa dla początkujących' + masz u nas 3 miesiące darmowego dostępu do platformy ze szkoleniami. Jest tam cały kurs o fotografowaniu biżuterii! A jak będziesz miała pytania przy robieniu zdjęć, pisz śmiało - pomogę z ustawieniami 📸" },
    ],
    status: "bot",
  },
  // Dialog 8: Sytuacja kryzysowa z dostawą
  {
    id: "8",
    customer: "Paweł Lewandowski",
    platform: "Allegro",
    time: "15:44",
    messages: [
      { from: "customer", text: "Miała być dostawa między 12-14, jest 16:30 i nic! Specjalnie wziąłem wolne!" },
      { from: "bot", text: "Bardzo mi przykro że tracisz czas! To frustrujące, szczególnie gdy brało się wolne. Już sprawdzam gdzie jest paczka... Widzę że kurier miał awarię auta. Nie dostałeś SMS-a?" },
      { from: "customer", text: "nic nie dostałem!" },
      { from: "bot", text: "To nasz błąd, przepraszam. Dobra, działamy: masz dwie opcje. 1) Kurier dostarczy dziś do 20:00 - potwierdzam że przyjedzie. 2) Możesz odebrać w naszym punkcie do 21:00 - dam Ci voucher 50 zł za fatygę. Co wybierasz?" },
      { from: "customer", text: "nie chce mi się jechać, niech przyjedzie. Ale czy na pewno?" },
      { from: "bot", text: "Właśnie rozmawiałem z dyspozytor - samochód zastępczy już jedzie do kuriera. Gwarantuję dostawę do 20:00. Dodatkowo dostaniesz ode mnie kod -20% na następne zakupy za całe zamieszanie. I jeszcze jedno - zapłacę Ci za ten stracony dzień: na paczce będzie dodatkowy voucher 100 zł. Pasuje?" },
      { from: "customer", text: "o, to miło. Ok, czekam do 20" },
      { from: "bot", text: "Dostaniesz SMS jak kurier wyjedzie. Gdyby cokolwiek się zmieniło, od razu piszę. Jeszcze raz przepraszam - wiem jak cenny jest wolny dzień. Zapisałem Twój numer jako priorytet na przyszłość." },
    ],
    status: "bot",
  },
  // Dialog 9: Personalizowane polecenia
  {
    id: "9",
    customer: "Bartek Mazur",
    platform: "Facebook",
    time: "16:11",
    messages: [
      { from: "customer", text: "nudzi mi się mój styl, chcę coś zmienić ale nie wiem co" },
      { from: "bot", text: "Ooo, czas na metamorfozę! Uwielbiam takie wyzwania 😊 Powiedz mi najpierw - co nosisz najchętniej teraz? Jeansy i t-shirt, czy może coś bardziej eleganckiego?" },
      { from: "customer", text: "głównie jeansy i jakieś koszulki... mam 35 lat i czuję że ubieram się jak student" },
      { from: "bot", text: "Haha, znam to! W Twoim wieku można wyglądać swobodnie ALE z klasą. Zacznijmy od małych zmian: zamień t-shirty na koszulki polo - dalej wygodne, ale od razu bardziej 'dorosłe'. Mamy świetne od Tommy Hilfiger, nie za drogie." },
      { from: "customer", text: "polo kojarzy mi się ze starszymi facetami..." },
      { from: "bot", text: "To oldschoolowe polo! Teraz są bardziej dopasowane, z krótkimi rękawami, super materiały. Spójrz: [LINK] - Ryan Gosling nosi podobne. Albo kompromis - henley (taki t-shirt z guzikami). Do tego ciemne jeansy zamiast jasnych i już wyglądasz jak właściciel start-upu, nie student 😉" },
      { from: "customer", text: "ok, to ma sens. a buty?" },
      { from: "bot", text: "Jedne buty zmienią wszystko - zamień trampki na minimalistyczne sneakersy skórzane. Białe Common Projects albo tańsza alternatywa - nasze Urbans za 299 zł. Pasują do jeansów i do chinosów. Zrób sobie zestaw: 2 koszulki polo, jedne henley, ciemne jeansy, skórzane sneakersy. Wydasz max 1000 zł a będziesz wyglądał jak milion dolarów!" },
    ],
    status: "bot",
  },
  // Dialog 10: Kompleksowa obsługa reklamacji
  {
    id: "10",
    customer: "Karolina Pawlak",
    platform: "Messenger",
    time: "17:33",
    messages: [
      { from: "customer", text: "Pralka którą kupiłem 3 miesiące temu zaczęła przeciekać! Zalała mi pół łazienki! Co mam teraz zrobić?!" },
      { from: "bot", text: "O nie! Zalana łazienka to koszmar. Przede wszystkim - zakręciłeś już wodę i wyłączyłeś pralkę z prądu? Bezpieczeństwo najważniejsze!" },
      { from: "customer", text: "tak tak, wszystko pozakręcane. ale co z tą pralką? to dramat" },
      { from: "bot", text: "Zajmę się tym natychmiast. Masz 2-letnią gwarancję, więc jesteś w pełni zabezpieczony. Organizuję wizytę serwisu - jutro między 8-12 pasuje? Technik sprawdzi na miejscu i albo naprawi od ręki, albo zabierze do serwisu." },
      { from: "customer", text: "jutro pracuję... a kto posprząta tę wodę? dywan cały mokry" },
      { from: "bot", text: "Rozumiem problem. Po pierwsze - serwis może przyjechać też w sobotę lub po 17:00 w tygodniu. Po drugie - masz ubezpieczenie mieszkania? Bo nasza gwarancja obejmuje też szkody spowodowane wadą urządzenia. Pomogę Ci wypełnić wniosek." },
      { from: "customer", text: "mam ubezpieczenie. sobota rano pasuje" },
      { from: "bot", text: "Świetnie! Sobota 8-12 zarezerwowana. Teraz instrukcja: 1) Zrób zdjęcia zalania - wszystkie szkody 2) Wyślę Ci formularz zgłoszenia do ubezpieczenia - wypełnimy razem 3) Serwisant da Ci protokół że to wada fabryczna 4) Na czas naprawy dostaniesz pralkę zastępczą GRATIS. Wszystko jasne?" },
      { from: "customer", text: "super, dzięki. jestem pod wrażeniem pomocy" },
      { from: "bot", text: "To moja robota! 😊 Jeszcze jedno - za cały stres dostaniesz voucher 200 zł ode mnie. I pamiętaj - jakbyś miał problem z ubezpieczeniem, nasz prawnik pomoże bezpłatnie. Trzymam kciuki żeby dywan szybko wysechł! Potrzebujesz może namiar na dobrą firmę od osuszania?" },
    ],
    status: "bot",
  },
];

export const mockKnowledgeDocs = [
  {
    id: "d1",
    name: "FAQ - Zwroty i reklamacje.pdf",
    tags: ["FAQ", "Zwroty"],
    category: "FAQ",
    content: "Najczęstsze pytania dotyczące zwrotów i reklamacji...",
  },
  {
    id: "d2",
    name: "Wymiary produktów.xlsx",
    tags: ["Wymiary", "Produkty"],
    category: "Wymiary produktów",
    content: "Tabela wymiarów wszystkich produktów...",
  },
  {
    id: "d3",
    name: "Polityka zwrotów.txt",
    tags: ["Polityka", "Zwroty"],
    category: "Polityka zwrotów",
    content: "Zasady zwrotów: 30 dni na zwrot bez podania przyczyny...",
  },
]; 
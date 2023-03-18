//Purpose: to generate the elite planet names and other information based on the original algorithm
//TODO: find out why the goat soup planet descriptions is not working correctly
//TODO: find out where the OOlite colors, etc., are generated - if at all - and re-create.
//TODO: once done, the planets data can be removed in favor of generators.
//TODO: then later, if we need fixed names (eg Milky Way) in a Galaxy the "generator" can fetch them

const pairs0  = "ABOUSEITILETSTONLONUTHNO";
const pairs = "..LEXEGEZACEBISOUSESARMAINDIREA.ERATENBERALAVETIEDORQUANTEISRION";                 
const pairs1 = pairs0 + pairs;

const economies = [
    "Rich Ind    ",
    "Average Ind ",
    "Poor Ind    ",
    "Mainly Ind  ",
    "Mainly Agri ",
    "Rich Agri   ",
    "Average Agri",
    "Poor Agri   "
];

const governments = [
    "Anarchy        ",
    "Feudal         ",
    "Multi-gov      ",
    "Dictatorship   ",
    "Communist      ",
    "Confederacy    ",
    "Democracy      ",
    "Corporate State"
];


const defaultGalaxy = {
    seed: {
        w0: 0x5A4A,
        w1: 0x0248,
        w2: 0xB753  
    },
    number: 1,
    systems: []
};

 const defaultSystem = {
    num: -1,                    //#Planetary number
    x: 0,
    y: 0,
    econ: 0,
    govt: 0,
    tech: 0,
    population: 0,
    productivity: 0,
    radius: 0,                   //#not used
    name: '',
    goatSoupSeed: [0,0,0,0],
    info:  null,                   //#A goat soup number
    fuelCost: 0.2              //#0.2 CR/light year. not used
 };

 function makeSystem(galaxy)
 {
    //console.log("seed", galaxy.seed);
    let system = JSON.parse(JSON.stringify(defaultSystem));
    system.x = galaxy.seed.w1 >> 8;
    system.y = galaxy.seed.w0 >> 8;
    system.seed = [(galaxy.seed.w0 & 0xFF),
                    (galaxy.seed.w0 >> 8),
                    (galaxy.seed.w1 & 0xFF),
                    (galaxy.seed.w1 >> 8),
                    (galaxy.seed.w2 & 0xFF),
                    (galaxy.seed.w2 >> 8)];

    let longNameFlag = galaxy.seed.w0 & 64;

    system.govt = (((galaxy.seed.w1) >> 3) & 7) //# bits 3,4 &5 of w1 
    system.econ = (((galaxy.seed.w0) >> 8) & 7) //# bits 8,9 &A of w0 

    if (system.govt <= 1)
    {
        system.econ = system.econ | 2;
    }
    system.tech = ((galaxy.seed.w1 >> 8) & 3) + (system.econ ^ 7);
    system.tech += system.govt >> 1
    if ((system.govt & 1) == 1)
    {
        system.tech += 1;
    }

    system.population = 4 * (system.tech) + (system.econ);
    system.population = system.population + (system.govt) + 1;
    system.productivity = (((system.econ) ^ 7) + 3) * ((system.govt) + 4);
    system.productivity = system.productivity * (system.population) * 8;

    system.radius = (256 * ((((galaxy.seed.w2) >> 8) & 15) + 11)) + system.x;

    system.goatSoupSeed[0] = galaxy.seed.w1 & 0xFF;
    system.goatSoupSeed[1] = galaxy.seed.w1 >> 8;
    system.goatSoupSeed[2] = galaxy.seed.w2 & 0xFF;
    system.goatSoupSeed[3] = galaxy.seed.w2 >> 8;

    system.species = makeSpecies(galaxy.seed);


    let pair1 = 2 * (((galaxy.seed.w2) >> 8) & 31);
    //console.log("pair1", pair1);
    shuffle(galaxy.seed);
    
    let pair2 = 2 * (((galaxy.seed.w2) >> 8) & 31);
    shuffle(galaxy.seed);

    let pair3 = 2 * (((galaxy.seed.w2) >> 8) & 31);
    shuffle(galaxy.seed);

    let pair4 = 2 * (((galaxy.seed.w2) >> 8) & 31);
    shuffle(galaxy.seed);

    let name = "";
    name += pairs[pair1];
    name += pairs[pair1 + 1];
    name += pairs[pair2];
    name += pairs[pair2 + 1];
    name += pairs[pair3];
    name += pairs[pair3 + 1];

    if (longNameFlag > 0) // #* bit 6 of ORIGINAL w0 flags a four-pair name
    {
        name += pairs[pair4];
        name += pairs[pair4 + 1];
    }
    system.name = name.split(".").join("");
    //console.log(system);
    return system;
}

function makeSpecies(seed)
{
    let  tokens = [];
    const speciesMask = 0b10000000;
    //console.log(speciesMask.toString(2).padStart(16, "0"));
    if ((seed.w2 & speciesMask) > 0)
    {
        
        tokens = [];
        let w2_hi = seed.w2 >> 10;
        w2_hi = w2_hi & 7;
        if (w2_hi < 3)
        {
            const adjective1 = "Large, Fierce, Small".split(", ");
            tokens.push(adjective1[w2_hi]);
        }

        w2_hi = seed.w2 >> 13;
        if (w2_hi < 6)
        {
            const adjective2 = "Green, Red, Yellow, Blue, Black, Harmless".split(", ");
            tokens.push(adjective2[w2_hi]);
        }
        
        let w1_hi = seed.w1 >> 8;
        let w0_hi = seed.w0 >> 8;
        let adj3 = (w1_hi ^ w0_hi) & 7;
        //console.log("w1_hi", w1_hi.toString(2).padStart(8, "0"));
        //console.log("w0_hi", w0_hi.toString(2).padStart(8, "0"));
        //console.log("adj3 ", adj3.toString(2).padStart(8, "0"));

        if (adj3 < 6)
        {
            const adjective3 = "Slimy, Bug-Eyed, Horned, Bony, Fat, Furry".split(", ");  
            tokens.push(adjective3[adj3]);
        }

        w2_hi = seed.w2 >> 8;
        let alien = ((w2_hi & 3) + adj3) & 7;
        const aliens = "Rodents, Frogs, Lizards, Lobsters, Birds, Humanoids, Felines, Insects".split(", ");
        tokens.push(aliens[alien]);
    }
    else 
    {
        tokens = ["Human Colonials"]; 
    }

    return tokens.join(" ");
}


const INSPECT_SYSTEMS = "Tiraor, Esbiza, Cebetela, Ceedra".toUpperCase().split(", ");

function shuffle(seed)
{
    let temp = size16Num(seed.w0 + seed.w1 + seed.w2);
    seed.w0 = seed.w1;
    seed.w1 = seed.w2;
    seed.w2 = temp;     
}

function size16Num(value)
{
    //"""Keep a number within 16 bits, Miki Tebeka, comp.lang.python post"""
    mask = (1 << 16) - 1;
    return value & mask;
}

const soup = {
    0x81:["fabled", "notable", "well known", "famous", "noted"],
    0x82:["very", "mildly", "most", "reasonably", ""],
    0x83:["ancient", 0x95, "great", "vast", "pink"],
    0x84:[
            [0x9E, 0x9D, "plantations"], 
            "mountains", 
            0x9C, 
            [0x94, "forests"], 
            "oceans"],
    0x85:["shyness", 
            "silliness", 
            "mating traditions", 
            ["loathing of", 0x86], 
            ["love for", 0x86]],
    0x86:["food blenders", "tourists", "poetry", "discos", 0x8E],
    0x87:["talking tree", "crab", "bat", "lobst", 0xB2],
    0x88:["beset", "plagued", "ravaged", "cursed", "scourged"],
    0x89:[
            [0x96, "civil war"], 
            [0x9B, 0x98, 0x99, "s"], 
            ["a", 0x9B, "disease"], 
            [0x96, "earthquakes"], 
            [0x96, "solar activity"]],
    0x8A:[
        ["its", 0x83, 0x84], 
        ["the", 0xB1, 0x98, 0x99], 
        ["its inhabitants'", 0x9A, 0x85], 
        0xA1, 
        ["its", 0x8D, 0x8E]],
    0x8B:["juice", "brandy", "water", "brew", "gargle blasters"],
    0x8C:[0xB2, 
            [0xB1, 0x99], 
            [0xB1, 0xB2], 
            [0xB1, 0x9B], 
            [0x9B, 0xB2]],
    0x8D:["fabulous", "exotic", "hoopy", "unusual", "exciting"],
    0x8E:["cuisine", "night life", "casinos", "sit coms",  0xA1],
    0x8F:[0xB0,                     //86
            ["The planet", 0xB0],   //87
            ["The world", 0xB0],    //88
            "This planet",          //89
            "This world"],          //90
    0x90:["n unremarkable", "boring", "dull", "tedious", "revolting"],
    0x91:["planet", "world", "place", "little planet", "dump"],
    0x92:["wasp", "moth", "grub", "ant", 0xB2],
    0x93:["poet", "arts graduate", "yak", "snail", "slug"],
    0x94:["tropical", "dense", "rain", "impenetrable", "exuberant"],
    0x95:["funny", "wierd", "unusual", "strange", "peculiar"],
    0x96:["frequent", "occasional", "unpredictable", "dreadful", "deadly"],
    0x97:[[0x82, 0x81, "for", 0x8A],                            //140
            [0x82, 0x81, "for", 0x8A, "and", 0x8A],             //141
            [0x88, "by", 0x89],                                 //142
            [0x82, 0x81, "for", 0x8A, "but", 0x88, "by", 0x89], //143
            ["a", 0x90, 0x91]],                                 //144
    0x98:[0x9B, "mountain", "edible", "tree", "spotted"],
    0x99:[0x9F, 0xA0, [0x87, "~oid"], 0x93, 0x92],
    0x9A:["ancient", "exceptional", "eccentric", "ingrained", 0x95],
    0x9B:["killer", "deadly", "evil", "lethal", "vicious"],
    0x9C:["parking meters", "dust clouds", "ice bergs", "rock formations", "volcanoes"],
    0x9D:["plant", "tulip", "banana", "corn", "\xB2weed"],
    0x9E:[0xB2, [0xB1, 0xB2], [0xB1, 0x9B], "inhabitant", [0xB1, 0xB2]],
    0x9F:["shrew", "beast", "bison", "snake", "wolf"],
    0xA0:["leopard",
             "cat", "monkey", "goat", 
            "fish"],   //234
    0xA1:[[0x8C, 0x8B],     //235
            [0xB1, 0x9F, 0xA2], 
            ["its", 0x8D, 0xA0, 0xA2], 
            [0xA3, 0xA4], 
            [0x8C, 0x8B]],
    0xA2:["meat",           //240
            "cutlet", "steak", "burgers", 
            "soup"],
    0xA3:["ice",            //245
            "mud", 
            "Zero-G", 
            "vacuum",        
            [0xB1, "ultra"]  //249
    ],
    0xA4:[
        "hockey", //250
        "cricket", 
        "karate", 
        "polo",     //
        "tennis"]   //254
};

function soupRandom(system)
{
    //Generate a random number for goat-soup.

    let x = (system.goatSoupSeed[0] * 2) & 0xFF;
    let a = x + system.goatSoupSeed[2];
    if (system.goatSoupSeed[0] > 127)
    {
        a = a + 1;
    }
    
    system.goatSoupSeed[0] = a & 0xFF;
    system.goatSoupSeed[2] = x;

    a = a / 256  //# a = any carry left from above
    x = system.goatSoupSeed[1];
    a = (a + x + system.goatSoupSeed[3]) & 0xFF;
    system.goatSoupSeed[1] = a;
    system.goatSoupSeed[3] = x;
    return a 
}

function soupPosition(randomNumber)
{
    let pos =  0;
    if (randomNumber >= 51) pos += 1;
    if (randomNumber >= 102) pos += 1;
    if (randomNumber >= 153) pos += 1;
    if (randomNumber >= 204) pos += 1;
    return pos
}

//    const soup = makeGoatSoup(system, [0x8F]); //0x8F, 0x97
function makeGoatSoup(system, phraseSequence)
{
    const tokens = [];
    const phraseSequence2 = phraseSequence;
    console.group("sequence", phraseSequence);
    phraseSequence2.forEach(itemInSequence =>
    {
        let chosenPhrase = itemInSequence;

        while (true)
        {
            if (typeof chosenPhrase === "number") 
            {
                //its a reference to another phrase
                chosenPhrase = getPhraseReference(system, chosenPhrase);
            }

            if (Array.isArray(chosenPhrase))
            {
                //its a choise of 5 options - pick a random option
                //if (chosenPhrase.length < 5) debugger;
                chosenPhrase = randomPhrase(system, chosenPhrase);

                if (Array.isArray(chosenPhrase))
                {
                    //if the phrase itself contains multiple items, those are a sequence
                    const subTokens = makeGoatSoup(system, chosenPhrase); 
                    tokens.push(...subTokens);
                    break;
                }

            }

            if (typeof chosenPhrase === "string")
            {
                tokens.push(chosenPhrase);
                break;
            }
        } 
    });

    console.groupEnd();
    return tokens;
}

function getPhraseReference(system, phraseNumber)
{
    let chosenPhrase;
    if (phraseNumber === 0xB0)
    {
        chosenPhrase = system.name;
    }
    else if (phraseNumber === 0xB1)
    {
        let start = system.name.substring(0, 1).toUpperCase();
        let middle = system.name.substring(1, system.name.length - 1).toLowerCase();
        let end = system.name.substring(system.name.length - 1).toLowerCase();
        end = (end === "e" || end === "i") ? "" : end;
        chosenPhrase = start + middle + end + "ian";
    }
    else if (phraseNumber === 0xB2)
    {
        chosenPhrase = randomSoupName(system);
    }
    else //look it up in the soup table
    {
        chosenPhrase = soup[phraseNumber];
    }

    let returnType = Array.isArray(chosenPhrase) ? "array" : typeof chosenPhrase;

    console.log("phrase #", phraseNumber.toString(16), chosenPhrase);
    if (chosenPhrase[0] === "juice") debugger;

    return chosenPhrase;
}

function randomPhrase(system, possiblePhrases)
{
    //need a random item from the list
    let r = soupRandom(system);
    let p = soupPosition(r);
    const chosenPhrase = possiblePhrases[p];
    if (chosenPhrase === undefined)
    {
        throw "could not find chosen phrase " + p;
    }
    return chosenPhrase;
}

function randomSoupName(system)
{
    let randomName = "";
    let length = soupRandom(system) & 3;
    for (let i = 0; i < length + 1; i++)
    {
        let r = soupRandom(system) 
        let x = r & 0x3e;
        console.log(pairs1[x - 1], pairs1[x]);
        debugger;
        randomName += (pairs1[x - 1] !== ".") ? pairs1[x - 1] : "";
        randomName += (pairs1[x] !== ".") ? pairs1[x] : "";
    }
    return randomName;
}

const g = JSON.parse(JSON.stringify(defaultGalaxy))

const systems = [];
for (let i = 0; i < 1; i++)
{
    const system = makeSystem(g);
    system.number = i;
    const soup = makeGoatSoup(system, [0x8F, "is", 0x97]);
    //const soup = makeGoatSoup(system, [0xA1]);
    system.description = soup.join(" ").split(" ~").join("");

    //if (system.species != "Human Colonials")
    {
        systems.push(system);
    }
}

systems.forEach(system =>{
    const line1 = system.name.padEnd(8, " ") 
    + "\tpos: " + system.x.toString().padStart(3, " ") + "," + system.y.toString().padStart(3, " ") 
    + "\tecon: " + economies[system.econ]
    + "\tgov: " + governments[system.govt]
    + "\tpop: " + system.population   // divide by ten to get pop in billions
    + "\tlvl: " + (system.tech + 1)    //add 1 to get displayed tech level
    + "\tprod: " + system.productivity;
    console.log(line1);
    console.log("\t\tspecies", system.species);
    console.log("\t\tinfo   ", system.description);    
});


/*
Notes:
		DONE: economy = 5;                          //elite algorithm
		DONE: government = 3;                       //elite algorithm
		DONE: name = "Lave";                        //elite algorithm
		DONE: population = 25;                      //elite algorithm
		DONE: productivity = 7000;                  //elite algorithm
		DONE: radius = 4116;                        //elite algorithm
		DONE: techlevel = 4;                        //elite algorithm
		DONE: coordinates = "20 173";               //elite algorithm
		DONE: random_seed = "56 173 156 20 29 21";  //elite algorithm
		DONE: inhabitant = "Human Colonial";        //elite algorithm
		description = "Lave is most famous for its vast rain forests and the Laveian tree grub.";  //elite algorithm

		cloud_alpha = 0.75;  //0.75 for Lave, 1.0 for all other planets
        air_color = "0.0 0.0 1.0 1";
		air_color_mix_ratio = 0.5;
		air_density = 0.75;
		ambient_level = 0.1;
		cloud_color = "0.8 0.8 0.8 1";
		cloud_fraction = 0.260000;
		corona_flare = 0.028528;
		corona_hues = 0.621948;
		corona_shimmer = 0.597422;
		land_color = "0.36 0.58882 0.120234 1";
		land_fraction = 0.650000;
		layer = 0;
		percent_cloud = 85;
		planet_distance = 452760.000000;
		polar_cloud_color = "0.946484 0.675422 0.4127 1";
		polar_land_color = "0.934 0.908817 0.849174 1";
		polar_sea_color = "0.9941016 0.9932904 0.9934303 1";
		rotation_speed = 0.004504;
		sea_color = "0.589844 0.393997 0.573013 1";
		sky_n_blurs = 129;
		sky_n_stars = 8887;
		station = "coriolis";
		station_vector = "0.601 -0.738 0.305";
		sun_color = "1 1 1 1";
		sun_distance = 905520;
		sun_radius = 84449.095459;
		sun_vector = "0.865 0.376 -0.334";
		terminator_threshold_vector = "0.105 0.18 0.28"

*/


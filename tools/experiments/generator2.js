//new generator based on planets.c

 const digrams = "abouseitiletstonlonuthnoallexegezacebisousesarmaindirea.eratenberalavetiedorquanteisrion";
 
 const words = [
		//	Inhabitant species size, colour, look, family
		"Large ", "Fierce ", "Small ",
		"Green ", "Red ", "Yellow ", "Blue ", "Black ", "Harmless ",
		"Slimy ", "Bug-Eyed ", "Horned ", "Bony ", "Fat ", "Furry ",
		"Rodents", "Frogs", "Lizards", "Lobsters", "Birds", "Humanoids", "Felines", "Insects",
	
		//	Governments
		"Anarchy", "Feudal", "Multi-Government", "Dictatorship", "Communist", "Confederacy", "Democracy", "Corporate State",
	
		//	Economies
		"Rich", "Average", "Poor", "Mainly",
		"Industrial", "Agricultural",
	
		//	Goat Soup expansion strings
/*81*/	"fabled", "notable", "well known", "famous", "noted",
/*82*/	"very ", "mildly ", "most ", "reasonably ", "",
/*83*/	"ancient", "\x95", "great", "vast", "pink",
/*84*/	"\x9E \x9D plantations", "mountains", "\x9C", "\x94 forests", "oceans",
/*85*/	"shyness", "silliness", "mating traditions", "loathing of \x86", "love for \x86",
/*86*/	"food blenders", "tourists", "poetry", "discos", "\x8E",
/*87*/	"talking tree", "crab", "bat", "lobst", "\xB2",
/*88*/	"beset", "plagued", "ravaged", "cursed", "scourged",
/*89*/	"\x96 civil war", "\x9B \x98 \x99s", "a \x9B disease", "\x96 earthquakes", "\x96 solar activity",
/*8A*/	"its \x83 \x84", "the \xB1 \x98 \x99", "its inhabitants' \x9A \x85", "\xA1", "its \x8D \x8E",
/*8B*/	"juice", "brandy", "water", "brew", "gargle blasters",
/*8C*/	"\xB2", "\xB1 \x99", "\xB1 \xB2", "\xB1 \x9B", "\x9B \xB2",
/*8D*/	"fabulous", "exotic", "hoopy", "unusual", "exciting",
/*8E*/	"cuisine", "night life", "casinos", "sit coms", "\xA1",
/*8F*/	"\xB0", "The planet \xB0", "The world \xB0", "This planet", "This world",
/*90*/	"n unremarkable", " boring", " dull", " tedious", " revolting",
/*91*/	"planet", "world", "place", "little planet", "dump",
/*92*/	"wasp", "moth", "grub", "ant", "\xB2",
/*93*/	"poet", "arts graduate", "yak", "snail", "slug",
/*94*/	"tropical", "dense", "rain", "impenetrable", "exuberant",
/*95*/	"funny", "weird", "unusual", "strange", "peculiar",
/*96*/	"frequent", "occasional", "unpredictable", "dreadful", "deadly",
/*97*/	"\x82\x81 for \x8A", "\x82\x81 for \x8A and \x8A", "\x88 by \x89", "\x82\x81 for \x8A but \x88 by \x89", "a\x90 \x91",
/*98*/	"\x9B", "mountain", "edible", "tree", "spotted",
/*99*/	"\x9F", "\xA0", "\x87oid", "\x93", "\x92",
/*9A*/	"ancient", "exceptional", "eccentric", "ingrained", "\x95",
/*9B*/	"killer", "deadly", "evil", "lethal", "vicious",
/*9C*/	"parking meters", "dust clouds", "ice bergs", "rock formations", "volcanoes",
/*9D*/	"plant", "tulip", "banana", "corn", "\xB2weed",
/*9E*/	"\xB2", "\xB1 \xB2", "\xB1 \x9B", "inhabitant", "\xB1 \xB2",
/*9F*/	"shrew", "beast", "bison", "snake", "wolf",
/*A0*/	"leopard", "cat", "monkey", "goat", "fish",
/*A1*/	"\x8C \x8B", "\xB1 \x9F \xA2", "its \x8D \xA0 \xA2", "\xA3 \xA4", "\x8C \x8B",
/*A2*/	"meat", "cutlet", "steak", "burgers", "soup",
/*A3*/	"ice", "mud", "Zero-G", "vacuum", "\xB1 ultra",
/*A4*/	"hockey", "cricket", "karate", "polo", "tennis"
];

const list_name = {
	size: 0,			    //	Large
	colour: 1,				//	Green
	look: 2,				//	Slimy
	family: 3,				//	Rodents
	government: 4,				//	Anarchy
	eco_adject: 5,				//	Rich
	eco_base : 6,				//	Industrial
	goat_soup: 7				  //	This world is a revolting dump.
};

const word_index = [0, 3, 9, 15, 23, 31, 35, 37, 217];

const economies_index = [0, 1, 2, 3, 3, 0, 1, 2];

function getPlanetInfo(galaxy_number, planet_number)
{
    let planetInfo = {
        galaxyNumber: galaxy_number,
        planetNumber: planet_number,
        seed: [0, 0, 0],
        goatSeed: [0, 0, 0, 0, 0],	// 4 for the seed, 1 for the carry bit
        description: "\x8F is \x97."
    };

	set_planet_seed(planetInfo);
    set_coordinates(planetInfo);
    build_demographics(planetInfo);
    build_species(planetInfo);
	set_goat_seed(planetInfo);
    build_name(planetInfo);

    planetInfo.description = expand_soup(planetInfo, planetInfo.description);

    return planetInfo;
}

function set_coordinates(planetInfo)
{
	planetInfo.x = planetInfo.seed[1] >> 8;
	planetInfo.y = planetInfo.seed[0] >> 8;
}

function build_demographics(planetInfo)
{
	planetInfo.size = planetInfo.x + (planetInfo.seed[2] & 0xF00) + 0xB00;
	planetInfo.gov = (planetInfo.seed[1] & 0x38) >> 3;
	planetInfo.eco = (planetInfo.seed[0] & 0x700) >> 8;
	if (planetInfo.gov < 2)
    {
		planetInfo.eco |= 2;
    }

	planetInfo.tech = ((planetInfo.seed[1] >> 8) & 0x03) + (planetInfo.eco ^ 0x07) + (planetInfo.gov >> 1);
	if (planetInfo.gov & 1)
    {
		planetInfo.tech++;
    }

	planetInfo.popu = 4 * planetInfo.tech + planetInfo.eco + planetInfo.gov + 1;
	planetInfo.prod = ((planetInfo.eco ^ 0x07) + 3) * (planetInfo.gov + 4) * planetInfo.popu * 8;
}

function set_goat_seed(planetInfo)
{
	//	Seed and initial string for goat soup expansion
	planetInfo.goatSeed[0] = planetInfo.seed[1] & 0xFF;
	planetInfo.goatSeed[1] = planetInfo.seed[1] >> 8;
	planetInfo.goatSeed[2] = planetInfo.seed[2] & 0xFF;
	planetInfo.goatSeed[3] = planetInfo.seed[2] >> 8;
    planetInfo.goatSeed[4] = 0;
}

function build_name(planetInfo)
{
	let k = 3 + ((planetInfo.seed[0] & 0x40) >> 6);
    planetInfo.name = "";

	for (j = i = 0; i < k; i++)
	{
        let m = ((planetInfo.seed[2] >> 7) & 0x3E);
		if (m)
		{
			let c = digrams.substring(m + 24, m + 25);

			if (c !== '.')
            {
				planetInfo.name += c;
            }
            c = digrams.substring(m + 25, m + 26);
			if (c !== '.')
            {
                planetInfo.name += c;
            }                    
		}
		next_planet_seed(planetInfo);
	}
}

function build_species(planetInfo)
{
	//	Inhabitants species
	if (planetInfo.seed[2] & 0x80)
	{
		let	v1, v2, v3, v4;

		v1 = (planetInfo.seed[2] >> 10) & 0x07;
		v2 = (planetInfo.seed[2] >> 13) & 0x07;
		v3 = ((planetInfo.seed[0] ^ planetInfo.seed[1]) >> 8) & 0x07;
		v4 = (v3 + ((planetInfo.seed[2] >> 8) & 0x03)) & 0x07;
        console.log(v1);
        planetInfo.species = word_list(list_name.size, v1)
				            + word_list(list_name.colour, v2)
				            + word_list(list_name.look, v3)
				            + word_list(list_name.family, v4);
	}
	else
	{
		planetInfo.species = "Human Colonials";
	}
}

//	Get the w-th word from the l-th list
function word_list(listNumber, wordNumber)
{
	let	i = word_index[listNumber] + wordNumber;
	return (i < word_index[listNumber + 1]) ? words[i] : "";
}

function set_planet_seed(planetInfo)
{
	let	i = 4 * planetInfo.planetNumber;
	seed_galaxy(planetInfo);
	while (i--)
    {
		next_planet_seed(planetInfo);
    }
}

function seed_galaxy(planetInfo)
{
	//unsigned char	*b = (unsigned char*)seed;
    planetInfo.seed = [
        0x5A4A,
        0x0248,
        0xB753
    ];
    //TODO: see planets.c for next galaxy seed logic.
}

function next_planet_seed(planetInfo)
{
    //TODO: this can be done more simply with a shift/push sequence
    let mask_16_bits = (1 << 16) - 1;
    let sum = planetInfo.seed[0] + planetInfo.seed[1] + planetInfo.seed[2];
    sum = sum & mask_16_bits;
    planetInfo.seed[0] = planetInfo.seed[1];
    planetInfo.seed[1] = planetInfo.seed[2];
    planetInfo.seed[2] = sum;     
}

function expand_soup(planetInfo, soup)
{
    let expandedSoup = "";
    for(let i = 0; i < soup.length; i++)
    {
        let c = soup.charCodeAt(i);
        if (c >= 32 && c <= 0x7F)
        {
            expandedSoup += String.fromCharCode(c);     //	Normal character -> add it
        }
        else if (c >= 0x80 && c<= 0xA4)
        {	
            //	Reference to string list -> expand it
			planetInfo.goatSeed[4] = 0; // Clear carry bit
			j = Math.floor(goat_random(planetInfo) / 51);
            j = Math.min(j, 4);
            let unexpanded = word_list(list_name.goat_soup, 5 * (c - 0x81) + j);
			expandedSoup += expand_soup(planetInfo, unexpanded);
        }
        else if (c === 0xB0)
        {
            expandedSoup += planetInfo.name;
        }
        else if (c === 0xB1)
        {
            let start = planetInfo.name.substring(0, 1).toUpperCase();
            let middle = planetInfo.name.substring(1, planetInfo.name.length - 1).toLowerCase();
            let end = planetInfo.name.substring(planetInfo.name.length - 1).toLowerCase();
            end = (end === "e" || end === "i") ? "" : end;
            //case 'a': case 'o': case 'u': // Classic includes these as well
            expandedSoup += start + middle + end + "ian";
        }
        else if (c === 0xB2)
        {
            expandedSoup += random_planet_name(planetInfo);
        }
        else
        {
            console.error("unknown char code", c);
        }
        console.log(c);
    }

    console.log("expanded soup from ", soup);
    console.log("                to ", expandedSoup);
    
    return expandedSoup;
}

function random_planet_name(planetInfo)
{
    let planetName = "";

    planetInfo.goatSeed[4] = 0; // Clear carry bit
    let i = (goat_random(planetInfo) & 0x03) + 1;
    while (i-- > 0)
    {
        //	Don't clear carry here.
        //	First random number for name uses carry bit
        //	as left by the last one (for the length)
        let j = goat_random(planetInfo) & 0x3E;
        planetInfo.goatSeed[4] = 0; // Clear carry bit.
        
        let c = digrams.substring(j, j + 1);

        if (c != '.')
        {
            planetName += c;
        }
        j++;
        c = digrams.substring(j, j + 1);
        if (c != '.')
        {
            planetName += c;
        }
    }
    return planetName;
}

function goat_random(planetInfo)
{
    let g = planetInfo.goatSeed;
	let	a;
	let	x;
	                        /*	6502 assembly:   */ 
    a = g[0];               /*  A5 00   LDA &00  */	
    a = (a << 1) + g[4];	/*  2A      ROL A    */	 
    g[4] = a >> 8;	
    a &= 0xFF;
    x = a;                  /*  AA      TAX      */	 
    a = a + g[2] + g[4];	/*  65 02   ADC &02  */	
    g[4] = a >> 8;	
    a &= 0xFF; 
    g[0] = a;               /*  85 00   STA &00  */ 
    g[2] = x;               /*  86 02   STX &02  */	
    a = g[1];               /*  A5 01   LDA &01  */			 
    x = a;                  /*  AA      TAX      */
    a = a + g[3] + g[4];	/*  65 03   ADC &03  */
    g[4] = a >> 8;	
    a &= 0xFF;	 
    g[1] = a;               /*  85 01   STA &01  */
    g[3] = x;               /*  86 03   STX &03  */	
    return a;               /*  60      RTS      */	 
}

let planetInfo = getPlanetInfo(0, 0);
console.log(planetInfo)
console.log("description", "[", planetInfo.description, "]");

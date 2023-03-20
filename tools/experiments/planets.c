/*

Generates planet names, properties, descriptions
for all planets in the classic Elite universe

I looked at txtelite and at the original 6502 code

*/

#include <stdio.h>
#include <string.h>

//	Holds planet properties
struct planet
{
	unsigned short	seed[3];	//	Pseudo Random Numbers
	char			name[9],	//	Planet name
					spec[35],	//	Inhabitant species
					soup[140];	//	Goat soup
	int				gal,		//	Galactic chart (1...)
					num,		//	Planet number (0...)
					x, y,		//	Position
					gov,		//	Government
					eco,		//	Economy
					tech,		//	Tech Level - 1
					popu,		//	Population * 10 (Billion)
					size,		//	Average Radius (km)
					prod;		//	Productivity (MCr)
};

//	Digrams for planet names
static const char *digrams = "abouseitiletstonlonuthnoallexegezacebisousesarmaindirea.eratenberalavetiedorquanteisrion";

//	Words
static const char *words[] =
{		//	Inhabitant species size, colour, look, family
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
};

//	Word lists
enum
{
	wl_spec_size = 0,			//	Large
	wl_spec_colour,				//	Green
	wl_spec_look,				//	Slimy
	wl_spec_family,				//	Rodents
	wl_government,				//	Anarchy
	wl_eco_adject,				//	Rich
	wl_eco_base,				//	Industrial
	wl_goat_soup				//	This world is a revolting dump.
};

//	Index of list start in words
static const int widx[] = {0, 3, 9, 15, 23, 31, 35, 37, 217};

//	Economy adjectives index
static const int weco[] = {0, 1, 2, 3, 3, 0, 1, 2};


//	Set the starting seed for the classic Elite universe
static void seed_init(unsigned short *seed)
{
	seed[0] = 0x5A4A;
	seed[1] = 0x0248;
	seed[2] = 0xB753;
}

//	Set the starting seed for galactic chart number g
static void seed_galaxy(unsigned short *seed, const int g)
{
	unsigned char	*b = (unsigned char*)seed;
	int				i;

	seed_init(seed);
	for (i = 6;i--;b++)
		*b = ((*b) << g) | ((*b) >> (8 - g));
}

//	Iterate to the next seed
static void seed_next(unsigned short *seed)
{
	unsigned short sum = seed[0] + seed[1] + seed[2];
	memmove(seed, seed + 1, 2 * sizeof *seed);
	seed[2] = sum;
}

//	Set the seed for planet n in galactic chart g
static void seed_planet(unsigned short *seed, const int g, const int n)
{
	int	i = 4 * n;
	seed_galaxy(seed, g);
	while (i--)
		seed_next(seed);
}

//	Get the w-th word from the l-th list
static const char *word_list(int l, int w)
{
	int	i = widx[l] + w;
	return (i < widx[l + 1]) ? words[i] : "";
}

//	Get pseudo random number for goat soup expansion
//	(Uses g[4] as the carry bit for ROL and ADC operations.)
static unsigned char soup_random(unsigned char *g)
{
	unsigned short	a;
	unsigned char	x;
		
	/*	6502 assembly:   */
	/*  A5 00   LDA &00  */	 a = g[0];
	/*  2A      ROL A    */	 a = (a << 1) + g[4];	g[4] = a >> 8;	a &= 0xFF;
	/*  AA      TAX      */	 x = a;
	/*  65 02   ADC &02  */	 a = a + g[2] + g[4];	g[4] = a >> 8;	a &= 0xFF;
	/*  85 00   STA &00  */	 g[0] = a;
	/*  86 02   STX &02  */	 g[2] = x;
	/*  A5 01   LDA &01  */	 a = g[1];
	/*  AA      TAX      */	 x = a;
	/*  65 03   ADC &03  */	 a = a + g[3] + g[4];	g[4] = a >> 8;	a &= 0xFF;
	/*  85 01   STA &01  */	 g[1] = a;
	/*  86 03   STX &03  */	 g[3] = x;
	/*  60      RTS      */	 return a;
}

//	Expand goat soup string
static void soup_expand(struct planet *p, unsigned short *d, const char *src, unsigned char *g)
{
	unsigned char	c, s;
	int				i, j, k;

	for (s = 0;(c = (unsigned char)(src[s]));s++)
	{
		switch (c)
		{
			case 32 ... 0x7F:
				//	Normal character -> add it
				p->soup[(*d)++] = src[s];
				break;

			case 0x80 ... 0xA4:
				//	Reference to string list -> expand it
				g[4] = 0; // Clear carry bit
				j = soup_random(g) / 51;
				if (j > 4)
					j = 4;

				soup_expand(p, d, word_list(wl_goat_soup, 5 * (c - 0x81) + j), g);
				break;

			case 0xB0:
			case 0xB1:
				//	Planet name -> add it
				soup_expand(p, d, p->name, g);
				if (c == 0xB0)
					break;

				while (1)
				{
					switch (p->soup[(*d)-1])
					{
						case 'e': case 'i':
						case 'a': case 'o': case 'u': // Classic
							--*d;
							continue;
					}
					break;
				}
				soup_expand(p, d, "ian", g);
				break;

			case 0xB2:
				//	Random planet name (may not exist?) -> generate it
				k = *d;
				g[4] = 0; // Clear carry bit
				i = (soup_random(g) & 0x03) + 1;
				
				while (i--)
				{
					//	Don't clear carry here.
					//	First random number for name uses carry bit
					//	as left by the last one (for the length)
					j = (soup_random(g) & 0x3E);
					g[4] = 0; // Clear carry bit.
					
					if (digrams[j] != '.')
						p->soup[(*d)++] = digrams[j];
					j++;
					if (digrams[j] != '.')
						p->soup[(*d)++] = digrams[j];
				}
				p->soup[k] &= ~32;
				break;

			default:
				//	This should never happen
				soup_expand(p, d, "(?!)", g);
				break;
		}
	}
	p->soup[*d] = 0;
}

//	Generate data on planet n in galaxy g
static void planet_info(struct planet *p, const int g, const int n)
{
	unsigned short 	s[3], i, j, k, m;
	const char		*c;
	unsigned char	gs[5];	// 4 for thee seed, 1 for the carry bit

	seed_planet(s, g, n);

	//	Input data: seeds, galaxy, number
	memcpy(p->seed, s, sizeof p->seed);
	p->gal = g + 1;
	p->num = n;

	//	Planet data: position, size, economy, government, etc..
	p->x = s[1] >> 8;
	p->y = s[0] >> 8;
	p->size = p->x + (s[2] & 0xF00) + 0xB00;
	p->gov = (s[1] & 0x38) >> 3;
	p->eco = (s[0] & 0x700) >> 8;
	if (p->gov < 2)
		p->eco |= 2;

	p->tech = ((s[1] >> 8) & 0x03) + (p->eco ^ 0x07) + (p->gov >> 1);
	if (p->gov & 1)
		p->tech++;

	p->popu = 4 * p->tech + p->eco + p->gov + 1;
	p->prod = ((p->eco ^ 0x07) + 3) * (p->gov + 4) * p->popu * 8;

	//	Inhabitants species
	if (s[2] & 0x80)
	{
		int	v1, v2, v3, v4;

		v1 = (s[2] >> 10) & 0x07;
		v2 = (s[2] >> 13) & 0x07;
		v3 = ((s[0] ^ s[1]) >> 8) & 0x07;
		v4 = (v3 + ((s[2] >> 8) & 0x03)) & 0x07;
		sprintf(p->spec, "%s%s%s%s",
				word_list(wl_spec_size, v1),
				word_list(wl_spec_colour, v2),
				word_list(wl_spec_look, v3),
				word_list(wl_spec_family, v4));
		if ((s[2] & 0xFF) == 0x7F)
		{
			strcat(p->spec," !!");
		}
	}
	else
	{
		strcpy(p->spec, "Human Colonials");
	}

	//	Planet name
	k = 3 + ((s[0] & 0x40) >> 6);
	for (j = i = 0;i < k;i++)
	{
		if ((m = ((s[2] >> 7) & 0x3E)))
		{
			c = digrams + m + 24;
			if (*c != '.')
				p->name[j++] = *c;
			if (*++c != '.')
				p->name[j++] = *c;
		}
		seed_next(s);
	}
	p->name[0] &= ~32;
	p->name[j] = 0;

	//	Seed and initial string for goat soup expansion
	gs[0] = p->seed[1] & 0xFF;
	gs[1] = p->seed[1] >> 8;
	gs[2] = p->seed[2] & 0xFF;
	gs[3] = p->seed[2] >> 8;

	i = 0;
	soup_expand(p, &i, "\x8F is \x97.", gs);
}

//	Print data on planet
static void planet_print(struct planet *p)
{
	printf(
		"[Gal=%d N=%d Pos=(%d,%d) S=%04X.%04X.%04X]\n"
		"Data on %s\n"
		"Economy: %s %s\n"
		"Government: %s\n"
		"Tech.Level: %d\n"
		"Population: %d.%d Billion\n"
		"(%s)\n"
		"Gross Productivity: %d Mcr\n"
		"Average Radius: %d km\n"
		"%s\n\n",
			p->gal, p->num, p->x, p->y, p->seed[0], p->seed[1], p->seed[2],
			p->name,
			word_list(wl_eco_adject, weco[p->eco]), word_list(wl_eco_base, p->eco > 3),
			word_list(wl_government, p->gov),
			p->tech + 1,
			p->popu / 10, p->popu % 10,
			p->spec,
			p->prod,
			p->size,
			p->soup);
}

//	Generate and print data on all planets in all galaxies
int main(void)
{
	struct planet	p;
	int				g, n;

	for (g = 0;g < 8;g++)
	{
		for (n = 0;n < 256;n++)
		{
			planet_info(&p, g, n);
			planet_print(&p);
		}
	}
	return 0;
}

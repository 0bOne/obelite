

next = 12345 #Original seed.
def lcc_crand():
    """Implementation of a classic C random number generator as would have been
       used in the original game. Tested to match the results of the "lcc" compilers
       rand() function.
    """
    global next
    next= (214013*next+2531011);
    return (next>>16)&0x7FFF;

lastrand = 12345-1


def sas_crand():
    #As supplied by D McDonnell	from SAS Insititute C
    global lastrand
    
    r = (((((((((((lastrand << 3) - lastrand) << 3) \
         + lastrand) << 1) + lastrand) << 4) \
         - lastrand) << 1) - lastrand) + 0xe60)
    
    r = r & 0x7fffffff
        
    lastrand = r - 1	
    return r 

#Make your choice of random number generator
crand = sas_crand #lcc_crand

pairs0  = "ABOUSEITILETSTONLONUTHNO"
pairs = "..LEXEGEZACEBISOUSESARMAINDIREA.ERATENBERALAVETIEDORQUANTEISRION"                    
pairs1 = pairs0 + pairs

def size16Num(value):
    """Keep a number within 16 bits, Miki Tebeka, comp.lang.python post"""
    mask = (1 << 16) - 1
    return value & mask

def char(value):
    """Cast to a C-style 8 bit signed integer,Fredrik Lundh,
       comp.lang.python post
    """
    value = value & 255
    if value > 127:
        return value - 256
    return value         

def rotate1(x):
    """Rotate 8 bit number leftwards"""
    temp = x & 128
    return (2 * (x & 127)) + (temp >> 7)

def twist(x):
    return (256 * rotate1(x >> 8)) + rotate1(x & 255)

class PlanSys:
    """A planetary system"""
    def __init__(self):
        self.num = -1 #Planetary number
        self.x = 0
        self.y = 0
        self.economy = 0
        self.govtype = 0
        self.techlev = 0
        self.population = 0
        self.productivity = 0
        self.radius = 0 #not used by game at all
        self.name = ''
        self.goatsoupseed = [0,0,0,0]
        self.gs = None #A goat soup number
        
        #Original game has fuelcost as a constant.
        #I'm choosing to make it a system property so you
        #could vary it if you wanted to (maybe by tech level?) 
        self.fuelcost = 0.2 #0.2 CR/light year.
        
    def nameStartsWith(self,name):
        """Does this planetary system name start with <name>?"""
        return self.name.lower().startswith(name.strip().lower())

    def economyDescription(self):
        """Return the name of this economy type"""

        return ["Rich Ind","Average Ind","Poor Ind","Mainly Ind",
                      "Mainly Agri","Rich Agri","Average Agri","Poor Agri"][self.economy]

        
    def governmentDescription(self):
        """Return a description of this government type"""
        return ["Anarchy","Feudal","Multi-gov","Dictatorship",
                    "Communist","Confederacy","Democracy","Corporate State"][self.govtype]


    def gen_rnd_number(self):
        """Generate a random number for goat-soup.
           Uses own algorithm so results are consistent and
           platform independant.
        """
        x = (self.gs[0] * 2) & 0xFF
        a = x + self.gs[2]
        if (self.gs[0] > 127):
            a = a + 1
        self.gs[0] = a & 0xFF
        self.gs[2] = x
    
        a = a / 256 # a = any carry left from above
        x = self.gs[1]
        a = (a + x + self.gs[3]) & 0xFF
        self.gs[1] = a
        self.gs[3] = x
        return a 


    def goatsoup(self,source):
        """Return the famous goatsoup string describing the planet"""
        

        desc_list = {   
          "\x81":["fabled", "notable", "well known", "famous", "noted"],
          "\x82":["very", "mildly", "most", "reasonably", ""],
          "\x83":["ancient", "\x95", "great", "vast", "pink"],
          "\x84":["\x9E \x9D plantations", "mountains", "\x9C", "\x94 forests", "oceans"],
          "\x85":["shyness", "silliness", "mating traditions", "loathing of \x86", "love for \x86"],
          "\x86":["food blenders", "tourists", "poetry", "discos", "\x8E"],
          "\x87":["talking tree", "crab", "bat", "lobst", "\xB2"],
          "\x88":["beset", "plagued", "ravaged", "cursed", "scourged"],
          "\x89":["\x96 civil war", "\x9B \x98 \x99s", "a \x9B disease", "\x96 earthquakes", "\x96 solar activity"],
          "\x8A":["its \x83 \x84", "the \xB1 \x98 \x99","its inhabitants' \x9A \x85", "\xA1", "its \x8D \x8E"],
          "\x8B":["juice", "brandy", "water", "brew", "gargle blasters"],
          "\x8C":["\xB2", "\xB1 \x99", "\xB1 \xB2", "\xB1 \x9B", "\x9B \xB2"],
          "\x8D":["fabulous", "exotic", "hoopy", "unusual", "exciting"],
          "\x8E":["cuisine", "night life", "casinos", "sit coms", " \xA1 "],
          "\x8F":["\xB0", "The planet \xB0", "The world \xB0", "This planet", "This world"],
          "\x90":["n unremarkable", " boring", " dull", " tedious", " revolting"],
          
          "\x91":["planet", "world", "place", "little planet", "dump"],
          "\x92":["wasp", "moth", "grub", "ant", "\xB2"],
          "\x93":["poet", "arts graduate", "yak", "snail", "slug"],
          "\x94":["tropical", "dense", "rain", "impenetrable", "exuberant"],
          "\x95":["funny", "wierd", "unusual", "strange", "peculiar"],
          "\x96":["frequent", "occasional", "unpredictable", "dreadful", "deadly"],
          "\x97":["\x82 \x81 for \x8A", "\x82 \x81 for \x8A and \x8A", "\x88 by \x89", "\x82 \x81 for \x8A but \x88 by \x89","a\x90 \x91"],
          "\x98":["\x9B", "mountain", "edible", "tree", "spotted"],
          "\x99":["\x9F", "\xA0", "\x87oid", "\x93", "\x92"],
          "\x9A":["ancient", "exceptional", "eccentric", "ingrained", "\x95"],
          "\x9B":["killer", "deadly", "evil", "lethal", "vicious"],
          "\x9C":["parking meters", "dust clouds", "ice bergs", "rock formations", "volcanoes"],
          "\x9D":["plant", "tulip", "banana", "corn", "\xB2weed"],
          "\x9E":["\xB2", "\xB1 \xB2", "\xB1 \x9B", "inhabitant", "\xB1 \xB2"],
          "\x9F":["shrew", "beast", "bison", "snake", "wolf"],
          "\xA0":["leopard", "cat", "monkey", "goat", "fish"],
          "\xA1":["\x8C \x8B", "\xB1 \x9F \xA2","its \x8D \xA0 \xA2", "\xA3 \xA4", "\x8C \x8B"],
          "\xA2":["meat", "cutlet", "steak", "burgers", "soup"],
          "\xA3":["ice", "mud", "Zero-G", "vacuum", "\xB1 ultra"],
          "\xA4":["hockey", "cricket", "karate", "polo", "tennis"]
        }
                                 
        index = -1
        out = []
        while True:
            index += 1
            try:
                c = source[index]
            except IndexError:
                break

            #Got a byte, what does it look like?
            oc = ord(c)

            if oc < 128:
                #Just a letter, work with it.
                out.append(c)
                continue
            else:
                if oc <= 164:
                    rnd = self.gen_rnd_number()
                    num = oc
                    
                    pos =  0
                    if rnd >= 51:
                        pos += 1
                    if rnd >= 102:
                        pos +=1
                    if rnd >= 153:
                        pos += 1
                    if rnd >= 204:
                        pos += 1
                    
                    res = self.goatsoup(desc_list[chr(num)][pos])
                    out.append(res)
                    continue
            
            if c == "\xB0":
                #Planet name, leading capital, rest lower
                out.append(self.name[0] + self.name.lower()[1:])
                continue
            
            if c == "\xB1":
                #planet-name +"ian"
                out.append(self.name[0])
                out.append(self.name[1:-1].lower())
                if not self.name[-1] in ['I','E']:
                    out.append(self.name[-1].lower())
                out.append('ian')
                continue
            
            if c == "\xB2":
                #Random name. Bug in this area, probably related to way
                #C allows overrun between character arrays. The numbers
                #are right, the character selected sometimes isn't.
                #See ARARUS in Galaxy 1. DISO/BEMAERA correct..
                length = self.gen_rnd_number() & 3
                for i in xrange(0,length+1):
                    x = self.gen_rnd_number() & 0x3e
                    if pairs1[x-1] != '.':
                        out.append(pairs1[x-1])
                    if i and pairs1[x] !='.':
                        out.append(pairs1[x])
                continue
                          
            #There are (were?) some forward references that are not complete.      
            out.append('<bad char in data [%X]>' % oc)
            continue

            
        return ''.join(out)

    def print_system(self, short_version):
        """Print system data"""
        if short_version:
            fmt = "%10s TL: %2i %12s %15s"
            val = fmt % (self.name,self.techlev+1,self.economyDescription(),self.governmentDescription(),)
            print val, 
        else:
            print "\nSystem: %s" % (self.name,)
            print "Position (%d,%d)" % (self.x,self.y,)
            print "Economy: (%d) %s" % (self.economy,self.economyDescription(),)
            print "Government: (%d) %s " % (self.govtype,self.governmentDescription(),)
            print "Tech Level: %d" % (self.techlev+1,)
            print "Turnover: %d" % (self.productivity,)
            print "Radius: %d" % (self.radius,)
            print "Population: %d billion " % (self.population >> 3,)
            self.gs = self.goatsoupseed[:]
            print "%s" % (self.goatsoup("\x8F is \x97."),)

        
class Seed:
    """A pseudo-random number holder based on 16 bit numbers."""
    def __init__(self):
        self.w0 = 0
        self.w1 = 0
        self.w2 = 0
        
    def shuffle(self):
        """Pseudo Randomize a seed"""
        temp = size16Num(self.w0 + self.w1 + self.w2)
        self.w0 = self.w1
        self.w1 = self.w2
        self.w2 = temp        


class Galaxy:
    def __init__(self):
        """A galaxy.
        
           In the original game all system data was generated from the initial
           seed value for galaxy one. If you want a later galaxy you have to
           advance through to get it.
        """

        self.systems = []
        self.seed = Seed()
        self.setGalaxyOne()
        self.makeSystems()
          
    def makeSystems(self):
        """Populate all the systems"""
        self.systems = []

        #Populate the 256 planetary systems in each galaxy 
        for i in xrange(256):
            self.systems.append(self.makesystem(i))


    def goto_galaxy(self, galnum):
        """Goto galaxy X, Galaxy 9 == Galaxy 1"""
        self.setGalaxyOne()

        #Advance to further galaxies if need-be.  
        for i in xrange(2,galnum+1):
            self.nextgalaxy()
        
        self.galaxy_number = galnum % 8
        self.makeSystems() 
          
    def setGalaxyOne(self):
        """Set base seed for galaxy 1"""
        self.seed.w0=0x5A4A
        self.seed.w1=0x0248
        self.seed.w2=0xB753
        self.galaxy_number = 1


    def nextgalaxy(self, make_planets=True):
        """Apply to galaxy1 seed once for galaxy 2, twice for galaxy 3 etc
           Eighth application gives galaxy 1 again"""
        ss = self.seed 
        ss.w0 = twist(ss.w0)
        ss.w1 = twist(ss.w1)
        ss.w2 = twist(ss.w2)
        
    def makesystem(self, system_number):
        """Make a planetary system"""
        s = self.seed
        
        thissys = PlanSys()
        thissys.num = system_number
        thissys.x = s.w1 >> 8
        thissys.y = s.w0 >> 8
        longnameflag = s.w0 & 64
    
        thissys.govtype =(((s.w1)>>3)&7) # bits 3,4 &5 of w1 
        thissys.economy =(((s.w0)>>8)&7) # bits 8,9 &A of w0 
        if thissys.govtype <= 1:
            thissys.economy = thissys.economy | 2
        thissys.techlev =((s.w1>>8)&3)+(thissys.economy^7)
        thissys.techlev += thissys.govtype >> 1
        if (thissys.govtype & 1) == 1:
            thissys.techlev +=1
    
    
    
        thissys.population = 4*(thissys.techlev) + (thissys.economy)
        thissys.population =  thissys.population + (thissys.govtype) + 1
        thissys.productivity = (((thissys.economy)^7)+3)*((thissys.govtype)+4)
        thissys.productivity = thissys.productivity * (thissys.population)*8
    
        thissys.radius = (256*((((s.w2)>>8)&15)+11)) + thissys.x
    
    
        thissys.goatsoupseed[0] = s.w1 & 0xFF
        thissys.goatsoupseed[1] = s.w1 >> 8
        thissys.goatsoupseed[2] = s.w2 & 0xFF
        thissys.goatsoupseed[3] = s.w2 >> 8
                
        pair1=2*(((s.w2)>>8)&31)
        s.shuffle()
        pair2=2*(((s.w2)>>8)&31)
        s.shuffle()
    
        pair3=2*(((s.w2)>>8)&31)
        s.shuffle()
    
    
        pair4=2*(((s.w2)>>8)&31)
        s.shuffle()
    
        # Always four iterations of random number
        name = []
        name.append(pairs[pair1])
        name.append(pairs[pair1+1])
        name.append(pairs[pair2])
        name.append(pairs[pair2+1])
        name.append(pairs[pair3])
        name.append(pairs[pair3+1])
    
        if longnameflag: #* bit 6 of ORIGINAL w0 flags a four-pair name
            name.append(pairs[pair4])
            name.append(pairs[pair4+1])
        thissys.name = "".join(name).replace('.','')    
        return thissys

    def distance(self, a, b):
        """Calculate distance between two planetary systems in 2 dimensional space (4*sqrt(X*X+Y*Y/4))"""
        from math import pow, sqrt
        return int(4.0*sqrt(pow(a.x-b.x,2)+pow(a.y-b.y,2)/4.0))
    
    
    def closest_system_like(self, currentsys, name):
        """Find the closest system who's name starts with <name>"""
        d = 9999
        ret_system = None
        for planet_sys in self.systems:
            if planet_sys.nameStartsWith(name):
                dist = self.distance(currentsys,planet_sys)
                if dist < d:
                    d = dist
                    ret_system = planet_sys
            
        return ret_system
    
    def systemsWithin(self, currentsys, max_ly_distance):
        """Find all the planets within X Light years
           Returns a list of tuples [(distance,system),...]
        """
        found = []
        for planet_sys in self.systems:
            dist = self.distance(currentsys,planet_sys)
            if dist <= max_ly_distance:
                found.append((dist,planet_sys))
        return found
  
    

class Unit:
    def __init__(self,name):
        self.name = name

tonnes = Unit("t")
kilos = Unit("kg")
grams = Unit("g")

class Commodity:
    """Trade commodity"""
    def __init__(self, baseprice, gradient, basequant, mask, unit, name):
        self.baseprice = baseprice
        self.gradient = gradient
        self.basequant = basequant
        self.mask = mask
        self.unit = [tonnes,kilos,grams][unit]
        self.name = name

commodities = [
             Commodity(0x13,-0x02,0x06,0x01,0,"Food        "),
             Commodity(0x14,-0x01,0x0A,0x03,0,"Textiles    "),
             Commodity(0x41,-0x03,0x02,0x07,0,"Radioactives"),
             Commodity(0x28,-0x05,0xE2,0x1F,0,"Slaves      "),
             Commodity(0x53,-0x05,0xFB,0x0F,0,"Liquor/Wines"),
             Commodity(0xC4,+0x08,0x36,0x03,0,"Luxuries    "),
             Commodity(0xEB,+0x1D,0x08,0x78,0,"Narcotics   "),
             Commodity(0x9A,+0x0E,0x38,0x03,0,"Computers   "),
             Commodity(0x75,+0x06,0x28,0x07,0,"Machinery   "),
             Commodity(0x4E,+0x01,0x11,0x1F,0,"Alloys      "),
             Commodity(0x7C,+0x0d,0x1D,0x07,0,"Firearms    "),
             Commodity(0xB0,-0x09,0xDC,0x3F,0,"Furs        "),
             Commodity(0x20,-0x01,0x35,0x03,0,"Minerals    "),
             Commodity(0x61,-0x01,0x42,0x07,1,"Gold        "),
             Commodity(0xAB,-0x02,0x37,0x1F,1,"Platinum    "),
             Commodity(0x2D,-0x01,0xFA,0x0F,2,"Gem-Stones  "),
             Commodity(0x35,+0x0F,0xC0,0x07,0,"Alien Items "),
            ]


class MarketGood:
    """A commodity for sale : price / quantity"""
    def __init__(self):
        self.price = 0
        self.quantity = 0

class Market:
    """Local market model"""
    def __init__(self):
        self.goods = {}
        for commodity in commodities:
            self.goods[commodity.name] = MarketGood() 

class Ship:
    """A ship (by default a Cobra MkIII)"""
    def __init__(self):
        self.holdsize = 20 #Small cargo hold
        self.cargo = {} #Dict of items carried
        for commodity in commodities:
            self.cargo[commodity.name] = 0 
        self.cash = 100.0
        self.maxfuel = self.fuel = 70 #70 tonnes/7 light years
        self.galaxynum = 1
        self.planetnum = 7 #Lave
        
    def cargosize(self):
        """Return current size of cargo in tonnes"""
        return sum([self.cargo[commodity.name] for commodity in commodities if commodity.unit == tonnes])
    
    def holdRemaining(self):
        """Return how much space remains in the hold"""
        return self.holdsize - self.cargosize()

class TradingGame:
    """Encodes rules of the game"""
    def __init__(self):
        self.ship = Ship()
        self.galaxy = Galaxy()
        self.localmarket = Market()
        self.genmarket(0) #Since we want seed=0 for Lave
    
    def currentSystem(self):
        """Get the players current system"""
        return self.galaxy.systems[self.ship.planetnum]
    
    def moveto(self, planet_sys):
        """Move player to this system"""
        self.ship.planetnum = planet_sys.num
    

    def genmarket(self, fluct):
        """Generate market for current system"""
        #/* Prices and availabilities are influenced by the planet's economy type
        #   (0-7) and a random "fluctuation" byte that was kept within the saved
        #   commander position to keep the market prices constant over gamesaves.
        #   Availabilities must be saved with the game since the player alters them
        #   by buying (and selling(?))
        #
        #   Almost all operations are one byte only and overflow "errors" are
        #   extremely frequent and exploited.
        #
        #   Trade Item prices are held internally in a single byte=true value/4.
        #   The decimal point in prices is introduced only when printing them.
        #   Internally, all prices are integers.
        #   The player's cash is held in four bytes.
        # */

        cs = self.currentSystem()
        
        for commodity in commodities:
            good = self.localmarket.goods[commodity.name]
            product = cs.economy * commodity.gradient
            changing = fluct & commodity.mask
            q = commodity.basequant + changing - product
            q = q & 0xFF
            
            #Clip to positive 8-bit
            if q & 0x80:
                q = 0
            good.quantity = q & 0x3F    
           
                         
            #Now work out price   
            q =  commodity.baseprice + changing + product
            q = q & 0xFF
            good.price = (q*4) / 10.0
        
        self.localmarket.goods['Alien Items '].quantity = 0
        
    def jump(self, planetname):
        """Jump to named planet in range, uses fuel"""
        dest = self.galaxy.closest_system_like(self.currentSystem(),planetname)

        if dest == None:
            print "Planet not found"
            return

        if dest.name == self.currentSystem().name:
            print "Bad jump!"
            return
                        
        distance = self.galaxy.distance(self.currentSystem(),dest)
        if distance > self.ship.fuel:
            print "Jump too far"
            return
    
        self.ship.fuel = self.ship.fuel-distance 
        self.moveto(dest)
        
        #Recalculate market prices
        r = crand()
        fluct = char(r & 0xFF)      
        self.genmarket(fluct)
                
    def sneak(self, planetname):
        """Travel to any planet in this galaxy, no fuel cost"""
        fuelsafe = self.ship.fuel
        self.ship.fuel = 666
        self.jump(planetname)
        self.ship.fuel = fuelsafe 

    def setHold(self, newsize):
        """Set new size of hold (tonnes)"""
        hs = self.ship.holdsize
        sm = self.ship.cargosize()
        if sm > newsize:
            print "Hold too full to shrink!"
            return
        
        self.ship.holdsize = newsize

    def nextGalaxy(self):
        """Galactic hyperspace to next galaxy"""
        self.galaxy.goto_galaxy(self.galaxy.galaxy_number+1) #We stay on the same planet number, just jump
        #In the sources jumping to a new galaxy leaves you with the same market
        #self.genmarket(0)

    def displayMarket(self):
        """Print out commodities, prices and quantities here"""
        for commodity in commodities:
            lcl = self.localmarket.goods[commodity.name]
            current = self.ship.cargo[commodity.name]
            
            print commodity.name,
            print "   %4.1f   %2d%s Hold: %4d " % (lcl.price,lcl.quantity,commodity.unit.name.ljust(2),current)

    def sell(self, commod, amt):
        """Sell trade goood from hold"""
        #Do we have any to sell?
        cargo = self.ship.cargo[commod.name]
        if cargo <= 0:
            print "No %s to sell." % (commod.name.strip(),)
            return
        
        if amt > cargo:
            print "Only have %d%s to sell. Selling %d%s" % (cargo,commod.unit.name,cargo,commod.unit.name,)
            amt = cargo
        
        local_market = self.localmarket.goods[commod.name]
        price = amt * local_market.price       
        print "Selling %d%s of %s for %0.2f" % (amt,commod.unit.name,commod.name.strip(),price,) 
        self.ship.cash = self.ship.cash + price
        self.ship.cargo[commod.name] -= amt
        local_market.quantity += amt 

    def buy(self, commod, amt):
        """Buy amt of commodity"""
        
        local_market = self.localmarket.goods[commod.name]
        lcl_amount = local_market.quantity
        if lcl_amount == 0:
            print "Could not buy any %s" % commod.name
            return
        
        if amt > lcl_amount:
            print "Could not buy %d%s attempting to buy maximum %d%s instead." % (amt,commod.unit.name,lcl_amount,commod.unit.name,) 
            amt = lcl_amount
  
        #How many can I afford?
        if local_market.price <= 0:
            can_have = amt
        else:
            can_have = int(self.ship.cash / local_market.price)
        if can_have <= 0:
            print "Cannot afford any %s" % commod.name
            return

        if amt > can_have:
            amt = can_have
            
        #How much will fit in the hold?
        if commod.unit == tonnes:
            if self.ship.holdRemaining() < amt:
                can_have = self.ship.holdRemaining() 
                if can_have <= 0:
                    print "No room in hold for any %s" % commod.name
                    return
                else:
                    
                    print "Could not fit %d%s into the hold. Reducing to %d%s" % (amt,commodity.unit.name,can_have,commodity.unit.name,)
                    amt = can_have
                 
            
        price = amt * local_market.price       
        print "Buying %d%s of %s for %0.2f" % (amt,commod.unit.name,commod.name.strip(),price,) 
        self.ship.cash = self.ship.cash - price
        self.ship.cargo[commod.name] += amt
        local_market.quantity -= amt
        
    def buyFuel(self, f):
        """Buy f tonnes of fuel return fuel bought and cost"""
        if f + self.ship.fuel > self.ship.maxfuel:
            f = self.ship.maxfuel - self.ship.fuel
            
        if f <= 0:
            print "Your fuel tank is full (%0.2f tonnes / %0.1f LY Range)" % (self.ship.fuel,self.ship.fuel/10.0,)
            return 0, 0
        
        #Find out what system we're at because fuelcost is there.
        this_sys = self.currentSystem()

        cost = this_sys.fuelcost * f
        
        if self.ship.cash > 0:
            if cost > self.ship.cash:
                f = self.ship.cash / this_sys.fuelcost
                cost = this_sys.fuelcost * f
        else:
            print "You can't afford any fuel"
            return 0, 0
        
        self.ship.fuel = self.ship.fuel + f
        self.ship.cash = self.ship.cash - cost
        return f, cost
        
        
import cmd 

class TradingGameCmd(cmd.Cmd):
    """Command interface to a TradingGame"""
    prompt = "> "
 
    def __init__(self):
        self.game = TradingGame()
        cmd.Cmd.__init__(self)
        self.setPrompt()
  
    def setPrompt(self):
        self.prompt = 'Cash : %0.2f>' % self.game.ship.cash
  
    def emptyline(self):
        """Do nothing on an empty line"""
        pass
        
    def do_jump(self, planetname):
        """jump <planetname> - Jump to named planet in range, uses fuel"""
        ret = self.game.jump(planetname.strip())
        self.do_info('')
        return ret
                
    def do_j(self, planetname):
      """Shortcut for jump"""
      return self.do_jump(planetname)
                
    def do_sneak(self, planetname):
        """sneak <planetname> - Travel to any planet in this galaxy, no fuel cost"""
        return self.game.sneak(planetname.strip())

    def do_local(self, line):
        """List systems within max range of your ship"""
        print "Galaxy number %d" % self.game.galaxy.galaxy_number
        system_list = self.game.galaxy.systemsWithin(self.game.currentSystem(),self.game.ship.maxfuel)
        system_list.sort() #Smallest first
        for distance,planet_sys in system_list:
            if distance <= self.game.ship.fuel:
                print " * ", #We can get here
            else:
                print " - ", #Refuel to get here
            planet_sys.print_system(True)
            print "(%.1f LY)" % (distance/10.0,)
        
                
    def do_hold(self, newsize):
        """hold <number> - Set a new (integer) hold size"""
        try:
            ns = int(newsize)
        except ValueError:
            print "New hold size must be an integer"
            return
        
        if ns <= 0:
            print "Why would you want to do that?"
            return
      
        ret = self.game.setHold(ns)
        print "Cargo hold is currently %d tonnes." % self.game.ship.holdsize
        return ret

    def do_galhyp(self, line):
        """galhyp - Use galactic hyperdrive to jump to the next galaxy"""
        ret = self.game.nextGalaxy()
        print "You appear in galaxy %d" % self.game.galaxy.galaxy_number
        return ret


    def do_mkt(self, line):
        """Show market prices at current planet"""
        self.game.displayMarket()
        print "Fuel : %.1f      Holdspace : %d" % (self.game.ship.fuel/10.0,self.game.ship.holdRemaining())


    def do_sell(self, line):
        """sell <name_or_abbrev> <amount> - Sell goods from the hold"""
        parts = line.strip().lower().split(' ')
        try:
            good = parts[0]
        except IndexError:
            print "Unknown trade good"
            return
        
        try:
            amt = int(parts[1])
            if amt <= 0:
                #Trying to sell a negative amt..
                print "Nice try pilot."
                return
        except IndexError:
            amt = 1
        except ValueError:
            print "Unknown quantity"
            return
        
        commod = None
        for commodity in commodities:
            if commodity.name.lower().startswith(good):
                commod = commodity
                break
        
        if not commod:
            print "Unknown trade good"
            return        
        
        res = self.game.sell(commod,amt)
        self.setPrompt()
        return res
 
    def do_s(self, line):
      "Shortcut for Sell"
      return self.do_sell(line)

    def do_buy(self, line):
        """buy <name_or_abbrev> <amount> - Buy goods up to limit of cash/market/holdsize."""
        parts = line.strip().lower().split(' ')
        try:
            good = parts[0]
        except IndexError:
            print "Unknown trade good"
            return
        
        try:
            amt = int(parts[1])
            if amt <= 0:
                print "Nice try pilot."
                return
        except IndexError:
            amt = 1
        except ValueError:
            print "Unknown quantity"
            return
        
        commod = None
        for commodity in commodities:
            if commodity.name.lower().startswith(good):
                commod = commodity
                break
        
        if not commod:
            print "Unknown trade good"
            return
        
        ret = self.game.buy(commod,amt)
        self.setPrompt()
        return ret

    def do_b(self, line):
      "Shortcut for buy"
      return self.do_buy(line)

        
    def do_cash(self, amount):
        """cash <number> - Cheat, add X cash (cheating)"""
        try:
            cash = float(amount)
        except ValueError:
            print "New cash to add must be a number"
            return
        
        self.game.ship.cash = self.game.ship.cash + cash
        self.setPrompt()
          
    def do_fuel(self, line):
        """fuel <number> - Buy X LY of Fuel"""
        try:
            ly = float(line)
        except ValueError:
            print "Fuel LY to buy must be a number"
            return 0, 0 
      
        if ly < 0:
            print "Nice try pilot."
            return 0, 0
      
        fuel, cost = self.game.buyFuel(ly*10)
        self.setPrompt()
        print "Refuelling %0.1f LY (%0.2f tonnes) cost %0.2f credits" % (fuel/10.0,fuel,cost,)
        return
     
    def do_f(self, line):
        """Shortcut for fuel"""
        return self.do_fuel(line)
                   
    def do_info(self, systemname):
        """Get information on the named system"""
        
        psystem = self.game.galaxy.closest_system_like(self.game.currentSystem(),systemname)
        if psystem == None:
            print "System '%s' could not be found." % (systemname,)
        else:
            psystem.print_system(False)
                        
    def do_quit(self, line):
        """Quit the game"""
        print "Goodbye!"
        return True

    def do_q(self, line):
        """Shortcut for quit"""
        return self.do_quit(line)

    def do_exit(self, line): #I keep typing exit!
        """Quit the game"""
        return self.do_quit(line)

    def do_EOF(self, line):
        return True
    
    def do_run(self, fname):
        """run <path to file> - Run a set of commands recorded one per line in a text file"""
        import os
        if os.path.isfile(fname):
            lines = open(fname,'r').read().split('\n')
            for line in lines:
                print line
                self.onecmd(line)
                print "Cash > ",self.game.ship.cash                
        else:
            print "Could not open file"

    def do_intro(self,line):
        """Show introduction"""
        print '\n'.join(["",
                         "Welcome to pyElite %s" % VERSION,
                         "",
                         "Commands are:",
                         "buy   tradegood amount",
                         "sell  tradegood amount",
                         "fuel  amount     (buy amount LY of fuel)",
                         "jump  planetname (limited by fuel)",
                         "sneak planetname (any distance - no fuel cost)",
                         "galhyp           (jumps to next galaxy)",
                         "info  planetname (prints info on system)",
                         "mkt              (shows market prices)",
                         "local            (lists systems within max range of your ship)",
                         "cash number      (alters cash - cheating!)",
                         "hold number      (change cargo bay)",
                         "quit, exit or ^Z (exit)",
                         "help command     (help for a particular command)",
                         "intro            (display this text)",
                         "run filepath     (run a file of commands - one per line)",
                         "Some commands have abbreviations f = fuel, j = jump,",
                         "b = buy, s = sell etc",
                        ])


if __name__ == "__main__":
    tg = TradingGameCmd()
    tg.do_intro('')
    tg.cmdloop()

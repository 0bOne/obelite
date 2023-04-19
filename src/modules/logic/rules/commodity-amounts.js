export default class CommodityAmounts {

    static nextSeed = 12345;
    static nextRandom()
    {
        this.nextSeed = (214013 * this.nextSeed + 2531011);
        return (this.nextSeed >> 16) & 0x7FFF;
    }

    static Calculate(commodities, planetInfo)
    {
        const r = this.nextRandom();
        const fluct = r & 0xFF; 

        commodities.forEach(commodity => {
            const product = planetInfo.demographics.economy * commodity.gradient;
            const changing = fluct & commodity.mask;

            let quantity = commodity.basequant + changing - product;
            quantity = quantity & 0xFF;
            if (quantity & 0x80 > 0) quantity = 0;   //#Clip to positive 8-bit

            commodity.available = quantity & 0x3F; 
                      
            //price   
            let p =  commodity.baseprice + changing + product;
            p = p & 0xFF;
            commodity.cost = (p * 4) / 10.0;
            commodity.cost = Math.floor(commodity.cost * 10) / 10;

            if (commodity.name === "alien items")
            {
                commodity.available = 0;
            }       
        });
    }
}






function exportImportBias(commodity, planet)
{
    // positive = exporter; negative = importer; range -1.0 .. +1.0 (import +ve)
    // planet economy: 0...7
    // good: peakExport, peakImport

    const range = Math.abs(commodity.peakImport - commodity.peakExport);
    //TODO: make sure this is the right away around. could be peakExport not peakImport?
    let offset = commodity.peakImport - planet.economy;  
    commodity.importExportBias = offset / range;

        //objective c equivalent:
        //- (int) max:(int) num1 secondNumber:(int) num2 
        //  float economicBiasForGood:
        //     (NSDictionary *)good 
        //     inEconomy:(OOEconomyID) economy
        // {
        // 	OOEconomyID exporter = [good oo_intForKey:kOOCommodityPeakExport];
        // 	OOEconomyID importer = [good oo_intForKey:kOOCommodityPeakImport];
            
        // 	// *2 and /2 to work in ints at this stage
        // 	int exDiff = abs(economy - exporter)*2;
        // 	int imDiff = abs(economy - importer)*2;
        // 	int distance = (exDiff+imDiff)/2;

        // 	if (exDiff == imDiff)
        // 	{
        // 		// neutral economy
        // 		return 0.0;
        // 	}
        // 	else if (exDiff > imDiff)
        // 	{
        // 		// closer to the importer, so return -ve
        // 		return -(1.0-((float)imDiff/(float)distance));
        // 	}
        // 	else
        // 	{
        // 		// closer to the exporter, so return +ve
        // 		return 1.0-((float)exDiff/(float)distance);
        // 	}
        // }
}

function generateQuantity(commodity, planet)
{
    const baseQuantity = commodity.quantity.average * commodity.importExportBias;
    const economyQuantity = baseQuantity * commodity.quantity.economy * commodity.importExportBias;
    const fluctuation = baseQuantity * (planet.rng() - planet.rng())
    baseQuantity += economyQuantity + fluctuation;
    commodity.quanty.available = Math.max(0, baseQuantity);

    // - (OOCargoQuantity) generateQuantityForGood:(NSDictionary *)good inEconomy:(OOEconomyID)economy
    // {
    // 	float bias = [self economicBiasForGood:good inEconomy:economy];

    // 	float base = [good oo_floatForKey:kOOCommodityQuantityAverage];
    // 	float econ = base * [good oo_floatForKey:kOOCommodityQuantityEconomic] * bias;
    // 	float random = base * [good oo_floatForKey:kOOCommodityQuantityRandom] * (randf() - randf());
    // 	base += econ + random;
    // 	if (base < 0.0)
    // 	{
    // 		return 0;
    // 	}
    // 	else
    // 	{
    // 		return (OOCargoQuantity)base;
    // 	}
    // }
}

generatePrice(commodity, planet )
{
    const bias = planet.demographics.econ;
    const basePrice = commodity.price.average;
    const price = basePrice * -bias * commodity.price.economic;
    const fluctuation = basePrice * commodity.price.fluctuation * (planet.rng() - planet.rng());
    commodity.price.current = Math.max(0, price + fluctuation);

    // - (OOCreditsQuantity) generatePriceForGood:(NSDictionary *)good inEconomy:(OOEconomyID)economy
    // {
    //     float bias = [self economicBiasForGood:good inEconomy:economy];

    //     float base = [good oo_floatForKey:kOOCommodityPriceAverage];
    //     float econ = base * [good oo_floatForKey:kOOCommodityPriceEconomic] * -bias;
    //     float random = base * [good oo_floatForKey:kOOCommodityPriceRandom] * (randf() - randf());
    //     base += econ + random;
    //     if (base < 0.0)
    //     {
    //         return 0;
    //     }
    //     else
    //     {
    //         return (OOCreditsQuantity)base;
    //     }
    // }
}
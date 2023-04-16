export default class CommodityAmounts {
    static Calculate(commodities, planetInfo, playerCommodities)
    {
        const rng = new Math.seedrandom(planetInfo.seed);

        commodities.forEach(commodity => {
            const exportBias = this.setBias(commodity["export-bias"], planetInfo.demographics.economy);
            commodity.quantity = this.calculate(commodity.quantity, exportBias, rng);
            commodity.price = this.calculate(commodity.price, -exportBias, rng);
            commodity.quantity = Math.floor(commodity.quantity);
            commodity.price = Math.floor(commodity.price * 10) / 10;
            commodity.held = playerCommodities[commodity.name] || 0;
        });
    }

    static setBias(biasRange, planetEconomy)
    {
        const peakExport = biasRange[0];
        const peakImport = biasRange[1];
        const range = Math.abs(peakImport - peakExport);
        let offset = peakImport - planetEconomy;  
        return offset / range;
    }

    static calculate(rules, bias, rng)
    {
        const meanValue = rules[0];
        const ecomomyDelta = rules[1];
        const fluxDelta = rules[2];

        const baseValue = meanValue * bias;
        const economyValue = baseValue * ecomomyDelta * bias;
        const fluctuation = fluxDelta * (rng() - rng());
        let result = Math.max(0, baseValue + economyValue + fluctuation);
        return result;
    }
}
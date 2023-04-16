import jsYaml from "../dom/utilities/js-yaml.js";

export default class CommodityLoader 
{
    static async LoadCommodities(url)
    {
        const rawData = await jsYaml.fetch(url);
        return this.expandInheritance(rawData);
    }

    static expandInheritance(rawData)
    {
        const data = [];
        const baseElement = rawData.shift();
        rawData.forEach(element => {
            const expanded = Object.assign({}, baseElement, element);
            data.push(expanded);
        });
        return data;
    }
}
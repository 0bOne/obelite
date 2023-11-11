import LessEl from "./lessel/less-el.js";

export default class IndexPage {
    constructor() {}

    async Begin() {
        //alert ("this is the index page at" + new Date());
        const L = LessEl;
        await LessEl.Create(document.body, iconElement);
    }
}

const iconElement = {
    styles: {
        width: "64px",
        height: "64px",
        color: "white",
        backgroundColor: "black",
    },
    svg: {
        src: "./icons/gear-wheat-3.svg"
    }
}

const ip = new IndexPage();
ip.Begin();

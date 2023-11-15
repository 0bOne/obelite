import LessEl from "../lessel/less-el.js";
import StyleSheet from "../lessel/stylesheet.js";
import mainStylesheet from "../obelite/main-stylesheet.js";
import Language from "../obelite/language-en.js";
import LayoutStyles from "../obelite/layout-styles.js";

export default class IndexPage {
    constructor() {
        this.styleSheet = new StyleSheet(document.head);
        this.styleSheet.AddSheet(mainStylesheet);
    }

    async Begin() {
        //alert ("this is the index page at" + new Date());
        await LessEl.Create(document.body, main);
    }
}

const main = {
    tag: "main",
    styles: {
        extends: LayoutStyles.FlexToptoBottomCenteredH,
        backgroundColor: 'transparent',
        minWidth: '800px',
        maxWidth: '800px',
        height: '100%'
    },
    // svg: {
    //     src: "./icons/gear-wheat-3.svg"
    // },
    kids: [{
        tag: "h1",
        name: "title",
        text: Language.Game.Obelite
    }, {
        tag: "hr",
        styles: {
            margin: 0,
            borderWidth: "2px",
            borderStyle: "solid",
            borderColor: "-underlineColor",
            width: "100%"
        }
    }, {
        tag: "p",
        text: Language.Game.ByOb1Inspired,
        styles: {
            marginTop: "10px",
            color: "-mutedTextColor"
        }
    }, {
        styles: {
            flexGrow: 1
        }
    }, {
        name: "menu",
        kids: [{
            tag: "button"
        }]
    }]
}

//view ship library
//view galactic chart
//load commander
///game options

const ip = new IndexPage();
ip.Begin();

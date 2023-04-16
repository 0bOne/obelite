import ExtensibleElement from "./xt-element.js";
import ExtensibleControlElement from "./xt-control.js";
import ExtensibleFlexElement from "./xt-flex.js";
import ExtensibleGridElement from "./xt-grid.js";

customElements.define('xt-div', ExtensibleElement);
customElements.define('xt-control', ExtensibleControlElement);
customElements.define('xt-flex', ExtensibleFlexElement);
customElements.define('xt-grid', ExtensibleGridElement);

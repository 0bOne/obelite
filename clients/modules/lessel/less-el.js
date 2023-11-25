import El from "./el.js";

export default class LessEl {
    
    static async Create(parent, definition) {
        const tagName = definition.tag || "div";
        let newElement = document.createElement(tagName);
        newElement = parent.appendChild(newElement);
        return await this.Wrap(newElement, definition);
    }
    
    static async Wrap(wrapped, definition) {
        let wrapper;
        if (wrapped.$$) {
            wrapper = wrapped.$$;
            console.warn("element already wrapped. ignoring definition");
        } else {
            const wrapperClass = definition.wrapper;
            delete definition.wrapper;

            const wrapperClass2 = wrapperClass || El;
            wrapper = new wrapperClass2(wrapped);

            await wrapper.Set(definition);
            definition.wrapper = wrapperClass;
        }   
        return wrapper;
    }
}

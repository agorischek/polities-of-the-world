function sculpt(object){
    var element = object.element;
    var content = object.content;
    var attributes = "";
    for (var property in object){
        if (object.hasOwnProperty(property)) {
            if(property != "element" && property != "content"){
                attributes = attributes.concat(" " + property + "=\"" + object[property] + "\"");
            }
        }
    }
    var html = "<" + element + " " + attributes + ">" + content + "</" + element + ">";
    return html;
}
function log(message){
    console.log(message);
}

function pick(array){
    return array[Math.floor(Math.random()*array.length)];
}

function unique(array) {
    var sorted = array;
    sorted.sort();
    return sorted.filter(function(value, index, arr){
        if(index < 1) 
            return true;
        else
            return value != arr[index-1];
    });
}

function containsOrEquals(set,item){
    if(_.contains(set,item) || set==item){
        return true
    }
    else{
        return false
    }
}

function each(thing,process){
    $.each(thing,process);
}
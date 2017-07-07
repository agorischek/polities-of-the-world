//Begin
$(function(){
    getSettings();
});

//Variables
var csv;
var mapDisplay;

//Sequencing

var gettingSettings = $.Deferred();

var gettingData = $.Deferred();

var gettingSchema = $.Deferred();

$.when(gettingSettings).done(function(){
    getData();
    getSchema();
})

$.when(gettingData, gettingSchema).done(function(value) {
    processData();
    showMap();
});

var showingMap = $.Deferred().done(function(){
    enableZoom();
});

//Functions

function getSettings(){
    $.ajax({
        url: "settings.json",
        dataType:"json",
        type:"GET"
    })
    
    .done(function(settings){
        app.settings = settings;
        gettingSettings.resolve();
    })
    
}

function getData(){

    $.ajax({
        url: "data/polities.csv"
    })

    .done(function(rawInput){

        app.stats = Papa.parse(rawInput,{
            delimiter: "",
            newline:"",
            dynamicTyping: true,
            preview:1
        }).data[0];

        parsed = Papa.parse(rawInput,{
            delimiter: "",
            newline:"",
            header: true,
            dynamicTyping: true,
            preview:0
        });
        
        var unsortedPolities = [];

        each(parsed.data, function(index, polityInfo) {
            app.content[polityInfo[app.settings.iDColumnHeader]] = polityInfo;
            unsortedPolities.push([polityInfo["name"],polityInfo[app.settings.iDColumnHeader]]);
        });
                
        unsortedPolities.sort(function(a, b){
            return (a[0] === b[0] ? 0 : (a[0] < b[0] ? -1 : 1));
        });
                        
        each(unsortedPolities, function(index,polityPair){
            app.polities.push(polityPair[1]);
        })
                
        gettingData.resolve();

    });  
};

function processData(){
    each(app.stats,function(index,stat){
        if(app.schema[stat]){
            
            each(app.content,function(polityCode,polityInfo){
                
                if(app.schema[stat].type == "multipleSelect" || app.schema[stat].type == "polities"){
                    if(polityInfo[stat]){
                        polityInfo[stat] = polityInfo[stat].split(",");
                    }  
                }
                
                else if(app.schema[stat].type == "percent"){
                    if(polityInfo[stat]){
                        Math.round(polityInfo[stat] = polityInfo[stat] / 100).toFixed(2)
                    }
                }
                
                else if(app.schema[stat].type == "number" || app.schema[stat].type == "currency"){
                    if(polityInfo[stat]){
                        polityInfo[stat] = numeral(polityInfo[stat]).value();
                    }   
                }
                  
            })
        }
    })  
}

function getSchema(){

    $.ajax({
        url: "data/schema.csv"
    })

    .done(function(data){

        parsed = Papa.parse(data,{
            delimiter: "",
            newline:"",
            header: true,
            dynamicTyping: true,
            preview:0
        });

        each(parsed.data, function( key, value ) {
            app.schema[value["stat"]] = value;
            app.actualStatSections.push(value["section"])
        });

        app.actualStatSections = unique(app.actualStatSections);

        app.additionalStatSections = _.difference(app.actualStatSections, app.firstStatSections);

        app.orderedStatSections = app.firstStatSections.concat(app.additionalStatSections);

        gettingSchema.resolve();

    });  
};

function showMap(){

    mapDisplay = new Datamap({

        element: document.getElementById('map'),

        projection: app.settings.mapProjection,

        fills: {
            defaultFill: app.settings.colors.defaultFill
        },

        data: app.content,

        geographyConfig: {
            popupOnHover: false,
            highlightFillColor: app.settings.colors.highlight,
            highlightBorderColor: app.settings.colors.highlightBorder,
            highlightBorderWidth: 1,
            highlightBorderOpacity: 1
        },
        projectionConfig: {
            rotation: [0, 0]
        },
        done: function(datamap) {
            datamap.svg.selectAll('.datamaps-subunit').on('click', function(geography) {
                app.showPolityInfo(geography.id)
            });
        }
});

// Draw a legend for this map
    mapDisplay.legend();

    showingMap.resolve();

};


function scrollUp(element){
//    $(element).scrollTop(0);
    $(element).animate({ scrollTop: 0 }, 00);

}

function enableZoom(){
    var zoom = d3.behavior.zoom()
    .scaleExtent([1, 20])
    .on("zoom", zoomed);
    d3.select(".datamap").call(zoom);    
}

function zoomed() {
  d3.select(".datamaps-subunits").attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
}
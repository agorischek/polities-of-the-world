//App
var app = new Vue({
    el: "#app",
    data: {
        settings: {},
        content: {},
        schema: {},
        stats: [],
        strings: strings,
        polities: [],
        orderedStatSections: [],
        currentPolity: null,
        currentStat: null,
        currentLimit: null,
        currentFilter: "greaterThanOrEqual",
        currentSortDirection: "ascending",
        currentSortField: "name",
        showDebug: false,
        currentView: "map",
        firstStatSections: ["Naming","Demographics","Economy","Infrastructure"],
        actualStatSections: [],
        additionalStatSections: []
    },
    methods:{
        changeSortDirection: function(){
            if(this.currentSortDirection=="ascending"){
                this.setSortDirection("descending")
            }
            else{
                this.setSortDirection("ascending")
            }
        },
        changeSortField: function(){
            if(this.currentSortField=="name"){
                this.setSortField("value")
            }
            else{
                this.setSortField("name")
            }
        },
        setSortField: function(field){
          this.currentSortField = field  
        },
        setSortDirection: function(direction){
          this.currentSortDirection = direction  
        },
        formatStatData: function(value,type){
        
            if(type == "percent"){
                return numeral(value).format('0[.]00%');
            }

            else if(type == "currency"){
                return numeral(value).format('$0,0[.]00');        
            }

            else if(type == "number"){  
                return numeral(value).format('0,0[.]00') 
            }

            else if(type == "polities"){
                if(this.content[value]){
                    return this.content[value].name
                }
                else{
                    return value
                }
            }

            else{
                return value
            }

        },
        politySelect: function(polity){
            this.showPolityInfo(polity);
        },
        statSelect: function(stat){
            this.showStatsInfo(stat);
            this.removeFilter();
        },
        removeFilter: function(){
            this.currentLimit = null;
            this.currentFilter = "greaterThanOrEqual";
        },
        polityBack: function(){
            this.showPolitiesList(); 
        },
        statBack: function(){
            this.showStatsList();
        },
        statSelectWithLimit: function(stat, limit){
            if(this.currentStat == stat){
                this.changeFilter();
            }
            this.showStatsInfo(stat);
            this.applyFilter(limit);
        },
        applyFilter:function(limit){
            this.currentLimit = limit;
        },
        showPolitiesList: function(){
            this.currentPolity = null;
            scrollUp("#middle-left");            
        },
        showStatsList: function(){        
            this.currentStat = null;
            scrollUp("#middle-right");    
        },
        showPolityInfo: function(polity){
            this.currentPolity = polity;
            scrollUp("#middle-left");
        },
        showStatsInfo: function(stat){
            this.currentStat = stat;
            scrollUp("#middle-right");
        },
        hideDebug: function(){
            this.showDebug = false;
        },
        showDebug: function(){
            this.showDebug = true;
        },
        sort: function(order){
            if(order){
                this.currentSort = order
            }
            else{
                this.currentSort = "valueAscending"
            }                
        },
        changeFilter: function(){
            if((app.currentFilterIndex + 1) >= app.currentPossibleFilters.length){
                    app.currentFilter = app.currentPossibleFilters[0];
                }
            else{
                app.currentFilter = app.currentPossibleFilters[(app.currentFilterIndex + 1)]
            }
        },
        filterStatItem: function(polity){
//            If there's no info for the polity, filter it out
            if(!this.currentStatsInfo[polity]){
                return false
            }
//            Otherwise, perform other logic to determine whether it should be shown
            else{
//                If there's no limit, show everything with info
                if(this.currentLimit == null){
                    return true;
                }
//                Else, and if the stat is numeric...
                else if(this.currentStatIsNumeric){
                    if(this.currentFilter=="greaterThanOrEqual" && this.currentStatsInfo[polity] >= this.currentLimit && this.currentLimit){
                        return true;
                    }
                    else if(this.currentFilter=="lessThanOrEqual" && this.currentStatsInfo[polity] <= this.currentLimit && this.currentLimit){
                        return true;
                    }
                    else{
                        return false;
                    }
                }
//                Else, and if the stat is not numeric...
                else{
                    if(this.currentFilter == "equal" && this.currentLimit == this.currentStatsInfo[polity]){
                        return true;
                    }
                    else if (this.currentFilter == "notEqual" && this.currentLimit != this.currentStatsInfo[polity]){
                        return true;
                    }
                    else{
                        return false;
                    }
                }
            }
        }
    },
    watch:{
        currentColors: function(){
            mapDisplay.updateChoropleth(this.currentColors, {reset: true});  
        },
        currentStat: function(){
            if(!this.currentStat){
                this.currentSortField = "name";
                this.currentSortDirection = "ascending";
            }
        }
    },
    computed:{
        currentSort: function(){
            if(this.currentSortField=="name" && this.currentSortDirection=="ascending"){
                return "nameAscending"
            }
            else if(this.currentSortField=="name" && this.currentSortDirection=="descending"){
                return "nameDescending"
            }
            else if(this.currentSortField=="value" && this.currentSortDirection=="ascending"){
                return "valueAscending"
            }
            else if(this.currentSortField=="value" && this.currentSortDirection=="descending"){
                return "valueDescending"
            }
            else{
                return "nameAscending";
            }
        },
        sortedPolities: function(){
            if(!this.currentSortInfo){
                return this.polities
            }
            else{
                var info = [];
                var sortInfo = this.currentSortInfo.slice()
                if (this.currentSort=="valueAscending"){
                    if(this.currentStatIsNumeric){
                        sortInfo.sort(function(a,b){
                            return a[2] - b[2]
                        });
                    }
                    else{
                        sortInfo.sort(function(a, b){
                            return (a[2] === b[2] ? 0 : (a[2] < b[2] ? -1 : 1));
                        });   
                    }
                }
                else if (this.currentSort=="valueDescending"){
                    if(this.currentStatIsNumeric){
                        sortInfo.sort(function(a,b){
                            return b[2] - a[2]
                        });
                    }
                    else{
                        sortInfo.sort(function(a, b){
                            return (a[2] === b[2] ? 0 : (a[2] > b[2] ? -1 : 1));
                        });   
                    }     
                }
                else if (this.currentSort=="nameAscending"){
                    sortInfo.sort(function(a, b){
                        return (a[1] === b[1] ? 0 : (a[1] < b[1] ? -1 : 1));
                    });                }
                else if (this.currentSort=="nameDescending"){
                    sortInfo.sort(function(a, b){
                        return (a[1] === b[1] ? 0 : (a[1] > b[1] ? -1 : 1));
                    });
                }
                else{
                    return this.polities;
                }
                each(sortInfo,function(index,value){
                    info.push(value[0]);
                })
                return info;
            }
            
        },
        currentSortInfo: function(){
            if(!this.currentStat || !this.content){
                return null
            }
            else{
                var info = [];  
                each(this.polities,function(index,value){
                    var name = app.content[value].name;
                    var data = app.content[value][app.currentStat]
                    if(data != ""){
                        info.push([value,name,data]);
                    }
                });
                return info;
             }
        },
        currentStatType: function(){
            if(this.schema[this.currentStat]){
                return this.schema[this.currentStat].type
            }
            else{
                return null;
            }
        },
        currentPolityInfo: function(){
            var info = {}
            if(this.currentPolity){
                info = this.content[this.currentPolity];
            }
            return info;
        },
        currentPolityInfoFormatted: function(){
            var info = {};
            each(this.currentPolityInfo, function(key, value){
                var type = "";
                if(app.schema[key]){
                    type = app.schema[key].type
                }
                info[key] = app.formatStatData(value,type)
            })
            return info;
        },
        currentStatsInfo: function(){
            var info = {}
            if(this.currentStat){
                each(this.polities, function(key, value){
                    info[value] = (app.content[value][app.currentStat])
                })
            }
            return info;
        },
        currentStatsInfoFiltered: function(){
            var info = {}
            each(this.currentStatsInfo, function(polity, value){
                if(app.filterStatItem(polity)){
                    info[polity] = value;
                }
            })
            return info;
        },
        currentStatsInfoFormatted: function(){
            var info = {};
            var type = this.currentStatType
            each(this.currentStatsInfo, function(key, value){
                info[key] = app.formatStatData(value,type)
            })
            return info;
        },
        currentPolityName: function(){
            if(this.currentPolity){
                return this.currentPolityInfo.name;
            }
        },
        currentStatName: function(){
            if(this.schema[this.currentStat]){
                return this.schema[this.currentStat]["title"];
            }
        },
        polityPaneTitle: function(){
            if (!this.currentPolity){
                return this.strings.polityPaneTitle;
            }
            else{
                return this.currentPolityName;
            }
        },
        statsPaneTitle: function(){
            if (!this.currentStat){
                return this.strings.statsPaneTitle;
            }
            else{
                return this.currentStatName;
            }
        },
        currentLimitFormatted: function(){
            if (this.currentLimit == null){
                return null;
            }
            else{
                return app.formatStatData(this.currentLimit, this.currentStatType)
            }
        },
        currentStatIsNumeric: function(){
            if(this.currentStatType == null){
                return null;
            }
            else if(this.currentStatType == "index" || this.currentStatType == "number" || this.currentStatType == "percent" || this.currentStatType == "currency" || this.currentStatType == "rank"){
                return true;
            }
            else if (this.currentStatType == "singleSelect" || this.currentStatType == "verbose" || this.currentStatType == "code" || this.currentStatType == "multipleSelect"){
                return false;
            }
            else{
                return false;
            }
                
        },
        currentPossibleFilters: function(){
            if(!this.currentStat){
                return null
            }
            else if(this.currentStatIsNumeric){
                return ["greaterThanOrEqual","lessThanOrEqual"]
            }
            else if(!this.currentStatIsNumeric){
                return ["equal","notEqual"]
            }
            else{
                return null;
            }
        },
        currentFilterIndex: function(){
            if(!this.currentStat){
                return null;
            }
            else{
                return this.currentPossibleFilters.indexOf(this.currentFilter);
            }
        },
        currentStatArray: function(){
            var array = [] 
            each(this.currentStatsInfo,function(key,value){
                if(value && value != ""){
                    array.push(value)
                }
            });
            return array;
        },
        currentStatMin: function(){
            if(!this.currentStat){
                return null;
            }
            else{
                if(this.schema[this.currentStat].min != null && this.schema[this.currentStat].min != ""){
                    return this.schema[this.currentStat].min
                }
                else{
                    return Math.min.apply(null, this.currentStatArray)
                };
            }
        },
        currentStatMax: function(){
            if(!this.currentStat){
                return null;
            }
            else{
                if(this.schema[this.currentStat].max != null && this.schema[this.currentStat].max != ""){
                    return this.schema[this.currentStat].max
                }
                else{
                    return Math.max.apply(null, this.currentStatArray)
                };
            }
        },
        currentSourceName: function(){
            if(!this.currentStat){
                return null;
            }
            else{
                return this.schema[this.currentStat].sourceName
            }
        },
        currentSourceURL: function(){
            if(!this.currentStat){
                return null;
            }
            else{
                return this.schema[this.currentStat].sourceURL
            }
        },
        filterApplied: function(){
            if(!this.currentStat){
                return null
            }
            else if(this.currentLimit){
                return true
            }
            else{
                return false;
            };
        },
        currentColorScale: function(){
            
            var type = this.currentStatType;
            var min = this.currentStatMin;
            var max = this.currentStatMax;
            
            if(!this.currentStat){
                return null;
            }
            else if(type == "index" || type == "number" || type == "percent" || type == "currency"){
                return d3.scale.linear().domain([min,max]).range([app.settings.colors.light, app.settings.colors.dark]);
            }
            else if(type == "rank"){
                return d3.scale.linear().domain([min,max]).range([app.settings.colors.dark, app.settings.colors.light]);
            }
            else if(type == "singleSelect"){
                return d3.scale.category20b()
            }
            else if(type == "verbose" || type == "code"){
                return function(){
                    return app.settings.colors.medium;
                };
            }
            else if(type == "multipleSelect"){
                return function(){
                    return app.settings.colors.mediumDark;
                };
            }
            else{
                return d3.scale.category20b();
            }
        },
        currentColors: function(){
            if(!this.currentStat){
                return null
            }
            else{
                info = {}
                each(this.currentStatsInfoFiltered, function(polity, value){
                    info[polity] = app.currentColorScale(value)
                })
                return info;            
            }
        }
    }
})
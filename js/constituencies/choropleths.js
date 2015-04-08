;
(function (CONFIG, d3, Handlebars) {

    /**
     * Gets a slugified version of a string
     *
     * @param {string} text
     * @returns {string}
     */
    function slugify(text) {
        return text.toString().toLowerCase()
            .replace(/\s+/g, '-')           // Replace spaces with -
            .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
            .replace(/\-\-+/g, '-')         // Replace multiple - with single -
            .replace(/^-+/, '')             // Trim - from start of text
            .replace(/-+$/, '');            // Trim - from end of text
    }

    /**
     * Map Class
     *
     * Intantiate a new map and data-table instance by passing in a css selector for where to place the map, and a css selector for where to put table results
     *
     * @param {string} mapSelector          Css selector
     * @param {string} tableSelector        Css selector
     * @constructor
     */
    function Map(mapSelector) {

        var parentElement = document.querySelector(mapSelector);
        var e = document.createElement('object');

        e.data = "/img/blank-simplified-map.svg";
        e.type = "image/svg+xml";
        e.width = 594;
        e.height = 806;

        e.addEventListener('load', _.bind(this.onSvgLoaded, this));

        this.element = e;
        //this.tableSelector = tableSelector;
        this.centered = null;
        this.unit = 'wpc';

        this.projection = d3.geo.albers().rotate([0, 0]);
        this.path = d3.geo.path().projection(this.projection);

        parentElement.appendChild(e);
    }

    /**
     * When the SVG is finished loading hook up D3 to the element and load the tpo_wpc.json so we can add click listeners
     * Requests the data from the API and initiates the data-table and maps the results to the SVG
     *
     * @param {Object} e     The 'load' event
     */
    Map.prototype.onSvgLoaded = function onSvgLoaded(e) {

        var svgDocument = e.target.getSVGDocument().documentElement;
        //Hook up D3 to the SVG element
        var svg = d3.select(svgDocument);
        var graphics = svg.select('g');


        
        
        /* Party names and colours */
        var parties = [
            {party:"Conservatives", slug:"conservatives", colour:"#0087DC", 
                colour_scale:["#FFFFFF", "#F8E7C6",  "#CEF190", "#9BED76", "#2DE3AE", "#0087DC"]},
            
            {party:"Green Party", slug:"green-party", colour:"#75A92D",
                colour_scale:["#FFFFFF", "#EDD4CA", "#DCC09B", "#CBBE71", "#ABBA4C", "#75A92D"]},
            
            {party:"Labour", slug:"labour", colour:"#D50000",
                colour_scale:["#FFFFFF", "#fee5d9", "#fcbba1", "#fc9272", "#fb6a4a", "#D50000"]},
            
            {party:"Liberal Democrats", slug:"liberal-democrats", colour:"#FE8300",
                colour_scale:["#FFFFFF", "#B4B5FE", "#87EFFE", "#5AFE83", "#ADFE2D", "#FE8300"]},
            
            {party:"Plaid Cymru", slug:"plaid-cymru", colour:"#3E8424",
                colour_scale:["#FFFFFF", "#E6D0C4", "#CDBB91", "#B2B566", "#799C41", "#3E8424"]},
            
            {party:"Scottish National Party", slug:"scottish-national-party", colour:"#EBC31C",
                colour_scale:["#FFFFFF", "#FBD5CE", "#F7BC9F", "#F3B072", "#EFB346", "#EBC31C"]},
            
            {party:"UK Independence Party", slug:"ukip", colour:"#800080",
                colour_scale:["#FFFFFF", "#E5E5B7", "#7ACC7A", "#47B2B2", "#316BA6", "#800080"]},
        ]
        
        /* Add party rows to table */
        var table = document.querySelector("#party-rows");
        table.innerHTML = Handlebars.compile(document.querySelector('#party-list').innerHTML)({
            parties: parties
        });
        
        /* Add listeners to party rows */
        var my_map = this; // Workaround ... would like to remove
        var table = d3.select('#party-rows')
                    .selectAll("tr")
                    .on("click", function() {
                        my_map.PartyResults(parties, d3.select(this).attr("class"))
                    });                           
        

   
    };
    
    
    /**
     * Add classes on to the constituency paths in the SVG from a given set of constituency results
     *
     * @param {Object[]} constituencies   An array of constituency data from the API
     */
    Map.prototype.PartyResults = function altPartyResults(parties, party_slug) {
        
        var svgDoc = this.element.contentDocument || this.element.getSVGDocument();
        var jfile = '/json/mock_data/' + party_slug + '_mock_data.json';
        //var jfile = '/parties/' + d3.select(this).attr("class") + '/constituencies/results.json';
        
        // Set colour scale
        var colours;
        var range;
        d3.json(jfile, _.bind(function (error, constituencies) {
            
            // Find maximum votes_percentage
            var max_value = 0.0
            _.forEach(constituencies, function (constituency) {     
                if (constituency.votes_percentage > max_value) {
                    max_value = constituency.votes_percentage
                }
            });
            
            // Find party colours
            for (var i=0; i < parties.length; i++) {
                if (party_slug == parties[i]['slug']) {
                    range = parties[i]['colour_scale'];
                }
            }
            
            // Set colour scale
            colours = d3.scale.quantize().domain([0,max_value]).range(range)
            
            var legend_data = [];
            for (var i=range.length-1; i>=0; i--) {
                var r = colours.invertExtent(range[i]);
                if (r[0] == 0) {
                    legend_data.push({'colour': range[i], 'text': "<"+r[1].toFixed(0)+"%"})
                } else {
                    legend_data.push({'colour': range[i], 'text': r[0].toFixed(0)+"-"+r[1].toFixed(0)+"%"})
                }
            }
            legend_data.push({'colour': "#c0c0c0", 'text': "No data"})
            
            var table = document.querySelector("#legend_rows");
            table.innerHTML = Handlebars.compile(document.querySelector('#legend-list').innerHTML)({
                legend_data: legend_data
            });
            
        }));

            
        
        // Add colour to map
        d3.json(jfile, _.bind(function (error, constituencies) {      
            _.forEach(constituencies, function (constituency) {
                var constituencyNode = svgDoc.querySelector('.' + slugify(constituency.constituency_name));
                d3.select(constituencyNode)
                    .data([constituency])
                    .style("fill", function(d) { 
                        if (constituency.votes_percentage==0.0) {
                            return "#c0c0c0"
                        } else {
                            return colours(constituency.votes_percentage); 
                        }
                    })
               
            }); 
        }));
        
        
        
        
    };
    


    
    

    
    
    


    Handlebars.registerHelper('slugify', slugify);
    new Map('#map');

})(VFP_DATA_CONFIG, d3, Handlebars);

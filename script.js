/* global L */

var precDrugData;               // NYPD Precincts Data
var precUseData;                // NYPD Precincts Data
var precDemogData;              // NYPD Precincts Data
var precOtherData;              // NYPD Precincts Data
var precBound;                  // Layer of NYPD precinct boundaries
var setDrugData;                // Global Drug map data
var setUseData;                 // Global Drug Use map data
var setDemogData;               // Global Demographics map data
var setOtherData;               // Global Other Factors map data
var drugProp = 'F_2014';        // Data property for styling drug data
var useProp = 'pct_pop';        // Data property for styling drug use estimate data
var demogProp = 'NHL_W';        // Data property for styling demographics data
var otherProp = 'Tot_311Cmp';   // Data property for styling of other data
var drugLayerVis = false;       // Is drug layer visible
var useLayerVis = false;        // Is estimated drug use layer visible
var otherLayerVis = false;      // Is "other" layer visible
var demogLayerVis = true;       // Is demographics layer visible
var demOnly = true;             // Is demographics layer only visible layer
var dataLayer;                  // Active data layer
var otherDenom = 10000;         // Factor for styling "other" data layer

// Set maximum bounds for map
var southWest = L.latLng(39.588757,-77.783203),
    northEast = L.latLng(42.244785,-69.884033),
    bounds = L.latLngBounds(southWest, northEast);

var map1 = L.map('map1',{maxBounds: bounds, zoomControl: false})
    .setView([40.704066343242495,-73.97859628894267], 10);  // Initialize map


// Create panes in map for stacking different layers
map1.createPane('boundaryLayer');
map1.getPane('boundaryLayer').style.zIndex = 400;
map1.createPane('bottomLayer');
map1.getPane('bottomLayer').style.zIndex = 410;
map1.createPane('middleLayer');
map1.getPane('middleLayer').style.zIndex = 430;
map1.createPane('middleLayer2');
map1.getPane('middleLayer2').style.zIndex = 440;
map1.createPane('topLayer');
map1.getPane('topLayer').style.zIndex = 450;
map1.createPane('labels');
map1.getPane('labels').style.zIndex = 650;

// Add Zoom control at top right of page
L.control.zoom({position: 'topright'}).addTo(map1);

// Add Geocoder control to map
L.Control.geocoder({showResultIcons: true}).addTo(map1);


// Add base layer
L.tileLayer('https://api.mapbox.com/styles/v1/pjarymowycz/cjn2gesen0bgt2ro56jswghrc/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoicGphcnltb3d5Y3oiLCJhIjoiY2ptaWNobmR5MDJoaDN3bzdlcDczOTg5aiJ9.IG2LxEmrr5ojQceO90-HjA', {
  maxZoom: 15,
  minZoom: 9
}).addTo(map1);

// Add floating place labels
L.tileLayer('https://api.mapbox.com/styles/v1/pjarymowycz/cjn2fkllykyv92rrzs90yq1r6/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoicGphcnltb3d5Y3oiLCJhIjoiY2ptaWNobmR5MDJoaDN3bzdlcDczOTg5aiJ9.IG2LxEmrr5ojQceO90-HjA', {
  maxZoom: 15,
  minZoom: 9,
  attribution: '©MapBox, ©OpenStreetMap, ©CartoDB',
  pane: 'labels'
}).addTo(map1);


// Fetch NYPD Precinct polygons
fetch('https://pjarymowycz.github.io/savi780-final-project-temp/data/NYPP_Drugs_QOL_Policing_Data_final.geojson')
  .then(function (response) {
    // Read data as JSON
    return response.json();
  })
  .then(function (data) {
    // Create the Leaflet layer for the data
    // console.log(data);

    // Set global data variables
    setDrugData = data;
    setUseData = data;
    setDemogData = data;
    setOtherData = data;

    // Create Leaflet geoJson layers for map
    precBound = L.geoJson(data, {style: boundaryDataStyle,
        pane: 'boundaryLayer'
    });
    precDrugData = L.geoJson(data, {style: drugDataStyle,
        onEachFeature: onEachFeaturePrec,
        pane: 'bottomLayer'
    });
    precUseData = L.geoJson(data, {style: useDataStyle,
        onEachFeature: onEachFeatureUse,
        pane: 'middleLayer'
    });
    precOtherData = L.geoJson(data, {style: otherDataStyle,
        onEachFeature: onEachFeatureOther,
        pane: 'middleLayer2'
    });
    precDemogData = L.geoJson(data, {style: demogDataStyle,
        onEachFeature: onEachFeatureDemog,
        pane: 'topLayer'
    });

    // Set active data layer
    dataLayer = L.layerGroup([precDemogData]);

    // Add popups to the drug layer
    drugPopup(precDrugData);
    usePopup(precUseData);
    demogPopup(precDemogData);
    otherPopup(precOtherData);

    // Add data to the map
    dataLayer.addTo(map1);
    precBound.addTo(map1);

    // Add legend to map
    visibleLegend.addTo(map1);

    // Move the map view so that the precDrugData is visible
    map1.fitBounds(precDrugData.getBounds());
  });


// Precinct polygon style
var myStyle = {
  weight: 0.5,
};

// Default style for precinct boundaries
var boundaryDataStyle = function(feature) {
  // console.log(fColor);
  return {color: 'dimgray',
          fillColor: 'white',
          weight: 0.5};
};

// Default style for drug crime data
var drugDataStyle = function(feature) {
  var fColor = (feature.properties[drugProp]) / 1000;
  // console.log(fColor * 1000);
  return {color: 'dimgray',
          fillColor: 'red',
          weight: 0.5,
          fillOpacity: (fColor)};
};


// Default style for drug use data
var useDataStyle = function(feature) {
  var fColor = (feature.properties[useProp]) / 15;
  // console.log(fColor);
  return {color: 'dimgray',
          fillColor: 'green',
          weight: 0.5,
          fillOpacity: (1-fColor)};
};

// Default style for other data
var otherDataStyle = function(feature) {
  if (otherProp === 'Tot_311Cmp') {
    otherDenom = 10000;
  } else if (otherProp === 'SQF_2014') {
    otherDenom = 2000;
  } else {
    otherDenom = 30;
  }
  var fColor = (feature.properties[otherProp]) / otherDenom;
  // console.log(fColor * 1000);
  return {color: 'dimgray',
          fillColor: 'blue',
          weight: 0.5,
          fillOpacity: (fColor)};
};

// Default style for racial demographics data
var demogDataStyle = function(feature) {
  var fColor = (feature.properties[demogProp]) / 100;
  // console.log(fColor);

  var fillColorSelect = 'white';
  var fOpacity = 1-fColor;
  if (demOnly === false){
    fillColorSelect = 'white';
    fOpacity = 1-fColor;
  } else {
    fillColorSelect = 'black';
    fOpacity = fColor;
  };

  return {color: 'dimgray',
          fillColor: fillColorSelect,
          weight: 1,
          fillOpacity: fOpacity};
};


// Event functions for NYPD Precincts in drug crime data layer
// Adapted from Leaflet Interactive Choropleth Map Tutorial - https://leafletjs.com/examples/choropleth/
var precReset;

function highlightFeaturePrec(e) {
  // Highlights precinct when triggered
  var layer = e.target;
  layer.setStyle({
    weight: 5,
  });
  if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
    layer.bringToFront();
  }
}

function resetHighlightPrec(e) {
  // Resets style when triggered
  precReset.resetStyle(e.target);
}

function zoomToFeaturePrec(e) {
  // Flies to polygon when triggered
  // console.log(e.latlng);
  map1.flyToBounds(e.target.getBounds(), {maxZoom: 14});
}

var onEachFeaturePrec = function (feature, layer) {
  // When to trigger functions
  // console.log('on feature');
  layer.on({
    mouseover: highlightFeaturePrec,
    mouseout: resetHighlightPrec,
    click: zoomToFeaturePrec
  });
}

// How to reset precinct polygon style
precReset = L.geoJson(precDrugData, {
    style: drugDataStyle,
    onEachFeature: onEachFeaturePrec,
    pane: 'bottomLayer'
}).addTo(map1);


// Event functions for NYPD Precincts in estimated drug use data layer
// Adapted from Leaflet Interactive Choropleth Map Tutorial - https://leafletjs.com/examples/choropleth/
var useReset;

function highlightFeatureUse(e) {
  // Highlights precinct when triggered
  var layer = e.target;
  layer.setStyle({
    weight: 5,
  });
  if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
    layer.bringToFront();
  }
}

function resetHighlightUse(e) {
  // Resets style when triggered
  useReset.resetStyle(e.target);
}

function zoomToFeatureUse(e) {
  // Flies to polygon when triggered
  // console.log(e.latlng);
  map1.flyToBounds(e.target.getBounds(), {maxZoom: 14});
}

var onEachFeatureUse = function (feature, layer) {
  // When to trigger functions
  // console.log('on feature');
  layer.on({
    mouseover: highlightFeatureUse,
    mouseout: resetHighlightUse,
    click: zoomToFeatureUse
  });
}

// How to reset precinct polygon style
useReset = L.geoJson(setUseData, {
    style: useDataStyle,
    onEachFeature: onEachFeatureUse,
    pane: 'middleLayer'
}).addTo(map1);


// Event functions for NYPD Precincts in racial demographics layer
// Adapted from Leaflet Interactive Choropleth Map Tutorial - https://leafletjs.com/examples/choropleth/
var demogReset;

function highlightFeatureDemog(e) {
  // Highlights precinct when triggered
  var layer = e.target;
  layer.setStyle({
    weight: 5,
    color: 'darkgrey',
    fillOpacity: 0
  });
  if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
    layer.bringToFront();
  }
}

function resetHighlightDemog(e) {
  // Resets style when triggered
  demogReset.resetStyle(e.target);
}

function zoomToFeatureDemog(e) {
  // Flies to polygon when triggered
  // console.log(e.latlng);
  map1.flyToBounds(e.target.getBounds(), {maxZoom: 14});
}

var onEachFeatureDemog = function (feature, layer) {
  // When to trigger functions
  // console.log('on feature');
  layer.on({
    mouseover: highlightFeatureDemog,
    mouseout: resetHighlightDemog,
    click: zoomToFeatureDemog
  });
}

// How to reset precinct polygon style
demogReset = L.geoJson(precDemogData, {
    style: demogDataStyle,
    onEachFeature: onEachFeatureDemog,
    pane: 'topLayer'
}).addTo(map1);

// Event functions for NYPD Precincts in other data layer
// Adapted from Leaflet Interactive Choropleth Map Tutorial - https://leafletjs.com/examples/choropleth/
var otherReset;

function highlightFeatureOther(e) {
  // Highlights precinct when triggered
  var layer = e.target;
  layer.setStyle({
    weight: 5,
  });
  if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
    layer.bringToFront();
  }
}

function resetHighlightOther(e) {
  // Resets style when triggered
  otherReset.resetStyle(e.target);
}

function zoomToFeatureOther(e) {
  // Flies to polygon when triggered
  // console.log(e.latlng);
  map1.flyToBounds(e.target.getBounds(), {maxZoom: 14});
}

var onEachFeatureOther = function (feature, layer) {
  // When to trigger functions
  // console.log('on feature');
  layer.on({
    mouseover: highlightFeatureOther,
    mouseout: resetHighlightOther,
    click: zoomToFeatureOther
  });
}

// How to reset precinct polygon style
otherReset = L.geoJson(setOtherData, {
    style: otherDataStyle,
    onEachFeature: onEachFeatureOther,
    pane: 'middleLayer2'
}).addTo(map1);




// The following function queries the legal offense setting and returns the proper map data
var offSelector = document.querySelector('.offSelect');   // Offense selector dropdown

offSelector.addEventListener('change', function(){
  drugProp = offSelector.value + '2014';    // Selected database field name
  // console.log(drugProp);
  precDrugData = L.geoJson(setDrugData, {   // Reset layer with proper data
    style: drugDataStyle,
    onEachFeature: onEachFeaturePrec,
    pane: 'bottomLayer'
  });

  if (drugLayerVis === true){               // Check if layer visible
    // Clear current dataLayer value and replace with drug data layer
    map1.removeLayer(dataLayer);
    dataLayer.clearLayers();
    dataLayer.addLayer(precDrugData);

    if (demogLayerVis === true){            // Check if demographics layer visible
      // Add demographics layer with proper styling to active layers
      precDemogData.eachLayer(function(e){precDemogData.resetStyle(e)});
      dataLayer.addLayer(precDemogData);
    };

    demogPopup(precDemogData);              // Load demographic data popups
    drugPopup(precDrugData);                // Load drug data popups
    map1.addLayer(dataLayer);               // Add active data layers to map
  }
});


// The following function queries the "other factors" setting and returns the proper map data
var otherSelector = document.querySelector('.othrSelect');    // Other Factors selector dropdown

otherSelector.addEventListener('change', function(){
  otherProp = otherSelector.value;          // Selected database field name
  // console.log(otherProp);
  precOtherData = L.geoJson(setOtherData, { // Reset layer with proper data
    style: otherDataStyle,
    onEachFeature: onEachFeatureOther,
    pane: 'middleLayer2'
  });

  if (otherLayerVis === true){              // Check if layer visible
    // Clear current dataLayer value and replace with drug data layer
    map1.removeLayer(dataLayer);
    dataLayer.clearLayers();
    dataLayer.addLayer(precOtherData);

    // Clear current visibleLegend value and replace with "other" data legend
    visibleLegend.remove(map1);
    visibleLegend = legend3;
    visibleLegend.addTo(map1);

    if (demogLayerVis === true){            // Check if demographics layer visible
      // Add demographics layer with proper styling to active layers
      precDemogData.eachLayer(function(e){precDemogData.resetStyle(e)});
      dataLayer.addLayer(precDemogData);
    };

    demogPopup(precDemogData);              // Load demographic data popups
    otherPopup(precOtherData);              // Load other data popups
    map1.addLayer(dataLayer);               // Add active data layers to map
  }
});

// The following function queries the demographic setting and returns the proper map data
var demSelector = document.querySelector('.demSelect');        // Racial demographics dropdown menu

demSelector.addEventListener('change', function(){             // Query racial demographics dropdown menu
  demogProp = demSelector.value;                               // Selected database field name
  map1.removeLayer(precDemogData);                             // Remove layer
  precDemogData = L.geoJson(setDemogData, {                    // Reset layer with proper data
    style: demogDataStyle,
    onEachFeature: onEachFeatureDemog,
    pane: 'topLayer'
    });
  if (demogLayerVis === true){                                 // Check if layer visible
    demogPopup(precDemogData);                                 // Load demographic data popups
    map1.addLayer(precDemogData);                              // Load demographic layer data
  }
});




// The following functions checks the layer visibility checkboxes and radio buttons and adds or remove the desired layers
// Adapted from stackexchange, stackoverflow, and w3schools forum posts and tutorials:
  // https://gis.stackexchange.com/questions/165354/leaflet-layer-visibility-checkbox
  // https://stackoverflow.com/questions/14544104/checkbox-check-event-listener
  // https://www.w3schools.com/howto/howto_js_display_checkbox_text.asp

// Check "Demographics Only" radio button
var precCheck = document.querySelector("input[id=noneSelect]");
precCheck.addEventListener('change', function() {
  // console.log('none checked');
  drugLayerVis = false;
  useLayerVis = false;
  otherLayerVis = false;
  demOnly = true;

  // Clear current dataLayer value and replace with drug data layer
  map1.removeLayer(dataLayer);
  dataLayer.clearLayers();

  // Clear current visibleLegend value and replace with "other" data legend
  visibleLegend.remove(map1);
  visibleLegend = legend4;
  visibleLegend.addTo(map1);

  if (demogLayerVis === true){            // Check if demographics layer visible
    // Add demographics layer with proper styling to active layers
    precDemogData.eachLayer(function(e){precDemogData.resetStyle(e)});
    dataLayer.addLayer(precDemogData);
  };

  // Add active data layers to map
  map1.addLayer(dataLayer);
});

// Check "Drug Offenses" radio button
var drugSelect = document.getElementById("drugSelect");
var precCheck = document.querySelector("input[id=drugs]");
precCheck.addEventListener('change', function() {
  // console.log('drug checked');
  drugLayerVis = true;
  useLayerVis = false;
  otherLayerVis = false;
  demOnly = false;

  // Clear current dataLayer value and replace with drug data layer
  map1.removeLayer(dataLayer);
  dataLayer.clearLayers();
  dataLayer.addLayer(precDrugData);

  // Clear current visibleLegend value and replace with "other" data legend
  visibleLegend.remove(map1);
  visibleLegend = legend1;
  visibleLegend.addTo(map1);

  if (demogLayerVis === true){            // Check if demographics layer visible
    // Add demographics layer with proper styling to active layers
    precDemogData.eachLayer(function(e){precDemogData.resetStyle(e)});
    dataLayer.addLayer(precDemogData);
  };

  // Add active data layers to map
  map1.addLayer(dataLayer);
});

// Check "Estimated Drug Use" radio button
var precCheck = document.querySelector("input[id=drugUse]");
precCheck.addEventListener('change', function() {
  // console.log('use checked');
  drugLayerVis = false;
  useLayerVis = true;
  otherLayerVis = false;
  demOnly = false;

  // Clear current dataLayer value and replace with drug data layer
  map1.removeLayer(dataLayer);
  dataLayer.clearLayers();
  dataLayer.addLayer(precUseData);

  // Clear current visibleLegend value and replace with "other" data legend
  visibleLegend.remove(map1);
  visibleLegend = legend2;
  visibleLegend.addTo(map1);

  if (demogLayerVis === true){            // Check if demographics layer visible
    // Add demographics layer with proper styling to active layers
    precDemogData.eachLayer(function(e){precDemogData.resetStyle(e)});
    dataLayer.addLayer(precDemogData);
  };

  // Add active data layers to map
  map1.addLayer(dataLayer);
});

// Check "Other Factors" radio button
var precCheck = document.querySelector("input[id=otherSelect]");
precCheck.addEventListener('change', function() {
  // console.log('other checked');
  drugLayerVis = false;
  useLayerVis = false;
  otherLayerVis = true;
  demOnly = false;

  // Clear current dataLayer value and replace with drug data layer
  map1.removeLayer(dataLayer);
  dataLayer.clearLayers();
  dataLayer.addLayer(precOtherData);

  // Clear current visibleLegend value and replace with "other" data legend
  visibleLegend.remove(map1);
  visibleLegend = legend3;
  visibleLegend.addTo(map1);

  if (demogLayerVis === true){            // Check if demographics layer visible
    // Add demographics layer with proper styling to active layers
    precDemogData.eachLayer(function(e){precDemogData.resetStyle(e)});
    dataLayer.addLayer(precDemogData);
  };

  // Add active data layers to map
  map1.addLayer(dataLayer);
});



// The following function checks the layer visibility checkbox and adds or removes the Racial Demographics layer
// Adapted from stackexchange, stackoverflow, and w3schools forum posts and tutorials:
  // https://gis.stackexchange.com/questions/165354/leaflet-layer-visibility-checkbox
  // https://stackoverflow.com/questions/14544104/checkbox-check-event-listener
  // https://www.w3schools.com/howto/howto_js_display_checkbox_text.asp
var demogSelect = document.getElementById("demogSelect");
demogSelect.style.display = "block";
var demogCheck = document.querySelector("input[id=demographics]");
demogCheck.addEventListener('change', function() {
  if(this.checked) {
    // Checkbox is checked
    // console.log('checked');
    demogLayerVis = true;
    precDemogData.eachLayer(function(e){precDemogData.resetStyle(e)});
    map1.addLayer(precDemogData);
  } else {
    // Checkbox is not checked
    // console.log('unchecked');
    demogLayerVis = false;
    map1.removeLayer(precDemogData);
  }
});


// Create map legends
// Adapted from Leaflet Choropleth tutorial: https://leafletjs.com/examples/choropleth/
var legend1 = L.control({position: 'bottomleft'});
legend1.onAdd = function (map1) {
  // Create legend for drug crimes layer
  var div = L.DomUtil.create('div', 'legend1');

  div.innerHTML = '<div class="about">Number of Drug Convictions</div>';
  div.innerHTML += '<span><strong> 0 </strong></span>';
  div.innerHTML += '<div class="legendScale1">  </div>';
  div.innerHTML += '<span><strong> >1000 </strong></span>';

  return div;
};

var legend2 = L.control({position: 'bottomleft'});
legend2.onAdd = function (map1) {
  // Create legend for drug use layer
  var div = L.DomUtil.create('div', 'legend2');

  div.innerHTML = '<div class="about">Percent Population Frequent Drug Users</div>';
  div.innerHTML += '<span><strong>0% </strong></span>';
  div.innerHTML += '<div class="legendScale2">  </div>';
  div.innerHTML += '<span><strong> 15% </strong></span>';

  return div;
};

var legend3 = L.control({position: 'bottomleft'});
legend3.onAdd = function (map1) {
  // Create legend for demographic data
  var div = L.DomUtil.create('div', 'legend3');
  var legendText;
  var pctSign;

  if (otherProp === 'Tot_311Cmp') {
    legendText = '311 Noise, Drinking, and Disorderly Complaints';
    pctSign = '';
  } else if (otherProp === 'SQF_2014') {
    legendText = 'Stop, Question, and Frisk Incidents';
    pctSign = '';
  } else {
    legendText = 'Poverty Level';
    pctSign = '%';
  }

  div.innerHTML = '<div class="about">' + legendText + '</div>';
  div.innerHTML += '<span><strong>0' + pctSign + '</strong></span>';
  div.innerHTML += '<div class="legendScale3">  </div>';
  div.innerHTML += '<span><strong>>' + otherDenom + pctSign + '</strong></span>';

  return div;
};

var legend4 = L.control({position: 'bottomleft'});
legend4.onAdd = function (map1) {
  // Create legend for demographic data
  var div = L.DomUtil.create('div', 'legend4');

  div.innerHTML = '<div class="about">Percent Population of Chosen Demographic</div>';
  div.innerHTML += '<span><strong>0% </strong></span>';
  div.innerHTML += '<div class="legendScale4">  </div>';
  div.innerHTML += '<span><strong> 100% </strong></span>';

  return div;
};


function drugPopup (precDrugData) {
    // Add popups to the drug layer
    precDrugData.bindPopup(function (layer) {
      // This function is called whenever a feature on the layer is clicked

      // Uncomment this to see all properties on the clicked feature:
      // console.log(layer.feature.properties);

      return generatePopup(layer);
    });
};

function usePopup (precUseData) {
    // Add popups to the drug use layer
    precUseData.bindPopup(function (layer) {
      // This function is called whenever a feature on the layer is clicked

      // Uncomment this to see all properties on the clicked feature:
      // console.log(layer.feature.properties);

      return generatePopup(layer);
    });
};

function demogPopup (precDemogData) {
    // Add popups to the racial demographics layer
    precDemogData.bindPopup(function (layer) {
      // This function is called whenever a feature on the layer is clicked

      // Uncomment this to see all properties on the clicked feature:
      // console.log(layer.feature.properties);

      return generatePopup(layer);
    });
};

function otherPopup (precOtherData) {
    // Add popups to the "other factors" layer
    precOtherData.bindPopup(function (layer) {
      // This function is called whenever a feature on the layer is clicked

      // Uncomment this to see all properties on the clicked feature:
      // console.log(layer.feature.properties);

      return generatePopup(layer);
    });
};

// The following function generates popups for all layers of the map
function generatePopup(layer) {
  var estUse = layer.feature.properties['prec_pop'] * (layer.feature.properties['pct_pop'] / 100);
  var convictTot = layer.feature.properties['F_2014'] + layer.feature.properties['M_2014'];
  var convict = (convictTot * 100000) / layer.feature.properties['prec_pop'];
  var convictPct = convict / 1000;
  // console.log(convict);

  var estW = convictTot * (layer.feature.properties['NHL_W'] / 100);
  var estBAA = convictTot * (layer.feature.properties['NHL_BAA'] / 100);
  var estHL = convictTot * (layer.feature.properties['HL_Tot'] / 100);
  var estAI = convictTot * (layer.feature.properties['NHL_AI'] / 100);
  var estA = convictTot * (layer.feature.properties['NHL_A'] / 100);
  var estNH = convictTot * (layer.feature.properties['NHL_NH'] / 100);
  var estOthr = convictTot * (layer.feature.properties['NHL_Othr'] / 100);
  var est2X = convictTot * (layer.feature.properties['NHL_2X'] / 100);

  var popText = '<div class="pTitle">Precinct: ' + layer.feature.properties['Precinct'] + '</div>' +
                '<div class="pDiv">' +
                '<div class="pData">Drug Convictions (Year: 2014)</div>' +
                '<div class="pData">- Felony: ' + layer.feature.properties['F_2014'] + '</div>' +
                '<div class="pData">- Misdemeanor: ' + layer.feature.properties['M_2014'] + '</div><br />' +
                '<div class="pData">Precinct Statistics (Year: 2014)</div>' +
                '<div class="pData">- Population: ' + layer.feature.properties['prec_pop'].toFixed(0) + '</div>' +
                '<div class="pData">- Estimated Monthly Drug Users: ' + estUse.toFixed(0) + ' (' + layer.feature.properties['pct_pop'].toFixed(2) + '%)</div>' +
                '<div class="pData">- Drug Convictions per 100,000: ' + convict.toFixed(0) + ' (' + convictPct.toFixed(3) + '%)</div><br />' +
                '<div class="pData">Estimated Convictions by Race/Ethnicity</div>' +
                '<div class="pData">- White alone: ' + estW.toFixed(0) + ' (' + layer.feature.properties['NHL_W'].toFixed(2) + '%)</div>' +
                '<div class="pData">- Black or African American alone: ' + estBAA.toFixed(0) + ' (' + layer.feature.properties['NHL_BAA'].toFixed(2) + '%)</div>' +
                '<div class="pData">- Hispanic or Latino: ' + estHL.toFixed(0) + ' (' + layer.feature.properties['HL_Tot'].toFixed(2) + '%)</div>' +
                '<div class="pData">- American Indian and Alaska Native alone: ' + estAI.toFixed(0) + ' (' + layer.feature.properties['NHL_AI'].toFixed(2) + '%)</div>' +
                '<div class="pData">- Asian alone: ' + estA.toFixed(0) + ' (' + layer.feature.properties['NHL_A'].toFixed(2) + '%)</div>' +
                '<div class="pData">- Native Hawaiian and Other Pacific Islander alone: ' + estNH.toFixed(0) + ' (' + layer.feature.properties['NHL_NH'].toFixed(2) + '%)</div>' +
                '<div class="pData">- Some other race alone: ' + estOthr.toFixed(0) + ' (' + layer.feature.properties['NHL_Othr'].toFixed(2) + '%)</div>' +
                '<div class="pData">- Two or more races: ' + est2X.toFixed(0) + ' (' + layer.feature.properties['NHL_2X'].toFixed(2) + '%)</div><br />' +
                '<div class="pData">Other Factors (Year: 2014)</div>' +
                '<div class="pData">- 311 Noise, Drinking, and Disorderly Complaints: ' + layer.feature.properties['Tot_311Cmp'].toFixed(0) + '</div>' +
                '<div class="pData">- Stop, Question, and Frisk Incidents: ' + layer.feature.properties['SQF_2014'].toFixed(0) + '</div>' +
                '<div class="pData">- Poverty Level: ' + layer.feature.properties['prec_pvty'].toFixed(2) + '%</div><br />' +
                '</div>';
  return popText;
};


// The following button and overlay functions (and associated HTML and CSS code) were adapted from w3schools.com How TO tutorials:
  // Overlay Effect: https://www.w3schools.com/howto/howto_css_overlay.asp
  // Modal Boxes: https://www.w3schools.com/howto/howto_css_modals.asp

// Button to open a page overlay with information about NYC drug use and convictions
var aboutBtn = document.querySelector('#aboutBtn');
aboutBtn.addEventListener('click', function() {
  document.getElementById("aboutOver").style.display = "block";
});

// Button to open a page overlay with information about data sources
var sourcesBtn = document.querySelector('#sourcesBtn');
sourcesBtn.addEventListener('click', function() {
  document.getElementById("sourcesOver").style.display = "block";
});

// Close about overlay
function aboutOverOff() {
  document.getElementById("aboutOver").style.display = "none";
};

// Close sources overlay
function sourcesOverOff() {
  document.getElementById("sourcesOver").style.display = "none";
};

var visibleLegend = legend4;  // Currently visible legend

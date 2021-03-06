Racial Bias in NYC:
Drug Enforcement

Racial bias in policing is well documented in the US, but not always visible. This map compares modeled illicit drug-use rates in NYC with NYPD drug crime conviction data and shows how racial bias clouds the issue.

Use the following map to look-up drug enforcement, drug use, and racial demographic data for NYPD precincts.


About this map:

Although Drug use is relatively equal across all racial demographics, arrests and convictions for drug related felonies and misdemeanors fall disproportionately on black and hispanic populations. The NYPD often claims that the racial disparity in policing, and Quality of Life (Broken Windows) policing in particular, is due to factors other than racial bias. However, these factors are often misleading and cannot fully explain patterns visible in the data, especially in the disparity between drug use and convictions.
This map visually portrays drug enforcement by racial demographics in NYC. It was created from American Community Survey and historic NYPD crime data, as well as census tract and police precinct boundary data from NYC Open Data. All data analysis was performed in QGIS 3.0.2 and Microsoft Excel. Some minor cleanup was performed on the precinct boundary layer due to invalid geometries in the original data.

To create the map, 2014 ACS 5-year population and demographic data was incorporated into NYC census tracts. The tracts were clipped by the police precinct boundaries and merged back into a single layer. A new layer of precinct boundaries with a very small (~0.001in) negative buffer was used to join the police precinct number attribute to the merged clipped census tract layer by location. Area attributes were added to each clipped census tract.

The census tract attribute table was then exported to Excel. Here the original population and demogrphic data was recalculated as precentages of the total census tract population. A pivot table was used to compute the total area of census tract clips in each precinct, and demographic pecentages were normalized by the size of each clipped census tract to the total tract size in each precinct. Expected drug use rates for demographics were calculated based on the 2014 National Survey on Drug Use and Health: Detailed Tables (Table 1.19B). Relevant data was exported as a CSV file and imported into QGIS. Here it was joined to the police precinct boundaries, along with the NYPD historic drug crime data.

Several other datasets were also included based on the NYPD's 2015 report "Broken Windows and Quality-of-Life Policing in New York City". Issues immediately arose with incomplete data availability through open sources. Demographic information was often absent from location-based datasets. 911 data seems generally unavailable without a FOIL request. Location-based (Community District Level) poverty data from the ACS corrected for NYC is disconnected from racial indicators. However, this difficulty obtaining data itself can lead to misleading reports or misinterpretations in policy-making and law-enforcement.

Ultimately, the data used for the "Other Factors" selection can be used to view overall trends throughout NYC, but may not accurately reflect reality when a demographic filter is applied, since this filter assumes equal distribution of the underlying data over all demographics.

311 Complaints data comes from geolocated 311 complaints for noise, drinking, and disorderly youth, as well as open NYPD complaint data related to disorderly conduct (as a substitute for 911 data). This dataset is very heavily skewed towards 311 noise complaints, as there were very few reports for the other datasets, but is included since 311/911 data on Noise, Drinking, and Disorderly Conduct are some of the major indicators for presence presented by the NYPD. These 311 and complaint data points were simply counted within each precinct polygon in QGIS. Stop, Question, and Frisk data was similarly simply counted within each precinct. Poverty data by Community District was obtained through the NYC Mayor's Office for Economic Opportunity website, and was precessed similarly to the population and demographic data to re-cast poverty values by police precinct.

Each individual dataset was joined to a shapefile of NYPD precincts in QGIS. The map was exported as a geoJSON and precinct boundaries were simplified with mapshaper.org for web use.

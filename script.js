//Global variables
   //Fetch recent searches from local storage or create empty array to store a new search
   var recentSearchesArr = JSON.parse(localStorage.getItem("recentSearchesArr")) || [];

   //Define empty object to hold relevant data received from API calls
   var currentCityObj = {};


//Function to generate recent searches table
function recentSearches(){

   //Remove placeholder text
   $("#recentsPlaceholder").remove();

   //Create table
   let recentsList = $("<table>").addClass("table is-hoverable is-fullwidth has-background-grey has-text-white-ter").attr("id", "recentsList").attr("style", "");
   $("#searchCard").append(recentsList);

   let recentsBody = $("<tbody>");
   $("#recentsList").append(recentsBody);

   //Add list items
   for (let i = recentSearchesArr.length - 1; i >= 0; i--){
      let recentCity = recentSearchesArr[i];
      let recentItem = $("<td>").addClass("is-clickable").attr("type", "button").attr("data-value", recentCity).text(recentCity);
      let recentRow = $("<tr>").attr("id", "recentCity").append(recentItem);
      $("tbody").append(recentRow);
   }

   //Show button to clear recent searches from localstorage
   let clearRecent = $("<a>").addClass("button is-rounded is-danger").attr("type", "submit").attr("value", "Clear").attr("id", "clearRecent").text("Clear");
   $("#searchCard").append(clearRecent);

   let resetRecents = $("<div>").addClass("has-text-white-ter").attr("style", "font-style: italic; font-size: small;").attr("id", "recentsPlaceholder").text("No recent searches...");

   $("#clearRecent").click(function(){
      localStorage.clear();
      recentSearchesArr = [];
      $("#recentsList").remove();
      $("#clearRecent").remove();
      $("#searchCard").append(resetRecents);
   });
   
   //Event listener for recent searches
    $("td").click(function(event){
       event.preventDefault();
      let query = $(this).attr("data-value");
      cityDetails(query);
    });

};

//Generate list of recent searches if present
if (recentSearchesArr.length > 0){
   recentSearches();
}

//Event listener for new search
$("#submitSearch").click(function(event){
   
   event.preventDefault();

   //Store input to feed into function
   let searchQuery = $("#searchInput").val().trim();
   recentSearchesArr.push(searchQuery);
   localStorage.setItem("recentSearchesArr", JSON.stringify(recentSearchesArr));

   //Reset search field
   $("#searchInput").val('');

   //Execute cityDetails function for the queried city
   cityDetails(searchQuery);

   //Regenerate recent searches list to show the new query at the top of the list
   $("#recentsList").remove();
   $("#clearRecent").remove();
   recentSearches();
})


//Function to generate current/forecast for the searched city
function cityDetails(query){

   //Clear current city if a search has been made
   $("#cityDetails").empty();

   //Remove placeholder text if present
   $("#cityPlaceholder").remove();


   //API calls

   //Get basic city data
   let basicQueryURL = "https://api.openweathermap.org/data/2.5/weather?q=" + query + "&units=imperial&appid=744b8a1c38782a64532ea34b2848c13f";

   $.ajax({
      url: basicQueryURL,
      method: "GET"
   }).then(function(basicResponse){

      //Store relevant lat/lon data from response to pipe into detailed function
      let cityLat = basicResponse.coord.lat;
      let cityLon = basicResponse.coord.lon;

      //Update currentCityObj with relevant response data
      currentCityObj.city = JSON.stringify(basicResponse.name);

      // Get detailed city data
      let detailedQueryURL = "https://api.openweathermap.org/data/2.5/onecall?lat=" + cityLat + "&lon=" + cityLon + "&units=imperial&exclude=hourly&appid=744b8a1c38782a64532ea34b2848c13f";
         
      $.ajax({
         url: detailedQueryURL,
         method: "GET"
      }).then(function(detailedResponse){

         //Update currentCityObj with relevant response data   
         currentCityObj.date = moment.unix(detailedResponse.current.dt).format("MMMM DD, YYYY");
         currentCityObj.weather = detailedResponse.current.weather[0].icon;
         currentCityObj.weather_desc = detailedResponse.current.weather[0].description;
         currentCityObj.temp = detailedResponse.current.temp +" *F";
         currentCityObj.feels_like = detailedResponse.current.feels_like + " *F";
         currentCityObj.humidity = detailedResponse.current.humidity + "%";
         currentCityObj.wind = detailedResponse.current.wind_speed + " MPH";
         currentCityObj.uvi = detailedResponse.current.uvi; 
         currentCityObj.forecast = [];

         //Loop to create forecast objects and push into forecast array
         for (i = 1; i < 6; i++) {

            let iterationForecast = {
               date: moment.unix(detailedResponse.daily[i].dt).format("MMM DD, YYYY"),
               temp_high: detailedResponse.daily[i].temp.max + " *F",
               temp_low: detailedResponse.daily[i].temp.min +" *F",
               humidity: detailedResponse.daily[i].humidity + "%",
               uvi: detailedResponse.daily[i].uvi,
               icon: detailedResponse.daily[i].weather[0].icon,
               description: detailedResponse.daily[i].weather[0].description
            }

            currentCityObj.forecast.push(iterationForecast);
         }

         
         //Populate current conditions card
         let currentMain = $("<div>").addClass("card").attr("id", "currentCondCard");
         $("#cityDetails").append(currentMain);
         
         let currentCondCont = $("<div>").addClass("card-content has-background-grey").attr("id", "currentConditions");
         $("#currentCondCard").append(currentCondCont);
         
         let cityName = $("<p>").addClass("title pb-3").text("Current conditions for " + JSON.parse(currentCityObj.city) + " on " + currentCityObj.date);

         let iconSrc = "https://openweathermap.org/img/wn/" + currentCityObj.weather + "@2x.png";

         let cityWeather = $("<p>").addClass("pb-3").append("<span class='has-text-white-ter'>" + (currentCityObj.weather_desc).toUpperCase() + "</span><br>").append("<img src=" + iconSrc + ">");

         let cityTemp = $("<p>").addClass("subtitle").text("Temperature: " + currentCityObj.temp + " (Feels like: " + currentCityObj.feels_like + ")");

         let cityHum = $("<p>").addClass("subtitle").text("Humidity: " + currentCityObj.humidity);

         let cityWind = $("<p>").addClass("subtitle").text("Wind Speed: " + currentCityObj.wind);

         let cityUv = $("<p>").addClass("subtitle").text("UV Index: " + currentCityObj.uvi);
         
         $("#currentConditions").append(cityName, cityWeather, cityTemp, cityHum, cityWind, cityUv);
         

         // Populate forecast card
         let forecastLabel = $("<p>").addClass("title mt-6").text("5-day Forecast:");
         $("#cityDetails").append(forecastLabel);

         let forecastContainer = $("<div>").addClass("table-container").attr("id", "forecastMain");
         $("#cityDetails").append(forecastContainer);

         let forecastTable = $("<table>").addClass("table has-background-grey-dark has-text-centered").attr("id", "forecastTable");
         $(".table-container").append(forecastTable);

         let forecastRow = $("<tr>").attr("id", "forecastRow");
         $("#forecastTable").append(forecastRow);

         for (i = 0; i < 5; i++){
            let iterationCell = "day" + i;
            let iterationCard = "card" + i;
            let iterationContent = "content" + i;

            let forecastItem = $("<td>").attr("id", iterationCell).attr("style", "border: none;");
            $("#forecastRow").append(forecastItem);

            let forecastCard = $("<div>").addClass("card has-background-info").attr("id", iterationCard);
            $("#" + iterationCell).append(forecastCard);

            let forecastContent = $("<div>").addClass("card-content").attr("id", iterationContent);
            $("#" + iterationCard).append(forecastContent);

            let iterationDate = $("<p>").addClass("is-size-5 pb-3").text(currentCityObj.forecast[i].date);

            let iterationIcon = $("<img>").addClass("pb-3").attr("src", "https://openweathermap.org/img/wn/" + currentCityObj.forecast[i].icon + "@2x.png")
            
            let iterationDesc = $("<p>").addClass("is-size-6 pb-3").text((currentCityObj.forecast[i].description).toUpperCase());

            let iterationTempHigh = $("<p>").addClass("is-size-7 pb-3").text("High: " + currentCityObj.forecast[i].temp_high);

            let iterationTempLow = $("<p>").addClass("is-size-7 pb-3").text("Low: " + currentCityObj.forecast[i].temp_low);

            let iterationHumidity = $("<p>").addClass("is-size-7 pb-3").text("Humidity: " + currentCityObj.forecast[i].humidity);

            let iterationUVI = $("<p>").addClass("is-size-7").text("UV Index: " + currentCityObj.forecast[i].uvi);

            $("#" + iterationContent).append(iterationDate, iterationIcon, iterationDesc, iterationTempHigh, iterationTempLow, iterationHumidity, iterationUVI);
         };
      });
   });
};
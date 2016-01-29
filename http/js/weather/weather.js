var weather = {
	// Default language is Dutch because that is what the original author used
	lang: config.lang || 'nl',
	params: config.weather.params || null,
	iconTable: {
		'01d':'wi-day-sunny',
		'02d':'wi-day-cloudy',
		'03d':'wi-cloudy',
		'04d':'wi-cloudy-windy',
		'09d':'wi-showers',
		'10d':'wi-rain',
		'11d':'wi-thunderstorm',
		'13d':'wi-snow',
		'50d':'wi-fog',
		'01n':'wi-night-clear',
		'02n':'wi-night-cloudy',
		'03n':'wi-night-cloudy',
		'04n':'wi-night-cloudy',
		'09n':'wi-night-showers',
		'10n':'wi-night-rain',
		'11n':'wi-night-thunderstorm',
		'13n':'wi-night-snow',
		'50n':'wi-night-alt-cloudy-windy'
	},
    indoorConditionsLocation: '.indoorconditions',
	temperatureLocation: '.temp',
	windSunLocation: '.windsun',
	forecastLocation: '.forecast',
	apiVersion: '2.5',
	apiBase: 'http://api.openweathermap.org/data/',
	weatherEndpoint: 'weather',
	forecastEndpoint: 'forecast/daily',
	updateInterval: config.weather.interval || 25000,
	fadeInterval: config.weather.fadeInterval || 1000,
	intervalId: null
}

/**
 * Rounds a float to one decimal place
 * @param  {float} temperature The temperature to be rounded
 * @return {float}             The new floating point value
 */
weather.roundValue = function (temperature) {
	return parseFloat(temperature).toFixed(1);
}

/**
 * Converts the wind speed (km/h) into the values given by the Beaufort Wind Scale
 * @see http://www.spc.noaa.gov/faq/tornado/beaufort.html
 * @param  {int} kmh The wind speed in Kilometers Per Hour
 * @return {int}     The wind speed converted into its corresponding Beaufort number
 */
weather.ms2Beaufort = function(ms) {
	var kmh = ms * 60 * 60 / 1000;
	var speeds = [1, 5, 11, 19, 28, 38, 49, 61, 74, 88, 102, 117, 1000];
	for (var beaufort in speeds) {
		var speed = speeds[beaufort];
		if (speed > kmh) {
			return beaufort;
		}
	}
	return 12;
}

/**
 * Retrieves the indoor temperature and humidity from the DHT22 sensor
 */
weather.updateIndoorConditions = function () {

    var _newTempHtml = '';

    var deviceID = "3c0043000547343337373737";
    var accessToken = "2bd6eb4fc98131d10b82d507507fb59fb80a0bc8";
    var varName = "tempf";

    var requestURL = "https://api.spark.io/v1/devices/" + deviceID + "/" + varName + "/?access_token=" + accessToken;

	$.ajax({
		type: 'GET',
		url: requestURL,
		dataType: 'json',
		success: function (data) {

			var _indoorTemperature = this.roundValue(data.result);

			var _homeIcon = '<i class="fa fa-home xdimmed"></i>';

			_newTempHtml = _homeIcon + ' ' + _indoorTemperature + '&deg;';

		}.bind(this),
		error: function () {

		}
	});

	varName = "humidity";
	requestURL = "https://api.spark.io/v1/devices/" + deviceID + "/" + varName + "/?access_token=" + accessToken;

	$.ajax({
		type: 'GET',
		url: requestURL,
		dataType: 'json',
		success: function (data) {

			var _indoorHumidity = this.roundValue(data.result);

			var _humidityIcon = '<i class="fa fa-tint xdimmed"></i>';

			_newTempHtml = _newTempHtml + ' ' + _humidityIcon + ' ' + _indoorHumidity + '%';

		}.bind(this),
		error: function () {

		}
	});

    $(this.indoorConditionsLocation).updateWithText(_newTempHtml, this.fadeInterval);

}



/**
 * Retrieves the current temperature and weather patter from the OpenWeatherMap API
 */
weather.updateCurrentWeather = function () {

	$.ajax({
		type: 'GET',
		url: weather.apiBase + '/' + weather.apiVersion + '/' + weather.weatherEndpoint,
		dataType: 'json',
		data: weather.params,
		success: function (data) {

			var _temperature = this.roundValue(data.main.temp),
				_temperatureMin = this.roundValue(data.main.temp_min),
				_temperatureMax = this.roundValue(data.main.temp_max),
				_wind = this.roundValue(data.wind.speed),
				_iconClass = this.iconTable[data.weather[0].icon];

			var _icon = '<span class="icon ' + _iconClass + ' dimmed wi"></span>';

			var _newTempHtml = _icon + '' + _temperature + '&deg;';

			$(this.temperatureLocation).updateWithText(_newTempHtml, this.fadeInterval);

			var _now = moment().format('HH:mm'),
				_sunrise = moment(data.sys.sunrise*1000).format('HH:mm'),
				_sunset = moment(data.sys.sunset*1000).format('HH:mm');

			var _newWindHtml = '<span class="wi wi-strong-wind xdimmed"></span> ' + this.ms2Beaufort(_wind),
				_newSunHtml = '<span class="wi wi-sunrise xdimmed"></span> ' + _sunrise;

			if (_sunrise < _now && _sunset > _now) {
				_newSunHtml = '<span class="wi wi-sunset xdimmed"></span> ' + _sunset;
			}

			$(this.windSunLocation).updateWithText(_newWindHtml + ' ' + _newSunHtml, this.fadeInterval);

		}.bind(this),
		error: function () {

		}
	});

}

/**
 * Updates the 5 Day Forecast from the OpenWeatherMap API
 */
weather.updateWeatherForecast = function () {

	$.ajax({
		type: 'GET',
		url: weather.apiBase + '/' + weather.apiVersion + '/' + weather.forecastEndpoint,
		data: weather.params,
		success: function (data) {

			var _opacity = 1,
				_forecastHtml = '';

			_forecastHtml += '<table class="forecast-table">';

			for (var i = 0, count = data.list.length; i < count; i++) {

				var _forecast = data.list[i];

				_forecastHtml += '<tr style="opacity:' + _opacity + '">';

				_forecastHtml += '<td class="day">' + moment(_forecast.dt, 'X').format('ddd') + '</td>';
				_forecastHtml += '<td class="icon-small ' + this.iconTable[_forecast.weather[0].icon] + '"></td>';
				_forecastHtml += '<td class="temp-max">' + this.roundValue(_forecast.temp.max) + '</td>';
				_forecastHtml += '<td class="temp-min">' + this.roundValue(_forecast.temp.min) + '</td>';

				_forecastHtml += '</tr>';

				_opacity -= 0.155;

			}

			_forecastHtml += '</table>';

			$(this.forecastLocation).updateWithText(_forecastHtml, this.fadeInterval);

		}.bind(this),
		error: function () {

		}
	});

}

weather.init = function () {

	if (this.params.lang === undefined) {
		this.params.lang = this.lang;
	}

	if (this.params.cnt === undefined) {
		this.params.cnt = 5;
	}

	this.intervalId = setInterval(function () {
        this.updateIndoorConditions();
		this.updateCurrentWeather();
		this.updateWeatherForecast();
	}.bind(this), this.updateInterval);

}

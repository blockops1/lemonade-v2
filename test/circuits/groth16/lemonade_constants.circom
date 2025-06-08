pragma circom 2.2.2;

// Game configuration
constant CONST_MAX_GAME_DAYS = 7;
constant CONST_INITIAL_BALANCE = 2000;  // 200.00 in 10-cent increments

// Recipe costs (in 10-cent increments)
constant CONST_LEMON_UNIT_COST = 5;     // 0.50 in 10-cent increments
constant CONST_SUGAR_UNIT_COST = 3;     // 0.30 in 10-cent increments
constant CONST_ICE_UNIT_COST = 2;       // 0.20 in 10-cent increments

// Recipe requirements
constant CONST_MIN_LEMONS_RECIPE = 2;
constant CONST_MIN_SUGAR_RECIPE = 1;
constant CONST_MIN_ICE_RECIPE = 3;

// Weather type constants
constant CONST_WEATHER_RAINY = 0;
constant CONST_WEATHER_CLOUDY = 1;
constant CONST_WEATHER_SUNNY = 2;
constant CONST_WEATHER_HOT = 3;
constant CONST_TOTAL_WEATHER_TYPES = 4;

// Advertising type constants
constant CONST_AD_NONE = 0;
constant CONST_AD_FLYERS = 1;
constant CONST_AD_SOCIAL = 2;
constant CONST_AD_RADIO = 3;
constant CONST_TOTAL_AD_TYPES = 4;

// Advertising costs (in 10-cent increments)
constant CONST_COST_AD_FLYERS = 30;     // 3.00 in 10-cent increments
constant CONST_COST_AD_SOCIAL = 80;     // 8.00 in 10-cent increments
constant CONST_COST_AD_RADIO = 150;     // 15.00 in 10-cent increments

// Advertising multipliers
constant CONST_MULT_NO_ADS = 80;
constant CONST_MULT_FLYERS = 120;
constant CONST_MULT_SOCIAL = 180;
constant CONST_MULT_RADIO = 250;

// Array dimensions
constant CONST_STATE_ARRAY_DIM = 4;  // [money, lemons, sugar, ice]
constant CONST_RECIPE_ARRAY_DIM = 3; // [lemonsPerCup, sugarPerCup, icePerCup]
constant CONST_MAX_RECIPE_MULT = 3;  // Maximum multiplier for recipe ingredients 
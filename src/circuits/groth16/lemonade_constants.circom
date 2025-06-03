pragma circom 2.2.2;

// Game configuration
constant CONST_MAX_GAME_DAYS = 7;
constant CONST_INITIAL_BALANCE = 2000;

// Recipe costs
constant CONST_LEMON_UNIT_COST = 5;
constant CONST_SUGAR_UNIT_COST = 3;
constant CONST_ICE_UNIT_COST = 2;

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

// Advertising costs
constant CONST_COST_AD_FLYERS = 300;
constant CONST_COST_AD_SOCIAL = 800;
constant CONST_COST_AD_RADIO = 1500;

// Advertising multipliers
constant CONST_MULT_NO_ADS = 80;
constant CONST_MULT_FLYERS = 120;
constant CONST_MULT_SOCIAL = 180;
constant CONST_MULT_RADIO = 250;

// Array dimensions
constant CONST_STATE_ARRAY_DIM = 4;  // [money, lemons, sugar, ice]
constant CONST_RECIPE_ARRAY_DIM = 3; // [lemonsPerCup, sugarPerCup, icePerCup]
constant CONST_MAX_RECIPE_MULT = 3;  // Maximum multiplier for recipe ingredients 
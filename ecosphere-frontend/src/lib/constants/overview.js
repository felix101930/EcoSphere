// Overview Dashboard Constants

export const TIME_PRESETS = {
    TODAY: 'today',
    YESTERDAY: 'yesterday',
    LAST_7_DAYS: 'last7days',
    DEMO_DAY: 'demoday'
};

export const TIME_PRESET_LABELS = {
    [TIME_PRESETS.TODAY]: 'Today',
    [TIME_PRESETS.YESTERDAY]: 'Yesterday',
    [TIME_PRESETS.LAST_7_DAYS]: 'Last 7 Days',
    [TIME_PRESETS.DEMO_DAY]: 'Demo Day'
};

// Demo date range - all modules have data
export const DEMO_DATE_RANGE = {
    start: '2020-11-01',
    end: '2020-11-08'
};

export const DATA_RANGES = {
    electricity: { start: '2019-02-13', end: '2020-11-08' },
    thermal: { start: '2019-01-01', end: '2020-11-08' },
    rainwater: { start: '2018-10-13', end: '2020-11-08' },
    hotWater: { start: '2018-09-11', end: '2019-11-14' }
};

export const SECTION_COLORS = {
    electricity: {
        consumption: '#DA291C', // SAIT Red
        generation: '#005EB8', // SAIT Blue
        netEnergy: '#9C27B0' // Purple
    },
    water: {
        rainwater: '#005EB8', // SAIT Blue
        hotWater: '#DA291C' // SAIT Red
    },
    thermal: {
        basement: '#2196F3',
        first: '#4CAF50',
        second: '#FF9800'
    }
};

export const FLOOR_LABELS = {
    basement: 'Basement Floor',
    first: 'First Floor',
    second: 'Second Floor'
};

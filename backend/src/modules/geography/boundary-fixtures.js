export const BOUNDARY_FIXTURES = {
    // Country Level
    'ind': {
        id: 'ind',
        name: 'India',
        type: 'COUNTRY',
        lgdCode: 'IND',
        bbox: {
            minLat: 6.0,
            maxLat: 37.5,
            minLng: 68.0,
            maxLng: 97.5,
        },
        coordinates: [
            [
                [68.0, 6.0],
                [97.5, 6.0],
                [97.5, 37.5],
                [68.0, 37.5],
                [68.0, 6.0],
            ],
        ],
    },
    // State Level
    'mh': {
        id: 'mh',
        name: 'Maharashtra',
        type: 'STATE_UT',
        lgdCode: '27',
        parentId: 'ind',
        bbox: {
            minLat: 15.5,
            maxLat: 22.1,
            minLng: 72.5,
            maxLng: 81.0,
        },
        coordinates: [
            [
                [72.5, 15.5],
                [81.0, 15.5],
                [81.0, 22.1],
                [72.5, 22.1],
                [72.5, 15.5],
            ],
        ],
    },
    // District Level
    'mh-pune': {
        id: 'mh-pune',
        name: 'Pune District',
        type: 'DISTRICT',
        lgdCode: '504',
        parentId: 'mh',
        bbox: {
            minLat: 18.0,
            maxLat: 19.3,
            minLng: 73.3,
            maxLng: 75.2,
        },
        coordinates: [
            [
                [73.3, 18.0],
                [75.2, 18.0],
                [75.2, 19.3],
                [73.3, 19.3],
                [73.3, 18.0],
            ],
        ],
    },
    // Municipal Corporation: Pune Municipal Corporation (PMC)
    'mh-pune-pmc': {
        id: 'mh-pune-pmc',
        name: 'Pune Municipal Corporation',
        type: 'LOCAL_BODY',
        lgdCode: '250529',
        parentId: 'mh-pune',
        bbox: {
            minLat: 18.44,
            maxLat: 18.575,
            minLng: 73.78,
            maxLng: 73.96,
        },
        coordinates: [
            [
                [73.78, 18.44],
                [73.96, 18.44],
                [73.96, 18.575],
                [73.78, 18.575],
                [73.78, 18.44],
            ],
        ],
    },
    // Adjacent Municipal Corporation: Pimpri-Chinchwad Municipal Corporation (PCMC)
    // Contiguous with PMC along latitude 18.575
    'mh-pune-pcmc': {
        id: 'mh-pune-pcmc',
        name: 'Pimpri-Chinchwad Municipal Corporation',
        type: 'LOCAL_BODY',
        lgdCode: '250530',
        parentId: 'mh-pune',
        bbox: {
            minLat: 18.575,
            maxLat: 18.68,
            minLng: 73.74,
            maxLng: 73.92,
        },
        coordinates: [
            [
                [73.74, 18.575],
                [73.92, 18.575],
                [73.92, 18.68],
                [73.74, 18.68],
                [73.74, 18.575],
            ],
        ],
    },
    // Ward Level: Aundh-Baner Ward under PMC (Northern ward bordering PCMC along 18.575)
    'mh-pune-pmc-aundh': {
        id: 'mh-pune-pmc-aundh',
        name: 'Aundh-Baner Ward',
        type: 'WARD_VILLAGE',
        lgdCode: 'PMC-08',
        parentId: 'mh-pune-pmc',
        bbox: {
            minLat: 18.535,
            maxLat: 18.575,
            minLng: 73.780,
            maxLng: 73.830,
        },
        coordinates: [
            [
                [73.780, 18.535],
                [73.830, 18.535],
                [73.830, 18.575],
                [73.780, 18.575],
                [73.780, 18.535],
            ],
        ],
    },
    // Ward Level: Kothrud-Bavdhan Ward under PMC (Southern/interior ward)
    'mh-pune-pmc-kothrud': {
        id: 'mh-pune-pmc-kothrud',
        name: 'Kothrud-Bavdhan Ward',
        type: 'WARD_VILLAGE',
        lgdCode: 'PMC-12',
        parentId: 'mh-pune-pmc',
        bbox: {
            minLat: 18.480,
            maxLat: 18.520,
            minLng: 73.780,
            maxLng: 73.835,
        },
        coordinates: [
            [
                [73.780, 18.480],
                [73.835, 18.480],
                [73.835, 18.520],
                [73.780, 18.520],
                [73.780, 18.480],
            ],
        ],
    },
    // Additional Metro Municipalities
    'mh-mumbai-bmc': {
        id: 'mh-mumbai-bmc',
        name: 'Brihanmumbai Municipal Corporation',
        type: 'LOCAL_BODY',
        lgdCode: '250500',
        parentId: 'mh',
        bbox: {
            minLat: 18.89,
            maxLat: 19.28,
            minLng: 72.77,
            maxLng: 72.99,
        },
        coordinates: [
            [
                [72.77, 18.89],
                [72.99, 18.89],
                [72.99, 19.28],
                [72.77, 19.28],
                [72.77, 18.89],
            ],
        ],
    },
    'ka-bengaluru-bbmp': {
        id: 'ka-bengaluru-bbmp',
        name: 'Bruhat Bengaluru Mahanagara Palike',
        type: 'LOCAL_BODY',
        lgdCode: '276400',
        parentId: 'ind',
        bbox: {
            minLat: 12.83,
            maxLat: 13.14,
            minLng: 77.46,
            maxLng: 77.75,
        },
        coordinates: [
            [
                [77.46, 12.83],
                [77.75, 12.83],
                [77.75, 13.14],
                [77.46, 13.14],
                [77.46, 12.83],
            ],
        ],
    },
    'dl-newdelhi-ndmc': {
        id: 'dl-newdelhi-ndmc',
        name: 'New Delhi Municipal Council',
        type: 'LOCAL_BODY',
        lgdCode: '276500',
        parentId: 'ind',
        bbox: {
            minLat: 28.57,
            maxLat: 28.64,
            minLng: 77.18,
            maxLng: 77.24,
        },
        coordinates: [
            [
                [77.18, 28.57],
                [77.24, 28.57],
                [77.24, 28.64],
                [77.18, 28.64],
                [77.18, 28.57],
            ],
        ],
    },
};

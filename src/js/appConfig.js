// General parameters for this app

const APPCONFIG = {
    ROOT_ROTATE: Math.PI/4,
    BAR_COLOUR_CASES : 0x00ff00,
    BAR_COLOUR_DEATHS: 0xdb2c3a,
    BAR_COLOUR_TESTS: 0x0000ff,
    BAR_RADIUS: 1.75,
    BAR_HEIGHT: 5,
    BAR_WIDTH: 0.75,
    BAR_DEPTH: 0.75,
    BAR_SEGMENTS: 16,
    BAR_SCALE_CASES: 300,
    BAR_SCALE_DEATHS: 300,
    BAR_SCALE_TESTS: 4000,
    NUM_BARS_PER_ROW: 31,
    NUM_ATTRIBUTES: 5,
    SPHERE_RADIUS: 1.5,
    POINT_SPACING: 3.5,
    POINT_SCALE: 950,
    POINT_START_X: -150,
    ATTRIBUTE_INC_Z: 7.5,
    NUM_ROWS: 1,
    START_POS_X: -60 * 2.5,
    START_POS_Z: -10,
    GROUND_WIDTH: 1000,
    GROUND_HEIGHT: 1000,
    GROUND_SEGMENTS: 128,
    GROUND_MATERIAL: 0xdddddd,
    TEX_REPEAT: 10,
    BAR_INC_X: 3.5,
    BAR_INC_Z: 20,
    BAR_COLOURS: [
        0xaa0000,
        0x0000aa,
        0x00aa00,
        0xaaaa00,
        0x00aaaa
    ],
    MONTHS: [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"
    ],
    START_MONTH: 4,
    LAST_MONTH: 6,
    LABEL_SCALE: {
        x: 20,
        y: 5,
        z: 1
    },
    LABEL_HEIGHT: 2,
    LABEL_TEXTCOLOUR: "rgba(255, 255, 255, 1.0)",
    LABEL_VALUE_SCALE: {
        x: 2.5,
        y: 1.5,
        z: 1
    },
    LABEL_VALUE_OFFSET: 4,
    LABEL_DATE_SCALE: {
        x: 2.5,
        y: 1.5,
        z: 1
    },
    LABEL_DATE_OFFSET: {
        x: 0,
        y: 0,
        z: 3
    },
    LABEL_Y_POS: 1,
    ATTRIBUTE_LABEL_OFFSET_X: -3,
    LABEL_MONTH_SCALE: {
        x: 5,
        y: 2,
        z: 1
    },
    LABEL_MONTH_OFFSET: {
        x: -7,
        y: -5,
        z: 0
    },
    LABEL_YEAR_OFFSET: {
        x: -15,
        y: 0,
        z: 0
    },
    VALUE_OFFSET: 5,
    VALUE_SCALE: {
        x: 5,
        y: 2,
        z: 1
    },
    RIGHT: 1,
    LEFT: 0,
    UP: 2,
    DOWN: 3,
    ZOOM_SPEED: 0.1,
    attributes: ["Asleep", "Quality sleep", "Awake", "Deep sleep"],
    attributeDisplayNames: ["  Asleep", "  Quality", "  Awake", "  Deep "],
    CAMERA_SCALE_LARGE: 1.3,
    CAMERA_SCALE_SMALL: 2,
    LABEL_ANIMATE_SPEED: 4,
    LABEL_ANIMATE_OFFSET: -3,
    GROUP_ROTATE_SPEED: 3.5,
    GROUP_ROTATE_OFFSET: Math.PI,
    ROTATE_UP: false,
    ROTATE_DOWN: true,
    NUM_COUNTRIES: 4,
    LABELS_PER_COUNTRY: 2,
    UK: 0,
    NATIONS: 1,
    SIDE_MENU_WIDTH: "150px"
};

export { APPCONFIG };

// General parameters to help with setting up scene

const SceneConfig = {
    clearColour: 0xcccccc,
    ambientLightColour: 0x444444,
    pointLightColour: 0xbbbbbb,
    LightPos: {
        x: 150,
        y: 150,
        z: 90
    },
    ShadowWidth: 35,
    ShadowExtra: 35,
    ShadowMapSize: 512,
    CameraPos: {
        x: 0,
        y: 135,
        z: 240
    },
    LookAtPos: {
        x: 2,
        y: 80,
        z: 15
    },
    NEAR_PLANE: 0.1,
    FAR_PLANE: 10000,
    FOV: 45,
    BACKGROUND: 0xcccccc,
    FOG_COLOUR: 0xa0a0a0,
    HEMISPHERE_COLOUR_START: 0x555555,
    HEMISPHERE_COLOUR_END: 0x222222,
    SCREEN_SIZE_LARGE: 768
};

export { SceneConfig };
// General parameters to help with setting up scene

const SceneConfig = {
    clearColour: 0xcccccc,
    ambientLightColour: 0x444444,
    pointLightColour: 0xbbbbbb,
    LightPos: {
        x: 15,
        y: 25,
        z: 35
    },
    ShadowWidth: 35,
    ShadowExtra: 35,
    ShadowMapSize: 512,
    CameraPos: {
        x: 0,
        y: 90,
        z: 190
    },
    LookAtPos: {
        x: 0,
        y: 45,
        z: 15
    },
    NEAR_PLANE: 0.1,
    FAR_PLANE: 10000,
    FOV: 45
};

export { SceneConfig };
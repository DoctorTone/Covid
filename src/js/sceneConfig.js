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
        y: 30,
        z: 70
    },
    LookAtPos: {
        x: 0,
        y: 5,
        z: 0
    },
    NEAR_PLANE: 0.1,
    FAR_PLANE: 10000,
    FOV: 45
};

export { SceneConfig };
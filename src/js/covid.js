import $ from "jquery";
import * as THREE from "three";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry";
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial';
import { Line2 } from 'three/examples/jsm/lines/Line2';

import { BaseApp } from "./baseApp";
import { APPCONFIG } from "./appConfig";
import { SceneConfig } from "./sceneConfig";
import { LabelManager } from "./LabelManager";
import controlkit from "controlkit";
import bootstrap from "bootstrap";

import covidData from "../../data/cases.json";
import covidTests from "../../data/tests.json";

const CASES = 2;
const DEATHS = 3;
const DAILY_TESTS = 2;

class Covid extends BaseApp {
    constructor() {
        super();
        this.barMaterials = [];
        this.attributeMaterials = [];
        this.labelManager = new LabelManager();
        this.cameraRotate = false;
        this.rotSpeed = Math.PI/20;
        this.rotDirection = 1;
        this.zoomingIn = false;
        this.zoomingOut = false;
        this.zoomSpeed = APPCONFIG.ZOOM_SPEED;
        this.animating = false;
        this.groupRotatingDown = false;
        this.groupRotatingUp = false;
        this.groupAnimatingDown = false;
        this.groupAnimatingUp = false;

        //Temp variables
        this.tempVec = new THREE.Vector3();
        this.camRotateLeftRight = new THREE.Vector3(0, 1, 0);
        this.camRotateUpDown = new THREE.Vector3(1, 0, 0);
    }

    setContainer(container) {
        this.container = container;
    }

    init(container) {
        this.container = container;
        super.init(container);
    }

    addGroundPlane() {
        const groundGeom = new THREE.PlaneBufferGeometry(APPCONFIG.GROUND_WIDTH, APPCONFIG.GROUND_HEIGHT);
        const gridTexture = this.textureLoader.load("./images/grid.gif");
        gridTexture.wrapS = gridTexture.wrapT = THREE.RepeatWrapping;
        gridTexture.repeat.set(APPCONFIG.TEX_REPEAT, APPCONFIG.TEX_REPEAT);
        const groundMat = new THREE.MeshPhongMaterial( { color: APPCONFIG.GROUND_MATERIAL, map: gridTexture } );
        const ground = new THREE.Mesh(groundGeom, groundMat);
        ground.rotation.x = -Math.PI/2;
        ground.position.y = 0;
        ground.castShadow = true;
        ground.receiveShadow = true;
        this.root.add(ground);
    }

    createGUI() {

    }

    preProcessData() {
        // Get individual daily totals
        const totalDays = covidData.length;
        let currentDayData = covidData[0];

        // Cases
        const dailyCases = [];
        let previousDailyCases = currentDayData[CASES];
        dailyCases.push(previousDailyCases);

        // Deaths
        const dailyDeaths = [];
        let previousDailyDeaths = currentDayData[DEATHS];
        dailyDeaths.push(previousDailyDeaths);

        for (let i=1; i<totalDays; ++i) {
            currentDayData = covidData[i];
            dailyCases.push(currentDayData[CASES] - previousDailyCases);
            previousDailyCases = currentDayData[CASES];
            dailyDeaths.push(currentDayData[DEATHS] - previousDailyDeaths);
            previousDailyDeaths = currentDayData[DEATHS];
        }

        // Tests
        let currentTestData;
        const dailyTests = [];
        for (let i=0; i<totalDays; ++i) {
            currentTestData = covidTests[i];
            dailyTests.push(currentTestData[DAILY_TESTS]);
        }

        this.dailyCases = dailyCases;
        this.dailyDeaths = dailyDeaths;
        this.dailyTests = dailyTests;
    }

    createScene() {
        // Pre-process data
        this.preProcessData();

        // Init base createsScene
        super.createScene();

        // Create root object.
        this.root = new THREE.Object3D();
        this.addToScene(this.root);

        // Textures
        this.textureLoader = new THREE.TextureLoader();

        // Add ground
        this.addGroundPlane();

        // Labels
        this.labelManager = new LabelManager();
        let labelProperty;
        const labelScale = new THREE.Vector3(12, 6, 1);
        let currentIndex;

        // Top level groups
        const UKGroup = new THREE.Group();
        UKGroup.name = "UKGroup";
        this.root.add(UKGroup);

        const NationalGroup = new THREE.Group();
        NationalGroup.name = "NationalGroup";
        this.root.add(NationalGroup);
        
        const barMaterialCases = new THREE.MeshLambertMaterial( { color: APPCONFIG.BAR_COLOUR_CASES, flatShading: true } );
        const barMaterialDeaths = new THREE.MeshLambertMaterial( { color: APPCONFIG.BAR_COLOUR_DEATHS, flatShading: true} );
        const barMaterialTests = new THREE.MeshLambertMaterial( { color: APPCONFIG.BAR_COLOUR_TESTS, flatShading: true} );
        const barGeom = new THREE.CylinderBufferGeometry(APPCONFIG.BAR_RADIUS, APPCONFIG.BAR_RADIUS, APPCONFIG.BAR_HEIGHT);

        // Create bars
        const numBars = this.dailyCases.length;
        const barsCases = [];
        const barsDeaths = [];
        const barsTests = [];
        let currentBarMesh;
        const FIRST = 0;
        const SECOND = 1;
        const THIRD = 2;

        // Tests
        const testGroup = new THREE.Group();
        testGroup.name = "TestGroup";
        UKGroup.add(testGroup);

        for (let i=0; i<numBars; ++i) {
            currentBarMesh = new THREE.Mesh(barGeom, barMaterialTests);
            currentBarMesh.scale.y = this.dailyTests[i] === 0 ? 0.01 : this.dailyTests[i];
            currentBarMesh.scale.y /= APPCONFIG.BAR_SCALE_TESTS;
            currentBarMesh.position.set(APPCONFIG.START_POS_X + (APPCONFIG.BAR_INC_X * i), currentBarMesh.scale.y * (APPCONFIG.BAR_HEIGHT/2),
                APPCONFIG.START_POS_Z + (APPCONFIG.BAR_INC_Z * FIRST));
            barsTests.push(currentBarMesh);
            testGroup.add(currentBarMesh);
        }
        this.barsTests = barsTests;

        // Labels
        const testLabelGroup = new THREE.Group();
        testLabelGroup.name = "TestGroupLabels";
        UKGroup.add(testLabelGroup);

        const labelTestScale = new THREE.Vector3(10, 6, 1);
        const testLabelIndex = [40, 48, 55, 61, 64, 68, 71];
        for (let i=0, numLabels=testLabelIndex.length; i<numLabels; ++i) {
            labelProperty = {};
            labelProperty.position = new THREE.Vector3();
            currentIndex = testLabelIndex[i];
            labelProperty.position.copy(barsTests[currentIndex].position);
            labelProperty.position.y *= 2;
            labelProperty.position.y += APPCONFIG.LABEL_VALUE_OFFSET;
            labelProperty.scale = labelTestScale;
            labelProperty.textColour = "rgba(0, 0, 0, 1.0)";
            labelProperty.multiLine = false;
            labelProperty.visibility = true;
            const label = this.labelManager.create("Test" + currentIndex, this.dailyTests[currentIndex], labelProperty);
            testLabelGroup.add(label.getSprite());
        }

        // Cases
        const caseGroup = new THREE.Group();
        caseGroup.name = "CaseGroup";
        UKGroup.add(caseGroup);

        for (let i=0; i<numBars; ++i) {
            currentBarMesh = new THREE.Mesh(barGeom, barMaterialCases);
            currentBarMesh.scale.y = this.dailyCases[i] === 0 ? 0.01 : this.dailyCases[i];
            currentBarMesh.scale.y /= APPCONFIG.BAR_SCALE_CASES;
            currentBarMesh.position.set(APPCONFIG.START_POS_X + (APPCONFIG.BAR_INC_X * i), currentBarMesh.scale.y * (APPCONFIG.BAR_HEIGHT/2),
                APPCONFIG.START_POS_Z + (APPCONFIG.BAR_INC_Z * SECOND));
            barsCases.push(currentBarMesh);
            caseGroup.add(currentBarMesh);
        }
        this.barsCases = barsCases;

        // Labels
        const caseLabelGroup = new THREE.Group();
        caseLabelGroup.name = "CaseGroupLabels";
        UKGroup.add(caseLabelGroup);

        const labelCaseScale = new THREE.Vector3(10, 6, 1);
        const caseLabelIndex = [7, 13, 20, 26, 31, 35, 40, 44, 49, 54, 61, 66, 70];
        for (let i=0, numLabels=caseLabelIndex.length; i<numLabels; ++i) {
            labelProperty = {};
            labelProperty.position = new THREE.Vector3();
            currentIndex = caseLabelIndex[i];
            labelProperty.position.copy(barsCases[currentIndex].position);
            labelProperty.position.y *= 2;
            labelProperty.position.y += APPCONFIG.LABEL_VALUE_OFFSET;
            labelProperty.scale = labelCaseScale;
            labelProperty.textColour = "rgba(0, 0, 0, 1.0)";
            labelProperty.multiLine = false;
            labelProperty.visibility = true;
            const label = this.labelManager.create("Case" + currentIndex, this.dailyCases[currentIndex], labelProperty);
            caseLabelGroup.add(label.getSprite());
        }

        // Deaths
        const deathGroup = new THREE.Group();
        deathGroup.name = "DeathGroup";
        UKGroup.add(deathGroup);

        for (let i=0; i<numBars; ++i) {
            currentBarMesh = new THREE.Mesh(barGeom, barMaterialDeaths);
            currentBarMesh.scale.y = this.dailyDeaths[i] === 0 ? 0.01 : this.dailyDeaths[i];
            currentBarMesh.scale.y /= APPCONFIG.BAR_SCALE_DEATHS;
            currentBarMesh.position.set(APPCONFIG.START_POS_X + (APPCONFIG.BAR_INC_X * i), currentBarMesh.scale.y * (APPCONFIG.BAR_HEIGHT/2),
                APPCONFIG.START_POS_Z + (APPCONFIG.BAR_INC_Z * THIRD));
            barsDeaths.push(currentBarMesh);
            deathGroup.add(currentBarMesh);
        }
        this.barsDeaths = barsDeaths;

        // Labels
        const deathLabelGroup = new THREE.Group();
        deathLabelGroup.name = "DeathGroupLabels";
        UKGroup.add(deathLabelGroup);

        const labelDeathScale = new THREE.Vector3(9, 4.5, 1);
        const deathLabelIndex = [15, 20, 26, 31, 34, 37, 40, 44, 48, 51, 54, 58, 65, 70];
        for (let i=0, numLabels=deathLabelIndex.length; i<numLabels; ++i) {
            labelProperty = {};
            labelProperty.position = new THREE.Vector3();
            currentIndex = deathLabelIndex[i];
            labelProperty.position.copy(barsDeaths[currentIndex].position);
            labelProperty.position.y *= 2;
            labelProperty.position.y += APPCONFIG.LABEL_VALUE_OFFSET;
            labelProperty.scale = labelDeathScale;
            labelProperty.textColour = "rgba(0, 0, 0, 1.0)";
            labelProperty.multiLine = false;
            labelProperty.visibility = true;
            const label = this.labelManager.create("Death" + currentIndex, this.dailyDeaths[currentIndex], labelProperty);
            deathLabelGroup.add(label.getSprite());
        }

        // Date Labels
        const labelIndices = [0, 31, 61];
        const labelText = ["March", "April", "May"];

        for (let i=0, numLabels=labelIndices.length; i<numLabels; ++i) {
            labelProperty = {};
            labelProperty.position = new THREE.Vector3();
            currentIndex = labelIndices[i];
            labelProperty.position.copy(barsDeaths[currentIndex].position);
            labelProperty.position.y = 4;
            labelProperty.position.z += 15;
            labelProperty.scale = labelScale;
            labelProperty.textColour = "rgba(0, 0, 0, 1.0)";
            labelProperty.multiLine = false;
            labelProperty.visibility = true;
            const label = this.labelManager.create("Date" + i, labelText[i], labelProperty);
            UKGroup.add(label.getSprite());
        }
    }

    toggleVisibility(groupName) {
        const group = this.getObjectByName(groupName);
        if (group) {
            group.visible = !group.visible;
        }
    }

    createLineGeometries(monthName) {
        // Monthly data
        let currentMonthConfig = MonthlyConfig[monthName];

        // Lines
        const lineColour = new THREE.Color();
        lineColour.setHex(0xdadada);
        let lineColours = [];
        const numPositions = currentMonthConfig.attributeLinePositions[0].length;
        for(let i=0; i<numPositions; ++i) {
            lineColours.push(lineColour.r, lineColour.g, lineColour.b);
        }

        let lineMat = new LineMaterial( {
            color: 0xffffff,
            linewidth: 10,
            vertexColors: THREE.VertexColors,
            dashed: false
        });

        lineMat.resolution.set( window.innerWidth, window.innerHeight );

        const numLineGeometries = currentMonthConfig.attributeLinePositions.length;
        let lineGeom;
        let line;
        const scale = 1;

        for(let i=0; i<numLineGeometries; ++i) {
            lineGeom = new LineGeometry();
            lineGeom.setPositions(currentMonthConfig.attributeLinePositions[i]);
            lineGeom.setColors(lineColours);

            line = new Line2(lineGeom, lineMat);
            line.name = "Attribute" + i + "Trend";
            line.computeLineDistances();
            line.scale.set(scale, scale, scale);
            line.visible = true;
            currentMonthConfig.trendGroups[i].add(line);
        }
    }

    update() {
        let delta = this.clock.getDelta();

        super.update();
    }

    resetView() {
        this.controls.reset();
        this.camera.position.copy(SceneConfig.CameraPos);
        this.controls.target.copy(SceneConfig.LookAtPos);
    }

    toggleShadows() {
        this.directionalLight.castShadow = !this.directionalLight.castShadow;
    }

    scaleGroup(groupName, scale) {
        const testGroup = this.getObjectByName(groupName);
        if (testGroup) {
            testGroup.scale.y = scale;
            this.redrawLabels(groupName, scale);
        }
    }

    toggleView() {
        
    }

    redrawLabels(groupName, scale) {
        // Get all bars
        let currentBar;
        let height;
        let labelName;
        let currentLabel;
        const barsName = groupName.slice(0, groupName.length-5);
        let bars;
        switch (barsName) {
            case "Test":
                bars = this.barsTests;
                break;

            case "Case":
                bars = this.barsCases;
                break;

            case "Death":
                bars = this.barsDeaths;
                break;

            default:
                break;
        }

        for (let i=0, numBars=bars.length; i<numBars; ++i) {
            labelName = barsName + i;
            currentLabel = this.labelManager.getLabel(labelName);
            if (currentLabel) {
                currentBar = bars[i];
                height = currentBar.position.y * 2 * scale;
                currentLabel.setHeight(height + APPCONFIG.LABEL_VALUE_OFFSET);
            }
        }
    }

    openSideMenu() {
        document.getElementById("sideMenu").style.width = "250px";
        document.getElementById("WebGL-Output").style.marginLeft = "250px";
        document.getElementById("sideMenuIcon").style.display = "none";
    }

    closeSideMenu() {
        document.getElementById("sideMenu").style.width = "0px";
        document.getElementById("WebGL-Output").style.marginLeft = "0px";
        document.getElementById("sideMenuIcon").style.display = "block";
    }

    stopNotifications(elemList) {
        for(let i=0, numElems=elemList.length; i<numElems; ++i) {
            $('#' + elemList[i]).contextmenu(() => {
                return false;
            });
        }
    }
}
$(document).ready( () => {

    const container = document.getElementById("WebGL-Output");
    const app = new Covid();
    app.setContainer(container);

    app.init(container);
    app.createScene();

    let currentScale;

    // Elements
    const toggleTests = $("#toggleTests");
    const toggleCases = $("#toggleCases");
    const toggleDeaths = $("#toggleDeaths");
    const scaleTests = $("#scaleTests");
    const scaleCases = $("#scaleCases");
    const scaleDeaths = $("#scaleDeaths");
    const info = $("#info");
    const toggleFade = $("#toggleFade");
    const fadeScreen = $("#fadeScreen");

    toggleTests.on("click", () => {
        app.toggleVisibility("TestGroup");
        app.toggleVisibility("TestGroupLabels");
    });

    toggleCases.on("click", () => {
        app.toggleVisibility("CaseGroup");
        app.toggleVisibility("CaseGroupLabels");
    });

    toggleDeaths.on("click", () => {
        app.toggleVisibility("DeathGroup");
        app.toggleVisibility("DeathGroupLabels");
    });

    scaleTests.on("input", () => {
        currentScale = scaleTests.val();
        app.scaleGroup("TestGroup", currentScale);
    });

    scaleCases.on("input", () => {
        currentScale = scaleCases.val();
        app.scaleGroup("CaseGroup", currentScale);
    });

    scaleDeaths.on("input", () => {
        currentScale = scaleDeaths.val();
        app.scaleGroup("DeathGroup", currentScale);
    });

    toggleFade.on("click", () => {
        toggleFade.hide();
        fadeScreen.removeClass("d-none");
        fadeScreen.fadeTo(1000, 1, () => {
            fadeScreen.fadeTo(1000, 0, () => {
                fadeScreen.addClass("d-none");
                toggleFade.show();
            });
        });
    });

    info.on("click", () => {
        $('#infoModal').modal();
    });

    app.run();
});
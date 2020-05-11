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

        const barMaterialCases = new THREE.MeshLambertMaterial( { color: APPCONFIG.BAR_COLOUR_CASES } );
        const barMaterialDeaths = new THREE.MeshLambertMaterial( { color: APPCONFIG.BAR_COLOUR_DEATHS} );
        const barMaterialTests = new THREE.MeshLambertMaterial( { color: APPCONFIG.BAR_COLOUR_TESTS} );
        const barGeom = new THREE.CylinderBufferGeometry(APPCONFIG.BAR_RADIUS, APPCONFIG.BAR_RADIUS, APPCONFIG.BAR_HEIGHT);

        // Create bars
        const numBars = this.dailyCases.length;
        const barsCases = [];
        const barsDeaths = [];
        const barsTests = [];
        let currentBarMesh;

        for (let i=0; i<numBars; ++i) {
            currentBarMesh = new THREE.Mesh(barGeom, barMaterialCases);
            currentBarMesh.scale.y = this.dailyCases[i] === 0 ? 0.01 : this.dailyCases[i];
            currentBarMesh.scale.y /= APPCONFIG.BAR_SCALE_CASES;
            currentBarMesh.position.set(APPCONFIG.START_POS_X + (APPCONFIG.BAR_INC_X * i), currentBarMesh.scale.y * (APPCONFIG.BAR_HEIGHT/2),
                APPCONFIG.START_POS_Z);
            barsCases.push(currentBarMesh);
            this.root.add(currentBarMesh);
        }

        for (let i=0; i<numBars; ++i) {
            currentBarMesh = new THREE.Mesh(barGeom, barMaterialDeaths);
            currentBarMesh.scale.y = this.dailyDeaths[i] === 0 ? 0.01 : this.dailyDeaths[i];
            currentBarMesh.scale.y /= APPCONFIG.BAR_SCALE_DEATHS;
            currentBarMesh.position.set(APPCONFIG.START_POS_X + (APPCONFIG.BAR_INC_X * i), currentBarMesh.scale.y * (APPCONFIG.BAR_HEIGHT/2),
                APPCONFIG.START_POS_Z + APPCONFIG.BAR_INC_Z);
            barsDeaths.push(currentBarMesh);
            this.root.add(currentBarMesh);
        }

        for (let i=0; i<numBars; ++i) {
            currentBarMesh = new THREE.Mesh(barGeom, barMaterialTests);
            currentBarMesh.scale.y = this.dailyTests[i] === 0 ? 0.01 : this.dailyTests[i];
            currentBarMesh.scale.y /= APPCONFIG.BAR_SCALE_TESTS;
            currentBarMesh.position.set(APPCONFIG.START_POS_X + (APPCONFIG.BAR_INC_X * i), currentBarMesh.scale.y * (APPCONFIG.BAR_HEIGHT/2),
                APPCONFIG.START_POS_Z + (APPCONFIG.BAR_INC_Z * 2));
            barsTests.push(currentBarMesh);
            this.root.add(currentBarMesh);
        }
    }

    createBars() {

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

    redrawScene(lastMonth) {
        // See if next scene is set up
        let currentMonthConfig = MonthlyConfig[this.currentMonthName];

        // Hide previous, show next
        let previousMonthName = APPCONFIG.MONTHS[lastMonth];
        MonthlyConfig[previousMonthName].superGroup.visible = false;
        MonthlyConfig[previousMonthName].labelGroup.visible = false;
        this.showSleepData();

        if (currentMonthConfig.superGroup) {
            //Show this month
            currentMonthConfig.superGroup.visible = true;
            currentMonthConfig.labelGroup.visible = true;
            this.adjustCameraPosition();

            return;
        }

        // Draw next month
        let topGroupName = "SuperGroup" + this.currentMonthName;
        if (this.getObjectByName(topGroupName)) return;

        // Group of groups
        const superGroup = new THREE.Group();
        superGroup.name = "SuperGroup" + this.currentMonthName;
        currentMonthConfig.superGroup = superGroup;
        this.root.add(superGroup);

        const labelGroup = new THREE.Group();
        labelGroup.name = "LabelGroup" + this.currentMonthName;
        currentMonthConfig.labelGroup = labelGroup;
        this.root.add(labelGroup);

        this.createSceneGroups(superGroup, labelGroup);

        this.createBars();

        this.adjustCameraPosition();

        this.createLineGeometries();
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

    app.run();
});
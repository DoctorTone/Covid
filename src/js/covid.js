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
import nationalCaseData from "../../data/nationalCases.json";

const CASES = 2;
const NAT_CASES = 3;
const DEATHS = 3;
const DAILY_TESTS = 2;
const NATION = 1;

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

        // For mouse over
        this.currentViewGroups = [];
        this.casesGroups = [];
        this.currentViewUK = true;
        this.selectedBar = -1;
        this.selectedSphere = -1;

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
        ground.castShadow = false;
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

        // National cases
        const casesEngland = [];
        const casesScotland = [];
        const casesWales = [];
        const casesNIreland = [];
        let currentCase;
        let currentNation;
        for (let i=0, numCases=nationalCaseData.length; i<numCases; ++i) {
            currentCase = nationalCaseData[i];
            if (currentCase.includes("ConfirmedCases")) {
                currentNation = currentCase[NATION];
                switch (currentNation) {
                    case "England":
                        casesEngland.push(currentCase[NAT_CASES]);
                        break;

                    case "Northern Ireland":
                        casesNIreland.push(currentCase[NAT_CASES]);
                        break;

                    case "Scotland":
                        casesScotland.push(currentCase[NAT_CASES]);
                        break;

                    case "Wales":
                        casesWales.push(currentCase[NAT_CASES]);
                        break;

                    default:
                        console.log("No nation specified");
                        break;
                }
            }
        }

        this.casesEngland = casesEngland;
        this.casesNIreland = casesNIreland;
        this.casesScotland = casesScotland;
        this.casesWales = casesWales;
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
        UKGroup.visible = true;
        this.root.add(UKGroup);
        let label;

        // Show label for info
        labelProperty = {};
        labelProperty.position = new THREE.Vector3();
        labelProperty.scale = labelScale;
        labelProperty.textColour = "rgba(255, 255, 255, 1.0)";
        labelProperty.multiLine = false;
        labelProperty.visibility = false;
        this.infoLabel = this.labelManager.create("InfoLabel", "Info", labelProperty);
        UKGroup.add(this.infoLabel.getSprite());

        const NationalGroup = new THREE.Group();
        NationalGroup.name = "NationalGroup";
        NationalGroup.visible = false;
        this.root.add(NationalGroup);
        
        const barMaterialCases = new THREE.MeshLambertMaterial( { color: APPCONFIG.BAR_COLOUR_CASES} );
        const barMaterialDeaths = new THREE.MeshLambertMaterial( { color: APPCONFIG.BAR_COLOUR_DEATHS} );
        const barMaterialTests = new THREE.MeshLambertMaterial( { color: APPCONFIG.BAR_COLOUR_TESTS} );
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
            currentBarMesh = new THREE.Mesh(barGeom, new THREE.MeshLambertMaterial( { color: APPCONFIG.BAR_COLOUR_TESTS} ));
            currentBarMesh.scale.y = this.dailyTests[i] === 0 ? 0.01 : this.dailyTests[i];
            currentBarMesh.scale.y /= APPCONFIG.BAR_SCALE_TESTS;
            currentBarMesh.position.set(APPCONFIG.START_POS_X + (APPCONFIG.BAR_INC_X * i), currentBarMesh.scale.y * (APPCONFIG.BAR_HEIGHT/2),
                APPCONFIG.START_POS_Z + (APPCONFIG.BAR_INC_Z * FIRST));
            currentBarMesh.name = "Tests-" + i;
            currentBarMesh.castShadow = true;
            barsTests.push(currentBarMesh);
            testGroup.add(currentBarMesh);
        }
        this.barsTests = barsTests;

        // Labels
        const testLabelGroup = new THREE.Group();
        testLabelGroup.name = "TestGroupLabels";
        UKGroup.add(testLabelGroup);

        const labelTestScale = new THREE.Vector3(10, 6, 1);
        const testLabelIndex = [40, 48, 55, 61, 64, 68, 71, 76, 78, 80, 89];
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
            currentBarMesh = new THREE.Mesh(barGeom, new THREE.MeshLambertMaterial( { color: APPCONFIG.BAR_COLOUR_CASES} ));
            currentBarMesh.scale.y = this.dailyCases[i] === 0 ? 0.01 : this.dailyCases[i];
            currentBarMesh.scale.y /= APPCONFIG.BAR_SCALE_CASES;
            currentBarMesh.position.set(APPCONFIG.START_POS_X + (APPCONFIG.BAR_INC_X * i), currentBarMesh.scale.y * (APPCONFIG.BAR_HEIGHT/2),
                APPCONFIG.START_POS_Z + (APPCONFIG.BAR_INC_Z * SECOND));
            currentBarMesh.name = "Cases-" + i;
            currentBarMesh.castShadow = true;
            currentBarMesh.receiveShadow = true;
            barsCases.push(currentBarMesh);
            caseGroup.add(currentBarMesh);
        }
        this.barsCases = barsCases;

        // Labels
        const caseLabelGroup = new THREE.Group();
        caseLabelGroup.name = "CaseGroupLabels";
        UKGroup.add(caseLabelGroup);

        const labelCaseScale = new THREE.Vector3(10, 6, 1);
        const caseLabelIndex = [7, 13, 20, 26, 31, 35, 40, 44, 49, 54, 61, 66, 70, 75, 82, 89];
        for (let i=0, numLabels=caseLabelIndex.length; i<numLabels; ++i) {
            labelProperty = {};
            labelProperty.position = new THREE.Vector3();
            currentIndex = caseLabelIndex[i];
            labelProperty.position.copy(barsCases[currentIndex].position);
            labelProperty.position.y *= 2;
            labelProperty.position.y += APPCONFIG.LABEL_VALUE_OFFSET;
            labelProperty.scale = labelCaseScale;
            labelProperty.textColour = "rgba(10, 10, 10, 1.0)";
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
            currentBarMesh = new THREE.Mesh(barGeom, new THREE.MeshLambertMaterial( { color: APPCONFIG.BAR_COLOUR_DEATHS} ));
            currentBarMesh.scale.y = this.dailyDeaths[i] === 0 ? 0.01 : this.dailyDeaths[i];
            currentBarMesh.scale.y /= APPCONFIG.BAR_SCALE_DEATHS;
            currentBarMesh.position.set(APPCONFIG.START_POS_X + (APPCONFIG.BAR_INC_X * i), currentBarMesh.scale.y * (APPCONFIG.BAR_HEIGHT/2),
                APPCONFIG.START_POS_Z + (APPCONFIG.BAR_INC_Z * THIRD));
            currentBarMesh.name = "Deaths-" + i;
            currentBarMesh.castShadow = true;
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
            this.root.add(label.getSprite());
        }

        // National data
        const sphereGeom = new THREE.SphereBufferGeometry(APPCONFIG.SPHERE_RADIUS);
        const sphereMatEngland = new THREE.MeshLambertMaterial( { color: 0xFFA500});
        const sphereMatScotland = new THREE.MeshLambertMaterial( { color: 0x0000ff});
        const sphereMatWales = new THREE.MeshLambertMaterial( { color: 0xff0000});
        const sphereMatNIreland = new THREE.MeshLambertMaterial( { color: 0x00ff00});
        
        // Create spheres
        const pointsEngland = [];
        const pointsScotland = [];
        const pointsWales = [];
        const pointsNIreland = [];

        // Group for each nation
        const EnglandGroup = new THREE.Group();
        EnglandGroup.name = "EnglandGroup";
        NationalGroup.add(EnglandGroup);

        const ScotlandGroup = new THREE.Group();
        ScotlandGroup.name = "ScotlandGroup";
        NationalGroup.add(ScotlandGroup);

        const WalesGroup = new THREE.Group();
        WalesGroup.name = "WalesGroup";
        NationalGroup.add(WalesGroup);

        const NIrelandGroup = new THREE.Group();
        NIrelandGroup.name = "NIrelandGroup";
        NationalGroup.add(NIrelandGroup);

        const heightsEngland = [];
        let point;
        
        // English cases
        for (let i=0, numPoints=this.casesEngland.length; i<numPoints; ++i) {
            point = new THREE.Mesh(sphereGeom, new THREE.MeshLambertMaterial( { color: 0xFFA500}) );
            point.position.set(APPCONFIG.POINT_START_X + (i*APPCONFIG.POINT_SPACING), this.casesEngland[i]/APPCONFIG.POINT_SCALE, 0);
            EnglandGroup.add(point);
            point.name = "England-" + i;
            pointsEngland.push(point);
            heightsEngland.push(point.position.y);
        }

        // English labels
        const halfWay = Math.round(this.casesEngland.length/2);
        const last = this.casesEngland.length-1;
        const numCases = this.casesEngland.length;

        let caseLabelIndices = [halfWay, last];
        currentIndex = halfWay;
        for (let i=0, numPoints=caseLabelIndices.length; i<numPoints; ++i) {
            labelProperty = {};
            labelProperty.position = new THREE.Vector3();
            labelProperty.position.copy(pointsEngland[currentIndex].position);
            labelProperty.position.y += 4;
            labelProperty.scale = labelScale;
            labelProperty.textColour = "rgba(55, 55, 55, 1.0)";
            labelProperty.multiLine = false;
            labelProperty.visibility = true;
            label = this.labelManager.create("CasesEngland" + currentIndex, this.casesEngland[currentIndex], labelProperty);
            EnglandGroup.add(label.getSprite());
            currentIndex = last;
        }
        
        // Scottish cases
        const heightsScotland = [];
        for (let i=0, numPoints=this.casesScotland.length; i<numPoints; ++i) {
            point = new THREE.Mesh(sphereGeom, new THREE.MeshLambertMaterial( { color: 0x0000ff}) );
            point.position.set(APPCONFIG.POINT_START_X + (i*APPCONFIG.POINT_SPACING), this.casesScotland[i]/APPCONFIG.POINT_SCALE, 0);
            ScotlandGroup.add(point);
            point.name = "Scotland-" + i;
            pointsScotland.push(point);
            heightsScotland.push(point.position.y);
        }

        // Scottish labels
        currentIndex = halfWay;
        for (let i=0, numPoints=caseLabelIndices.length; i<numPoints; ++i) {
            labelProperty = {};
            labelProperty.position = new THREE.Vector3();
            currentIndex = caseLabelIndices[i];
            labelProperty.position.copy(pointsScotland[currentIndex].position);
            labelProperty.position.y += 4;
            labelProperty.scale = labelScale;
            labelProperty.textColour = "rgba(55, 55, 55, 1.0)";
            labelProperty.multiLine = false;
            labelProperty.visibility = true;
            label = this.labelManager.create("CasesScotland" + currentIndex, this.casesScotland[currentIndex], labelProperty);
            ScotlandGroup.add(label.getSprite());
            currentIndex = last;
        }

        // Wales cases
        const heightsWales = [];
        for (let i=0, numPoints=this.casesWales.length; i<numPoints; ++i) {
            point = new THREE.Mesh(sphereGeom, new THREE.MeshLambertMaterial( { color: 0xff0000}) );
            point.position.set(APPCONFIG.POINT_START_X + (i*APPCONFIG.POINT_SPACING), this.casesWales[i]/APPCONFIG.POINT_SCALE, 0);
            WalesGroup.add(point);
            point.name = "Wales-" + i;
            pointsWales.push(point);
            heightsWales.push(point.position.y);
        }

        // Wales labels
        currentIndex = halfWay;
        for (let i=0, numPoints=caseLabelIndices.length; i<numPoints; ++i) {
            labelProperty = {};
            labelProperty.position = new THREE.Vector3();
            currentIndex = caseLabelIndices[i];
            labelProperty.position.copy(pointsWales[currentIndex].position);
            labelProperty.position.y += 4;
            labelProperty.scale = labelScale;
            labelProperty.textColour = "rgba(55, 55, 55, 1.0)";
            labelProperty.multiLine = false;
            labelProperty.visibility = true;
            label = this.labelManager.create("CasesWales" + currentIndex, this.casesWales[currentIndex], labelProperty);
            WalesGroup.add(label.getSprite());
            currentIndex = last;
        }

        // NIreland cases
        const heightsNIreland = [];
        for (let i=0, numPoints=this.casesNIreland.length; i<numPoints; ++i) {
            point = new THREE.Mesh(sphereGeom, new THREE.MeshLambertMaterial( { color: 0x00ff00}) );
            point.position.set(APPCONFIG.POINT_START_X + (i*APPCONFIG.POINT_SPACING), this.casesNIreland[i]/APPCONFIG.POINT_SCALE, 0);
            NIrelandGroup.add(point);
            point.name = "NIreland-" + i;
            pointsNIreland.push(point);
            heightsNIreland.push(point.position.y);
        }

        // NIreland labels
        currentIndex = halfWay;
        for (let i=0, numPoints=caseLabelIndices.length; i<numPoints; ++i) {
            labelProperty = {};
            labelProperty.position = new THREE.Vector3();
            currentIndex = caseLabelIndices[i];;
            labelProperty.position.copy(pointsNIreland[currentIndex].position);
            labelProperty.position.y += 4;
            labelProperty.scale = labelScale;
            labelProperty.textColour = "rgba(55, 55, 55, 1.0)";
            labelProperty.multiLine = false;
            labelProperty.visibility = true;
            label = this.labelManager.create("CasesNIreland" + currentIndex, this.casesNIreland[currentIndex], labelProperty);
            NIrelandGroup.add(label.getSprite());
            currentIndex = last;
        }
        
        // Cast shadows on supported devices
        this.directionalLight.castShadow = true;
        if (window.innerWidth < SceneConfig.SCREEN_SIZE_LARGE) {
            this.directionalLight.castShadow = false;
        }

        this.pointsEngland = pointsEngland;
        this.pointsScotland = pointsScotland;
        this.pointsWales = pointsWales;
        this.pointsNIreland = pointsNIreland;
        this.heightsEngland = heightsEngland;
        this.heightsScotland = heightsScotland;
        this.heightsWales = heightsWales;
        this.heightsNIreland = heightsNIreland;

        this.currentViewGroups.push(deathGroup, caseGroup, testGroup);
        this.casesGroups.push(EnglandGroup, ScotlandGroup, WalesGroup, NIrelandGroup);

        this.createRollingAverage(barsCases, caseGroup);
        this.createRollingAverage(barsDeaths, deathGroup);
    }

    toggleVisibility(groupName) {
        const group = this.getObjectByName(groupName);
        if (group) {
            group.visible = !group.visible;
        }
    }

    createRollingAverage(data, group) {
        // Cases
        // Positions
        const positions = [];
        let currentPosition;
        for (let i=0,numPoints=data.length; i<numPoints; ++i) {
            currentPosition = data[i].position;
            positions.push(currentPosition.x, currentPosition.y * 2, currentPosition.z);
        }

        // Rolling average
        const avgStep = 7;
        let currentTotal = 0;
        for (let i=0; i<avgStep; ++i) {
            currentTotal += (data[i].position.y * 2);
        }
        let currentAvg = currentTotal/avgStep;
        const averages = [];

        // Starting point in positions array
        let startPoint = (avgStep - 1) * 3;
        let currentLowerBound = 0;
        let currentUpperBound = 7;
        const startDay = startPoint/3;
        const endDay = positions.length/3;
        for (let i=startDay,numPoints=positions.length; i<(endDay-1); ++i, startPoint+=3) {
            averages.push(positions[startPoint], currentAvg, positions[startPoint + 2] + 2);
            currentTotal -= data[currentLowerBound].position.y * 2;
            ++currentLowerBound;
            currentTotal += data[currentUpperBound].position.y * 2;
            ++currentUpperBound;
            currentAvg = currentTotal/avgStep;
        }

        // Lines
        const lineColour = new THREE.Color();
        lineColour.setHex(0xdadada);
        let lineColours = [];
        const numPositions = averages.length;
        for(let i=0; i<numPositions; ++i) {
            lineColours.push(lineColour.r, lineColour.g, lineColour.b);
        }

        let lineMat = new LineMaterial( {
            color: 0x808080,
            linewidth: 10,
            vertexColors: THREE.VertexColors,
            dashed: true,
            dashScale: 0.5,
            dashSize: 2,
            gapSize: 1
        });

        lineMat.defines.USE_DASH = "";
        lineMat.resolution.set( window.innerWidth, window.innerHeight );

        let lineGeom;
        let line;
        const scale = 1;

        lineGeom = new LineGeometry();
        lineGeom.setPositions(averages);
        lineGeom.setColors(lineColours);

        line = new Line2(lineGeom, lineMat);
        line.name = "Cases";
        line.computeLineDistances();
        line.scale.set(scale, scale, scale);
        line.visible = true;
        //currentMonthConfig.trendGroups[i].add(line);
        group.add(line);
    }

    windowResize(event) {
        super.windowResize(event);

        this.directionalLight.castShadow = true;
        if (window.innerWidth < SceneConfig.SCREEN_SIZE_LARGE) {
            this.directionalLight.castShadow = false;
        }
    }

    update() {
        let delta = this.clock.getDelta();

        super.update();

        if (this.selectedBar >= 0) {
            this.barsCases[this.selectedBar].material.emissive.setHex(0x000000);
            this.barsTests[this.selectedBar].material.emissive.setHex(0x000000);
            this.barsDeaths[this.selectedBar].material.emissive.setHex(0x000000);
        }
        
        if (this.selectedSphere >= 0) {
            this.pointsEngland[this.selectedSphere].material.emissive.setHex(0x000000);
            this.pointsScotland[this.selectedSphere].material.emissive.setHex(0x000000);
            this.pointsWales[this.selectedSphere].material.emissive.setHex(0x000000);
            this.pointsNIreland[this.selectedSphere].material.emissive.setHex(0x000000);
        }

        if(this.hoverObjects.length) {
            let text = this.hoverObjects[0].object.name;
            let index = text.indexOf("-");
            let group = text.substr(0,index);
            let info;
            let number = text.substr(index+1, text.length-1);
            number = parseInt(number, 10);
            if (!isNaN(number)) {
                if (this.currentViewUK) {
                    let bars;
                    switch (group) {
                        case "Cases":
                            bars = this.barsCases;
                            info = this.dailyCases;
                            break;

                        case "Tests":
                            bars = this.barsTests;
                            info = this.dailyTests;
                            break;

                        case "Deaths":
                            bars = this.barsDeaths;
                            info = this.dailyDeaths;
                            break;

                        default:
                            break;
                    }

                    bars[number].material.emissive.setHex(0x808080);
                    this.selectedBar = number;
                } else {
                    let spheres;
                    switch (group) {
                        case "England":
                            spheres = this.pointsEngland;
                            info = this.casesEngland;
                            break;

                        case "Scotland":
                            spheres = this.pointsScotland;
                            info = this.casesScotland;
                            break;

                        case "Wales":
                            spheres = this.pointsWales;
                            info = this.casesWales;
                            break;

                        case "NIreland":
                            spheres = this.pointsNIreland;
                            info = this.casesNIreland;
                            break;

                        default:
                            break;
                    }
                    spheres[number].material.emissive.setHex(0x808080);
                    this.selectedSphere = number;
                }
                // Update info
                let date = covidData[number];
                date = new Date(date[0]);
                date = date.toDateString();
                date = date.substr(0, date.length-5);
                $(".selectionDate").html(date);
                $(".selectionData").html(info[number]);
            }
        }
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

    scaleCases(scale) {
        const pointGroups = [this.pointsEngland, this.pointsScotland, this.pointsWales, this.pointsNIreland];
        const heightGroups = [this.heightsEngland, this.heightsScotland, this.heightsWales, this.heightsNIreland];
        const numPoints = this.pointsEngland.length;

        let height;
        let point;
        let currentHeightGroup;
        let currentPointGroup;
        const halfWay = Math.round(this.casesEngland.length/2);
        const last = this.casesEngland.length - 1;
        const numCases = this.casesEngland.length;
        const labelNames = ["CasesEngland", "CasesScotland", "CasesWales", "CasesNIreland"];
        let currentLabelName;
        let currentLabel;
        let currentIndex;

        for (let i=0, numGroups=pointGroups.length; i<numGroups; ++i) {
            for (let j=0; j<numPoints; ++j) {
                currentHeightGroup = heightGroups[i];
                currentPointGroup = pointGroups[i];
                height = currentHeightGroup[j];
                currentPointGroup[j].position.y = height * scale;
            }
            // Labels
            currentIndex = halfWay;
            for (let j=0; j<APPCONFIG.LABELS_PER_COUNTRY; ++j) {
                currentLabelName = `${labelNames[i]}${currentIndex}`;
                currentLabel = this.labelManager.getLabel(currentLabelName);
                if (currentLabel) {
                    currentLabel.setHeight(currentPointGroup[currentIndex].position.y + 4);
                }
                currentIndex = last;
            }
        }
    }

    toggleView() {
        const UK = this.getObjectByName("UKGroup");
        const Nation = this.getObjectByName("NationalGroup");
        UK.visible = !UK.visible;
        Nation.visible = !Nation.visible;
        this.currentViewUK = !this.currentViewUK;

        // Toggle UI elements
        this.closeSideMenuLeft();
        this.closeSideMenuRight();
        const key = $("#key");
        const keyNational = $("#keyNational");
        const visibility = $("#visibility");
        const visibilityNational = $("#visibilityNational");
        const scales = $("#scales");
        const scalesNational = $("#scalesNational");
        // Side menus
        const leftMenuUK = $("#leftMenuUK");
        const leftMenuNational = $("#leftMenuNational");
        const rightMenuUK = $("#rightMenuUK");
        const rightMenuNational = $("#rightMenuNational");

        if (UK.visible) {
            key.addClass("d-lg-block");
            keyNational.removeClass("d-lg-block");
            visibility.addClass("d-lg-block");
            visibilityNational.removeClass("d-lg-block");
            scales.addClass("d-lg-block");
            scalesNational.removeClass("d-lg-block");
            // Side menu
            leftMenuUK.removeClass("d-none");
            leftMenuNational.addClass("d-none");
            rightMenuUK.removeClass("d-none");
            rightMenuNational.addClass("d-none");
        } else {
            key.removeClass("d-lg-block");
            keyNational.addClass("d-lg-block");
            visibility.removeClass("d-lg-block");
            visibilityNational.addClass("d-lg-block");
            scales.removeClass("d-lg-block");
            scalesNational.addClass("d-lg-block");
            // Side menus
            leftMenuUK.addClass("d-none");
            leftMenuNational.removeClass("d-none");
            rightMenuUK.addClass("d-none");
            rightMenuNational.removeClass("d-none");
        }
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

    openSideMenuLeft() {
        document.getElementById("sideMenuLeft").style.width = APPCONFIG.SIDE_MENU_WIDTH;
        document.getElementById("WebGL-Output").style.marginLeft = APPCONFIG.SIDE_MENU_WIDTH;
        document.getElementById("sideMenuIcon").style.display = "none";
    }

    closeSideMenuLeft() {
        document.getElementById("sideMenuLeft").style.width = "0px";
        document.getElementById("WebGL-Output").style.marginLeft = "0px";
        const elem = document.getElementById("sideMenuIcon");
        if (elem) {
            elem.style.display = "block";
        }
    }

    openSideMenuRight() {
        document.getElementById("sideMenuRight").style.width = APPCONFIG.SIDE_MENU_WIDTH;
        document.getElementById("WebGL-Output").style.marginRight = APPCONFIG.SIDE_MENU_WIDTH;
        document.getElementById("sideMenuIconRight").style.display = "none";
    }

    closeSideMenuRight() {
        document.getElementById("sideMenuRight").style.width = "0px";
        document.getElementById("WebGL-Output").style.marginRight = "0px";
        document.getElementById("sideMenuIconRight").style.display = "block";
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
    const toggleTestsSide = $("#toggleTestsSide");
    const toggleCases = $("#toggleCases");
    const toggleCasesSide = $("#toggleCasesSide");
    const toggleDeaths = $("#toggleDeaths");
    const toggleDeathsSide = $("#toggleDeathsSide");
    const scaleTests = $("#scaleTests");
    const scaleTestsSide = $("#scaleTestsSide");
    const scaleCases = $("#scaleCases");
    const scaleCasesSide = $("#scaleCasesSide");
    const scaleDeaths = $("#scaleDeaths");
    const scaleDeathsSide = $("#scaleDeathsSide");
    const info = $("#info");
    const toggleFade = $(".toggleFade");
    const fadeScreen = $("#fadeScreen");
    const toggleEngland = $("#toggleEngland");
    const toggleEnglandSide = $("#toggleEnglandSide");
    const toggleScotland = $("#toggleScotland");
    const toggleScotlandSide = $("#toggleScotlandSide");
    const toggleWales = $("#toggleWales");
    const toggleWalesSide = $("#toggleWalesSide");
    const toggleNIreland = $("#toggleNIreland");
    const toggleNIrelandSide = $("#toggleNIrelandSide");
    const scaleAll = $("#scaleAll");
    let sideMenuIconLeft = $("#sideMenuIconLeft");
    let closeButtonLeft = $("#closeButtonLeft");
    let sideMenuIconRight = $("#sideMenuIconRight");
    let closeButtonRight = $("#closeButtonRight");

    toggleTests.on("click", () => {
        app.toggleVisibility("TestGroup");
        app.toggleVisibility("TestGroupLabels");
    });

    toggleTestsSide.on("click", () => {
        app.toggleVisibility("TestGroup");
        app.toggleVisibility("TestGroupLabels");
    });

    toggleCases.on("click", () => {
        app.toggleVisibility("CaseGroup");
        app.toggleVisibility("CaseGroupLabels");
    });

    toggleCasesSide.on("click", () => {
        app.toggleVisibility("CaseGroup");
        app.toggleVisibility("CaseGroupLabels");
    });

    toggleDeaths.on("click", () => {
        app.toggleVisibility("DeathGroup");
        app.toggleVisibility("DeathGroupLabels");
    });

    toggleDeathsSide.on("click", () => {
        app.toggleVisibility("DeathGroup");
        app.toggleVisibility("DeathGroupLabels");
    });

    toggleEngland.on("click", () => {
        app.toggleVisibility("EnglandGroup");
    });

    toggleEnglandSide.on("click", () => {
        app.toggleVisibility("EnglandGroup");
    });

    toggleScotland.on("click", () => {
        app.toggleVisibility("ScotlandGroup");
    });

    toggleScotlandSide.on("click", () => {
        app.toggleVisibility("ScotlandGroup");
    });

    toggleWales.on("click", () => {
        app.toggleVisibility("WalesGroup");
    });

    toggleWalesSide.on("click", () => {
        app.toggleVisibility("WalesGroup");
    });

    toggleNIreland.on("click", () => {
        app.toggleVisibility("NIrelandGroup");
    });

    toggleNIrelandSide.on("click", () => {
        app.toggleVisibility("NIrelandGroup");
    });

    scaleTests.on("input", () => {
        currentScale = scaleTests.val();
        app.scaleGroup("TestGroup", currentScale);
    });

    scaleTestsSide.on("input", () => {
        currentScale = scaleTestsSide.val();
        app.scaleGroup("TestGroup", currentScale);
    });

    scaleCases.on("input", () => {
        currentScale = scaleCases.val();
        app.scaleGroup("CaseGroup", currentScale);
    });

    scaleCasesSide.on("input", () => {
        currentScale = scaleCasesSide.val();
        app.scaleGroup("CaseGroup", currentScale);
    });

    scaleDeaths.on("input", () => {
        currentScale = scaleDeaths.val();
        app.scaleGroup("DeathGroup", currentScale);
    });

    scaleDeathsSide.on("input", () => {
        currentScale = scaleDeathsSide.val();
        app.scaleGroup("DeathGroup", currentScale);
    });

    scaleAll.on("input", () => {
        currentScale = scaleAll.val();
        app.scaleCases(currentScale);
    });

    sideMenuIconLeft.on("click", () => {
        app.openSideMenuLeft();
    });

    closeButtonLeft.on("click", () => {
        app.closeSideMenuLeft();
    });

    sideMenuIconRight.on("click", () => {
        app.openSideMenuRight();
    });

    closeButtonRight.on("click", () => {
        app.closeSideMenuRight();
    });

    toggleFade.on("click", () => {
        toggleFade.hide();
        fadeScreen.removeClass("d-none");
        fadeScreen.fadeTo(1000, 1, () => {
            app.toggleView();
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
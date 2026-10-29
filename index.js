class Display {
    static _xBorder = 80;
    static _yBorder = 24;
    static _zBorder = 15;
    static _emptyChar = ' ';
    static _display = Array.from({ length: Display._yBorder + 1 }, () => Array.from({ length: Display._xBorder + 1 }, () => Display.emptyChar));
    static _zDisplay = Array.from({ length: Display._yBorder + 1 }, () => Array.from({ length: Display._xBorder + 1 }, () => Infinity));
    static _meshes = [];
    static _xCam = 0;
    static _yCam = 0;
    static _zCam = 0;
    static _FOV = 90;

    static set xCam(xCam) { this._xCam = xCam }
    static set yCam(yCam) { this._yCam = yCam }
    static set zCam(zCam) { this._zCam = zCam }
    static set FOV(FOV) { this._FOV = FOV }

    static get xBorder() { return this._xBorder; }
    static get yBorder() { return this._yBorder; }
    static get zBorder() { return this._zBorder; }
    static get display() { return this._display; }
    static get zDisplay() { return this._zDisplay; }
    static get emptyChar() { return this._emptyChar; }
    static get meshes() { return this._meshes }
    static get xCam() { return this._xCam }
    static get yCam() { return this._yCam }
    static get zCam() { return this._zCam }
    static get FOV() { return this._FOV }

    static get borders() { return { 'xBorder': this.xBorder, 'yBorder': this.yBorder, 'zBorder': this.zBorder } }

    static get output() {
        let output = ''
        Display.display.forEach(row => output += row.join('') + '\n')
        return output
    }

    static addMesh(mesh) {
        if (!(mesh instanceof Mesh)) return
        Display.meshes.push(mesh)
    }

    static clearDisplay() {
        for (let y = 0; y <= Display.yBorder; y++) {
            for (let x = 0; x <= Display.xBorder; x++) {
                Display._display[y][x] = Display.emptyChar;
                Display._zDisplay[y][x] = Infinity;
            }
        }
    }

    static updateDisplay() {
        console.clear()
        Display.clearDisplay()
        Display.meshes.forEach(mesh => {
            mesh.transformedPoints.forEach(point => {
                let screenX = Math.round(point.x);
                let screenY = Math.round(point.y);

                if (screenX >= 0 && screenX <= Display.xBorder && screenY >= 0 && screenY <= Display.yBorder) {

                    if (Display._zDisplay[screenY][screenX] > point.z) {
                        Display.display[screenY][screenX] = point.symbol
                        Display._zDisplay[screenY][screenX] = point.z
                    }
                }
            })
        })
    }

    static print() { console.log(Display.output) }

}

class Point {
    static _symbols = "$@B%8&WM#ahkbdpqwmZO0QLCJUYXzcvunxrjftilI1~-_+Formats=:,.".split('');

    _x = 0;
    _y = 0;
    _z = 0;

    constructor(x, y, z) {
        this.coords = { x: x, y: y, z: z }
    }

    get x() { return this._x; }
    get y() { return this._y; }
    get z() { return this._z; }

    get symbol() {
        return Point.getSymbol(this.z)
    }

    get coords() { return { x: this.x, y: this.y, z: this.z } }


    set x(x) { this._x = x }
    set y(y) { this._y = y }
    set z(z) { this._z = z }

    set coords({ x, y, z }) {
        this.x = x
        this.y = y
        this.z = z
    }

    static getSymbol(z) {
        let index = Math.floor(z);
        if (index >= Point._symbols.length) index = Point._symbols.length - 1;
        return Point._symbols[index] || '.';
    }
}

class Mesh {
    static _allInstances = []

    _points = []

    constructor(points) {
        points.forEach(point => this.addPoint(point))
    }

    static get points() { return this._points }

    get transformedPoints() {
        let cx = Display.xBorder / 2;
        let cy = Display.yBorder / 2;
        let cz = Display.zBorder / 2;

        let radX = - Display.xCam * Math.PI / 180;
        let radY = - Display.yCam * Math.PI / 180;
        let radZ = - Display.zCam * Math.PI / 180;

        let sX = Math.sin(radX), cX = Math.cos(radX);
        let sY = Math.sin(radY), cY = Math.cos(radY);
        let sZ = Math.sin(radZ), cZ = Math.cos(radZ);

        let fovRad = (Display.FOV * Math.PI) / 180;
        let distance = (Display.xBorder / 2) / Math.tan(fovRad / 2);


        return this._points.map(point => {
            let x = point.x - cx;
            let y = point.y - cy;
            let z = point.z - cz;

            if (Display.xCam !== 0) {
                let currY = y;
                y = currY * cX - z * sX;
                z = currY * sX + z * cX;
            }

            if (Display.yCam !== 0) {
                let currX = x;
                x = currX * cY + z * sY;
                z = -currX * sY + z * cY;
            }

            if (Display.zCam !== 0) {
                let currX = x;
                x = currX * cZ - y * sZ;
                y = currX * sZ + y * cZ;
            }

            let cameraZ = z + distance;

            if (cameraZ <= 0) return { x: -999, y: -999, z: cameraZ, symbol: point.symbol };

            let projectedX = ((x * distance) / cameraZ) * 2.2;
            let projectedY = (y * distance) / cameraZ;
            return {
                x: projectedX + cx,
                y: projectedY + cy,
                z: cameraZ,
                symbol: Point.getSymbol(cameraZ)
            };
        });
    }

    addPoint(point) {
        if (!(point instanceof Point)) return;
        this._points.push(point)
    }

}

// [Вся ваша база классов: Display, Point, Mesh остается без изменений]

const cx = Display.xBorder / 2, cy = Display.yBorder / 2, cz = Display.zBorder / 2;
const sizeX = 8 * 2.2, sizeY = 5, sizeZ = 6;
const cubePoints = [];

function generateLine(x1, y1, z1, x2, y2, z2, steps = 20) {
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        cubePoints.push(new Point(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, z1 + (z2 - z1) * t));
    }
}

const xL = cx - sizeX, xR = cx + sizeX;
const yT = cy - sizeY, yB = cy + sizeY;
const zF = cz - sizeZ, zR = cz + sizeZ;

generateLine(xL, yT, zF, xR, yT, zF); generateLine(xL, yB, zF, xR, yB, zF);
generateLine(xL, yT, zF, xL, yB, zF); generateLine(xR, yT, zF, xR, yB, zF);
generateLine(xL, yT, zR, xR, yT, zR); generateLine(xL, yB, zR, xR, yB, zR);
generateLine(xL, yT, zR, xL, yB, zR); generateLine(xR, yT, zR, xR, yB, zR);
generateLine(xL, yT, zF, xL, yT, zR); generateLine(xR, yT, zF, xR, yT, zR);
generateLine(xL, yB, zF, xL, yB, zR); generateLine(xR, yB, zF, xR, yB, zR);

Display.addMesh(new Mesh(cubePoints));

let angle = 0;
setInterval(() => {
    angle += 3;
    Display.xCam = angle * 0.5;
    Display.yCam = angle;
    Display.updateDisplay();
    Display.print();
}, 60);

// ==========================================
// ГЕНЕРАЦИЯ СФЕРЫ ДЛЯ ТЕСТА
// ==========================================

// const spherePoints = [];
// const radius = 10;
// const cx = Display.xBorder / 2;
// const cy = Display.yBorder / 2;
// const cz = Display.zBorder / 2;

// // Шаг углов (чем меньше, тем плотнее сфера)
// const thetaStep = 12; // от 0 до 180 (вертикаль)
// const phiStep = 6;    // от 0 до 360 (горизонталь)

// for (let theta = 0; theta <= 180; theta += thetaStep) {
//     let radTheta = (theta * Math.PI) / 180;
//     for (let phi = 0; phi < 360; phi += phiStep) {
//         let radPhi = (phi * Math.PI) / 180;

//         // Генерация точек сферы вокруг центра экрана (cx, cy, cz)
//         let x = cx + radius * Math.sin(radTheta) * Math.cos(radPhi);
//         let y = cy + radius * Math.cos(radTheta);
//         let z = cz + radius * Math.sin(radTheta) * Math.sin(radPhi);

//         spherePoints.push(new Point(x, y, z));
//     }
// }

// // Инициализируем и добавляем меш
// const sphereMesh = new Mesh(spherePoints);
// Display.addMesh(sphereMesh);

// // Анимация вращения камеры вокруг сферы
// let angle = 0;
// setInterval(() => {
//     angle += 2;
//     Display.xCam = angle * 0.3; // Наклон камеры
//     Display.yCam = angle;       // Вращение камеры вбок
    
//     Display.updateDisplay();
//     Display.print();
// }, 60);

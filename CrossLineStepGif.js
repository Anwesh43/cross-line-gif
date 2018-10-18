const gifencoder = require('gifencoder')
const Canvas = require('canvas')
const factor = 4
class State {
    constructor() {
        this.scale = 0
        this.dir = 0
        this.prevScale = 0
    }

    update(cb) {
        this.scale += (0.1/factor) * this.dir
        if (Math.abs(this.scale - this.prevScale) > 1) {
            this.scale = this.prevScale + this.dir
            this.dir = 0
            this.prevScale = this.scale
            cb()
        }
    }

    startUpdating(cb) {
        if (this.dir == 0) {
            this.dir = 1 - 2 * this.prevScale
            cb()
        }
    }
}

class CLSNode {
    constructor(i) {
        this.state = new State()
        this.i = i
    }

    addNeighbor() {
        if (this.i < nodes - 1) {
            this.next = new CLSNode(this.i + 1)
            this.next.prev = this
        }
    }

    draw(context : CanvasRenderingContext2D) {
        const gap : number = w / (nodes + 1)
        const size : number = gap / 3
        const sk : number = 1 / factor
        context.lineWidth = Math.min(w, h) / 60
        context.lineCap = 'round'
        context.strokeStyle = '#673AB7'
        context.save()
        context.translate(gap * this.i + gap, h/2)
        for (var j = 0; j < factor; j++) {
            const sc : number = Math.min(sk, Math.max(0, this.state.scale - sk * j)) * factor
            context.save()
            context.rotate(j * Math.PI/2)
            context.beginPath()
            context.moveTo(size * sc, 0)
            context.lineTo(size, 0)
            context.stroke()
            context.restore()
        }
        context.restore()
    }

    update(cb : Function) {
        this.state.update(cb)
    }

    startUpdating(cb : Function) {
        this.state.startUpdating(cb)
    }

    getNext(dir: number, cb : Function) : CLSNode {
        var curr : CLSNode = this.prev
        if (dir == 1) {
            curr = this.next
        }
        if (curr) {
            return curr
        }
        cb()
        return this
    }
}

class CrossLineStep {
    constructor() {
        this.root = new CLSNode(0)
        this.curr = this.root
        this.dir = 1
        this.curr.startUpdating()
    }

    draw(context : CanvasRenderingContext2D) {
        this.root.draw(context)
    }

    update(cb : Function) {
        this.curr.update(() => {
            this.curr = this.curr.getNext(this.dir, () => {
                this.dir *= -1
            })
            if (this.curr.i == 0 && this.dir == 1) {
                cb()
            } else {
                this.curr.startUpdating()
            }
        })
    }
}

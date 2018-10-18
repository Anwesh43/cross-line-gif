const gifencoder = require('gifencoder')
const Canvas = require('canvas')
const factor = 4, w = 500, h = 500
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

    draw(context) {
        const gap = w / (nodes + 1)
        const size = gap / 3
        const sk = 1 / factor
        context.lineWidth = Math.min(w, h) / 60
        context.lineCap = 'round'
        context.strokeStyle = '#673AB7'
        context.save()
        context.translate(gap * this.i + gap, h/2)
        for (var j = 0; j < factor; j++) {
            const sc = Math.min(sk, Math.max(0, this.state.scale - sk * j)) * factor
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

    update(cb) {
        this.state.update(cb)
    }

    startUpdating(cb) {
        this.state.startUpdating(cb)
    }

    getNext(dir: number, cb) {
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

    draw(context) {
        this.root.draw(context)
    }

    update(cb) {
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

class Renderer {
    constructor() {
        this.running = true
        this.cls = new CrossLineStep()
    }

    render(context, cb, endcb) {
        while(this.running) {
            context.fillStyle = '#BDBDBD'
            context.fillRect(0, 0, w, h)
            this.cls.draw(context)
            cb(context)
            this.cls.update(() => {
                endcb()
            })
        }
    }
}

class CrossLineStepGif {
    constructor() {
        this.canvas = new Canvas(w, h)
        this.encoder = new GifEncoder(w, h)
        this.context = this.canvas.getContext('2d')
        this.renderer = new Renderer()
        this.initEncoder()
    }

    initEncoder() {
        this.encoder.setRepeat(0)
        this.encoder.setDelay(50)
        this.encoder.setQuality(100)
    }

    create(fn) {
        this.encoder.createReadStream().pipe(require('fs').createWriteStream(fn))
        this.encoder.start()
        this.renderer.render(this.context, (ctx) => {
            this.encoder.addFrame(ctx)
        }, () => {
            this.encoder.end()
        })
    }

    static init(fn) {
        const gif = new CrossLineStepGif()
        gif.create(fn)
    }
}
